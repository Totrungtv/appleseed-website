/* Apple Seed Entertainment runtime hardening v4
 * Scope: entertainment.html only. UI/runtime guard; no database writes.
 */
(function(){
  'use strict';
  if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'entertainment.html') return;

  function ensureTikTokStatus(){
    const player=document.getElementById('tiktokFrame');
    if(!player) return null;
    const wrap=player.parentElement;
    if(!wrap) return null;
    let status=document.getElementById('tiktokStatus');
    if(!status){
      status=document.createElement('div');
      status.id='tiktokStatus';
      status.className='tiktok-status';
      status.setAttribute('role','status');
      status.setAttribute('aria-live','polite');
      status.textContent='Sẵn sàng phát TikTok công khai.';
      wrap.appendChild(status);
    }
    return status;
  }

  function isTikTokPlayerSrc(src){
    try{
      const u=new URL(src,location.href);
      return /(^|\.)tiktok\.com$/i.test(u.hostname) && /^\/player\/v1\/\d{8,30}$/i.test(u.pathname);
    }catch(_){return false;}
  }

  function install(){
    const status=ensureTikTokStatus();
    const frame=document.getElementById('tiktokFrame');
    if(!status || !frame || frame.dataset.asRuntimeV4) return;
    frame.dataset.asRuntimeV4='1';

    frame.addEventListener('load',function(e){
      const src=frame.getAttribute('src')||'';
      if(!isTikTokPlayerSrc(src)){
        e.stopImmediatePropagation();
        return;
      }
      status.classList.add('ok');
      status.textContent='TikTok đang sẵn sàng.';
    },true);

    if(typeof window.loadTikTok==='function' && !window.loadTikTok.__asRuntimeV4){
      const original=window.loadTikTok;
      const wrapped=function(id){
        const clean=String(id||'').trim();
        const s=ensureTikTokStatus();
        if(!/^\d{8,30}$/.test(clean)){
          if(s){s.classList.remove('ok');s.textContent='Không có ID TikTok hợp lệ.';}
          return;
        }
        if(s){s.classList.remove('ok');s.textContent='⏳ Đang tải trình phát TikTok…';}
        return original.call(this,clean);
      };
      wrapped.__asRuntimeV4=true;
      wrapped.__asRuntimeOriginal=original;
      window.loadTikTok=wrapped;
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
