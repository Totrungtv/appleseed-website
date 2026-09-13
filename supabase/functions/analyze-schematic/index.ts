import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let refundOnError: (() => Promise<void>) | null = null;

  try {
    const body = await req.json();
    const {
      analysis_id,
      file_path,
      device_model,
      board_code,
      notes,
      mime_type,
      schematic_area,
      action = "ai_analysis",
    } = body;

    if (!analysis_id || !file_path) return json({ error: "Thiếu analysis_id hoặc file_path" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const userAuthorization = req.headers.get("Authorization") || "";

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Thiếu Supabase environment variables" }, 500);
    if (!GEMINI_API_KEY) return json({ error: "Chưa có secret GEMINI_API_KEY trong Edge Function Secrets" }, 500);
    if (!userAuthorization) return json({ error: "Vui lòng đăng nhập để sử dụng AI." }, 401);
    if (!["ai_analysis", "schematic_analysis"].includes(String(action))) {
      return json({ error: "Loại phân tích không hợp lệ." }, 400);
    }

    const callRpc = async (rpcName: string, payload: Record<string, unknown>, authorization: string) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpcName}`, {
        method: "POST",
        headers: {
          Authorization: authorization,
          apikey: SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || data?.error || `RPC ${rpcName} failed`);
      return data;
    };

    const charge = await callRpc(
      "apple_seed_reserve_ai_board_action",
      { p_analysis_id: analysis_id, p_action: String(action) },
      userAuthorization,
    );

    if (!charge?.ok) {
      return json({
        error: charge?.message || "Không thể trừ Coin.",
        code: charge?.code || "COIN_CHARGE_FAILED",
        cost: charge?.cost,
        balance: charge?.balance,
      }, charge?.code === "INSUFFICIENT_COINS" ? 402 : 400);
    }

    refundOnError = async () => {
      try {
        await callRpc(
          "apple_seed_refund_ai_board_charge",
          { p_analysis_id: analysis_id },
          `Bearer ${SERVICE_ROLE_KEY}`,
        );
      } catch (refundError) {
        console.error("AI Coin refund failed:", refundError);
      }
    };

    const storageUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/ai-schematics/${file_path}`;
    const fileResponse = await fetch(storageUrl, {
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    });
    if (!fileResponse.ok) {
      const errText = await fileResponse.text();
      throw new Error("Không đọc được ảnh schematic từ Storage: " + errText);
    }

    const imageBytes = new Uint8Array(await fileResponse.arrayBuffer());
    if (imageBytes.byteLength > 19 * 1024 * 1024) {
      throw new Error("Ảnh quá lớn. Hãy dùng ảnh dưới 19 MB để phân tích AI.");
    }

    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < imageBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...imageBytes.subarray(i, Math.min(i + chunkSize, imageBytes.length)));
    }
    const imageBase64 = btoa(binary);
    const imageMime = mime_type || fileResponse.headers.get("content-type") || "image/jpeg";

    const prompt = `Bạn là AI hỗ trợ kỹ thuật viên Apple Seed sửa mainboard iPhone ở cấp board-level.

MỤC TIÊU: phân tích ảnh schematic/boardview theo dữ liệu thực tế của kỹ thuật viên. Không được đoán theo một case mẫu có sẵn.

THÔNG TIN CASE
Model: ${device_model || "Không rõ"}
Board code: ${board_code || "Không rõ"}
Vùng/linh kiện kỹ thuật viên đang hỏi: ${schematic_area || "Không chỉ định"}
Loại phân tích: ${action}

DỮ LIỆU ĐO/PAN:
${notes || "Không có"}

QUY TẮC BẮT BUỘC
1. Ưu tiên dữ liệu PAN, boot-current, điện áp, diode/resistance và hiện tượng thực tế hơn mọi nhãn gợi ý trên giao diện.
2. Nếu ảnh chỉ là boardview/layout tổng thể, KHÔNG được khẳng định một IC cụ thể là nguyên nhân chỉ vì nhận ra tên hoặc chức năng của IC.
3. Nếu người dùng nghi "chạm sau", hãy tập trung vào các nguồn/tải có khả năng được kích hoạt sau trong power sequence và đề xuất vài điểm đo có giá trị chẩn đoán cao. Không yêu cầu đo toàn bộ main.
4. Phân biệt rõ: "nhìn thấy trên schematic" và "đã có bằng chứng gây lỗi".
5. Không biến một cảm biến (ví dụ compass/magnetometer) thành thủ phạm nếu chưa có bằng chứng rail hoặc I2C liên quan bị lỗi.
6. Nếu có rail S1/S2, PMIC, AOP, USB, NAND, Baseband, RFFE, Sensor hoặc SoC trong ảnh, chỉ đề cập khi chúng thực sự liên quan đến dữ liệu case.
7. Khi nghi chạm sau, ưu tiên: khu vực IC chủ → tụ/rail quanh IC → nguồn cấp → tải chung rail → so sánh board tốt.
8. Nếu thiếu số đo để khoanh vùng, nói chính xác cần đo gì tiếp theo thay vì đoán.

TRẢ KẾT QUẢ:
=== NHẬN ĐỊNH PAN ===
=== KHU VỰC NGHI NGỜ ===
=== PHÂN TÍCH SCHEMATIC/BOARDVIEW ===
=== 3-5 ĐIỂM CẦN ĐO TIẾP ===
=== TRÌNH TỰ KIỂM TRA THỰC TẾ ===
=== LINH KIỆN/IC CẦN KIỂM TRA ===
=== MỨC ĐỘ TIN CẬY ===

Trong phần "3-5 ĐIỂM CẦN ĐO TIẾP", ưu tiên điểm đo cụ thể (rail, cuộn cảm, tụ hoặc chân IC) nếu ảnh đủ rõ. Không kết luận chắc chắn khi chưa có phép đo xác nhận.`;

    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: prompt },
          { inline_data: { mime_type: imageMime, data: imageBase64 } },
        ] }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: "medium" },
          maxOutputTokens: 1800,
        },
      }),
    });

    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error("Gemini error:", geminiData);
      throw new Error(geminiData?.error?.message || "Gemini API phân tích thất bại");
    }

    const analysis = geminiData?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text || "")
      .join("\n")
      .trim() || "";
    if (!analysis) throw new Error("Gemini không trả về kết quả phân tích");

    const saveAnalysis = async () => {
      try {
        const updateUrl = `${SUPABASE_URL}/rest/v1/ai_schematic_analyses?id=eq.${encodeURIComponent(analysis_id)}`;
        const updateResponse = await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            apikey: SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ ai_status: "completed", ai_analysis: analysis, updated_at: new Date().toISOString() }),
        });
        if (!updateResponse.ok) console.error("Database update error:", await updateResponse.text());
      } catch (saveError) {
        console.error("Background database save error:", saveError);
      }
    };

    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(saveAnalysis());
    else await saveAnalysis();

    return json({
      success: true,
      analysis_id,
      analysis,
      charged: true,
      coin_cost: charge.cost,
      balance_after: charge.balance_after,
    });
  } catch (error) {
    console.error("analyze-schematic error:", error);
    try { if (refundOnError) await refundOnError(); } catch (_) {}
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});