import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ status: "ERROR", message: "Method not allowed." }, 405);

  const auth = req.headers.get("Authorization") || "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ status: "ERROR", message: "Vui lòng đăng nhập Apple Seed Member." }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ status: "ERROR", message: "Dữ liệu yêu cầu không hợp lệ." }, 400); }

  const type = body?.identifier_type === "imei" ? "imei" : "serial";
  const identifier = String(body?.identifier || "").trim().replace(/[\s-]/g, "").toUpperCase();
  const model = body?.device_model ? String(body.device_model).trim() : null;

  if (type === "imei" && !/^\d{14,16}$/.test(identifier))
    return json({ status: "ERROR", message: "IMEI không hợp lệ." }, 400);
  if (type === "serial" && !/^[A-Z0-9]{8,20}$/.test(identifier))
    return json({ status: "ERROR", message: "Serial Number không hợp lệ." }, 400);

  const provider = (Deno.env.get("ICLOUD_CHECK_PROVIDER") || "ifreecheck").toLowerCase();
  const apiKey = Deno.env.get("ICLOUD_CHECK_API_KEY") || "";
  if (!apiKey) return json({
    status: "ERROR",
    code: "PROVIDER_NOT_CONFIGURED",
    message: "Server iCloud chưa được cấu hình API key. Hãy cấu hình ICLOUD_CHECK_API_KEY trong Supabase Secrets.",
  }, 503);

  if (provider === "ifreecheck") {
    if (type !== "imei") return json({
      status: "ERROR", code: "SERIAL_PROVIDER_LIMIT",
      message: "Provider iFreeCheck hiện được cấu hình cho IMEI. Hãy kiểm tra bằng IMEI hoặc cấu hình provider hỗ trợ Serial.",
    }, 400);

    const service = Deno.env.get("IFREECHECK_SERVICE_ID") || "7";
    const url = new URL("https://ifreecheck.net/api_procesor.php");
    url.searchParams.set("api", apiKey);
    url.searchParams.set("imei", identifier);
    url.searchParams.set("service", service);

    let upstream: Response;
    try { upstream = await fetch(url, { signal: AbortSignal.timeout(30000) }); }
    catch { return json({ status: "ERROR", code: "UPSTREAM_UNREACHABLE", message: "Không kết nối được máy chủ kiểm tra iCloud." }, 502); }

    const raw = await upstream.text();
    let data: any;
    try { data = JSON.parse(raw); }
    catch { return json({ status: "ERROR", code: "UPSTREAM_INVALID", message: "Máy chủ kiểm tra trả về dữ liệu không hợp lệ." }, 502); }

    const statusText = String(data?.status ?? data?.result ?? data?.icloud ?? data?.fmi ?? data?.data?.fmi ?? "").toLowerCase();
    let status = "UNKNOWN";
    if (/\b(on|locked)\b/.test(statusText)) status = "LOCKED";
    else if (/\b(off|unlocked|clean|clear)\b/.test(statusText)) status = "UNLOCKED";

    if (status === "UNKNOWN") return json({
      status: "UNKNOWN",
      code: "UNCONFIRMED_PROVIDER_RESPONSE",
      message: "Nguồn kiểm tra đã trả lời nhưng chưa có trạng thái Activation Lock có thể xác minh.",
      provider, model, provider_response: data,
    });

    return json({
      status, code: "VERIFIED",
      message: status === "LOCKED"
        ? "Nguồn kiểm tra xác nhận Activation Lock / iCloud đang ON."
        : "Nguồn kiểm tra xác nhận Activation Lock / iCloud đang OFF.",
      provider, model, identifier_type: type,
      identifier_masked: identifier.slice(0, 4) + "••••••" + identifier.slice(-4),
      provider_response: data,
    });
  }

  return json({ status: "ERROR", code: "UNSUPPORTED_PROVIDER", message: "Provider iCloud chưa được hỗ trợ." }, 501);
});
