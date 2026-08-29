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

/* Public homepage: apply the Hero images saved by Admin. */
(function appleSeedPublicHeroImages(){
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (file !== 'index.html') return;

    const HERO = '#apple-seed-premium-home';
    const START = '/* APPLESEED_HERO_IMAGES_START */';
    const END = '/* APPLESEED_HERO_IMAGES_END */';

    function parseImages(css){
        const s = String(css || '');
        const a = s.indexOf(START);
        const b = s.indexOf(END);
        if (a < 0 || b <= a) return {};
        const block = s.slice(a, b + END.length);
        const out = {};

        function read(selector){
            const esc = selector.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            const re = new RegExp(esc + '\\s*\\{[^}]*background-image\\s*:\\s*url\\(\\s*["\\\']?([^"\\\'\\)]+)["\\\']?\\s*\\)', 'i');
            const m = block.match(re);
            return m ? String(m[1]).trim() : '';
        }

        out.background = read(HERO);
        for (let i = 1; i <= 6; i++) out['phone' + i] = read(HERO + ' .as3-p' + i);
        return out;
    }

    function applyHero(img){
        const hero = document.querySelector(HERO);
        if (!hero || !img) return false;

        if (img.background) {
            hero.style.setProperty('background-image', 'url("' + img.background.replace(/"/g, '\\"') + '")', 'important');
            hero.style.setProperty('background-size', 'cover', 'important');
            hero.style.setProperty('background-position', 'center center', 'important');
            hero.style.setProperty('background-repeat', 'no-repeat', 'important');
        }

        const stage = hero.querySelector('.as3-stage');
        if (stage) stage.style.setProperty('background-image', 'none', 'important');

        for (let i = 1; i <= 6; i++) {
            const phone = hero.querySelector('.as3-p' + i);
            const url = img['phone' + i];
            if (!phone) continue;

            phone.style.setProperty('background-image', url ? 'url("' + url.replace(/"/g, '\\"') + '")' : 'none', 'important');
            phone.style.setProperty('background-repeat', 'no-repeat', 'important');
            phone.style.setProperty('background-position', 'center center', 'important');
            phone.style.setProperty('background-size', 'contain', 'important');
            phone.style.setProperty('filter', 'none', 'important');

            phone.querySelector('.as3-screen')?.style.setProperty('background', 'transparent', 'important');
            phone.querySelector('.as3-screen')?.style.setProperty('background-image', 'none', 'important');
            phone.querySelector('.as3-island')?.style.setProperty('display', 'none', 'important');
            phone.querySelector('.as3-label')?.style.setProperty('display', 'none', 'important');
            phone.style.setProperty('border-radius', '0', 'important');
            phone.style.setProperty('padding', '0', 'important');
            phone.style.setProperty('background-color', 'transparent', 'important');
        }
        return true;
    }

    async function loadTheme(){
        try {
            const base = String(window.SUPABASE_URL || '').replace(/\\/+$/, '');
            const key = String(window.SUPABASE_ANON_KEY || '');
            if (!base || !key) return;

            const res = await fetch(base + '/rest/v1/site_theme_settings?id=eq.1&select=custom_css', {
                method:'GET',
                cache:'no-store',
                headers:{apikey:key, Authorization:'Bearer ' + key}
            });
            if (!res.ok) return;
            const rows = await res.json();
            const css = String(rows?.[0]?.custom_css || '');
            const img = parseImages(css);
            if (!Object.values(img).some(Boolean)) return;

            let tries = 0;
            const timer = setInterval(function(){
                if (applyHero(img) || ++tries >= 80) clearInterval(timer);
            }, 100);
        } catch (err) {
            console.warn('Apple Seed public Hero images:', err);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadTheme, {once:true});
    else loadTheme();
})();
