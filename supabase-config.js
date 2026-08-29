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

/*
 * Apple Seed Admin compatibility bridge.
 * Hero Studio preview remains compatible with both single- and double-quoted
 * CSS url(...) values, and the AI management link is restored on Admin.
 * The public homepage intentionally does NOT apply custom Theme CSS here,
 * so the Hero returns to its stable index.html presentation during rollback.
 */
(function appleSeedAdminCompatibility(){
    if (location.pathname.split('/').pop().toLowerCase() !== 'admin.html') return;

    let done = false;
    const timer = setInterval(function(){
        if (done) return;
        try {
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
                        escaped + '\\s*\\{[^}]*background-image\\s*:\\s*url\\(\\s*[\"\\\']?([^\"\\\'\\)]+)[\"\\\']?\\s*\\)',
                        'i'
                    );
                    const m = block.match(re);
                    return m
                        ? String(m[1]).replace(/\\\\([\"\\\'])/g, '$1').trim()
                        : '';
                };

                const bg = readUrl('#apple-seed-premium-home');
                if (bg) out.background = bg;
                for (let i = 1; i <= 6; i++) {
                    const u = readUrl('#apple-seed-premium-home .as3-p' + i);
                    if (u) out['phone' + (i - 1)] = u;
                }
                return out;
            };

            if (typeof window.renderHeroImageFields === 'function') {
                window.renderHeroImageFields(css);
            }

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
 * Public index Hero background bridge.
 * index.html already loads this configuration before the Hero runtime.
 * It reads ONLY the saved Hero background URL from site_theme_settings and
 * applies it to #apple-seed-premium-home. It does not alter the phone layout,
 * routes, lower sections, Member, AI, or the existing HTML structure.
 */
(function appleSeedIndexHeroBackground(){
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (file !== 'index.html') return;

    const SELECTOR = '#apple-seed-premium-home';
    const STYLE_ID = 'apple-seed-index-hero-background-bridge';

    function extractBackgroundUrl(css){
        const s = String(css || '');
        const start = '/* APPLESEED_HERO_IMAGES_START */';
        const end = '/* APPLESEED_HERO_IMAGES_END */';
        const a = s.indexOf(start);
        const b = s.indexOf(end);
        const block = a >= 0 && b > a ? s.slice(a, b + end.length) : s;
        const escaped = SELECTOR.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
        const patterns = [
            new RegExp(escaped + '\\s*\\{[^}]*background-image\\s*:\\s*url\\(\\s*[\"\\\']?([^\"\\\'\\)]+)[\"\\\']?\\s*\\)', 'i'),
            new RegExp(escaped + '\\s*\\{[^}]*background\\s*:\\s*url\\(\\s*[\"\\\']?([^\"\\\'\\)]+)[\"\\\']?\\s*\\)', 'i')
        ];
        for (const re of patterns) {
            const m = block.match(re);
            if (m?.[1]) return String(m[1]).replace(/\\([\"'])/g, '$1').trim();
        }
        return '';
    }

    function applyBackground(url){
        const hero = document.querySelector(SELECTOR);
        if (!hero || !url) return false;

        hero.style.setProperty('background-image', `url("${url.replace(/"/g, '\\"')}")`, 'important');
        hero.style.setProperty('background-size', 'cover', 'important');
        hero.style.setProperty('background-position', 'center center', 'important');
        hero.style.setProperty('background-repeat', 'no-repeat', 'important');

        let style = document.getElementById(STYLE_ID);
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `${SELECTOR}{background-repeat:no-repeat!important;background-position:center center!important;background-size:cover!important}`;
            (document.head || document.documentElement).appendChild(style);
        }
        return true;
    }

    async function load(){
        try {
            const base = String(window.SUPABASE_URL || '').replace(/\\/+$/, '');
            const key = String(window.SUPABASE_ANON_KEY || '');
            if (!base || !key) return;

            const res = await fetch(
                base + '/rest/v1/site_theme_settings?id=eq.1&select=custom_css',
                {
                    method:'GET',
                    cache:'no-store',
                    headers:{
                        apikey:key,
                        Authorization:'Bearer ' + key
                    }
                }
            );
            if (!res.ok) return;
            const rows = await res.json();
            const css = String(rows?.[0]?.custom_css || '');
            const url = extractBackgroundUrl(css);
            if (!url) return;

            let tries = 0;
            const tick = () => {
                if (applyBackground(url)) return;
                if (++tries < 80) setTimeout(tick, 250);
            };
            tick();
        } catch (err) {
            console.warn('Apple Seed index Hero background bridge:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load, {once:true});
    } else {
        load();
    }
})();
