from pathlib import Path

p = Path('site-builder.html')
s = p.read_text(encoding='utf-8')
marker = 'APPLE_SEED_30_THEME_SELECTION_FIX_V1'
if marker in s:
    print('Theme selection fix already installed.')
    raise SystemExit(0)

script = r'''<script id="APPLE_SEED_30_THEME_SELECTION_FIX_V1">
(function(){
  'use strict';
  function themeId(el){
    if(!el) return '';
    var raw = el.getAttribute('data-theme-id') || el.getAttribute('data-theme') || el.getAttribute('data-id') || '';
    if(!raw){
      var n=el.querySelector('.as-theme-no');
      raw=n?n.textContent:'';
    }
    if(!raw) raw=el.textContent||'';
    var m=String(raw).match(/(?:^|[^0-9])(0?[1-9]|[12][0-9]|30)(?:[^0-9]|$)/);
    if(!m) return '';
    var n=parseInt(m[1],10);
    return n>=1&&n<=30?String(n).padStart(2,'0'):'';
  }
  function selectColor(el){
    var v=themeId(el); if(!v) return false;
    try{
      document.querySelectorAll('.as-theme-choice').forEach(function(x){x.classList.remove('active')});
      el.classList.add('active');
      document.documentElement.classList.add('as-theme-scope');
      for(var i=1;i<=30;i++)document.documentElement.classList.remove('as-theme-'+String(i).padStart(2,'0'));
      document.documentElement.classList.add('as-theme-'+v);
      localStorage.setItem('APPLE_SEED_SITE_THEME_V1',v);
      if(typeof draft!=='undefined'&&draft){draft.theme_id=v;if(typeof saveDraft==='function')saveDraft();}
      if(typeof applyAll==='function')applyAll();
      var st=document.getElementById('appleSeedThemeStatus');
      if(st)st.textContent='Đã chọn Theme '+v+' · thay đổi đang ở bản nháp.';
      return true;
    }catch(e){console.warn('Color theme selection:',e);return false}
  }
  function selectFull(el){
    var v=themeId(el); if(!v) return false;
    try{
      document.querySelectorAll('.as-full-theme-choice').forEach(function(x){x.classList.remove('active')});
      el.classList.add('active');
      for(var i=1;i<=30;i++)document.documentElement.classList.remove('as-full-theme-'+String(i).padStart(2,'0'));
      document.documentElement.classList.add('as-full-theme-scope','as-full-theme-'+v);
      localStorage.setItem('APPLE_SEED_FULL_THEME_V1',v);
      if(typeof draft!=='undefined'&&draft){draft.full_theme_id=v;if(typeof saveDraft==='function')saveDraft();}
      if(typeof applyAll==='function')applyAll();
      return true;
    }catch(e){console.warn('Full theme selection:',e);return false}
  }
  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest?e.target.closest('.as-theme-choice'):null;
    if(el){ if(selectColor(el)){e.preventDefault();e.stopImmediatePropagation();return} }
    el=e.target&&e.target.closest?e.target.closest('.as-full-theme-choice'):null;
    if(el){ if(selectFull(el)){e.preventDefault();e.stopImmediatePropagation();return} }
  },true);
  document.addEventListener('pointerup',function(e){
    var el=e.target&&e.target.closest?e.target.closest('.as-theme-choice,.as-full-theme-choice'):null;
    if(el && getComputedStyle(el).pointerEvents==='none'){
      el.style.pointerEvents='auto';
    }
  },true);
})();
</script>
<!-- APPLE_SEED_30_THEME_SELECTION_FIX_V1 -->
'''
s = s.replace('</body>', script + '</body>', 1)
p.write_text(s, encoding='utf-8')
print('Installed robust 1-30 theme selection bridge.')
