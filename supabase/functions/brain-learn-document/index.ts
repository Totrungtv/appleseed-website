import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json"
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SECRET_KEY = (() => {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.default) return String(parsed.default);
    } catch (_) {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
})();
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-5.6-luna";

if (!SUPABASE_SECRET_KEY) throw new Error("Missing Supabase server secret key");
const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    document_summary: { type: "string" },
    pages_learned: { type: "integer", minimum: 0 },
    knowledge_atoms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          knowledge_type: { type: "string", enum: ["component","net","power","signal","pin","relationship","symptom","failure","procedure","measurement","panic","model","general"] },
          title: { type: "string" },
          content: { type: "string" },
          device_model: { type: "string" },
          component_ref: { type: "string" },
          net_name: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          source_page: { type: "integer", minimum: 0 },
          source_locator: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 }
        },
        required: ["knowledge_type","title","content","device_model","component_ref","net_name","tags","source_page","source_locator","confidence"]
      }
    },
    relationships: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          from_title: { type: "string" },
          to_title: { type: "string" },
          relation: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 }
        },
        required: ["from_title","to_title","relation","confidence"]
      }
    }
  },
  required: ["document_summary","pages_learned","knowledge_atoms","relationships"]
};

function json(x: unknown, status = 200) {
  return new Response(JSON.stringify(x), { status, headers: cors });
}

async function requireStaff(req: Request) {
  const internalApiKey = req.headers.get("apikey") || req.headers.get("x-apple-seed-worker-key") || "";
  if (internalApiKey && SUPABASE_SECRET_KEY && internalApiKey === SUPABASE_SECRET_KEY) {
    return { id: "autopilot-worker", internal: true } as any;
  }

  const auth = req.headers.get("Authorization");
  if (!auth) throw new Error("Login required");
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Login required");

  const { data: profile, error: pe } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (pe || !profile || !["admin","staff"].includes(profile.role)) throw new Error("Admin/Staff only");
  return user;
}

async function blobToBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

async function openAIFile(file: Blob, filename: string) {
  const form = new FormData();
  form.append("purpose", "user_data");
  form.append("file", file, filename);
  const r = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form
  });
  const t = await r.text();
  if (!r.ok) throw new Error("OpenAI file upload failed: " + t.slice(0,500));
  return JSON.parse(t);
}

async function extractKnowledge(fileId: string, fileName: string, mimeType: string, fileBlob: Blob, branchName: string, branchGoal: string) {
  const instructions = `Bạn là một NHÁNH CHUYÊN GIA trong ENGINE HỌC MẠCH ĐIỆN của Apple Seed. Tài liệu đính kèm là nguồn kiến thức để xây bộ não điện tử, KHÔNG phải tài liệu để trả lời người dùng bằng cách chỉ dẫn họ xem trang nào.

Hãy ĐỌC TOÀN BỘ tài liệu và hấp thụ các kiến thức kỹ thuật có giá trị. Ưu tiên schematic, boardview, datasheet, service manual và tài liệu sửa chữa.

MỤC TIÊU:
1. Trích xuất thành các knowledge atom độc lập, ngắn nhưng đủ nghĩa.
2. Nhận diện IC, linh kiện, connector, pin/chân, net, power rail, tín hiệu, bus, enable/reset/clock.
3. Nhận diện quan hệ: IC nào tạo nguồn nào, nguồn cấp cho khối nào, pin nối net nào, linh kiện nào nằm trên rail nào, tín hiệu đi giữa IC nào.
4. Nhận diện điều kiện hoạt động, power sequence, giá trị điện áp/dòng/điện trở/diode khi tài liệu thực sự cung cấp.
5. Nhận diện triệu chứng, lỗi, panic, quy trình đo và repair procedure nếu tài liệu có.
6. Với boardview/schematic hình ảnh, đọc cả chữ trong hình và quan hệ đường mạch; không bỏ qua các trang chỉ vì ít text.
7. Không bịa. Nếu tài liệu không xác nhận một quan hệ thì không tạo quan hệ đó.
8. Mỗi atom phải là kiến thức để AI dùng lại khi phân tích ca mới, KHÔNG phải lời dẫn kiểu "xem trang...".
9. source_page phải là trang PDF nếu xác định được; nếu không xác định được để 0.
10. Nếu nhiều trang lặp lại cùng một kiến thức, hợp nhất thành một atom thay vì spam trùng.
11. Hãy cố gắng bao phủ TOÀN BỘ tài liệu. Không dừng sau vài trang.
12. device_model để trống nếu tài liệu không xác định rõ model.

TÀI LIỆU: ${fileName}`;

  const body = {
    model: MODEL,
    store: false,
    reasoning: { effort: "low" },
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: instructions },
        ...(mimeType.startsWith("image/")
          ? [{ type: "input_image", image_url: `data:${mimeType};base64,${await blobToBase64(fileBlob)}`, detail: "high" }]
          : [{ type: "input_file", file_id: fileId }])
      ]
    }],
    text: { format: { type: "json_schema", name: "apple_seed_electronic_brain", strict: true, schema } },
    max_output_tokens: 12000
  };

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  if (!r.ok) throw new Error("OpenAI learning failed: " + t.slice(0,1000));
  const out = JSON.parse(t);
  // REST Responses API returns generated text inside output[].content[].
  // output_text is an SDK convenience field and is not guaranteed in raw REST JSON.
  const textOut = out.output_text ||
    (Array.isArray(out.output)
      ? out.output.flatMap((item:any)=>Array.isArray(item.content)?item.content:[])
          .filter((part:any)=>part?.type==="output_text" && typeof part.text==="string")
          .map((part:any)=>part.text).join("\\n")
      : "");
  if (!textOut.trim()) {
    throw new Error("AI không trả về nội dung kiến thức. Response thiếu output_text.");
  }
  let parsed;
  try { parsed = JSON.parse(textOut); }
  catch (_) { throw new Error("AI trả về JSON không hợp lệ."); }
  if (!Array.isArray(parsed.knowledge_atoms)) {
    throw new Error("AI không trả về knowledge_atoms.");
  }
  return parsed;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!OPENAI_API_KEY) return json({ ok:false, error:"Missing OPENAI_API_KEY" }, 500);

  let docId = "";
  try {
    const user = await requireStaff(req);
    const body = await req.json();
    docId = String(body.document_id || "");
    if (!docId) return json({ ok:false, error:"Thiếu document_id" }, 400);

    const { data: doc, error: de } = await admin.from("brain_documents").select("*").eq("id", docId).single();
    if (de || !doc) return json({ ok:false, error:"Không tìm thấy tài liệu" }, 404);

    await admin.from("brain_documents").update({
      status:"learning", error_message:null
    }).eq("id",docId);

    await admin.from("brain_learning_jobs").insert({
      document_id:docId,status:"running",progress:10,message:"Đang đọc toàn bộ tài liệu..."
    });

    const { data:file, error:fe } = await admin.storage.from("electronic-brain").download(doc.storage_path);
    if (fe || !file) throw new Error("Không đọc được file từ Storage");

    const isImage = String(doc.mime_type || "").startsWith("image/");
    const openaiFile = isImage ? null : await openAIFile(file, doc.file_name);
    await admin.from("brain_learning_jobs").update({
      progress:25,message:"Đã nạp tài liệu vào AI, đang trích xuất kiến thức..."
    }).eq("document_id",docId).eq("status","running");

    const learned = await extractKnowledge(openaiFile?.id || "", doc.file_name, String(doc.mime_type || ""), file);
    const atoms = Array.isArray(learned.knowledge_atoms) ? learned.knowledge_atoms : [];
    const rels = Array.isArray(learned.relationships) ? learned.relationships : [];

    // Idempotent re-learn: remove old knowledge for this document first.
    await admin.from("brain_relationships").delete().eq("document_id",docId);
    await admin.from("brain_knowledge").delete().eq("document_id",docId);

    const inserted: any[] = [];
    for (const a of atoms) {
      const row = {
        document_id: docId,
        knowledge_type: String(a.knowledge_type || "general"),
        title: String(a.title || "").slice(0,500),
        content: String(a.content || "").slice(0,12000),
        device_model: String(a.device_model || "").slice(0,200) || null,
        component_ref: String(a.component_ref || "").slice(0,200) || null,
        net_name: String(a.net_name || "").slice(0,300) || null,
        tags: Array.isArray(a.tags) ? a.tags.slice(0,30).map((x:string)=>String(x).slice(0,80)) : [],
        source_page: Number(a.source_page || 0) || null,
        source_locator: String(a.source_locator || "").slice(0,500) || null,
        confidence: Math.max(0,Math.min(100,Number(a.confidence||80)))
      };
      if (!row.title || !row.content) continue;
      const { data, error } = await admin.from("brain_knowledge").insert(row).select("id,title").single();
      if (!error && data) inserted.push(data);
    }

    // Resolve relationships by exact title, scoped to this document.
    for (const rel of rels) {
      const from = inserted.find(x => x.title === String(rel.from_title||""));
      const to = inserted.find(x => x.title === String(rel.to_title||""));
      if (!from || !to || from.id === to.id) continue;
      await admin.from("brain_relationships").upsert({
        document_id:docId,
        from_knowledge_id:from.id,
        to_knowledge_id:to.id,
        relation:String(rel.relation||"related_to").slice(0,200),
        confidence:Math.max(0,Math.min(100,Number(rel.confidence||80)))
      },{onConflict:"from_knowledge_id,to_knowledge_id,relation"});
    }

    await admin.from("brain_documents").update({
      status:"completed",
      model:MODEL,
      summary:String(learned.document_summary||"").slice(0,20000),
      pages_learned:Number(learned.pages_learned||0),
      atoms_learned:inserted.length,
      relationships_learned:rels.length,
      learned_at:new Date().toISOString(),
      metadata:{openai_file_id:openaiFile?.id || null, input_type: isImage ? "image" : "file"}
    }).eq("id",docId);

    await admin.from("brain_learning_jobs").update({
      status:"completed",progress:100,message:`Đã hấp thụ ${inserted.length} knowledge atoms.`,updated_at:new Date().toISOString()
    }).eq("document_id",docId).eq("status","running");

    return json({
      ok:true,
      document_id:docId,
      status:"completed",
      atoms_learned:inserted.length,
      relationships_learned:rels.length,
      summary:learned.document_summary||""
    });
  } catch (e) {
    console.error(e);
    if (docId) {
      await admin.from("brain_documents").update({status:"failed",error_message:String((e as Error)?.message||e).slice(0,2000)}).eq("id",docId);
      await admin.from("brain_learning_jobs").update({status:"failed",progress:100,message:String((e as Error)?.message||e).slice(0,1000),updated_at:new Date().toISOString()}).eq("document_id",docId).eq("status","running");
    }
    return json({ok:false,error:(e as Error)?.message||"Brain learning failed"},500);
  }
});
