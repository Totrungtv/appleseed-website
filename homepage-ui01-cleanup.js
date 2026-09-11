(function(){
'use strict';
if(location.pathname!=='/'&&!/\/index\.html$/i.test(location.pathname))return;
function hide(el){if(!el||el.id==='appleSeedUI01')return;el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true')}
function clean(){
 var shell=document.getElementById('appleSeedUI01');
 if(!shell)return false;
 /* Remove legacy visual chrome that sits before the new UI01 shell. */
 Array.from(document.body.children).forEach(function(el){
   if(el===shell||el.tagName==='SCRIPT'||el.tagName==='STYLE'||el.tagName==='LINK')return;
   if(el.id==='apple-seed-premium-home'||el.id==='homeRenderer'||el.classList.contains('site-header'))hide(el);
 });
 /* The old dynamic homepage renderer must not leak its service cards below UI01. */
 hide(document.getElementById('homeRenderer'));
 /* Hide legacy floating AI presence/buttons; UI01 keeps the dedicated AI Assistant card. */
 ['apple-seed-ai-presence','chatBtn','chatBox'].forEach(function(id){hide(document.getElementById(id))});
 /* Hide any legacy AI Board floating badge by its visible label without touching UI01. */
 Array.from(document.body.querySelectorAll('*')).forEach(function(el){
   if(el.closest('#appleSeedUI01'))return;
   var t=(el.textContent||'').trim().replace(/\s+/g,' ').toUpperCase();
   if(t==='AI BOARD' || t.indexOf('AI BOARD PANIC SCHEMATIC DIAGNOSTIC')!==-1){
     var p=el;
     for(var i=0;i<4&&p&&p!==document.body;i++,p=p.parentElement){
       var cs=getComputedStyle(p);
       if(cs.position==='fixed'||cs.position==='absolute'){hide(p);break}
     }
   }
 });
 return true;
}
function boot(){
 clean();
 var n=0;var timer=setInterval(function(){clean();if(++n>30)clearInterval(timer)},250);
 var mo=new MutationObserver(function(){clean()});
 mo.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
