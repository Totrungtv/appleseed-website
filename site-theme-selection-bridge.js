/* APPLE SEED SITE BUILDER LOGIN BRIDGE V20
   Theme bridge disabled temporarily: the Builder's native theme controller owns theme/layout.
   This file only provides the lightweight login fallback. No polling, observers, iframe writes,
   theme writes, or loadPublished calls during login.
*/
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;
  let installed=false,busy=false;
  function box(){return document.querySelector('.login')}
  function error(msg){const b=box(),x=document.getElementById('loginMsg')||b?.querySelector('.danger');if(x){x.textContent=msg||'';x.style.display='block'}}
  function fields(){const b=box();if(!b)return null;const email=b.querySelector('#email,input[type="email"],input[name="email"],#loginEmail');const password=b.querySelector('#password,input[type="password"],input[name="password"],#loginPassword');const button=b.querySelector('#loginBtn,button[type="submit"],button');return email&&password&&button?{b,email,password,button}:null}
  async function login(e){
    const f=fields();if(!f||busy)return;
    e?.preventDefault();e?.stopPropagation();e?.stopImmediatePropagation();
    const email=String(f.email.value||'').trim(),password=String(f.password.value||'');
    if(!email||!password){error('Vui lòng nhập Email và Mật khẩu.');return}
    const client=window.supabaseClient;
    if(!client?.auth?.signInWithPassword){error('Không tải được hệ thống đăng nhập. Hãy tải lại trang.');return}
    busy=true;f.button.disabled=true;const old=f.button.textContent;f.button.textContent='Đang đăng nhập…';error('');
    try{
      const r=await Promise.race([
        client.auth.signInWithPassword({email,password}),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('Kết nối Supabase quá lâu (15 giây).')),15000))
      ]);
      if(r.error)throw r.error;
      if(!r.data?.session)throw new Error('Supabase không tạo được phiên đăng nhập.');
      try{sessionStorage.setItem('APPLE_SEED_BUILDER_LOGIN_OK','1')}catch(_){}
      f.button.textContent='Đã đăng nhập';
      setTimeout(()=>location.reload(),120);
    }catch(err){
      console.error('Apple Seed Builder login V20:',err);
      error(err?.message==='Invalid login credentials'?'Email hoặc Mật khẩu không đúng.':(err?.message||'Đăng nhập thất bại. Vui lòng thử lại.'));
      f.button.disabled=false;f.button.textContent=old;busy=false;
    }
  }
  function intercept(e){
    const b=box();if(!b||getComputedStyle(b).display==='none')return;
    if(e.type==='keydown'){
      if(e.key!=='Enter'||!b.contains(e.target))return;
      login(e);
      return;
    }
    const f=fields();if(!f||!(e.target===f.button||f.button.contains(e.target)))return;
    login(e);
  }
  function install(){
    if(installed)return;installed=true;
    window.addEventListener('click',intercept,true);
    window.addEventListener('keydown',intercept,true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
