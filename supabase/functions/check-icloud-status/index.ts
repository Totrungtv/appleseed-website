import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function findLockValue(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const o = value as Record<string, unknown>;
  const keys = ["icloudstatus","icloudlock","icloudlockstatus","activationlock","activationlockstatus","findmyiphone","fmi","fmip","findmy"];

  for (const key of Object.keys(o)) {
    if (keys.includes(norm(key))) {
      const s = String(o[key] ?? "").trim().toLowerCase();
      if (s) return s;
    }
  }

  for (const key of Object.keys(o)) {
    const found = findLockValue(o[key]);
    if (found) return found;
  }

  return "";
}

function mapLockStatus(v: string): "LOCKED" | "UNLOCKED" | "UNKNOWN" {
  const s = v.toLowerCase().trim();
  if (!s) return "UNKNOWN";
  if (/^(on|yes|true|locked|lock|enabled|enable|activated|lost|lostmode|lost_mode)$/.test(s)) return "LOCKED";
  if (/^(off|no|false|unlocked|unlock|disabled|disable|deactivated|clean|clear)$/.test(s)) return "UNLOCKED";
  if (/(activation\s*lock|icloud\s*lock|find\s*my).*(on|locked|enabled|activated)/.test(s)) return "LOCKED";
  if (/(activation\s*lock|icloud\s*lock|find\s*my).*(off|unlocked|disabled|deactivated)/.test(s)) return "UNLOCKED";
  return "UNKNOWN";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ status: "ERROR", message: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let body: any;
  try { body = await req.json(); }
  catch { return json({ status: "ERROR", message: "Dữ liệu yêu cầu không hợp lệ." }, 400); }

  const paymentId = String(body?.payment_id || "").trim();
  if (!paymentId) {
    return json({
      status: "ERROR",
      code: "PAYMENT_REQUIRED",
      message: "Thanh toán 5.000đ là bắt buộc trước khi tra cứu.",
    }, 402);
  }

  const { data: payment, error: paymentError } = await admin
    .from("icloud_check_payments")
    .select("id,amount_vnd,payment_ref,identifier_type,identifier,device_model,status,check_result,expires_at,paid_at,completed_at")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    return json({ status: "ERROR", code: "PAYMENT_NOT_FOUND", message: "Không tìm thấy đơn kiểm tra iCloud." }, 404);
  }

  if (Number(payment.amount_vnd) !== 5000) {
    return json({ status: "ERROR", code: "PAYMENT_AMOUNT_INVALID", message: "Đơn thanh toán không hợp lệ." }, 402);
  }

  if (payment.status === "completed" && payment.check_result) {
    return json({ ...payment.check_result, payment_id: payment.id, cached: true });
  }

  if (!["paid", "processing"].includes(String(payment.status))) {
    return json({ status: "ERROR", code: "PAYMENT_REQUIRED", message: "Đơn chưa được xác nhận thanh toán 5.000đ." }, 402);
  }

  const type = payment.identifier_type === "imei" ? "imei" : "serial";
  const identifier = String(payment.identifier || "").trim().replace(/[\s-]/g, "").toUpperCase();
  const model = payment.device_model ? String(payment.device_model).trim() : null;

  if (type === "imei" && !/^\d{14,16}$/.test(identifier)) return json({ status: "ERROR", message: "IMEI không hợp lệ." }, 400);
  if (type === "serial" && !/^[A-Z0-9]{8,20}$/.test(identifier)) return json({ status: "ERROR", message: "Serial Number không hợp lệ." }, 400);

  const provider = (Deno.env.get("ICLOUD_CHECK_PROVIDER") || "imeigsx").toLowerCase();
  const apiKey = provider === "imeigsx"
    ? (Deno.env.get("IMEIGSX_API_KEY") || Deno.env.get("ICLOUD_CHECK_API_KEY") || "")
    : (Deno.env.get("ICLOUD_CHECK_API_KEY") || "");

  if (!apiKey) return json({
    status: "ERROR",
    code: "PROVIDER_NOT_CONFIGURED",
    message: "Server iCloud chưa có API key. Chưa thực hiện kiểm tra.",
  }, 503);

  if (provider !== "imeigsx") return json({
    status: "ERROR",
    code: "UNSUPPORTED_PROVIDER",
    message: "Provider iCloud chưa được hỗ trợ trong bản staging này.",
  }, 501);

  const command = Deno.env.get("IMEIGSX_FMI_COMMAND") || "4";
  const apiUrl = "https://api.imeigsx.com/api/v1/check";

  await admin.from("icloud_check_payments")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", payment.id);

  try {
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        command,
        identifier,
        custom_request_id: payment.payment_ref,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const raw = await upstream.text();
    let data: any;
    try { data = JSON.parse(raw); }
    catch {
      await admin.from("icloud_check_payments")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", payment.id);
      return json({
        status: "ERROR",
        code: "PROVIDER_INVALID_RESPONSE",
        message: "Máy chủ iCloud trả dữ liệu không hợp lệ.",
        provider,
      }, 502);
    }

    if (!upstream.ok || data?.success !== true) {
      await admin.from("icloud_check_payments")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", payment.id);
      return json({
        status: "ERROR",
        code: "PROVIDER_ERROR",
        message: typeof data?.error === "string"
          ? data.error
          : typeof data?.message === "string"
            ? data.message
            : "Nguồn kiểm tra không trả kết quả thành công.",
        provider,
        provider_response: data,
      }, 502);
    }

    const object = data?.object && typeof data.object === "object" ? data.object : {};
    let status: "LOCKED" | "UNLOCKED" | "UNKNOWN" = "UNKNOWN";

    const fmi = object.fmiOn ?? object.fmiON ?? data.fmiOn ?? data.fmiON;
    if (typeof fmi === "boolean") {
      status = fmi ? "LOCKED" : "UNLOCKED";
    } else {
      const text = JSON.stringify(data).toLowerCase();
      if (/(find my|activation lock|icloud).{0,100}(off|unlocked|disabled|clean)/i.test(text)) {
        status = "UNLOCKED";
      } else if (/(find my|activation lock|icloud).{0,100}(on|locked|enabled|lost)/i.test(text)) {
        status = "LOCKED";
      }
    }

    if (status === "UNKNOWN") {
      const result = {
        status: "UNKNOWN",
        code: "UNCONFIRMED_PROVIDER_RESPONSE",
        message: "Nguồn kiểm tra đã trả lời nhưng chưa xác minh được Activation Lock ON/OFF. Không ghi nhận kết quả sai.",
        provider,
        command,
        model,
        identifier_type: type,
        identifier_masked: identifier.slice(0, 4) + "••••••" + identifier.slice(-4),
        provider_response: data,
      };

      await admin.from("icloud_check_payments").update({
        status: "paid",
        check_result: result,
        updated_at: new Date().toISOString(),
      }).eq("id", payment.id);

      return json({ ...result, payment_id: payment.id }, 502);
    }

    const result = {
      status,
      code: "VERIFIED",
      message: status === "LOCKED"
        ? "IMEIGSX xác nhận Activation Lock / iCloud đang ON."
        : "IMEIGSX xác nhận Activation Lock / iCloud đang OFF.",
      provider,
      command,
      model: object.model || data.model || model,
      identifier_type: type,
      identifier_masked: identifier.slice(0, 4) + "••••••" + identifier.slice(-4),
      provider_request_id: data.request_id || null,
      credits: typeof data.credits === "number" ? data.credits : null,
      provider_response: data,
    };

    await admin.from("icloud_check_payments").update({
      status: "completed",
      provider: provider,
      provider_transaction_id: data.request_id || null,
      check_result: result,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);

    return json({ ...result, payment_id: payment.id });
  } catch (err) {
    await admin.from("icloud_check_payments")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", payment.id);

    return json({
      status: "ERROR",
      code: "CHECK_FAILED",
      message: err instanceof Error ? err.message : "Kiểm tra iCloud thất bại.",
      provider,
    }, 502);
  }

});
