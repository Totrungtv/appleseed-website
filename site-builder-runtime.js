/* Apple Seed Visual Site Builder V2 runtime.
   Published config only. If CMS is unavailable, the original HTML remains untouched. */
(function(){
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
          Object.keys(r.data.config.items).forEach(function(sel){
            var item=r.data.config.items[sel],el;
            try{el=document.querySelector(sel)}catch(_){el=null}
            if(!el)return;
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
          appliedVersion=viewKey;
        });
    }catch(_){}
  }

  /*
   * AI BOARD / CUSTOMER ROBOT VISIBILITY
   * The AI BOARD launcher is a separate floating pill. Do NOT hide its
   * text/icon children individually: hide the whole launcher container.
   */
  function findAiBoardLauncher(){
    var found=null;
    var nodes=document.querySelectorAll('a,button,div,span');
    for(var i=0;i<nodes.length;i++){
      var el=nodes[i];
      if(el.id==='chatBtn'||el.closest('#chatBox'))continue;
      var txt=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(!txt || txt.indexOf('AI BOARD')===-1)continue;

      var cur=el;
      for(var level=0;level<5 && cur;level++,cur=cur.parentElement){
        if(cur.id==='chatBox'||cur.id==='chatBtn')break;
        var r=cur.getBoundingClientRect();
        var cs=getComputedStyle(cur);
        if(r.width>=100 && r.height>=35 && r.width<=420 && r.height<=130 &&
           (cs.position==='fixed'||cs.position==='absolute'||cur.parentElement===document.body)){
          found=cur;
          break;
        }
      }
      if(found)break;
    }
    return found;
  }

  function syncAiBoardVisibility(){
    try{
      var chat=document.getElementById('chatBox');
      var chatOpen=!!(chat && chat.classList.contains('open'));
      var launcher=findAiBoardLauncher();

      if(launcher){
        if(chatOpen){
          if(!launcher.dataset.asAiBoardHidden){
            launcher.dataset.asAiBoardHidden='1';
            launcher.dataset.asAiBoardPrevDisplay=launcher.style.display||'';
          }
          launcher.style.setProperty('display','none','important');
        }else if(launcher.dataset.asAiBoardHidden==='1'){
          launcher.style.setProperty('display',launcher.dataset.asAiBoardPrevDisplay||'','important');
          delete launcher.dataset.asAiBoardHidden;
          delete launcher.dataset.asAiBoardPrevDisplay;
        }
      }

      /* Recover from the previous buggy runtime if it hid a text/icon child. */
      document.querySelectorAll('[data-as-ai-board-hidden]').forEach(function(el){
        if(!launcher || el!==launcher){
          el.style.removeProperty('display');
          el.removeAttribute('data-as-ai-board-hidden');
          el.removeAttribute('data-as-ai-board-prev-display');
        }
      });
    }catch(_){}
  }

  function boot(){
    apply();
    setTimeout(apply,600);setTimeout(apply,1600);setTimeout(apply,3200);
    window.addEventListener('resize',function(){setTimeout(apply,80)});
    setInterval(apply,5000);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)apply()});

    var chatBtn=document.getElementById('chatBtn');
    if(chatBtn){
      chatBtn.addEventListener('click',function(){
        setTimeout(syncAiBoardVisibility,0);
        setTimeout(syncAiBoardVisibility,100);
        setTimeout(syncAiBoardVisibility,350);
      },true);
    }

    var chatBox=document.getElementById('chatBox');
    if(chatBox){
      new MutationObserver(syncAiBoardVisibility)
        .observe(chatBox,{attributes:true,attributeFilter:['class','style']});
    }

    new MutationObserver(syncAiBoardVisibility)
      .observe(document.body,{childList:true,subtree:true});

    syncAiBoardVisibility();
    setInterval(syncAiBoardVisibility,500);
  }

  if(document.readyState==='complete')boot();
  else window.addEventListener('load',boot,{once:true});
})();