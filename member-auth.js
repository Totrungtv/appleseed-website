/* =========================================================
   APPLE SEED MEMBER AUTH - VIP
   Login / Register / Logout / Forgot Password
   Supabase Auth
   ========================================================= */

const memberSB = window.supabaseClient;

const member$ = id => document.getElementById(id);


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function memberEsc(s){
  return String(s ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#039;'
    }[c])
  );
}


/* =========================================================
   CHECK SUPABASE
   ========================================================= */

function memberCheckSB(){
  if(!memberSB){
    throw new Error(
      'Apple Seed chưa kết nối Supabase. Hãy kiểm tra supabase-config.js.'
    );
  }

  if(!memberSB.auth){
    throw new Error(
      'Supabase Auth chưa được tải đúng.'
    );
  }

  return true;
}


/* =========================================================
   GET CURRENT SESSION
   ========================================================= */

async function getMemberSession(){

  memberCheckSB();

  const r = await memberSB.auth.getSession();

  if(r.error){
    console.error('getMemberSession:', r.error);
    return null;
  }

  return r.data?.session || null;
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function memberLogout(){

  memberCheckSB();

  const r = await memberSB.auth.signOut();

  if(r.error){
    console.error('Logout error:', r.error);
    throw r.error;
  }

  /*
    Xóa các dữ liệu local liên quan member
    nhưng KHÔNG đụng dữ liệu khác của website.
  */

  try{
    sessionStorage.removeItem('apple_seed_member');
  }catch(e){}

  /*
    Reload để giao diện trở về trạng thái chưa đăng nhập.
  */

  window.location.reload();
}


/* =========================================================
   CREATE / UPDATE CUSTOMER PROFILE
   ========================================================= */

async function memberEnsureProfile(
  user,
  fullName,
  phone
){

  memberCheckSB();

  if(!user) return;

  const profile = {

    user_id: user.id,

    full_name:
      (
        fullName ||
        user.user_metadata?.full_name ||
        'Khách hàng'
      ).trim(),

    phone:
      (
        phone ||
        user.user_metadata?.phone ||
        user.phone ||
        ''
      ).trim(),

    email:
      user.email || null,

    updated_at:
      new Date().toISOString()

  };


  const r = await memberSB
    .from('customer_members')
    .upsert(
      profile,
      {
        onConflict:'user_id'
      }
    );


  if(r.error){

    console.error(
      'memberEnsureProfile error:',
      r.error
    );

    /*
      Không chặn đăng nhập chỉ vì profile lỗi.
      Auth Supabase vẫn hoạt động bình thường.
    */

    return null;
  }


  return r.data;
}


/* =========================================================
   LOGIN
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


  const r =
    await memberSB.auth.signInWithPassword({

      email: cleanEmail,

      password: cleanPassword

    });


  if(r.error){

    console.error(
      'memberSignIn error:',
      r.error
    );

    throw r.error;
  }


  if(r.data?.user){

    await memberEnsureProfile(
      r.data.user,
      '',
      ''
    );

  }


  return r.data.user;

}


/* =========================================================
   REGISTER
   ========================================================= */

async function memberSignUp(
  fullName,
  phone,
  email,
  password
){

  memberCheckSB();


  const cleanName =
    String(fullName || '')
      .trim();


  const cleanPhone =
    String(phone || '')
      .trim();


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


  const r =
    await memberSB.auth.signUp({

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

    throw r.error;
  }


  /*
    Nếu Supabase trả session ngay
    thì tạo profile luôn.
  */

  if(
    r.data?.user &&
    r.data?.session
  ){

    await memberEnsureProfile(
      r.data.user,
      cleanName,
      cleanPhone
    );

  }


  return r.data;

}


/* =========================================================
   FORGOT PASSWORD
   GỬI LINK RESET PASSWORD VÀO GMAIL
   ========================================================= */

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
    Đây là URL mà Supabase sẽ đưa người dùng
    quay về sau khi bấm link trong Gmail.
    
    Dùng chính website hiện tại.
  */

  const redirectUrl =
    window.location.origin +
    '/reset-password.html';


  console.log(
    'Apple Seed password reset redirect:',
    redirectUrl
  );


  const r =
    await memberSB.auth.resetPasswordForEmail(

      cleanEmail,

      {
        redirectTo: redirectUrl
      }

    );


  if(r.error){

    console.error(
      'memberForgotPassword error:',
      r.error
    );

    throw r.error;
  }


  return true;

}


/* =========================================================
   UPDATE PASSWORD
   DÙNG Ở TRANG reset-password.html
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


  const r =
    await memberSB.auth.updateUser({

      password: cleanPassword

    });


  if(r.error){

    console.error(
      'memberUpdatePassword error:',
      r.error
    );

    throw r.error;
  }


  return r.data?.user || null;

}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

async function getMemberUser(){

  memberCheckSB();

  const session =
    await getMemberSession();

  return session?.user || null;

}


/* =========================================================
   REFRESH SESSION
   ========================================================= */

async function memberRefreshSession(){

  memberCheckSB();

  const r =
    await memberSB.auth.refreshSession();

  if(r.error){

    console.error(
      'refreshSession error:',
      r.error
    );

    return null;
  }

  return r.data?.session || null;

}


/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

function memberListenAuthState(
  callback
){

  memberCheckSB();

  return memberSB.auth.onAuthStateChange(
    (event, session) => {

      try{

        if(typeof callback === 'function'){

          callback(
            event,
            session
          );

        }

      }catch(e){

        console.error(
          'member auth callback error:',
          e
        );

      }

    }
  );

}


/* =========================================================
   EXPORT GLOBAL
   ========================================================= */

window.memberSB =
  memberSB;

window.member$ =
  member$;

window.memberEsc =
  memberEsc;

window.memberCheckSB =
  memberCheckSB;

window.getMemberSession =
  getMemberSession;

window.getMemberUser =
  getMemberUser;

window.memberRefreshSession =
  memberRefreshSession;

window.memberLogout =
  memberLogout;

window.memberEnsureProfile =
  memberEnsureProfile;

window.memberSignIn =
  memberSignIn;

window.memberSignUp =
  memberSignUp;

window.memberForgotPassword =
  memberForgotPassword;

window.memberUpdatePassword =
  memberUpdatePassword;

window.memberListenAuthState =
  memberListenAuthState;


/* =========================================================
   READY MESSAGE
   ========================================================= */

console.log(
  '✅ Apple Seed Member Auth VIP loaded.'
);
