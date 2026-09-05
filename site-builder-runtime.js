/* Apple Seed Visual Site Builder V2 runtime.
   Published config only. If CMS is unavailable, the original HTML remains untouched. */
(function(){
  // Builder iframe must be a stable editing canvas. Do not run the published-site runtime inside it;
  // its polling/timers can repaint the preview and cause visible blinking.
  try{
    var qs=new URLSearchParams(location.search);
    if(qs.get('appleSeedBuilderPreview')==='1' || qs.get('appleSeedBuilderCanvas')==='1') return;
  }catch(_){ }
  if(location.pathname.split('/').pop().toLowerCase()==='site-builder.html') return;
  var appliedVersion='';

  function deviceKey(){
    return window.matchMedia && window.matchMedia('(max-width: 650px)').matches ? 'mobile' : 'desktop';
  }

  function apply(){
    try{
      if(!window.supabaseClient)return;
      window.supabaseClient.from('site_builder_versions')
        .select('version_no,config,created_at')
        .eq('site_key','default').eq('status','published').maybeSingle()
        .then(function(r){
          if(r.error||!r.data||!r.data.config||!r.data.config.items)return;
          var viewKey=String(r.data.version_no)+'-'+deviceKey();
          if(viewKey===appliedVersion)return;
          var mobile=deviceKey()==='mobile';
          var matched=0;
          Object.keys(r.data.config.items).forEach(function(sel){
            var item=r.data.config.items[sel],el;
            try{el=document.querySelector(sel)}catch(_){el=null}
            if(!el)return;
            matched++;
            if(item.text!==undefined && el.children.length===0 && !/^(SCRIPT|STYLE)$/.test(el.tagName))el.textContent=item.text;
            if(item.src!==undefined && el.tagName==='IMG')el.setAttribute('src',item.src);
            if(item.bgImage!==undefined && el.tagName!=='IMG')el.style.backgroundImage=item.bgImage?'url("'+item.bgImage+'")':'';
            var st=(item.styles||{})[mobile?'mobile':'desktop']||{};
            if(st.x!==undefined||st.y!==undefined)el.style.translate=(st.x||0)+'px '+(st.y||0)+'px';
            if(st.w!==undefined)el.style.width=st.w+'px';
            if(st.h!==undefined)el.style.height=st.h+'px';
            if(st.fontSize!==undefined&&st.fontSize!=='')el.style.fontSize=st.fontSize+'px';
            if(st.radius!==undefined&&st.radius!=='')el.style.borderRadius=st.radius+'px';
            if(st.color)el.style.color=st.color;
            if(st.background)el.style.backgroundColor=st.background;
          });
          /*
           * CMS content is rendered asynchronously into #homeRenderer.
           * Do NOT mark the published version as applied when its selectors
           * were not in the DOM yet; otherwise the later CMS render would
           * permanently wipe the Builder changes until a version/device change.
           */
          if(matched>0)appliedVersion=viewKey;
        });
    }catch(_){}
  }

  /*
   * AI BOARD / CUSTOMER ROBOT VISIBILITY
   * Always target the real launcher by ID. The previous text/ancestor
   * detection could select a child/partial element and leave the empty pill.
   */
  function syncAiBoardVisibility(){
    try{
      var chat=document.getElementById('chatBox');
      var launcher=document.getElementById('apple-seed-ai-board-float');
      if(!launcher)return;
      var chatOpen=!!(chat && chat.classList.contains('open'));
      if(chatOpen){
        launcher.style.setProperty('display','none','important');
        launcher.setAttribute('aria-hidden','true');
        launcher.setAttribute('tabindex','-1');
      }else{
        launcher.style.removeProperty('display');
        launcher.removeAttribute('aria-hidden');
        launcher.removeAttribute('tabindex');
      }
    }catch(_){ }
  }

  function boot(){
    apply();
    setTimeout(apply,600);setTimeout(apply,1600);setTimeout(apply,3200);
    window.addEventListener('resize',function(){setTimeout(apply,80)});
    setInterval(apply,1500);
    var homeRenderer=document.getElementById('homeRenderer');
    if(homeRenderer){
      new MutationObserver(function(){apply()}).observe(homeRenderer,{childList:true,subtree:true});
    }
    document.addEventListener('visibilitychange',function(){if(!document.hidden)apply()});

    var chatBtn=document.getElementById('chatBtn');
    if(chatBtn){
      chatBtn.addEventListener('click',function(){
        var launcher=document.getElementById('apple-seed-ai-board-float');
        if(launcher){
          launcher.style.setProperty('display','none','important');
          launcher.setAttribute('aria-hidden','true');
        }
        setTimeout(syncAiBoardVisibility,0);
        setTimeout(syncAiBoardVisibility,50);
        setTimeout(syncAiBoardVisibility,200);
      },true);
    }

    var chatClose=document.getElementById('chatClose');
    if(chatClose){
      chatClose.addEventListener('click',function(){
        setTimeout(syncAiBoardVisibility,0);
        setTimeout(syncAiBoardVisibility,100);
      },true);
    }

    document.addEventListener('click',function(e){
      try{
        var t=e.target;
        if(t && t.closest && t.closest('#chatBtn')){
          var launcher=document.getElementById('apple-seed-ai-board-float');
          if(launcher){
            launcher.style.setProperty('display','none','important');
            launcher.setAttribute('aria-hidden','true');
          }
        }else if(t && t.closest && t.closest('#chatClose')){
          setTimeout(syncAiBoardVisibility,0);
          setTimeout(syncAiBoardVisibility,100);
        }
      }catch(_){}
    },true);

    var chatBox=document.getElementById('chatBox');
    if(chatBox){
      new MutationObserver(syncAiBoardVisibility)
        .observe(chatBox,{attributes:true,attributeFilter:['class','style']});
    }

    new MutationObserver(syncAiBoardVisibility)
      .observe(document.body,{childList:true,subtree:true});

    syncAiBoardVisibility();
    setInterval(syncAiBoardVisibility,250);
  }

  if(document.readyState==='complete')boot();
  else window.addEventListener('load',boot,{once:true});
})();

/* APPLE SEED HERO BANNER SLIDER V1
   Visual-only enhancement for index.html. Keeps existing Builder/CMS data intact. */
(function(){
  'use strict';
  try{
    var qs=new URLSearchParams(location.search);
    if(qs.get('appleSeedBuilderPreview')==='1' || qs.get('appleSeedBuilderCanvas')==='1') return;
  }catch(_){ }

  var initialized=false;
  var timer=0;
  var current=0;
  var paused=false;
  var startX=0;

  function css(){
    if(document.getElementById('apple-seed-banner-slider-css')) return;
    var style=document.createElement('style');
    style.id='apple-seed-banner-slider-css';
    style.textContent=''
      +'#apple-seed-premium-home .as3-stage{height:560px!important;min-width:0!important;perspective:none!important;overflow:hidden!important;position:relative!important;} '
      +'#apple-seed-premium-home .as3-stage:before{display:none!important;} '
      +'#apple-seed-premium-home .as3-stage>.as3-phone,#apple-seed-premium-home .as3-stage>.as3-benefits{display:none!important;} '
      +'#apple-seed-premium-home .as3-stage .as3-motion-glow{display:none!important;} '
      +'#apple-seed-premium-home.builder-has-page-bg,#apple-seed-premium-home.has-cms-hero-bg{background-image:none!important;} '
      +'.apple-seed-hero-slider{position:absolute!important;inset:0!important;overflow:hidden!important;border-radius:20px!important;background:#f4f5f7!important;box-shadow:0 22px 55px rgba(25,35,50,.13)!important;z-index:40!important;touch-action:pan-y!important;user-select:none!important;} '
      +'.apple-seed-hero-track{position:absolute;inset:0;display:flex;transition:transform .55s cubic-bezier(.22,.61,.36,1);will-change:transform;} '
      +'.apple-seed-hero-slide{position:relative;flex:0 0 100%;width:100%;height:100%;overflow:hidden;background:#f4f5f7;} '
      +'.apple-seed-hero-slide img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none;} '
      +'.apple-seed-hero-slide:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.05),transparent 45%,rgba(0,0,0,.08));pointer-events:none;} '
      +'.apple-seed-hero-arrow{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border:1px solid rgba(255,255,255,.72);border-radius:50%;background:rgba(20,25,32,.38);backdrop-filter:blur(8px);color:#fff;font-size:40px;line-height:1;display:grid;place-items:center;cursor:pointer;z-index:3;transition:background .18s ease,transform .18s ease;} '
      +'.apple-seed-hero-arrow:hover{background:rgba(20,25,32,.62);transform:translateY(-50%) scale(1.05);} '
      +'.apple-seed-hero-arrow.prev{left:18px}.apple-seed-hero-arrow.next{right:18px} '
      +'.apple-seed-hero-dots{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:9px;z-index:4;padding:7px 11px;border-radius:999px;background:rgba(0,0,0,.24);backdrop-filter:blur(8px);} '
      +'.apple-seed-hero-dot{width:9px;height:9px;padding:0;border:1px solid rgba(255,255,255,.85);border-radius:50%;background:rgba(255,255,255,.35);cursor:pointer;transition:all .2s ease;} '
      +'.apple-seed-hero-dot.active{width:24px;border-radius:999px;background:#fff;} '
      +'@media(max-width:760px){#apple-seed-premium-home .as3-stage{height:260px!important;transform:none!important;margin:0!important;border-radius:14px!important}.apple-seed-hero-slider{border-radius:14px!important}.apple-seed-hero-arrow{width:38px;height:38px;font-size:31px}.apple-seed-hero-arrow.prev{left:9px}.apple-seed-hero-arrow.next{right:9px}.apple-seed-hero-dots{bottom:10px;gap:7px;padding:5px 8px}.apple-seed-hero-dot{width:7px;height:7px}.apple-seed-hero-dot.active{width:20px}} '
      +'@media(prefers-reduced-motion:reduce){.apple-seed-hero-track{transition:none!important;}}';
    document.head.appendChild(style);
  }

  function publishedHeroImage(){
    try{
      var cfg=window.appleSeedBuilderPublishedConfig;
      return cfg&&cfg.page&&cfg.page.desktop&&cfg.page.desktop.bgImage || '';
    }catch(_){return ''}
  }

  function build(images){
    var stage=document.querySelector('#apple-seed-premium-home .as3-stage');
    if(!stage)return false;
    images=(images||[]).filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i});
    if(!images.length) images=['hero-mau-35.png'];

    var old=stage.querySelector('.apple-seed-hero-slider');
    if(old) old.remove();

    var slider=document.createElement('div');
    slider.className='apple-seed-hero-slider';
    slider.id='appleSeedHeroSlider';
    slider.setAttribute('aria-label','Banner Apple Seed');
    slider.setAttribute('tabindex','0');

    var track=document.createElement('div');
    track.className='apple-seed-hero-track';
    var dots=document.createElement('div');
    dots.className='apple-seed-hero-dots';
    dots.setAttribute('aria-label','Chọn ảnh');

    images.forEach(function(src,i){
      var slide=document.createElement('div');
      slide.className='apple-seed-hero-slide';
      slide.setAttribute('role','group');
      slide.setAttribute('aria-label','Ảnh '+(i+1)+' / '+images.length);
      var img=document.createElement('img');
      img.src=src;
      img.alt='Banner Apple Seed '+(i+1);
      img.loading=i===0?'eager':'lazy';
      img.draggable=false;
      slide.appendChild(img);
      track.appendChild(slide);

      var dot=document.createElement('button');
      dot.className='apple-seed-hero-dot'+(i===0?' active':'');
      dot.type='button';
      dot.setAttribute('aria-label','Chuyển tới ảnh '+(i+1));
      dot.setAttribute('aria-current',i===0?'true':'false');
      dot.addEventListener('click',function(){current=i;render();restart()});
      dots.appendChild(dot);
    });

    var prev=document.createElement('button');
    prev.className='apple-seed-hero-arrow prev';
    prev.type='button';
    prev.setAttribute('aria-label','Ảnh trước');
    prev.textContent='‹';
    prev.addEventListener('click',function(){current--;render();restart()});

    var next=document.createElement('button');
    next.className='apple-seed-hero-arrow next';
    next.type='button';
    next.setAttribute('aria-label','Ảnh tiếp theo');
    next.textContent='›';
    next.addEventListener('click',function(){current++;render();restart()});

    slider.appendChild(track);slider.appendChild(prev);slider.appendChild(next);slider.appendChild(dots);stage.prepend(slider);

    function render(){
      current=(current+images.length)%images.length;
      track.style.transform='translate3d('+(-current*100)+'%,0,0)';
      Array.prototype.forEach.call(dots.children,function(d,i){
        var active=i===current;
        d.classList.toggle('active',active);
        d.setAttribute('aria-current',active?'true':'false');
      });
    }
    function restart(){
      window.clearInterval(timer);
      if(images.length>1 && !paused && !document.hidden) timer=window.setInterval(function(){current++;render()},5000);
    }

    slider.addEventListener('mouseenter',function(){paused=true;restart()});
    slider.addEventListener('mouseleave',function(){paused=false;restart()});
    slider.addEventListener('focusin',function(){paused=true;restart()});
    slider.addEventListener('focusout',function(){paused=false;restart()});
    slider.addEventListener('pointerdown',function(e){startX=e.clientX});
    slider.addEventListener('pointerup',function(e){var dx=e.clientX-startX;if(Math.abs(dx)>45){current+=dx<0?1:-1;render();restart()}});
    slider.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();current--;render();restart()}else if(e.key==='ArrowRight'){e.preventDefault();current++;render();restart()}});
    document.addEventListener('visibilitychange',restart);
    render();restart();
    return true;
  }

  function init(){
    if(initialized)return;
    var hero=document.getElementById('apple-seed-premium-home');
    if(!hero)return;
    css();
    var cms=publishedHeroImage();
    var images=[];
    if(cms)images.push(cms);
    images.push('hero-mau-35.png');
    initialized=build(images);
  }

  function boot(){
    init();
    window.addEventListener('appleSeedBuilderConfigReady',function(){
      initialized=false;
      init();
    },{once:true});
    setTimeout(init,800);
    setTimeout(init,2000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
