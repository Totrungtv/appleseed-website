/* Apple Seed Hero Branding V1 — force premium text on every slider image. */
(function(){
  'use strict';
  var STYLE_ID='apple-seed-hero-branding-v1-css';
  function css(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
.apple-seed-hero-caption.as-branding-fixed{left:7%!important;bottom:9%!important;max-width:72%!important;padding:0!important;border:0!important;border-radius:0!important;background:none!important;color:#fff!important;text-shadow:0 3px 16px rgba(0,0,0,.9)!important;z-index:20!important;}
.apple-seed-hero-caption.as-branding-fixed .as-brand-k{font-size:clamp(9px,1vw,14px);font-weight:900;letter-spacing:4px;margin-bottom:5px;}
.apple-seed-hero-caption.as-branding-fixed .as-brand-title{font-size:clamp(25px,4vw,58px);line-height:.98;font-weight:950;letter-spacing:-1px;margin:0 0 8px;}
.apple-seed-hero-caption.as-branding-fixed .as-brand-sub{font-size:clamp(9px,1.2vw,16px);font-weight:800;letter-spacing:4px;margin-bottom:7px;}
.apple-seed-hero-caption.as-branding-fixed .as-brand-desc{font-size:clamp(8px,.9vw,13px);font-weight:700;letter-spacing:2px;opacity:.96;}
@media(max-width:760px){
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed{display:block!important;left:6%!important;bottom:13%!important;max-width:78%!important;padding:0!important;background:none!important;border:0!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-k{font-size:7px!important;letter-spacing:2px!important;margin-bottom:3px!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-title{font-size:27px!important;line-height:1!important;margin:0 0 4px!important;letter-spacing:-.5px!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-sub{font-size:8px!important;letter-spacing:2px!important;margin-bottom:4px!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-branding-fixed .as-brand-desc{font-size:7px!important;letter-spacing:1px!important;}
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
      cap.innerHTML='<div class="as-brand-k">APPLE SEED</div><div class="as-brand-title">APPLE SEED</div><div class="as-brand-sub">PREMIUM IPHONE REPAIR</div><div class="as-brand-desc">REPAIR TODAY · A BETTER TOMORROW</div>';
    });
  }
  function run(){brand(document.querySelector('#apple-seed-premium-home .apple-seed-hero-slider'));}
  function boot(){run();var obs=new MutationObserver(run);obs.observe(document.documentElement,{childList:true,subtree:true});setInterval(run,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
