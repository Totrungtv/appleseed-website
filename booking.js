const sb = window.supabaseClient;
const $ = id => document.getElementById(id);
const form = $('bookingForm');

function makeBookingCode(){
  const d = new Date();
  const p = n => String(n).padStart(2,'0');
  return `AS-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}

form?.addEventListener('submit', async e => {
  e.preventDefault();

  const err = $('error');
  const ok = $('success');
  const codeBox = $('successCode');
  const btn = $('submitBtn');

  if (err) err.style.display = 'none';
  if (ok) ok.style.display = 'none';

  if (!sb) {
    if (err) {
      err.textContent = 'Hệ thống chưa kết nối. Vui lòng gọi 0898888269.';
      err.style.display = 'block';
    }
    return;
  }

  const sessionResult = await sb.auth.getSession();
  const session = sessionResult.data?.session;
  if (!session?.user) {
    if (err) {
      err.textContent = 'Bạn cần đăng ký hoặc đăng nhập thành viên trước khi đặt lịch.';
      err.style.display = 'block';
      err.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  const bookingCode = makeBookingCode();

  const payload = {
    booking_code: bookingCode,
    customer_name: $('name')?.value.trim() || '',
    phone: $('phone')?.value.trim() || '',
    device_model: $('model')?.value.trim() || '',
    service_name: $('service')?.value.trim() || '',
    customer_issue: $('issue')?.value.trim() || '',
    preferred_date: $('date')?.value || null,
    preferred_time: $('time')?.value || null,
    note: $('note')?.value.trim() || null,
    status: 'pending',
    member_id: session.user.id
  };

  if (
    !payload.customer_name ||
    !payload.phone ||
    !payload.device_model ||
    !payload.service_name ||
    !payload.customer_issue
  ) {
    if (err) {
      err.textContent = 'Vui lòng nhập đủ các trường bắt buộc.';
      err.style.display = 'block';
    }
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Đang gửi lịch...';

  try {
    /*
      Không dùng .select().single() ở đây.
      Public chỉ có quyền INSERT; SELECT đang dành cho Admin.
      Dùng .insert(payload) để tránh lỗi quyền khi lấy lại dòng vừa thêm.
    */
    const r = await sb
      .from('repair_bookings')
      .insert(payload);

    if (r.error) throw r.error;

    // GỬI THÀNH CÔNG -> hiện thông báo xanh + mã lịch
    if (codeBox) codeBox.textContent = bookingCode;
    if (ok) {
      ok.innerHTML = `
        <b>✅ GỬI LỊCH HẸN THÀNH CÔNG!</b><br>
        Mã lịch của bạn: <span id="successCode" class="code">${bookingCode}</span><br>
        Apple Seed đã nhận được thông tin và sẽ liên hệ lại để xác nhận.
      `;
      ok.style.display = 'block';
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    form.reset();

    btn.disabled = false;
    btn.textContent = '📅 Gửi lịch hẹn';

  } catch (e) {
    console.error('BOOKING ERROR:', e);

    if (err) {
      err.textContent = 'Chưa gửi được lịch hẹn. Vui lòng thử lại hoặc gọi 0898888269.';
      err.style.display = 'block';
      err.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    btn.disabled = false;
    btn.textContent = '📅 Gửi lịch hẹn';
  }
});
