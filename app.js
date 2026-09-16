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
  const STYLE_ID='apple-seed-mobile-layout-hotfix-v3';
  function install(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
@media (max-width:760px){
  html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;}

  /* THE REAL PREMIUM HERO: never allow desktop 2-column geometry on phones. */
  #apple-seed-premium-home,
  #apple-seed-premium-home .as3-wrap,
  #apple-seed-premium-home .as3-main{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }
  #apple-seed-premium-home{overflow:hidden!important;}
  #apple-seed-premium-home .as3-wrap{padding:0 16px!important;margin:0!important;}
  #apple-seed-premium-home .as3-main{
    display:flex!important;
    flex-direction:column!important;
    align-items:stretch!important;
    justify-content:flex-start!important;
    gap:18px!important;
    margin:0!important;
    padding:0!important;
    transform:none!important;
    position:relative!important;
    left:auto!important;
    right:auto!important;
  }

  /* Stage = banner only. Copy = text/buttons below banner. */
  #apple-seed-premium-home .as3-main > .as3-stage{
    order:1!important;
    display:block!important;
    position:relative!important;
    flex:none!important;
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    height:auto!important;
    min-height:0!important;
    aspect-ratio:16/9!important;
    margin:0!important;
    padding:0!important;
    inset:auto!important;
    transform:none!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
  }
  #apple-seed-premium-home .as3-main > .as3-copy{
    order:2!important;
    display:block!important;
    position:relative!important;
    flex:none!important;
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    height:auto!important;
    margin:0!important;
    padding:0!important;
    inset:auto!important;
    transform:none!important;
    box-sizing:border-box!important;
  }

  /* Fallback if an inner wrapper is the actual grid/flex parent. */
  #apple-seed-premium-home .as3-stage,
  #apple-seed-premium-home .as3-copy{
    min-width:0!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }
  #apple-seed-premium-home .as3-copy *{max-width:100%!important;box-sizing:border-box!important;}
  #apple-seed-premium-home .as3-copy h1,
  #apple-seed-premium-home .as3-copy h2,
  #apple-seed-premium-home .as3-copy h3{overflow-wrap:anywhere!important;word-break:normal!important;}
  #apple-seed-premium-home .as3-copy p{overflow-wrap:anywhere!important;}

  /* Slider, when present, fills the stage instead of inheriting desktop sizing. */
  #apple-seed-premium-home .apple-seed-hero-slider{
    position:absolute!important;
    inset:0!important;
    width:100%!important;
    height:100%!important;
    max-width:none!important;
    margin:0!important;
    border-radius:14px!important;
  }
  #apple-seed-premium-home .apple-seed-hero-track{width:100%!important;height:100%!important;}
  #apple-seed-premium-home .apple-seed-hero-slide{width:100%!important;height:100%!important;}
  #apple-seed-premium-home .apple-seed-hero-slide img{width:100%!important;height:100%!important;object-fit:cover!important;}

  /* ORIGINAL desktop stage: stack its two direct visual blocks vertically. */
  #apple-seed-premium-home .as3-stage:not(.apple-seed-slider-active){
    display:flex!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
  }
  #apple-seed-premium-home .as3-stage:not(.apple-seed-slider-active) > .as3-phone{
    position:relative!important;
    inset:auto!important;
    width:min(100%,360px)!important;
    max-width:100%!important;
    height:auto!important;
    margin:0 auto!important;
    transform:none!important;
  }

  /* Header remains full-width on iPhone. */
  .site-header{position:relative!important;top:auto!important;left:auto!important;right:auto!important;width:100%!important;height:auto!important;min-height:0!important;}
  body{padding-top:0!important;}
  .site-header .nav{width:100%!important;height:auto!important;min-height:0!important;padding:10px 16px 8px!important;gap:8px!important;box-sizing:border-box!important;}
  .site-header .brand{width:100%!important;min-width:0!important;gap:9px!important;}
  .site-header .brand img{width:48px!important;height:48px!important;}
  .site-header .brand-title{font-size:21px!important;}
  .site-header .brand-sub{font-size:10px!important;margin-top:4px!important;letter-spacing:1.4px!important;}
  .site-header .menu{width:100%!important;height:auto!important;min-height:38px!important;gap:8px!important;justify-content:space-between!important;}
  .site-header .menu a{flex:1 1 0!important;justify-content:center!important;min-width:0!important;}
}
`;
    (document.head||document.documentElement).appendChild(style);
  }

  function repair(){
    if(window.innerWidth>760)return;
    install();
    const root=document.getElementById('apple-seed-premium-home');
    if(!root)return;
    const wrap=root.querySelector('.as3-wrap');
    const main=root.querySelector('.as3-main');
    const stage=root.querySelector('.as3-stage');
    const copy=root.querySelector('.as3-copy');

    [root,wrap,main,stage,copy].forEach(function(el){
      if(!el)return;
      el.style.setProperty('max-width','100%','important');
      el.style.setProperty('min-width','0','important');
      el.style.setProperty('box-sizing','border-box','important');
    });

    if(main){
      main.style.setProperty('display','flex','important');
      main.style.setProperty('flex-direction','column','important');
      main.style.setProperty('align-items','stretch','important');
      main.style.setProperty('justify-content','flex-start','important');
      main.style.setProperty('width','100%','important');
      main.style.setProperty('margin','0','important');
      main.style.setProperty('transform','none','important');
      main.style.setProperty('position','relative','important');
    }
    if(stage){
      stage.style.setProperty('order','1','important');
      stage.style.setProperty('width','100%','important');
      stage.style.setProperty('height','auto','important');
      stage.style.setProperty('aspect-ratio','16 / 9','important');
      stage.style.setProperty('margin','0','important');
      stage.style.setProperty('padding','0','important');
      stage.style.setProperty('transform','none','important');
      stage.style.setProperty('position','relative','important');
      stage.style.setProperty('inset','auto','important');
    }
    if(copy){
      copy.style.setProperty('order','2','important');
      copy.style.setProperty('width','100%','important');
      copy.style.setProperty('height','auto','important');
      copy.style.setProperty('margin','0','important');
      copy.style.setProperty('padding','0','important');
      copy.style.setProperty('transform','none','important');
      copy.style.setProperty('position','relative','important');
      copy.style.setProperty('inset','auto','important');
    }

    /* If stage/copy share a different parent, make that parent the mobile column. */
    if(stage&&copy){
      const parent=stage.parentElement===copy.parentElement?stage.parentElement:null;
      if(parent){
        parent.style.setProperty('display','flex','important');
        parent.style.setProperty('flex-direction','column','important');
        parent.style.setProperty('align-items','stretch','important');
        parent.style.setProperty('width','100%','important');
        parent.style.setProperty('max-width','100%','important');
        parent.style.setProperty('min-width','0','important');
      }
    }
  }

  function boot(){
    install();
    repair();
    new MutationObserver(repair).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    window.addEventListener('resize',repair,{passive:true});
    window.addEventListener('orientationchange',function(){setTimeout(repair,100)},{passive:true});
    setInterval(repair,750);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

loadAppleSeedContent();
