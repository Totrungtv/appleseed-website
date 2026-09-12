/* APPLE SEED IMAGE CONTROLS V6
   Make selected-image replacements authoritative at Publish time.
*/
(function(){
  'use strict';
  var READY='__appleSeedImageControlsV6';
  var JOURNAL='appleSeedVisualBuilderImageOverridesV4';
  var PENDING='appleSeedVisualBuilderPendingImageOverridesV4';
  var BLANK='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  function frame(){return document.querySelector('.frame iframe')||document.querySelector('iframe')}
  function getDoc(){var f=frame();return f&&f.contentDocument||null}
  function getDraftState(){try{return typeof draft!=='undefined'?draft:(window.draft||null)}catch(_){return window.draft||null}}
  function getSelectedEl(){try{return typeof selected!=='undefined'?selected:(window.selected||null)}catch(_){return window.selected||null}}
  function getCurrentSelector(){try{return typeof selector==='string'?selector:(window.selector||'')}catch(_){return''}}
  function read(k,f){try{var x=JSON.parse(localStorage.getItem(k)||'null');return x||f}catch(_){return f}}
  function write(k,x){try{localStorage.setItem(k,JSON.stringify(x))}catch(_){}
  }
  function imageSrc(el){
    if(!el)return '';
    var img=el.tagName==='IMG'?el:(el.querySelector&&el.querySelector('img'));
    if(img)return img.currentSrc||img.src||'';
    var bg=el.style&&el.style.backgroundImage||'';
    var m=bg.match(/url\(["']?(.*?)["']?\)/);return m?m[1]:'';
  }
  function target(el){try{return typeof as4ImagePhone==='function'?(as4ImagePhone(el)||el):el}catch(_){return el}}
  function getItem(d,sel){if(!d||!sel)return null;d.items=d.items||{};return d.items[sel]||(d.items[sel]={})}
  function rememberOverride(sel,url){if(!sel||!url)return;var m=read(PENDING,{});m[sel]={url:url,at:Date.now()};write(PENDING,m)}
  function pendingFor(sel){var m=read(PENDING,{});return m[sel]&&m[sel].url||''}
  function captureSelected(){
    var el=getSelectedEl(),sel=getCurrentSelector();if(!el||!sel)return;
    var panel=document.getElementById('imagePanel'),u=panel&&panel.querySelector('#imageUrl');
    var url=(u&&u.value||'').trim();
    if(/^https?:\/\//i.test(url)&&url.indexOf('/storage/v1/object/public/')>=0)rememberOverride(sel,url);
  }
  function syncDraft(force){
    var d=getDraftState();if(!d)return d;d.items=d.items||{};
    var p=read(PENDING,{});
    Object.keys(p).forEach(function(sel){
      var rec=p[sel];if(!rec||!rec.url)return;
      var item=getItem(d,sel);item.imageRemoved=false;item.src=rec.url;delete item.bgImage;
    });
    var doc=getDoc();
    if(doc){
      Object.keys(d.items).forEach(function(sel){
        var item=d.items[sel],el=null;
        try{el=doc.querySelector(sel)}catch(_){}
        if(!el)return;
        var t=target(el),url=imageSrc(t);
        if(!url||url===BLANK||url.indexOf('data:image')===0)return;
        if(item.bgImage&&!item.src){item.bgImage=url;item.imageRemoved=false}
        else if(item.src||item.imageRemoved){item.src=url;delete item.bgImage;item.imageRemoved=false}
      });
    }
    var s=getCurrentSelector(),ov=pendingFor(s);
    if(s&&ov){var it=getItem(d,s);it.imageRemoved=false;it.src=ov;delete it.bgImage}
    try{window.draft=d}catch(_){}
    try{if(typeof saveDraft==='function')saveDraft()}catch(_){}
    return d;
  }
  function freshPayload(){
    var d=syncDraft(true);
    if(!d)return null;
    try{return JSON.parse(JSON.stringify(d))}catch(_){return d}
  }
  function wrapRpc(){
    var client=null;try{client=(typeof sb!=='undefined'?sb:null)||window.sb||null}catch(_){client=window.sb||null}
    if(!client||typeof client.rpc!=='function'||client.rpc.__appleSeedImagePublishV6)return false;
    var original=client.rpc.bind(client);
    var wrapped=function(fn,args,opts){
      if(fn==='apple_seed_builder_publish'&&args){
        var payload=freshPayload();
        if(payload)args=Object.assign({},args,{p_config:payload});
      }
      return original(fn,args,opts);
    };
    wrapped.__appleSeedImagePublishV6=true;
    client.rpc=wrapped;
    return true;
  }
  function beforePublish(){captureSelected();syncDraft(true);wrapRpc()}
  function ensure(){
    if(window[READY])return;window[READY]=true;
    var file=document.getElementById('file');
    if(file&&!file.__appleSeedImageControlsV6){
      file.addEventListener('change',function(){
        var tries=0;
        var timer=setInterval(function(){captureSelected();if(++tries>=60)clearInterval(timer)},250);
      },true);
      file.__appleSeedImageControlsV6=true;
    }
    var preview=document.getElementById('preview');
    if(preview&&!preview.__appleSeedImageControlsV6){preview.addEventListener('load',function(){setTimeout(syncDraft,150);setTimeout(syncDraft,700)},false);preview.__appleSeedImageControlsV6=true}
    document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('button'):null;if(!b)return;var t=(b.textContent||'').trim();if(/xuất bản|publish/i.test(t))beforePublish()},true);
    var tries=0,boot=setInterval(function(){wrapRpc();if(++tries>=40)clearInterval(boot)},250);
    setTimeout(syncDraft,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
})();
/* APPLE_SEED_IMAGE_CONTROLS_V6 */
