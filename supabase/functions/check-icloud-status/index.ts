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

  const provider = (Deno.env.get("ICLOUD_CHECK_PROVIDER") || "ifreecheck").toLowerCase();
  const apiKey = Deno.env.get("ICLOUD_CHECK_API_KEY") || "";

  if (!apiKey) return json({
    status: "ERROR",
    code: "PROVIDER_NOT_CONFIGURED",
    message: "Server iCloud chưa có API key. Chưa thực hiện kiểm tra.",
  }, 503);

  if (provider !== "ifreecheck") return json({
    status: "ERROR",
    code: "UNSUPPORTED_PROVIDER",
    message: "Provider iCloud chưa được hỗ trợ.",
  }, 501);

  if (type !== "imei") return json({
    status: "ERROR",
    code: "IMEI_REQUIRED",
    message: "Nguồn iCloud hiện tại yêu cầu IMEI. Chưa thực hiện tra cứu Serial để tránh trả kết quả sai.",
  }, 400);

  const service = Deno.env.get("IFREECHECK_SERVICE_ID") || "7";
  const url = new URL("https://ifreecheck.net/api_procesor.php");
  url.searchParams.set("api", apiKey);
  url.searchParams.set("imei", identifier);
  url.searchParams.set("service", service);

  await admin.from("icloud_check_payments")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", payment.id);

  try {
    const upstream = await fetch(url, { method: "GET", signal: AbortSignal.timeout(30000) });
    const raw = await upstream.text();

    let data: any;
    try { data = JSON.parse(raw); }
    catch {
      await admin.from("icloud_check_payments")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", payment.id);
      return json({ status: "ERROR", code: "PROVIDER_INVALID_RESPONSE", message: "Máy chủ iCloud trả dữ liệu không hợp lệ." }, 502);
    }

    if (String(data?.status ?? "").toLowerCase() !== "ok") {
      await admin.from("icloud_check_payments")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", payment.id);
      return json({
        status: "ERROR",
        code: "PROVIDER_ERROR",
        message: typeof data?.message === "string" ? data.message : "Nguồn kiểm tra không trả kết quả thành công.",
        provider,
      }, 502);
    }

    const lockValue = findLockValue(data?.message ?? data);
    const status = mapLockStatus(lockValue);

    if (status === "UNKNOWN") {
      const result = {
        status: "UNKNOWN",
        code: "UNCONFIRMED_PROVIDER_RESPONSE",
        message: "Nguồn kiểm tra đã trả lời nhưng chưa xác minh được Activation Lock ON/OFF.",
        provider,
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

      return json({ ...result, payment_id: payment.id });
    }

    const result = {
      status,
      code: "VERIFIED",
      message: status === "LOCKED"
        ? "Nguồn kiểm tra xác nhận Activation Lock / iCloud đang ON."
        : "Nguồn kiểm tra xác nhận Activation Lock / iCloud đang OFF.",
      provider,
      model,
      identifier_type: type,
      identifier_masked: identifier.slice(0, 4) + "••••••" + identifier.slice(-4),
      provider_response: data,
    };

    await admin.from("icloud_check_payments").update({
      status: "completed",
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
    }, 502);
  }
});
