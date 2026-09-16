/* APPLE SEED AI BOARD — FAST RESULT + TYPEWRITER V1 — LIVE */
(()=>{
  'use strict';
  const result=document.getElementById('result');
  if(!result) return;
  const state={running:false,queued:null};
  const speed=5;
  function typePre(pre,text){
    if(!pre)return;
    if(state.running){state.queued={pre,text};return;}
    state.running=true; pre.textContent=''; let i=0;
    const tick=()=>{
      if(i>=text.length){state.running=false;if(state.queued){const q=state.queued;state.queued=null;typePre(q.pre,q.text);}return;}
      i=Math.min(text.length,i+Math.max(3,Math.ceil(text.length/260)));
      pre.textContent=text.slice(0,i);
      if(result.scrollHeight>result.clientHeight)result.scrollTop=result.scrollHeight;
      setTimeout(tick,speed);
    }; tick();
  }
  function animate(){const pre=result.querySelector('pre');if(!pre)return;const text=pre.textContent||'';if(!text.trim()||pre.dataset.asTyped===text)return;pre.dataset.asTyped=text;typePre(pre,text);}
  new MutationObserver(()=>setTimeout(animate,0)).observe(result,{subtree:true,childList:true,characterData:true});
  setTimeout(animate,100);
})();
