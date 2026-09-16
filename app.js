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

/* Apple Seed mobile layout hotfix — fix hero grid overflowing off iPhone screens. */
(function(){
  if(document.getElementById('apple-seed-mobile-layout-hotfix')) return;
  const style=document.createElement('style');
  style.id='apple-seed-mobile-layout-hotfix';
  style.textContent=`
@media (max-width:760px){
  html,body{width:100%;max-width:100%;overflow-x:hidden!important;}
  .hero{width:100%;padding:28px 16px 36px!important;overflow:hidden!important;}
  .hero-inner{width:100%!important;max-width:100%!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:24px!important;margin:0!important;}
  .hero-inner > *{width:100%!important;min-width:0!important;max-width:100%!important;}
  .shop-photo{width:100%!important;max-width:100%!important;height:auto!important;aspect-ratio:auto!important;object-fit:contain!important;border-radius:14px!important;}
  .eyebrow{font-size:11px!important;letter-spacing:2px!important;margin-bottom:10px!important;}
  .hero h1,h1{font-size:clamp(34px,10vw,48px)!important;line-height:1.02!important;letter-spacing:-1.2px!important;overflow-wrap:anywhere!important;}
  .lead{max-width:100%!important;margin:16px 0 20px!important;font-size:16px!important;line-height:1.55!important;}
  .cta{width:100%!important;justify-content:center!important;min-height:50px!important;}
  .trust{grid-template-columns:1fr!important;gap:12px!important;margin-top:24px!important;}
  .services,.contact{padding-left:16px!important;padding-right:16px!important;}
  .service-grid,.products-home-grid{grid-template-columns:1fr!important;}
}
`;
  (document.head||document.documentElement).appendChild(style);
})();

loadAppleSeedContent();
