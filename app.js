async function loadAppleSeedContent(){
 const {data,error}=await supabaseClient.from("site_content").select("section,title,content,image_url");
 if(error){console.warn("AppleSeed CMS:",error.message);return}
 const by=Object.fromEntries((data||[]).map(x=>[x.section,x]));
if(by.hero){
  const h = document.querySelector(".hero h1");
  const p = document.querySelector(".hero p");
  const img = document.getElementById("heroImage");

  if(h && by.hero.title) h.textContent = by.hero.title;
  if(p && by.hero.content) p.textContent = by.hero.content;

  if (img && by.hero.image_url) {
    const imageUrl = by.hero.image_url;
    img.style.display = "block";
    img.onerror = () => {
      console.log("Ảnh lỗi:", imageUrl);
      const fallbackUrl = imageUrl.replace("/storage/v1/render/image/public/","/storage/v1/object/public/");
      if (fallbackUrl !== imageUrl) img.src = fallbackUrl + "?v=" + Date.now();
    };
    img.onload = () => console.log("Ảnh hero đã tải OK");
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

(function(){
  const STYLE_ID='apple-seed-mobile-layout-hotfix-v2';
  function install(){
    if(!document.getElementById(STYLE_ID)){
      const style=document.createElement('style');
      style.id=STYLE_ID;
      style.textContent=`
@media (max-width:760px){
  html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;}

  /* Premium hero: force the actual stage and copy into a vertical mobile flow. */
  #apple-seed-premium-home{width:100%!important;max-width:100%!important;overflow:hidden!important;}
  #apple-seed-premium-home .as3-wrap{width:100%!important;max-width:100%!important;margin:0!important;padding:0 16px!important;box-sizing:border-box!important;}
  #apple-seed-premium-home .as3-main{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:0!important;gap:18px!important;transform:none!important;box-sizing:border-box!important;}
  #apple-seed-premium-home .as3-main > .as3-stage{order:1!important;flex:0 0 auto!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0 auto!important;}
  #apple-seed-premium-home .as3-main > .as3-copy{order:2!important;flex:0 0 auto!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important;}
  #apple-seed-premium-home .as3-copy{width:100%!important;max-width:100%!important;min-width:0!important;}
  #apple-seed-premium-home .as3-copy *{max-width:100%!important;box-sizing:border-box!important;}

  #apple-seed-premium-home .as3-stage,
  #apple-seed-premium-home .as3-stage.apple-seed-slider-active{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;aspect-ratio:16/9!important;margin:0 auto 4px!important;padding:0!important;transform:none!important;box-sizing:border-box!important;overflow:hidden!important;}
  #apple-seed-premium-home .apple-seed-hero-slider{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important;border-radius:14px!important;}
  #apple-seed-premium-home .apple-seed-hero-slide img{width:100%!important;height:100%!important;display:block!important;object-position:center center!important;}

  /* Make the mobile copy readable and prevent the desktop right-column geometry. */
  #apple-seed-premium-home .as3-copy h1,
  #apple-seed-premium-home .as3-copy h2,
  #apple-seed-premium-home .as3-copy h3{max-width:100%!important;overflow-wrap:anywhere!important;word-break:normal!important;}
  #apple-seed-premium-home .as3-copy p{max-width:100%!important;}
  #apple-seed-premium-home .as3-copy .cta,
  #apple-seed-premium-home .as3-copy a[class*="cta"],
  #apple-seed-premium-home .as3-copy button{max-width:100%!important;}

  /* Compact the mobile header so the hero is not pushed far below the fold. */
  .site-header{position:relative!important;top:auto!important;left:auto!important;right:auto!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important;}
  body{padding-top:0!important;}
  .site-header .nav{width:100%!important;height:auto!important;min-height:0!important;padding:10px 16px 8px!important;gap:8px!important;box-sizing:border-box!important;}
  .site-header .brand{min-width:0!important;width:100%!important;gap:9px!important;}
  .site-header .brand img{width:48px!important;height:48px!important;}
  .site-header .brand-title{font-size:21px!important;}
  .site-header .brand-sub{font-size:10px!important;margin-top:4px!important;letter-spacing:1.4px!important;}
  .site-header .menu{width:100%!important;gap:8px!important;height:auto!important;min-height:38px!important;justify-content:space-between!important;}
  .site-header .menu a{flex:1 1 0!important;justify-content:center!important;min-width:0!important;}
}
`;
      (document.head||document.documentElement).appendChild(style);
    }
  }

  function repair(){
    if(window.innerWidth>760)return;
    install();
    const hero=document.getElementById('apple-seed-premium-home');
    if(!hero)return;
    const stage=hero.querySelector('.as3-stage');
    const copy=hero.querySelector('.as3-copy');
    const main=hero.querySelector('.as3-main');

    if(main){
      main.style.setProperty('display','flex','important');
      main.style.setProperty('flex-direction','column','important');
      main.style.setProperty('align-items','stretch','important');
      main.style.setProperty('width','100%','important');
      main.style.setProperty('max-width','100%','important');
      main.style.setProperty('min-width','0','important');
      main.style.setProperty('margin','0','important');
      main.style.setProperty('transform','none','important');
    }

    if(stage){
      stage.style.setProperty('order','1','important');
      stage.style.setProperty('width','100%','important');
      stage.style.setProperty('max-width','100%','important');
      stage.style.setProperty('min-width','0','important');
      stage.style.setProperty('height','auto','important');
      stage.style.setProperty('aspect-ratio','16 / 9','important');
      stage.style.setProperty('margin','0 auto 4px','important');
      stage.style.setProperty('transform','none','important');
    }
    if(copy){
      copy.style.setProperty('order','2','important');
      copy.style.setProperty('width','100%','important');
      copy.style.setProperty('max-width','100%','important');
      copy.style.setProperty('min-width','0','important');
      copy.style.setProperty('margin','0','important');
      copy.style.setProperty('transform','none','important');
    }

    /* If a wrapper other than .as3-main is controlling the grid, neutralize it. */
    if(stage && copy && stage.parentElement===copy.parentElement){
      const p=stage.parentElement;
      p.style.setProperty('display','flex','important');
      p.style.setProperty('flex-direction','column','important');
      p.style.setProperty('align-items','stretch','important');
      p.style.setProperty('width','100%','important');
      p.style.setProperty('max-width','100%','important');
      p.style.setProperty('min-width','0','important');
    }
  }

  function boot(){
    install();
    repair();
    const obs=new MutationObserver(repair);
    obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    window.addEventListener('resize',repair,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(repair,80),{passive:true});
    setInterval(repair,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

loadAppleSeedContent();
