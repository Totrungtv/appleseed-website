/* Apple Seed Entertainment runtime v11
 * Page-scoped, additive hardening. No data writes, media downloads, or platform bypass.
 */
(function(){
  'use strict';
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  if(page!=='entertainment.html') return;

  const RSS_TIMEOUT=8000;
  let wrapped=false;

  function ensureTikTokStatus(){
    const input=document.getElementById('tiktokUrl');
    if(!input || document.getElementById('tiktokStatus')) return;
    const host=input.closest('.panel')||input.parentElement;
    if(!host) return;
    const status=document.createElement('div');
    status.id='tiktokStatus';
    status.className='social-note';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    status.textContent='Dán URL TikTok công khai để phát bằng player chính thức.';
    host.appendChild(status);
  }

  function parallelLoadSection(id,feeds){
    const el=document.getElementById(id);
    const secondary=document.getElementById(id.replace('Grid','Secondary'));
    if(!el) return Promise.resolve();
    el.setAttribute('aria-busy','true');
    el.innerHTML='<div class="empty"><span class="spinner"></span> Đang cập nhật…</div>';
    if(secondary) secondary.innerHTML='';

    const run=async()=>{
      const jobs=(feeds||[]).map(async pair=>{
        const source=pair[0], url=pair[1];
        try{
          const controller=new AbortController();
          const timer=setTimeout(()=>controller.abort(),RSS_TIMEOUT);
          try{
            const res=await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(url),{
              signal:controller.signal,
              cache:'no-store',
              headers:{Accept:'application/json'}
            });
            if(!res.ok) throw new Error('RSS '+res.status);
            const j=await res.json();
            return (j.items||[]).slice(0,10).map(x=>Object.assign({},x,{source}));
          }finally{clearTimeout(timer);}
        }catch(err){
          return [];
        }
      });
      const chunks=await Promise.all(jobs);
      const all=chunks.flat();
      const seen=new Set();
      all.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
      const unique=all.filter(x=>{
        const k=x.link||x.title;
        if(!k||seen.has(k)) return false;
        seen.add(k); return true;
      });
      if(typeof ALL_NEWS!=='undefined'){
        ALL_NEWS=[...ALL_NEWS.filter(x=>!unique.some(y=>y.link&&x.link===y.link)),...unique];
      }
      el.innerHTML=unique.length
        ? unique.slice(0,4).map(card).join('')
        : '<div class="empty">Chưa lấy được RSS lúc này. Pa thử bấm ↻ Cập nhật lại nhé.</div>';
      if(typeof renderNewsSecondary==='function') renderNewsSecondary(id.replace('Grid','Secondary'),unique);
      el.setAttribute('aria-busy','false');
    };
    return run().catch(()=>{
      el.innerHTML='<div class="empty">Không tải được tin lúc này. <button type="button" class="refresh" data-ent-retry="'+id+'">↻ Thử lại</button></div>';
      el.setAttribute('aria-busy','false');
      if(secondary) secondary.innerHTML='';
    });
  }

  function installParallelRSS(){
    if(wrapped || typeof loadSection!=='function') return;
    const original=loadSection;
    window.loadSection=function(id,feeds){
      return parallelLoadSection(id,feeds);
    };
    window.__appleSeedEntertainmentRSSv11={original,parallelLoadSection};
    wrapped=true;
    document.addEventListener('click',function(e){
      const btn=e.target.closest('[data-ent-retry]');
      if(!btn) return;
      const id=btn.getAttribute('data-ent-retry');
      if(typeof FEEDS!=='undefined' && FEEDS){
        const key=id.replace('Grid','');
        if(FEEDS[key]) window.loadSection(id,FEEDS[key]);
      }
    });
  }

  function installTikTokGuard(){
    const frame=document.getElementById('tiktokFrame');
    if(!frame || frame.dataset.v11Guard) return;
    frame.dataset.v11Guard='1';
    const setStatus=(text)=>{
      const s=document.getElementById('tiktokStatus');
      if(s) s.textContent=text;
    };
    frame.addEventListener('load',function(){
      const src=String(frame.src||'');
      if(!src || src==='about:blank'){
        setStatus('TikTok đang chờ video công khai.');
        return;
      }
      try{
        const u=new URL(src,location.href);
        const host=u.hostname.toLowerCase();
        if((host==='www.tiktok.com'||host==='tiktok.com'||host.endsWith('.tiktok.com'))&&u.pathname.startsWith('/player/v1/')){
          setStatus('TikTok player chính thức đã sẵn sàng.');
        }
      }catch(_){ }
    });
  }

  function boot(){
    ensureTikTokStatus();
    installTikTokGuard();
    installParallelRSS();
    if(!wrapped) setTimeout(boot,100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
