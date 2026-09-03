/* Apple Seed Entertainment runtime v4
 * Scoped to entertainment.html by supabase-config.js.
 * UI resilience only: no database writes, no media downloading, no platform bypass.
 */
(function(){
  'use strict';
  if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'entertainment.html') return;
  if (window.__appleSeedEntertainmentV4) return;
  window.__appleSeedEntertainmentV4 = true;

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  function setStatus(el, message, kind){
    if (!el) return;
    el.setAttribute('data-as-status', kind || 'info');
    el.innerHTML = '<span>' + String(message).replace(/[&<>\"']/g, function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'})[c];}) + '</span>';
  }

  function addStyles(){
    if (document.getElementById('apple-seed-entertainment-v4-style')) return;
    var s=document.createElement('style');
    s.id='apple-seed-entertainment-v4-style';
    s.textContent='\n      [data-as-status="error"]{color:#8b1e1e;background:#fff6f6;border:1px dashed #efb6b6;border-radius:12px;padding:14px!important;line-height:1.55}\n      [data-as-status="info"]{line-height:1.55}\n      .as-v4-img-failed{object-fit:contain!important;padding:18px!important;background:#f7f9fc!important}\n      .as-v4-action{display:inline-flex;align-items:center;justify-content:center;margin-top:8px;padding:8px 11px;border-radius:9px;background:#1769ff;color:#fff!important;font-weight:900;text-decoration:none}\n      @media(max-width:560px){.as-v4-action{width:100%}}\n    ';
    document.head.appendChild(s);
  }

  function guardExternalLinks(){
    document.querySelectorAll('a[target="_blank"]').forEach(function(a){
      var rel=(a.getAttribute('rel')||'').split(/\s+/).filter(Boolean);
      if(rel.indexOf('noopener')<0) rel.push('noopener');
      if(rel.indexOf('noreferrer')<0) rel.push('noreferrer');
      a.setAttribute('rel',rel.join(' '));
    });
  }

  function imageFallbacks(){
    document.querySelectorAll('img').forEach(function(img){
      if(img.dataset.asV4Bound) return;
      img.dataset.asV4Bound='1';
      img.addEventListener('error',function(){
        img.classList.add('as-v4-img-failed');
        img.removeAttribute('srcset');
        img.alt = img.alt || 'Không tải được hình ảnh';
        var wrap=img.closest('.news-media');
        if(wrap && !wrap.querySelector('.as-v4-img-note')){
          var note=document.createElement('div');
          note.className='as-v4-img-note';
          note.style.cssText='position:absolute;inset:0;display:grid;place-items:center;color:#71809a;font-size:11px;background:#f7f9fc';
          note.textContent='Hình ảnh nguồn hiện không khả dụng';
          wrap.style.position='relative';
          wrap.appendChild(note);
        }
      },{once:true});
    });
  }

  function rssWatch(){
    var selectors=['.section','section'];
    var sections=[];
    selectors.forEach(function(sel){document.querySelectorAll(sel).forEach(function(el){if(sections.indexOf(el)<0)sections.push(el);});});
    sections.forEach(function(section){
      var text=(section.textContent||'').trim();
      if(!/Đang tải(?: tin mới|\.\.\.)?/.test(text)) return;
      if(section.dataset.asV4RssWatch) return;
      section.dataset.asV4RssWatch='1';
      var timer=setTimeout(function(){
        var now=(section.textContent||'').trim();
        if(!/Đang tải(?: tin mới|\.\.\.)?/.test(now)) return;
        var loading=Array.from(section.querySelectorAll('*')).find(function(el){return /Đang tải(?: tin mới|\.\.\.)?/.test((el.textContent||'').trim());});
        if(loading){
          setStatus(loading,'Nguồn tin đang phản hồi chậm. Bạn có thể bấm “↻ Cập nhật” để thử lại.','error');
          var refresh=section.querySelector('.refresh');
          if(refresh) refresh.setAttribute('aria-label','Thử tải lại nguồn tin');
        }
      },11000);
      section.addEventListener('DOMNodeInserted',function(){clearTimeout(timer);},{once:true});
    });
  }

  function modalA11y(){
    var reader=document.getElementById('reader');
    if(reader && !reader.getAttribute('aria-hidden')) reader.setAttribute('aria-hidden','true');
    document.addEventListener('keydown',function(e){
      if(e.key!=='Escape') return;
      var r=document.getElementById('reader');
      if(r && r.classList.contains('open')){
        var close=r.querySelector('.close');
        if(close) close.click();
      }
      var p=document.getElementById('player');
      if(p && getComputedStyle(p).display!=='none'){
        var pc=p.querySelector('.close');
        if(pc) pc.click();
      }
    });
  }

  ready(function(){
    addStyles();
    guardExternalLinks();
    imageFallbacks();
    rssWatch();
    modalA11y();
    var observer=new MutationObserver(function(){guardExternalLinks();imageFallbacks();});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(function(){observer.disconnect();},30000);
  });
})();
