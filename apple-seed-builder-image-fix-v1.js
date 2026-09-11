/* Apple Seed Visual Builder — reliable image target fix V1. */
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html')return;

  function q(s){return document.querySelector(s)}

  function getSelectedElement(){
    var info=q('#info'), p=q('#preview'), d=p&&p.contentDocument;
    if(!info||!d)return null;
    var s=String(info.textContent||'').trim();
    if(!s||s==='Chưa chọn')return null;
    try{return d.querySelector(s)}catch(_){return null}
  }

  function safeUrl(url){
    return String(url||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  }

  function applyToElement(el,url){
    if(!el||!url||typeof window.getItem!=='function')return false;
    var item=window.getItem();
    if(!item)return false;
    var target=el;

    // Hero images are often inside a clickable <a>. The Builder can select
    // the wrapper, but the actual picture is the direct <img> child.
    if(target.tagName==='A'){
      var direct=target.querySelector(':scope > img');
      if(direct)target=direct;
    }

    if(target.tagName==='IMG'){
      target.src=url;
      target.removeAttribute('srcset');
      item.src=url;
      return true;
    }

    if(target.matches?.('.as3-phone,.as3-screen')||target.closest?.('.as3-phone')){
      if(typeof window.applyHeroPhoneImage==='function'){
        window.applyHeroPhoneImage(target,url);
      }else{
        target.style.setProperty('background-image','url("'+safeUrl(url)+'")','important');
        target.style.setProperty('background-size','contain','important');
        target.style.setProperty('background-position','center','important');
        target.style.setProperty('background-repeat','no-repeat','important');
      }
      item.bgImage=url;
      return true;
    }

    target.style.setProperty('background-image','url("'+safeUrl(url)+'")','important');
    item.bgImage=url;
    return true;
  }

  function patch(){
    var btn=q('#applyImage');
    if(!btn||btn.__appleSeedImageFix)return;
    btn.__appleSeedImageFix=true;

    btn.addEventListener('click',function(){
      // Let the original Builder handler finish upload/URL handling first.
      // Then target the actual IMG when the selected object is an A wrapper.
      setTimeout(function(){
        var el=getSelectedElement();
        var url=String(q('#imageUrl')?.value||'').trim();
        if(!el||!url)return;
        if(applyToElement(el,url)){
          if(typeof window.saveDraft==='function')window.saveDraft();
          if(typeof window.refreshInspector==='function')window.refreshInspector();
          if(typeof window.refreshOverlay==='function')window.refreshOverlay();
          if(typeof window.renderLayers==='function')window.renderLayers();
          if(typeof window.toast==='function')window.toast('🖼️ Đã thay hình — ảnh thật đã cập nhật');
        }
      },120);
    },false);
  }

  var timer=setInterval(patch,250);
  setTimeout(function(){clearInterval(timer)},30000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});
  else patch();
})();
