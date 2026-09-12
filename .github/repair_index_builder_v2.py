from pathlib import Path

# Builder button + safe INDEX<->Builder merge.
p=Path('site-builder.html'); s=p.read_text(encoding='utf-8')
marker='AI_BOARD_INDEX_BUILDER_UNIFIED_V3'
if marker not in s:
    old='<button class="btn" id="syncLive">🔄 Đồng bộ LIVE</button><button class="btn primary" id="publish">🚀 Xuất bản</button>'
    new='<button class="btn" id="syncLive">🔄 Đồng bộ LIVE</button><button class="btn" id="unifyIndexBuilder" style="border-color:#1769ff;color:#1769ff;background:#eef5ff">🧬 Hợp nhất INDEX ↔ BUILDER</button><button class="btn primary" id="publish">🚀 Xuất bản</button>'
    if old not in s: raise SystemExit('Builder toolbar anchor not found')
    s=s.replace(old,new,1)
    anchor="$('syncLive').onclick=async()=>{"
    fn=r'''/* AI_BOARD_INDEX_BUILDER_UNIFIED_V3
 * One source of truth for editing: the actual index.html rendered in the iframe.
 * Refreshes INDEX, preserves current draft, removes only stale selectors, and reapplies valid edits.
 */
async function unifyIndexAndBuilder(){
  if(!allowed){toast('Tài khoản không có quyền');return}
  const btn=$('unifyIndexBuilder'); if(btn)btn.disabled=true;
  const preserved=JSON.parse(JSON.stringify(draft||{items:{},page:{desktop:{},mobile:{}}}));
  try{
    setStatus('Đang hợp nhất INDEX ↔ BUILDER…');
    localStorage.setItem(DRAFT_KEY,JSON.stringify(preserved));
    const before=Object.keys(preserved.items||{});
    const p=$('preview'); if(!p)throw new Error('Không tìm thấy canvas INDEX.');
    const wait=new Promise((resolve,reject)=>{
      let done=false;
      const finish=ok=>{if(done)return;done=true;clearTimeout(timer);p.removeEventListener('load',onload);ok?resolve():reject(new Error('INDEX không tải được trong 15 giây.'))};
      const onload=()=>finish(true); const timer=setTimeout(()=>finish(false),15000);
      p.addEventListener('load',onload,{once:true});
    });
    const u=new URL('index.html',location.href);
    u.searchParams.set('appleSeedBuilderPreview','1');u.searchParams.set('builderCanvas','1');u.searchParams.set('v','unified-'+Date.now());
    p.dataset.builderRetry='';p.src=u.toString();await wait;
    doc=p.contentDocument;if(!doc?.body)throw new Error('INDEX đã tải nhưng không có nội dung.');
    captureBuilderImageBaseline();
    const fresh={items:{},page:preserved.page||{desktop:{},mobile:{}}};
    for(const sel of before){let el=null;try{el=doc.querySelector(sel)}catch(_){}if(el)fresh.items[sel]=preserved.items[sel]}
    draft=fresh;localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));applyAll();refreshPageDesign();renderLayers();refreshOverlay();
    const kept=Object.keys(draft.items||{}).length;
    setStatus('INDEX ↔ BUILDER đã hợp nhất · '+kept+'/'+before.length+' mục hợp lệ');
    toast('🧬 Đã hợp nhất INDEX thật với Builder');
  }catch(e){
    console.error('Unify INDEX ↔ Builder:',e);draft=preserved;
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));applyAll();renderLayers();refreshOverlay()}catch(_){}
    setStatus('Hợp nhất thất bại — nháp vẫn được giữ nguyên');toast('⚠️ Hợp nhất lỗi: '+(e?.message||'Không xác định'));
  }finally{if(btn)btn.disabled=false}
}

'''
    if anchor not in s: raise SystemExit('syncLive anchor not found')
    s=s.replace(anchor,fn+anchor,1)
    s=s.replace(anchor,"$('unifyIndexBuilder').onclick=unifyIndexAndBuilder;\n"+anchor,1)
    p.write_text(s,encoding='utf-8')

# Real index: make the six Hero phone slots visible in both live index and Builder.
p=Path('index.html'); s=p.read_text(encoding='utf-8')
marker='AI_BOARD_INDEX_BUILDER_CANONICAL_HERO_V3'
if marker not in s:
    old='.as3-stage > .as3-phone{\n  display:none!important;\n}'
    new='.as3-stage > .as3-phone{\n  display:block!important;\n}\n/* AI_BOARD_INDEX_BUILDER_CANONICAL_HERO_V3\n   INDEX and Site Builder render the same Hero phone slots. */'
    if old not in s: raise SystemExit('Hero hidden-phone rule not found')
    s=s.replace(old,new,1)

# Patch the LIVE runtime embedded in index.html: resolve the exact phone slot.
marker='AI_BOARD_INDEX_BUILDER_LIVE_RUNTIME_V3'
if marker not in s:
    old='''if(!el && item.src && selector.indexOf(".as3-screen")!==-1){
      el=document.querySelector(".as3-screen");
      if(el){
        el.querySelectorAll(":scope > img").forEach(function(img){img.remove()});
        var customImg=document.createElement("img");
        customImg.src=String(item.src);
        customImg.alt="iPhone";
        customImg.loading="eager";
        customImg.decoding="async";
        customImg.onerror=function(){customImg.remove()};
        el.appendChild(customImg);
      }
    }
    if(!el) return;'''
    new='''/* AI_BOARD_INDEX_BUILDER_LIVE_RUNTIME_V3 */
    if(!el && (item.src || item.bgImage) && selector.indexOf(".as3-screen")!==-1){
      /* Dynamic product loading may recreate screen children. Use the stable
         .as3-pN class from the saved selector, never screen #1 by accident. */
      var slotMatch=selector.match(/\\.as3-p(\\d+)\\b/);
      var slotIndex=slotMatch?Math.max(1,Number(slotMatch[1])):0;
      el=slotIndex?document.querySelector(".as3-p"+slotIndex+" .as3-screen"):document.querySelector(".as3-screen");
      if(el && item.src){
        el.querySelectorAll(":scope > img").forEach(function(img){img.remove()});
        var customImg=document.createElement("img");
        customImg.src=String(item.src);
        customImg.alt="iPhone";
        customImg.loading="eager";
        customImg.decoding="async";
        customImg.onerror=function(){customImg.remove()};
        el.appendChild(customImg);
      }
    }
    if(!el) return;'''
    if old not in s: raise SystemExit('Embedded LIVE runtime anchor not found')
    s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('V3 repair applied')
