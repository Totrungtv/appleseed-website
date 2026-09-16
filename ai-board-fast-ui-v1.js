/* APPLE SEED AI BOARD — FAST RESULT + TYPEWRITER V4.2 + COPY + DIAGNOSTICS GUIDE */
(()=>{
  'use strict';
  const result=document.getElementById('result');
  if(!result)return;
  const speed=7;
  let typing=false;
  let target='';

  function ensureCopyButton(){
    if(result.querySelector('[data-as-copy-result]'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.setAttribute('data-as-copy-result','1');
    btn.innerHTML='📋 <span>Sao chép kết quả</span>';
    btn.style.cssText='display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:14px 0 4px;padding:12px 16px;border:1px solid rgba(0,200,120,.35);border-radius:12px;background:rgba(0,200,120,.10);color:inherit;font:600 14px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;box-sizing:border-box;transition:transform .15s ease,opacity .15s ease,background .15s ease;';
    btn.addEventListener('mouseenter',()=>{btn.style.background='rgba(0,200,120,.18)';});
    btn.addEventListener('mouseleave',()=>{btn.style.background='rgba(0,200,120,.10)';});
    btn.addEventListener('click',async()=>{
      const pre=result.querySelector('pre');
      const text=(pre?.textContent||'').trim();
      if(!text){
        btn.querySelector('span').textContent='Chưa có kết quả';
        setTimeout(()=>btn.querySelector('span').textContent='Sao chép kết quả',1400);
        return;
      }
      try{await navigator.clipboard.writeText(text);}catch{
        const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch{}ta.remove();
      }
      btn.innerHTML='✅ <span>Đã sao chép!</span>';
      setTimeout(()=>{btn.innerHTML='📋 <span>Sao chép kết quả</span>';},1600);
    });
    result.appendChild(btn);
  }

  function ensureDiagnosticsGuide(){
    if(document.querySelector('[data-as-diagnostics-guide]'))return;
    if(!(result.querySelector('pre')?.textContent||'').trim())return;
    const card=document.createElement('section');
    card.setAttribute('data-as-diagnostics-guide','1');
    card.style.cssText='margin-top:16px;padding:18px;background:#fff;border:1px solid #cfe2f7;border-radius:18px;box-shadow:0 12px 36px rgba(30,80,130,.10);color:#10233f;';
    card.innerHTML=`
      <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div style="width:42px;height:42px;border-radius:12px;background:#eaf4ff;display:grid;place-items:center;font-size:22px">🧪</div>
        <div style="flex:1;min-width:240px">
          <div style="font-size:18px;font-weight:900">HƯỚNG DẪN CHẨN ĐOÁN CHỨC NĂNG</div>
          <div style="margin-top:4px;color:#647b98;font-size:13px;line-height:1.5">Kiểm tra chức năng trên máy trước khi đi sâu vào mainboard. Khi thiết bị hỗ trợ Apple Diagnostics, dùng chế độ chuẩn của Apple để lấy thêm bằng chứng; kết quả này chỉ bổ sung cho Panic Log/Sensor Array, không thay thế phép đo main.</div>
        </div>
      </div>
      <div style="margin-top:15px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb">
        <div style="font-weight:900;color:#145ca8;margin-bottom:8px">📱 iPhone đời cao — Apple Diagnostics</div>
        <ol style="margin:0;padding-left:22px;line-height:1.65;font-size:14px">
          <li>Tắt hẳn iPhone.</li>
          <li>Nhấn và giữ <b>Volume Up + Volume Down</b> cùng lúc.</li>
          <li>Trong khi vẫn giữ 2 phím âm lượng, cắm vào nguồn điện (Apple khuyến nghị bộ nguồn 18W trở lên) hoặc máy tính đang bật và được cấp nguồn.</li>
          <li>Khi logo Apple xuất hiện, thả 2 phím.</li>
          <li>Khi hiện màn hình <b>Diagnostics & Repair</b>, chọn <b>Start Session</b>.</li>
        </ol>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px">
        <figure style="margin:0;border:1px solid #dce8f4;border-radius:13px;overflow:hidden;background:#fff">
          <img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-put-in-diagnostic-mode-diagram.png" alt="Apple hướng dẫn giữ Volume Up và Volume Down để vào Diagnostics" style="width:100%;display:block;background:#fff">
          <figcaption style="padding:9px 11px;font-size:12px;color:#647b98">Vị trí 2 phím âm lượng — hình hướng dẫn của Apple.</figcaption>
        </figure>
        <figure style="margin:0;border:1px solid #dce8f4;border-radius:13px;overflow:hidden;background:#fff">
          <img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-diagnostic-mode-screen.png" alt="Màn hình Diagnostics and Repair của iPhone" style="width:100%;display:block;background:#fff">
          <figcaption style="padding:9px 11px;font-size:12px;color:#647b98">Màn hình Diagnostics & Repair / Start Session.</figcaption>
        </figure>
      </div>
      <div style="margin-top:12px;padding:12px 13px;border-radius:12px;background:#fff8e8;border:1px solid #f3d48a;color:#6b4b00;font-size:13px;line-height:1.55">
        <b>⚠️ Lưu ý cho thợ:</b> Diagnostics mode là bằng chứng bổ sung để xác định chức năng đang lỗi. Không dùng riêng kết quả Diagnostics để kết luận IC hư. Phải đối chiếu với Panic String, Sensor Array, đo đạc và kết quả thay thử known-good khi cần.
      </div>
      <div style="margin-top:11px;font-size:12px;color:#647b98">Nguồn hướng dẫn: Apple Support — How to put your iPhone in diagnostics mode.</div>`;
    result.parentNode?.insertBefore(card,result.nextSibling);
  }

  function animate(){
    const pre=result.querySelector('pre');
    if(!pre||typing)return;
    const text=pre.textContent||'';
    if(!text.trim()||text===target){ensureDiagnosticsGuide();return;}
    target=text;typing=true;pre.dataset.asTyping='1';pre.textContent='';let i=0;
    const tick=()=>{
      if(i>=target.length){pre.textContent=target;pre.dataset.asTyping='';typing=false;ensureCopyButton();ensureDiagnosticsGuide();return;}
      i=Math.min(target.length,i+Math.max(4,Math.ceil(target.length/220)));
      pre.textContent=target.slice(0,i);setTimeout(tick,speed);
    };tick();
  }

  new MutationObserver(()=>{ensureCopyButton();if(!typing)setTimeout(animate,0);}).observe(result,{subtree:true,childList:true,characterData:true});
  ensureCopyButton();
  setTimeout(animate,100);
})();
