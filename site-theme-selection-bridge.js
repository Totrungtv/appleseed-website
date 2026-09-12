/* APPLE SEED SITE BUILDER THEME BRIDGE V19
   Single, event-driven controller. No polling, no MutationObserver, no Storage.prototype hooks.
   Never writes a default theme during Builder startup.
*/
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;

  const COLOR_KEY='APPLE_SEED_SITE_THEME_V1',FULL_KEY='APPLE_SEED_FULL_THEME_V1';
  let installed=false,loginBusy=false,pending=null;
  const norm=v=>{const n=parseInt(String(v??''),10);return n>=1&&n<=30?String(n).padStart(2,'0'):''};
  const draftValue=k=>{try{return typeof draft!=='undefined'&&draft?norm(draft[k]):''}catch(_){return ''}};
  const storageValue=k=>{try{return norm(localStorage.getItem(k)||'')}catch(_){return ''}};
  const current=(key,draftKey)=>draftValue(draftKey)||storageValue(key);

  function setClass(root,prefix,id){
    if(!root||!id)return;
    const wanted=prefix+id;
    if(root.classList.contains(wanted))return;
    for(let i=1;i<=30;i++)root.classList.remove(prefix+String(i).padStart(2,'0'));
    root.classList.add(wanted);
  }
  function addCss(d,id,href){
    if(!d||!d.getElementById||d.getElementById(id))return;
    const l=d.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;(d.head||d.documentElement).appendChild(l);
  }
  function applyPreview(){
    const f=document.getElementById('preview'),d=f&&f.contentDocument;
    if(!d?.documentElement)return;
    const c=current(COLOR_KEY,'theme_id'),t=current(FULL_KEY,'full_theme_id');
    if(!c&&!t)return;
    const r=d.documentElement,b=d.body;
    if(c){setClass(r,'as-theme-',c);if(b)setClass(b,'as-theme-',c)}
    if(t){setClass(r,'as-full-theme-',t);if(b)setClass(b,'as-full-theme-',t)}
    r.classList.add('as-theme-scope','as-full-theme-scope');
    if(b)b.classList.add('as-theme-scope','as-full-theme-scope');
    addCss(d,'apple-seed-30-themes-bridge-link','site-builder-themes.css?v=20260912-theme1');
    addCss(d,'apple-seed-full-themes-bridge-link','site-builder-full-themes.css?v=20260912-full3');
    addCss(d,'apple-seed-layouts-bridge-link','site-builder-layouts.css?v=20260912-layout2');
  }
  function mark(){
    const c=current(COLOR_KEY,'theme_id'),t=current(FULL_KEY,'full_theme_id');
    if(c)document.querySelectorAll('.as-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.themeId||'')===c));
    if(t)document.querySelectorAll('.as-full-theme-choice').forEach(x=>x.classList.toggle('active',norm(x.dataset.fullTheme||'')===t));
    const a=document.getElementById('appleSeedThemeStatus');if(a&&c)a.textContent='Đang chọn: Theme '+c+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
    const b=document.getElementById('appleSeedFullThemeStatus');if(b&&t)b.textContent='Đang chọn: Giao diện '+t+' · áp dụng cho toàn bộ WEB khi Xuất bản.';
  }
  function commit(v,key){
    v=norm(v);if(!v)return;
    try{localStorage.setItem(key,v)}catch(_){}
    try{
      if(typeof draft!=='undefined'&&draft){
        if(key===COLOR_KEY)draft.theme_id=v; else if(key===FULL_KEY)draft.full_theme_id=v;
      }
    }catch(_){}
    try{if(typeof saveDraft==='function')saveDraft()}catch(_){}
    applyPreview();mark();
  }
  function rememberChoice(e){
    const el=e.target?.closest?.('.as-theme-choice,.as-full-theme-choice');
    if(!el)return;
    const full=el.classList.contains('as-full-theme-choice');
    const v=norm(full?el.dataset.fullTheme:el.dataset.themeId);
    if(v)pending={v,key:full?FULL_KEY:COLOR_KEY};
  }
  function finishChoice(){
    if(!pending)return;
    const p=pending;pending=null;
    commit(p.v,p.key);
  }

  function loginBox(){return document.querySelector('.login')}
  function loginError(m){const b=loginBox(),x=document.getElementById('loginMsg')||b?.querySelector('.danger');if(x){x.textContent=m||'';x.style.display='block'}}
  function fields(){const b=loginBox();if(!b)return null;const email=b.querySelector('#email,input[type="email"],input[name="email"],#loginEmail'),password=b.querySelector('#password,input[type="password"],input[name="password"],#loginPassword'),button=b.querySelector('#loginBtn,button[type="submit"],button');return email&&password&&button?{b,email,password,button}:null}
  const timeout=(p,ms,msg)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error(msg)),ms))]);
  async function role(user){
    if(!user?.id)throw new Error('Không xác định được tài khoản sau khi đăng nhập.');
    const r=await timeout(window.supabaseClient.rpc('apple_seed_is_admin_or_staff'),10000,'Kiểm tra quyền Builder quá lâu.');
    if(r.error)throw new Error('Không kiểm tra được quyền Builder: '+r.error.message);
    if(r.data!==true)throw new Error('Tài khoản đã đăng nhập nhưng không có quyền Visual Site Builder.');
    try{allowed=true}catch(_){}
    return true;
  }
  async function login(e){
    const f=fields();if(!f||loginBusy)return;
    e?.preventDefault();e?.stopPropagation();e?.stopImmediatePropagation();
    const email=String(f.email.value||'').trim(),password=String(f.password.value||'');
    if(!email||!password){loginError('Vui lòng nhập Email và Mật khẩu.');return}
    const c=window.supabaseClient;if(!c?.auth?.signInWithPassword){loginError('Không tải được hệ thống đăng nhập. Hãy tải lại trang.');return}
    loginBusy=true;f.button.disabled=true;const old=f.button.textContent;f.button.textContent='Đang đăng nhập…';loginError('Đang xác thực tài khoản…');
    try{
      const r=await timeout(c.auth.signInWithPassword({email,password}),15000,'Kết nối Supabase quá lâu (15 giây). Kiểm tra mạng rồi thử lại.');
      if(r.error)throw r.error;if(!r.data?.session)throw new Error('Supabase không tạo được phiên đăng nhập.');
      await role(r.data.session.user);loginError('Đăng nhập thành công · đang nạp Builder…');
      const box=loginBox();if(box)box.style.display='none';
      const st=document.getElementById('status');if(st)st.textContent='Đã xác thực · Admin/Staff';
      try{if(typeof loadPublished==='function')await timeout(loadPublished(),12000,'Nạp dữ liệu Builder quá lâu.')}catch(x){console.warn('Builder load after login:',x)}
      try{sessionStorage.setItem('APPLE_SEED_BUILDER_LOGIN_OK','1')}catch(_){}
    }catch(err){
      console.error('Apple Seed Builder login V19:',err);
      loginError(err?.message==='Invalid login credentials'?'Email hoặc Mật khẩu không đúng.':(err?.message||'Đăng nhập thất bại. Vui lòng thử lại.'));
      f.button.disabled=false;f.button.textContent=old;loginBusy=false;
    }
  }
  function loginIntercept(e){
    const b=loginBox();if(!b||getComputedStyle(b).display==='none')return;
    if(e.type==='keydown'){if(e.key!=='Enter'||!b.contains(e.target))return}
    else{const f=fields();if(!f||!(e.target===f.button||f.button.contains(e.target)))return}
    login(e);
  }
  async function recover(){
    const b=loginBox();if(!b)return;
    try{const s=await timeout(window.supabaseClient.auth.getSession(),8000,'');if(s.data?.session?.user){await role(s.data.session.user);b.style.display='none';const st=document.getElementById('status');if(st)st.textContent='Đã xác thực · Admin/Staff'}}catch(_){}
  }
  function install(){
    if(installed)return;installed=true;
    window.addEventListener('pointerdown',rememberChoice,true);
    window.addEventListener('click',rememberChoice,true);
    window.addEventListener('click',()=>setTimeout(finishChoice,0),false);
    window.addEventListener('click',loginIntercept,true);
    window.addEventListener('keydown',loginIntercept,true);
    const f=document.getElementById('preview');
    if(f&&!f.__appleSeedThemeBridgeV19){
      f.__appleSeedThemeBridgeV19=true;
      f.addEventListener('load',()=>{applyPreview();mark()});
    }
    // Do not touch theme/localStorage at boot. loadPublished() owns the initial draft.
    setTimeout(()=>{applyPreview();mark()},0);
    setTimeout(recover,0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
