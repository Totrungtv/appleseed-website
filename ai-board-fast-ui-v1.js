/* APPLE SEED AI BOARD — FAST RESULT + TYPEWRITER V4.1 + COPY */
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

  function animate(){
    const pre=result.querySelector('pre');
    if(!pre||typing)return;
    const text=pre.textContent||'';
    if(!text.trim()||text===target)return;
    target=text;typing=true;pre.dataset.asTyping='1';pre.textContent='';let i=0;
    const tick=()=>{
      if(i>=target.length){pre.textContent=target;pre.dataset.asTyping='';typing=false;ensureCopyButton();return;}
      i=Math.min(target.length,i+Math.max(4,Math.ceil(target.length/220)));
      pre.textContent=target.slice(0,i);setTimeout(tick,speed);
    };tick();
  }

  new MutationObserver(()=>{ensureCopyButton();if(!typing)setTimeout(animate,0);}).observe(result,{subtree:true,childList:true,characterData:true});
  ensureCopyButton();
  setTimeout(animate,100);
})();
