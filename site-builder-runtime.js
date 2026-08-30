/* Apple Seed Visual Site Builder V1 runtime.
 * Applies only published builder config. If CMS is unavailable, the normal website is untouched.
 */
(function(){
  if(location.pathname.toLowerCase().endsWith('/site-builder.html')) return;
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  ready(async function(){
    try{
      if(!window.supabaseClient) return;
      const {data,error}=await window.supabaseClient
        .from('site_builder_versions')
        .select('config,updated_at')
        .eq('site_key','default')
        .eq('is_published',true)
        .maybeSingle();
      if(error||!data||!data.config||!data.config.items)return;
      const items=data.config.items;
      for(const [sel,v] of Object.entries(items)){
        let el;
        try{el=document.querySelector(sel)}catch(_){continue}
        if(!el)continue;
        if(v.text!==undefined && !el.matches('script,style')) el.textContent=v.text;
        if(v.src!==undefined && el.matches('img')) el.setAttribute('src',v.src);
        if(v.transform!==undefined) el.style.transform=v.transform;
      }
      document.documentElement.dataset.appleSeedBuilderVersion=data.updated_at||'';
    }catch(_){/* Never block the normal site when Builder CMS is unavailable. */}
  });
})();