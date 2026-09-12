from pathlib import Path

path = Path("site-builder.html")
s = path.read_text(encoding="utf-8")
marker = "/* APPLE_SEED_SLIDER_PUBLISH_PERSISTENCE_V1 */"
if marker in s:
    print("Slider persistence patch already present.")
    raise SystemExit(0)

anchor = "$('publish').onclick=async()=>{"
needle = "  const payload=snapshot();payload.builder_version='V3';payload.builder_features=['blocks','responsive','group-drag','presets','ai-designer'];"
if anchor not in s:
    raise SystemExit("Publish handler anchor not found")
if needle not in s:
    raise SystemExit("Publish payload line not found")

helper = r'''/* APPLE_SEED_SLIDER_PUBLISH_PERSISTENCE_V1 */
async function preservePublishedSliderBeforePublish(payload){
  const SLIDER_SELECTOR='section.as3-hero>div.as3-wrap>div.as3-main:nth-of-type(1)>div.as3-stage:nth-of-type(2)';
  try{
    const live=await window.supabaseClient.from('site_builder_versions')
      .select('config,version_no')
      .eq('site_key','default')
      .eq('status','published')
      .order('version_no',{ascending:false})
      .limit(1)
      .maybeSingle();
    if(live.error||!live.data?.config)return payload;
    const liveSlider=live.data.config?.items?.[SLIDER_SELECTOR]?.slider;
    const draftSlider=payload?.items?.[SLIDER_SELECTOR]?.slider;
    const liveImages=Array.isArray(liveSlider?.images)?liveSlider.images:[];
    const draftImages=Array.isArray(draftSlider?.images)?draftSlider.images:[];
    const liveHasImage=liveImages.some(x=>x&&String(x.src||'').trim());
    const draftHasImage=draftImages.some(x=>x&&String(x.src||'').trim());
    if(liveHasImage && !draftHasImage && draftImages.length===0){
      payload.items=payload.items||{};
      payload.items[SLIDER_SELECTOR]=payload.items[SLIDER_SELECTOR]||{styles:{desktop:{},mobile:{}}};
      payload.items[SLIDER_SELECTOR].slider=JSON.parse(JSON.stringify(liveSlider));
      if(draft?.items){
        draft.items[SLIDER_SELECTOR]=draft.items[SLIDER_SELECTOR]||{styles:{desktop:{},mobile:{}}};
        draft.items[SLIDER_SELECTOR].slider=JSON.parse(JSON.stringify(liveSlider));
        try{localStorage.setItem(DRAFT_KEY,JSON.stringify(draft))}catch(_){}
      }
      toast('🛡️ Đã giữ ảnh Slider LIVE — không cho Publish ghi rỗng');
    }
  }catch(e){console.warn('Preserve published slider:',e)}
  return payload;
}
'''
s = s.replace(anchor, helper + anchor, 1)
s = s.replace(needle, needle + "\n  await preservePublishedSliderBeforePublish(payload);", 1)
path.write_text(s, encoding="utf-8")
print("Slider publish persistence patch applied.")
