import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

function candidates(v: unknown, path = ""): Array<{path: string; value: string}> {
  if (v == null) return [];
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return String(v).trim() ? [{ path, value: String(v).trim() }] : [];
  if (Array.isArray(v)) return v.flatMap((x, i) => candidates(x, `${path}[${i}]`));
  if (typeof v === "object")
    return Object.entries(v as Record<string, unknown>).flatMap(([k, x]) =>
      candidates(x, path ? `${path}.${k}` : k)
    );
  return [];
}

function detect(v: any): {status: "LOCKED" | "UNLOCKED" | "UNKNOWN"; source: string} {
  const cs = candidates(v);
  const direct = cs.filter(c => /(icloud|activation.?lock|find.?my|fmip|fmi|lock.?status)/i.test(c.path));
  for (const c of direct) {
    const s = c.value.toLowerCase();
    if (/^(off|no|false|unlocked|unlock|disabled|disable|deactivated|clean|clear)$/.test(s))
      return { status: "UNLOCKED", source: c.path };
    if (/^(on|yes|true|locked|lock|enabled|enable|activated|lost|lostmode|lost_mode)$/.test(s))
      return { status: "LOCKED", source: c.path };
  }
  const text = cs.map(c => c.value).join(" | ").toLowerCase();
  if (/(icloud|activation lock|find my|findmy).{0,100}(off|unlocked|disabled|deactivated|clean|no)/i.test(text))
    return { status: "UNLOCKED", source: "provider_text" };
  if (/(icloud|activation lock|find my|findmy).{0,100}(on|locked|enabled|activated|lost)/i.test(text))
    return { status: "LOCKED", source: "provider_text" };
  return { status: "UNKNOWN", source: "" };
}

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

async function readPayment(paymentId: string) {
  const { data, error } = await db
    .from("icloud_check_payments")
    .select("id,amount_vnd,payment_ref,identifier_type,identifier,device_model,status,check_result,expires_at,provider_transaction_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ status: "ERROR", message: "Method not allowed." }, 405);

  let body: any;
  try { body = await req.json(); }
  catch { return json({ status: "ERROR", message: "Dữ liệu yêu cầu không hợp lệ." }, 400); }

  const paymentId = String(body?.payment_id || "").trim();
  if (!paymentId)
    return json({ status: "ERROR", code: "PAYMENT_REQUIRED", message: "Thanh toán 5.000đ là bắt buộc trước khi tra cứu." }, 402);

  let p = await readPayment(paymentId);
  if (!p)
    return json({ status: "ERROR", code: "PAYMENT_NOT_FOUND", message: "Không tìm thấy đơn kiểm tra iCloud." }, 404);

  if (Number(p.amount_vnd) !== 5000)
    return json({ status: "ERROR", code: "PAYMENT_AMOUNT_INVALID", message: "Đơn thanh toán không hợp lệ." }, 402);

  if (p.status === "completed" && p.check_result)
    return json({ ...p.check_result, payment_id: p.id, cached: true });

  if (p.status === "failed" && p.check_result)
    return json({ ...p.check_result, payment_id: p.id, cached: true }, 502);

  if (!["paid", "processing"].includes(String(p.status)))
    return json({ status: "ERROR", code: "PAYMENT_REQUIRED", message: "Đơn chưa được SePay xác nhận thanh toán 5.000đ.", payment_id: p.id }, 402);

  if (p.expires_at && new Date(p.expires_at).getTime() < Date.now() && p.status === "paid")
    return json({ status: "ERROR", code: "PAYMENT_EXPIRED", message: "Đơn kiểm tra đã hết hạn." }, 402);

  const type = p.identifier_type === "imei" ? "imei" : "serial";
  const identifier = String(p.identifier || "").trim().replace(/[\s-]/g, "").toUpperCase();
  if (type !== "imei")
    return json({ status: "ERROR", code: "IMEI_REQUIRED", message: "Nguồn iCloud hiện tại yêu cầu IMEI. Chưa tra cứu Serial để tránh trả kết quả sai." }, 400);
  if (!/^\d{14,16}$/.test(identifier))
    return json({ status: "ERROR", message: "IMEI không hợp lệ." }, 400);

  // Atomic claim: exactly one request may move paid -> processing.
  // This prevents double provider calls from duplicate clicks, reloads, or concurrent requests.
  if (p.status === "paid") {
    const { data: claimed, error: claimError } = await db
      .from("icloud_check_payments")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", p.id)
      .eq("status", "paid")
      .select("id,status")
      .maybeSingle();

    if (claimError) {
      return json({ status: "ERROR", code: "CHECK_CLAIM_FAILED", message: "Không thể bắt đầu phiên kiểm tra an toàn." }, 500);
    }
    if (!claimed) {
      p = await readPayment(paymentId);
      if (!p) return json({ status: "ERROR", code: "PAYMENT_NOT_FOUND", message: "Không tìm thấy đơn kiểm tra iCloud." }, 404);
      if (p.status === "completed" && p.check_result) return json({ ...p.check_result, payment_id: p.id, cached: true });
      if (p.status === "failed" && p.check_result) return json({ ...p.check_result, payment_id: p.id, cached: true }, 502);
      return json({ status: "PROCESSING", code: "CHECK_IN_PROGRESS", message: "Phiên kiểm tra đang được xử lý." }, 202);
    }
  } else {
    // Another request already owns the check. Never call the provider a second time.
    return json({ status: "PROCESSING", code: "CHECK_IN_PROGRESS", message: "Phiên kiểm tra đang được xử lý." }, 202);
  }

  const key = Deno.env.get("ICLOUD_CHECK_API_KEY") || "";
  if (!key) {
    const result = {
      status: "ERROR", code: "PROVIDER_NOT_CONFIGURED",
      message: "Hiện tại chúng tôi chưa thể kết nối được với server.",
      provider: "ifreecheck"
    };
    await db.from("icloud_check_payments").update({ status: "failed", check_result: result, updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "processing");
    return json({ ...result, payment_id: p.id }, 503);
  }

  const url = new URL("https://ifreecheck.net/api_procesor.php");
  url.searchParams.set("api", key);
  url.searchParams.set("imei", identifier);
  url.searchParams.set("service", Deno.env.get("IFREECHECK_SERVICE_ID") || "7");

  try {
    const r = await fetch(url, { method: "GET", signal: AbortSignal.timeout(25000) });
    const raw = await r.text();
    let data: any;
    try { data = JSON.parse(raw); }
    catch {
      const result = { status: "ERROR", code: "PROVIDER_INVALID_RESPONSE", message: "Hiện tại chúng tôi chưa thể kết nối được với server.", provider: "ifreecheck" };
      await db.from("icloud_check_payments").update({ status: "failed", check_result: result, updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "processing");
      return json({ ...result, payment_id: p.id }, 502);
    }

    if (String(data?.status || "").toLowerCase() !== "ok") {
      const result = {
        status: "ERROR", code: "PROVIDER_ERROR",
        message: "Hiện tại chúng tôi chưa thể kết nối được với server.",
        provider: "ifreecheck", provider_response: data
      };
      await db.from("icloud_check_payments").update({ status: "failed", check_result: result, updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "processing");
      return json({ ...result, payment_id: p.id }, 502);
    }

    const d = detect(data?.message ?? data);
    const base = {
      provider: "ifreecheck", identifier_type: type,
      identifier_masked: identifier.slice(0, 4) + "••••••" + identifier.slice(-4),
      provider_response: data, payment_id: p.id,
      provider_transaction_id: p.provider_transaction_id || null
    };

    if (d.status === "UNKNOWN") {
      const result = {
        ...base, status: "ERROR", code: "UNCONFIRMED_PROVIDER_RESPONSE",
        message: "Hiện tại chúng tôi chưa thể kết nối được với server. Nguồn kiểm tra trả dữ liệu nhưng chưa xác minh được trạng thái.",
        failed_reason: "unconfirmed_provider_response"
      };
      await db.from("icloud_check_payments").update({ status: "failed", check_result: result, updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "processing");
      return json({ ...result, payment_id: p.id }, 502);
    }

    const result = {
      ...base, status: d.status, code: "VERIFIED",
      message: d.status === "LOCKED"
        ? "Nguồn kiểm tra xác nhận Activation Lock / iCloud đang ON."
        : "Nguồn kiểm tra xác nhận Activation Lock / iCloud đang OFF.",
      source_field: d.source
    };
    await db.from("icloud_check_payments").update({ status: "completed", check_result: result, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "processing");
    return json(result);
  } catch (err) {
    const result = {
      status: "ERROR", code: "CHECK_FAILED",
      message: "Hiện tại chúng tôi chưa thể kết nối được với server.",
      provider: "ifreecheck"
    };
    await db.from("icloud_check_payments").update({ status: "failed", check_result: result, updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "processing");
    return json({ ...result, payment_id: p.id }, 502);
  }
});
