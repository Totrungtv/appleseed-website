const sb = window.supabaseClient;
const $ = id => document.getElementById(id);
const form = $('bookingForm');

function code(){
  const d = new Date();
  const p = n => String(n).padStart(2,'0');
  return `AS-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}

/* Tạo thông báo thành công nếu HTML chưa có #success */
function showSuccess(bookingCode){
  let box = $('success');

  if(!box){
    box = document.createElement('div');
    box.id = 'success';

    box.style.cssText = `
      display:none;
      margin:18px 0;
      padding:20px 22px;
      border-radius:16px;
      background:linear-gradient(135deg,#ecfdf5,#d1fae5);
      border:1px solid #86efac;
      color:#166534;
      box-shadow:0 8px 24px rgba(22,101,52,.12);
      font-family:Arial,sans-serif;
    `;

    form?.parentNode?.insertBefore(box, form);
  }

  box.innerHTML = `
    <div style="
      display:flex;
      align-items:flex-start;
      gap:14px;
    ">
      <div style="
        width:42px;
        height:42px;
        border-radius:50%;
        background:#16a34a;
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:24px;
        font-weight:bold;
        flex:none;
      ">✓</div>

      <div>
        <div style="
          font-size:18px;
          font-weight:800;
          margin-bottom:6px;
        ">
          ĐÃ GỬI LỊCH HẸN THÀNH CÔNG
        </div>

        <div style="
          font-size:14px;
          line-height:1.6;
        ">
          Apple Seed đã nhận được thông tin của bạn.
          Nhân viên sẽ liên hệ để xác nhận lịch hẹn.
        </div>

        <div style="
          margin-top:10px;
          display:inline-block;
          padding:8px 12px;
          border-radius:10px;
          background:#fff;
          border:1px solid #bbf7d0;
          font-weight:700;
        ">
          Mã lịch hẹn: ${bookingCode}
        </div>
      </div>
    </div>
  `;

  box.style.display = 'block';

  box.scrollIntoView({
    behavior:'smooth',
    block:'center'
  });
}

form?.addEventListener('submit', async e => {
  e.preventDefault();

  const err = $('error');
  const oldOk = $('success');
  const btn = $('submitBtn');

  if(err) err.textContent = '';

  /* Ẩn thông báo thành công cũ */
  if(oldOk) oldOk.style.display = 'none';

  if(!sb){
    if(err){
      err.textContent =
        'Hệ thống chưa kết nối. Vui lòng gọi 0898888269.';
    }
    return;
  }

  const payload = {
    booking_code: code(),

    customer_name: $('name')?.value.trim() || '',
    phone: $('phone')?.value.trim() || '',
    device_model: $('model')?.value.trim() || '',
    service_name: $('service')?.value.trim() || '',
    customer_issue: $('issue')?.value.trim() || '',

    /* ĐÚNG TÊN CỘT TRONG repair_bookings */
    appointment_date: $('date')?.value || null,
    appointment_time: $('time')?.value || null,

    note: $('note')?.value.trim() || null,

    status: 'pending'
  };

  if(
    !payload.customer_name ||
    !payload.phone ||
    !payload.device_model ||
    !payload.service_name ||
    !payload.customer_issue
  ){
    if(err){
      err.textContent =
        'Vui lòng nhập đủ các trường bắt buộc.';
    }
    return;
  }

  if(btn){
    btn.disabled = true;
    btn.textContent = '⏳ Đang gửi lịch hẹn…';
  }

  try {

  const r = await sb
    .from('repair_bookings')
    .insert(payload);

  if(r.error){
    console.error('BOOKING ERROR:', r.error);

    if(err){
      err.textContent =
        'Chưa gửi được lịch hẹn: ' + r.error.message;
      err.style.display = 'block';
    }

    if(btn){
      btn.disabled = false;
      btn.textContent = '📅 Gửi lịch hẹn';
    }

    return;
  }

   // =========================
  // GỬI THÀNH CÔNG
  // =========================

  const bookingCode = payload.booking_code;

  showSuccess(bookingCode);

  form.reset();

  if(btn){
    btn.disabled = false;
    btn.textContent = '✓ Đã gửi lịch hẹn';
  }

  setTimeout(() => {
    if(btn){
      btn.textContent = '📅 Gửi lịch hẹn';
    }
  }, 3000);

} catch(error){

  console.error('BOOKING EXCEPTION:', error);

  if(err){
    err.textContent =
      'Có lỗi kết nối. Vui lòng thử lại hoặc gọi 0898888269.';
    err.style.display = 'block';
  }

  if(btn){
    btn.disabled = false;
    btn.textContent = '📅 Gửi lịch hẹn';
  }
}
});
