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
     NẾU KHÔNG YÊU CẦU XÁC NHẬN EMAIL
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
