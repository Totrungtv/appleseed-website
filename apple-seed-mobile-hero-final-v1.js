/* Apple Seed Mobile Hero Final V5
 * Mobile layout lock + preserve premium banner branding + single-tap controls.
 */
(function(){
  'use strict';
  var STYLE_ID='apple-seed-mobile-hero-final-v5-css';
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
  #apple-seed-premium-home .apple-seed-hero-slide img.as-hero-fit-contain{object-fit:contain!important;padding:4%!important;}
  /* IMPORTANT: never hide the premium branding overlay on mobile. */
  #apple-seed-premium-home .apple-seed-hero-caption{display:block!important;}
  #apple-seed-premium-home .apple-seed-hero-arrow{display:grid!important;position:absolute!important;top:50%!important;width:40px!important;height:40px!important;z-index:1000!important;transform:translateY(-50%)!important;opacity:1!important;visibility:visible!important;}
  #apple-seed-premium-home .apple-seed-hero-arrow.prev{left:10px!important;}
  #apple-seed-premium-home .apple-seed-hero-arrow.next{right:10px!important;}
}
.apple-seed-hero-caption{display:block!important;}
.apple-seed-hero-slide img.as-hero-fit-contain{object-fit:contain!important;padding:4%!important;}
`;
    document.head.appendChild(style);
  }
  function protectSlider(slider){
    if(!slider||slider.getAttribute('data-as-v5-hotfix')==='1')return;
    slider.setAttribute('data-as-v5-hotfix','1');
    Array.prototype.forEach.call(slider.querySelectorAll('.apple-seed-hero-slide img'),function(img){
      if((img.style.objectFit||'').toLowerCase()==='contain')img.classList.add('as-hero-fit-contain');
    });
    slider.addEventListener('pointerup',function(e){
      if(e.target&&e.target.closest&&e.target.closest('button'))e.stopPropagation();
    },true);
    slider.addEventListener('pointerdown',function(e){
      if(e.target&&e.target.closest&&e.target.closest('button'))e.stopPropagation();
    },true);
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
    setInterval(lock,1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();