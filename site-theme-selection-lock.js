/* APPLE SEED THEME SELECTION LOCK V3
   Non-invasive renderer guard.
   Builder draft is authoritative after loadPublished/applyAll.
   Never hijack Storage.prototype and never write 01 during boot.
*/
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;
  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1',FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  const norm=v=>{const n=parseInt(String(v??''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''};
  const frame=()=>document.getElementById('preview');
  function selected(){
    let c='',t='';
    try{if(typeof draft!=='undefined'&&draft){c=norm(draft.theme_id);t=norm(draft.full_theme_id)}}catch(_){}
    try{if(!c)c=norm(localStorage.getItem(COLOR_KEY)||'');if(!t)t=norm(localStorage.getItem(FULL_KEY)||'')}catch(_){}
    return {c:c||'01',t:t||'01'};
  }
  function setClass(root,prefix,id){
    if(!root)return;
    const wanted=prefix+id;
    if(root.classList.contains(wanted))return;
    for(let i=1;i<=30;i++)root.classList.remove(prefix+String(i).padStart(2,'0'));
    root.classList.add(wanted);
  }
  function addCss(d,id,href){
    if(!d||!d.getElementById||d.getElementById(id))return;
    const l=d.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;(d.head||d.documentElement).appendChild(l);
  }
  function apply(){
    const f=frame(),d=f&&f.contentDocument;if(!d?.documentElement)return;
    const {c,t}=selected(),r=d.documentElement,b=d.body;
    setClass(r,'as-theme-',c);setClass(r,'as-full-theme-',t);
    if(b){setClass(b,'as-theme-',c);setClass(b,'as-full-theme-',t)}
    r.classList.add('as-theme-scope','as-full-theme-scope');
    if(b)b.classList.add('as-theme-scope','as-full-theme-scope');
    addCss(d,'apple-seed-30-themes-lock-link','site-builder-themes.css?v=20260912-theme1');
    addCss(d,'apple-seed-full-themes-lock-link','site-builder-full-themes.css?v=20260912-full3');
    addCss(d,'apple-seed-layouts-lock-link','site-builder-layouts.css?v=20260912-layout2');
  }
  function mark(){
    const {c,t}=selected();
    document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId||'')===c));
    document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme||'')===t));
    const a=document.getElementById('appleSeedThemeStatus');if(a)a.textContent='Đang chọn: Theme '+c+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
    const b=document.getElementById('appleSeedFullThemeStatus');if(b)b.textContent='Đang chọn: Giao diện '+t+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
  }
  let observed=null;
  function watch(){
    const f=frame(),d=f&&f.contentDocument,r=d?.documentElement;if(!r||observed===r)return;
    observed=r;
    try{new MutationObserver(()=>apply()).observe(r,{attributes:true,attributeFilter:['class']})}catch(_){}
  }
  function boot(){
    apply();mark();watch();
    const f=frame();
    if(f&&!f.__appleSeedThemeLockV3){
      f.__appleSeedThemeLockV3=true;
      f.addEventListener('load',()=>{observed=null;setTimeout(()=>{apply();mark();watch()},0);setTimeout(()=>{apply();watch()},250)});
    }
    setInterval(()=>{apply();mark();watch()},2500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
