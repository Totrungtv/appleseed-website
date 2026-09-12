/* APPLE_SEED_THEME_SELECTION_BRIDGE_V13 */
(function(){'use strict';
if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;
const COLOR_KEY='APPLE_SEED_SITE_THEME_V1',FULL_KEY='APPLE_SEED_FULL_THEME_V1';
let installed=false,lockedColor='',lockedFull='',observer=null,enforceTimer=null;
function norm(v){const n=parseInt(String(v??''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''}
function readDraft(field){try{return typeof draft!=='undefined'&&draft?norm(draft[field]):''}catch(_){return ''}}
function bootstrap(){
  try{lockedColor=norm(localStorage.getItem(COLOR_KEY)||'')}catch(_){lockedColor=''}
  try{lockedFull=norm(localStorage.getItem(FULL_KEY)||'')}catch(_){lockedFull=''}
  if(!lockedColor)lockedColor=readDraft('theme_id');
  if(!lockedFull)lockedFull=readDraft('full_theme_id');
  try{if(lockedColor)localStorage.setItem(COLOR_KEY,lockedColor);if(lockedFull)localStorage.setItem(FULL_KEY,lockedFull)}catch(_){}
}
function getColor(){return lockedColor||readDraft('theme_id')||'01'}
function getFull(){return lockedFull||readDraft('full_theme_id')||'01'}
function setRootClass(r,p,v){if(!r)return;const wanted=p+v;if(r.classList.contains(wanted))return;for(let i=1;i<=30;i++)r.classList.remove(p+String(i).padStart(2,'0'));r.classList.add(wanted)}
function link(d,id,href){let e=d.getElementById(id);if(!e){e=d.createElement('link');e.id=id;e.rel='stylesheet';e.href=href;(d.head||d.documentElement).appendChild(e)}}
function applyPreview(){
  const f=document.getElementById('preview'),d=f&&f.contentDocument;if(!d||!d.documentElement)return;
  const c=getColor(),t=getFull();
  setRootClass(d.documentElement,'as-theme-',c);setRootClass(d.body,'as-theme-',c);
  setRootClass(d.documentElement,'as-full-theme-',t);setRootClass(d.body,'as-full-theme-',t);
  d.documentElement.classList.add('as-theme-scope','as-full-theme-scope');if(d.body)d.body.classList.add('as-theme-scope','as-full-theme-scope');
  link(d,'apple-seed-30-themes-link','site-builder-themes.css?v=20260912-theme1');
  link(d,'apple-seed-full-themes-link','site-builder-full-themes.css?v=20260912-full3');
  link(d,'apple-seed-layouts-link','site-builder-layouts.css?v=20260912-layout2');
}
function mark(){const c=getColor(),t=getFull();document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId||'')===c));document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme||'')===t));const a=document.getElementById('appleSeedThemeStatus');if(a)a.textContent='Đang chọn: Theme '+c+' · áp dụng cho toàn bộ WEB khi Xuất bản.';const b=document.getElementById('appleSeedFullThemeStatus');if(b)b.textContent='Đang chọn: Giao diện '+t+' · áp dụng cho toàn bộ WEB khi Xuất bản.'}
function persistLocked(){try{if(lockedColor){localStorage.setItem(COLOR_KEY,lockedColor);if(typeof draft!=='undefined'&&draft)draft.theme_id=lockedColor}if(lockedFull){localStorage.setItem(FULL_KEY,lockedFull);if(typeof draft!=='undefined'&&draft)draft.full_theme_id=lockedFull}}catch(_){} }
function save(v,key,field){v=norm(v);if(!v)return;if(key===COLOR_KEY)lockedColor=v;else lockedFull=v;persistLocked();try{if(typeof saveDraft==='function')saveDraft()}catch(_){}applyPreview();mark();setTimeout(enforce,0);setTimeout(enforce,80);setTimeout(enforce,300)}
function intercept(e){const el=e.target&&e.target.closest&&e.target.closest('.as-theme-choice,.as-full-theme-choice');if(!el)return;const full=el.classList.contains('as-full-theme-choice'),v=norm(full?el.dataset.fullTheme:el.dataset.themeId);if(!v)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();save(v,full?FULL_KEY:COLOR_KEY,full?'full_theme_id':'theme_id')}
function enforce(){persistLocked();applyPreview();mark()}
function watchPreview(){const f=document.getElementById('preview');if(!f)return;if(f.__appleSeedThemeWatched)return;f.__appleSeedThemeWatched=true;f.addEventListener('load',()=>{enforce();setTimeout(enforce,50);setTimeout(enforce,200);setTimeout(enforce,600)});try{const d=f.contentDocument;if(d&&d.documentElement){observer=new MutationObserver(()=>{if(!observer.__busy){observer.__busy=true;requestAnimationFrame(()=>{observer.__busy=false;enforce()})}});observer.observe(d.documentElement,{attributes:true,attributeFilter:['class'],subtree:true});}}catch(_){} }
function install(){if(installed)return;installed=true;bootstrap();enforce();watchPreview();window.addEventListener('pointerdown',intercept,true);window.addEventListener('click',intercept,true);if(enforceTimer)clearInterval(enforceTimer);enforceTimer=setInterval(enforce,500);new MutationObserver(()=>{watchPreview();mark()}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
