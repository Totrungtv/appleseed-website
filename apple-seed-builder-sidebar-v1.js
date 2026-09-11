/* Apple Seed Visual Builder — Sidebar Premium V1
 * UI-only enhancement. Does not replace existing Builder controls or IDs.
 */
(function(){
  'use strict';
  if(location.pathname.split('/').pop().toLowerCase()!=='site-builder.html') return;
  if(document.getElementById('apple-seed-sidebar-premium-v1')) return;

  var style=document.createElement('style');
  style.id='apple-seed-sidebar-premium-v1';
  style.textContent=`
    .side{background:linear-gradient(180deg,#f8fafc 0%,#fff 45%);padding:10px 9px!important;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}
    .side::-webkit-scrollbar{width:7px}.side::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
    .side.left,.side.right{box-shadow:inset 0 0 0 1px rgba(15,23,42,.025)}
    .side .panel{border:1px solid #e4e9f1!important;border-radius:14px!important;padding:11px!important;margin-bottom:9px!important;background:rgba(255,255,255,.96)!important;box-shadow:0 4px 16px rgba(16,24,40,.045)!important}
    .side .panel:hover{border-color:#cfd9e8!important;box-shadow:0 7px 22px rgba(16,24,40,.07)!important}
    .side .panel h3{font-size:11px!important;letter-spacing:.1px;color:#172033;margin-bottom:8px!important}
    .side .muted{font-size:10px;line-height:1.45}
    .side .hint{border-radius:10px!important;background:#f5f9ff!important;border-color:#d8e7ff!important;color:#52627a!important}
    .side .btn{border-radius:9px!important;min-height:34px;transition:.15s ease}
    .side .btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,24,40,.07)}
    .side .btn.primary{box-shadow:0 5px 14px rgba(23,105,255,.18)}
    .side .field input,.side .field textarea,.side .field select{border-color:#d9e0ea!important;border-radius:9px!important;background:#fbfcfe!important}
    .side .field input:focus,.side .field textarea:focus,.side .field select:focus{border-color:#1769ff!important;box-shadow:0 0 0 3px rgba(23,105,255,.09)!important;background:#fff!important}
    .side .drop{background:#fbfcfe;border-color:#cbd5e1;border-radius:10px;padding:10px!important;font-weight:750;color:#475467}
    .side .drop:hover{background:#f5f9ff;border-color:#8eb0ff}
    .side .image-preview{max-height:150px!important;border-radius:10px;background:#f6f8fb;padding:4px}
    .side .layers{max-height:360px!important;padding-right:2px}
    .side .layer{border-radius:9px!important;background:#f9fafb!important;border-color:#e5eaf0!important;min-height:31px}
    .side .layer:hover{background:#f1f6ff!important;border-color:#b9cdfc!important}
    .side .layer.active{background:#eef5ff!important;border-color:#1769ff!important;color:#1457c7!important;box-shadow:inset 3px 0 #1769ff}
    .asb-premium-head{display:flex;align-items:center;gap:8px;margin:-1px -1px 9px;padding:9px 10px;border-radius:11px;background:linear-gradient(135deg,#f7fbff,#eef5ff);border:1px solid #dbe8ff}
    .asb-logo{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#1769ff;color:#fff;font-size:15px;box-shadow:0 5px 12px rgba(23,105,255,.2)}
    .asb-title{font-weight:900;font-size:11px;color:#172033}.asb-sub{font-size:8px;color:#667085;margin-top:2px}
    .asb-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:8px}
    .asb-quick button{border:1px solid #dfe6ef;background:#fff;border-radius:9px;padding:7px 3px;font-size:9px;font-weight:850;color:#344054;cursor:pointer}
    .asb-quick button:hover{border-color:#9dbcfb;background:#f6f9ff;color:#1557c0}
    .asb-status{display:flex;align-items:center;justify-content:space-between;padding:7px 9px;border-radius:9px;background:#f8fafc;border:1px solid #e8edf3;font-size:9px;margin-bottom:8px}
    .asb-dot{width:7px;height:7px;border-radius:50%;background:#12b76a;display:inline-block;margin-right:5px;box-shadow:0 0 0 3px rgba(18,183,106,.10)}
    .asb-section-label{font-size:8px;font-weight:900;letter-spacing:1px;color:#98a2b3;text-transform:uppercase;margin:10px 2px 5px}
    @media(max-width:980px){.side.left{width:200px}.side{padding:8px!important}.asb-quick{grid-template-columns:1fr 1fr 1fr}}
  `;
  document.head.appendChild(style);

  function q(s){return document.querySelector(s)}
  function makeHead(side,title,sub,icon){
    if(!side||side.querySelector('.asb-premium-head')) return;
    var h=document.createElement('div');h.className='asb-premium-head';
    h.innerHTML='<div class="asb-logo">'+icon+'</div><div><div class="asb-title">'+title+'</div><div class="asb-sub">'+sub+'</div></div>';
    side.insertBefore(h,side.firstElementChild);
  }
  function quick(side){
    if(!side||side.querySelector('.asb-quick')) return;
    var box=document.createElement('div');box.className='asb-quick';
    [['#contentPanel','✏️ Chữ'],['#imagePanel','🖼 Ảnh'],['#pageDesignPanel','🎨 Trang']].forEach(function(x){
      var b=document.createElement('button');b.type='button';b.textContent=x[1];b.onclick=function(){var el=q(x[0]);if(el){el.hidden=false;el.scrollIntoView({behavior:'smooth',block:'start'})}};box.appendChild(b);
    });
    side.insertBefore(box,side.firstElementChild?.nextElementSibling||null);
  }
  function rightStatus(side){
    if(!side||side.querySelector('.asb-status')) return;
    var box=document.createElement('div');box.className='asb-status';box.innerHTML='<span><span class="asb-dot"></span>Builder hoạt động</span><span>V3</span>';
    var head=side.querySelector('.asb-premium-head');if(head&&head.nextSibling)side.insertBefore(box,head.nextSibling);else side.insertBefore(box,side.firstChild);
  }
  function decorate(){
    var left=q('.side.left'),right=q('.side.right');
    makeHead(left,'APPLE SEED BUILDER','Không gian thiết kế trực quan','✦');
    makeHead(right,'INSPECTOR','Chỉnh sửa đối tượng & trang','⚙');
    quick(right);rightStatus(right);
    document.querySelectorAll('.side .panel h3').forEach(function(h){if(h.dataset.asbDecorated)return;h.dataset.asbDecorated='1';h.setAttribute('title','Apple Seed Builder');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
  setTimeout(decorate,900);setTimeout(decorate,2200);
})();
