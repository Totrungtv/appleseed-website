/* APPLE SEED AI BOARD — FAST RESULT + TYPEWRITER V3 — NO AUTO SCROLL */
(()=>{
  'use strict';
  const result=document.getElementById('result');
  if(!result)return;
  const speed=7;
  let typing=false;
  let target='';

  function animate(){
    const pre=result.querySelector('pre');
    if(!pre||typing)return;
    const text=pre.textContent||'';
    if(!text.trim()||text===target)return;

    target=text;
    typing=true;
    pre.dataset.asTyping='1';
    pre.textContent='';
    let i=0;

    const tick=()=>{
      if(i>=target.length){
        pre.textContent=target;
        pre.dataset.asTyping='';
        typing=false;
        return;
      }
      i=Math.min(target.length,i+Math.max(4,Math.ceil(target.length/220)));
      pre.textContent=target.slice(0,i);
      setTimeout(tick,speed);
    };
    tick();
  }

  new MutationObserver(()=>{
    if(!typing)setTimeout(animate,0);
  }).observe(result,{subtree:true,childList:true,characterData:true});

  setTimeout(animate,100);
})();
