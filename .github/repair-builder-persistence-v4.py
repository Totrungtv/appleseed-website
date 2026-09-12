from pathlib import Path
p=Path('site-builder.html')
s=p.read_text(encoding='utf-8')
orig=s

needle="window.__APPLE_SEED_BUILDER_SAFE_SYNC__=true;"
if needle not in s:
    raise SystemExit('missing SAFE_SYNC marker')
if 'window.__APPLE_SEED_BUILDER_UNIFYING__' not in s:
    s=s.replace(needle, needle+"\nwindow.__APPLE_SEED_BUILDER_UNIFYING__=false;",1)

old="captureBuilderImageBaseline();\n  await loadPublished();applyAll();refreshPageDesign();rebindUploadControls();syncLiveItemCount();setStatus('Sẵn sàng — bấm trực tiếp để chỉnh');renderLayers();"
new="captureBuilderImageBaseline();\n  if(!window.__APPLE_SEED_BUILDER_UNIFYING__){await loadPublished();applyAll();refreshPageDesign();rebindUploadControls();syncLiveItemCount();setStatus('Sẵn sàng — bấm trực tiếp để chỉnh');renderLayers();}\n  else{rebindUploadControls();syncLiveItemCount();}"
if old not in s:
    raise SystemExit('missing preview load persistence block')
s=s.replace(old,new,1)

start=s.find("/* AI_BOARD_INDEX_BUILDER_UNIFIED_V3")
if start<0:
    raise SystemExit('missing unify marker')
end=s.find("$('syncLive').onclick=async()=>{", start)
if end<0:
    raise SystemExit('missing syncLive handler after unify')
new_unify=r'''/* AI_BOARD_INDEX_BUILDER_UNIFIED_V4
 * Real INDEX is the DOM source of truth. During this operation the iframe load
 * handler is locked out so it cannot race loadPublished() and overwrite draft.
 * Valid existing draft items are retained; only selectors absent from INDEX are pruned.
 */
async function unifyIndexAndBuilder(){
  if(!allowed){toast('Tài khoản không có quyền');return}
  const btn=$('unifyIndexBuilder');if(btn)btn.disabled=true;
  const preserved=JSON.parse(JSON.stringify(draft||{items:{},page:{desktop:{},mobile:{}}}));
  window.__APPLE_SEED_BUILDER_UNIFYING__=true;
  try{
    setStatus('Đang hợp nhất INDEX ↔ BUILDER…');
    const p=$('preview');if(!p)throw new Error('Không tìm thấy canvas INDEX.');
    localStorage.setItem(DRAFT_KEY,JSON.stringify(preserved));
    const u=new URL('index.html',location.href);
    u.searchParams.set('appleSeedBuilderPreview','1');
    u.searchParams.set('builderCanvas','1');
    u.searchParams.set('v','unified-'+Date.now());
    const wait=new Promise((resolve,reject)=>{
      let done=false;
      const finish=(ok,err)=>{if(done)return;done=true;clearTimeout(timer);p.removeEventListener('load',onload);ok?resolve():reject(err||new Error('INDEX không tải được trong 15 giây.'))};
      const onload=()=>finish(true);
      const timer=setTimeout(()=>finish(false),15000);
      p.addEventListener('load',onload,{once:true});
    });
    p.dataset.builderRetry='';
    p.src=u.toString();
    await wait;
    doc=p.contentDocument;
    if(!doc?.body)throw new Error('INDEX đã tải nhưng không có nội dung.');
    captureBuilderImageBaseline();
    const fresh={items:{},page:JSON.parse(JSON.stringify(preserved.page||{desktop:{},mobile:{}}))};
    const before=Object.keys(preserved.items||{});
    for(const sel of before){
      let el=null;try{el=doc.querySelector(sel)}catch(_){ }
      if(el)fresh.items[sel]=preserved.items[sel];
    }
    draft=fresh;
    localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
    applyAll();refreshPageDesign();renderLayers();refreshOverlay();
    const kept=Object.keys(draft.items||{}).length;
    setStatus('INDEX ↔ BUILDER đã hợp nhất · '+kept+'/'+before.length+' mục hợp lệ');
    toast('🧬 Đã hợp nhất INDEX thật với Builder');
  }catch(e){
    console.error('Unify INDEX ↔ Builder:',e);
    draft=preserved;
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));applyAll();renderLayers();refreshOverlay()}catch(_){ }
    setStatus('Hợp nhất thất bại — nháp vẫn được giữ nguyên');
    toast('⚠️ Hợp nhất lỗi: '+(e?.message||'Không xác định'));
  }finally{
    window.__APPLE_SEED_BUILDER_UNIFYING__=false;
    if(btn)btn.disabled=false;
  }
}
$('unifyIndexBuilder').onclick=unifyIndexAndBuilder;
'''
s=s[:start]+new_unify+s[end:]

pub_start=s.find("$('publish').onclick=async()=>{")
if pub_start<0:
    raise SystemExit('missing publish handler')
auth_marker=s.find("/* SITE_BUILDER_AUTH_FIX_V3 */", pub_start)
if auth_marker<0:
    raise SystemExit('missing auth marker after publish')
new_pub=r'''async function readLatestPublishedBuilderConfig(){
  const r=await window.supabaseClient.from('site_builder_versions')
    .select('version_no,config,created_at')
    .eq('site_key','default')
    .eq('status','published')
    .order('version_no',{ascending:false})
    .limit(1)
    .maybeSingle();
  if(r.error)throw r.error;
  return r.data||null;
}
function mergeBuilderPublishConfig(base,current){
  const empty={items:{},page:{desktop:{},mobile:{}}};
  const out=JSON.parse(JSON.stringify(base||empty));
  const cur=JSON.parse(JSON.stringify(current||empty));
  out.items=out.items||{};
  Object.entries(cur.items||{}).forEach(([sel,item])=>{out.items[sel]=item});
  out.page=out.page||{};
  for(const dk of ['desktop','mobile']){
    const bp=out.page[dk]||{};const cp=cur.page?.[dk]||{};
    out.page[dk]={...bp,...cp};
  }
  return out;
}
$('publish').onclick=async()=>{
  if(!allowed){toast('Tài khoản không có quyền');return}
  const btn=$('publish');if(btn)btn.disabled=true;
  setStatus('Đang kiểm tra LIVE trước khi xuất bản…');
  try{
    const latest=await readLatestPublishedBuilderConfig();
    const payload=mergeBuilderPublishConfig(latest?.config,draft);
    payload.builder_version='V4';
    payload.builder_features=['blocks','responsive','group-drag','presets','ai-designer','hero-slider','index-builder-unify'];
    const r=await window.supabaseClient.rpc('apple_seed_builder_publish',{p_config:payload,p_site_key:'default'});
    if(r.error)throw r.error;
    const versionNo=r.data?.version_no;
    draft=JSON.parse(JSON.stringify(payload));
    localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
    if(versionNo!=null)localStorage.setItem(PUBLISHED_VERSION_KEY,String(versionNo));
    toast('🚀 Đã xuất bản V'+(versionNo||''));
    setStatus('Đã xuất bản V'+(versionNo||''));
    const verify=await window.supabaseClient.from('site_builder_versions')
      .select('version_no,config,status')
      .eq('site_key','default').eq('status','published')
      .order('version_no',{ascending:false}).limit(1).maybeSingle();
    if(verify.error)throw verify.error;
    if(!verify.data?.config)throw new Error('Không đọc lại được cấu hình vừa xuất bản.');
    draft=JSON.parse(JSON.stringify(verify.data.config));
    draft.items=draft.items||{};draft.page=draft.page||{desktop:{},mobile:{}};
    draft.page.desktop=draft.page.desktop||{};draft.page.mobile=draft.page.mobile||{};
    localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
    if(verify.data.version_no!=null)localStorage.setItem(PUBLISHED_VERSION_KEY,String(verify.data.version_no));
    refreshPageDesign();applyAll();
    const u=new URL($('preview').src,location.href);
    u.searchParams.set('v','builder-live-'+Date.now());
    $('preview').dataset.builderRetry='';$('preview').src=u.toString();
  }catch(e){
    console.error('Safe Publish V4:',e);
    toast('❌ Publish lỗi: '+(e?.message||String(e)));
    setStatus('Publish lỗi — website chưa đổi');
  }finally{if(btn)btn.disabled=false}
};
'''
s=s[:pub_start]+new_pub+s[auth_marker:]

checks=[
    'window.__APPLE_SEED_BUILDER_UNIFYING__=false;',
    'AI_BOARD_INDEX_BUILDER_UNIFIED_V4',
    'async function readLatestPublishedBuilderConfig()',
    "payload.builder_features=['blocks','responsive','group-drag','presets','ai-designer','hero-slider','index-builder-unify'];",
]
for c in checks:
    if c not in s: raise SystemExit('missing patched marker: '+c)

p.write_text(s,encoding='utf-8')
print('patched',len(orig),'->',len(s),'delta',len(s)-len(orig))
