/* Apple Seed Visual Site Builder V2 runtime.
   Published config only. If CMS is unavailable, the original HTML remains untouched. */
(function(){
  if(location.pathname.split('/').pop().toLowerCase()==='site-builder.html') return;
  var appliedVersion='';
  function deviceKey(){return window.matchMedia && window.matchMedia('(max-width: 650px)').matches?'mobile':'desktop'}
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
  function boot(){
    apply();
    setTimeout(apply,600);setTimeout(apply,1600);setTimeout(apply,3200);
    window.addEventListener('resize',function(){setTimeout(apply,80)});
  }
  if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();