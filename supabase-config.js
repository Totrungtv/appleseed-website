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
 * This file is loaded by admin.html before its inline script, so the bridge
 * waits until Hero Studio has defined its functions, then fixes URL parsing
 * for both single-quoted and double-quoted CSS url(...) values.
 * It also restores the AI management button if an older admin shell omitted it.
 */
(function appleSeedAdminCompatibility(){
    if (location.pathname.split('/').pop().toLowerCase() !== 'admin.html') return;

    let done = false;
    const timer = setInterval(function(){
        if (done) return;

        try {
            if (typeof window.heroImagesFromCss === 'function') {
                const original = window.heroImagesFromCss;
                window.heroImagesFromCss = function(css){
                    const out = {};
                    const s = String(css || '');
                    const start = '/* APPLESEED_HERO_IMAGES_START */';
                    const end = '/* APPLESEED_HERO_IMAGES_END */';
                    const a = s.indexOf(start);
                    const b = s.indexOf(end);
                    if (a < 0 || b < a) return out;

                    const block = s.slice(a, b + end.length);
                    const readUrl = function(selector){
                        const escaped = selector.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
                        const re = new RegExp(escaped + '\\s*\\{[^}]*background-image\\s*:\\s*url\\(\\s*[\"\\\']?([^\"\\\'\\)]+)[\"\\\']?\\s*\\)', 'i');
                        const m = block.match(re);
                        return m ? String(m[1]).replace(/\\\\([\"\\\'])/g, '$1').trim() : '';
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
                    const css = document.getElementById('themeCustomCss')?.value || '';
                    window.renderHeroImageFields(css);
                }
                done = true;
                clearInterval(timer);

                // Restore AI management access without changing the rest of Admin.
                const actions = document.querySelector('.admin-top .admin-actions');
                if (actions && !actions.querySelector('a[href="ai-admin.html"]')) {
                    const link = document.createElement('a');
                    link.className = 'btn2 admin-ai-link';
                    link.href = 'ai-admin.html';
                    link.textContent = '🤖 Quản lý AI';
                    actions.insertBefore(link, actions.firstElementChild?.nextElementSibling || null);
                }
            }
        } catch (err) {
            console.warn('Apple Seed Admin compatibility bridge:', err);
        }
    }, 100);

    setTimeout(function(){ clearInterval(timer); }, 15000);
})();
