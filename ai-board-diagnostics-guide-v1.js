/* APPLE SEED AI BOARD — DIAGNOSTICS GUIDE V3
   Always anchors directly to the actual AI analyze button. */
(()=>{
  'use strict';
  const GUIDE='data-as-diagnostics-guide-v3';

  function findAnalyze(){
    return [...document.querySelectorAll('button,a,[role="button"]')].find(el=>/PHÂN TÍCH AI|PHAN TICH AI/i.test((el.textContent||'').replace(/\s+/g,' ').trim()))||null;
  }

  function build(){
    if(document.querySelector('['+GUIDE+']')) return true;
    const analyze=findAnalyze();
    if(!analyze) return false;

    const host=document.createElement('section');
    host.setAttribute(GUIDE,'1');
    host.style.cssText='display:block;width:100%;margin:14px 0 0;box-sizing:border-box;position:relative;z-index:30;';

    host.innerHTML=`
      <div style="width:100%;box-sizing:border-box;background:#fff;border:1px solid #bcd9f5;border-radius:18px;box-shadow:0 12px 36px rgba(30,80,130,.10);overflow:hidden;color:#10233f;text-align:left">
        <div style="padding:15px 16px;background:linear-gradient(135deg,#eef7ff,#f8fbff);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;gap:11px;align-items:center;min-width:0">
            <div style="width:40px;height:40px;border-radius:11px;background:#dff0ff;display:grid;place-items:center;font-size:21px;flex:0 0 auto">🧪</div>
            <div><div style="font-size:16px;font-weight:900">HƯỚNG DẪN CHẨN ĐOÁN CHỨC NĂNG</div><div style="margin-top:3px;color:#647b98;font-size:12px">Kiểm tra chức năng trên máy để khoanh vùng trước khi đi vào schematic / boardview.</div></div>
          </div>
          <button type="button" data-as-guide-toggle="1" style="border:1px solid #b9d8f5;border-radius:10px;background:#fff;color:#145ca8;padding:9px 12px;font:800 13px/1 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer">Thu gọn ▲</button>
        </div>
        <div data-as-guide-body="1" style="padding:0 15px 15px">
          <div style="margin-top:13px;padding:12px 13px;border-radius:12px;background:#f4faff;border:1px solid #d5e8fb;font-size:13px;line-height:1.6"><b style="color:#145ca8">🔎 QUY TRÌNH KHOANH VÙNG</b><br>Panic thực tế → dò Sensor Array EXACT → xác định khu vực tài liệu ánh xạ → kiểm tra chức năng → đo đường/điểm nghi ngờ → thay cụm/linh kiện known-good khi đủ cơ sở → boot/test lại → đọc Panic lại để xác nhận.</div>
          <div style="margin-top:12px;padding:13px;border-radius:12px;background:#f4faff;border:1px solid #d5e8fb">
            <div style="font-weight:900;color:#145ca8;margin-bottom:8px">📱 iPhone đời cao — Apple Diagnostics</div>
            <div style="font-size:12px;color:#647b98;line-height:1.5;margin-bottom:8px">Chỉ áp dụng khi model/thiết bị hỗ trợ chế độ Diagnostics của Apple.</div>
            <ol style="margin:0;padding-left:22px;line-height:1.65;font-size:14px">
              <li>Tắt hẳn iPhone.</li>
              <li>Nhấn và giữ <b>Volume Up + Volume Down</b> cùng lúc.</li>
              <li>Trong khi vẫn giữ 2 phím âm lượng, cắm vào bộ nguồn (Apple khuyến nghị 18W trở lên) hoặc máy tính đang bật và được cấp nguồn.</li>
              <li>Khi logo Apple xuất hiện, thả 2 phím.</li>
              <li>Khi hiện <b>Diagnostics &amp; Repair</b>, chọn <b>Start Session</b>.</li>
            </ol>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:11px">
            <figure style="margin:0;border:1px solid #dce8f4;border-radius:12px;overflow:hidden;background:#fff"><img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-put-in-diagnostic-mode-diagram.png" alt="Apple Diagnostics Volume Up Volume Down" style="width:100%;height:auto;display:block"><figcaption style="padding:8px 10px;font-size:11px;color:#647b98">Apple: giữ đồng thời 2 phím âm lượng.</figcaption></figure>
            <figure style="margin:0;border:1px solid #dce8f4;border-radius:12px;overflow:hidden;background:#fff"><img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-diagnostic-mode-screen.png" alt="Diagnostics and Repair Start Session" style="width:100%;height:auto;display:block"><figcaption style="padding:8px 10px;font-size:11px;color:#647b98">Màn hình Diagnostics &amp; Repair / Start Session.</figcaption></figure>
          </div>
          <div style="margin-top:11px;padding:11px 12px;border-radius:11px;background:#fff8e8;border:1px solid #f3d48a;color:#6b4b00;font-size:12px;line-height:1.55"><b>⚠️ Lưu ý:</b> Diagnostics là bằng chứng chức năng bổ sung. Không dùng riêng kết quả này để kết luận IC hư; phải đối chiếu Panic String, Sensor Array, đo đạc và kết quả thay thử known-good.</div>
          <div style="margin-top:9px;font-size:11px;color:#647b98">Nguồn hướng dẫn: Apple Support — How to put your iPhone in diagnostics mode.</div>
        </div>
      </div>`;

    const toggle=host.querySelector('[data-as-guide-toggle]');
    const body=host.querySelector('[data-as-guide-body]');
    toggle.addEventListener('click',()=>{
      const closed=body.style.display==='none';
      body.style.display=closed?'block':'none';
      toggle.textContent=closed?'Thu gọn ▲':'Mở hướng dẫn ▼';
    });

    /* Put it immediately after the real AI analyze control. */
    analyze.insertAdjacentElement('afterend',host);
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{if(build()||++tries>120)clearInterval(timer)},250);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',build,{once:true});
  else build();
  new MutationObserver(()=>build()).observe(document.body,{childList:true,subtree:true});
})();
