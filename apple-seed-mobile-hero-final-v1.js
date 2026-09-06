/* Apple Seed Mobile Hero Final V6
 * Mobile layout lock + premium branding overlay + single-tap controls.
 */
(function(){
  'use strict';
  var STYLE_ID='apple-seed-mobile-hero-final-v6-css';
  function css(){
    if(document.getElementById(STYLE_ID)) return;
    var style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
@media (max-width:760px){
  html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;}
  .site-header{position:relative!important;top:auto!important;left:auto!important;right:auto!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important;}
  body{padding-top:0!important;}
  #apple-seed-premium-home{width:100%!important;max-width:100%!important;overflow:hidden!important;}
  #apple-seed-premium-home .as3-wrap{width:100%!important;max-width:none!important;padding-left:12px!important;padding-right:12px!important;box-sizing:border-box!important;margin:0!important;}
  #apple-seed-premium-home .as3-main{display:block!important;width:100vw!important;max-width:none!important;min-width:0!important;margin-left:calc(50% - 50vw)!important;margin-right:0!important;padding:0!important;transform:none!important;box-sizing:border-box!important;}
  #apple-seed-premium-home .as3-copy{width:100%!important;max-width:100%!important;padding:0 12px!important;box-sizing:border-box!important;}
  #apple-seed-premium-home .as3-stage,
  #apple-seed-premium-home .as3-stage.apple-seed-slider-active{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:calc(100vw - 48px)!important;max-width:none!important;min-width:0!important;height:auto!important;min-height:0!important;aspect-ratio:16/9!important;margin:18px auto 24px!important;padding:0!important;transform:none!important;transform-origin:center center!important;box-sizing:border-box!important;overflow:hidden!important;display:block!important;}
  #apple-seed-premium-home .apple-seed-hero-slider{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important;border-radius:16px!important;overflow:hidden!important;z-index:100!important;}
  #apple-seed-premium-home .apple-seed-hero-track,#apple-seed-premium-home .apple-seed-hero-slide{width:100%!important;height:100%!important;}
  #apple-seed-premium-home .apple-seed-hero-slide img{display:block!important;width:100%!important;height:100%!important;object-position:center center!important;margin:0!important;}
  #apple-seed-premium-home .apple-seed-hero-caption{display:block!important;position:absolute!important;left:6%!important;bottom:13%!important;max-width:82%!important;padding:0!important;border:0!important;border-radius:0!important;background:none!important;color:#fff!important;text-shadow:0 2px 12px rgba(0,0,0,.95)!important;z-index:20!important;pointer-events:none!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-mobile-branding .as-brand-title{font-size:clamp(25px,7vw,34px)!important;line-height:1!important;font-weight:950!important;letter-spacing:-.5px!important;margin:0 0 5px!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-mobile-branding .as-brand-sub{font-size:clamp(7px,2.2vw,10px)!important;line-height:1.2!important;font-weight:850!important;letter-spacing:2px!important;margin:0 0 5px!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-mobile-branding .as-brand-desc{font-size:clamp(6px,1.8vw,8px)!important;line-height:1.2!important;font-weight:700!important;letter-spacing:1px!important;margin:0!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-mobile-branding .as-mobile-features{display:flex!important;gap:8px!important;margin-top:9px!important;flex-wrap:nowrap!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-mobile-branding .as-mobile-features span{font-size:clamp(5px,1.55vw,7px)!important;font-weight:800!important;letter-spacing:.5px!important;white-space:nowrap!important;}
  #apple-seed-premium-home .apple-seed-hero-caption.as-mobile-branding .as-mobile-features span:before{content:'◆';margin-right:3px;font-size:4px;}
  #apple-seed-premium-home .apple-seed-hero-arrow{display:grid!important;position:absolute!important;top:50%!important;width:40px!important;height:40px!important;z-index:1000!important;transform:translateY(-50%)!important;opacity:1!important;visibility:visible!important;}
  #apple-seed-premium-home .apple-seed-hero-arrow.prev{left:10px!important;}
  #apple-seed-premium-home .apple-seed-hero-arrow.next{right:10px!important;}
}
.apple-seed-hero-slide img.as-hero-fit-contain{object-fit:contain!important;padding:4%!important;}
`;
    document.head.appendChild(style);
  }
  function ensureBranding(slider){
    if(!slider)return;
    slider.querySelectorAll('.apple-seed-hero-slide').forEach(function(slide){
      var cap=slide.querySelector('.apple-seed-hero-caption');
      if(!cap){cap=document.createElement('div');cap.className='apple-seed-hero-caption';slide.appendChild(cap);}
      cap.classList.add('as-mobile-branding');
      cap.innerHTML='<div class="as-brand-title">APPLE SEED</div><div class="as-brand-sub">PREMIUM IPHONE REPAIR</div><div class="as-brand-desc">REPAIR TODAY · A BETTER TOMORROW</div><div class="as-mobile-features"><span>DIAGNOSTIC</span><span>MAINBOARD</span><span>FACE ID</span><span>PREMIUM CARE</span></div>';
    });
  }
  function protectSlider(slider){
    if(!slider)return;
    if(slider.getAttribute('data-as-v6-hotfix')!=='1'){
      slider.setAttribute('data-as-v6-hotfix','1');
      slider.addEventListener('pointerup',function(e){if(e.target&&e.target.closest&&e.target.closest('button'))e.stopPropagation();},true);
      slider.addEventListener('pointerdown',function(e){if(e.target&&e.target.closest&&e.target.closest('button'))e.stopPropagation();},true);
    }
    Array.prototype.forEach.call(slider.querySelectorAll('.apple-seed-hero-slide img'),function(img){
      if((img.style.objectFit||'').toLowerCase()==='contain')img.classList.add('as-hero-fit-contain');
    });
    ensureBranding(slider);
  }
  function lock(){
    if(window.innerWidth>760)return;
    var hero=document.getElementById('apple-seed-premium-home');
    if(!hero)return;
    var main=hero.querySelector('.as3-main');
    var stage=hero.querySelector('.as3-stage.apple-seed-slider-active')||hero.querySelector('.as3-stage');
    if(!main||!stage)return;
    main.style.setProperty('display','block','important');
    main.style.setProperty('width','100vw','important');
    main.style.setProperty('max-width','none','important');
    main.style.setProperty('min-width','0','important');
    main.style.setProperty('margin-left','calc(50% - 50vw)','important');
    main.style.setProperty('margin-right','0','important');
    main.style.setProperty('transform','none','important');
    stage.style.setProperty('position','relative','important');
    stage.style.setProperty('left','auto','important');
    stage.style.setProperty('right','auto','important');
    stage.style.setProperty('width','calc(100vw - 48px)','important');
    stage.style.setProperty('max-width','none','important');
    stage.style.setProperty('min-width','0','important');
    stage.style.setProperty('height','auto','important');
    stage.style.setProperty('min-height','0','important');
    stage.style.setProperty('aspect-ratio','16 / 9','important');
    stage.style.setProperty('margin-left','auto','important');
    stage.style.setProperty('margin-right','auto','important');
    stage.style.setProperty('transform','none','important');
    stage.style.setProperty('padding','0','important');
    stage.style.setProperty('box-sizing','border-box','important');
    stage.style.setProperty('overflow','hidden','important');
    var slider=stage.querySelector('.apple-seed-hero-slider');
    if(slider){
      slider.style.setProperty('position','absolute','important');
      slider.style.setProperty('inset','0','important');
      slider.style.setProperty('width','100%','important');
      slider.style.setProperty('height','100%','important');
      slider.style.setProperty('margin','0','important');
      protectSlider(slider);
    }
  }
  function start(){
    css();lock();
    var observer=new MutationObserver(function(){lock();});
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    window.addEventListener('resize',lock,{passive:true});
    window.addEventListener('orientationchange',function(){setTimeout(lock,50);},{passive:true});
    setInterval(lock,700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();