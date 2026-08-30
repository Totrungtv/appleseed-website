/* Apple Seed Visual Site Builder V1 runtime: published config only. */
(function(){
  if(location.pathname.toLowerCase().endsWith('/site-builder.html')) return;
  let applied='';
  async function run(){
    try{
      if(!window.supabaseClient)return;
      const {data,error}=await window.supabaseClient.from('site_builder_versions').select('config,updated_at').eq('site_key','default').eq('is_published',true).maybeSingle();
      if(error||!data?.config?.items||applied===data.updated_at)return;
      for(const [sel,v] of Object.entries(data.config.items)){
        let el;try{el=document.querySelector(sel)}catch(_){continue}if(!el)continue;
        if(v.text!==undefined&&!el.matches('script,style'))el.textContent=v.text;
        if(v.src!==undefined&&el.matches('img'))el.setAttribute('src',v.src);
        if(v.transform!==undefined)el.style.transform=v.transform;
      }
      applied=data.updated_at||String(Date.now());
    }catch(_){}
  }
  function boot(){run();setTimeout(run,800);setTimeout(run,1800);setTimeout(run,3500);const r=document.getElementById('homeRenderer');if(r){const m=new MutationObserver(run);m.observe(r,{childList:true,subtree:true});setTimeout(()=>m.disconnect(),6000)}}
  if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();