/* APPLE SEED HOME THEMES V1 */
(function(){
  'use strict';
  var KEY='APPLE_SEED_HOME_THEME_DRAFT_V1';
  var FALLBACK='apple-pure';
  function valid(id){return !!document.querySelector('html[data-theme-id="'+CSS.escape(id)+'"]') || !!id;}
  function apply(id){
    if(!id||!valid(id)) id=FALLBACK;
    document.documentElement.setAttribute('data-apple-seed-theme',id);
    document.documentElement.dataset.appleSeedTheme=id;
  }
  function draft(){try{return localStorage.getItem(KEY)||''}catch(e){return ''}}
  function boot(){apply(draft()||document.documentElement.getAttribute('data-apple-seed-theme')||FALLBACK)}
  boot();
  window.AppleSeedHomeThemes={apply:apply,get:function(){return document.documentElement.dataset.appleSeedTheme||FALLBACK},setDraft:function(id){apply(id);try{localStorage.setItem(KEY,id)}catch(e){};window.parent&&window.parent!==window&&window.parent.postMessage({type:'APPLE_SEED_HOME_THEME_V1',theme:id},'*')}};
  window.addEventListener('message',function(e){var d=e&&e.data||{};if(d.type==='APPLE_SEED_HOME_THEME_V1'&&d.theme){apply(d.theme);try{localStorage.setItem(KEY,d.theme)}catch(_){}}});
})();
