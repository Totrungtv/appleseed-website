/* APPLE SEED IMAGE CONTROLS V1
   Adds an explicit delete action and keeps image replacement accessible.
   It intentionally delegates to the Builder's existing image handlers so the
   current draft/save/undo logic remains the source of truth.
*/
(function(){
  'use strict';
  var READY='__appleSeedImageControlsV1';

  function findPanel(){return document.getElementById('imagePanel');}
  function findFileInput(panel){
    if(!panel)return null;
    return panel.querySelector('input[type="file"]') || document.querySelector('#imageFile,input[type="file"][accept*="image"],input[type="file"]');
  }
  function findReplaceButton(panel){
    if(!panel)return null;
    return panel.querySelector('#applyImage') || Array.prototype.find.call(panel.querySelectorAll('button'),function(b){
      return /thêm\s*\/\s*thay ảnh|thay ảnh/i.test((b.textContent||'').trim());
    });
  }
  function ensure(){
    var panel=findPanel();
    if(!panel || panel[READY])return;
    panel[READY]=true;

    var oldDelete=document.getElementById('deleteImage');
    if(oldDelete){
      oldDelete.hidden=false;
      oldDelete.style.display='block';
      oldDelete.textContent='🗑️ Xóa ảnh đang chọn';
      oldDelete.classList.add('btn','danger');
    }else{
      var replace=findReplaceButton(panel);
      var del=document.createElement('button');
      del.type='button';
      del.id='appleSeedDeleteImageV1';
      del.className='btn danger';
      del.textContent='🗑️ Xóa ảnh đang chọn';
      del.style.cssText='width:100%;margin-top:7px;font-weight:900;color:#b42318;border-color:#efb4b4;background:#fffafa;';
      del.addEventListener('click',function(){
        var nativeDelete=document.getElementById('deleteImage');
        if(nativeDelete && nativeDelete!==del){nativeDelete.click();return;}
        document.dispatchEvent(new CustomEvent('apple-seed:delete-image',{bubbles:true}));
      });
      (replace||panel.lastElementChild||panel).insertAdjacentElement('afterend',del);
    }

    var replace=findReplaceButton(panel);
    var file=findFileInput(panel);
    if(replace && file && !replace.__appleSeedReplaceBound){
      replace.__appleSeedReplaceBound=true;
      replace.title='Thay ảnh cho phần tử đang chọn';
    }
    if(file) file.title='Chọn ảnh mới để thay ảnh đang chọn';
  }

  function boot(){
    ensure();
    var observer=new MutationObserver(ensure);
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('load',ensure,{once:false});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
