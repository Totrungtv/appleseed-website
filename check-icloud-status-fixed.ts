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

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function maskIdentifier(v: string) {
  if (v.length <= 8) return "••••••";
  return v.slice(0, 4) + "••••••" + v.slice(-4);
}

function normalizeKey(v: unknown) {
  return clean(v).toLowerCase().replace(/[\s_-]+/g, "");
}

function sanitizeText(v: unknown) {
  return clean(v)
    .replace(/imei\s*\.\s*org/gi, "nguồn dữ liệu tra cứu")
    .replace(/imei\.org/gi, "nguồn dữ liệu tra cứu")
    .replace(/code4gsm/gi, "nguồn dữ liệu tra cứu");
}

function findValue(value: unknown, wanted: string[]): unknown {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (wanted.includes(normalizeKey(key))) return obj[key];
  }
  for (const key of Object.keys(obj)) {
    const found = findValue(obj[key], wanted);
    if (found !== null && found !== undefined && clean(found) !== "") return found;
  }
  return null;
}

function detectFmi(raw: unknown, full: unknown) {
  const direct = clean(raw).toLowerCase();
  if (/^(on|yes|true|locked|lock|enabled|enable|activated|lost|lostmode|lost_mode)$/.test(direct)) return "LOCKED";
  if (/^(off|no|false|unlocked|unlock|disabled|disable|deactivated|clean|clear)$/.test(direct)) return "UNLOCKED";

  const text = JSON.stringify(full ?? "").toLowerCase();
  if (/(activation.?lock|icloud|find.?my|fmi).{0,140}(off|unlocked|disabled|deactivated|clean|clear|no)/i.test(text)) return "UNLOCKED";
  if (/(activation.?lock|icloud|find.?my|fmi).{0,140}(on|locked|enabled|activated|lost)/i.test(text)) return "LOCKED";
  return "UNKNOWN";
}

function publicResult(raw: any) {
  const out = raw && typeof raw === "object" ? structuredClone(raw) : {};
  delete out.provider;
  delete out.provider_raw;
  delete out.provider_response;
  delete out.service_id;
  delete out.service_name;
  delete out.provider_order_id;
  delete out.provider_code;
  delete out.order_id;
  if (out.message) out.message = sanitizeText(out.message);
  if (out.details?.message) out.details.message = sanitizeText(out.details.message);
  return out;
}

async function getAuthenticatedUser(req: Request) {
  const auth = clean(req.headers.get("Authorization"));
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data } = await db.auth.getUser(token);
  return data.user ?? null;
}

async function isAdmin(userId: string) {
  const { data } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

async function apiGet(path: string, params: Record<string, string>, timeoutMs = 30000) {
  const url = new URL("https://api-client.imei.org/api" + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("PROVIDER_INVALID_JSON");
  }
  if (!response.ok || Number(data?.status) !== 1) {
    const providerMessage = findValue(data, ["message", "error", "errors"]);
    throw new Error(sanitizeText(providerMessage || `PROVIDER_HTTP_${response.status}`));
  }
  return data;
}

function pickService(services: any[], amount: number) {
  const normalized = services.map((s) => ({
    ...s,
    _name: normalizeKey(s?.name),
  }));

  if (amount === 15000) {
    // PRO must use the detailed Apple Advanced Check. Never silently downgrade.
    return normalized.find((s) => s._name === "appleadvancedcheck") ||
      normalized.find((s) => s._name.includes("appleadvancedcheck"));
  }

  // BASIC is intentionally the cheaper FMI ON/OFF service.
  return normalized.find((s) => s._name === "applefindmystatuscheckonoff") ||
    normalized.find((s) => s._name.includes("applefindmystatuscheck")) ||
    normalized.find((s) => s._name === "applebasiccheck");
}

function normalizeReport(data: any) {
  if (data?.response?.services?.[0]) return data.response.services[0];
  if (Array.isArray(data?.response) && data.response[0] && typeof data.response[0] === "object") return data.response[0];
  if (data?.response && typeof data.response === "object") {
    const keys = Object.keys(data.response);
    if (keys.some((k) => /model|imei|serial|fmi|icloud|activated|simlock|warranty/i.test(k))) return data.response;
  }
  if (data?.data && typeof data.data === "object") {
    const keys = Object.keys(data.data);
    if (keys.some((k) => /model|imei|serial|fmi|icloud|activated|simlock|warranty/i.test(k))) return data.data;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ status: "ERROR", message: "Method not allowed." }, 405);

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return json({ status: "ERROR", code: "AUTH_REQUIRED", message: "Vui lòng đăng nhập Apple Seed trước khi tra cứu." }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ status: "ERROR", message: "Dữ liệu yêu cầu không hợp lệ." }, 400);
  }

  const paymentId = clean(body?.payment_id);
  if (!paymentId) {
    return json({ status: "ERROR", code: "PAYMENT_REQUIRED", message: "Thanh toán là bắt buộc trước khi tra cứu." }, 402);
  }

  const adminUser = await isAdmin(user.id);
  const { data: payment, error: paymentError } = await db
    .from("icloud_check_payments")
    .select("id,user_id,amount_vnd,payment_ref,identifier_type,identifier,device_model,status,check_result,expires_at,provider_transaction_id,paid_at,completed_at")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    return json({ status: "ERROR", code: "PAYMENT_NOT_FOUND", message: "Không tìm thấy đơn kiểm tra iCloud." }, 404);
  }

  if (!adminUser && payment.user_id !== user.id) {
    return json({ status: "ERROR", code: "FORBIDDEN", message: "Bạn không có quyền truy cập đơn kiểm tra này." }, 403);
  }

  const amount = Number(payment.amount_vnd);
  if (![5000, 15000].includes(amount)) {
    return json({ status: "ERROR", code: "PAYMENT_AMOUNT_INVALID", message: "Đơn thanh toán không hợp lệ." }, 402);
  }

  if (payment.status === "completed" && payment.check_result) {
    return json(publicResult({ ...payment.check_result, payment_id: payment.id, cached: true }));
  }

  if (payment.status === "failed" && payment.check_result) {
    return json(publicResult({ ...payment.check_result, payment_id: payment.id, cached: true }), 502);
  }

  if (payment.status !== "paid") {
    return json({
      status: "ERROR",
      code: "PAYMENT_REQUIRED",
      message: "Đơn chưa được SePay xác nhận thanh toán.",
      payment_id: payment.id,
    }, 402);
  }

  if (payment.expires_at && new Date(payment.expires_at).getTime() < Date.now()) {
    return json({ status: "ERROR", code: "PAYMENT_EXPIRED", message: "Đơn kiểm tra đã hết hạn." }, 402);
  }

  const type = payment.identifier_type === "imei" ? "imei" : "serial";
  const identifier = clean(payment.identifier).replace(/[\s-]/g, "").toUpperCase();

  // Current paid service is IMEI-based. Do not pretend Serial is supported by the provider.
  if (type !== "imei") {
    return json({
      status: "ERROR",
      code: "IMEI_REQUIRED",
      message: "Gói tra cứu hiện yêu cầu IMEI. Vui lòng nhập IMEI để nhận đúng báo cáo thiết bị.",
    }, 400);
  }

  if (!/^\d{14,16}$/.test(identifier)) {
    return json({ status: "ERROR", code: "IMEI_INVALID", message: "IMEI phải gồm 14–16 chữ số." }, 400);
  }

  // Atomic claim: only one request can spend provider credit for one paid order.
  const { data: claimed, error: claimError } = await db
    .from("icloud_check_payments")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", payment.id)
    .eq("status", "paid")
    .select("id,status")
    .maybeSingle();

  if (claimError) {
    return json({ status: "ERROR", code: "CHECK_CLAIM_FAILED", message: "Không thể bắt đầu phiên kiểm tra an toàn." }, 500);
  }

  if (!claimed) {
    const latest = await db.from("icloud_check_payments")
      .select("status,check_result")
      .eq("id", payment.id)
      .maybeSingle();

    if (latest.data?.status === "completed" && latest.data.check_result) {
      return json(publicResult({ ...latest.data.check_result, payment_id: payment.id, cached: true }));
    }
    if (latest.data?.status === "failed" && latest.data.check_result) {
      return json(publicResult({ ...latest.data.check_result, payment_id: payment.id, cached: true }), 502);
    }
    return json({ status: "PROCESSING", code: "CHECK_IN_PROGRESS", message: "Phiên kiểm tra đang được xử lý." }, 202);
  }

  const apiKey = clean(Deno.env.get("IMEI_ORG_API_KEY"));
  if (!apiKey) {
    const result = { status: "ERROR", code: "PROVIDER_NOT_CONFIGURED", message: "Hệ thống kiểm tra chưa được cấu hình." };
    await db.from("icloud_check_payments").update({
      status: "failed", check_result: result, updated_at: new Date().toISOString()
    }).eq("id", payment.id).eq("status", "processing");
    return json({ ...result, payment_id: payment.id }, 503);
  }

  try {
    const servicesData = await apiGet("/services", { apikey: apiKey }, 30000);
    const services = Array.isArray(servicesData?.response?.services) ? servicesData.response.services : [];
    const service = pickService(services, amount);

    if (!service?.id) {
      throw new Error(amount === 15000
        ? "Gói CHECK PRO hiện chưa có dịch vụ Apple Advanced Check khả dụng."
        : "Gói CHECK CƠ BẢN hiện chưa có dịch vụ FMI ON/OFF khả dụng.");
    }

    const submit = await apiGet("/submit", {
      apikey: apiKey,
      service_id: String(service.id),
      input: identifier,
      dontWait: "1",
    }, 30000);

    const providerOrderId = submit?.orderId ?? submit?.response?.orderId ?? null;
    let report = normalizeReport(submit);

    // Async provider order: poll until a real report arrives.
    if ((!report || typeof report !== "object" || !Object.keys(report).length) && providerOrderId) {
      for (let i = 0; i < 12; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        try {
          const tracked = await apiGet("/track", {
            apikey: apiKey,
            id: String(providerOrderId),
          }, 30000);
          const candidate = normalizeReport(tracked);
          if (candidate && typeof candidate === "object" && Object.keys(candidate).length) {
            report = candidate;
            break;
          }
        } catch {
          // Keep polling until timeout.
        }
      }
    }

    if (!report || typeof report !== "object" || !Object.keys(report).length) {
      throw new Error("Kết quả tra cứu chưa sẵn sàng. Giao dịch đã được giữ lại để Admin xử lý.");
    }

    const fmiRaw = findValue(report, [
      "fmi", "icloud", "icloudstatus", "icloudlock",
      "activationlock", "activationlockstatus", "findmyiphone",
      "findmy", "findmystatus",
    ]);
    const status = detectFmi(fmiRaw, report);

    const details: Record<string, unknown> = {
      "Model": findValue(report, ["model", "devicemodel", "modelname", "productname"]),
      "IMEI": findValue(report, ["imei", "imeinumber"]) || identifier,
      "IMEI 2": findValue(report, ["imei2", "imei_2", "secondimei"]),
      "Serial Number": findValue(report, ["serialnumber", "serial", "sn"]),
      "Warranty Status": findValue(report, ["warrantystatus", "warranty", "repairsandservicecoverage"]),
      "Estimated Purchase Date": findValue(report, ["estimatedpurchasedate", "purchasedate"]),
      "Valid Purchase Date": findValue(report, ["validpurchasedate"]),
      "Telephone Technical Support": findValue(report, ["telephonetechnicalsupport"]),
      "Repairs and Service Coverage": findValue(report, ["repairsandservicecoverage"]),
      "Loaner Device": findValue(report, ["loanerdevice"]),
      "Apple Care": findValue(report, ["applecare", "applecarestatus"]),
      "FMI": findValue(report, ["fmi"]),
      "iCloud": findValue(report, ["icloud"]),
      "Activated": findValue(report, ["activated", "activationstatus"]),
      "Simlock": findValue(report, ["simlock", "simlockstatus"]),
      "Carrier Lock": findValue(report, ["carrierlock", "carrierlockstatus", "carrier"]),
      "Blacklist": findValue(report, ["blacklist", "blackliststatus", "loststolenstatus"]),
      "EID": findValue(report, ["eid"]),
      "Lost Mode": findValue(report, ["lostmode", "lostmodestatus"]),
      "MDM / DEP": findValue(report, ["mdm", "mdmlockstatus", "mdmstatus"]),
      "Country": findValue(report, ["country", "countryname"]),
      "Network": findValue(report, ["network", "networkname"]),
    };

    if (status === "UNKNOWN") {
      const result = {
        status: "ERROR",
        code: "UNCONFIRMED_PROVIDER_RESPONSE",
        message: "Nguồn dữ liệu chưa trả về trạng thái Activation Lock đủ rõ để kết luận.",
        details,
        payment_id: payment.id,
      };
      await db.from("icloud_check_payments").update({
        status: "failed",
        check_result: result,
        updated_at: new Date().toISOString(),
      }).eq("id", payment.id).eq("status", "processing");
      return json(result, 502);
    }

    const result = {
      status,
      code: "VERIFIED",
      plan: amount === 15000 ? "pro" : "basic",
      message: status === "LOCKED"
        ? "Thiết bị đã được xác minh: Activation Lock / FMI đang ON."
        : "Thiết bị đã được xác minh: Activation Lock / FMI đang OFF.",
      model: details["Model"],
      imei: details["IMEI"],
      serial: details["Serial Number"],
      fmi: details["FMI"],
      icloud: details["iCloud"],
      activated: details["Activated"],
      simlock: details["Simlock"],
      details,
      identifier_type: type,
      identifier_masked: maskIdentifier(identifier),
      payment_id: payment.id,
      verified_at: new Date().toISOString(),
    };

    await db.from("icloud_check_payments").update({
      status: "completed",
      check_result: result,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id).eq("status", "processing");

    return json(result);
  } catch (err) {
    const message = sanitizeText(err instanceof Error ? err.message : "Không thể hoàn tất tra cứu.");
    const result = {
      status: "ERROR",
      code: "CHECK_FAILED",
      message: message || "Hiện tại chưa thể hoàn tất tra cứu.",
      payment_id: payment.id,
    };

    await db.from("icloud_check_payments").update({
      status: "failed",
      check_result: result,
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id).eq("status", "processing");

    return json(result, 502);
  }
});