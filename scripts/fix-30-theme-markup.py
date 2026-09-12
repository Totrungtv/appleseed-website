from pathlib import Path
import re

p=Path('site-builder.html')
s=p.read_text(encoding='utf-8')
marker='APPLE_SEED_30_THEMES_V1'
ui_marker='apple-seed-30-theme-ui'
# The first installer revision accidentally nested a <style> inside the main <style>.
# Repair it without touching any Builder logic.
m=re.search(r'<style id="'+re.escape(ui_marker)+r'">(.*?)</style>\s*</style>',s,re.S)
if m:
    body=m.group(1)
    s=s[:m.start()]+body+'\n</style>'+s[m.end():]
# If the UI CSS marker is missing, install the compact UI rules into the existing style block.
if ui_marker not in s:
    css='.as-theme-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.as-theme-choice{position:relative;border:1px solid #dfe5ed;background:#fff;border-radius:9px;padding:7px;text-align:left;cursor:pointer;font-size:10px;font-weight:850;min-height:54px}.as-theme-choice:hover{border-color:#1769ff;transform:translateY(-1px)}.as-theme-choice.active{border-color:#1769ff;box-shadow:inset 0 0 0 2px #1769ff;background:#f5f8ff}.as-theme-dot{width:22px;height:22px;border-radius:50%;display:block;margin-bottom:4px;box-shadow:0 0 0 1px #d5dce5}.as-theme-no{position:absolute;right:6px;top:6px;color:#98a2b3;font-size:9px}'
    s=s.replace('</style>', '/* '+ui_marker+' */\n'+css+'\n</style>',1)
# Guard: the Builder must have exactly one 30-theme script and one theme panel.
if s.count('id="APPLE_SEED_30_THEMES_V1"') != 1: raise SystemExit('30-theme script marker count is not exactly 1')
if s.count('id="appleSeedThemePanel"') != 1: raise SystemExit('30-theme panel count is not exactly 1')
# Guard against nested style tags in the main style block.
head=s.split('</head>',1)[0]
styles=head.split('<style',1)
if head.count('<style') != head.count('</style>'): raise SystemExit('Unbalanced style tags in Builder head')
p.write_text(s,encoding='utf-8')
print('30-theme Builder markup repaired')
