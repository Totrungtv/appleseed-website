/* Apple Seed Entertainment runtime v10
 * UI/runtime hardening only. No database writes, no content hosting, no platform bypass.
 * Loaded only on entertainment.html by supabase-config.js.
 */
(function(){
  'use strict';
  var FILE='entertainment.html';
  var RSS_IDS=['newsGrid','techGrid','sportGrid','entGrid'];
  var RSS_TIMEOUT=12000;
  var timers=[];

  function isEntertainment(){
    return (location.pathname.split('/').pop()||'index.html').toLowerCase()===FILE;
  }
  function ready(fn){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});
    else setTimeout(fn,0);
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]});}
  function statusBox(text,error){
    var box=document.createElement('div');
    box.className='empty as-runtime-status'+(error?' is-error':'');
    box.setAttribute('role',error?'alert':'status');
    box.innerHTML=error?'⚠️ '+esc(text):'⏳ '+esc(text);
    return box;
  }
  function addStyle(){
    if(document.getElementById('as-ent-runtime-v10-style'))return;
    var s=document.createElement('style');s.id='as-ent-runtime-v10-style';
    s.textContent='.as-runtime-status.is-error{border-color:#f0caca;background:#fff8f8;color:#8b3a3a}.as-runtime-retry{margin-left:8px;border:1px solid #d8e1ee;background:#fff;color:#1769ff;border-radius:9px;padding:7px 10px;font-weight:900;cursor:pointer}.as-runtime-a11y{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}';
    document.head.appendChild(s);
  }
  function hardenExternalLinks(root){
    (root||document).querySelectorAll('a[target="_blank"]').forEach(function(a){
      var rel=(a.getAttribute('rel')||'').split(/\s+/).filter(Boolean);
      if(rel.indexOf('noopener')<0)rel.push('noopener');
      if(rel.indexOf('noreferrer')<0)rel.push('noreferrer');
      a.setAttribute('rel',rel.join(' '));
    });
  }
  function ensureTikTokStatus(){
    var frame=document.getElementById('tiktokFrame');
    if(!frame)return null;
    var panel=frame.closest('.panel')||frame.parentElement;
    var status=document.getElementById('tiktokStatus');
    if(!status){
      status=document.createElement('div');
      status.id='tiktokStatus';
      status.className='tiktok-status';
      status.setAttribute('role','status');
      status.setAttribute('aria-live','polite');
      status.textContent='Sẵn sàng phát TikTok công khai.';
      (panel||frame.parentElement).appendChild(status);
    }
    return {frame:frame,status:status};
  }
  function validTikTokId(id){return /^\d{8,30}$/.test(String(id||''));}
  function validTikTokUrl(raw){
    try{
      var u=new URL(String(raw||''),location.href);
      var host=u.hostname.toLowerCase();
      if(host!=='tiktok.com'&&!host.endsWith('.tiktok.com'))return null;
      var m=u.pathname.match(/^\/[^/]+\/video\/(\d{8,30})(?:\/)?$/i)||u.pathname.match(/^\/video\/(\d{8,30})(?:\/)?$/i);
      return m&&validTikTokId(m[1])?m[1]:null;
    }catch(_){return null;}
  }
  function patchTikTok(){
    var t=ensureTikTokStatus();
    if(!t)return;
    var frame=t.frame,status=t.status;
    /* Capture phase prevents the existing inline listener from treating about:blank as ready. */
    frame.addEventListener('load',function(ev){
      var src=String(frame.getAttribute('src')||'');
      if(src==='about:blank'||!/^https:\/\/www\.tiktok\.com\/player\/v1\/\d{8,30}/i.test(src)){
        ev.stopImmediatePropagation();
        status.classList.remove('ok');
        status.textContent='⏳ Đang chuẩn bị trình phát TikTok…';
        return;
      }
      status.classList.add('ok');
      status.textContent='TikTok player sẵn sàng.';
    },true);
    var input=document.getElementById('tiktokUrl');
    var btn=document.getElementById('tiktokLoad');
    if(input&&btn){
      btn.addEventListener('click',function(){
        var id=validTikTokUrl(input.value.trim());
        if(!id){input.setCustomValidity('Chỉ hỗ trợ URL TikTok công khai dạng /video/ID.');input.reportValidity();status.textContent='URL TikTok chưa đúng hoặc không phải video công khai.';return;}
        input.setCustomValidity('');
        if(typeof window.loadTikTok==='function')window.loadTikTok(id);
      },true);
      input.addEventListener('input',function(){input.setCustomValidity('')},{passive:true});
    }
    document.querySelectorAll('[data-tiktok-id]').forEach(function(b){b.setAttribute('type','button')});
  }
  function hardenImages(){
    document.querySelectorAll('img').forEach(function(img){
      if(!img.hasAttribute('decoding'))img.setAttribute('decoding','async');
      if(!img.closest('.hero')&&!img.hasAttribute('loading'))img.setAttribute('loading','lazy');
    });
  }
  function hardenIframes(){
    document.querySelectorAll('iframe').forEach(function(frame){
      if(frame.id==='youtubeFrame'||frame.id==='tiktokFrame'||frame.id==='pFrame'||frame.id==='relatedVideoFrame')return;
      if(!frame.hasAttribute('loading'))frame.setAttribute('loading','lazy');
    });
  }
  function rssWatch(){
    RSS_IDS.forEach(function(id){
      var el=document.getElementById(id);if(!el)return;
      var started=Date.now();
      var timer=setTimeout(function(){
        if(/Đang (tải|cập nhật)\.{0,3}/i.test(el.textContent||'')){
          el.innerHTML='';
          var box=statusBox('Nguồn tin chưa phản hồi. Bạn có thể thử cập nhật lại.',true);
          var retry=document.createElement('button');retry.type='button';retry.className='as-runtime-retry';retry.textContent='↻ Thử lại';
          retry.addEventListener('click',function(){
            var r=document.getElementById('refresh');if(r)r.click();
            el.innerHTML='';el.appendChild(statusBox('Đang cập nhật…',false));
          });
          box.appendChild(retry);el.appendChild(box);
        }
      },RSS_TIMEOUT);
      timers.push(timer);
      var observer=new MutationObserver(function(){
        if(!/Đang (tải|cập nhật)\.{0,3}/i.test(el.textContent||'')){
          clearTimeout(timer);observer.disconnect();
        }
      });
      observer.observe(el,{childList:true,subtree:true,characterData:true});
    });
  }
  function keyboardSafety(){
    document.addEventListener('keydown',function(e){
      if(e.key!=='Escape')return;
      var reader=document.getElementById('reader');
      if(reader&&reader.classList.contains('open')){var c=reader.querySelector('[data-close]');if(c)c.click();}
      var player=document.getElementById('player');
      if(player&&player.style.display!=='none'){var c2=document.getElementById('pClose');if(c2)c2.click();}
    },false);
  }
  function observeDynamicContent(){
    var root=document.body;if(!root)return;
    var observer=new MutationObserver(function(mutations){
      var relevant=mutations.some(function(m){return m.addedNodes&&m.addedNodes.length});
      if(!relevant)return;
      hardenExternalLinks(root);hardenImages();hardenIframes();
    });
    observer.observe(root,{childList:true,subtree:true});
    timers.push(observer);
  }
  function start(){
    if(!isEntertainment())return;
    addStyle();
    ensureTikTokStatus();
    patchTikTok();
    hardenExternalLinks(document);
    hardenImages();
    hardenIframes();
    keyboardSafety();
    rssWatch();
    observeDynamicContent();
    document.documentElement.dataset.appleSeedEntertainmentRuntime='v10';
  }
  ready(start);
})();
