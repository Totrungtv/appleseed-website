/* =========================================================
   APPLE SEED MEMBER AUTH - VIP FULL FIX
   Đăng ký / Xác nhận email / Đăng nhập / Đăng xuất
   Quên mật khẩu / Gửi lại email / Đổi mật khẩu
   ========================================================= */

const memberSB = window.supabaseClient;


/* =========================================================
   CHECK SUPABASE
   ========================================================= */

function memberCheckSB(){

  if(!memberSB){
    throw new Error(
      'Apple Seed chưa kết nối Supabase.'
    );
  }

  if(!memberSB.auth){
    throw new Error(
      'Supabase Auth chưa sẵn sàng.'
    );
  }

  return true;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function memberEsc(value){

  return String(value ?? '').replace(
    /[&<>"']/g,
    char => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#039;'
    }[char])
  );

}


/* =========================================================
   GET SESSION
   ========================================================= */

async function getMemberSession(){

  memberCheckSB();

  const result =
    await memberSB.auth.getSession();

  if(result.error){

    console.error(
      'Apple Seed get session:',
      result.error
    );

    return null;
  }

  return result.data?.session || null;
}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

async function getMemberUser(){

  const session =
    await getMemberSession();

  return session?.user || null;
}


/* =========================================================
   CREATE / UPDATE CUSTOMER PROFILE
   ========================================================= */

async function memberEnsureProfile(
  user,
  fullName = '',
  phone = ''
){

  memberCheckSB();

  if(!user){
    return null;
  }

  const name =
    String(
      fullName ||
      user.user_metadata?.full_name ||
      ''
    ).trim();

  const mobile =
    String(
      phone ||
      user.user_metadata?.phone ||
      ''
    ).trim();

  let existingProfile = null;

  try{

    const existingResult =
      await memberSB
        .from('customer_members')
        .select(
          'user_id,full_name,phone,email'
        )
        .eq(
          'user_id',
          user.id
        )
        .maybeSingle();

    if(existingResult.error){

      console.warn(
        'Apple Seed đọc customer_members:',
        existingResult.error
      );

    }else{

      existingProfile =
        existingResult.data || null;

    }

  }catch(error){

    console.warn(
      'Apple Seed đọc profile:',
      error
    );

  }

  const finalPhone =
    mobile ||
    String(
      existingProfile?.phone || ''
    ).trim();

  if(!finalPhone){

    console.warn(
      'Apple Seed: chưa có số điện thoại để tạo customer_members.'
    );

    return existingProfile || null;
  }

  const payload = {

    user_id:
      user.id,

    full_name:
      name ||
      existingProfile?.full_name ||
      'Khách hàng',

    phone:
      finalPhone,

    email:
      user.email ||
      existingProfile?.email ||
      null,

    updated_at:
      new Date().toISOString()

  };

  const result =
    await memberSB
      .from('customer_members')
      .upsert(
        payload,
        {
          onConflict:
            'user_id'
        }
      );

  if(result.error){

    console.warn(
      'Apple Seed customer_members:',
      result.error
    );

    return null;
  }

  return result.data;
}


/* =========================================================
   AUTH STATE CHANGE
   ========================================================= */

function memberOnAuthStateChange(callback){

  memberCheckSB();

  return memberSB.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        'Apple Seed Auth:',
        event
      );

      if(
        typeof callback === 'function'
      ){

        callback(
          event,
          session
        );

      }

    }
  );

}


/* =========================================================
   ĐĂNG KÝ
   ========================================================= */

async function memberSignUp(
  fullName,
  phone,
  email,
  password
){

  memberCheckSB();

  const cleanName =
    String(fullName || '').trim();

  const cleanPhone =
    String(phone || '').trim();

  const cleanEmail =
    String(email || '').trim().toLowerCase();

  const cleanPassword =
    String(password || '');

  if(!cleanName){
    throw new Error('Vui lòng nhập họ và tên.');
  }

  if(!cleanPhone){
    throw new Error('Vui lòng nhập số điện thoại.');
  }

  if(!cleanEmail){
    throw new Error('Vui lòng nhập email.');
  }

  if(cleanPassword.length < 6){
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  const emailRedirectTo =
    window.location.origin + '/index.html';

  const result =
    await memberSB.auth.signUp({

      email:
        cleanEmail,

      password:
        cleanPassword,

      options: {

        emailRedirectTo:
          emailRedirectTo,

        data: {

          full_name:
            cleanName,

          phone:
            cleanPhone

        }

      }

    });

  if(result.error){

    console.error(
      'Apple Seed signup:',
      result.error
    );

    const msg =
      String(
        result.error.message || ''
      ).toLowerCase();

    if(
      msg.includes('user already registered') ||
      msg.includes('already registered') ||
      msg.includes('email already')
    ){

      throw new Error(
        'Tài khoản này đã đăng ký trước đó. Vui lòng đăng nhập hoặc chọn Quên mật khẩu nếu bạn quên mật khẩu.'
      );

    }

    throw result.error;
  }

  const user =
    result.data?.user || null;

  const session =
    result.data?.session || null;

  if(!user){

    throw new Error(
      'Không tạo được tài khoản.'
    );

  }

  /*
    Supabase có thể không trả lỗi khi email đã tồn tại.
    Khi đó identities thường rỗng.
  */

  if(
    Array.isArray(user.identities) &&
    user.identities.length === 0
  ){

    throw new Error(
      'Tài khoản này đã đăng ký trước đó. Vui lòng đăng nhập hoặc chọn Quên mật khẩu nếu bạn quên mật khẩu.'
    );

  }

  if(session){

    await memberEnsureProfile(
      user,
      cleanName,
      cleanPhone
    );

    try{
      await memberSB.rpc('apple_seed_member_touch');
    }catch(error){
      console.warn('Apple Seed member touch:', error);
    }

  }

  return {

    user,

    session,

    emailConfirmationRequired:
      !session

  };

}


/* =========================================================
   ĐĂNG NHẬP
   ========================================================= */

async function memberSignIn(
  email,
  password
){

  memberCheckSB();

  const cleanEmail =
    String(
      email || ''
    )
      .trim()
      .toLowerCase();

  const cleanPassword =
    String(
      password || ''
    );

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

  const result =
    await memberSB.auth.signInWithPassword({

      email:
        cleanEmail,

      password:
        cleanPassword

    });

  if(result.error){

    console.error(
      'Apple Seed signin:',
      result.error
    );

    throw result.error;

  }

  if(result.data?.user){

    await memberEnsureProfile(
      result.data.user
    );

    try{
      await memberSB.rpc('apple_seed_member_touch');
    }catch(error){
      console.warn('Apple Seed member touch:', error);
    }

  }

  return result.data;

}


/* =========================================================
   ĐĂNG XUẤT
   ========================================================= */

async function memberLogout(){

  memberCheckSB();

  try{

    const result =
      await memberSB.auth.signOut();

    if(result.error){

      console.error(
        'Apple Seed logout:',
        result.error
      );

      throw result.error;

    }

    try{

      sessionStorage.removeItem(
        'apple_seed_member'
      );

    }catch(error){

      console.warn(
        'Apple Seed sessionStorage:',
        error
      );

    }

    window.location.reload();

    return true;

  }catch(error){

    console.error(
      'Apple Seed logout exception:',
      error
    );

    throw error;

  }

}


/* =========================================================
   QUÊN MẬT KHẨU
   ========================================================= */

async function memberForgotPassword(
  email
){

  memberCheckSB();

  const cleanEmail =
    String(
      email || ''
    )
      .trim()
      .toLowerCase();

  if(!cleanEmail){

    throw new Error(
      'Vui lòng nhập email tài khoản.'
    );

  }

  const redirectUrl =
    window.location.origin +
    '/reset-password.html';

  console.log(
    'Apple Seed reset password:',
    redirectUrl
  );

  const result =
    await memberSB.auth
      .resetPasswordForEmail(

        cleanEmail,

        {
          redirectTo:
            redirectUrl
        }

      );

  if(result.error){

    console.error(
      'Apple Seed forgot password:',
      result.error
    );

    throw result.error;

  }

  return true;

}


/* =========================================================
   ĐỔI MẬT KHẨU
   ========================================================= */

async function memberUpdatePassword(
  newPassword
){

  memberCheckSB();

  const cleanPassword =
    String(
      newPassword || ''
    );

  if(!cleanPassword){

    throw new Error(
      'Vui lòng nhập mật khẩu mới.'
    );

  }

  if(cleanPassword.length < 6){

    throw new Error(
      'Mật khẩu mới phải có ít nhất 6 ký tự.'
    );

  }

  const result =
    await memberSB.auth.updateUser({

      password:
        cleanPassword

    });

  if(result.error){

    console.error(
      'Apple Seed update password:',
      result.error
    );

    throw result.error;

  }

  return result.data?.user || null;

}


/* =========================================================
   GỬI LẠI EMAIL ĐĂNG KÝ
   ========================================================= */

async function memberResendSignupEmail(
  email
){

  memberCheckSB();

  const cleanEmail =
    String(
      email || ''
    )
      .trim()
      .toLowerCase();

  if(!cleanEmail){

    throw new Error(
      'Vui lòng nhập email tài khoản.'
    );

  }

  const result =
    await memberSB.auth.resend({

      type:
        'signup',

      email:
        cleanEmail,

      options: {

        emailRedirectTo:
          window.location.origin +
          '/index.html'

      }

    });

  if(result.error){

    console.error(
      'Apple Seed resend signup email:',
      result.error
    );

    throw result.error;

  }

  return true;

}


/* =========================================================
   GỬI LẠI EMAIL XÁC NHẬN
   ========================================================= */

async function memberResendConfirmation(
  email
){

  memberCheckSB();

  const cleanEmail =
    String(
      email || ''
    )
      .trim()
      .toLowerCase();

  if(!cleanEmail){

    throw new Error(
      'Vui lòng nhập email.'
    );

  }

  const result =
    await memberSB.auth.resend({

      type:
        'signup',

      email:
        cleanEmail

    });

  if(result.error){

    console.error(
      'Apple Seed resend confirmation:',
      result.error
    );

    throw result.error;

  }

  return true;

}


/* =========================================================
   REFRESH SESSION
   ========================================================= */

async function memberRefreshSession(){

  memberCheckSB();

  const result =
    await memberSB.auth.refreshSession();

  if(result.error){

    console.error(
      'Apple Seed refresh session:',
      result.error
    );

    return null;

  }

  return result.data?.session || null;

}


/* =========================================================
   LISTEN AUTH STATE
   ========================================================= */

function memberListenAuthState(
  callback
){

  memberCheckSB();

  return memberSB.auth.onAuthStateChange(

    (event, session) => {

      try{

        if(
          typeof callback ===
          'function'
        ){

          callback(
            event,
            session
          );

        }

      }catch(error){

        console.error(
          'Apple Seed auth callback:',
          error
        );

      }

    }

  );

}


/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.memberSB =
  memberSB;

window.memberEsc =
  memberEsc;

window.memberCheckSB =
  memberCheckSB;

window.getMemberSession =
  getMemberSession;

window.getMemberUser =
  getMemberUser;

window.memberEnsureProfile =
  memberEnsureProfile;

window.memberSignUp =
  memberSignUp;

window.memberOnAuthStateChange =
  memberOnAuthStateChange;

window.memberSignIn =
  memberSignIn;

window.memberLogout =
  memberLogout;

window.memberForgotPassword =
  memberForgotPassword;

window.memberUpdatePassword =
  memberUpdatePassword;

window.memberResendConfirmation =
  memberResendConfirmation;

window.memberResendSignupEmail =
  memberResendSignupEmail;

window.memberRefreshSession =
  memberRefreshSession;

window.memberListenAuthState =
  memberListenAuthState;


/* =========================================================
   READY
   ========================================================= */

console.log(
  '✅ Apple Seed Member Auth VIP FIX loaded.'
);
