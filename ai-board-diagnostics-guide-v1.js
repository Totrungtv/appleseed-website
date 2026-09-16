/* APPLE SEED AI BOARD — DIAGNOSTICS GUIDE V3
   Standalone guide injector: never touches AI result content. */
(()=>{
  'use strict';
  const GUIDE='data-as-diagnostics-guide-v2';
  function findActions(){
    const a=document.querySelector('.actions');
    if(a)return a;
    const b=[...document.querySelectorAll('button,.btn')].find(el=>/PHÂN TÍCH AI|PHAN TICH AI/i.test(el.textContent||''));
    return b?.parentElement||null;
  }
  function build(){
    if(document.querySelector('['+GUIDE+']'))return true;
    const actions=findActions(); if(!actions)return false;
    const host=document.createElement('div'); host.setAttribute(GUIDE,'1');
    host.style.cssText='display:inline-block;position:relative;vertical-align:top;z-index:9999;';
    const btn=document.createElement('button'); btn.type='button'; btn.textContent='🧪 Hướng dẫn chẩn đoán';
    btn.style.cssText='min-height:44px;padding:0 16px;border:1px solid #b9d8f5;border-radius:12px;background:#eef7ff;color:#145ca8;font:800 14px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;white-space:nowrap;box-sizing:border-box;';
    const panel=document.createElement('div'); panel.hidden=true;
    panel.style.cssText='position:absolute;z-index:999999;top:calc(100% + 10px);left:0;width:min(780px,calc(100vw - 30px));max-height:78vh;overflow:auto;padding:18px;background:#fff;border:1px solid #cfe2f7;border-radius:18px;box-shadow:0 24px 80px rgba(20,70,120,.25);color:#10233f;box-sizing:border-box;text-align:left;';
    panel.innerHTML=`<div style="display:flex;gap:12px;align-items:flex-start"><div style="width:42px;height:42px;border-radius:12px;background:#eaf4ff;display:grid;place-items:center;font-size:22px">🧪</div><div><div style="font-size:18px;font-weight:900">BẢNG HƯỚNG DẪN CHẨN ĐOÁN CHỨC NĂNG</div><div style="margin-top:4px;color:#647b98;font-size:13px;line-height:1.5">Dùng kiểm tra chức năng trên máy để khoanh vùng trước khi đi sâu vào schematic/boardview. Đây là bằng chứng bổ sung cho Panic Log + Sensor Array.</div></div></div><div style="margin-top:14px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb;font-size:13px;line-height:1.65"><b style="color:#145ca8">🔎 QUY TRÌNH KHOANH VÙNG</b><br>Panic thực tế → dò Sensor Array EXACT → xác định khu vực tài liệu ánh xạ → kiểm tra chức năng → đo đường/điểm nghi ngờ → thay cụm/linh kiện known-good khi đủ cơ sở → boot/test lại → đọc Panic lại để xác nhận.</div><div style="margin-top:12px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb"><b style="color:#145ca8">📱 iPhone đời cao — Apple Diagnostics</b><ol style="margin:8px 0 0;padding-left:22px;line-height:1.65;font-size:14px"><li>Tắt hẳn iPhone.</li><li>Giữ Volume Up + Volume Down cùng lúc.</li><li>Vẫn giữ 2 phím và cắm vào bộ nguồn hoặc máy tính đang cấp nguồn.</li><li>Thấy logo Apple thì thả phím.</li><li>Ở Diagnostics & Repair chọn Start Session.</li></ol></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px"><img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-put-in-diagnostic-mode-diagram.png" alt="Apple Diagnostics volume buttons" style="width:100%;border:1px solid #dce8f4;border-radius:13px;display:block"><img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-diagnostic-mode-screen.png" alt="Diagnostics and Repair screen" style="width:100%;border:1px solid #dce8f4;border-radius:13px;display:block"></div><div style="margin-top:12px;padding:12px;border-radius:12px;background:#fff8e8;border:1px solid #f3d48a;color:#6b4b00;font-size:13px;line-height:1.55"><b>⚠️ Lưu ý:</b> Diagnostics là bằng chứng chức năng, không tự nó kết luận IC hư. Đối chiếu Panic String, Sensor Array, đo đạc và known-good.</div>`;
    btn.addEventListener('click',e=>{e.preventDefault();panel.hidden=!panel.hidden;});
    host.append(btn,panel);
    const analyze=[...actions.querySelectorAll('button')].find(b=>/PHÂN TÍCH AI|PHAN TICH AI/i.test(b.textContent||''));
    if(analyze)analyze.insertAdjacentElement('afterend',host); else actions.appendChild(host);
    return true;
  }
  let n=0; const t=setInterval(()=>{if(build()||++n>120)clearInterval(t)},250); if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
