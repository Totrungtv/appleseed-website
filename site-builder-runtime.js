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
    return window.matchMedia && window.matchMedia('(max-width: 650px)') ? 'mobile' : 'desktop';
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