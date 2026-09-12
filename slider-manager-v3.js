<script id="APPLE_SEED_SLIDER_MANAGER_V3">
(function(){
  'use strict';
  const STAGE_SELECTOR='section.as3-hero>div.as3-wrap>div.as3-main:nth-of-type(1)>div.as3-stage:nth-of-type(2)';
  const BLANK='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#f7f9fc"/><rect x="24" y="24" width="592" height="352" rx="18" fill="none" stroke="#b8c4d2" stroke-width="3" stroke-dasharray="12 10"/><text x="320" y="185" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="800" fill="#667085">KHUNG ẢNH TRỐNG</text><text x="320" y="225" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#98a2b3">Bấm vào đây để thêm / thay ảnh</text></svg>');
  let panel,grid,status,intervalInput,activeIndex=0,fileBound=false;
  const q=id=>document.getElementById(id);
  const frame=()=>q('preview');
  const doc=()=>frame()&&frame().contentDocument;
  function stageItem(){
    if(typeof draft==='undefined'||!draft)return null;
    draft.items=draft.items||{};
    const i=draft.items[STAGE_SELECTOR]||(draft.items[STAGE_SELECTOR]={styles:{desktop:{},mobile:{}}});
    i.styles=i.styles||{};i.styles.desktop=i.styles.desktop||{};i.styles.mobile=i.styles.mobile||{};
    i.slider=i.slider||{images:[],autoplay:true,interval:5,showDots:true,showArrows:true,pauseOnHover:true};
    i.slider.images=Array.isArray(i.slider.images)?i.slider.images:[];
    return i;
  }
  function slider(){return stageItem()?.slider||null}
  function slideNodes(){
    const d=doc();if(!d)return [];
    for(const sel of ['.apple-seed-runtime-slider-host .apple-seed-runtime-slide','.apple-seed-hero-slider .apple-seed-hero-slide']){
      try{const n=[...d.querySelectorAll(sel)];if(n.length)return n}catch(_){ }
    }
    return [];
  }
  function renderPreview(){
    const s=slider();if(!s)return;
    const nodes=slideNodes();
    s.images.forEach((item,i)=>{
      const node=nodes[i];if(!node)return;
      const img=node.querySelector('img');if(!img)return;
      if(item?.src){
        img.src=item.src;img.style.opacity='1';img.style.visibility='visible';
        node.querySelector('[data-as-slider-placeholder]')?.remove();
      }else{
        img.src=BLANK;img.style.opacity='1';img.style.visibility='visible';node.style.position='relative';
        if(!node.querySelector('[data-as-slider-placeholder]')){
          const ph=document.createElement('div');ph.dataset.asSliderPlaceholder='1';ph.textContent='KHUNG ẢNH TRỐNG · BẤM ĐỂ THÊM ẢNH';
          ph.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;background:#f7f9fc;color:#667085;font:800 15px/1.4 system-ui;border:2px dashed #b8c4d2;z-index:4;cursor:pointer';
          ph.onclick=e=>{e.preventDefault();e.stopPropagation();activeIndex=i;render();pickFile()};node.appendChild(ph);
        }
      }
    });
    nodes.forEach((node,i)=>node.style.outline=i===activeIndex?'3px solid #1769ff':'');
  }
  function slotStyle(b,active,add){b.style.cssText='min-height:82px;border:2px solid '+(active?'#1769ff':add?'#c8d1dc':'#e3e8ef')+';border-radius:8px;background:'+(add?'#fbfcfe':'#fff')+';padding:3px;cursor:pointer;aspect-ratio:16/10;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;gap:5px;flex-direction:column;color:#667085'}
  function ensureSlot(){const s=slider();if(!s)return;while(s.images.length<=activeIndex)s.images.push({fit:'cover',pos:'center',src:'',sub:'PREMIUM IPHONE REPAIR',desc:'REPAIR TODAY · A BETTER TOMORROW',title:'APPLE SEED'})}
  function pickFile(){const f=q('file');if(f){f.value='';f.click()}}
  async function handleFile(file){
    if(!file)return;ensureSlot();
    try{
      if(typeof upload!=='function')throw new Error('Bộ upload Builder chưa sẵn sàng.');
      status.textContent='Đang tải ảnh lên…';const url=await upload(file);const s=slider();
      s.images[activeIndex]=Object.assign(s.images[activeIndex]||{},{src:url,fit:s.images[activeIndex]?.fit||'cover',pos:s.images[activeIndex]?.pos||'center',title:s.images[activeIndex]?.title||'APPLE SEED',sub:s.images[activeIndex]?.sub||'PREMIUM IPHONE REPAIR',desc:s.images[activeIndex]?.desc||'REPAIR TODAY · A BETTER TOMORROW'});
      if(typeof saveDraft==='function')saveDraft();render();if(typeof toast==='function')toast('🖼️ Đã thêm / thay ảnh Slider số '+(activeIndex+1));
    }catch(e){if(typeof toast==='function')toast('Upload lỗi: '+(e?.message||e))}
  }
  function bindFile(){if(fileBound)return;const f=q('file');if(!f)return;fileBound=true;f.addEventListener('change',()=>{const file=f.files?.[0];if(file)handleFile(file)})}
  function deleteActive(){
    const s=slider();if(!s||!s.images.length)return;if(!s.images[activeIndex]?.src){status.textContent='Khung này đã trống';return}
    if(!confirm('Xóa ảnh Slider số '+(activeIndex+1)+'? Khung sẽ được giữ lại để bấm thêm ảnh mới.'))return;
    if(typeof checkpoint==='function')checkpoint();s.images[activeIndex]=Object.assign({},s.images[activeIndex],{src:''});if(typeof saveDraft==='function')saveDraft();render();if(typeof toast==='function')toast('🗑 Đã xóa ảnh · khung trống vẫn được giữ lại');
  }
  function applyInterval(){
    const s=slider();if(!s)return;const n=Math.max(1,Math.min(120,Number(intervalInput?.value)||5));
    if(typeof checkpoint==='function')checkpoint();s.interval=n;s.autoplay=true;s.showDots=true;s.showArrows=true;s.pauseOnHover=true;if(typeof saveDraft==='function')saveDraft();render();if(typeof toast==='function')toast('⏱️ Đã đặt thời gian chuyển ảnh: '+n+' giây');
  }
  function render(){
    if(!grid)return;const s=slider();grid.innerHTML='';
    if(s?.images.length){
      s.images.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.title=item?.src?'Ảnh Slider '+(i+1):'Khung trống — bấm để thêm ảnh';slotStyle(b,i===activeIndex,false);if(item?.src){const im=document.createElement('img');im.src=item.src;im.style.cssText='width:100%;height:100%;object-fit:cover;display:block';b.appendChild(im)}else b.innerHTML='<span style="font-size:20px">＋</span><span style="font:800 10px system-ui;line-height:1.3">KHUNG TRỐNG<br>Bấm để thêm ảnh</span>';const n=document.createElement('span');n.textContent=String(i+1);n.style.cssText='position:absolute;left:4px;top:4px;background:#17202a;color:#fff;border-radius:5px;padding:2px 5px;font:800 9px system-ui';b.appendChild(n);b.onclick=()=>{activeIndex=i;render();pickFile()};grid.appendChild(b)})
    }
    const add=document.createElement('button');add.type='button';add.title='Thêm một ảnh Slider mới';slotStyle(add,false,true);add.innerHTML='<span style="font-size:20px">＋</span><span style="font:800 10px system-ui">Thêm ảnh mới</span>';add.onclick=()=>{activeIndex=s?.images.length||0;ensureSlot();pickFile()};grid.appendChild(add);
    const sec=s?.interval||5;if(intervalInput)intervalInput.value=String(sec);if(status)status.textContent=(s?s.images.filter(x=>x?.src).length:0)+' ảnh · '+(s?.images.length||0)+' khung · chuyển '+sec+' giây';if(q('asSliderDelete'))q('asSliderDelete').disabled=!s||!s.images.some(x=>x?.src);renderPreview();
  }
  function build(){
    if(panel)return;const right=document.querySelector('.right');if(!right)return;panel=document.createElement('div');panel.id='appleSeedSliderPanel';panel.className='panel';
    panel.innerHTML='<h3>🎞 Slider — Tất cả ảnh</h3><div id="asSliderGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:300px;overflow:auto;padding:2px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px"><button class="btn danger" id="asSliderDelete">🗑 Xóa ảnh</button><button class="btn" id="asSliderRefresh">↻ Làm mới</button></div><div style="display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;margin-top:8px"><label style="font:800 10px system-ui;color:#475467">⏱ Chuyển ảnh (giây)</label><input id="asSliderInterval" type="number" min="1" max="120" step="1" value="5" style="width:78px;border:1px solid #d5dce5;border-radius:8px;padding:7px 8px"></div><button class="btn primary" id="asSliderApplyInterval" style="width:100%;margin-top:6px">⏱️ Lưu số giây chuyển ảnh</button><div id="asSliderStatus" class="muted" style="margin-top:6px"></div>';
    right.insertBefore(panel,right.firstChild);grid=q('asSliderGrid');status=q('asSliderStatus');intervalInput=q('asSliderInterval');q('asSliderDelete').onclick=deleteActive;q('asSliderRefresh').onclick=render;q('asSliderApplyInterval').onclick=applyInterval;bindFile();render();
  }
  function boot(){build();bindFile();const f=frame();if(f)f.addEventListener('load',()=>setTimeout(render,400));setInterval(()=>{bindFile();renderPreview()},1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
</script>
