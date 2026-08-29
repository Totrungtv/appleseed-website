// AppleSeed Supabase configuration

window.SUPABASE_URL =
    "https://nuismqcjyutqigdydfkg.supabase.co";

window.SUPABASE_ANON_KEY =
    "sb_publishable_Z3pTEseMEeoiGU9dYJ1NwQ_Ko7li9Sz";

window.supabaseClient =
    window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );

/* Apple Seed Admin compatibility bridge. */
(function appleSeedAdminCompatibility(){
    if (location.pathname.split('/').pop().toLowerCase() !== 'admin.html') return;

    function injectHeroPreviewSync(){
        if (document.getElementById('apple-seed-admin-hero-preview-sync')) return;
        const style = document.createElement('style');
        style.id = 'apple-seed-admin-hero-preview-sync';
        style.textContent = `
          /* Admin image boxes mirror the real index Hero source ratios. */
          .hero-image-manager .hero-image-card[data-hero-slot="background"] .hero-image-preview{
            aspect-ratio:16/6!important;
            height:auto!important;
            min-height:150px!important;
            max-height:190px!important;
            background:#f8fafc!important;
          }
          .hero-image-manager .hero-image-card[data-hero-slot^="phone"] .hero-image-preview{
            aspect-ratio:1/2!important;
            height:auto!important;
            min-height:300px!important;
            max-height:360px!important;
            background:
              linear-gradient(90deg,transparent 49.5%,rgba(37,99,235,.07) 50%,transparent 50.5%),
              linear-gradient(transparent 49.5%,rgba(37,99,235,.07) 50%,transparent 50.5%),
              #f8fafc!important;
            background-size:100% 100%,100% 100%!important;
          }
          .hero-image-manager .hero-image-card[data-hero-slot^="phone"] .hero-image-preview img{
            width:100%!important;
            height:100%!important;
            object-fit:contain!important;
            object-position:center!important;
            padding:10px!important;
          }
          .hero-image-manager .hero-image-card[data-hero-slot="background"] small::after{
            content:"  •  Kích thước chuẩn: 1920×720 px (16:6, phù hợp khung Hero hiện tại).";
            font-weight:700;
            color:#2563eb;
          }
          .hero-image-manager .hero-image-card[data-hero-slot^="phone"] small::after{
            content:"  •  Chuẩn khuyến nghị: 1000×2000 px (tỷ lệ 1:2), PNG/WebP trong suốt.";
            font-weight:700;
            color:#2563eb;
          }
          .hero-image-manager .hero-image-card[data-hero-slot^="phone"] h4::after{
            content:"  •  hiển thị trực tiếp trên Hero index";
            display:block;
            margin-top:3px;
            font-size:10px;
            color:#667085;
            font-weight:500;
          }
          @media(max-width:750px){
            .hero-image-manager .hero-image-card[data-hero-slot^="phone"] .hero-image-preview{
              min-height:270px!important;
              max-height:320px!important;
            }
          }
        `;
        document.head.appendChild(style);
    }

    let done = false;
    const timer = setInterval(function(){
        if (done) return;
        try {
            injectHeroPreviewSync();

            if (typeof window.heroImagesFromCss !== 'function') return;

            const field = document.getElementById('themeCustomCss');
            const css = String(field?.value || '');
            if (!field || !css || !css.includes('APPLESEED_HERO_IMAGES_START')) return;

            window.heroImagesFromCss = function(cssValue){
                const out = {};
                const s = String(cssValue || '');
                const start = '/* APPLESEED_HERO_IMAGES_START */';
                const end = '/* APPLESEED_HERO_IMAGES_END */';
                const a = s.indexOf(start);
                const b = s.indexOf(end);
                if (a < 0 || b < a) return out;
                const block = s.slice(a, b + end.length);

                const readUrl = function(selector){
                    const escaped = selector.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
                    const re = new RegExp(
                        escaped + '\\s*\\{[^}]*background-image\\s*:\\s*url\\(\\s*["\\\']?([^"\\\'\\)]+)["\\\']?\\s*\\)',
                        'i'
                    );
                    const m = block.match(re);
                    return m ? String(m[1]).replace(/\\\\(["\\\'])/g, '$1').trim() : '';
                };

                const bg = readUrl('#apple-seed-premium-home');
                if (bg) out.background = bg;
                for (let i = 1; i <= 6; i++) {
                    const u = readUrl('#apple-seed-premium-home .as3-p' + i);
                    if (u) out['phone' + (i - 1)] = u;
                }
                return out;
            };

            if (typeof window.renderHeroImageFields === 'function') window.renderHeroImageFields(css);

            const actions = document.querySelector('.admin-top .admin-actions');
            if (actions && !actions.querySelector('a[href="ai-admin.html"]')) {
                const link = document.createElement('a');
                link.className = 'btn2 admin-ai-link';
                link.href = 'ai-admin.html';
                link.textContent = '🤖 Quản lý AI';
                actions.insertBefore(link, actions.firstElementChild?.nextElementSibling || null);
            }

            done = true;
            clearInterval(timer);
        } catch (err) {
            console.warn('Apple Seed Admin compatibility bridge:', err);
        }
    }, 100);

    setTimeout(function(){ clearInterval(timer); }, 20000);
})();
