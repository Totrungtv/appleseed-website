from pathlib import Path

p = Path('site-builder.html')
s = p.read_text(encoding='utf-8')
marker = '/* SITE_BUILDER_LOGIN_FIX_V2 */'
if marker in s:
    print('already patched')
    raise SystemExit(0)

old = "$('loginBtn').onclick=async()=>{const r=await window.supabaseClient.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(r.error){$('loginMsg').textContent=r.error.message;return}location.reload()};"
new = r'''$('loginBtn').onclick=async()=>{
  const btn=$('loginBtn');
  const email=$('email').value.trim();
  const password=$('password').value;
  if(!email||!password){$('loginMsg').textContent='Vui lòng nhập Email và Mật khẩu.';return}
  btn.disabled=true;
  const oldText=btn.textContent;
  btn.textContent='Đang đăng nhập…';
  $('loginMsg').textContent='';
  try{
    const r=await Promise.race([
      window.supabaseClient.auth.signInWithPassword({email,password}),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('Kết nối đăng nhập quá lâu. Hãy tải lại trang rồi thử lại.')),15000))
    ]);
    if(r.error){$('loginMsg').textContent=r.error.message;return}
    $('loginMsg').textContent='Đăng nhập thành công. Đang kiểm tra quyền…';
    const ok=await Promise.race([
      checkRole().then(()=>true),
      new Promise(resolve=>setTimeout(()=>resolve(false),10000))
    ]);
    if(!ok){$('loginMsg').textContent='Đăng nhập đã thành công nhưng kiểm tra quyền quá lâu. Hãy bấm F5 và thử lại.';return}
  }catch(e){
    $('loginMsg').textContent=e?.message||'Không thể đăng nhập. Hãy thử lại.';
  }finally{
    btn.disabled=false;
    btn.textContent=oldText;
  }
};
$('password').addEventListener('keydown',e=>{if(e.key==='Enter')$('loginBtn').click()});'''
if old not in s:
    raise SystemExit('login handler not found')
s = s.replace(old, new, 1)

old2 = '  await checkRole();'
new2 = "  const roleBoot=await Promise.race([checkRole().then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),12000))]);\n  if(!roleBoot){$('login').style.display='flex';$('loginMsg').textContent='Không kết nối được hệ thống quyền sau 12 giây. Kiểm tra mạng rồi bấm Đăng nhập lại.';}"
if old2 not in s:
    raise SystemExit('boot checkRole not found')
s = s.replace(old2, new2, 1)

s = s.replace('</style>', '\n'+marker+'\n</style>', 1)
p.write_text(s, encoding='utf-8')
print('patched site-builder.html')
