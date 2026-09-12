/* APPLE SEED SITE BUILDER THEME BRIDGE V18 */
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;
  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1',FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  let installed=false,lockedColor='',lockedFull='',enforceTimer=null,loginBusy=false;
  const norm=v=>{const n=parseInt(String(v??''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''};
  const readDraft=k=>{try{return typeof draft!=='undefined'&&draft?norm(draft[k]):''}catch(_){return ''}};
  function bootstrap(){
    lockedColor=readDraft('theme_id');lockedFull=readDraft('full_theme_id');
    try{if(!lockedColor)lockedColor=norm(localStorage.getItem(COLOR_KEY)||'');if(!lockedFull)lockedFull=norm(localStorage.getItem(FULL_KEY)||'')}catch(_){}
    lockedColor=lockedColor||'01';lockedFull=lockedFull||'01';
    sync();
  }
  function sync(){
    try{if(lockedColor)localStorage.setItem(COLOR_KEY,lockedColor);if(lockedFull)localStorage.setItem(FULL_KEY,lockedFull)}catch(_){}
    try{if(typeof draft!=='undefined'&&draft){draft.theme_id=lockedColor;draft.full_theme_id=lockedFull}}catch(_){}
  }
  function getColor(){return lockedColor||readDraft('theme_id')||'01'}
  function getFull(){return lockedFull||readDraft('full_theme_id')||'01'}
  function setClass(r,p,v){if(!r)return;const w=p+v;if(r.classList.contains(w))return;for(let i=1;i<=30;i++)r.classList.remove(p+String(i).padStart(2,'0'));r.classList.add(w)}
  function link(d,id,href){if(!d)return;let e=d.getElementById(id);if(!e){e=d.createElement('link');e.id=id;e.rel='stylesheet';e.href=href;(d.head||d.documentElement).appendChild(e)}}
  function applyPreview(){const f=document.getElementById('preview'),d=f&&f.contentDocument;if(!d?.documentElement)return;const c=getColor(),t=getFull(),r=d.documentElement,b=d.body;setClass(r,'as-theme-',c);setClass(r,'as-full-theme-',t);if(b){setClass(b,'as-theme-',c);setClass(b,'as-full-theme-',t);b.classList.add('as-theme-scope','as-full-theme-scope')}r.classList.add('as-theme-scope','as-full-theme-scope');link(d,'apple-seed-30-themes-bridge-link','site-builder-themes.css?v=20260912-theme1');link(d,'apple-seed-full-themes-bridge-link','site-builder-full-themes.css?v=20260912-full3');link(d,'apple-seed-layouts-bridge-link','site-builder-layouts.css?v=20260912-layout2')}
  function mark(){const c=getColor(),t=getFull();document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId||'')===c));document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme||'')===t));const a=document.getElementById('appleSeedThemeStatus');if(a)a.textContent='Đang chọn: Theme '+c+' · áp dụng cho toàn bộ WEB khi Xuất bản.';const b=document.getElementById('appleSeedFullThemeStatus');if(b)b.textContent='Đang chọn: Giao diện '+t+' · áp dụng cho toàn bộ WEB khi Xuất bản.'}
  function save(v,key){v=norm(v);if(!v)return;if(key===COLOR_KEY)lockedColor=v;else if(key===FULL_KEY)lockedFull=v;else return;sync();try{if(typeof saveDraft==='function')saveDraft()}catch(_){}applyPreview();mark();setTimeout(enforce,0);setTimeout(enforce,120);setTimeout(enforce,400)}
  function enforce(){sync();applyPreview();mark()}
  function interceptTheme(e){const el=e.target?.closest?.('.as-theme-choice,.as-full-theme-choice');if(!el)return;const full=el.classList.contains('as-full-theme-choice'),v=norm(full?el.dataset.fullTheme:el.dataset.themeId);if(!v)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();save(v,full?FULL_KEY:COLOR_KEY)}
  function loginBox(){return document.querySelector('.login')}
  function loginError(m){const b=loginBox(),x=document.getElementById('loginMsg')||b?.querySelector('.danger');if(x){x.textContent=m||'';x.style.display='block'}}
  function fields(){const b=loginBox();if(!b)return null;const email=b.querySelector('#email,input[type="email"],input[name="email"],#loginEmail'),password=b.querySelector('#password,input[type="password"],input[name="password"],#loginPassword'),button=b.querySelector('#loginBtn,button[type="submit"],button');return email&&password&&button?{b,email,password,button}:null}
  const timeout=(p,ms,msg)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error(msg)),ms))]);
  async function role(user){if(!user?.id)throw new Error('Không xác định được tài khoản sau khi đăng nhập.');const r=await timeout(window.supabaseClient.rpc('apple_seed_is_admin_or_staff'),10000,'Kiểm tra quyền Builder quá lâu.');if(r.error)throw new Error('Không kiểm tra được quyền Builder: '+r.error.message);if(r.data!==true)throw new Error('Tài khoản đã đăng nhập nhưng không có quyền Visual Site Builder.');try{allowed=true}catch(_){}return true}
  async function login(e){const f=fields();if(!f||loginBusy)return;e?.preventDefault();e?.stopPropagation();e?.stopImmediatePropagation();const email=String(f.email.value||'').trim(),password=String(f.password.value||'');if(!email||!password){loginError('Vui lòng nhập Email và Mật khẩu.');return}const c=window.supabaseClient;if(!c?.auth?.signInWithPassword){loginError('Không tải được hệ thống đăng nhập. Hãy tải lại trang.');return}loginBusy=true;f.button.disabled=true;const old=f.button.textContent;f.button.textContent='Đang đăng nhập…';loginError('Đang xác thực tài khoản…');try{const r=await timeout(c.auth.signInWithPassword({email,password}),15000,'Kết nối Supabase quá lâu (15 giây). Kiểm tra mạng rồi thử lại.');if(r.error)throw r.error;if(!r.data?.session)throw new Error('Supabase không tạo được phiên đăng nhập.');await role(r.data.session.user);loginError('Đăng nhập thành công · đang nạp Builder…');const box=loginBox();if(box)box.style.display='none';const st=document.getElementById('status');if(st)st.textContent='Đã xác thực · Admin/Staff';try{if(typeof loadPublished==='function')await timeout(loadPublished(),12000,'Nạp dữ liệu Builder quá lâu.')}catch(x){console.warn('Builder load after login:',x)}try{sessionStorage.setItem('APPLE_SEED_BUILDER_LOGIN_OK','1')}catch(_){} }catch(err){console.error('Apple Seed Builder login V18:',err);loginError(err?.message==='Invalid login credentials'?'Email hoặc Mật khẩu không đúng.':(err?.message||'Đăng nhập thất bại. Vui lòng thử lại.'));f.button.disabled=false;f.button.textContent=old;loginBusy=false}}
  function loginIntercept(e){const b=loginBox();if(!b||getComputedStyle(b).display==='none')return;if(e.type==='keydown'){if(e.key!=='Enter'||!b.contains(e.target))return}else{const f=fields();if(!f||!(e.target===f.button||f.button.contains(e.target)))return}login(e)}
  async function recover(){const b=loginBox();if(!b)return;try{const s=await timeout(window.supabaseClient.auth.getSession(),8000,'');if(s.data?.session?.user){await role(s.data.session.user);b.style.display='none';const st=document.getElementById('status');if(st)st.textContent='Đã xác thực · Admin/Staff'}}catch(_){}
  }
  function install(){if(installed)return;installed=true;bootstrap();applyPreview();mark();const f=document.getElementById('preview');if(f&&!f.__appleSeedThemeBridgeV18){f.__appleSeedThemeBridgeV18=true;f.addEventListener('load',()=>{applyPreview();mark();setTimeout(applyPreview,250)})}window.addEventListener('pointerdown',interceptTheme,true);window.addEventListener('click',interceptTheme,true);window.addEventListener('click',loginIntercept,true);window.addEventListener('keydown',loginIntercept,true);enforceTimer=setInterval(enforce,1800);setTimeout(recover,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
