/* APPLE SEED AI BOARD — FAST RESULT + TYPEWRITER V2 — TIMEOUT SAFE — LIVE3 */
(()=>{
  'use strict';
  const result=document.getElementById('result');
  if(!result)return;
  const speed=5;
  let typing=false;
  let target='';
  function animate(){
    const pre=result.querySelector('pre');
    if(!pre||typing)return;
    const text=pre.textContent||'';
    if(!text.trim()||text===target)return;
    target=text;typing=true;pre.dataset.asTyping='1';pre.textContent='';let i=0;
    const tick=()=>{if(i>=target.length){pre.textContent=target;pre.dataset.asTyping='';typing=false;return;}i=Math.min(target.length,i+Math.max(4,Math.ceil(target.length/240)));pre.textContent=target.slice(0,i);if(result.scrollHeight>result.clientHeight)result.scrollTop=result.scrollHeight;setTimeout(tick,speed)};
    tick();
  }
  new MutationObserver(()=>{if(!typing)setTimeout(animate,0)}).observe(result,{subtree:true,childList:true,characterData:true});
  setTimeout(animate,100);
  const f=window.supabaseClient?.functions;
  if(f?.invoke&&!f.__appleSeedTimeoutPatched){
    const invoke=f.invoke.bind(f);
    f.invoke=async(name,opts={})=>{
      if(name!=='analyze-schematic')return invoke(name,opts);
      const timeoutPromise=new Promise((_,reject)=>setTimeout(()=>reject(new Error('AI phản hồi quá lâu (36 giây). Pa thử lại ảnh nhỏ hơn.')),36000));
      return Promise.race([invoke(name,opts),timeoutPromise]);
    };
    f.__appleSeedTimeoutPatched=true;
  }
})();
