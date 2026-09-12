/* APPLE SEED THEME SELECTION LOCK V2
   Single source of truth for Builder Theme / Full Theme.
   Legacy inline theme scripts may still render/apply, but they cannot
   overwrite the selected values in localStorage anymore.
*/
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;

  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1';
  const FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  const nativeSet=Storage.prototype.setItem;
  const nativeRemove=Storage.prototype.removeItem;
  let internalWrite=false;
  let color='',full='';

  const norm=v=>{const n=parseInt(String(v??''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''};
  function readDraft(field){
    try{return typeof draft!=='undefined'&&draft?norm(draft[field]):''}catch(_){return ''}
  }
  function seed(){
    try{color=norm(localStorage.getItem(COLOR_KEY)||'')}catch(_){color=''}
    try{full=norm(localStorage.getItem(FULL_KEY)||'')}catch(_){full=''}
    if(!color)color=readDraft('theme_id');
    if(!full)full=readDraft('full_theme_id');
    color=color||'01';full=full||'01';
    writeNative(COLOR_KEY,color);writeNative(FULL_KEY,full);
  }
  function writeNative(key,value){
    internalWrite=true;
    try{nativeSet.call(localStorage,key,value)}catch(_){}
    internalWrite=false;
  }
  function setAuthoritative(key,value){
    const v=norm(value);if(!v)return;
    if(key===COLOR_KEY)color=v;else if(key===FULL_KEY)full=v;else return;
    writeNative(key,v);
    try{
      if(typeof draft!=='undefined'&&draft){
        if(key===COLOR_KEY)draft.theme_id=v;else draft.full_theme_id=v;
      }
    }catch(_){}
  }
  window.__appleSeedSetTheme=function(key,value){setAuthoritative(key,value);apply();mark()};

  /* Block every legacy attempt to overwrite either theme key. */
  try{
    Storage.prototype.setItem=function(key,value){
      if(this===localStorage&&(key===COLOR_KEY||key===FULL_KEY)&&!internalWrite){return;}
      return nativeSet.call(this,key,value);
    };
    Storage.prototype.removeItem=function(key){
      if(this===localStorage&&(key===COLOR_KEY||key===FULL_KEY)&&!internalWrite){return;}
      return nativeRemove.call(this,key);
    };
  }catch(_){}

  function apply(){
    const f=document.getElementById('preview'),d=f&&f.contentDocument;
    if(!d?.documentElement)return;
    const r=d.documentElement,b=d.body;
    setClass(r,'as-theme-',color);setClass(r,'as-full-theme-',full);
    if(b){setClass(b,'as-theme-',color);setClass(b,'as-full-theme-',full)}
    r.classList.add('as-theme-scope','as-full-theme-scope');
    if(b)b.classList.add('as-theme-scope','as-full-theme-scope');
    addCss(d,'apple-seed-30-themes-lock-link','site-builder-themes.css?v=20260912-theme1');
    addCss(d,'apple-seed-full-themes-lock-link','site-builder-full-themes.css?v=20260912-full3');
    addCss(d,'apple-seed-layouts-lock-link','site-builder-layouts.css?v=20260912-layout2');
  }
  function setClass(root,prefix,id){
    if(!root)return;
    const wanted=prefix+id;
    for(let i=1;i<=30;i++)root.classList.remove(prefix+String(i).padStart(2,'0'));
    root.classList.add(wanted);
  }
  function addCss(d,id,href){
    if(d.getElementById(id))return;
    const l=d.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;(d.head||d.documentElement).appendChild(l);
  }
  function mark(){
    document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId||'')===color));
    document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme||'')===full));
    const a=document.getElementById('appleSeedThemeStatus');if(a)a.textContent='Đang chọn: Theme '+color+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
    const b=document.getElementById('appleSeedFullThemeStatus');if(b)b.textContent='Đang chọn: Giao diện '+full+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
  }
  function watch(){
    const f=document.getElementById('preview'),d=f&&f.contentDocument,r=d?.documentElement;
    if(!r)return;
    if(r.__appleSeedThemeLockObserver)return;
    const observer=new MutationObserver(()=>{
      if(!r.classList.contains('as-theme-'+color)||!r.classList.contains('as-full-theme-'+full)||!r.classList.contains('as-theme-scope')||!r.classList.contains('as-full-theme-scope'))apply();
    });
    try{observer.observe(r,{attributes:true,attributeFilter:['class']});r.__appleSeedThemeLockObserver=observer}catch(_){}
  }
  function boot(){
    seed();apply();mark();watch();
    const f=document.getElementById('preview');
    if(f&&!f.__appleSeedThemeLockV2){
      f.__appleSeedThemeLockV2=true;
      f.addEventListener('load',()=>{setTimeout(()=>{apply();watch();mark()},0);setTimeout(()=>{apply();watch()},150);setTimeout(()=>{apply();watch()},500)});
    }
    setInterval(()=>{apply();mark();watch()},2000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
