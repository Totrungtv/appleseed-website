async function loadAppleSeedContent(){
 const {data,error}=await supabaseClient.from("site_content").select("section,title,content,image_url");
 if(error){console.warn("AppleSeed CMS:",error.message);return}
 const by=Object.fromEntries((data||[]).map(x=>[x.section,x]));
if(by.hero){
  const h = document.querySelector(".hero h1");
  const p = document.querySelector(".hero p");
  const img = document.getElementById("heroImage");

  if(h && by.hero.title){
    h.textContent = by.hero.title;
  }

  if(p && by.hero.content){
    p.textContent = by.hero.content;
  }

if (img && by.hero.image_url) {
  const imageUrl = by.hero.image_url;

  img.style.display = "block";

  img.onerror = () => {
    console.log("Ảnh lỗi:", imageUrl);

    // Đổi render URL → object public URL
    const fallbackUrl = imageUrl.replace(
      "/storage/v1/render/image/public/",
      "/storage/v1/object/public/"
    );

    if (fallbackUrl !== imageUrl) {
      img.src = fallbackUrl + "?v=" + Date.now();
    }
  };

  img.onload = () => {
    console.log("Ảnh hero đã tải OK");
  };

  img.src = imageUrl + "?v=" + Date.now();
}
}
 if(by.about){
  const h=document.querySelector("#gioi-thieu h2"),p=document.querySelector("#gioi-thieu p");
  if(h&&by.about.title)h.textContent=by.about.title;
  if(p&&by.about.content)p.textContent=by.about.content;
 }
 if(by.contact){
  const h=document.querySelector("#lien-he h2"),p=document.querySelector("#lien-he p");
  if(h&&by.contact.title)h.textContent=by.contact.title;
  if(p&&by.contact.content)p.textContent=by.contact.content;
 }
}
loadAppleSeedContent();
