/* Apple Seed homepage runtime resilience v2
 * UI-only fallback: never touches Supabase data.
 * If the CMS renderer is slow/unavailable, restore a functional home
 * surface with the shop map, contact links and core navigation.
 */
(function(){
  "use strict";

  const ROOT_ID = "homeRenderer";
  const FALLBACK_MARK = "data-apple-seed-home-fallback";

  function esc(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c];
    });
  }

  function fallbackHtml(){
    return '';
  }

  function addStyles(){
    if(document.getElementById("apple-seed-home-runtime-style")) return;
    const style=document.createElement("style");
    style.id="apple-seed-home-runtime-style";
    style.textContent=`
      .as-fallback-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
      .as-fallback-secondary{
        display:inline-flex;align-items:center;justify-content:center;min-height:50px;
        padding:14px 20px;border-radius:15px;border:1px solid #cfe0f6;
        background:#fff;color:#1769ff;font-weight:900;text-decoration:none
      }
      .as-fallback-secondary:hover{background:#f4f8ff}
      .as-home-fallback .map-card iframe{min-height:300px}
      @media(max-width:560px){
        .as-fallback-actions{display:grid;grid-template-columns:1fr}
        .as-fallback-actions a{width:100%}
        .as-home-fallback .map-card iframe{min-height:270px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderFallback(reason){
    const root=document.getElementById(ROOT_ID);
    if(!root) return false;
    root.innerHTML='';
    root.dataset.appleSeedHomeFallbackReason=reason||'unknown';
    document.dispatchEvent(new CustomEvent('appleSeedHomeFallbackReady'));
    return true;
  }

  function isStillLoading(){
    const root=document.getElementById(ROOT_ID);
    if(!root) return false;
    return /Đang tải Apple Seed/i.test(root.textContent||"");
  }

  function wireCoreNavigation(){
    document.addEventListener("click",function(e){
      const link=e.target && e.target.closest ? e.target.closest("a") : null;
      if(!link) return;
      const href=link.getAttribute("href")||"";
      if(!href.startsWith("#")) return;
      const target=document.querySelector(href);
      if(!target) return;
      e.preventDefault();
      const header=document.querySelector(".ui01-header");
      const offset=(header ? header.offsetHeight : 86)+8;
      const y=target.getBoundingClientRect().top+window.pageYOffset-offset;
      window.scrollTo({top:Math.max(0,y),behavior:"smooth"});
      try{history.replaceState(null,"",href)}catch(_){}
    },false);
  }

  function start(){
    const root=document.getElementById(ROOT_ID);
    if(!root) return;

    wireCoreNavigation();

    // Give the CMS a short head start, then guarantee a usable page.
    setTimeout(function(){
      if(isStillLoading()) renderFallback("cms-timeout");
    },900);

    // Watch the placeholder itself so a slow/failed renderer cannot leave a blank home.
    const observer=new MutationObserver(function(){
      if(isStillLoading()) renderFallback("cms-placeholder");
    });
    observer.observe(root,{childList:true,subtree:true,characterData:true});
    setTimeout(function(){ observer.disconnect(); },12000);

    // If an earlier script fails before replacing the placeholder, recover.
    window.addEventListener("error",function(){
      if(isStillLoading()) renderFallback("runtime-error");
    },false);

    window.addEventListener("unhandledrejection",function(){
      if(isStillLoading()) renderFallback("promise-rejection");
    },false);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }

  window.AppleSeedHomeRuntime={
    renderFallback:renderFallback,
    getStatus:function(){
      const root=document.getElementById(ROOT_ID);
      return root ? {fallback:!!root.querySelector("["+FALLBACK_MARK+"]"),loading:isStillLoading()} : {missing:true};
    }
  };
})();