/* APPLE SEED SITE BUILDER THEME BRIDGE V17 */
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;
  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1';
  const FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  let installed=false,lockedColor='',lockedFull='',enforceTimer=null,loginBusy=false;
  function norm(v){const n=parseInt(String(v??''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''}
  function readDraft(field){try{return typeof draft!=='undefined'&&draft?norm(draft[field]):''}catch(_){return ''}}
  function bootstrap(){
    try{lockedColor=norm(localStorage.getItem(COLOR_KEY)||'')}catch(_){lockedColor=''}
    try{lockedFull=norm(localStorage.getItem(FULL_KEY)||'')}catch(_){lockedFull=''}
    if(!lockedColor)lockedColor=readDraft('theme_id');
    if(!lockedFull)lockedFull=readDraft('full_theme_id');
    lockedColor=lockedColor||'01';lockedFull=lockedFull||'01';
    persistLocked();
  }
  function getColor(){return lockedColor||readDraft('theme_id')||'01'}
  function getFull(){return lockedFull||readDraft('full_theme_id')||'01'}
  function setRootClass(r,p,v){if(!r)return;const wanted=p+v;if(r.classList.contains(wanted))return;for(let i=1;i<=30;i++)r.classList.remove(p+String(i).padStart(2,'0'));r.classList.add(wanted)}
  function link(d,id,href){let e=d.getElementById(id);if(!e){e=d.createElement('link');e.id=id;e.rel='stylesheet';e.href=href;(d.head||d.documentElement).appendChild(e)}}
  function applyPreview(){
    const f=document.getElementById('preview'),d=f&&f.contentDocument;if(!d?.documentElement)return;
    const c=getColor(),t=getFull();setRootClass(d.documentElement,'as-theme-',c);setRootClass(d.documentElement,'as-full-theme-',t);
    if(d.body){setRootClass(d.body,'as-theme-',c);setRootClass(d.body,'as-full-theme-',t);d.body.classList.add('as-theme-scope','as-full-theme-scope')}
    d.documentElement.classList.add('as-theme-scope','as-full-theme-scope');
    link(d,'apple-seed-30-themes-link','site-builder-themes.css?v=20260912-theme1');link(d,'apple-seed-full-themes-link','site-builder-full-themes.css?v=20260912-full3');link(d,'apple-seed-layouts-link','site-builder-layouts.css?v=20260912-layout2');
  }
  function mark(){
    const c=getColor(),t=getFull();document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId||'')===c));document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme||'')===t));
    const a=document.getElementById('appleSeedThemeStatus');if(a)a.textContent='Đang chọn: Theme '+c+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
    const b=document.getElementById('appleSeedFullThemeStatus');if(b)b.textContent='Đang chọn: Giao diện '+t+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
  }
  function persistLocked(){
    try{
      if(lockedColor){if(window.__appleSeedSetTheme)window.__appleSeedSetTheme(COLOR_KEY,lockedColor);else localStorage.setItem(COLOR_KEY,lockedColor);if(typeof draft!=='undefined'&&draft)draft.theme_id=lockedColor}
      if(lockedFull){if(window.__appleSeedSetTheme)window.__appleSeedSetTheme(FULL_KEY,lockedFull);else localStorage.setItem(FULL_KEY,lockedFull);if(typeof draft!=='undefined'&&draft)draft.full_theme_id=lockedFull}
    }catch(_){ }
  }
  function save(v,key){v=norm(v);if(!v)return;if(key===COLOR_KEY)lockedColor=v;else lockedFull=v;persistLocked();try{if(typeof saveDraft==='function')saveDraft()}catch(_){}applyPreview();mark();setTimeout(enforce,0);setTimeout(enforce,100);setTimeout(enforce,350)}
  function enforce(){persistLocked();applyPreview();mark()}
  function interceptTheme(e){const el=e.target&&e.target.closest&&e.target.closest('.as-theme-choice,.as-full-theme-choice');if(!el)return;const full=el.classList.contains('as-full-theme-choice');const v=norm(full?el.dataset.fullTheme:el.dataset.themeId);if(!v)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();save(v,full?FULL_KEY:COLOR_KEY)}
  function loginBox(){return document.querySelector('.login')}
  function loginError(message){const box=loginBox();if(!box)return;const el=document.getElementById('loginMsg')||box.querySelector('.danger');if(el){el.textContent=message||'';el.style.display='block'}}
  function loginFields(){const box=loginBox();if(!box)return null;const email=box.querySelector('#email,input[type="email"],input[name="email"],#loginEmail');const password=box.querySelector('#password,input[type="password"],input[name="password"],#loginPassword');const button=box.querySelector('#loginBtn,button[type="submit"],button');if(!email||!password||!button)return null;return{box,email,password,button}}
  function withTimeout(p,ms,message){return Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms))])}
  async function verifyBuilderRole(user){if(!user?.id)throw new Error('Không xác định được tài khoản sau khi đăng nhập.');const r=await withTimeout(window.supabaseClient.rpc('apple_seed_is_admin_or_staff'),10000,'Kiểm tra quyền Builder quá lâu.');if(r.error)throw new Error('Không kiểm tra được quyền Builder: '+r.error.message);if(r.data!==true)throw new Error('Tài khoản đã đăng nhập nhưng không có quyền Visual Site Builder.');try{allowed=true}catch(_){}return true}
  async function finishBuilderLogin(f){const session=await withTimeout(window.supabaseClient.auth.getSession(),8000,'Không đọc được phiên đăng nhập.');if(session.error)throw session.error;const user=session.data?.session?.user;if(!user)throw new Error('Phiên đăng nhập chưa được tạo.');await verifyBuilderRole(user);if(f)f.button.textContent='Đã đăng nhập';const box=loginBox();if(box)box.style.display='none';const status=document.getElementById('status');if(status)status.textContent='Đã xác thực · Admin/Staff';try{if(typeof loadPublished==='function')await withTimeout(loadPublished(),12000,'Nạp dữ liệu Builder quá lâu.')}catch(e){console.warn('Builder load after login:',e)}}
  async function loginFallback(e){const f=loginFields();if(!f||loginBusy)return;if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}const email=String(f.email.value||'').trim(),password=String(f.password.value||'');if(!email||!password){loginError('Vui lòng nhập Email và Mật khẩu.');return}const client=window.supabaseClient;if(!client?.auth||typeof client.auth.signInWithPassword!=='function'){loginError('Không tải được hệ thống đăng nhập. Hãy tải lại trang.');return}loginBusy=true;f.button.disabled=true;const oldText=f.button.textContent;f.button.textContent='Đang đăng nhập…';loginError('Đang xác thực tài khoản…');try{const r=await withTimeout(client.auth.signInWithPassword({email,password}),15000,'Kết nối Supabase quá lâu (15 giây). Kiểm tra mạng rồi thử lại.');if(r.error)throw r.error;if(!r.data?.session)throw new Error('Supabase không tạo được phiên đăng nhập.');loginError('Đăng nhập thành công · đang kiểm tra quyền…');await finishBuilderLogin(f);try{sessionStorage.setItem('APPLE_SEED_BUILDER_LOGIN_OK','1')}catch(_){}}catch(err){console.error('Apple Seed Builder login V17:',err);loginError(err?.message==='Invalid login credentials'?'Email hoặc Mật khẩu không đúng.':(err?.message||'Đăng nhập thất bại. Vui lòng thử lại.'));f.button.disabled=false;f.button.textContent=oldText;loginBusy=false}}
  async function recoverExistingSession(){const box=loginBox();if(!box)return;try{const s=await withTimeout(window.supabaseClient.auth.getSession(),8000,'');if(s.data?.session?.user){try{await verifyBuilderRole(s.data.session.user);box.style.display='none';const st=document.getElementById('status');if(st)st.textContent='Đã xác thực · Admin/Staff'}catch(e){console.warn('Builder existing session role:',e)}}}catch(_){}}
  function loginIntercept(e){const box=loginBox();if(!box||getComputedStyle(box).display==='none')return;const target=e.target;if(e.type==='keydown'){if(e.key!=='Enter'||!target||!box.contains(target))return}else{const f=loginFields();if(!f||!(target===f.button||f.button.contains(target)))return}loginFallback(e)}
  function install(){if(installed)return;installed=true;bootstrap();enforce();const frame=document.getElementById('preview');if(frame)frame.addEventListener('load',()=>{enforce();setTimeout(enforce,100);setTimeout(enforce,500)});window.addEventListener('pointerdown',interceptTheme,true);window.addEventListener('click',interceptTheme,true);window.addEventListener('click',loginIntercept,true);window.addEventListener('keydown',loginIntercept,true);if(enforceTimer)clearInterval(enforceTimer);enforceTimer=setInterval(enforce,1200);setTimeout(recoverExistingSession,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
