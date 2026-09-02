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

/* Apple Seed Entertainment runtime loader.
 * Scoped to entertainment.html so other pages are untouched.
 */
(function appleSeedEntertainmentRuntimeLoader(){
    if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'entertainment.html') return;
    if (document.querySelector('script[data-apple-seed-entertainment-runtime]')) return;
    const script = document.createElement('script');
    script.src = './entertainment-runtime-v4.js';
    script.async = false;
    script.dataset.appleSeedEntertainmentRuntime = '1';
    (document.head || document.documentElement).appendChild(script);
})();

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

          /* --- New: make the preview box hug the uploaded image ---
             No oversized white frame. The actual image determines the preview size.
          */
          .hero-image-manager .hero-image-card[data-hero-slot^="phone"] .hero-image-preview,
          .hero-image-manager .hero-image-card[data-hero-slot="background"] .hero-image-preview{
            aspect-ratio:auto!important;
            height:auto!important;
            min-height:0!important;
            max-height:none!important;
            display:block!important;
            width:100%!important;
            overflow:visible!important;
            background:#f8fafc!important;
            padding:0!important;
            text-align:center!important;
          }
          .hero-image-manager .hero-image-card[data-hero-slot^="phone"] .hero-image-preview img,
          .hero-image-manager .hero-image-card[data-hero-slot="background"] .hero-image-preview img{
            display:block!important;
            width:auto!important;
            height:auto!important;
            max-width:100%!important;
            max-height:420px!important;
            margin:0 auto!important;
            padding:0!important;
            object-fit:contain!important;
            object-position:center!important;
          }
          .hero-image-manager .hero-image-card[data-hero-slot="background"] .hero-image-preview img{
            max-height:260px!important;
            max-width:100%!important;
          }
          .hero-image-manager .hero-image-card[data-hero-slot^="phone"] .hero-image-preview.empty,
          .hero-image-manager .hero-image-card[data-hero-slot="background"] .hero-image-preview.empty{
            min-height:150px!important;
            display:flex!important;
            align-items:center!important;
            justify-content:center!important;
          }
          @media(max-width:750px){
            .hero-image-manager .hero-image-card[data-hero-slot^="phone"] .hero-image-preview img{
              max-height:360px!important;
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

/*
 * Hero Save Guard
 *
 * The Admin image manager stores Hero images inside site_theme_settings.custom_css.
 * Its normal save routine rebuilds that CSS from the Admin textarea.  When another
 * layout patch has been added to the live Theme, that textarea can be stale and
 * saving an image can therefore erase the working phone layout.
 *
 * This guard always takes the latest custom_css from Supabase, replaces only the
 * Hero image block with the images currently selected in Admin, and then lets the
 * existing save routine persist the merged CSS.  Layout CSS outside the image block
 * is therefore preserved across every image save.
 */
(function appleSeedHeroSaveGuard(){
    if (location.pathname.split('/').pop().toLowerCase() !== 'admin.html') return;

    let wrappedSave = null;
    let originalSave = null;

    function stripAllHeroImageBlocks(css){
        const start = '/* APPLESEED_HERO_IMAGES_START */';
        const end = '/* APPLESEED_HERO_IMAGES_END */';
        let s = String(css || '');
        let guard = 0;
        while (guard++ < 20) {
            const a = s.indexOf(start);
            if (a < 0) break;
            const b = s.indexOf(end, a);
            if (b < 0) break;
            s = (s.slice(0, a) + s.slice(b + end.length)).trim();
        }
        return s;
    }

    async function mergeLatestThemeBeforeSave(){
        const field = document.getElementById('themeCustomCss');
        const client = window.supabaseClient;
        if (!field || !client) return;

        const localCss = String(field.value || '');
        const images = typeof window.heroImagesFromCss === 'function'
            ? window.heroImagesFromCss(localCss)
            : {};
        const phoneFit = document.getElementById('heroPhoneFit')?.value || 'contain';
        const backgroundFit = document.getElementById('heroBackgroundFit')?.value || 'cover';

        const remote = await client
            .from('site_theme_settings')
            .select('custom_css')
            .eq('id', 1)
            .maybeSingle();

        if (remote.error || !remote.data) return;

        let css = stripAllHeroImageBlocks(String(remote.data.custom_css || ''));
        let block = '';

        if (typeof window.heroImageBlock === 'function') {
            block = Object.keys(images).length
                ? window.heroImageBlock(images, phoneFit, backgroundFit)
                : '';
        }

        field.value = (css ? css + '\n\n' : '') + block;
    }

    const timer = setInterval(function(){
        try {
            const fn = window.saveHeroImages;
            const btn = document.getElementById('saveHeroImagesBtn');

            if (typeof fn !== 'function' || !btn) return;

            if (fn.__appleSeedHeroSaveGuard) {
                if (wrappedSave && btn.onclick !== wrappedSave) btn.onclick = wrappedSave;
                return;
            }

            originalSave = fn;
            wrappedSave = async function(){
                try {
                    await mergeLatestThemeBeforeSave();
                } catch (err) {
                    console.warn('Apple Seed Hero Save Guard merge:', err);
                }
                return originalSave.apply(this, arguments);
            };

            wrappedSave.__appleSeedHeroSaveGuard = true;
            wrappedSave.__appleSeedOriginal = originalSave;
            window.saveHeroImages = wrappedSave;
            btn.onclick = wrappedSave;
        } catch (err) {
            console.warn('Apple Seed Hero Save Guard:', err);
        }
    }, 100);

    setTimeout(function(){ clearInterval(timer); }, 30000);
})();
