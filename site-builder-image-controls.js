/* APPLE SEED IMAGE CONTROLS V3
   Keeps image replacement selected in the Builder and restores that unsaved image
   after the iframe/LIVE configuration finishes loading. Other draft data is untouched.
*/
(function(){
  'use strict';
  var READY='__appleSeedImageControlsV3';
  var JOURNAL='appleSeedVisualBuilderImageOverridesV2';
  function findPanel(){return document.getElementById('imagePanel');}
  function findFileInput(panel){return panel&&panel.querySelector('input[type="file"]');}
  function readJournal(){try{var x=JSON.parse(localStorage.getItem(JOURNAL)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
  function writeJournal(x){try{localStorage.setItem(JOURNAL,JSON.stringify(x||[]))}catch(_){}
  }
  function currentVersion(){try{return localStorage.getItem('appleSeedVisualBuilderPublishedVersionV3')||''}catch(_){return''}}
  function imageTarget(el){var phone=typeof as4ImagePhone==='function'?as4ImagePhone(el):null;return phone||el;}
  function identity(el){
    var target=imageTarget(el),img=target&&target.tagName==='IMG'?target:target&&target.querySelector&&target.querySelector('img');
    return {selector:typeof selector==='string'?selector:'',id:target&&target.id||'',alt:img&&img.getAttribute('alt')||el&&el.getAttribute&&el.getAttribute('alt')||'',classes:Array.prototype.slice.call((target&&target.classList)||[]).slice(0,8),tag:target&&target.tagName||el&&el.tagName||'',baseVersion:currentVersion()};
  }
  function findTarget(rec){
    if(!doc)return null;
    try{if(rec.selector){var x=doc.querySelector(rec.selector);if(x)return x}}catch(_){}
    var all=Array.prototype.slice.call(doc.querySelectorAll('img,.as3-phone,.as3-screen'));
    if(rec.id){var byId=all.find(function(x){return x.id===rec.id});if(byId)return byId}
    if(rec.alt){var byAlt=all.find(function(x){return (x.getAttribute&&x.getAttribute('alt')===rec.alt)||(x.querySelector&&x.querySelector('img')&&x.querySelector('img').getAttribute('alt')===rec.alt)});if(byAlt)return byAlt}
    if(rec.classes&&rec.classes.length){var byClass=all.find(function(x){return rec.classes.every(function(c){return x.classList&&x.classList.contains(c)})});if(byClass)return byClass}
    return null;
  }
  function applyJournal(){
    var list=readJournal();if(!list.length)return;
    var version=currentVersion();
    var usable=list.filter(function(r){return !r.baseVersion||!version||r.baseVersion===version});
    if(!usable.length){try{localStorage.removeItem(JOURNAL)}catch(_){}return}
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
  function journalCurrent(){
    if(!window.__APPLE_SEED_IMAGE_EDIT_ACTIVE__||!selected)return;
    var rec=identity(selected),item=draft&&draft.items&&draft.items[selector];
    rec.removed=!!(item&&item.imageRemoved);
    if(rec.removed)rec.url='';
    else if(typeof as4ImageUrl==='function')rec.url=as4ImageUrl(selected)||'';
    else rec.url=selected.tagName==='IMG'?(selected.currentSrc||selected.src||''):'';
    var list=readJournal(),i=list.findIndex(function(x){return x.selector===rec.selector});
    if(i>=0)list[i]=rec;else list.push(rec);
    writeJournal(list.slice(-100));
    window.__APPLE_SEED_IMAGE_EDIT_ACTIVE__=false;
  }
  function markEdit(){window.__APPLE_SEED_IMAGE_EDIT_ACTIVE__=true}
  function ensure(){
    if(window[READY])return;
    window[READY]=true;
    var p=findPanel();
    if(p){
      var oldDelete=document.getElementById('deleteImage');
      if(oldDelete){oldDelete.hidden=false;oldDelete.style.display='block';oldDelete.textContent='🗑️ Xóa ảnh đang chọn';oldDelete.classList.add('btn','danger')}
      var f=findFileInput(p);if(f)f.title='Chọn ảnh mới để thay ảnh đang chọn';
    }
    if(typeof saveDraft==='function'&&!saveDraft.__appleSeedImageJournal){
      var original=saveDraft;
      var wrapped=function(){var r=original.apply(this,arguments);try{journalCurrent()}catch(_){}return r};
      wrapped.__appleSeedImageJournal=true;saveDraft=wrapped;window.saveDraft=wrapped;
    }
    if(typeof loadPublished==='function'&&!loadPublished.__appleSeedImageJournal){
      var originalLoad=loadPublished;
      var wrappedLoad=function(){
        var result=originalLoad.apply(this,arguments);
        if(result&&typeof result.then==='function')return result.then(function(v){setTimeout(applyJournal,60);return v});
        setTimeout(applyJournal,60);return result;
      };
      wrappedLoad.__appleSeedImageJournal=true;loadPublished=wrappedLoad;window.loadPublished=wrappedLoad;
    }
    var apply=document.getElementById('applyImage');
    if(apply&&!apply.__appleSeedImageJournal){apply.addEventListener('click',markEdit,true);apply.__appleSeedImageJournal=true}
    var pick=document.getElementById('pick');
    if(pick&&!pick.__appleSeedImageJournal){pick.addEventListener('click',markEdit,true);pick.__appleSeedImageJournal=true}
    var del=document.getElementById('deleteImage');
    if(del&&!del.__appleSeedImageJournal){del.addEventListener('click',markEdit,true);del.__appleSeedImageJournal=true}
    var preview=document.getElementById('preview');
    if(preview&&!preview.__appleSeedImageJournal){preview.addEventListener('load',function(){setTimeout(applyJournal,1200);setTimeout(applyJournal,2500)},false);preview.__appleSeedImageJournal=true}
    setTimeout(applyJournal,800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
})();
