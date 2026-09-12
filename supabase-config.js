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

/* ===== APPLE SEED HERO SLIDER RUNTIME V1 =====
 * The published Builder config already contains the five slider images,
 * but the legacy index renderer only creates the old six-phone DOM and has
 * no slider runtime.  This bridge reads the published Builder config and
 * mounts the slider directly into the existing Hero stage on both Desktop
 * and Mobile.  It does not alter the Hero copy or lower sections.
 */
(function appleSeedHeroSliderRuntime(){
    "use strict";

    const path = location.pathname.split('/').pop().toLowerCase();
    if (path && path !== 'index.html') return;

    const SUPABASE_URL = window.SUPABASE_URL;
    const client = window.supabaseClient;
    if (!SUPABASE_URL || !client) return;

    const STYLE_ID = 'apple-seed-hero-slider-runtime-v1';
    const ROOT_ID = 'apple-seed-runtime-slider';
    let mounted = false;

    function getSliderConfig(config){
        const items = config && config.items ? config.items : {};
        for (const key of Object.keys(items)) {
            const item = items[key];
            if (item && item.slider && Array.isArray(item.slider.images) && item.slider.images.length) {
                return item.slider;
            }
        }
        return null;
    }

    function installStyle(){
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
          .as3-stage.apple-seed-runtime-slider-host{
            position:relative!important;
            overflow:visible!important;
          }
          .as3-stage.apple-seed-runtime-slider-host > .as3-phone{
            display:none!important;
          }
          .as3-stage.apple-seed-runtime-slider-host > .apple-seed-runtime-slider{
            position:absolute!important;
            inset:0!important;
            width:100%!important;
            height:100%!important;
            display:block!important;
            overflow:hidden!important;
            z-index:10!important;
            border-radius:18px!important;
          }
          .apple-seed-runtime-slider-track{
            display:flex!important;
            width:100%!important;
            height:100%!important;
            margin:0!important;
            padding:0!important;
            transform:translate3d(0,0,0);
            transition:transform .45s ease;
          }
          .apple-seed-runtime-slide{
            position:relative!important;
            flex:0 0 100%!important;
            width:100%!important;
            height:100%!important;
            margin:0!important;
            padding:0!important;
            overflow:hidden!important;
            background:#f5f7fb!important;
          }
          .apple-seed-runtime-slide img{
            display:block!important;
            width:100%!important;
            height:100%!important;
            margin:0!important;
            padding:0!important;
            border:0!important;
            object-fit:cover!important;
            object-position:center!important;
            user-select:none!important;
            -webkit-user-drag:none!important;
          }
          .apple-seed-runtime-caption{
            position:absolute!important;
            left:18px!important;
            right:18px!important;
            bottom:18px!important;
            z-index:4!important;
            color:#fff!important;
            font-size:12px!important;
            line-height:1.2!important;
            font-weight:900!important;
            letter-spacing:2px!important;
            text-transform:uppercase!important;
            text-shadow:0 2px 12px rgba(0,0,0,.75)!important;
            pointer-events:none!important;
          }
          .apple-seed-runtime-arrow{
            position:absolute!important;
            top:50%!important;
            transform:translateY(-50%)!important;
            width:40px!important;
            height:40px!important;
            border:1px solid rgba(255,255,255,.65)!important;
            border-radius:50%!important;
            background:rgba(10,18,30,.38)!important;
            color:#fff!important;
            display:grid!important;
            place-items:center!important;
            z-index:8!important;
            cursor:pointer!important;
            font-size:23px!important;
            line-height:1!important;
            padding:0!important;
          }
          .apple-seed-runtime-arrow:hover{background:rgba(10,18,30,.62)!important}
          .apple-seed-runtime-prev{left:12px!important}
          .apple-seed-runtime-next{right:12px!important}
          .apple-seed-runtime-dots{
            position:absolute!important;
            left:50%!important;
            bottom:10px!important;
            transform:translateX(-50%)!important;
            display:flex!important;
            gap:6px!important;
            z-index:8!important;
          }
          .apple-seed-runtime-dot{
            width:7px!important;
            height:7px!important;
            min-width:7px!important;
            padding:0!important;
            border:0!important;
            border-radius:50%!important;
            background:rgba(255,255,255,.58)!important;
            cursor:pointer!important;
          }
          .apple-seed-runtime-dot.active{background:#fff!important;transform:scale(1.25)!important}
          @media(max-width:760px){
            .as3-stage.apple-seed-runtime-slider-host > .apple-seed-runtime-slider{
              border-radius:14px!important;
            }
            .apple-seed-runtime-caption{font-size:10px!important;left:12px!important;right:12px!important;bottom:13px!important}
            .apple-seed-runtime-arrow{width:34px!important;height:34px!important;font-size:20px!important}
          }
        `;
        document.head.appendChild(style);
    }

    function mountSlider(slider){
        if (mounted) return true;
        const stage = document.querySelector('.as3-stage');
        if (!stage) return false;

        const images = (slider.images || []).filter(item => item && item.src);
        if (!images.length) return false;

        installStyle();

        stage.classList.add('apple-seed-runtime-slider-host');
        stage.querySelectorAll(':scope > .as3-phone').forEach(phone => phone.remove());

        const root = document.createElement('div');
        root.id = ROOT_ID;
        root.className = 'apple-seed-runtime-slider';
        root.setAttribute('aria-label', 'Apple Seed Hero Slider');

        const track = document.createElement('div');
        track.className = 'apple-seed-runtime-slider-track';

        const captions = [
            'PRECISION iPHONE REPAIR',
            'BOARD-LEVEL DIAGNOSTICS',
            'FACE ID & TRUE TONE',
            'BATTERY & DISPLAY SERVICE',
            'PROFESSIONAL iPHONE CARE'
        ];

        images.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'apple-seed-runtime-slide';

            const img = document.createElement('img');
            img.src = String(item.src);
            img.alt = String(item.title || 'Apple Seed iPhone repair');
            img.loading = index === 0 ? 'eager' : 'lazy';
            img.decoding = 'async';
            img.draggable = false;
            img.style.objectFit = item.fit || 'cover';
            img.style.objectPosition = item.pos || 'center';
            slide.appendChild(img);

            const caption = document.createElement('div');
            caption.className = 'apple-seed-runtime-caption';
            caption.textContent = captions[index] || String(item.title || 'Apple Seed');
            slide.appendChild(caption);

            track.appendChild(slide);
        });

        root.appendChild(track);

        let index = 0;
        const count = images.length;
        const showArrows = slider.showArrows !== false && count > 1;
        const showDots = slider.showDots !== false && count > 1;
        const intervalMs = Math.max(2000, Number(slider.interval || 5) * 1000);
        let timer = null;

        function render(){
            track.style.transform = `translate3d(${-index * 100}%,0,0)`;
            root.querySelectorAll('.apple-seed-runtime-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        if (showArrows) {
            const prev = document.createElement('button');
            prev.type = 'button';
            prev.className = 'apple-seed-runtime-arrow apple-seed-runtime-prev';
            prev.setAttribute('aria-label', 'Ảnh trước');
            prev.textContent = '‹';
            prev.addEventListener('click', function(){
                index = (index - 1 + count) % count;
                render();
                restart();
            });

            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'apple-seed-runtime-arrow apple-seed-runtime-next';
            next.setAttribute('aria-label', 'Ảnh tiếp theo');
            next.textContent = '›';
            next.addEventListener('click', function(){
                index = (index + 1) % count;
                render();
                restart();
            });

            root.appendChild(prev);
            root.appendChild(next);
        }

        if (showDots) {
            const dots = document.createElement('div');
            dots.className = 'apple-seed-runtime-dots';
            images.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'apple-seed-runtime-dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Chuyển đến ảnh ${i + 1}`);
                dot.addEventListener('click', function(){
                    index = i;
                    render();
                    restart();
                });
                dots.appendChild(dot);
            });
            root.appendChild(dots);
        }

        stage.insertBefore(root, stage.firstChild);
        mounted = true;
        render();

        function stop(){
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }
        function start(){
            stop();
            if (slider.autoplay !== false && count > 1) {
                timer = setInterval(function(){
                    index = (index + 1) % count;
                    render();
                }, intervalMs);
            }
        }
        function restart(){ start(); }

        if (slider.pauseOnHover !== false) {
            root.addEventListener('mouseenter', stop);
            root.addEventListener('mouseleave', start);
            root.addEventListener('touchstart', stop, {passive:true});
            root.addEventListener('touchend', function(){ setTimeout(start, 1200); }, {passive:true});
        }
        start();
        return true;
    }

    async function loadPublishedSlider(){
        try {
            const result = await client
                .from('site_builder_versions')
                .select('version_no,config')
                .eq('site_key', 'default')
                .eq('status', 'published')
                .order('version_no', {ascending:false})
                .limit(1)
                .maybeSingle();

            if (result.error || !result.data) {
                console.warn('Apple Seed Hero Slider: cannot load published Builder config', result.error || 'no version');
                return;
            }

            let config = result.data.config;
            if (typeof config === 'string') {
                try { config = JSON.parse(config); } catch (_) { config = null; }
            }

            const slider = getSliderConfig(config);
            if (!slider) {
                console.warn('Apple Seed Hero Slider: no slider config found');
                return;
            }

            const ready = mountSlider(slider);
            if (!ready) {
                let tries = 0;
                const retry = setInterval(function(){
                    tries += 1;
                    if (mountSlider(slider) || tries >= 30) clearInterval(retry);
                }, 200);
            }
        } catch (err) {
            console.warn('Apple Seed Hero Slider runtime:', err);
        }
    }

    function boot(){
        loadPublishedSlider();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, {once:true});
    } else {
        boot();
    }
})();
