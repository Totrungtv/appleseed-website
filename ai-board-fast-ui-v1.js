/* APPLE SEED AI BOARD — FAST RESULT + TYPEWRITER V4.3 + COPY + SIDE DIAGNOSTICS */
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
    btn.style.cssText='display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:14px 0 4px;padding:12px 16px;border:1px solid rgba(0,200,120,.35);border-radius:12px;background:rgba(0,200,120,.10);color:inherit;font:600 14px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;box-sizing:border-box;transition:background .15s ease;';
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
    if(document.querySelector('[data-as-diagnostics-wrap]'))return;
    const actions=document.querySelector('.actions');
    if(!actions)return;

    const wrap=document.createElement('div');
    wrap.setAttribute('data-as-diagnostics-wrap','1');
    wrap.style.cssText='display:inline-block;vertical-align:top;position:relative;';

    const details=document.createElement('details');
    details.setAttribute('data-as-diagnostics','1');
    details.style.cssText='position:relative;margin:0;';

    const summary=document.createElement('summary');
    summary.innerHTML='🧪 Hướng dẫn chẩn đoán';
    summary.style.cssText='list-style:none;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid #b9d8f5;border-radius:12px;background:#eef7ff;color:#145ca8;font-weight:850;cursor:pointer;box-sizing:border-box;white-space:nowrap;';
    summary.addEventListener('click',()=>setTimeout(()=>{
      if(!details.open)return;
      panel.scrollIntoView({behavior:'smooth',block:'nearest'});
    },30));

    const panel=document.createElement('section');
    panel.setAttribute('data-as-diagnostics-panel','1');
    panel.style.cssText='position:absolute;z-index:10000;top:calc(100% + 10px);right:0;width:min(760px,calc(100vw - 32px));max-height:78vh;overflow:auto;padding:18px;background:#fff;border:1px solid #cfe2f7;border-radius:18px;box-shadow:0 22px 70px rgba(20,70,120,.22);color:#10233f;box-sizing:border-box;';
    panel.innerHTML=`
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="width:42px;height:42px;border-radius:12px;background:#eaf4ff;display:grid;place-items:center;font-size:22px;flex:0 0 auto">🧪</div>
        <div style="min-width:0">
          <div style="font-size:18px;font-weight:900">BẢNG HƯỚNG DẪN CHẨN ĐOÁN CHỨC NĂNG</div>
          <div style="margin-top:4px;color:#647b98;font-size:13px;line-height:1.5">Dùng kiểm tra chức năng trên máy để khoanh vùng trước khi đi sâu vào schematic/boardview. Đây là bằng chứng bổ sung cho Panic Log + Sensor Array, không thay thế đo main.</div>
        </div>
      </div>

      <div style="margin-top:14px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb">
        <div style="font-weight:900;color:#145ca8;margin-bottom:7px">🔎 QUY TRÌNH KHOANH VÙNG</div>
        <div style="font-size:13px;line-height:1.65">Panic thực tế → dò Sensor Array EXACT → xác định khu vực tài liệu ánh xạ → kiểm tra chức năng → đo đường/điểm nghi ngờ → thay cụm/linh kiện <b>known-good</b> khi đủ cơ sở → boot/test lại → đọc Panic lại để xác nhận.</div>
      </div>

      <div style="margin-top:12px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb">
        <div style="font-weight:900;color:#145ca8;margin-bottom:8px">📱 iPhone đời cao — Apple Diagnostics</div>
        <ol style="margin:0;padding-left:22px;line-height:1.65;font-size:14px">
          <li>Tắt hẳn iPhone.</li>
          <li>Nhấn và giữ <b>Volume Up + Volume Down</b> cùng lúc.</li>
          <li>Trong khi vẫn giữ 2 phím âm lượng, cắm vào bộ nguồn (Apple khuyến nghị 18W trở lên) hoặc máy tính đang bật và được cấp nguồn.</li>
          <li>Khi logo Apple xuất hiện, thả 2 phím.</li>
          <li>Khi hiện màn hình <b>Diagnostics & Repair</b>, chọn <b>Start Session</b>.</li>
        </ol>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px">
        <figure style="margin:0;border:1px solid #dce8f4;border-radius:13px;overflow:hidden;background:#fff">
          <img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-put-in-diagnostic-mode-diagram.png" alt="Apple hướng dẫn giữ Volume Up và Volume Down để vào Diagnostics" style="width:100%;display:block;background:#fff">
          <figcaption style="padding:9px 11px;font-size:12px;color:#647b98">Hình thao tác 2 phím âm lượng của Apple.</figcaption>
        </figure>
        <figure style="margin:0;border:1px solid #dce8f4;border-radius:13px;overflow:hidden;background:#fff">
          <img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-diagnostic-mode-screen.png" alt="Màn hình Diagnostics and Repair của iPhone" style="width:100%;display:block;background:#fff">
          <figcaption style="padding:9px 11px;font-size:12px;color:#647b98">Màn hình Diagnostics & Repair / Start Session.</figcaption>
        </figure>
      </div>

      <div style="margin-top:12px;padding:12px 13px;border-radius:12px;background:#fff8e8;border:1px solid #f3d48a;color:#6b4b00;font-size:13px;line-height:1.55">
        <b>⚠️ Lưu ý:</b> Diagnostics chỉ là bằng chứng chức năng. Không dùng riêng nó để kết luận IC hư. Đối chiếu Panic String, Sensor Array, đo đạc và kết quả thay thử known-good.
      </div>
      <div style="margin-top:10px;font-size:12px;color:#647b98">Nguồn: Apple Support — How to put your iPhone in diagnostics mode.</div>`;

    details.appendChild(summary);
    details.appendChild(panel);
    wrap.appendChild(details);
    actions.appendChild(wrap);

    const style=document.createElement('style');
    style.textContent=`
      [data-as-diagnostics-wrap]{margin-left:0}
      [data-as-diagnostics-panel] img{max-width:100%;height:auto}
      @media(max-width:560px){
        [data-as-diagnostics-wrap]{width:100%;margin-top:0}
        [data-as-diagnostics-wrap] summary{width:100%}
        [data-as-diagnostics-panel]{position:fixed!important;left:16px!important;right:16px!important;top:76px!important;width:auto!important;max-height:calc(100vh - 96px)!important}
        [data-as-diagnostics-panel]>div:nth-of-type(3){grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(style);
  }

  function animate(){
    const pre=result.querySelector('pre');
    if(!pre||typing)return;
    const text=pre.textContent||'';
    if(!text.trim()){return;}
    if(text===target){ensureDiagnosticsGuide();return;}
    target=text;typing=true;pre.dataset.asTyping='1';pre.textContent='';let i=0;
    const tick=()=>{
      if(i>=target.length){pre.textContent=target;pre.dataset.asTyping='';typing=false;ensureCopyButton();ensureDiagnosticsGuide();return;}
      i=Math.min(target.length,i+Math.max(4,Math.ceil(target.length/220)));
      pre.textContent=target.slice(0,i);setTimeout(tick,speed);
    };tick();
  }

  new MutationObserver(()=>{ensureDiagnosticsGuide();if(!typing)setTimeout(animate,0);}).observe(result,{subtree:true,childList:true,characterData:true});
  ensureDiagnosticsGuide();
  ensureCopyButton();
  setTimeout(animate,100);
})();
