const memberSB = window.supabaseClient;
const member$ = id => document.getElementById(id);

function memberEsc(s){
  return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
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
  await memberSB.from('customer_members').upsert({
    user_id:user.id,
    full_name:(fullName||user.user_metadata?.full_name||'Khách hàng').trim(),
    phone:(phone||user.user_metadata?.phone||user.phone||'').trim(),
    email:user.email||null,
    updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
}

async function memberSignIn(email,password){
  const r=await memberSB.auth.signInWithPassword({email:email.trim(),password});
  if(r.error) throw r.error;
  await memberEnsureProfile(r.data.user,'','');
  return r.data.user;
}

async function memberSignUp(fullName,phone,email,password){
  const r=await memberSB.auth.signUp({
    email:email.trim(),
    password,
    options:{data:{full_name:fullName.trim(),phone:phone.trim()}}
  });
  if(r.error) throw r.error;
  if(r.data.user && r.data.session){
    await memberEnsureProfile(r.data.user,fullName,phone);
  }
  return r.data;
}

window.memberSB=memberSB;
window.member$=member$;
window.memberEsc=memberEsc;
window.getMemberSession=getMemberSession;
window.memberLogout=memberLogout;
window.memberEnsureProfile=memberEnsureProfile;
window.memberSignIn=memberSignIn;
window.memberSignUp=memberSignUp;
