/* APPLE_SEED_THEME_SELECTION_BRIDGE_V5
   One source of truth for the 01-30 Website Theme selection.
   IMPORTANT: handle the click once in capture phase. Do not poll every 250ms;
   polling caused the Builder controls to flash/jump and fight legacy handlers.
*/
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;

  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1';
  const FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  let busy=false;

  function norm(v){
    const n=parseInt(String(v||''),10);
    return n>=1&&n<=30?String(n).padStart(2,'0'):'';
  }

  function getCurrent(){
    try{
      return norm(
        (typeof draft!=='undefined'&&draft?(draft.full_theme_id||draft.theme_id):'') ||
        localStorage.getItem(FULL_KEY) || localStorage.getItem(COLOR_KEY) || '01'
      ) || '01';
    }catch(_){return '01'}
  }

  function setClasses(root,v){
    if(!root)return;
    for(let i=1;i<=30;i++){
      const n=String(i).padStart(2,'0');
      root.classList.remove('as-theme-'+n,'as-full-theme-'+n);
    }
    root.classList.add('as-theme-scope','as-theme-'+v,'as-full-theme-scope','as-full-theme-'+v);
  }

  function applyPreview(v){
    const frame=document.getElementById('preview');
    const d=frame&&frame.contentDocument;
    if(!d||!d.documentElement)return;
    setClasses(d.documentElement,v);
    setClasses(d.body,v);

    function link(id,href){
      let el=d.getElementById(id);
      if(!el){
        el=d.createElement('link');
        el.id=id;el.rel='stylesheet';el.href=href;
        (d.head||d.documentElement).appendChild(el);
      }else if(el.getAttribute('href')!==href){el.href=href;}
    }
    link('apple-seed-30-themes-link','site-builder-themes.css?v=20260912-theme1');
    link('apple-seed-full-themes-link','site-builder-full-themes.css?v=20260912-full3');

    let lock=d.getElementById('apple-seed-slider-size-lock-v2');
    if(!lock){lock=d.createElement('style');lock.id='apple-seed-slider-size-lock-v2';(d.head||d.documentElement).appendChild(lock)}
    lock.textContent="@media(min-width:651px){.as3-hero .as3-stage:has(.apple-seed-hero-slider),.as3-hero .as3-stage:has(#apple-seed-runtime-slider){width:112%!important;max-width:none!important;transform:translateX(-5.36%)!important;transform-origin:center center!important}.as3-hero .as3-stage:has(.apple-seed-hero-slider) .apple-seed-hero-slider,.as3-hero .as3-stage:has(#apple-seed-runtime-slider) #apple-seed-runtime-slider,.as3-hero .as3-stage:has(#apple-seed-runtime-slider) .apple-seed-runtime-slider-host{width:100%!important;height:100%!important}}@media(max-width:650px){.as3-hero .as3-stage:has(.apple-seed-hero-slider),.as3-hero .as3-stage:has(#apple-seed-runtime-slider){width:100%!important;transform:none!important}}";
  }

  function markButtons(v){
    document.querySelectorAll('.as-theme-choice').forEach(function(x){
      x.classList.toggle('active',norm(x.dataset.themeId||'')===v);
    });
    document.querySelectorAll('.as-full-theme-choice').forEach(function(x){
      x.classList.toggle('active',norm(x.dataset.fullTheme||'')===v);
    });
    const a=document.getElementById('appleSeedThemeStatus');
    if(a)a.textContent='Đang chọn: Theme '+v+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
    const b=document.getElementById('appleSeedFullThemeStatus');
    if(b)b.textContent='Đang chọn: Giao diện '+v+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
  }

  function select(v,save){
    if(busy)return;
    v=norm(v);if(!v)return;
    busy=true;
    try{
      if(typeof draft!=='undefined'&&draft){
        draft.theme_id=v;
        draft.full_theme_id=v;
        if(save&&typeof saveDraft==='function')saveDraft();
      }
      localStorage.setItem(COLOR_KEY,v);
      localStorage.setItem(FULL_KEY,v);
      setClasses(document.documentElement,v);
      applyPreview(v);
      markButtons(v);
    }catch(e){console.warn('Theme selection:',e)}
    finally{busy=false}
  }

  function install(){
    select(getCurrent(),false);

    /* One handler only. Capture phase prevents the legacy theme handlers from
       running after us and changing the selection a second time. */
    document.addEventListener('click',function(e){
      const c=e.target&&e.target.closest?e.target.closest('.as-theme-choice,.as-full-theme-choice'):null;
      if(!c)return;
      const v=norm(c.dataset.themeId||c.dataset.fullTheme||'');
      if(!v)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      select(v,true);
    },true);

    const frame=document.getElementById('preview');
    if(frame)frame.addEventListener('load',function(){
      setTimeout(function(){
        const v=getCurrent();
        applyPreview(v);
        markButtons(v);
      },100);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
