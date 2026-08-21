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

  if(r.error){
    console.error('GET MEMBER SESSION ERROR:', r.error);
    return null;
  }

  return r.data?.session || null;
}

async function memberLogout(){
  try{
    if(memberSB){
      await memberSB.auth.signOut();
    }
  }catch(e){
    console.error('LOGOUT ERROR:', e);
  }

  location.reload();
}


/*
  APPLE SEED MEMBER AUTH FIX

  QUAN TRỌNG:
  - Đăng nhập tài khoản cũ KHÔNG bắt nhập lại họ tên/SĐT.
  - Nếu customer_members đã có dữ liệu thì giữ nguyên.
  - Nếu chưa có hồ sơ thì vẫn cho đăng nhập.
  - Chỉ bắt họ tên + SĐT khi ĐĂNG KÝ tài khoản mới.
*/

async function memberEnsureProfile(
  user,
  fullName = '',
  phone = '',
  required = false
){
  if(!memberSB || !user) return null;

  let cleanName = String(
    fullName ||
    user.user_metadata?.full_name ||
    ''
  ).trim();

  let cleanPhone = String(
    phone ||
    user.user_metadata?.phone ||
    user.phone ||
    ''
  ).trim();


  // Lấy hồ sơ hiện tại
  const existing = await memberSB
    .from('customer_members')
    .select('full_name,phone,email')
    .eq('user_id', user.id)
    .maybeSingle();


  if(existing.error && existing.error.code !== 'PGRST116'){
    console.error('LOAD MEMBER PROFILE ERROR:', existing.error);
    throw existing.error;
  }


  const old = existing.data || {};


  // Nếu dữ liệu truyền vào trống thì lấy dữ liệu cũ
  if(!cleanName){
    cleanName = String(old.full_name || '').trim();
  }

  if(!cleanPhone){
    cleanPhone = String(old.phone || '').trim();
  }


  /*
    ĐĂNG NHẬP:

    Nếu hồ sơ chưa có tên/SĐT thì KHÔNG được đá ra lỗi.
    Cho khách đăng nhập bình thường trước.
  */
  if(!required){

    // Có hồ sơ -> cập nhật email nếu cần
    if(existing.data){

      const payload = {
        email: user.email || old.email || null,
        updated_at: new Date().toISOString()
      };


      // Chỉ bổ sung tên nếu đang thiếu
      if(
        (!old.full_name ||
         String(old.full_name).trim().length < 2) &&
        cleanName.length >= 2
      ){
        payload.full_name = cleanName;
      }


      // Chỉ bổ sung SĐT nếu đang thiếu
      if(
        (!old.phone ||
         String(old.phone).trim().length < 6) &&
        cleanPhone.length >= 6
      ){
        payload.phone = cleanPhone;
      }


      const up = await memberSB
        .from('customer_members')
        .update(payload)
        .eq('user_id', user.id);


      if(up.error){
        console.error('UPDATE MEMBER PROFILE ERROR:', up.error);
        throw up.error;
      }


      return {
        full_name:
          payload.full_name ||
          old.full_name ||
          '',

        phone:
          payload.phone ||
          old.phone ||
          '',

        email:
          payload.email ||
          old.email ||
          user.email ||
          ''
      };
    }


    /*
      Không có customer_members:

      Vẫn cho đăng nhập.
      KHÔNG insert "Khách hàng" hoặc dữ liệu rỗng
      để tránh lỗi RLS / NOT NULL.
    */
    return {
      full_name: cleanName || '',
      phone: cleanPhone || '',
      email: user.email || ''
    };
  }


  /*
    ĐĂNG KÝ MỚI:

    Bắt buộc họ tên + SĐT.
  */

  if(cleanName.length < 2){
    throw new Error('Vui lòng nhập họ và tên.');
  }

  if(cleanPhone.length < 6){
    throw new Error(
      'Vui lòng nhập số điện thoại. Không được để trống.'
    );
  }


  const r = await memberSB
    .from('customer_members')
    .upsert({
      user_id: user.id,
      full_name: cleanName,
      phone: cleanPhone,
      email: user.email || null,
      updated_at: new Date().toISOString()
    },{
      onConflict: 'user_id'
    });


  if(r.error){
    console.error('SAVE MEMBER PROFILE ERROR:', r.error);
    throw r.error;
  }


  return {
    full_name: cleanName,
    phone: cleanPhone,
    email: user.email || ''
  };
}



/*
  ĐĂNG NHẬP
*/
async function memberSignIn(email,password){

  const cleanEmail = String(email || '').trim();


  if(!cleanEmail){
    throw new Error('Vui lòng nhập email.');
  }


  if(!password){
    throw new Error('Vui lòng nhập mật khẩu.');
  }


  if(!memberSB){
    throw new Error(
      'Hệ thống thành viên chưa kết nối Supabase.'
    );
  }


  const r = await memberSB.auth.signInWithPassword({
    email: cleanEmail,
    password: password
  });


  if(r.error){
    console.error('LOGIN ERROR:', r.error);
    throw r.error;
  }


  /*
    QUAN TRỌNG NHẤT:

    Không truyền required=true.
    Không bắt nhập họ tên/SĐT khi đăng nhập.
  */
  await memberEnsureProfile(
    r.data.user,
    '',
    '',
    false
  );


  return r.data.user;
}



/*
  ĐĂNG KÝ THÀNH VIÊN
*/
async function memberSignUp(
  fullName,
  phone,
  email,
  password
){

  const cleanName =
    String(fullName || '').trim();

  const cleanPhone =
    String(phone || '').trim();

  const cleanEmail =
    String(email || '').trim();

  const cleanPassword =
    String(password || '');


  if(!cleanName){
    throw new Error(
      'Vui lòng nhập họ và tên.'
    );
  }


  if(cleanName.length < 2){
    throw new Error(
      'Họ và tên phải có ít nhất 2 ký tự.'
    );
  }


  if(!cleanPhone){
    throw new Error(
      'Vui lòng nhập số điện thoại.'
    );
  }


  if(cleanPhone.length < 6){
    throw new Error(
      'Số điện thoại không hợp lệ.'
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


  if(!memberSB){
    throw new Error(
      'Hệ thống thành viên chưa kết nối Supabase.'
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
    console.error('SIGNUP ERROR:', r.error);
    throw r.error;
  }


  /*
    Chỉ tạo customer_members ngay khi
    Supabase trả session.
  */
  if(
    r.data.user &&
    r.data.session
  ){

    await memberEnsureProfile(
      r.data.user,
      cleanName,
      cleanPhone,
      true
    );
  }


  return r.data;
}



/*
  EXPORT RA WINDOW
*/

window.memberSB =
  memberSB;

window.member$ =
  member$;

window.memberEsc =
  memberEsc;

window.getMemberSession =
  getMemberSession;

window.memberLogout =
  memberLogout;

window.memberEnsureProfile =
  memberEnsureProfile;

window.memberSignIn =
  memberSignIn;

window.memberSignUp =
  memberSignUp;
