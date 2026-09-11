/* Apple Seed Hero Slider V7 — persistent premium text on every banner + safe swipe. */
(function(){
  'use strict';
  var file=location.pathname.split('/').pop().toLowerCase();
  var isBuilder=file==='site-builder.html';
  var isPreview=false;
  try{var q=new URLSearchParams(location.search);isPreview=q.get('appleSeedBuilderPreview')==='1'||q.get('builderCanvas')==='1'}catch(_){ }
  if(isBuilder||isPreview)return;

  var timer=0,started=false;
  function cfg(){
    try{return window.supabaseClient.from('site_builder_versions').select('version_no,config').eq('site_key','default').eq('status','published').order('version_no',{ascending:false}).limit(1).maybeSingle()}
    catch(e){return Promise.resolve({data:null,error:e})}
  }
  function normalize(c){
    if(!c)return null;
    var images=Array.isArray(c.images)?c.images.filter(Boolean).map(function(x){return typeof x==='string'?{src:x}:x}).filter(function(x){return x&&x.src}):[];
    if(!images.length)return null;
    return {images:images,interval:Math.max(2,Math.min(15,Number(c.interval)||5)),showArrows:c.showArrows!==false,showDots:c.showDots!==false,autoplay:c.autoplay!==false,pauseOnHover:c.pauseOnHover!==false}
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function css(){
    if(document.getElementById('apple-seed-slider-v7-css'))return;
    var s=document.createElement('style');s.id='apple-seed-slider-v7-css';
    s.textContent=''
      +'.as3-stage.apple-seed-slider-active{position:relative!important;overflow:hidden!important;perspective:none!important;background-image:none!important;background-color:transparent!important;}'
      +'.as3-stage.apple-seed-slider-active>.as3-phone,.as3-stage.apple-seed-slider-active>.as3-benefits,.as3-stage.apple-seed-slider-active>.as3-discover{display:none!important;}'
      +'#apple-seed-premium-home.apple-seed-slider-owner{background-image:none!important;}'
      +'#apple-seed-premium-home.apple-seed-slider-owner .as3-store{display:none!important;}'
      +'.apple-seed-hero-slider{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;overflow:hidden!important;border-radius:20px!important;background:#f4f5f7!important;z-index:100!important;touch-action:pan-y!important;user-select:none!important;}'
      +'.apple-seed-hero-track{position:absolute;inset:0;display:flex;width:100%;height:100%;transition:transform .65s cubic-bezier(.22,.61,.36,1);will-change:transform;}'
      +'.apple-seed-hero-slide{position:relative;flex:0 0 100%;width:100%;height:100%;overflow:hidden;background:#f4f5f7;}'
      +'.apple-seed-hero-slide img{display:block;width:100%;height:100%;pointer-events:none;}'
      +'.apple-seed-hero-slide:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.12),transparent 62%,rgba(0,0,0,.06));pointer-events:none;}'
      +'.apple-seed-hero-caption{position:absolute;left:7%;bottom:8%;max-width:min(650px,72%);padding:14px 22px 13px;border-left:3px solid #d5a958;border-radius:0 16px 16px 0;background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.08));color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.9);z-index:2;pointer-events:none;}'
      +'.apple-seed-hero-caption .k{font-size:10px;letter-spacing:3px;font-weight:900;opacity:.9}.apple-seed-hero-caption h2{font-size:clamp(25px,3.5vw,52px);line-height:1.02;margin:5px 0 6px;font-weight:950;letter-spacing:-1.2px}.apple-seed-hero-caption p{font-size:12px;line-height:1.45;margin:0 0 8px;opacity:.94;letter-spacing:2px;font-weight:700}.apple-seed-hero-caption .features{display:flex;gap:18px;flex-wrap:wrap;font-size:9px;letter-spacing:1.2px;font-weight:800;opacity:.95}.apple-seed-hero-caption .features span{white-space:nowrap}.apple-seed-hero-caption .features span:before{content:'◆';margin-right:6px;color:#fff;font-size:7px;}'
      +'.apple-seed-hero-arrow{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border:1px solid rgba(255,255,255,.72);border-radius:50%;background:rgba(20,25,32,.38);backdrop-filter:blur(8px);color:#fff;font-size:38px;line-height:1;display:grid;place-items:center;cursor:pointer;z-index:3;}'
      +'.apple-seed-hero-arrow.prev{left:16px}.apple-seed-hero-arrow.next{right:16px}'
      +'.apple-seed-hero-dots{position:absolute;left:50%;bottom:15px;transform:translateX(-50%);display:flex;gap:8px;z-index:4;padding:6px 10px;border-radius:999px;background:rgba(0,0,0,.22);backdrop-filter:blur(8px);}'
      +'.apple-seed-hero-dot{width:8px;height:8px;padding:0;border:1px solid rgba(255,255,255,.85);border-radius:50%;background:rgba(255,255,255,.35);cursor:pointer;}.apple-seed-hero-dot.active{width:22px;border-radius:999px;background:#fff;}'
      +'@media(max-width:760px){.as3-stage.apple-seed-slider-active{position:relative!important;width:calc(100vw - 48px)!important;max-width:calc(100vw - 48px)!important;min-width:0!important;height:auto!important;min-height:0!important;aspect-ratio:16/9!important;margin:18px auto 24px!important;padding:0!important;transform:none!important;}.apple-seed-hero-slider{border-radius:16px!important}.apple-seed-hero-caption{left:5%;bottom:10%;max-width:80%;padding:9px 12px 9px;border-left-width:2px;border-radius:0 12px 12px 0}.apple-seed-hero-caption .k{font-size:6px;letter-spacing:1.8px}.apple-seed-hero-caption h2{font-size:24px;margin:3px 0 4px;letter-spacing:-.5px}.apple-seed-hero-caption p{font-size:7px;letter-spacing:1.2px;margin-bottom:5px}.apple-seed-hero-caption .features{gap:8px;font-size:6px;letter-spacing:.7px}.apple-seed-hero-caption .features span:before{margin-right:3px;font-size:5px}.apple-seed-hero-arrow{width:36px;height:36px;font-size:29px}.apple-seed-hero-arrow.prev{left:8px}.apple-seed-hero-arrow.next{right:8px}.apple-seed-hero-dots{bottom:8px;gap:6px;padding:4px 7px}.apple-seed-hero-dot{width:6px;height:6px}.apple-seed-hero-dot.active{width:18px}}'
      +'@media(prefers-reduced-motion:reduce){.apple-seed-hero-track{transition:none!important;}}';
    document.head.appendChild(s);
  }
  function build(stage,c){
    var hero=document.getElementById('apple-seed-premium-home');
    if(!stage||!c||!c.images.length)return false;
    css();
    hero&&hero.classList.add('apple-seed-slider-owner');
    stage.classList.add('apple-seed-slider-active');
    stage.style.setProperty('background-image','none','important');
    stage.style.setProperty('background-color','transparent','important');
    stage.querySelectorAll(':scope > .as3-phone,:scope > .as3-benefits,:scope > .as3-discover').forEach(function(el){el.style.setProperty('display','none','important')});
    var store=hero&&hero.querySelector('.as3-store');if(store)store.style.setProperty('display','none','important');
    var old=stage.querySelector(':scope > .apple-seed-hero-slider');if(old)old.remove();
    stage.style.setProperty('visibility','hidden','important');
    var slider=document.createElement('div');slider.className='apple-seed-hero-slider';slider.setAttribute('aria-label','Banner Apple Seed');slider.setAttribute('tabindex','0');
    var track=document.createElement('div');track.className='apple-seed-hero-track';slider.appendChild(track);
    var dots=document.createElement('div');dots.className='apple-seed-hero-dots';var current=0,paused=false,startX=0;
    c.images.forEach(function(raw,i){
      var sl=typeof raw==='string'?{src:raw}:raw,slide=document.createElement('div');slide.className='apple-seed-hero-slide';slide.style.background=sl.theme==='dark'?'#08090b':'#f4f5f7';
      var img=document.createElement('img');img.src=sl.src;img.alt='Apple Seed — Premium iPhone Repair';img.loading=i===0?'eager':'lazy';img.decoding='async';img.style.objectFit=sl.fit||'cover';img.style.objectPosition=sl.pos||'center';if(sl.fit==='contain')img.style.padding='4%';
      if(i===0){img.fetchPriority='high';img.addEventListener('load',function(){stage.style.removeProperty('visibility');stage.setAttribute('data-apple-seed-slider-ready','1')},{once:true})}
      slide.appendChild(img);

      /* Luôn hiện bộ chữ thương hiệu trên MỌI banner, không phụ thuộc metadata của ảnh. */
      var cap=document.createElement('div');cap.className='apple-seed-hero-caption';
      var title=sl.title||'APPLE SEED';
      var sub='PREMIUM IPHONE REPAIR';
      var desc='REPAIR TODAY · A BETTER TOMORROW';
      cap.innerHTML='<div class="k">'+esc(sub)+'</div><h2>'+esc(title)+'</h2><p>'+esc(desc)+'</p><div class="features"><span>DIAGNOSTIC</span><span>MAINBOARD</span><span>FACE ID</span><span>PREMIUM CARE</span></div>';
      slide.appendChild(cap);

      track.appendChild(slide);
      var d=document.createElement('button');d.className='apple-seed-hero-dot'+(i===0?' active':'');d.type='button';d.setAttribute('aria-label','Slide '+(i+1));d.setAttribute('aria-current',i===0?'true':'false');d.onclick=function(){current=i;render();restart()};dots.appendChild(d);
    });
    function render(){current=(current+c.images.length)%c.images.length;track.style.transform='translate3d('+(-current*100)+'%,0,0)';Array.prototype.forEach.call(dots.children,function(d,i){d.classList.toggle('active',i===current);d.setAttribute('aria-current',i===current?'true':'false')})}
    function restart(){clearInterval(timer);if(c.autoplay&&c.images.length>1&&!paused&&!document.hidden)timer=setInterval(function(){current++;render()},c.interval*1000)}
    if(c.showArrows&&c.images.length>1){var p=document.createElement('button'),n=document.createElement('button');p.className='apple-seed-hero-arrow prev';n.className='apple-seed-hero-arrow next';p.type=n.type='button';p.textContent='‹';n.textContent='›';p.setAttribute('aria-label','Slide trước');n.setAttribute('aria-label','Slide tiếp');p.onclick=function(e){e.stopPropagation();current--;render();restart()};n.onclick=function(e){e.stopPropagation();current++;render();restart()};slider.append(p,n)}
    if(c.showDots&&c.images.length>1)slider.appendChild(dots);
    slider.prepend(track);stage.prepend(slider);
    if(c.pauseOnHover){slider.onmouseenter=function(){paused=true;restart()};slider.onmouseleave=function(){paused=false;restart()}}
    slider.onpointerdown=function(e){if(e.target.closest&&e.target.closest('button')){startX=null;return}startX=e.clientX};
    slider.onpointerup=function(e){if(startX===null||startX===undefined)return;var dx=e.clientX-startX;startX=null;if(Math.abs(dx)>45){current+=dx<0?1:-1;render();restart()}};
    document.addEventListener('visibilitychange',restart);render();restart();
    var first=slider.querySelector('.apple-seed-hero-slide img');if(first&&first.complete)stage.style.removeProperty('visibility');
    return true;
  }
  function run(){
    cfg().then(function(r){var items=r.data&&r.data.config&&r.data.config.items||{},found=null;Object.keys(items).some(function(k){var s=normalize(items[k]&&items[k].slider);if(s){found=s;return true}return false});if(!found)return;var stage=document.querySelector('#apple-seed-premium-home .as3-stage');if(stage)build(stage,found)}).catch(function(){})
  }
  function boot(){if(started)return;started=true;run();setTimeout(run,250);setTimeout(run,900);setTimeout(run,1800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
