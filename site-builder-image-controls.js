/* APPLE SEED IMAGE CONTROLS V5
   Persist Builder image replacements into the actual draft before Publish,
   and restore them against the iframe document after reload.
*/
(function(){
  'use strict';
  var READY='__appleSeedImageControlsV5';
  var JOURNAL='appleSeedVisualBuilderImageOverridesV3';
  function frame(){return document.querySelector('.frame iframe')||document.querySelector('iframe')}
  function getDoc(){var f=frame();return f&&f.contentDocument||null}
  function findPanel(){return document.getElementById('imagePanel')}
  function findFileInput(panel){return panel&&panel.querySelector('input[type="file"]')}
  function readJournal(){try{var x=JSON.parse(localStorage.getItem(JOURNAL)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
  function writeJournal(x){try{localStorage.setItem(JOURNAL,JSON.stringify(x||[]))}catch(_){} }
  function currentVersion(){try{return localStorage.getItem('appleSeedVisualBuilderPublishedVersionV3')||''}catch(_){return''}}
  function currentSelector(){try{return typeof selector==='string'?selector:(window.selector||'')}catch(_){return''}}
  function currentDraft(){try{return typeof draft!=='undefined'?draft:(window.draft||null)}catch(_){return window.draft||null}}
  function currentSelected(){try{return typeof selected!=='undefined'?selected:(window.selected||null)}catch(_){return window.selected||null}}
  function imageTarget(el){var phone=typeof as4ImagePhone==='function'?as4ImagePhone(el):null;return phone||el}
  function identity(el){
    var target=imageTarget(el),img=target&&target.tagName==='IMG'?target:target&&target.querySelector&&target.querySelector('img');
    return {selector:currentSelector(),id:target&&target.id||'',alt:img&&img.getAttribute('alt')||el&&el.getAttribute&&el.getAttribute('alt')||'',classes:Array.prototype.slice.call((target&&target.classList)||[]).slice(0,8),tag:target&&target.tagName||el&&el.tagName||'',baseVersion:currentVersion()}
  }
  function findTarget(rec){
    var d=getDoc();if(!d)return null;
    try{if(rec.selector){var x=d.querySelector(rec.selector);if(x)return x}}catch(_){}
    var all=Array.prototype.slice.call(d.querySelectorAll('img,.as3-phone,.as3-screen'));
    if(rec.id){var byId=all.find(function(x){return x.id===rec.id});if(byId)return byId}
    if(rec.alt){var byAlt=all.find(function(x){return (x.getAttribute&&x.getAttribute('alt')===rec.alt)||(x.querySelector&&x.querySelector('img')&&x.querySelector('img').getAttribute('alt')===rec.alt)});if(byAlt)return byAlt}
    if(rec.classes&&rec.classes.length){var byClass=all.find(function(x){return rec.classes.every(function(c){return x.classList&&x.classList.contains(c)})});if(byClass)return byClass}
    return null
  }
  function applyJournal(){
    var list=readJournal();if(!list.length)return;
    var version=currentVersion();
    var usable=list.filter(function(r){return !r.baseVersion||!version||r.baseVersion===version});
    if(!usable.length)return;
    usable.forEach(function(r){
      var el=findTarget(r);if(!el)return;
      var phone=typeof as4ImagePhone==='function'?as4ImagePhone(el):null;
      var blank='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
      if(r.removed){
        if(phone&&typeof applyHeroPhoneImage==='function')applyHeroPhoneImage(phone,blank);
        else if(el.tagName==='IMG')el.src=blank;
        else if(el.style)el.style.backgroundImage='url("'+blank+'")';
      }else if(r.url){
        if(phone&&typeof applyHeroPhoneImage==='function')applyHeroPhoneImage(phone,r.url);
        else if(el.tagName==='IMG')el.src=r.url;
        else if(el.style)el.style.backgroundImage='url("'+r.url.replace(/"/g,'%22')+'")';
      }
    });
    try{if(typeof refreshInspector==='function')refreshInspector()}catch(_){}
  }
  function readDomImage(el){
    var target=imageTarget(el),img=target&&target.tagName==='IMG'?target:target&&target.querySelector&&target.querySelector('img');
    if(img&&img.currentSrc)return img.currentSrc;
    if(img&&img.src)return img.src;
    if(target&&target.style&&target.style.backgroundImage){var m=target.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);if(m)return m[1]}
    return ''
  }
  function journalCurrent(force){
    var el=currentSelected();if(!el)return;
    if(!force&&!window.__APPLE_SEED_IMAGE_EDIT_ACTIVE__)return;
    var sel=currentSelector(),d=currentDraft();d=d||{};d.items=d.items||{};
    var item=d.items[sel]||{},rec=identity(el);
    rec.removed=!!item.imageRemoved;
    rec.url=rec.removed?'':((item.src)||(item.bgImage)||readDomImage(el)||'');
    if(rec.url){item.src=rec.url;delete item.bgImage;item.imageRemoved=false}
    if(rec.removed){item.imageRemoved=true;item.src='';item.bgImage=''}
    d.items[sel]=item;
    try{window.draft=d}catch(_){}
    try{localStorage.setItem('appleSeedVisualBuilderDraftV3',JSON.stringify(d))}catch(_){}
    var list=readJournal(),i=list.findIndex(function(x){return x.selector===rec.selector});
    if(i>=0)list[i]=rec;else list.push(rec);
    writeJournal(list.slice(-100));
    window.__APPLE_SEED_IMAGE_EDIT_ACTIVE__=false
  }
  function markEdit(){window.__APPLE_SEED_IMAGE_EDIT_ACTIVE__=true}
  function beforePublish(){try{journalCurrent(true)}catch(_){} try{if(typeof saveDraft==='function')saveDraft()}catch(_){} try{journalCurrent(true)}catch(_){} }
  function ensure(){
    if(window[READY])return;window[READY]=true;
    var p=findPanel();
    if(p){var oldDelete=document.getElementById('deleteImage');if(oldDelete){oldDelete.hidden=false;oldDelete.style.display='block';oldDelete.textContent='🗑️ Xóa ảnh đang chọn';oldDelete.classList.add('btn','danger')}var f=findFileInput(p);if(f)f.title='Chọn ảnh mới để thay ảnh đang chọn'}
    if(typeof saveDraft==='function'&&!saveDraft.__appleSeedImageJournal){var original=saveDraft;var wrapped=function(){var r=original.apply(this,arguments);try{journalCurrent()}catch(_){}return r};wrapped.__appleSeedImageJournal=true;saveDraft=wrapped;window.saveDraft=wrapped}
    if(typeof loadPublished==='function'&&!loadPublished.__appleSeedImageJournal){var originalLoad=loadPublished;var wrappedLoad=function(){var result=originalLoad.apply(this,arguments);if(result&&typeof result.then==='function')return result.then(function(v){setTimeout(applyJournal,60);return v});setTimeout(applyJournal,60);return result};wrappedLoad.__appleSeedImageJournal=true;loadPublished=wrappedLoad;window.loadPublished=wrappedLoad}
    var apply=document.getElementById('applyImage');if(apply&&!apply.__appleSeedImageJournal){apply.addEventListener('click',markEdit,true);apply.__appleSeedImageJournal=true}
    var pick=document.getElementById('pick');if(pick&&!pick.__appleSeedImageJournal){pick.addEventListener('click',markEdit,true);pick.__appleSeedImageJournal=true}
    var del=document.getElementById('deleteImage');if(del&&!del.__appleSeedImageJournal){del.addEventListener('click',markEdit,true);del.__appleSeedImageJournal=true}
    document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('button'):null;if(!b)return;var t=(b.textContent||'').trim();if(/xuất bản|publish/i.test(t))beforePublish()},true);
    var preview=document.getElementById('preview');if(preview&&!preview.__appleSeedImageJournal){preview.addEventListener('load',function(){setTimeout(applyJournal,200);setTimeout(applyJournal,900)},false);preview.__appleSeedImageJournal=true}
    setTimeout(applyJournal,500)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure()
})();
