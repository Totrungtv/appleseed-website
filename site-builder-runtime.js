/* Apple Seed Visual Site Builder V2 runtime.
   Published config only. If CMS is unavailable, the original HTML remains untouched. */
(function(){
  'use strict';
  try{
    var qs=new URLSearchParams(location.search);
    if(qs.get('appleSeedBuilderPreview')==='1' || qs.get('appleSeedBuilderCanvas')==='1') return;
  }catch(_){ }
  if(location.pathname.split('/').pop().toLowerCase()==='site-builder.html') return;

  /* HERO MODE FAILSAFE
     Default is Slider. Never delete the six phone DOM nodes: Builder needs them.
     This style is installed synchronously when this runtime executes so the
     phone mockups cannot remain visible while the published mode is loading. */
  var root=document.documentElement;
  try{
    root.setAttribute('data-apple-seed-hero-mode','slider');
    var early=document.getElementById('apple-seed-hero-mode-early-v3');
    if(!early){
      early=document.createElement('style');
      early.id='apple-seed-hero-mode-early-v3';
      early.textContent="html[data-apple-seed-hero-mode='slider'] .as3-phone{display:none!important;visibility:hidden!important;}html[data-apple-seed-hero-mode='phones'] .as3-stage .as3-phone{display:block!important;visibility:visible!important;}html[data-apple-seed-hero-mode='phones'] .apple-seed-runtime-slider-host,html[data-apple-seed-hero-mode='phones'] .apple-seed-hero-slider,html[data-apple-seed-hero-mode='phones'] #apple-seed-runtime-slider{display:none!important;}html[data-apple-seed-hero-mode='slider'] .apple-seed-runtime-slider-host,html[data-apple-seed-hero-mode='slider'] .apple-seed-hero-slider,html[data-apple-seed-hero-mode='slider'] #apple-seed-runtime-slider{display:block!important;}";
      (document.head||root).appendChild(early);
    }
  }catch(_){ }

  var appliedVersion='';

  function applyTheme(themeId){
    var v=/^(?:[1-9]|[12][0-9]|30)$/.test(String(themeId||''))?String(themeId).padStart(2,'0'):'01';
    try{
      var st=document.getElementById('apple-seed-30-themes-runtime');
      if(!st){st=document.createElement('link');st.id='apple-seed-30-themes-runtime';st.rel='stylesheet';st.href='site-builder-themes.css?v=20260912-theme1';(document.head||root).appendChild(st)}
      for(var i=1;i<=30;i++)root.classList.remove('as-theme-'+String(i).padStart(2,'0'));
      root.classList.add('as-theme-scope','as-theme-'+v);
    }catch(_){ }
  }

  /* APPLE_SEED_30_THEMES_RUNTIME_V1 */
  function applyFullTheme(themeId){
    var v=/^(?:[1-9]|[12][0-9]|30)$/.test(String(themeId||''))?String(themeId).padStart(2,'0'):'01';
    try{
      var st=document.getElementById('apple-seed-full-themes-runtime');
      if(!st){st=document.createElement('link');st.id='apple-seed-full-themes-runtime';st.rel='stylesheet';st.href='site-builder-full-themes.css?v=20260912-full1';(document.head||root).appendChild(st)}
      for(var i=1;i<=30;i++)root.classList.remove('as-full-theme-'+String(i).padStart(2,'0'));
      root.classList.add('as-full-theme-scope','as-full-theme-'+v);
    }catch(_){ }
  }

  /* APPLE_SEED_30_FULL_THEMES_RUNTIME_V1 */
  function applyHeroMode(mode){
    var v=mode==='phones'?'phones':'slider';
    try{
      root.setAttribute('data-apple-seed-hero-mode',v);
      root.classList.remove('apple-seed-hero-mode-pending');
      var st=document.getElementById('apple-seed-hero-mode-runtime-v3');
      if(!st){
        st=document.createElement('style');
        st.id='apple-seed-hero-mode-runtime-v3';
        (document.head||root).appendChild(st);
      }
      st.textContent="html[data-apple-seed-hero-mode='slider'] .as3-phone{display:none!important;visibility:hidden!important;}html[data-apple-seed-hero-mode='phones'] .as3-stage .as3-phone{display:block!important;visibility:visible!important;}html[data-apple-seed-hero-mode='phones'] .apple-seed-runtime-slider-host,html[data-apple-seed-hero-mode='phones'] .apple-seed-hero-slider,html[data-apple-seed-hero-mode='phones'] #apple-seed-runtime-slider{display:none!important;}html[data-apple-seed-hero-mode='slider'] .apple-seed-runtime-slider-host,html[data-apple-seed-hero-mode='slider'] .apple-seed-hero-slider,html[data-apple-seed-hero-mode='slider'] #apple-seed-runtime-slider{display:block!important;}";
    }catch(_){ }
  }

  function getPublished(){
    try{
      if(!window.supabaseClient)return Promise.resolve(null);
      return window.supabaseClient.from('site_builder_versions')
        .select('version_no,config,created_at')
        .eq('site_key','default').eq('status','published')
        .order('version_no',{ascending:false}).limit(1).maybeSingle()
        .then(function(r){return r.error?null:r.data||null})
        .catch(function(){return null});
    }catch(_){return Promise.resolve(null)}
  }

  function deviceKey(){
    return window.matchMedia && window.matchMedia('(max-width: 650px)').matches ? 'mobile' : 'desktop';
  }

  function apply(){
    getPublished().then(function(data){
      var mode=data&&data.config&&data.config.hero_mode==='phones'?'phones':'slider';
      applyHeroMode(mode);
      applyTheme(data&&data.config&&data.config.theme_id);
      applyFullTheme(data&&data.config&&data.config.full_theme_id);
      if(!data||!data.config||!data.config.items)return;
      var viewKey=String(data.version_no)+'-'+deviceKey();
      if(viewKey===appliedVersion)return;
      var mobile=deviceKey()==='mobile',matched=0,items=data.config.items;
      Object.keys(items).forEach(function(sel){
        var item=items[sel],el;
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
      if(matched>0)appliedVersion=viewKey;
    });
  }

  function boot(){
    applyHeroMode('slider');
    apply();
    setTimeout(apply,600);
    setTimeout(apply,1600);
    setTimeout(apply,3200);
    window.addEventListener('resize',function(){setTimeout(apply,80)});
    setInterval(apply,1500);
    var homeRenderer=document.getElementById('homeRenderer');
    if(homeRenderer)new MutationObserver(function(){apply()}).observe(homeRenderer,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)apply()});
    var chatBtn=document.getElementById('chatBtn');
    if(chatBtn)chatBtn.addEventListener('click',function(){setTimeout(syncAiBoardVisibility,0);setTimeout(syncAiBoardVisibility,50);setTimeout(syncAiBoardVisibility,200)},true);
    var chatClose=document.getElementById('chatClose');
    if(chatClose)chatClose.addEventListener('click',function(){setTimeout(syncAiBoardVisibility,0);setTimeout(syncAiBoardVisibility,100)},true);
    var chatBox=document.getElementById('chatBox');
    if(chatBox)new MutationObserver(syncAiBoardVisibility).observe(chatBox,{attributes:true,attributeFilter:['class','style']});
    new MutationObserver(syncAiBoardVisibility).observe(document.body,{childList:true,subtree:true});
    syncAiBoardVisibility();
    setInterval(syncAiBoardVisibility,250);
  }

  function syncAiBoardVisibility(){
    try{
      var chat=document.getElementById('chatBox'),launcher=document.getElementById('apple-seed-ai-board-float');
      if(!launcher)return;
      var open=!!(chat&&chat.classList.contains('open'));
      launcher.style.setProperty('display',open?'none':'inline-flex','important');
      launcher.setAttribute('aria-hidden',open?'true':'false');
      if(open)launcher.setAttribute('tabindex','-1');else launcher.removeAttribute('tabindex');
    }catch(_){ }
  }

  if(document.readyState==='complete')boot();
  else window.addEventListener('load',boot,{once:true});
})();
