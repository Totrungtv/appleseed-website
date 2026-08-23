/* =========================================================
   APPLE SEED MEMBER AUTH - VIP FULL FIX V8
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


  /* Nếu chưa có phone thì không tạo record
     vì DB đang bắt buộc phone */

  if(!mobile){

    try{

      const existing =
        await memberSB
          .from('customer_members')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

      if(existing.error){

        console.warn(
          'Apple Seed customer_members select:',
          existing.error
        );

        return null;
      }

      return existing.data || null;

    }catch(error){

      console.warn(
        'Apple Seed profile lookup:',
        error
      );

      return null;
    }
  }


  const payload = {

    user_id:
      user.id,

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
          onConflict:
            'user_id'
        }
      )
      .select()
      .single();


  if(result.error){

    console.warn(
      'Apple Seed customer_members:',
      result.error
    );

    return null;
  }


  return result.data || null;
}


/* =========================================================
   AUTH STATE CHANGE
   ========================================================= */

function memberOnAuthStateChange(
  callback
){

  memberCheckSB();

  return memberSB.auth.onAuthStateChange(
    (event, session) => {

      try{

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
    String(
      fullName || ''
    ).trim();


  const cleanPhone =
    String(
      phone || ''
    ).trim();


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

      email:
        cleanEmail,

      password:
        cleanPassword,

      options: {

        emailRedirectTo:
          window.location.origin,

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
    Nếu Supabase trả session ngay
    thì tạo customer_members.
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

    const message =
      String(
        result.error.message || ''
      ).toLowerCase();


    if(
      message.includes(
        'email not confirmed'
      )
    ){

      throw new Error(
        'Email chưa được xác nhận. Hãy mở Gmail và bấm link xác nhận tài khoản trước khi đăng nhập.'
      );

    }


    if(
      message.includes(
        'invalid login credentials'
      )
    ){

      throw new Error(
        'Email hoặc mật khẩu không đúng. Nếu quên mật khẩu, hãy bấm “Quên mật khẩu?” để đặt lại mật khẩu.'
      );

    }


    throw result.error;
  }


  /*
    Đăng nhập thành công thì cập nhật profile.
    Lỗi customer_members không được
    làm hỏng đăng nhập.
  */

  if(result.data?.user){

    await memberEnsureProfile(
      result.data.user,
      result.data.user.user_metadata?.full_name || '',
      result.data.user.user_metadata?.phone || ''
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


  return true;
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
          window.location.origin

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
   DIAGNOSTIC
   ========================================================= */

async function memberDebug(){

  memberCheckSB();


  const sessionResult =
    await memberSB.auth.getSession();


  const userResult =
    await memberSB.auth.getUser();


  return {

    session:
      sessionResult.data?.session || null,

    user:
      userResult.data?.user || null,

    sessionError:
      sessionResult.error || null,

    userError:
      userResult.error || null

  };
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


window.memberResendSignupEmail =
  memberResendSignupEmail;


window.memberOnAuthStateChange =
  memberOnAuthStateChange;


window.memberRefreshSession =
  memberRefreshSession;


window.memberListenAuthState =
  memberListenAuthState;


window.memberDebug =
  memberDebug;


/* =========================================================
   READY
   ========================================================= */

console.log(
  '✅ Apple Seed Member Auth VIP V8 loaded.'
);
