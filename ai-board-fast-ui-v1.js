/* APPLE SEED AI BOARD — FAST RESULT + TYPEWRITER V4.4 + COPY + SIDE DIAGNOSTICS + EXACT PANIC KB */
(()=>{
  'use strict';
  const result=document.getElementById('result');
  if(!result)return;
  const speed=7;
  let typing=false;
  let target='';

  const PANIC_KB=[
    ['AOP PANIC','Cảm biến / Cụm sạc'],
    ['TTBR','Flex cảm biến / Audio'],
    ['Pulse','Flex cảm biến'],
    ['Moly','Flex cảm biến'],
    ['Pearl','Flex cảm biến'],
    ['Dart-aop','Flex cảm biến / Audio'],
    ['I2C0','Cụm sạc'],
    ['I2CSCM0','Thay cụm sạc trước (đa số done)'],
    ['I2CSCM1','Thay cụm sạc trước (đa số done)'],
    ['PRS0','Cảm biến áp suất → ưu tiên cụm sạc'],
    ['MIC1','Cụm sạc / Micro'],
    ['SMC PANIC','Pin / Nhiệt độ / Charging'],
    ['TB0T','Pin / Socket pin'],
    ['TB0V','Pin / Socket pin'],
    ['TG0B','Pin / Socket pin'],
    ['TG0V','Pin / Socket pin'],
    ['PCIe PANIC','NAND / WiFi / Baseband'],
    ['ANS2 PANIC','CPU ↔ NAND'],
    ['DCP PANIC','Màn hình / Socket màn / Đường DCP'],
    ['prox(7)','Flex cảm biến (Proximity)'],
    ['Kernel Abort Report','Ưu tiên restore, sau đó kiểm tra CPU/NAND nếu còn lặp']
  ];

  const SENSOR_KB={
    '0x80000':'Proximity Flex Cable — Cáp cảm biến','0x140000':'Charging Port Flex / Power Button Flex / Barometer — Cáp sạc / cáp nguồn / barometer','0x180000':'Proximity Flex & Power Button Flex — Cáp cảm biến + cáp nguồn','0x20000':'Sandwich / Gyro — Sandwich / gyro','0x40000':'Charging Port Flex — Cáp sạc','0x60000':'Proximity Flex Cable — Cáp cảm biến','0x1800':'Charging Port Flex & Proximity Flex — Cáp sạc + cáp cảm biến','0x4000':'Battery Communications — Giao tiếp pin','0x10000':'Power Button Flex — Cáp nút nguồn','0x800':'Charging Port Flex — Cáp sạc','0x1000':'Proximity Flex Cable — Cáp cảm biến','0x194':'Magnetometer / Compass — La bàn','0x204':'Humidity Sensor — Cảm biến ẩm','0x104':'Accelerometer — Cảm biến gia tốc','0x114':'Gyroscope — Cảm biến xoay','0x124':'Magnetometer / Compass — La bàn','0x134':'Proximity / Light Sensor — Cáp cảm biến','0x144':'Temperature Sensor — Cảm biến nhiệt','0x154':'Humidity Sensor — Cảm biến ẩm','0x164':'Pressure Sensor / Barometer — Cảm biến áp suất','0x174':'Pressure Sensor — Cảm biến áp suất','0x184':'Gyroscope — Cảm biến xoay','0x71':'Audio / Speaker System — Audio / loa','0x73':'Ambient Light Sensor — Cảm biến ánh sáng','0x74':'Speaker Output — Loa','0x61':'Display / Digitizer — Màn hình / cảm ứng','0x63':'Motion Sensor — Cảm biến chuyển động','0x64':'Microphone — Micro','0x41':'Battery Communications — Giao tiếp pin','0x42':'Thermal Issue — Lỗi nhiệt','0x51':'Security / Secure Enclave — Face ID / bảo mật',
    '0x1A4':'Proximity / Light Sensor — Cáp cảm biến','0x1B4':'Ambient Light Sensor — Cảm biến ánh sáng','0x1C4':'Proximity Auto Dimming — Cáp cảm biến','0x1D4':'Gyroscope / Rotation Sensor — Cảm biến xoay','0x1E4':'Pressure Sensor / Barometer — Cảm biến áp suất','0x1F4':'Temperature Sensor — Cảm biến nhiệt','0x100000':'Power Button Flex / Charging Port Flex — Cáp nguồn / cáp sạc','0x200000':'Proximity Flex Cable — Cáp cảm biến','0x280000':'Charging Port Flex & Wireless Charging Flex — Cáp sạc + sạc không dây','0x300000':'Camera / Imaging System — Camera','0x400000':'Wireless Charging Flex — Cáp sạc không dây','0x500000':'Battery Communications / NFC — Pin / NFC','0x600000':'Wireless Charging Flex & Proximity Flex — Sạc không dây + cáp cảm biến','0x700000':'Charging Port Flex & Wireless Charging Flex — Cáp sạc + sạc không dây','0x800000':'Software / iOS Issue — Lỗi phần mềm','0xA00000':'Battery Issue — Pin','0xB00000':'Audio / Speaker System — Audio / loa','0xC0000':'It’s the Prox Flex & Charging Port Flex — Cáp cảm biến + cáp sạc','0xC00000':'Security / Secure Enclave — Face ID / bảo mật','0xD00000':'Sensor Group Failure — Nhóm cảm biến','0xF00000':'General Hardware Failure — Lỗi phần cứng','0xA1':'GPS System — GPS','0xB1':'Face ID / Touch ID — Face ID / Touch ID','0xC1':'Microphone / Audio Input — Micro','0xD1':'Vibration / Haptic Engine — Motor rung','0xE1':'Ambient Light / Proximity — Cáp cảm biến','0xF1':'Gyroscope / Accelerometer — Cảm biến xoay','0xA4':'Touch / Digitizer — Cảm ứng','0xB4':'SIM / Cellular System — SIM / sóng','0xC4':'Fingerprint / Biometrics — Vân tay','0xD4':'Ambient Temperature Sensor — Cảm biến nhiệt','0xE4':'Humidity Sensor — Cảm biến ẩm','0xF4':'Pressure Sensor — Cảm biến áp suất','0x240000':'Panic SMC 2359296 — Thay IC la bàn 👍'
  };

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function toHex(v){const s=String(v).trim();if(/^0x[0-9a-f]+$/i.test(s))return '0x'+s.slice(2).toUpperCase();if(/^\d+$/.test(s)){const n=Number(s);return Number.isSafeInteger(n)?'0x'+n.toString(16).toUpperCase():null}return null;}
  function exactPanicMatches(text){
    const t=String(text||'').toLowerCase();
    return PANIC_KB.filter(([k])=>{const x=k.toLowerCase();if(/^[a-z0-9]+$/i.test(k))return new RegExp('(?<![a-z0-9])'+x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![a-z0-9])','i').test(text);return t.includes(x);});
  }
  function exactSensorMatches(text){
    const lines=String(text||'').replace(/\\n/g,'\n').split(/\n+/).filter(x=>/sensor\s*array/i.test(x));
    const out=[];
    for(const line of lines){
      const vals=line.match(/0x[0-9a-f]+|\b\d+\b/gi)||[];
      for(const raw of vals){if(raw==='0'||raw.toLowerCase()==='0x0')continue;const h=toHex(raw);if(!h)continue;const hit=SENSOR_KB[h];out.push({raw,hex:h,hit});}
    }
    return out.filter((x,i,a)=>a.findIndex(y=>y.raw===x.raw&&y.hex===x.hex&&y.hit===x.hit)===i);
  }
  function ensureExactLookup(){
    const old=document.querySelector('[data-as-exact-panic-lookup]');if(old)old.remove();
    const panic=document.getElementById('panic')?.value||'';
    if(!panic.trim())return;
    const pm=exactPanicMatches(panic), sm=exactSensorMatches(panic);
    if(!pm.length&&!sm.length)return;
    const box=document.createElement('section');box.setAttribute('data-as-exact-panic-lookup','1');
    box.style.cssText='margin:14px 0;padding:15px;background:#f7fbff;border:1px solid #cfe2f7;border-radius:16px;color:#10233f;box-sizing:border-box;';
    let html='<div style="font-size:16px;font-weight:900;color:#145ca8">📚 APPLE SEED — TRA CỨU TÀI LIỆU EXACT MATCH</div><div style="font-size:12px;color:#647b98;margin-top:4px">Chỉ hiển thị mã/từ khóa thực sự xuất hiện trong PANIC LOG và có đối chiếu trong KB.</div>';
    if(pm.length){html+='<div style="margin-top:11px;font-weight:900">🔎 PANIC / ERROR KEYWORD</div><div style="margin-top:6px;display:grid;gap:6px">'+pm.map(([k,v])=>`<div style="padding:9px 10px;border-radius:10px;background:#fff;border:1px solid #dce8f4"><b>${esc(k)}</b> → ${esc(v)}</div>`).join('')+'</div>';}
    if(sm.length){html+='<div style="margin-top:11px;font-weight:900">🧩 SENSOR ARRAY</div><div style="margin-top:6px;display:grid;gap:6px">'+sm.map(x=>`<div style="padding:9px 10px;border-radius:10px;background:#fff;border:1px solid #dce8f4"><b>${esc(x.raw)} → ${esc(x.hex)}</b> → ${esc(x.hit||'KHÔNG CÓ TRONG BẢNG APPLE SEED')}</div>`).join('')+'</div>';}
    html+='<div style="margin-top:10px;font-size:12px;color:#647b98">Tra cứu tài liệu chỉ xác định mapping trong KB; không tự kết luận linh kiện hư.</div>';
    box.innerHTML=html;
    result.parentNode?.insertBefore(box,result);
  }

  function ensureCopyButton(){
    if(result.querySelector('[data-as-copy-result]'))return;
    const btn=document.createElement('button');btn.type='button';btn.setAttribute('data-as-copy-result','1');btn.innerHTML='📋 <span>Sao chép kết quả</span>';btn.style.cssText='display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:14px 0 4px;padding:12px 16px;border:1px solid rgba(0,200,120,.35);border-radius:12px;background:rgba(0,200,120,.10);color:inherit;font:600 14px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;box-sizing:border-box;transition:background .15s ease;';
    btn.addEventListener('click',async()=>{const pre=result.querySelector('pre');const text=(pre?.textContent||'').trim();if(!text){btn.querySelector('span').textContent='Chưa có kết quả';setTimeout(()=>btn.querySelector('span').textContent='Sao chép kết quả',1400);return;}try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch{}ta.remove()}btn.innerHTML='✅ <span>Đã sao chép!</span>';setTimeout(()=>btn.innerHTML='📋 <span>Sao chép kết quả</span>',1600)});
    result.appendChild(btn);
  }

  function ensureDiagnosticsGuide(){
    if(document.querySelector('[data-as-diagnostics-wrap]'))return;
    const actions=document.querySelector('.actions');if(!actions)return;
    const wrap=document.createElement('div');wrap.setAttribute('data-as-diagnostics-wrap','1');wrap.style.cssText='display:inline-block;vertical-align:top;position:relative;';
    const details=document.createElement('details');details.setAttribute('data-as-diagnostics','1');details.style.cssText='position:relative;margin:0;';
    const summary=document.createElement('summary');summary.innerHTML='🧪 Hướng dẫn chẩn đoán';summary.style.cssText='list-style:none;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid #b9d8f5;border-radius:12px;background:#eef7ff;color:#145ca8;font-weight:850;cursor:pointer;box-sizing:border-box;white-space:nowrap;';
    const panel=document.createElement('section');panel.setAttribute('data-as-diagnostics-panel','1');panel.style.cssText='position:absolute;z-index:10000;top:calc(100% + 10px);right:0;width:min(760px,calc(100vw - 32px));max-height:78vh;overflow:auto;padding:18px;background:#fff;border:1px solid #cfe2f7;border-radius:18px;box-shadow:0 22px 70px rgba(20,70,120,.22);color:#10233f;box-sizing:border-box;';
    panel.innerHTML=`<div style="display:flex;gap:12px;align-items:flex-start"><div style="width:42px;height:42px;border-radius:12px;background:#eaf4ff;display:grid;place-items:center;font-size:22px;flex:0 0 auto">🧪</div><div style="min-width:0"><div style="font-size:18px;font-weight:900">BẢNG HƯỚNG DẪN CHẨN ĐOÁN CHỨC NĂNG</div><div style="margin-top:4px;color:#647b98;font-size:13px;line-height:1.5">Dùng kiểm tra chức năng trên máy để khoanh vùng trước khi đi sâu vào schematic/boardview. Đây là bằng chứng bổ sung cho Panic Log + Sensor Array, không thay thế đo main.</div></div></div><div style="margin-top:14px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb"><div style="font-weight:900;color:#145ca8;margin-bottom:7px">🔎 QUY TRÌNH KHOANH VÙNG</div><div style="font-size:13px;line-height:1.65">Panic thực tế → dò mã lỗi/từ khóa EXACT trong tài liệu → dò Sensor Array EXACT → xác định khu vực tài liệu ánh xạ → kiểm tra chức năng → đo đường/điểm nghi ngờ → thay cụm/linh kiện <b>known-good</b> khi đủ cơ sở → boot/test lại → đọc Panic lại để xác nhận.</div></div><div style="margin-top:12px;padding:13px;border-radius:13px;background:#f4faff;border:1px solid #d5e8fb"><div style="font-weight:900;color:#145ca8;margin-bottom:8px">📱 iPhone đời cao — Apple Diagnostics</div><ol style="margin:0;padding-left:22px;line-height:1.65;font-size:14px"><li>Tắt hẳn iPhone.</li><li>Nhấn và giữ <b>Volume Up + Volume Down</b> cùng lúc.</li><li>Trong khi vẫn giữ 2 phím âm lượng, cắm vào bộ nguồn (Apple khuyến nghị 18W trở lên) hoặc máy tính đang bật và được cấp nguồn.</li><li>Khi logo Apple xuất hiện, thả 2 phím.</li><li>Khi hiện màn hình <b>Diagnostics & Repair</b>, chọn <b>Start Session</b>.</li></ol></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px"><figure style="margin:0;border:1px solid #dce8f4;border-radius:13px;overflow:hidden;background:#fff"><img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-put-in-diagnostic-mode-diagram.png" alt="Apple hướng dẫn giữ Volume Up và Volume Down để vào Diagnostics" style="width:100%;display:block;background:#fff"><figcaption style="padding:9px 11px;font-size:12px;color:#647b98">Hình thao tác 2 phím âm lượng của Apple.</figcaption></figure><figure style="margin:0;border:1px solid #dce8f4;border-radius:13px;overflow:hidden;background:#fff"><img src="https://cdsassets.apple.com/live/7WUAS350/images/iphone/iphone-14-pro-diagnostic-mode-screen.png" alt="Màn hình Diagnostics and Repair của iPhone" style="width:100%;display:block;background:#fff"><figcaption style="padding:9px 11px;font-size:12px;color:#647b98">Màn hình Diagnostics & Repair / Start Session.</figcaption></figure></div><div style="margin-top:12px;padding:12px 13px;border-radius:12px;background:#fff8e8;border:1px solid #f3d48a;color:#6b4b00;font-size:13px;line-height:1.55"><b>⚠️ Lưu ý:</b> Diagnostics chỉ là bằng chứng chức năng. Không dùng riêng nó để kết luận IC hư. Đối chiếu Panic String, Sensor Array, đo đạc và kết quả thay thử known-good.</div><div style="margin-top:10px;font-size:12px;color:#647b98">Nguồn: Apple Support — How to put your iPhone in diagnostics mode.</div>`;
    details.appendChild(summary);details.appendChild(panel);wrap.appendChild(details);actions.appendChild(wrap);
    const style=document.createElement('style');style.textContent='[data-as-diagnostics-wrap]{margin-left:0}[data-as-diagnostics-panel] img{max-width:100%;height:auto}@media(max-width:560px){[data-as-diagnostics-wrap]{width:100%;margin-top:0}[data-as-diagnostics-wrap] summary{width:100%}[data-as-diagnostics-panel]{position:fixed!important;left:16px!important;right:16px!important;top:76px!important;width:auto!important;max-height:calc(100vh - 96px)!important}[data-as-diagnostics-panel]>div:nth-of-type(3){grid-template-columns:1fr!important}}';document.head.appendChild(style);
  }

  function animate(){const pre=result.querySelector('pre');if(!pre||typing)return;const text=pre.textContent||'';if(!text.trim())return;if(text===target){ensureDiagnosticsGuide();return;}target=text;typing=true;pre.dataset.asTyping='1';pre.textContent='';let i=0;const tick=()=>{if(i>=target.length){pre.textContent=target;pre.dataset.asTyping='';typing=false;ensureCopyButton();ensureDiagnosticsGuide();return;}i=Math.min(target.length,i+Math.max(4,Math.ceil(target.length/220)));pre.textContent=target.slice(0,i);setTimeout(tick,speed)};tick();}

  const analyze=document.getElementById('analyze');
  if(analyze)analyze.addEventListener('click',()=>{setTimeout(()=>ensureExactLookup(),2500);setTimeout(()=>ensureExactLookup(),6000);setTimeout(()=>ensureExactLookup(),12000)},{capture:true});
  new MutationObserver(()=>{ensureDiagnosticsGuide();ensureExactLookup();if(!typing)setTimeout(animate,0)}).observe(result,{subtree:true,childList:true,characterData:true});
  ensureDiagnosticsGuide();ensureCopyButton();setTimeout(animate,100);
})();