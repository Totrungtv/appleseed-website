/* =========================================================
   APPLE SEED MEMBER AUTH - VIP FULL
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

  const payload = {

    user_id: user.id,

    full_name:
      name || 'Khách hàng',

    phone:
      mobile,

    email:
      user.email || null,

    updated_at:
      new Date().toISOString()

  };


  const result =
    await memberSB
      .from('customer_members')
      .upsert(
        payload,
        {
          onConflict:'user_id'
        }
      );


  if(result.error){

    /*
      Không chặn đăng nhập nếu profile lỗi.
      Auth vẫn hoạt động bình thường.
    */

    console.warn(
      'Apple Seed customer_members:',
      result.error
    );

    return null;
  }


  return result.data;

}


/* =========================================================
   ĐĂNG KÝ
   ========================================================= */
function memberOnAuthStateChange(callback){

  memberCheckSB();

  if(!memberSB || !memberSB.auth){
    console.error(
      'Apple Seed: Supabase Auth chưa sẵn sàng.'
    );
    return null;
  }

  return memberSB.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        'Apple Seed Auth:',
        event
      );

      if(typeof callback === 'function'){
        callback(event, session);
      }

    }
  );
}

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
    String(email || '')
      .trim()
      .toLowerCase();


  const cleanPassword =
    String(password || '');


  if(!cleanName){

    throw new Error(
      'Vui lòng nhập họ và tên.'
    );

  }


  if(!cleanPhone){

    throw new Error(
      'Vui lòng nhập số điện thoại.'
    );

  }


  if(!cleanEmail){

    throw new Error(
      'Vui lòng nhập email.'
    );

  }


  if(cleanPassword.length < 6){

    throw new Error(
      'Mật khẩu phải có ít nhất 6 ký tự.'
    );

  }


  const result =
    await memberSB.auth.signUp({

      email: cleanEmail,

      password: cleanPassword,

      options: {

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

    throw result.error;
  }


  /*
    Nếu Supabase cho session ngay,
    tạo profile luôn.
  */

  if(
    result.data?.user &&
    result.data?.session
  ){

    await memberEnsureProfile(
      result.data.user,
      cleanName,
      cleanPhone
    );

  }


  return result.data;

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
    String(email || '')
      .trim()
      .toLowerCase();


  const cleanPassword =
    String(password || '');


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

  }


  return result.data;

}


/* =========================================================
   ĐĂNG XUẤT
   ========================================================= */

async function memberLogout(){

  memberCheckSB();


  const result =
    await memberSB.auth.signOut();


  if(result.error){

    console.error(
      'Apple Seed logout:',
      result.error
    );

    throw result.error;
  }


  /*
    Không xóa dữ liệu website.
    Chỉ kết thúc phiên đăng nhập.
  */

  try{

    sessionStorage.removeItem(
      'apple_seed_member'
    );

  }catch(e){}


  return true;

}


/* =========================================================
   QUÊN MẬT KHẨU
   GỬI LINK VÀO GMAIL
   ========================================================= */
async function memberResendSignupEmail(email){

  memberCheckSB();

  const cleanEmail =
    String(email || '')
      .trim()
      .toLowerCase();

  if(!cleanEmail){
    throw new Error('Vui lòng nhập email tài khoản.');
  }

  const result =
    await memberSB.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo:
          window.location.origin
      }
    });

  if(result.error){
    throw result.error;
  }

  return true;
}
async function memberForgotPassword(
  email
){

  memberCheckSB();


  const cleanEmail =
    String(email || '')
      .trim()
      .toLowerCase();


  if(!cleanEmail){

    throw new Error(
      'Vui lòng nhập email tài khoản.'
    );

  }


  /*
    Link trong Gmail sẽ quay về:
    https://appleseedtravinh.com/reset-password.html

    Dùng origin để khi test localhost cũng
    tự lấy đúng domain hiện tại.
  */

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
   ĐỔI MẬT KHẨU SAU KHI BẤM LINK GMAIL
   ========================================================= */

async function memberUpdatePassword(
  newPassword
){

  memberCheckSB();


  const cleanPassword =
    String(newPassword || '');


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
   GỬI LẠI EMAIL XÁC NHẬN
   ========================================================= */

async function memberResendConfirmation(
  email
){

  memberCheckSB();


  const cleanEmail =
    String(email || '')
      .trim()
      .toLowerCase();


  if(!cleanEmail){

    throw new Error(
      'Vui lòng nhập email.'
    );

  }


  const result =
    await memberSB.auth
      .resend({

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
   THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
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

window.memberRefreshSession =
  memberRefreshSession;

window.memberListenAuthState =
  memberListenAuthState;


/* =========================================================
   READY
   ========================================================= */

console.log(
  '✅ Apple Seed Member Auth VIP loaded.'
);
