/* APPLE_SEED_THEME_SELECTION_BRIDGE_V2
   One 01-30 selection controls both the Web Theme and the Web Layout Theme.
   Builder preview and published LIVE site use the same selected number.
*/
(function(){
  'use strict';
  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1';
  const FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  function norm(v){
    const n=parseInt(String(v||''),10);
    return n>=1&&n<=30?String(n).padStart(2,'0'):'01';
  }
  function applyToBuilder(v){
    const d=document;
    d.documentElement.classList.add('as-theme-scope','as-theme-'+v,'as-full-theme-scope','as-full-theme-'+v);
    for(let i=1;i<=30;i++){
      const n=String(i).padStart(2,'0');
      if(n!==v){d.documentElement.classList.remove('as-theme-'+n,'as-full-theme-'+n)}
    }
    const frame=document.getElementById('preview');
    const fd=frame&&frame.contentDocument;
    if(fd&&fd.documentElement){
      for(let i=1;i<=30;i++){
        const n=String(i).padStart(2,'0');
        fd.documentElement.classList.remove('as-full-theme-'+n);
        fd.body&&fd.body.classList.remove('as-theme-'+n);
      }
      fd.documentElement.classList.add('as-full-theme-scope','as-full-theme-'+v);
      fd.body&&fd.body.classList.add('as-theme-scope','as-theme-'+v);
    }
  }
  function set(v,save){
    v=norm(v);
    try{localStorage.setItem(COLOR_KEY,v);localStorage.setItem(FULL_KEY,v)}catch(_){ }
    try{
      if(typeof draft!=='undefined'&&draft){draft.theme_id=v;draft.full_theme_id=v;}
      if(typeof saveDraft==='function'&&save)saveDraft();
    }catch(_){ }
    applyToBuilder(v);
    document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId)===v));
    document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme)===v));
    const a=document.getElementById('appleSeedThemeStatus');if(a)a.textContent='Đang chọn Theme '+v+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
    const b=document.getElementById('appleSeedFullThemeStatus');if(b)b.textContent='Đang chọn: Giao diện '+v+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
  }
  function current(){
    try{return norm(localStorage.getItem(COLOR_KEY)||localStorage.getItem(FULL_KEY)||draft?.full_theme_id||draft?.theme_id||'01')}catch(_){return '01'}
  }
  function boot(){
    if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;
    const v=current();
    set(v,false);
    document.addEventListener('click',function(e){
      const c=e.target&&e.target.closest?e.target.closest('.as-theme-choice,.as-full-theme-choice'):null;
      if(!c)return;
      const v=norm(c.dataset.themeId||c.dataset.fullTheme);
      set(v,true);
    },true);
    const frame=document.getElementById('preview');
    if(frame)frame.addEventListener('load',function(){set(current(),false)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
