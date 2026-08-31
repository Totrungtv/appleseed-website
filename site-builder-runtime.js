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

  function findPageTarget(kind){
    var selectors=kind==='main'
      ? ['main','#main','.main']
      : ['#apple-seed-premium-home','.as3-hero','.hero','section:first-of-type','main'];
    for(var i=0;i<selectors.length;i++){
      try{var el=document.querySelector(selectors[i]);if(el)return el}catch(_){}
    }
    return document.body;
  }

  function applyPage(page){
    if(!page)return;
    var kind=page.target==='main'?'main':'hero';
    var target=findPageTarget(kind);
    if(!target)return;

    var bg=String(page.bgImage||'').trim();
    if(bg){
      target.style.setProperty('background-image','url("'+bg.replace(/"/g,'\\\"')+'")','important');
      target.style.setProperty('background-size',page.bgSize||'cover','important');
      target.style.setProperty('background-position',page.bgPosition||'center','important');
      target.style.setProperty('background-repeat','no-repeat','important');
      if(kind==='hero'){
        target.classList.add('builder-has-page-bg');
        var stage=target.querySelector('.as3-stage');
        if(stage){
          stage.style.setProperty('background-image','none','important');
          stage.style.setProperty('background-color','transparent','important');
        }
      }
    }else{
      target.style.removeProperty('background-image');
      target.style.removeProperty('background-size');
      target.style.removeProperty('background-position');
      target.style.removeProperty('background-repeat');
      if(kind==='hero')target.classList.remove('builder-has-page-bg');
    }

    if(page.bgColor)target.style.setProperty('background-color',page.bgColor,'important');

    if(page.overlayColor){
      target.style.setProperty('--apple-seed-builder-overlay',page.overlayColor,'important');
      target.classList.add('builder-has-page-overlay');
    }else{
      target.style.removeProperty('--apple-seed-builder-overlay');
      target.classList.remove('builder-has-page-overlay');
    }

    var pal=page.palette||{};
    var primary=pal['--gold']||pal['--apple-seed-primary'];
    var ink=pal['--ink']||pal['--apple-seed-ink'];
    var pageBg=pal['--apple-seed-page-bg'];
    var cardBg=pal['--apple-seed-card-bg'];
    if(primary){
      document.documentElement.style.setProperty('--gold',primary,'important');
      document.documentElement.style.setProperty('--blue',primary,'important');
      document.documentElement.style.setProperty('--as-gold',primary,'important');
      document.documentElement.style.setProperty('--as-gold-light',primary,'important');
      document.documentElement.style.setProperty('--as-light-gold',primary,'important');
      document.documentElement.style.setProperty('--as-light-gold-2',primary,'important');
      document.documentElement.style.setProperty('--apple-seed-primary',primary,'important');
    }
    if(ink){
      document.documentElement.style.setProperty('--ink',ink,'important');
      document.documentElement.style.setProperty('--as-light-ink',ink,'important');
      document.documentElement.style.setProperty('--apple-seed-ink',ink,'important');
    }
    if(pageBg){
      document.documentElement.style.setProperty('--apple-seed-page-bg',pageBg,'important');
      document.documentElement.style.setProperty('--as-light-bg',pageBg,'important');
    }
    if(cardBg)document.documentElement.style.setProperty('--apple-seed-card-bg',cardBg,'important');

    var style=document.getElementById('apple-seed-builder-live-palette');
    if(!style){
      style=document.createElement('style');
      style.id='apple-seed-builder-live-palette';
      document.head.appendChild(style);
    }
    style.textContent=':root{'+
      (primary?'--apple-seed-primary:'+primary+';--blue:'+primary+'!important;--gold:'+primary+'!important;':'')+
      (ink?'--apple-seed-ink:'+ink+';--ink:'+ink+'!important;':'')+
      (pageBg?'--apple-seed-page-bg:'+pageBg+';':'')+
      (cardBg?'--apple-seed-card-bg:'+cardBg+';':'')+
      '}'+
      (pageBg?'html,body{background:'+pageBg+'!important;}':'')+
      (primary?'.as3-kicker,.as3-sub b,.as3-benefit i,.as3-service .ico,.as3-stat b{color:'+primary+'!important}.as3-btn.gold,.site-header .booking-nav{background:'+primary+'!important;border-color:'+primary+'!important}.as3-play{border-color:'+primary+'!important;color:'+primary+'!important}.site-header .menu a:hover{color:'+primary+'!important}.':'')+
      (ink?'.as3-title,.as3-sub,.as3-service h3,.as3-stat span,.as3-service p,.site-header .menu,.site-header .menu a,.site-header .brand-title{color:'+ink+'!important}.':'')+
      (cardBg?'.as3-service,.as3-stats,.product-home-card,.contact-card,.map-card,.dynamic-pages-section .page-card,.product-modal-box{background:'+cardBg+'!important}.':'');
  }

  function apply(){
    try{
      if(!window.supabaseClient)return;
      window.supabaseClient.from('site_builder_versions')
        .select('version_no,config,created_at')
        .eq('site_key','default').eq('status','published')
        .order('version_no',{ascending:false})
        .limit(1)
        .maybeSingle()
        .then(function(r){
          if(r.error||!r.data||!r.data.config||!r.data.config.items)return;
          var cfg=r.data.config;
          var viewKey=String(r.data.version_no)+'-'+deviceKey();
          if(viewKey===appliedVersion)return;
          var mobile=deviceKey()==='mobile';
          var page=(cfg.page||{})[mobile?'mobile':'desktop']||{};
          applyPage(page);

          var matched=0;
          Object.keys(cfg.items||{}).forEach(function(sel){
            var item=cfg.items[sel],el;
            try{el=document.querySelector(sel)}catch(_){el=null}
            if(!el)return;
            matched++;
            if(item.text!==undefined && el.children.length===0 && !/^(SCRIPT|STYLE)$/.test(el.tagName))el.textContent=item.text;
            if(item.src!==undefined && el.tagName==='IMG')el.setAttribute('src',item.src);
            if(item.bgImage!==undefined && el.tagName!=='IMG'){
              if(el.matches && (el.matches('.as3-phone,.as3-screen') || el.closest('.as3-phone'))) {
                var phone=el.matches('.as3-phone')?el:el.closest('.as3-phone');
                var screen=el.matches('.as3-screen')?el:el.querySelector('.as3-screen');
                var box=phone||el;
                box.style.backgroundImage='none';
                if(screen)screen.style.setProperty('background-image','url("'+item.bgImage.replace(/"/g,'\\\"')+'")','important');
                else box.style.setProperty('background-image','url("'+item.bgImage.replace(/"/g,'\\\"')+'")','important');
              }else{
                el.style.setProperty('background-image','url("'+item.bgImage.replace(/"/g,'\\\"')+'")','important');
              }
            }
            var st=(item.styles||{})[mobile?'mobile':'desktop']||{};
            if(st.x!==undefined||st.y!==undefined)el.style.translate=(st.x||0)+'px '+(st.y||0)+'px';
            if(st.w!==undefined)el.style.width=st.w+'px';
            if(st.h!==undefined)el.style.height=st.h+'px';
            if(st.fontSize!==undefined&&st.fontSize!=='')el.style.fontSize=st.fontSize+'px';
            if(st.radius!==undefined&&st.radius!=='')el.style.borderRadius=st.radius+'px';
            if(st.color)el.style.color=st.color;
            if(st.background)el.style.backgroundColor=st.background;
          });
          if(matched>0 || page.bgImage || page.bgColor || Object.keys(page.palette||{}).length)appliedVersion=viewKey;
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

  (function installBuilderOverlayCss(){
    if(document.getElementById('apple-seed-builder-live-overlay'))return;
    var s=document.createElement('style');s.id='apple-seed-builder-live-overlay';
    s.textContent='.builder-has-page-overlay{position:relative!important}.builder-has-page-overlay:after{content:"";position:absolute;inset:0;pointer-events:none;background:var(--apple-seed-builder-overlay)!important;z-index:1}.builder-has-page-overlay > *{position:relative;z-index:2}';
    document.head.appendChild(s);
  })();

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