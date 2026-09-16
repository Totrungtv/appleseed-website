/* APPLE SEED AI BOARD — FAST RESULT + TYPEWRITER V2 — TIMEOUT SAFE */
(()=>{
  'use strict';
  const result=document.getElementById('result');
  if(!result)return;
  const speed=5;
  let typing=false;
  let target='';

  function animate(){
    const pre=result.querySelector('pre');
    if(!pre || typing)return;
    const text=pre.textContent||'';
    if(!text.trim() || text===target)return;
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
      i=Math.min(target.length,i+Math.max(4,Math.ceil(target.length/240)));
      pre.textContent=target.slice(0,i);
      if(result.scrollHeight>result.clientHeight)result.scrollTop=result.scrollHeight;
      setTimeout(tick,speed);
    };
    tick();
  }

  new MutationObserver(()=>{if(!typing)setTimeout(animate,0)})
    .observe(result,{subtree:true,childList:true,characterData:true});
  setTimeout(animate,100);

  // Safety net: never leave the AI button spinning forever if the network call hangs.
  const originalInvoke=window.supabaseClient?.functions?.invoke?.bind(window.supabaseClient.functions);
  if(originalInvoke && window.supabaseClient.functions.__appleSeedTimeoutPatched!==true){
    window.supabaseClient.functions.invoke=async(name,opts={})=>{
      if(name!=='analyze-schematic')return originalInvoke(name,opts);
      const timeout=36000;
      const timeoutPromise=new Promise((_,reject)=>setTimeout(()=>reject(new Error('AI phản hồi quá lâu (36 giây). Backend đã được đặt timeout an toàn; pa hãy thử lại ảnh nhỏ hơn.')),timeout));
      return Promise.race([originalInvoke(name,opts),timeoutPromise]);
    };
    window.supabaseClient.functions.__appleSeedTimeoutPatched=true;
  }
})();
