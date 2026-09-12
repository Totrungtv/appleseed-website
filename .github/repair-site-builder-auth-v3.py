from pathlib import Path
import re

p=Path('site-builder.html')
s=p.read_text(encoding='utf-8')
marker='/* SITE_BUILDER_AUTH_FIX_V3 */'
if marker in s:
    print('already patched')
    raise SystemExit(0)

pattern=r"\$\('loginBtn'\)\.onclick=async\(\)=>\{.*?\nasync function checkRole\(\)\{.*?\n\}\n"
replacement=r'''/* SITE_BUILDER_AUTH_FIX_V3 */
let builderRolePromise=null;
async function resolveBuilderRole(user){
  if(!user?.id){$('login').style.display='flex';return false}
  const r=await window.supabaseClient.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if(r.error) throw new Error('Không đọc được quyền tài khoản: '+r.error.message);
  const role=String(r.data?.role||'').toLowerCase();
  if(!['admin','staff'].includes(role)){
    allowed=false;
    $('login').style.display='flex';
    $('loginMsg').textContent='Tài khoản đã đăng nhập nhưng không có quyền Visual Site Builder.';
    return false;
  }
  allowed=true;
  $('login').style.display='none';
  $('loginMsg').textContent='';
  setStatus('Đã xác thực · '+role);
  return true;
}
async function checkRole(){
  if(builderRolePromise) return builderRolePromise;
  builderRolePromise=(async()=>{
    try{
      const s=await window.supabaseClient.auth.getSession();
      if(s.error) throw s.error;
      const user=s.data?.session?.user;
      if(!user){allowed=false;$('login').style.display='flex';return false}
      return await resolveBuilderRole(user);
    }catch(e){
      allowed=false;
      $('login').style.display='flex';
      $('loginMsg').textContent=e?.message||'Không kiểm tra được phiên đăng nhập.';
      return false;
    }finally{builderRolePromise=null}
  })();
  return builderRolePromise;
}
$('loginBtn').onclick=async()=>{
  const btn=$('loginBtn');
  const email=$('email').value.trim();
  const password=$('password').value;
  if(!email||!password){$('loginMsg').textContent='Vui lòng nhập Email và Mật khẩu.';return}
  btn.disabled=true;
  const oldText=btn.textContent;
  btn.textContent='Đang đăng nhập…';
  $('loginMsg').textContent='Đang kết nối tài khoản…';
  try{
    const r=await Promise.race([
      window.supabaseClient.auth.signInWithPassword({email,password}),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('Kết nối Supabase quá lâu (15 giây). Kiểm tra mạng rồi thử lại.')),15000))
    ]);
    if(r.error){$('loginMsg').textContent=r.error.message||'Đăng nhập thất bại.';return}
    const user=r.data?.user;
    if(!user){$('loginMsg').textContent='Supabase không trả về tài khoản sau khi đăng nhập.';return}
    $('loginMsg').textContent='Đăng nhập thành công · đang xác nhận quyền…';
    const ok=await Promise.race([
      resolveBuilderRole(user),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('Kiểm tra quyền quá lâu. Phiên đăng nhập đã tạo nhưng Builder chưa xác nhận được quyền.')),10000))
    ]);
    if(!ok) return;
    // Force a clean Builder data load without reloading the page or reopening the auth modal.
    try{if(typeof loadPublished==='function') await loadPublished();}catch(e){console.warn('Builder load after login:',e)}
  }catch(e){
    $('loginMsg').textContent=e?.message||'Không thể đăng nhập. Hãy thử lại.';
  }finally{
    btn.disabled=false;
    btn.textContent=oldText;
  }
};
$('password').addEventListener('keydown',e=>{if(e.key==='Enter')$('loginBtn').click()});
window.supabaseClient.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){
    allowed=false;$('login').style.display='flex';setStatus('Chưa đăng nhập');
  }else if((event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&session?.user){
    setTimeout(()=>resolveBuilderRole(session.user).catch(e=>console.warn('Builder auth state:',e)),0);
  }
});
'''
ns,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
if n!=1:
    raise SystemExit(f'login block not found: {n}')
p.write_text(ns,encoding='utf-8')
print('patched auth v3')
