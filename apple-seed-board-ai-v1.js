/* Apple Seed Board AI bridge */
(()=> {
 'use strict';
 const $=id=>document.getElementById(id), right=document.querySelector('.right');
 if(!right||$('as-board-ai-panel')) return;
 const panel=document.createElement('section'); panel.className='panel'; panel.id='as-board-ai-panel';
 panel.innerHTML=[
 '<div class="panelhead"><div><div class="eyebrow">05 / AI DIAGNOSTIC ENGINE</div><h3>AI phân tích mạch & ROM</h3></div><span class="ai-state"><i class="dot"></i> SERVER AI</span></div>',
 '<div class="pad">',
 '<div class="field"><label for="asRomFile">Nạp panic / ROM / restore log (TXT, IPS, LOG, JSON)</label><input id="asRomFile" type="file" accept=".txt,.log,.ips,.panic,.json,.csv,.xml,.plist"></div>',
 '<div class="field"><label for="asRomText">Log / mã lỗi / firmware / số đo</label><textarea id="asRomText" rows="5" placeholder="Dán panic-full, lỗi 3uTools/iTunes, boot log, mã lỗi restore, thông tin ROM/firmware, số đo main..."></textarea></div>',
 '<div class="field"><label for="asBoardModel">Model / mã board</label><input id="asBoardModel" placeholder="Ví dụ: iPhone 12 Pro Max / mã board"></div>',
 '<div class="field"><label for="asDomain">Khối kỹ thuật cần ưu tiên</label><select id="asDomain"><option>Tự động phân tích toàn bộ</option><option>Nguồn / PMIC / VDD</option><option>Sạc / Hydra / USB</option><option>CPU / NAND / ROM</option><option>Wi-Fi / Bluetooth / RF</option><option>Baseband / sóng / SIM</option><option>Face ID / cảm biến</option><option>Audio / mic / loa</option><option>Màn hình / cảm ứng</option><option>I2C / SPI / UART / bus dữ liệu</option><option>PANIC / boot / restore</option><option>Đọc schematic / boardview</option></select></div>',
 '<div class="field"><label for="asBoardIssue">Triệu chứng và lịch sử sửa chữa</label><textarea id="asBoardIssue" rows="3" placeholder="Mất nguồn, dòng nguồn, đã thay/đóng IC gì, kết quả đo..."></textarea></div>',
 '<button class="btn primary" id="asDeepAnalyze" style="width:100%">✦ Phân tích ảnh + mạch + ROM bằng AI</button>',
 '<div id="asDeepStatus" class="statusline" style="margin-top:10px">Cần đăng nhập Apple Seed. Ảnh và log sẽ gửi tới AI server.</div>',
 '<div id="asDeepResult" class="result" style="margin-top:12px;white-space:pre-wrap;line-height:1.75"></div>',
 '<button class="btn ghost" id="asCopyDeep" style="width:100%;margin-top:9px">Sao chép kết quả AI</button>',
 '</div>'
 ].join('');
 right.insertBefore(panel,right.firstChild);
 const status=$('asDeepStatus'),out=$('asDeepResult'),btn=$('asDeepAnalyze');
 async function analyze(){
  const sb=window.supabaseClient;
  if(!sb){status.textContent='Không tải được Supabase client.';return}
  const {data:{session},error:authError}=await sb.auth.getSession();
  if(authError||!session){status.textContent='Ông cần đăng nhập Apple Seed trước khi phân tích.';return}
  const canvas=$('boardCanvas'),wrap=$('canvasWrap'),hasImage=canvas&&canvas.width&&canvas.height&&!wrap.classList.contains('empty');
  const logs=$('asRomText').value.trim(),issue=$('asBoardIssue').value.trim();
  if(!hasImage&&!logs&&!issue){status.textContent='Hãy nạp ảnh mainboard hoặc nhập log/triệu chứng.';return}
  let imageData='';
  if(hasImage){const c=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(canvas.width,canvas.height));c.width=Math.round(canvas.width*scale);c.height=Math.round(canvas.height*scale);c.getContext('2d').drawImage(canvas,0,0,c.width,c.height);imageData=c.toDataURL('image/jpeg',.86)}
  const marked=[...document.querySelectorAll('#componentList .component')].map(x=>x.innerText).join('\n');
  const prompt=[
   'APPLE SEED BOARD-LEVEL + ROM DIAGNOSTICS',
   'MODEL/BOARD: '+($('asBoardModel').value.trim()||'Chưa rõ'),
   'KHỐI ƯU TIÊN: '+$('asDomain').value,
   'TRIỆU CHỨNG/LỊCH SỬ: '+(issue||'Chưa cung cấp'),
   'PANIC / ROM / RESTORE LOG:\n'+(logs||'Không có'),
   'SỐ ĐO THỰC TẾ:\n'+($('measurements')?.value||'Không có'),
   'PAN ĐÃ CHỌN: '+($('symptom')?.value||'Không chọn'),
   'MARKER LINH KIỆN TRÊN ẢNH:\n'+(marked||'Không có'),
   'YÊU CẦU: Phân tích ảnh thật và log. Tách EVIDENCE, BRAIN KNOWLEDGE có nguồn, INFERENCE. Đọc đúng ký hiệu/mã lỗi thấy được; không đoán mã IC mờ. Với PANIC/boot/restore, giữ nguyên chuỗi lỗi và giải thích có căn cứ. Khoanh vùng khối nguồn, sạc, USB, NAND, CPU, baseband, Wi-Fi, audio, Face ID, cảm biến chỉ khi bằng chứng hỗ trợ. Đề xuất thứ tự đo diode, trở kháng, áp, dòng, tín hiệu; nêu điểm đo cụ thể chỉ khi có căn cứ. Không bịa NET, pinout, trị số chuẩn, sơ đồ hoặc quan hệ linh kiện. Nêu chính xác dữ liệu còn thiếu. Với ROM/firmware, phân tích log, phiên bản, manifest/hash nếu được cung cấp và lỗi restore; không hướng dẫn vượt khóa bảo mật hoặc truy cập trái phép.'
  ].join('\n\n');
  btn.disabled=true;btn.textContent='Đang phân tích...';status.textContent='Đang xác thực và gửi dữ liệu vào Apple Seed Electronic Brain...';out.textContent='';
  try{
   const {data,error}=await sb.functions.invoke('ai-board-chat',{body:{message:prompt,messages:[],image_data:imageData}});
   if(error)throw error;
   if(data?.error||!data?.answer)throw new Error(data?.error||'AI không trả kết quả');
   out.textContent=data.answer;
   status.textContent='Hoàn tất · Brain hits: '+(data.brain_hits||0)+' · '+(data.model||'AI');
  }catch(e){status.textContent='AI lỗi: '+(e.message||String(e));out.textContent='Kiểm tra đăng nhập, cấu hình OPENAI_API_KEY, model trong Edge Function và nhật ký Supabase.'}
  finally{btn.disabled=false;btn.textContent='✦ Phân tích ảnh + mạch + ROM bằng AI'}
 }
 btn.addEventListener('click',analyze);
 $('asRomFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>12*1024*1024){status.textContent='File văn bản tối đa 12MB.';return}try{$('asRomText').value=await f.text();status.textContent='Đã nạp log: '+f.name}catch(_){status.textContent='Không đọc được file văn bản.'}});
 $('asCopyDeep').addEventListener('click',()=>{const t=out.textContent;if(t)navigator.clipboard?.writeText(t).then(()=>status.textContent='Đã sao chép kết quả.')});
})();