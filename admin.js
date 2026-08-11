let sections=[],current=null;
const listEl=document.getElementById("sectionList"),titleEl=document.getElementById("title"),contentEl=document.getElementById("content"),imageEl=document.getElementById("image_url"),statusEl=document.getElementById("status"),userbar=document.getElementById("userbar");
function status(t,e=false){statusEl.textContent=t;statusEl.className="status"+(e?" error":"")}
async function requireAdmin(){
 const {data:{user},error}=await supabaseClient.auth.getUser();
 if(error||!user){location.href="login.html";return null}
 const {data:p,error:pe}=await supabaseClient.from("profiles").select("role").eq("id",user.id).single();
 if(pe||!p||!["admin","staff"].includes(p.role)){await supabaseClient.auth.signOut();location.href="login.html";return null}
 userbar.textContent=`${user.email} • quyền ${p.role}`;return user;
}
function renderList(){
 listEl.innerHTML="";
 sections.forEach(item=>{
  const b=document.createElement("button");b.textContent=item.section;
  if(current&&current.id===item.id)b.classList.add("active");
  b.onclick=()=>selectSection(item.id);listEl.appendChild(b);
 });
}
function selectSection(id){
 current=sections.find(x=>x.id===id);if(!current)return;
 titleEl.value=current.title||"";contentEl.value=current.content||"";imageEl.value=current.image_url||"";status("");renderList();
}
async function loadContent(){
 status("Đang tải...");
 const {data,error}=await supabaseClient.from("site_content").select("id,section,title,content,image_url,updated_at").order("id");
 if(error){status(error.message,true);return}
 sections=data||[];renderList();if(sections.length)selectSection(sections[0].id);else status("Chưa có nội dung.",true);
}
document.getElementById("saveBtn").onclick=async()=>{
 if(!current)return;status("Đang lưu...");
 const {error}=await supabaseClient.from("site_content").update({
  title:titleEl.value.trim(),content:contentEl.value.trim(),image_url:imageEl.value.trim()||null,updated_at:new Date().toISOString()
 }).eq("id",current.id);
 if(error){status(error.message,true);return}
 current.title=titleEl.value.trim();current.content=contentEl.value.trim();current.image_url=imageEl.value.trim()||null;status("✓ Đã lưu.");
};
document.getElementById("logoutBtn").onclick=async()=>{await supabaseClient.auth.signOut();location.href="login.html"};
(async()=>{const u=await requireAdmin();if(u)await loadContent()})();
