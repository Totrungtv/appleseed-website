from pathlib import Path

path = Path("index.html")
html = path.read_text(encoding="utf-8")

# Apple Seed iCloud error-UI hotfix: remove obsolete DOM references without
# changing the payment/backend flow. This is intentionally idempotent.
icloud_path = Path("icloud-check.html")
icloud = icloud_path.read_text(encoding="utf-8")
old = """      const card=$('resultCard'); card.className='result-card';
      $('resultIcon').textContent='×';
      $('resultTitle').textContent='TRA CỨU THẤT BẠI';
      $('resultMessage').textContent='Hiện tại chưa thể hoàn tất tra cứu. Vui lòng thử lại sau. Nếu đã thanh toán, hệ thống sẽ giữ nguyên giao dịch để xử lý lại.';
      $('resultIdentifier').textContent=normalize();
      $('resultRef').textContent=paymentRefValue||'—';
      $('resultTxn').textContent='—';
      $('resultTime').textContent=new Date().toLocaleString('vi-VN');"""
new = """      const card=$('resultCard');
      card.className='result-card unknown';
      const badge=$('resultBadge');
      if(badge){
        badge.className='badge unknown';
        badge.innerHTML='<span class=\\"status-dot unknown\\"></span> TRA CỨU CHƯA HOÀN TẤT';
      }
      const pill=$('resultStatusPill');
      if(pill){
        pill.className='status-pill unknown';
        pill.innerHTML='<span class=\\"status-dot unknown\\"></span> CHƯA XÁC MINH';
      }
      $('resultModelName').textContent=model.value||'iPhone';
      $('resultModelDetail').textContent='Nguồn kiểm tra chưa trả kết quả.';
      $('resultMessage').textContent=e?.message||'Hiện tại chưa thể hoàn tất tra cứu. Nếu đã thanh toán, giao dịch vẫn được giữ để xử lý lại.';
      $('heroIdentifier').textContent=normalize()||'—';
      $('heroFmi').textContent='—';
      $('heroActivation').textContent='—';
      $('heroSimlock').textContent='—';
      $('deviceDetails').innerHTML='';
      $('lockDetails').innerHTML='';
      $('networkDetails').innerHTML='';
      $('lockSection').style.display='none';
      $('networkSection').style.display='none';
      $('resultIdentifier').textContent=normalize()||'—';
      $('resultRef').textContent=paymentRefValue||'—';
      $('resultTxn').textContent='—';
      $('resultTime').textContent=new Date().toLocaleString('vi-VN');"""
if old in icloud:
    icloud_path.write_text(icloud.replace(old, new, 1), encoding="utf-8")
    print("iCloud error UI hotfix applied.")
else:
    print("iCloud error UI hotfix already applied or block changed.")

if "APPLE-SEED-HERO-MOTION-V1" in html:
    marker = "<!-- APPLE-SEED-ICLOUD-UI-PATCH -->"
    if marker not in html and "</body>" in html:
        html = html.replace("</body>", marker + "\n</body>", 1)
        path.write_text(html, encoding="utf-8")
        print("Added deployment marker to index.html.")
    print("Hero motion patch already installed.")
    raise SystemExit(0)

patch = r"""<style id="apple-seed-hero-motion-v1">
/* APPLE-SEED-HERO-MOTION-V1 - subtle premium motion for the Hero phones */
.as3-stage{isolation:isolate}
.as3-stage .as3-motion-glow{
  position:absolute;inset:7% 5% 8%;pointer-events:none;z-index:1;border-radius:50%;
  background:
    radial-gradient(circle at 28% 42%,rgba(255,255,255,.34),transparent 17%),
    radial-gradient(circle at 63% 38%,rgba(214,226,255,.22),transparent 24%),
    radial-gradient(circle at 78% 62%,rgba(255,208,116,.18),transparent 22%);
  filter:blur(8px);opacity:.72;animation:asHeroAmbient 7s ease-in-out infinite alternate;
}
.as3-stage .as3-phone{will-change:transform,filter;transform-origin:50% 85%}
.as3-stage .as3-phone:nth-child(1){animation:asHeroPhoneFloat1 5.8s ease-in-out infinite}
.as3-stage .as3-phone:nth-child(2){animation:asHeroPhoneFloat2 6.4s ease-in-out .25s infinite}
.as3-stage .as3-phone:nth-child(3){animation:asHeroPhoneFloat3 6s ease-in-out .55s infinite}
.as3-stage .as3-phone:nth-child(4){animation:asHeroPhoneFloat4 6.8s ease-in-out .15s infinite}
.as3-stage .as3-phone:nth-child(5){animation:asHeroPhoneFloat5 6.2s ease-in-out .8s infinite}
.as3-stage .as3-phone:nth-child(6){animation:asHeroPhoneFloat6 7s ease-in-out .4s infinite}
.as3-stage .as3-phone-screen{position:relative;overflow:hidden}
.as3-stage .as3-phone-screen img{
  transition:filter .35s ease,transform .35s ease;
  animation:asHeroScreenBreath 4.5s ease-in-out infinite;
}
.as3-stage .as3-phone-screen .as3-screen-shimmer{
  position:absolute;inset:-35% -70%;pointer-events:none;z-index:4;
  background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.05) 45%,rgba(255,255,255,.62) 50%,rgba(255,255,255,.08) 55%,transparent 63%);
  transform:translateX(-72%) rotate(8deg);
  animation:asHeroScreenSweep 5.8s ease-in-out infinite;
  mix-blend-mode:screen;
}
.as3-stage .as3-phone-screen .as3-screen-glow{
  position:absolute;inset:0;pointer-events:none;z-index:3;
  box-shadow:inset 0 0 22px rgba(125,184,255,.08);
  animation:asHeroScreenGlow 3.8s ease-in-out infinite;
}
@keyframes asHeroAmbient{from{opacity:.45;transform:scale(.94) translate3d(-1%,0,0)}to{opacity:.82;transform:scale(1.05) translate3d(2%,-1%,0)}}
@keyframes asHeroScreenSweep{0%,42%{transform:translateX(-72%) rotate(8deg);opacity:0}50%{opacity:1}68%,100%{transform:translateX(72%) rotate(8deg);opacity:0}}
@keyframes asHeroScreenGlow{0%,100%{box-shadow:inset 0 0 16px rgba(125,184,255,.04)}50%{box-shadow:inset 0 0 30px rgba(125,184,255,.16)}}
@keyframes asHeroScreenBreath{0%,100%{filter:brightness(1) saturate(1)}50%{filter:brightness(1.045) saturate(1.04)}}
@keyframes asHeroPhoneFloat1{0%,100%{transform:translate3d(0,0,0) rotate(0)}50%{transform:translate3d(-3px,-8px,0) rotate(-.45deg)}}
@keyframes asHeroPhoneFloat2{0%,100%{transform:translate3d(0,0,0) rotate(0)}50%{transform:translate3d(2px,-10px,0) rotate(.4deg)}}
@keyframes asHeroPhoneFloat3{0%,100%{transform:translate3d(0,0,0) rotate(0)}50%{transform:translate3d(0,-7px,0) rotate(-.3deg)}}
@keyframes asHeroPhoneFloat4{0%,100%{transform:translate3d(0,0,0) rotate(0)}50%{transform:translate3d(3px,-9px,0) rotate(.35deg)}}
@keyframes asHeroPhoneFloat5{0%,100%{transform:translate3d(0,0,0) rotate(0)}50%{transform:translate3d(-2px,-7px,0) rotate(-.3deg)}}
@keyframes asHeroPhoneFloat6{0%,100%{transform:translate3d(0,0,0) rotate(0)}50%{transform:translate3d(2px,-8px,0) rotate(.3deg)}}
@media (prefers-reduced-motion:reduce){
  .as3-stage .as3-motion-glow,.as3-stage .as3-phone,.as3-stage .as3-phone-screen img,
  .as3-stage .as3-screen-shimmer,.as3-stage .as3-screen-glow{animation:none!important}
}
@media (pointer:coarse){
  .as3-stage .as3-motion-glow{inset:3% 2% 7%;filter:blur(12px);opacity:.55;animation-duration:8s}
  .as3-stage{animation:asHeroMobileFloat 7s ease-in-out infinite alternate}
  @keyframes asHeroMobileFloat{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(0,-4px,0) scale(1.012)}}
}
</style>
<script id="apple-seed-hero-motion-script-v1">
(function(){
  "use strict";
  function install(){
    document.querySelectorAll(".as3-stage").forEach(function(stage){
      if(!stage.querySelector(".as3-motion-glow")){
        var glow=document.createElement("span");
        glow.className="as3-motion-glow";
        glow.setAttribute("aria-hidden","true");
        stage.appendChild(glow);
      }
      stage.querySelectorAll(".as3-phone-screen").forEach(function(screen){
        if(screen.querySelector(".as3-screen-shimmer")) return;
        var shimmer=document.createElement("span");
        shimmer.className="as3-screen-shimmer";
        shimmer.setAttribute("aria-hidden","true");
        var glow=document.createElement("span");
        glow.className="as3-screen-glow";
        glow.setAttribute("aria-hidden","true");
        screen.appendChild(glow);
        screen.appendChild(shimmer);
      });
    });
  }
  install();
  window.addEventListener("load",install,{once:true});
  setTimeout(install,400);
  setTimeout(install,1200);
})();
</script>
"""

if "</head>" not in html:
    raise SystemExit("index.html has no </head>; refusing to patch")

html = html.replace("</head>", patch + "\n</head>", 1)
path.write_text(html, encoding="utf-8")
print("Hero motion effects installed.")
