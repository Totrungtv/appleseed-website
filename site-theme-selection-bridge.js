/* APPLE_SEED_THEME_SELECTION_BRIDGE_V7
   Website Theme 01-30 and Website Layout 01-30 are independent.
   Preview applies the same scope + layout class used by the live site.
*/
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;

  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1';
  const FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  let installed=false;
  function norm(v){const n=parseInt(String(v||''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''}
  function getColor(){try{return norm((typeof draft!=='undefined'&&draft&&draft.theme_id)||localStorage.getItem(COLOR_KEY)||'01')||'01'}catch(_){return '01'}}
  function getFull(){try{return norm((typeof draft!=='undefined'&&draft&&draft.full_theme_id)||localStorage.getItem(FULL_KEY)||'01')||'01'}catch(_){return '01'}}
  function setRootClass(root,prefix,value){if(!root)return;for(let i=1;i<=30;i++)root.classList.remove(prefix+String(i).padStart(2,'0'));root.classList.add(prefix+value)}
  function applyPreview(){
    const frame=document.getElementById('preview'),d=frame&&frame.contentDocument;
    if(!d||!d.documentElement)return;
    const color=getColor(),full=getFull(),root=d.documentElement;
    setRootClass(root,'as-theme-',color);setRootClass(d.body,'as-theme-',color);
    setRootClass(root,'as-full-theme-',full);setRootClass(d.body,'as-full-theme-',full);
    root.classList.add('as-theme-scope','as-full-theme-scope');
    d.body&&d.body.classList.add('as-theme-scope','as-full-theme-scope');
    function link(id,href){let e=d.getElementById(id);if(!e){e=d.createElement('link');e.id=id;e.rel='stylesheet';e.href=href;(d.head||root).appendChild(e)}else if(e.getAttribute('href')!==href)e.href=href}
    link('apple-seed-30-themes-link','site-builder-themes.css?v=20260912-theme1');
    link('apple-seed-full-themes-link','site-builder-full-themes.css?v=20260912-full3');
  }
  function mark(){
    const color=getColor(),full=getFull();
    document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId||'')===color));
    document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme||'')===full));
    const a=document.getElementById('appleSeedThemeStatus');if(a)a.textContent='Đang chọn: Theme '+color+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
    const b=document.getElementById('appleSeedFullThemeStatus');if(b)b.textContent='Đang chọn: Giao diện '+full+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
  }
  function saveColor(v){v=norm(v);if(!v)return;try{localStorage.setItem(COLOR_KEY,v);if(typeof draft!=='undefined'&&draft)draft.theme_id=v;if(typeof saveDraft==='function')saveDraft()}catch(e){}setTimeout(function(){applyPreview();mark()},40)}
  function saveFull(v){v=norm(v);if(!v)return;try{localStorage.setItem(FULL_KEY,v);if(typeof draft!=='undefined'&&draft)draft.full_theme_id=v;if(typeof saveDraft==='function')saveDraft()}catch(e){}setTimeout(function(){applyPreview();mark()},40)}
  function install(){
    if(installed)return;installed=true;applyPreview();mark();
    document.addEventListener('click',function(e){
      const c=e.target&&e.target.closest?e.target.closest('.as-theme-choice'):null;
      if(c){const v=norm(c.dataset.themeId||'');if(v)setTimeout(function(){saveColor(v)},0);return}
      const f=e.target&&e.target.closest?e.target.closest('.as-full-theme-choice'):null;
      if(f){const v=norm(f.dataset.fullTheme||'');if(v)setTimeout(function(){saveFull(v)},0);return}
    },false);
    const frame=document.getElementById('preview');if(frame)frame.addEventListener('load',function(){setTimeout(function(){applyPreview();mark()},80)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
