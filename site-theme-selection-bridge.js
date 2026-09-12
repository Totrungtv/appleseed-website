/* APPLE_SEED_THEME_SELECTION_BRIDGE_V3
   Single source of truth for the 01-30 Website Theme selection.
   The legacy color/full-theme controls remain visible, but both are locked
   to the SAME number so clicking one can never make the other jump away.
*/
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;

  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1';
  const FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  let syncing=false;
  let last='';

  function norm(v){
    const n=parseInt(String(v||''),10);
    return n>=1&&n<=30?String(n).padStart(2,'0'):'01';
  }

  function getCurrent(){
    try{
      return norm(
        localStorage.getItem(COLOR_KEY) ||
        localStorage.getItem(FULL_KEY) ||
        (typeof draft!=='undefined'&&draft?(draft.theme_id||draft.full_theme_id):'01') || '01'
      );
    }catch(_){return '01'}
  }

  function setClasses(root,v){
    if(!root)return;
    for(let i=1;i<=30;i++){
      const n=String(i).padStart(2,'0');
      if(n!==v){
        root.classList.remove('as-theme-'+n);
        root.classList.remove('as-full-theme-'+n);
      }
    }
    root.classList.add('as-theme-scope','as-theme-'+v,'as-full-theme-scope','as-full-theme-'+v);
  }

  function applyPreview(v){
    const frame=document.getElementById('preview');
    const d=frame&&frame.contentDocument;
    if(!d||!d.documentElement)return;
    setClasses(d.documentElement,v);
    setClasses(d.body,v);
    let colorLink=d.getElementById('apple-seed-30-themes-link');
    if(!colorLink){
      colorLink=d.createElement('link');
      colorLink.id='apple-seed-30-themes-link';
      colorLink.rel='stylesheet';
      colorLink.href='site-builder-themes.css?v=20260912-theme1';
      (d.head||d.documentElement).appendChild(colorLink);
    }
    let fullLink=d.getElementById('apple-seed-full-themes-link');
    if(!fullLink){
      fullLink=d.createElement('link');
      fullLink.id='apple-seed-full-themes-link';
      fullLink.rel='stylesheet';
      fullLink.href='site-builder-full-themes.css?v=20260912-full1';
      (d.head||d.documentElement).appendChild(fullLink);
    }
  }

  function markButtons(v){
    document.querySelectorAll('.as-theme-choice').forEach(x=>{
      x.classList.toggle('active',norm(x.dataset.themeId||'')===v);
    });
    document.querySelectorAll('.as-full-theme-choice').forEach(x=>{
      x.classList.toggle('active',norm(x.dataset.fullTheme||'')===v);
    });
    const a=document.getElementById('appleSeedThemeStatus');
    if(a)a.textContent='Đang chọn: Theme '+v+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
    const b=document.getElementById('appleSeedFullThemeStatus');
    if(b)b.textContent='Đang chọn: Giao diện '+v+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
  }

  function sync(v,save){
    v=norm(v);
    if(syncing)return;
    syncing=true;
    try{
      localStorage.setItem(COLOR_KEY,v);
      localStorage.setItem(FULL_KEY,v);
      if(typeof draft!=='undefined'&&draft){
        draft.theme_id=v;
        draft.full_theme_id=v;
        if(save && typeof saveDraft==='function')saveDraft();
      }
      setClasses(document.documentElement,v);
      applyPreview(v);
      markButtons(v);
      last=v;
    }catch(e){console.warn('Theme sync:',e)}
    finally{syncing=false}
  }

  function inspectAndSync(){
    if(syncing)return;
    let v=getCurrent();
    try{
      const a=norm(localStorage.getItem(COLOR_KEY)||'');
      const b=norm(localStorage.getItem(FULL_KEY)||'');
      const d=typeof draft!=='undefined'&&draft?norm(draft.theme_id||draft.full_theme_id||''):'';
      // Prefer an actual Builder draft value when it changes; otherwise keep
      // the already selected value. Never alternate between two keys.
      if(d && d!==last)v=d;
      else if(a && a!==last)v=a;
      else if(b && b!==last)v=b;
    }catch(_){ }
    if(v!==last || !last)sync(v,false);
    else{applyPreview(v);markButtons(v)}
  }

  function install(){
    const v=getCurrent();
    sync(v,false);

    // The old Builder scripts attach their own click handlers. Instead of
    // competing with them, observe their resulting draft/localStorage state
    // and immediately force BOTH controls back to the same selected number.
    document.addEventListener('click',function(e){
      const c=e.target&&e.target.closest?e.target.closest('.as-theme-choice,.as-full-theme-choice'):null;
      if(!c)return;
      const v=norm(c.dataset.themeId||c.dataset.fullTheme||'');
      setTimeout(()=>sync(v,true),0);
    },false);

    const frame=document.getElementById('preview');
    if(frame)frame.addEventListener('load',()=>setTimeout(()=>sync(getCurrent(),false),250));

    // Keep legacy controls, draft and preview synchronized without competing
    // event handlers or randomly switching themes.
    setInterval(inspectAndSync,250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
