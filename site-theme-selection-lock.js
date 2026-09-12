/* APPLE_SEED_THEME_SELECTION_LOCK_V1
   Lightweight visual lock for the real INDEX iframe.
   The Builder bridge owns selection; this file only prevents the iframe's
   own scripts from resetting the selected Theme / Full Theme after render.
*/
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;

  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1';
  const FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  const frame=()=>document.getElementById('preview');
  const norm=v=>{const n=parseInt(String(v??''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''};
  const selected=()=>{
    let c='',t='';
    try{c=norm(localStorage.getItem(COLOR_KEY)||'');t=norm(localStorage.getItem(FULL_KEY)||'')}catch(_){}
    try{if(!c&&typeof draft!=='undefined')c=norm(draft?.theme_id);if(!t&&typeof draft!=='undefined')t=norm(draft?.full_theme_id)}catch(_){}
    return {c:c||'01',t:t||'01'};
  };
  function setThemeClass(root,prefix,id){
    if(!root)return;
    const wanted=prefix+id;
    if(root.classList.contains(wanted))return false;
    const old=[];
    for(let i=1;i<=30;i++){const x=prefix+String(i).padStart(2,'0');if(root.classList.contains(x))old.push(x)}
    old.forEach(x=>root.classList.remove(x));
    root.classList.add(wanted);
    return true;
  }
  function apply(){
    const f=frame(),d=f&&f.contentDocument;if(!d?.documentElement)return;
    const {c,t}=selected(),r=d.documentElement,b=d.body;
    setThemeClass(r,'as-theme-',c);setThemeClass(r,'as-full-theme-',t);
    if(b){setThemeClass(b,'as-theme-',c);setThemeClass(b,'as-full-theme-',t)}
    r.classList.add('as-theme-scope','as-full-theme-scope');
    if(b)b.classList.add('as-theme-scope','as-full-theme-scope');
    const links=[
      ['apple-seed-30-themes-lock-link','site-builder-themes.css?v=20260912-theme1'],
      ['apple-seed-full-themes-lock-link','site-builder-full-themes.css?v=20260912-full3'],
      ['apple-seed-layouts-lock-link','site-builder-layouts.css?v=20260912-layout2']
    ];
    links.forEach(([id,href])=>{if(!d.getElementById(id)){const l=d.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;(d.head||r).appendChild(l)}});
  }
  let observed=null;
  function watch(){
    const f=frame(),d=f&&f.contentDocument,r=d?.documentElement;if(!r)return;
    if(observed===r)return;
    observed=r;
    try{new MutationObserver(()=>{
      const {c,t}=selected();
      const rb=d.body;
      const missing=!r.classList.contains('as-theme-'+c)||!r.classList.contains('as-full-theme-'+t)||!r.classList.contains('as-theme-scope')||!r.classList.contains('as-full-theme-scope')||(rb&&(!rb.classList.contains('as-theme-'+c)||!rb.classList.contains('as-full-theme-'+t)));
      if(missing)apply();
    }).observe(r,{attributes:true,attributeFilter:['class']});}catch(_){}
  }
  function boot(){
    apply();watch();
    const f=frame();
    if(f&&!f.__appleSeedThemeLock){
      f.__appleSeedThemeLock=true;
      f.addEventListener('load',()=>{observed=null;apply();watch();setTimeout(apply,80);setTimeout(apply,400)});
    }
    window.addEventListener('storage',e=>{if(e.key===COLOR_KEY||e.key===FULL_KEY){apply();watch()}});
    setTimeout(()=>{apply();watch()},1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
