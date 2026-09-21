import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json"
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SECRET = (() => {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) { try { const x = JSON.parse(raw); if (x?.default) return String(x.default); } catch (_) {} }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
})();
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-5.6-luna";
const admin = createClient(SUPABASE_URL, SECRET);

function json(x: unknown, status=200){ return new Response(JSON.stringify(x), {status, headers:cors}); }

async function auth(req: Request){
  const h=req.headers.get("Authorization");
  if(!h) throw new Error("Login required");
  const c=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{global:{headers:{Authorization:h}}});
  const {data:{user},error}=await c.auth.getUser();
  if(error||!user) throw new Error("Login required");
  return user;
}

function cleanMessages(messages:any[]){
  return (Array.isArray(messages)?messages:[]).slice(-24).map(m=>({
    role:m?.role==="assistant"?"assistant":"user",
    content:String(m?.content||"").slice(0,12000)
  })).filter(m=>m.content.trim());
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(!OPENAI_API_KEY||!SECRET) return json({ok:false,error:"Server AI chưa cấu hình đầy đủ."},500);
  try{
    await auth(req);
    const body=await req.json();
    const message=String(body.message||"").trim();
    const history=cleanMessages(body.messages);
    const imageData=typeof body.image_data==="string"&&body.image_data.startsWith("data:image/")?body.image_data:"";
    if(!message && !imageData) return json({ok:false,error:"Tin nhắn trống."},400);

    const q=(message||"ảnh board iPhone")+" "+history.slice(-4).map(x=>x.content).join(" ").slice(0,5000);
    const {data:brain,error:be}=await admin.rpc("brain_search",{p_query:q,p_limit:14});
    if(be) console.warn("brain_search:",be.message);
    const knowledge=(brain||[]).map((x:any)=>({
      title:x.title, type:x.knowledge_type, content:x.content,
      model:x.device_model, component:x.component_ref, net:x.net_name,
      confidence:x.confidence, source_page:x.source_page, verification:x.verification_status
    }));

    const { data: runtime } = await admin
      .from("ai_robot_runtime")
      .select("reasoning_version,brain_version,toolset_version,current_focus,reasoning_guidance")
      .eq("id",1)
      .maybeSingle();

    const runtimeGuidance = runtime?.reasoning_guidance
      ? `\\n\\n=== RUNTIME EVOLUTION ENGINE v${runtime.reasoning_version || 1} ===\\nFocus: ${runtime.current_focus || "Electronic Brain"}\\nGuidance cập nhật nền: ${String(runtime.reasoning_guidance).slice(0,7000)}\\nHãy áp dụng guidance như nguyên tắc suy luận bổ sung; không coi nó là bằng chứng hiện tại.\\n`
      : "";

    const system = `Bạn là Apple Seed Repair Robot — trợ lý board-level của kỹ thuật viên Apple Seed.
Bạn có một Electronic Brain được học từ tài liệu kỹ thuật. Hãy dùng kiến thức đó để SUY LUẬN, không phải đọc lại tài liệu.
Không bị ép theo một cấu trúc cố định. Tự chọn đường suy luận phù hợp với từng ca.
Phân biệt rõ:
- EVIDENCE: dữ liệu người dùng cung cấp/đo được.
- BRAIN KNOWLEDGE: kiến thức đã học từ tài liệu.
- INFERENCE: suy luận của bạn.
Không bịa sơ đồ, giá trị đo, linh kiện hoặc quan hệ chưa có bằng chứng.
Khi thiếu dữ liệu, hãy nói chính xác cần đo gì và vì sao phép đo đó giúp phân biệt các khả năng.
Nếu kiến thức Brain mâu thuẫn, nêu mâu thuẫn thay vì tự chọn bừa.
Ưu tiên câu trả lời thực chiến, board-level, có thứ tự kiểm tra hợp lý nhưng không máy móc.
Nếu người dùng chỉ muốn trò chuyện/hỏi kiến thức, trả lời tự nhiên.
`;

    const brainText=knowledge.length
      ? "\n\n=== ELECTRONIC BRAIN ===\n"+knowledge.map((x:any,i:number)=>`[${i+1}] ${x.title} | ${x.type} | model=${x.model||"-"} | confidence=${x.confidence}\n${x.content}`).join("\n")
      : "\n\n=== ELECTRONIC BRAIN ===\nChưa tìm thấy kiến thức khớp trực tiếp. Không được giả vờ rằng Brain đã có.";

    const inputContent:any[]=[
      {type:"input_text",text:system+brainText+"\n\nTin nhắn hiện tại:\n"+message}
    ];
    if(imageData) inputContent.push({type:"input_image",image_url:imageData,detail:"high"});

    const input=[
      ...history.slice(-12).map(m=>({role:m.role,content:[{type:"input_text",text:m.content}]})),
      {role:"user",content:inputContent}
    ];

    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:MODEL,store:false,
        reasoning:{effort:"low"},
        input,
        max_output_tokens:6000
      })
    });
    const t=await r.text();
    if(!r.ok) throw new Error("OpenAI: "+t.slice(0,800));
    const out=JSON.parse(t);
    const answer=out.output_text || (Array.isArray(out.output)
      ? out.output.flatMap((x:any)=>Array.isArray(x.content)?x.content:[]).filter((x:any)=>x?.type==="output_text").map((x:any)=>x.text).join("\n")
      : "");
    if(!answer.trim()) throw new Error("AI không trả về nội dung.");
    return json({ok:true,answer,brain_hits:knowledge.length,model:MODEL});
  }catch(e){
    console.error(e);
    return json({ok:false,error:(e as Error)?.message||String(e)},500);
  }
});