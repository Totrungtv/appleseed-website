from pathlib import Path
p=Path('site-builder.html')
s=p.read_text(encoding='utf-8')
marker='await preservePublishedSliderBeforePublish(draft);'
if marker in s:
    print('Load persistence patch already present.')
    raise SystemExit(0)
needle="  refreshPageDesign();\n  applyAll();\n  setStatus('Đồng bộ LIVE · V'+publishedVersion);"
if needle not in s:
    raise SystemExit('loadPublished insertion point not found')
s=s.replace(needle,"  await preservePublishedSliderBeforePublish(draft);\n"+needle,1)
p.write_text(s,encoding='utf-8')
print('Load persistence patch applied.')
