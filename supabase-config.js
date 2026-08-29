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

/* Apple Seed Admin compatibility bridge.
 * Fixes Hero Studio preview parsing and restores the AI button on older shells.
 * It intentionally waits until Theme data has finished loading, then re-renders.
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
            // Do not finish early while refreshAll()/loadTheme() is still populating the form.
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

            // Restore AI management access without touching other Admin modules.
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
