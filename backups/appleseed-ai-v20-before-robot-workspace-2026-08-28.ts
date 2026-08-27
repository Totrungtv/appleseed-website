import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let chargeConsumed = false;
  let authorization = "";
  let SUPABASE_URL = "";
  let SERVICE_ROLE_KEY = "";
  let action = "ai_analysis";
  let analysisReference = "";

  try {
    const body = await req.json();
    const { analysis_id, file_path, device_model, board_code, notes, mime_type } = body;

    if (!analysis_id || !file_path) return json({ error: "Thiếu analysis_id hoặc file_path" }, 400);

    SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
    authorization = req.headers.get("Authorization") || "";
    action = body?.action === "schematic_analysis" ? "schematic_analysis" : "ai_analysis";
    analysisReference = String(analysis_id);

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Thiếu Supabase environment variables" }, 500);
    if (!GEMINI_API_KEY) return json({ error: "Chưa có secret GEMINI_API_KEY trong Edge Function Secrets" }, 500);
    if (!authorization.startsWith("Bearer ")) {
      return json({ error: "Phiên thành viên không hợp lệ. Hãy đăng nhập lại.", code: "NOT_AUTHENTICATED" }, 401);
    }

    // SERVER-SIDE billing: không đủ Coin thì không gọi AI.
    const consumeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/apple_seed_consume_ai_board_coins`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
          apikey: SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_action: action }),
      },
    );

    const consumeRaw = await consumeResponse.text();
    let consumeData: any = null;
    try { consumeData = consumeRaw ? JSON.parse(consumeRaw) : null; } catch { consumeData = null; }

    if (!consumeResponse.ok) {
      return json({ error: "Không thể kiểm tra/trừ Coin.", code: "COIN_BILLING_ERROR", detail: consumeRaw }, 500);
    }
    if (!consumeData?.ok) {
      const status = consumeData?.code === "INSUFFICIENT_COINS" ? 402 : 400;
      return json({
        error: consumeData?.message || "Không đủ Coin.",
        code: consumeData?.code || "COIN_ERROR",
        balance: consumeData?.balance ?? null,
        cost: consumeData?.cost ?? null,
      }, status);
    }
    chargeConsumed = true;

    // Đọc ảnh từ Storage.
    const storageUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/ai-schematics/${file_path}`;
    const fileResponse = await fetch(storageUrl, {
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    });
    if (!fileResponse.ok) {
      return json({ error: "Không đọc được ảnh schematic từ Storage", detail: await fileResponse.text() }, 500);
    }

    const imageBytes = new Uint8Array(await fileResponse.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < imageBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...imageBytes.subarray(i, Math.min(i + chunkSize, imageBytes.length)));
    }
    const imageBase64 = btoa(binary);
    const imageMime = mime_type || fileResponse.headers.get("content-type") || "image/jpeg";

    // Prompt tối ưu: luôn phân tích PANIC LOG và giữ song song dữ liệu thực tế + nhận định AI.
    const prompt = `
Bạn là AI board-level Apple Seed, chuyên chẩn đoán main iPhone.
Phân tích TOÀN BỘ dữ liệu kỹ thuật được gửi, đặc biệt PANIC LOG. Không được bỏ qua PANIC LOG dù chỉ có một dòng, một con số, mã decimal/hex hoặc chuỗi ngắn.
Nếu PANIC LOG là số decimal và người dùng yêu cầu đổi mã, hãy tính chính xác (ví dụ 524288 decimal = 0x80000), nhưng không tự coi đó là mã panic chuẩn nếu chưa đủ bằng chứng.
Ảnh là bằng chứng bổ sung; không được thay thế hoặc bỏ qua dữ liệu text.

Model: ${device_model || "Không rõ"}
Board: ${board_code || "Không rõ"}

=== DỮ LIỆU THỰC TẾ NGƯỜI DÙNG GỬI ===
${notes || "Không có"}

=== YÊU CẦU TRẢ LỜI ===
Trả lời tiếng Việt, nhanh, gọn nhưng thực dụng. Bắt buộc xuất:
=== DỮ LIỆU THỰC TẾ ===
Nhắc lại nguyên văn các dữ liệu quan trọng người dùng đã gửi, không tự thêm.

=== PHÂN TÍCH AI ===
Phân tích từng dữ liệu, ưu tiên PANIC LOG, boot current, Vbat, diode/resistance, I2C/SDA/SCL và ảnh.

=== KHU VỰC NGHI NGỜ ===
Chỉ nêu phần có bằng chứng; thiếu dữ liệu thì nói rõ.

=== ĐO TIẾP ===
Đưa 3-5 phép đo/kiểm tra cụ thể và điều kiện kết luận.

=== KẾT LUẬN TẠM THỜI ===
Nêu mức độ chắc chắn và dữ liệu còn thiếu.

Không bịa reference designator/net/linh kiện. Không kết luận compass, NAND, CPU, PMIC hay IC cụ thể chỉ vì từ khóa xuất hiện.
`;
    // Fast path: Flash-Lite được Google định vị cho low-latency/high-throughput multimodal workloads.
    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" +
      encodeURIComponent(GEMINI_API_KEY);

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: imageMime, data: imageBase64 } },
          ],
        }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: "minimal" },
          maxOutputTokens: 1200,
        },
      }),
    });

    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error("Gemini error:", geminiData);
      return json({ error: geminiData?.error?.message || "Gemini API phân tích thất bại" }, 500);
    }

    const analysis =
      geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n").trim() || "";
    if (!analysis) return json({ error: "Gemini không trả về kết quả phân tích" }, 500);

    const saveAnalysis = async () => {
      try {
        const updateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/ai_schematic_analyses?id=eq.${encodeURIComponent(analysis_id)}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
              apikey: SERVICE_ROLE_KEY,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              ai_status: "completed",
              ai_analysis: analysis,
              updated_at: new Date().toISOString(),
            }),
          },
        );
        if (!updateResponse.ok) console.error("Database update error:", await updateResponse.text());
      } catch (e) {
        console.error("Background database save error:", e);
      }
    };

    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(saveAnalysis());
    else await saveAnalysis();

    return json({
      success: true,
      analysis_id,
      analysis,
      action,
      charged: true,
      cost: consumeData?.cost ?? null,
      balance: consumeData?.balance ?? null,
    });
  } catch (error) {
    console.error("appleseed-ai error:", error);

    if (chargeConsumed && authorization.startsWith("Bearer ")) {
      try {
        const refundResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/apple_seed_refund_ai_board_coins`,
          {
            method: "POST",
            headers: {
              Authorization: authorization,
              apikey: SERVICE_ROLE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ p_action: action, p_reference: analysisReference }),
          },
        );
        if (!refundResponse.ok) console.error("Coin refund HTTP error:", await refundResponse.text());
      } catch (refundError) {
        console.error("Coin refund error:", refundError);
      }
    }

    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});