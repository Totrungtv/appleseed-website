const memberSB = window.supabaseClient;
const member$ = id => document.getElementById(id);

function memberEsc(s){
  return String(s ?? '').replace(/[&<>"']/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[c]));
}

async function getMemberSession(){
  if(!memberSB) return null;
  const r = await memberSB.auth.getSession();
  return r.data?.session || null;
}

async function memberLogout(){
  if(memberSB) await memberSB.auth.signOut();
  location.reload();
}

async function memberEnsureProfile(user, fullName, phone){
  if(!memberSB || !user) return;

  const cleanName = String(
    fullName || user.user_metadata?.full_name || ''
  ).trim();

  const cleanPhone = String(
    phone || user.user_metadata?.phone || user.phone || ''
  ).trim();

  if(!cleanName){
    throw new Error('Vui lòng nhập họ và tên.');
  }

  if(!cleanPhone){
    throw new Error('Vui lòng nhập số điện thoại. Số điện thoại không được để trống.');
  }

  await memberSB.from('customer_members').upsert({
    user_id:user.id,
    full_name:cleanName,
    phone:cleanPhone,
    email:user.email || null,
    updated_at:new Date().toISOString()
  },{
    onConflict:'user_id'
  });
}

async function memberSignIn(email,password){
  const cleanEmail = String(email || '').trim();

  if(!cleanEmail){
    throw new Error('Vui lòng nhập email.');
  }

  if(!password){
    throw new Error('Vui lòng nhập mật khẩu.');
  }

  const r = await memberSB.auth.signInWithPassword({
    email:cleanEmail,
    password
  });

  if(r.error) throw r.error;

  await memberEnsureProfile(r.data.user,'','');

  return r.data.user;
}

async function memberSignUp(fullName,phone,email,password){

  const cleanName = String(fullName || '').trim();
  const cleanPhone = String(phone || '').trim();
  const cleanEmail = String(email || '').trim();
  const cleanPassword = String(password || '');

  if(!cleanName){
    throw new Error('Vui lòng nhập họ và tên.');
  }

  if(!cleanPhone){
    throw new Error('Vui lòng nhập số điện thoại. Không được để trống.');
  }

  if(!cleanEmail){
    throw new Error('Vui lòng nhập email.');
  }

  if(!cleanPassword){
    throw new Error('Vui lòng nhập mật khẩu.');
  }

  if(cleanPassword.length < 6){
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  const r = await memberSB.auth.signUp({
    email:cleanEmail,
    password:cleanPassword,
    options:{
      data:{
        full_name:cleanName,
        phone:cleanPhone
      }
    }
  });

  if(r.error) throw r.error;

  if(r.data.user && r.data.session){
    await memberEnsureProfile(
      r.data.user,
      cleanName,
      cleanPhone
    );
  }

  return r.data;
}

window.memberSB = memberSB;
window.member$ = member$;
window.memberEsc = memberEsc;
window.getMemberSession = getMemberSession;
window.memberLogout = memberLogout;
window.memberEnsureProfile = memberEnsureProfile;
window.memberSignIn = memberSignIn;
window.memberSignUp = memberSignUp;
