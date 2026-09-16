/* APPLE SEED AI BOARD — DIAGNOSTICS GUIDE V2
   Standalone guide injector: never touches AI result content. */
(()=>{
  'use strict';
  const GUIDE='data-as-diagnostics-guide-v2';

  function findActions(){
    const nodes=[...document.querySelectorAll('.actions,button,.btn')];
    return document.querySelector('.actions') || nodes.find(el=>/PHÂN TÍCH AI|PHAN TICH AI/i.test(el.textContent||''))?.parentElement || null;
  }

  function build(){
    if(document.querySelector('['+GUIDE+']')) return true;
    const actions=findActions();
    if(!actions) return false;

    const host=document.createElement('div');
    host.setAttribute(GUIDE,'1');
    host.style.cssText='display:inline-block;position:relative;vertical-align:top;z-index:20;';

    const btn=document.createElement('button');
    btn.type='button';
    btn.textContent='🧪 Hướng dẫn chẩn đoán';
    btn.style.cssText='min-height:44px;padding:0 16px;border:1px solid #b9d8f5;border-radius:12px;background:#eef7ff;color:#145ca8;font:800 14px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;white-space:nowrap;box-sizing:border-box;';

    const panel=document.createElement('div');
    panel.hidden=true;
    panel.style.cssText='position:absolute;z-index:999999;top:calc(100% + 10px);right:0;width:min(780px,calc(100vw - 30px));max-height:78vh;overflow:auto;padding:18px;background:#fff;border:1px solid #cfe2f7;border-radius:18px;box-shadow:0 24px 80px rgba(20,70,120,.25);color:#10233f;box-sizing:border-box;text-align:left;';
    panel.innerHTML=`
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="width:42px;height:42px;border-radius:12px;background:#eaf4ff;display:grid;place-items:center;font-size:22px;flex:0 0 auto">🧪</div>
        <div><div style="font-size:18px;font-weight:900">BẢNG HƯỚNG DẪN CHẨN ĐOÁN CHỨC NĂNG</div><div style="margin-top:4px;color:#647b98;font-size:13px;line-height:1.5">Dùng kiểm tra chức năng trên máy để khoanh vùng trước khi đi sâu vào schematic/boardview. Đây là bằng chứng bổ sung cho Panic Log + Sensor Array.</div></div>
      </div>
      <div style="margin-top:14px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb;font-size:13px;line-height:1.65"><b style="color:#145ca8">🔎 QUY TRÌNH KHOANH VÙNG</b><br>Panic thực tế → dò Sensor Array EXACT → xác định khu vực tài liệu ánh xạ → kiểm tra chức năng → đo đường/điểm nghi ngờ → thay cụm/linh kiện known-good khi đủ cơ sở → boot/test lại → đọc Panic lại để xác nhận.</div>
      <div style="margin-top:12px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb"><div style="font-weight:900;color:#145ca8;margin-bottom:8px">📱 iPhone đời cao — Apple Diagnostics</div><ol style="margin:0;padding-left:22px;line-height:1.65;font-size:14px"><li>Tắt hẳn iPhone.</li><li>Nhấn và giữ <b>Volume Up + Volume Down</b> cùng lúc.</li><li>Trong khi vẫn giữ 2 phím âm lượng, cắm vào bộ nguồn (Apple khuyến nghị 18W trở lên) hoặc máy tính đang bật và được cấp nguồn.</li><li>Khi logo Apple xuất hiện, thả 2 phím.</li><li>Khi hiện màn hình <b>Diagnostics & Repair</b>, chọn <b>Start Session</b>.</li></ol></div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px"><figure style="margin:0;border:1px solid #dce8f4;border-radius:13px;overflow:hidden;background:#fff"><img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-put-in-diagnostic-mode-diagram.png" alt="Apple Diagnostics volume buttons" style="width:100%;display:block"><figcaption style="padding:9px 11px;font-size:12px;color:#647b98">Hình thao tác 2 phím âm lượng của Apple.</figcaption></figure><figure style="margin:0;border:1px solid #dce8f4;border-radius:13px;overflow:hidden;background:#fff"><img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-diagnostic-mode-screen.png" alt="Diagnostics and Repair screen" style="width:100%;display:block"><figcaption style="padding:9px 11px;font-size:12px;color:#647b98">Màn hình Diagnostics & Repair / Start Session.</figcaption></figure></div>
      <div style="margin-top:12px;padding:12px 13px;border-radius:12px;background:#fff8e8;border:1px solid #f3d48a;color:#6b4b00;font-size:13px;line-height:1.55"><b>⚠️ Lưu ý:</b> Diagnostics chỉ là bằng chứng chức năng. Không dùng riêng nó để kết luận IC hư. Đối chiếu Panic String, Sensor Array, đo đạc và kết quả thay thử known-good.</div>
      <div style="margin-top:10px;font-size:12px;color:#647b98">Nguồn: Apple Support — How to put your iPhone in diagnostics mode.</div>`;

    btn.addEventListener('click',e=>{e.preventDefault();panel.hidden=!panel.hidden;});
    host.append(btn,panel);

    // Put directly beside the AI analyze button; do not append to #result.
    const analyze=[...actions.querySelectorAll('button')].find(b=>/PHÂN TÍCH AI|PHAN TICH AI/i.test(b.textContent||''));
    if(analyze && analyze.parentElement===actions) actions.insertBefore(host,analyze.nextSibling);
    else actions.appendChild(host);
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{if(build()||++tries>80)clearInterval(timer);},250);
  if(document.readyState!=='loading') build();
  else document.addEventListener('DOMContentLoaded',build,{once:true});
})();
