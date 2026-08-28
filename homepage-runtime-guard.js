/* Apple Seed homepage runtime resilience v1
 * UI-only fallback: never touches Supabase data.
 * If the CMS renderer is slow/unavailable, restore a functional home
 * surface with the shop map, contact links and core navigation.
 */
(function(){
  "use strict";

  const ROOT_ID = "homeRenderer";
  const FALLBACK_MARK = "data-apple-seed-home-fallback";

  function esc(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c];
    });
  }

  function fallbackHtml(){
    return `
      <section class="hero as-home-fallback" id="gioi-thieu" ${FALLBACK_MARK}="1">
        <div class="hero-inner">
          <div>
            <img class="shop-photo" src="shop.jpg"
                 alt="Cửa hàng Apple Seed Trà Vinh - trung tâm sửa chữa iPhone"
                 onerror="this.style.display='none'">
          </div>
          <div>
            <div class="eyebrow">APPLE SEED • TRÀ VINH</div>
            <h1>Trung tâm sửa chữa iPhone</h1>
            <p class="lead">Kiểm tra, chẩn đoán và sửa chữa iPhone, Face ID, main, pin, màn hình và linh kiện. Tư vấn rõ tình trạng trước khi sửa.</p>
            <div class="as-fallback-actions">
              <a class="cta" href="booking.html">📅 Đặt lịch sửa</a>
              <a class="as-fallback-secondary" href="tel:0898888269">☎ Gọi Apple Seed</a>
            </div>
          </div>
        </div>
      </section>

      <section class="services as-home-fallback" id="dich-vu" ${FALLBACK_MARK}="1">
        <div class="section-kicker">DỊCH VỤ CỐT LÕI</div>
        <h2>Sửa iPhone chuyên sâu</h2>
        <div class="service-grid">
          <article class="service-card"><div class="service-icon">📱</div><div><h3>Sửa iPhone</h3><p>Kiểm tra lỗi phần cứng, phần mềm và tư vấn phương án sửa.</p></div></article>
          <article class="service-card"><div class="service-icon">🔧</div><div><h3>Sửa main</h3><p>Chẩn đoán mất nguồn, chạm nguồn, mất áp và lỗi board.</p></div></article>
          <article class="service-card"><div class="service-icon">🔐</div><div><h3>Face ID</h3><p>Kiểm tra và xử lý lỗi Face ID theo tình trạng máy.</p></div></article>
          <article class="service-card"><div class="service-icon">🔋</div><div><h3>Pin • Màn • Camera</h3><p>Thay thế linh kiện phù hợp, báo rõ trước khi thực hiện.</p></div></article>
        </div>
      </section>

      <section class="contact as-home-fallback" id="lien-he" ${FALLBACK_MARK}="1">
        <div class="contact-inner">
          <div class="contact-card">
            <div class="section-kicker">APPLE SEED • TRÀ VINH</div>
            <h2>Đến Apple Seed</h2>
            <p>292 Phạm Ngũ Lão, Trà Vinh. Có thể gọi trực tiếp hoặc mở bản đồ để đi đến cửa hàng.</p>
            <div class="contact-list">
              <a href="tel:0898888269">☎ 0898888269</a>
              <a href="https://maps.app.goo.gl/QEWg9owQidGW5ZyG7" target="_blank" rel="noopener noreferrer">🗺 Mở Google Maps</a>
              <a href="booking.html">📅 Đặt lịch trước</a>
            </div>
          </div>
          <div class="map-card">
            <div class="map-title">📍 Vị trí Apple Seed Trà Vinh</div>
            <iframe title="Google Maps Apple Seed Trà Vinh"
              src="https://www.google.com/maps?q=AppleSeed%20292%20Ph%E1%BA%A1m%20Ng%C5%A9%20L%C3%A3o%20Tr%C3%A0%20Vinh&output=embed"
              loading="eager" referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen></iframe>
          </div>
        </div>
      </section>
    `;
  }

  function addStyles(){
    if(document.getElementById("apple-seed-home-runtime-style")) return;
    const style=document.createElement("style");
    style.id="apple-seed-home-runtime-style";
    style.textContent=`
      .as-fallback-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
      .as-fallback-secondary{
        display:inline-flex;align-items:center;justify-content:center;min-height:50px;
        padding:14px 20px;border-radius:15px;border:1px solid #cfe0f6;
        background:#fff;color:#1769ff;font-weight:900;text-decoration:none
      }
      .as-fallback-secondary:hover{background:#f4f8ff}
      .as-home-fallback .map-card iframe{min-height:300px}
      @media(max-width:560px){
        .as-fallback-actions{display:grid;grid-template-columns:1fr}
        .as-fallback-actions a{width:100%}
        .as-home-fallback .map-card iframe{min-height:270px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderFallback(reason){
    const root=document.getElementById(ROOT_ID);
    if(!root) return false;
    if(root.querySelector("["+FALLBACK_MARK+"]")) return true;

    root.innerHTML=fallbackHtml();
    addStyles();
    root.dataset.appleSeedHomeFallbackReason=reason||"unknown";
    document.dispatchEvent(new CustomEvent("appleSeedHomeFallbackReady"));
    return true;
  }

  function isStillLoading(){
    const root=document.getElementById(ROOT_ID);
    if(!root) return false;
    return /Đang tải Apple Seed/i.test(root.textContent||"") && !root.querySelector("section[id]");
  }

  function wireCoreNavigation(){
    document.addEventListener("click",function(e){
      const link=e.target && e.target.closest ? e.target.closest("a") : null;
      if(!link) return;
      const href=link.getAttribute("href")||"";
      if(!href.startsWith("#")) return;
      const target=document.querySelector(href);
      if(!target) return;
      e.preventDefault();
      const header=document.querySelector(".site-header");
      const offset=(header ? header.offsetHeight : 86)+8;
      const y=target.getBoundingClientRect().top+window.pageYOffset-offset;
      window.scrollTo({top:Math.max(0,y),behavior:"smooth"});
      try{history.replaceState(null,"",href)}catch(_){}
    },false);
  }

  function start(){
    const root=document.getElementById(ROOT_ID);
    if(!root) return;

    wireCoreNavigation();

    // Give the CMS a short head start, then guarantee a usable page.
    setTimeout(function(){
      if(isStillLoading()) renderFallback("cms-timeout");
    },1800);

    // If an earlier script fails before replacing the placeholder, recover.
    window.addEventListener("error",function(){
      if(isStillLoading()) renderFallback("runtime-error");
    },false);

    window.addEventListener("unhandledrejection",function(){
      if(isStillLoading()) renderFallback("promise-rejection");
    },false);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }

  window.AppleSeedHomeRuntime={
    renderFallback:renderFallback,
    getStatus:function(){
      const root=document.getElementById(ROOT_ID);
      return root ? {fallback:!!root.querySelector("["+FALLBACK_MARK+"]"),loading:isStillLoading()} : {missing:true};
    }
  };
})();