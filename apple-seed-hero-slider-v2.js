/* Apple Seed Hero Slider V2 runtime/editor integration. */
(function(){
  'use strict';
  var isBuilder=location.pathname.split('/').pop().toLowerCase()==='site-builder.html';
  var isPreview=false;
  try{var q=new URLSearchParams(location.search);isPreview=q.get('appleSeedBuilderPreview')==='1'||q.get('builderCanvas')==='1'}catch(_){ }
  if(isBuilder||isPreview)return;
  var timer=0;
  function cfg(){
    try{return window.supabaseClient.from('site_builder_versions').select('version_no,config').eq('site_key','default').eq('status','published').order('version_no',{ascending:false}).limit(1).maybeSingle()}catch(e){return Promise.resolve({data:null,error:e})}
  }
  function normalize(c){
    if(!c)return null;
    var images=Array.isArray(c.images)?c.images.filter(Boolean):[];
    if(!images.length)return null;
    return {images:images,interval:Math.max(2,Number(c.interval)||5),showArrows:c.showArrows!==false,showDots:c.showDots!==false,autoplay:c.autoplay!==false,pauseOnHover:c.pauseOnHover!==false};
  }
  function css(){
    if(document.getElementById('apple-seed-slider-v2-css'))return;
    var s=document.createElement('style');s.id='apple-seed-slider-v2-css';s.textContent='.apple-seed-hero-slider{position:absolute!important;inset:0!important;overflow:hidden!important;border-radius:20px!important;background:#f4f5f7!important;z-index:40!important;touch-action:pan-y!important;user-select:none!important}.apple-seed-hero-track{position:absolute;inset:0;display:flex;transition:transform .55s cubic-bezier(.22,.61,.36,1);will-change:transform}.apple-seed-hero-slide{position:relative;flex:0 0 100%;width:100%;height:100%;overflow:hidden;background:#f4f5f7}.apple-seed-hero-slide img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none}.apple-seed-hero-arrow{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border:1px solid rgba(255,255,255,.72);border-radius:50%;background:rgba(20,25,32,.38);backdrop-filter:blur(8px);color:#fff;font-size:40px;line-height:1;display:grid;place-items:center;cursor:pointer;z-index:3}.apple-seed-hero-arrow.prev{left:18px}.apple-seed-hero-arrow.next{right:18px}.apple-seed-hero-dots{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:9px;z-index:4;padding:7px 11px;border-radius:999px;background:rgba(0,0,0,.24);backdrop-filter:blur(8px)}.apple-seed-hero-dot{width:9px;height:9px;padding:0;border:1px solid rgba(255,255,255,.85);border-radius:50%;background:rgba(255,255,255,.35);cursor:pointer}.apple-seed-hero-dot.active{width:24px;border-radius:999px;background:#fff}@media(max-width:760px){.apple-seed-hero-slider{border-radius:14px!important}.apple-seed-hero-arrow{width:38px;height:38px;font-size:31px}.apple-seed-hero-arrow.prev{left:9px}.apple-seed-hero-arrow.next{right:9px}.apple-seed-hero-dots{bottom:10px;gap:7px;padding:5px 8px}.apple-seed-hero-dot{width:7px;height:7px}.apple-seed-hero-dot.active{width:20px}}';document.head.appendChild(s)
  }
  function build(stage,c){
    var old=stage.querySelector('.apple-seed-hero-slider');if(old)old.remove();
    var slider=document.createElement('div');slider.className='apple-seed-hero-slider';slider.setAttribute('aria-label','Banner Apple Seed');
    var track=document.createElement('div');track.className='apple-seed-hero-track';var dots=document.createElement('div');dots.className='apple-seed-hero-dots';
    var current=0,paused=false,startX=0;
    c.images.forEach(function(src,i){var slide=document.createElement('div');slide.className='apple-seed-hero-slide';var img=document.createElement('img');img.src=src;img.alt='Apple Seed banner '+(i+1);img.loading=i?'lazy':'eager';slide.appendChild(img);track.appendChild(slide);var d=document.createElement('button');d.className='apple-seed-hero-dot'+(i===0?' active':'');d.type='button';d.setAttribute('aria-label','Ảnh '+(i+1));d.onclick=function(){current=i;render();restart()};dots.appendChild(d)});
    function render(){current=(current+c.images.length)%c.images.length;track.style.transform='translate3d('+(-current*100)+'%,0,0)';Array.prototype.forEach.call(dots.children,function(d,i){d.classList.toggle('active',i===current)})}
    function restart(){clearInterval(timer);if(c.autoplay&&c.images.length>1&&!paused&&!document.hidden)timer=setInterval(function(){current++;render()},c.interval*1000)}
    if(c.showArrows&&c.images.length>1){var p=document.createElement('button');p.className='apple-seed-hero-arrow prev';p.type='button';p.textContent='‹';p.onclick=function(){current--;render();restart()};var n=document.createElement('button');n.className='apple-seed-hero-arrow next';n.type='button';n.textContent='›';n.onclick=function(){current++;render();restart()};slider.appendChild(p);slider.appendChild(n)}
    if(c.showDots&&c.images.length>1)slider.appendChild(dots);
    slider.prepend(track);stage.prepend(slider);
    if(c.pauseOnHover){slider.onmouseenter=function(){paused=true;restart()};slider.onmouseleave=function(){paused=false;restart()}}
    slider.onpointerdown=function(e){startX=e.clientX};slider.onpointerup=function(e){var dx=e.clientX-startX;if(Math.abs(dx)>45){current+=dx<0?1:-1;render();restart()}};
    render();restart();
  }
  function run(){cfg().then(function(r){var items=r.data&&r.data.config&&r.data.config.items||{};var found=null;Object.keys(items).some(function(k){var s=normalize(items[k]&&items[k].slider);if(s){found=s;return true}return false});if(!found)return;css();var stage=document.querySelector('#apple-seed-premium-home .as3-stage');if(stage)build(stage,found)}).catch(function(){})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
