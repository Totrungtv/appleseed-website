import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  // Browser CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

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
      action = "ai_analysis",
    } = body;

    if (!analysis_id || !file_path) {
      return json(
        {
          error: "Thiếu analysis_id hoặc file_path",
        },
        400,
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const userAuthorization = req.headers.get("Authorization") || "";

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
      if (!response.ok) {
        throw new Error(data?.message || data?.error || `RPC ${rpcName} failed`);
      }
      return data;
    };

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json(
        {
          error: "Thiếu Supabase environment variables",
        },
        500,
      );
    }

    if (!GEMINI_API_KEY) {
      return json(
        {
          error:
            "Chưa có secret GEMINI_API_KEY trong Edge Function Secrets",
        },
        500,
      );
    }

    if (!userAuthorization) {
      return json({ error: "Vui lòng đăng nhập để sử dụng AI." }, 401);
    }

    if (!["ai_analysis", "schematic_analysis"].includes(String(action))) {
      return json({ error: "Loại phân tích không hợp lệ." }, 400);
    }

    // Reserve Coin on the server using the configured price. The client
    // cannot choose the price, and the reservation is refunded if AI fails.
    const charge = await callRpc(
      "apple_seed_reserve_ai_board_action",
      { p_analysis_id: analysis_id, p_action: String(action) },
      userAuthorization,
    );

    if (!charge?.ok) {
      return json(
        {
          error: charge?.message || "Không thể trừ Coin.",
          code: charge?.code || "COIN_CHARGE_FAILED",
          cost: charge?.cost,
          balance: charge?.balance,
        },
        charge?.code === "INSUFFICIENT_COINS" ? 402 : 400,
      );
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

    // ---------------------------------------------------------
    // 1. Đọc ảnh schematic/board từ Supabase Storage
    // ---------------------------------------------------------

    const storageUrl =
      `${SUPABASE_URL}/storage/v1/object/authenticated/ai-schematics/${file_path}`;

    const fileResponse = await fetch(storageUrl, {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
    });

    if (!fileResponse.ok) {
      const errText = await fileResponse.text();
      throw new Error("Không đọc được ảnh schematic từ Storage: " + errText);
    }

    const imageBytes = new Uint8Array(
      await fileResponse.arrayBuffer(),
    );

    // Convert binary → base64
    let binary = "";
    const chunkSize = 0x8000;

    for (let i = 0; i < imageBytes.length; i += chunkSize) {
      binary += String.fromCharCode(
        ...imageBytes.subarray(
          i,
          Math.min(i + chunkSize, imageBytes.length),
        ),
      );
    }

    const imageBase64 = btoa(binary);

    const imageMime =
      mime_type || fileResponse.headers.get("content-type") || "image/jpeg";

    // ---------------------------------------------------------
    // 2. Prompt AI phân tích PAN + schematic
    // ---------------------------------------------------------

    const prompt = `
Bạn là AI kỹ thuật hỗ trợ sửa chữa mainboard iPhone cấp độ board-level
cho Apple Seed.

Hãy phân tích PAN thực tế kết hợp với ảnh schematic/board được gửi.

THÔNG TIN THIẾT BỊ
Model: ${device_model || "Không rõ"}
Board code / vùng do kỹ thuật viên nhập: ${board_code || "Không cung cấp"}

QUY TẮC VỀ DỮ LIỆU ĐẦU VÀO:
- Board code / vùng do kỹ thuật viên nhập chỉ là dữ liệu tham khảo hoặc giả thuyết, KHÔNG phải kết luận chẩn đoán.
- Nếu Board code / vùng để trống, tuyệt đối không tự điền hoặc suy đoán Compass, Magnetometer, I2C, PP_VDD, U5200 hay bất kỳ IC/rail cụ thể nào.
- Không được biến tên linh kiện xuất hiện trong giao diện, ví dụ mẫu, lịch sử ca bệnh hoặc ngữ cảnh thành nguyên nhân của PANIC.
- Chỉ quy kết một IC, sensor, bus hoặc rail khi PANIC LOG, số đo hoặc ảnh schematic/boardview cung cấp bằng chứng phù hợp.
- Nếu chỉ có lỗi I2C chung (ví dụ ni2c_err_sts) mà chưa xác định device/address/bus cụ thể, phải kết luận ở mức "lỗi giao tiếp I2C chưa xác định thiết bị", không mặc định Compass.
- Nếu dữ liệu chưa đủ, phải nói rõ "chưa đủ dữ liệu" và đưa ra phép đo/kiểm tra tiếp theo thay vì đoán.

DỮ LIỆU PAN / KỸ THUẬT:
${notes || "Không có"}

YÊU CẦU PHÂN TÍCH:

1. Xác định triệu chứng chính.
2. Phân tích boot current nếu có.
3. Phân tích rail nguồn liên quan nếu dữ liệu có.
4. Đọc các IC / đường nguồn / tín hiệu có thể nhìn thấy trên schematic.
5. Xác định khu vực nghi ngờ dựa trên bằng chứng thực tế, không dựa trên giả định có sẵn.
5a. Nếu PANIC chỉ cho biết một bus chung như I2C, phải khoanh vùng device/address bằng dữ liệu PANIC, schematic và phép đo; không được chọn Compass chỉ vì có I2C.
6. Đưa ra các điểm cần đo tiếp theo.
7. Nếu có thể, chỉ rõ:
   - VDD/VBAT/VDD_MAIN
   - PP_VDD
   - I2C SDA/SCL
   - RFFE
   - NAND
   - Baseband
   - PMIC
   - CPU
   - Sensor
   - Face ID
   - các rail liên quan khác.
8. Không được khẳng định chắc chắn khi chưa có phép đo.
9. Ưu tiên quy trình đo thực tế:
   - đo trở kháng
   - đo diode
   - kiểm tra short
   - kiểm tra điện áp
   - kiểm tra tín hiệu
   - so sánh board tốt.
10. Nếu schematic không đủ rõ để kết luận thì nói rõ cần thêm ảnh hoặc số đo.

TRẢ KẾT QUẢ THEO CẤU TRÚC:

=== NHẬN ĐỊNH PAN ===

=== KHU VỰC NGHI NGỜ ===

=== PHÂN TÍCH SCHEMATIC ===

=== CÁC ĐIỂM CẦN ĐO ===

=== TRÌNH TỰ KIỂM TRA ĐỀ XUẤT ===

=== LINH KIỆN / IC CẦN KIỂM TRA ===

=== KẾT LUẬN TẠM THỜI ===

Lưu ý: Đây là hỗ trợ chẩn đoán. Kỹ thuật viên phải xác minh bằng đo đạc thực tế.
`;

    // ---------------------------------------------------------
    // 3. Gọi Gemini Vision
    // ---------------------------------------------------------

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" +
      encodeURIComponent(GEMINI_API_KEY);

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: imageMime,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
         thinkingConfig: {
          thinkingLevel: "minimal",
         },
         maxOutputTokens: 1200,
         },
      }),
    });

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini error:", geminiData);
      throw new Error(
        geminiData?.error?.message || "Gemini API phân tích thất bại",
      );
    }

    const analysis =
      geminiData?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("\n")
        .trim() || "";

    if (!analysis) {
      throw new Error("Gemini không trả về kết quả phân tích");
    }

    // ---------------------------------------------------------
    // 4. Lưu kết quả vào ai_schematic_analyses
    // ---------------------------------------------------------

    // Không chờ PATCH database trước khi trả kết quả cho trình duyệt.
    // Việc lưu lịch sử được chạy nền để giảm thời gian người dùng phải chờ.
    const saveAnalysis = async () => {
      try {
        const updateUrl =
          `${SUPABASE_URL}/rest/v1/ai_schematic_analyses?id=eq.${encodeURIComponent(analysis_id)}`;

        const updateResponse = await fetch(updateUrl, {
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
        });

        if (!updateResponse.ok) {
          const updateError = await updateResponse.text();
          console.error("Database update error:", updateError);
        }
      } catch (saveError) {
        console.error("Background database save error:", saveError);
      }
    };

    // Supabase Edge Runtime hỗ trợ giữ tác vụ nền sau khi response đã được trả.
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(saveAnalysis());
    } else {
      // Fallback cho runtime không có waitUntil.
      await saveAnalysis();
    }

    // Trả kết quả AI ngay, không bắt trình duyệt chờ database PATCH.
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
    try {
      if (refundOnError) await refundOnError();
    } catch (_) {}

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500,
    );
  }
});