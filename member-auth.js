const memberSB = window.supabaseClient;

const member$ = id => document.getElementById(id);

/* =========================
   ESCAPE HTML
========================= */
function memberEsc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[c]));
}


/* =========================
   CHECK SUPABASE
========================= */
function memberCheckSB(){
  if(!memberSB){
    throw new Error(
      'Supabase chưa được khởi tạo. Hãy kiểm tra file Supabase và thứ tự load JavaScript.'
    );
  }

  if(!memberSB.auth){
    throw new Error(
      'Supabase Auth chưa sẵn sàng.'
    );
  }

  return memberSB;
}


/* =========================
   GET SESSION
========================= */
async function getMemberSession(){

  if(!memberSB || !memberSB.auth){
    return null;
  }

  try{

    const r = await memberSB.auth.getSession();

    if(r.error){
      console.error('getMemberSession error:', r.error);
      return null;
    }

    return r.data?.session || null;

  }catch(err){

    console.error('getMemberSession exception:', err);
    return null;
  }
}


/* =========================
   LOGOUT
========================= */
async function memberLogout(){

  if(!memberSB || !memberSB.auth){
    location.reload();
    return;
  }

  try{

    const r = await memberSB.auth.signOut();

    if(r.error){
      console.error('Logout error:', r.error);
    }

  }catch(err){

    console.error('Logout exception:', err);

  }finally{

    location.reload();

  }
}


/* =========================
   ENSURE CUSTOMER PROFILE
========================= */
async function memberEnsureProfile(user, fullName, phone){

  memberCheckSB();

  if(!user || !user.id){
    throw new Error('Không tìm thấy tài khoản người dùng.');
  }


  const cleanName = String(
    fullName ||
    user.user_metadata?.full_name ||
    ''
  ).trim();


  const cleanPhone = String(
    phone ||
    user.user_metadata?.phone ||
    user.phone ||
    ''
  ).trim();


  if(!cleanName){
    throw new Error('Vui lòng nhập họ và tên.');
  }


  if(!cleanPhone){
    throw new Error(
      'Vui lòng nhập số điện thoại. Số điện thoại không được để trống.'
    );
  }


  const payload = {
    user_id: user.id,
    full_name: cleanName,
    phone: cleanPhone,
    email: user.email || null,
    updated_at: new Date().toISOString()
  };


  const r = await memberSB
    .from('customer_members')
    .upsert(
      payload,
      {
        onConflict: 'user_id'
      }
    );


  /* QUAN TRỌNG:
     Không được bỏ qua lỗi Supabase */
  if(r.error){

    console.error(
      'customer_members upsert error:',
      r.error
    );

    throw new Error(
      r.error.message ||
      'Không thể lưu thông tin khách hàng.'
    );
  }


  return true;
}


/* =========================
   SIGN IN
========================= */
async function memberSignIn(email, password){

  memberCheckSB();

  const cleanEmail = String(email || '').trim();

  if(!cleanEmail){
    throw new Error('Vui lòng nhập email.');
  }

  if(!password){
    throw new Error('Vui lòng nhập mật khẩu.');
  }

  const r = await memberSB.auth.signInWithPassword({
    email: cleanEmail,
    password: password
  });

  if(r.error){
    console.error('memberSignIn error:', r.error);

    throw new Error(
      r.error.message ||
      'Email hoặc mật khẩu không chính xác.'
    );
  }

  const user = r.data?.user;

  if(!user){
    throw new Error(
      'Đăng nhập thành công nhưng không nhận được thông tin tài khoản.'
    );
  }

  /*
   * ĐĂNG NHẬP KHÔNG ĐƯỢC BẮT NHẬP HỌ TÊN / SỐ ĐIỆN THOẠI.
   *
   * Nếu đã có hồ sơ customer_members thì giữ nguyên.
   * Không có hồ sơ cũng KHÔNG làm đăng nhập thất bại.
   */

  try{

    const p = await memberSB
      .from('customer_members')
      .select('full_name, phone')
      .eq('user_id', user.id)
      .maybeSingle();

    if(p.error){

      console.warn(
        'Không đọc được customer_members:',
        p.error
      );

    }else if(p.data){

      /*
       * Có profile thì không cần làm gì thêm.
       */
      console.log(
        'Member profile:',
        p.data
      );
    }

  }catch(err){

    /*
     * Lỗi profile không được phép
     * làm hỏng đăng nhập.
     */
    console.warn(
      'Profile check skipped:',
      err
    );

  }

  return user;
}


/* =========================
   SIGN UP
========================= */
async function memberSignUp(
  fullName,
  phone,
  email,
  password
){

  memberCheckSB();


  const cleanName = String(
    fullName || ''
  ).trim();


  const cleanPhone = String(
    phone || ''
  ).trim();


  const cleanEmail = String(
    email || ''
  ).trim();


  const cleanPassword = String(
    password || ''
  );


  if(!cleanName){
    throw new Error(
      'Vui lòng nhập họ và tên.'
    );
  }


  if(!cleanPhone){
    throw new Error(
      'Vui lòng nhập số điện thoại. Không được để trống.'
    );
  }


  if(!cleanEmail){
    throw new Error(
      'Vui lòng nhập email.'
    );
  }


  if(!cleanPassword){
    throw new Error(
      'Vui lòng nhập mật khẩu.'
    );
  }


  if(cleanPassword.length < 6){
    throw new Error(
      'Mật khẩu phải có ít nhất 6 ký tự.'
    );
  }


  const r = await memberSB.auth.signUp({

    email: cleanEmail,

    password: cleanPassword,

    options: {

      data: {

        full_name: cleanName,

        phone: cleanPhone

      }

    }

  });


  if(r.error){

    console.error(
      'memberSignUp error:',
      r.error
    );

    throw new Error(
      r.error.message ||
      'Không thể tạo tài khoản.'
    );
  }


  /*
     Trường hợp Supabase không yêu cầu
     xác nhận email -> có session ngay.
  */
  if(r.data?.user && r.data?.session){

    await memberEnsureProfile(
      r.data.user,
      cleanName,
      cleanPhone
    );

  }


  return r.data;
}


/* =========================
   AUTH STATE LISTENER
========================= */
function memberOnAuthStateChange(callback){

  if(!memberSB || !memberSB.auth){
    console.warn(
      'memberOnAuthStateChange: Supabase Auth chưa sẵn sàng.'
    );

    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }


  return memberSB.auth.onAuthStateChange(
    (event, session) => {

      try{

        if(typeof callback === 'function'){
          callback(event, session);
        }

      }catch(err){

        console.error(
          'Auth callback error:',
          err
        );

      }

    }
  );
}


/* =========================
   EXPORT GLOBAL
========================= */
window.memberSB = memberSB;

window.member$ = member$;

window.memberEsc = memberEsc;

window.memberCheckSB = memberCheckSB;

window.getMemberSession = getMemberSession;

window.memberLogout = memberLogout;

window.memberEnsureProfile = memberEnsureProfile;

window.memberSignIn = memberSignIn;

window.memberSignUp = memberSignUp;

window.memberOnAuthStateChange = memberOnAuthStateChange;
