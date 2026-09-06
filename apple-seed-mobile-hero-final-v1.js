/* Apple Seed Mobile Hero Final V1
 * Mobile-only layout correction. Keeps desktop untouched.
 */
(function(){
  'use strict';
  function apply(){
    if(document.getElementById('apple-seed-mobile-hero-final-css')) return;
    var style=document.createElement('style');
    style.id='apple-seed-mobile-hero-final-css';
    style.textContent=`
@media (max-width:760px){
  html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;}

  /* Mobile header must participate in normal document flow.
     The old fixed/overflowing header was covering the Hero CTA. */
  .site-header{
    position:relative!important;
    top:auto!important;left:auto!important;right:auto!important;
    width:100%!important;height:auto!important;min-height:0!important;
    overflow:visible!important;
  }
  body{padding-top:0!important;}

  .as3-hero{
    width:100%!important;
    max-width:100%!important;
    overflow:hidden!important;
  }
  .as3-wrap{
    width:100%!important;
    max-width:none!important;
    min-height:0!important;
    padding:28px 12px 28px!important;
    margin:0!important;
  }
  .as3-main{
    display:block!important;
    width:100%!important;
    min-width:0!important;
    min-height:0!important;
  }
  .as3-copy{
    width:100%!important;
    max-width:100%!important;
    padding:0!important;
  }

  /* THE IMPORTANT PART: the slider is viewport-width and centered.
     No scale(), no negative margin, no inherited grid column width. */
  .as3-stage,
  .as3-stage.apple-seed-slider-active{
    position:relative!important;
    left:50%!important;
    width:calc(100vw - 24px)!important;
    max-width:none!important;
    height:auto!important;
    min-height:0!important;
    aspect-ratio:16/9!important;
    transform:translateX(-50%)!important;
    transform-origin:center center!important;
    margin:20px 0 28px!important;
    padding:0!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
  }
  .apple-seed-hero-slider{
    position:absolute!important;
    inset:0!important;
    width:100%!important;
    height:100%!important;
    border-radius:12px!important;
    overflow:hidden!important;
  }
  .apple-seed-hero-slide,
  .apple-seed-hero-track{height:100%!important;}
  .apple-seed-hero-slide img{
    width:100%!important;
    height:100%!important;
    object-fit:cover!important;
    object-position:center!important;
    padding:0!important;
  }
  /* User requested no text overlay from the slider. */
  .apple-seed-hero-caption{display:none!important;}

  .as3-services,.as3-bottom{width:100%!important;max-width:100%!important;}
}

@media (max-width:480px){
  .as3-wrap{padding-left:12px!important;padding-right:12px!important;}
  .as3-stage,.as3-stage.apple-seed-slider-active{
    width:calc(100vw - 24px)!important;
    aspect-ratio:16/9!important;
    transform:translateX(-50%)!important;
    margin-top:18px!important;
    margin-bottom:24px!important;
  }
}
`;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();