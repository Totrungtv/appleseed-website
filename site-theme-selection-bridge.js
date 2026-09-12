/* APPLE SEED SITE BUILDER LOGIN + THEME BRIDGE V24 */
(function(){
'use strict';
if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;

let loginInstalled=false,busy=false;
function loginBox(){return document.querySelector('.login')}
function loginError(msg){const b=loginBox(),x=document.getElementById('loginMsg')||b?.querySelector('.danger');if(x){x.textContent=msg||'';x.style.display='block'}}
function loginFields(){const b=loginBox();if(!b)return null;const email=b.querySelector('#email,input[type="email"],input[name="email"],#loginEmail');const password=b.querySelector('#password,input[type="password"],input[name="password"],#loginPassword');const button=b.querySelector('#loginBtn,button[type="submit"],button');return email&&password&&button?{b,email,password,button}:null}
async function login(e){const f=loginFields();if(!f||busy)return;e?.preventDefault();e?.stopPropagation();e?.stopImmediatePropagation();const email=String(f.email.value||'').trim(),password=String(f.password.value||'');if(!email||!password){loginError('Vui lòng nhập Email và Mật khẩu.');return}const client=window.supabaseClient;if(!client?.auth?.signInWithPassword){loginError('Không tải được hệ thống đăng nhập. Hãy tải lại trang.');return}busy=true;f.button.disabled=true;const old=f.button.textContent;f.button.textContent='Đang đăng nhập…';loginError('');try{const r=await Promise.race([client.auth.signInWithPassword({email,password}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Kết nối Supabase quá lâu (15 giây).')),15000))]);if(r.error)throw r.error;if(!r.data?.session)throw new Error('Supabase không tạo được phiên đăng nhập.');try{sessionStorage.setItem('APPLE_SEED_BUILDER_LOGIN_OK','1')}catch(_){}f.button.textContent='Đã đăng nhập';setTimeout(()=>location.reload(),120)}catch(err){console.error('Apple Seed Builder login V24:',err);loginError(err?.message==='Invalid login credentials'?'Email hoặc Mật khẩu không đúng.':(err?.message||'Đăng nhập thất bại. Vui lòng thử lại.'));f.button.disabled=false;f.button.textContent=old;busy=false}}
function loginIntercept(e){const b=loginBox();if(!b||getComputedStyle(b).display==='none')return;if(e.type==='keydown'){if(e.key!=='Enter'||!b.contains(e.target))return;login(e);return}const f=loginFields();if(!f||!(e.target===f.button||f.button.contains(e.target)))return;login(e)}
function installLogin(){if(loginInstalled)return;loginInstalled=true;window.addEventListener('click',loginIntercept,true);window.addEventListener('keydown',loginIntercept,true)}

/* THEME: the in-memory Builder draft is the sole authority. Legacy localStorage is only mirrored for compatibility and is never read back to override draft. */
const COLOR_KEY='APPLE_SEED_SITE_THEME_V1',FULL_KEY='APPLE_SEED_FULL_THEME_V1';
function norm(v){const n=parseInt(String(v??''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''}
function draftValue(field){try{return norm(typeof draft!=='undefined'&&draft?draft[field]:'')}catch(_){return''}}
function colorValue(){return draftValue('theme_id')||'01'}
function fullValue(){return draftValue('full_theme_id')||'01'}
function mirrorPublishedToStorage(){try{const c=draftValue('theme_id'),t=draftValue('full_theme_id');if(c)localStorage.setItem(COLOR_KEY,c);if(t)localStorage.setItem(FULL_KEY,t)}catch(_){} }
function rootClass(r,p,v){if(!r)return;const wanted=p+v;if(r.classList.contains(wanted))return;for(let i=1;i<=30;i++)r.classList.remove(p+String(i).padStart(2,'0'));r.classList.add(wanted)}
function link(d,id,href){if(!d)return;let e=d.getElementById(id);if(!e){e=d.createElement('link');e.id=id;e.rel='stylesheet';e.href=href;(d.head||d.documentElement).appendChild(e)}}
function apply(){mirrorPublishedToStorage();const f=document.getElementById('preview'),d=f&&f.contentDocument;if(!d?.documentElement)return;const c=colorValue(),t=fullValue();rootClass(d.documentElement,'as-theme-',c);rootClass(d.body,'as-theme-',c);rootClass(d.documentElement,'as-full-theme-',t);rootClass(d.body,'as-full-theme-',t);d.documentElement.classList.add('as-theme-scope','as-full-theme-scope');d.body?.classList.add('as-theme-scope','as-full-theme-scope');link(d,'apple-seed-30-themes-link','site-builder-themes.css?v=20260912-theme1');link(d,'apple-seed-full-themes-link','site-builder-full-themes.css?v=20260912-full3');link(d,'apple-seed-layouts-link','site-builder-layouts.css?v=20260912-layout2')}
function mark(){const c=colorValue(),t=fullValue();document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId||'')===c));document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme||'')===t));const a=document.getElementById('appleSeedThemeStatus');if(a)a.textContent='Đang chọn: Theme '+c+' · áp dụng cho toàn bộ WEB khi Xuất bản.';const b=document.getElementById('appleSeedFullThemeStatus');if(b)b.textContent='Đang chọn: Giao diện '+t+' · áp dụng cho toàn bộ WEB khi Xuất bản.'}
function save(v,key,field){v=norm(v);if(!v)return;try{if(typeof draft!=='undefined'&&draft)draft[field]=v;localStorage.setItem(key,v);if(typeof saveDraft==='function')saveDraft()}catch(_){}apply();mark()}
function themeIntercept(e){const el=e.target?.closest?.('.as-theme-choice,.as-full-theme-choice');if(!el)return;const full=el.classList.contains('as-full-theme-choice'),v=norm(full?el.dataset.fullTheme:el.dataset.themeId);if(!v)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();save(v,full?FULL_KEY:COLOR_KEY,full?'full_theme_id':'theme_id')}
function installTheme(){window.addEventListener('click',themeIntercept,true);const f=document.getElementById('preview');f?.addEventListener('load',()=>{apply();mark()});
  try{if(typeof window.applyAll==='function'&&!window.applyAll.__appleSeedThemeWrapped){const original=window.applyAll;const wrapped=function(){const r=original.apply(this,arguments);try{mirrorPublishedToStorage();apply();mark()}catch(_){}return r};wrapped.__appleSeedThemeWrapped=true;window.applyAll=wrapped}}catch(_){ }
  mark();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installLogin();installTheme()},{once:true});else{installLogin();installTheme()}
})();
