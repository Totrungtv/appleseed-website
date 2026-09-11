/* Apple Seed Hero Branding V2 — exact premium banner typography/features on every slide. */
(function(){
  'use strict';
  var STYLE_ID='apple-seed-hero-branding-v2-css';
  function css(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
.apple-seed-hero-caption.as-branding-fixed{
  left:7%!important;bottom:8%!important;max-width:78%!important;padding:0!important;
  border:0!important;border-radius:0!important;background:none!important;color:#fff!important;
  text-shadow:0 3px 18px rgba(0,0,0,.95)!important;z-index:20!important;pointer-events:none!important;
}
.apple-seed-hero-caption.as-branding-fixed .as-brand-title{
  font-size:clamp(30px,4.2vw,60px)!important;line-height:.98!important;font-weight:950!important;
  letter-spacing:-1.4px!important;margin:0 0 9px!important;
}
.apple-seed-hero-caption.as-branding-fixed .as-brand-sub{
  font-size:clamp(10px,1.25vw,17px)!important;font-weight:850!important;
  letter-spacing:4px!important;margin:0 0 9px!important;
}
.apple-seed-hero-caption.as-branding-fixed .as-brand-desc{
  font-size:clamp(8px,.9vw,13px)!important;font-weight:700!important;
  letter-spacing:2.4px!important;opacity:.96!important;margin:0 0 15px!important;
}
.apple-seed-hero-caption.as-branding-fixed .as-brand-features{
  display:flex!important;gap:20px!important;align-items:flex-start!important;flex-wrap:wrap!important;
  font-size:clamp(7px,.72vw,10px)!important;letter-spacing:1px!important;font-weight:800!important;
}
.apple-seed-hero-caption.as-branding-fixed .as-brand-feature{
  display:flex!important;flex-direction:column!important;align-items:center!important;gap:5px!important;
  min-width:64px!important;white-space:nowrap!important;
}
.apple-seed-hero-caption.as-branding-fixed .as-brand-feature i{
  width:28px;height:28px;display:grid;place-items:center;font-style:normal;
  font-size:22px;line-height:1;filter:drop-shadow(0 2px 5px rgba(0,0,0,.7));
}
@media(max-width:760px){
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed{
    display:block!important;left:6%!important;bottom:11%!important;max-width:82%!important;
    padding:0!important;background:none!important;border:0!important;
  }
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-title{
    font-size:27px!important;line-height:1!important;letter-spacing:-.7px!important;margin:0 0 4px!important;
  }
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-sub{
    font-size:8px!important;letter-spacing:2px!important;margin:0 0 4px!important;
  }
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-desc{
    font-size:7px!important;letter-spacing:1px!important;margin:0 0 8px!important;
  }
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-features{
    gap:7px!important;font-size:5.5px!important;letter-spacing:.5px!important;
  }
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-feature{
    min-width:43px!important;gap:2px!important;
  }
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-feature i{
    width:19px;height:19px;font-size:15px;
  }
}`;
    document.head.appendChild(s);
  }
  function brand(slider){
    if(!slider)return;
    css();
    slider.querySelectorAll('.apple-seed-hero-slide').forEach(function(slide){
      var cap=slide.querySelector('.apple-seed-hero-caption');
      if(!cap){cap=document.createElement('div');cap.className='apple-seed-hero-caption';slide.appendChild(cap);}
      cap.classList.add('as-branding-fixed');
      cap.innerHTML='<div class="as-brand-title">APPLE SEED</div>'
        +'<div class="as-brand-sub">PREMIUM IPHONE REPAIR</div>'
        +'<div class="as-brand-desc">REPAIR TODAY · A BETTER TOMORROW</div>'
        +'<div class="as-brand-features">'
        +'<div class="as-brand-feature"><i>⚙</i><span>DIAGNOSTIC</span></div>'
        +'<div class="as-brand-feature"><i>▣</i><span>MAINBOARD</span></div>'
        +'<div class="as-brand-feature"><i>⌘</i><span>FACE ID</span></div>'
        +'<div class="as-brand-feature"><i>◇</i><span>PREMIUM CARE</span></div>'
        +'</div>';
    });
  }
  function run(){brand(document.querySelector('#apple-seed-premium-home .apple-seed-hero-slider'));}
  function boot(){run();var obs=new MutationObserver(run);obs.observe(document.documentElement,{childList:true,subtree:true});setInterval(run,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
