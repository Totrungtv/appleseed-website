/* =========================================================
   APPLE SEED - MEMBER AUTH
   Đăng nhập / Đăng ký / Email xác nhận / Hồ sơ thành viên
   ========================================================= */

const memberSB = window.supabaseClient;

const member$ = id => document.getElementById(id);


/* =========================================================
   CẤU HÌNH
   ========================================================= */

// URL WEBSITE THẬT CỦA APPLE SEED
// TUYỆT ĐỐI KHÔNG DÙNG localhost
const MEMBER_SITE_URL = 'https://appleseedtravinh.com/';


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function memberEsc(value){
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[c]));
}


/* =========================================================
   KIỂM TRA SUPABASE
   ========================================================= */

function memberCheckSB(){

  if(!memberSB){

    throw new Error(
      'Supabase chưa được khởi tạo. Hãy kiểm tra supabase-config.js.'
    );

  }

  if(!memberSB.auth){

    throw new Error(
      'Supabase Auth chưa sẵn sàng.'
    );

  }

  return memberSB;
}


/* =========================================================
   LẤY SESSION
   ========================================================= */

async function getMemberSession(){

  if(!memberSB || !memberSB.auth){
    return null;
  }

  try{

    const result =
      await memberSB.auth.getSession();

    if(result.error){

      console.error(
        'getMemberSession error:',
        result.error
      );

      return null;
    }

    return result.data?.session || null;

  }catch(error){

    console.error(
      'getMemberSession exception:',
      error
    );

    return null;
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function memberLogout(){

  if(!memberSB || !memberSB.auth){

    location.reload();

    return;
  }

  try{

    const result =
      await memberSB.auth.signOut();

    if(result.error){

      console.error(
        'Logout error:',
        result.error
      );

    }

  }catch(error){

    console.error(
      'Logout exception:',
      error
    );

  }finally{

    location.reload();

  }
}


/* =========================================================
   LẤY PROFILE KHÁCH HÀNG
   ========================================================= */

async function memberGetProfile(user){

  if(!memberSB || !user){
    return null;
  }

  try{

    const result =
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

    if(result.error){

      console.warn(
        'memberGetProfile:',
        result.error
      );

      return null;
    }

    return result.data || null;

  }catch(error){

    console.warn(
      'memberGetProfile exception:',
      error
    );

    return null;
  }
}


/* =========================================================
   TẠO / CẬP NHẬT PROFILE
   =========================================================

   QUAN TRỌNG:

   - ĐĂNG NHẬP:
     Không bắt nhập lại họ tên / SĐT.

   - ĐĂNG KÝ:
     Bắt buộc họ tên + SĐT.

   ========================================================= */

async function memberEnsureProfile(
  user,
  fullName = '',
  phone = '',
  required = false
){

  memberCheckSB();

  if(!user || !user.id){

    throw new Error(
      'Không tìm thấy tài khoản người dùng.'
    );

  }


  /* -----------------------------------------
     Lấy profile cũ trước
     ----------------------------------------- */

  let oldProfile = null;

  try{

    const result =
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

    if(
      result.error &&
      result.error.code !== 'PGRST116'
    ){

      console.warn(
        'Không đọc được profile cũ:',
        result.error
      );

    }else{

      oldProfile =
        result.data || null;

    }

  }catch(error){

    console.warn(
      'Profile lookup exception:',
      error
    );

  }


  /* -----------------------------------------
     Ghép dữ liệu mới + dữ liệu cũ
     ----------------------------------------- */

  const cleanName =
    String(
      fullName ||
      user.user_metadata?.full_name ||
      oldProfile?.full_name ||
      ''
    ).trim();


  const cleanPhone =
    String(
      phone ||
      user.user_metadata?.phone ||
      user.phone ||
      oldProfile?.phone ||
      ''
    ).trim();


  /* -----------------------------------------
     ĐĂNG NHẬP:
     Không được bắt nhập lại thông tin
     ----------------------------------------- */

  if(!required){

    /*
      Nếu profile đã tồn tại:
      giữ nguyên.
    */

    if(oldProfile){

      return oldProfile;

    }


    /*
      Nếu tài khoản cũ chưa có profile:
      không làm đăng nhập thất bại.
    */

    if(!cleanName || !cleanPhone){

      return null;

    }

  }


  /* -----------------------------------------
     ĐĂNG KÝ:
     bắt buộc họ tên + SĐT
     ----------------------------------------- */

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


  /* -----------------------------------------
     Lưu customer_members
     ----------------------------------------- */

  const payload = {

    user_id:user.id,

    full_name:cleanName,

    phone:cleanPhone,

    email:user.email ||
          oldProfile?.email ||
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
          onConflict:'user_id'
        }
      );


  if(result.error){

    console.error(
      'customer_members upsert error:',
      result.error
    );

    throw new Error(
      result.error.message ||
      'Không thể lưu thông tin thành viên.'
    );

  }


  return payload;
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
    ).trim();


  if(!cleanEmail){

    throw new Error(
      'Vui lòng nhập email.'
    );

  }


  if(!password){

    throw new Error(
      'Vui lòng nhập mật khẩu.'
    );

  }


  const result =
    await memberSB.auth.signInWithPassword({

      email:cleanEmail,

      password:password

    });


  if(result.error){

    console.error(
      'memberSignIn error:',
      result.error
    );


    /*
      Nếu email chưa xác nhận,
      Supabase sẽ trả lỗi tại đây.
    */

    throw new Error(
      result.error.message ||
      'Email hoặc mật khẩu không chính xác.'
    );

  }


  const user =
    result.data?.user;


  if(!user){

    throw new Error(
      'Đăng nhập thành công nhưng không nhận được tài khoản.'
    );

  }


  /*
    QUAN TRỌNG:

    Đăng nhập KHÔNG gọi
    memberEnsureProfile với required=true.

    Vì vậy không bắt nhập lại
    họ tên / số điện thoại.
  */

  try{

    await memberEnsureProfile(
      user,
      '',
      '',
      false
    );

  }catch(error){

    /*
      Lỗi profile không làm hỏng
      đăng nhập.
    */

    console.warn(
      'Profile check skipped:',
      error
    );

  }


  return user;
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
    ).trim();


  const cleanPassword =
    String(
      password || ''
    );


  /* -----------------------------------------
     KIỂM TRA DỮ LIỆU
     ----------------------------------------- */

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


  /* -----------------------------------------
     TẠO TÀI KHOẢN SUPABASE
     ----------------------------------------- */

  const result =
    await memberSB.auth.signUp({

      email:cleanEmail,

      password:cleanPassword,

      options:{

        /*
          Supabase sẽ đưa khách về
          website Apple Seed sau khi
          bấm link xác nhận trong email.
        */

        emailRedirectTo:
          MEMBER_SITE_URL,

        data:{

          full_name:
            cleanName,

          phone:
            cleanPhone

        }

      }

    });


  if(result.error){

    console.error(
      'memberSignUp error:',
      result.error
    );


    throw new Error(
      result.error.message ||
      'Không thể tạo tài khoản.'
    );

  }


  const user =
    result.data?.user;


  const session =
    result.data?.session;


  if(!user){

    throw new Error(
      'Không tạo được tài khoản.'
    );

  }


  /* -----------------------------------------
     TRƯỜNG HỢP KHÔNG YÊU CẦU EMAIL CONFIRM
     ----------------------------------------- */

  if(session){

    await memberEnsureProfile(
      user,
      cleanName,
      cleanPhone,
      true
    );

  }


  /*
    Nếu Supabase yêu cầu xác nhận email:
    session sẽ null.

    Khi đó customer_members chưa cần tạo
    ngay. Sau khi xác nhận email + đăng nhập,
    profile sẽ được tạo.
  */


  return {

    user:user,

    session:session,

    emailConfirmationRequired:
      !session

  };

}


/* =========================================================
   GỬI LẠI EMAIL XÁC NHẬN
   ========================================================= */

async function memberResendSignupEmail(
  email
){

  memberCheckSB();


  const cleanEmail =
    String(
      email || ''
    ).trim();


  if(!cleanEmail){

    throw new Error(
      'Vui lòng nhập email.'
    );

  }


  const result =
    await memberSB.auth.resend({

      type:'signup',

      email:cleanEmail,

      options:{

        emailRedirectTo:
          MEMBER_SITE_URL

      }

    });


  if(result.error){

    console.error(
      'memberResendSignupEmail error:',
      result.error
    );


    throw new Error(
      result.error.message ||
      'Không thể gửi lại email xác nhận.'
    );

  }


  return result.data;
}


/* =========================================================
   KIỂM TRA EMAIL ĐÃ XÁC NHẬN
   ========================================================= */

async function memberIsEmailConfirmed(){

  const session =
    await getMemberSession();


  if(!session?.user){

    return false;

  }


  const user =
    session.user;


  return Boolean(
    user.email_confirmed_at
  );

}


/* =========================================================
   AUTH STATE CHANGE
   ========================================================= */

function memberOnAuthStateChange(
  callback
){

  if(
    !memberSB ||
    !memberSB.auth
  ){

    console.warn(
      'memberOnAuthStateChange: Supabase Auth chưa sẵn sàng.'
    );


    return {

      data:{

        subscription:{

          unsubscribe:
            () => {}

        }

      }

    };

  }


  return memberSB.auth.onAuthStateChange(
    (
      event,
      session
    ) => {

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
          'Auth callback error:',
          error
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

window.memberLogout =
  memberLogout;

window.memberGetProfile =
  memberGetProfile;

window.memberEnsureProfile =
  memberEnsureProfile;

window.memberSignIn =
  memberSignIn;

window.memberSignUp =
  memberSignUp;

window.memberResendSignupEmail =
  memberResendSignupEmail;

window.memberIsEmailConfirmed =
  memberIsEmailConfirmed;

window.memberOnAuthStateChange =
  memberOnAuthStateChange;
