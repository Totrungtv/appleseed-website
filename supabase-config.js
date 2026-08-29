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
 * Apple Seed runtime bridges.
 * 1) Admin: keep Hero Studio preview compatible with both quote styles.
 * 2) Public homepage: read the saved Theme CSS and apply it after the static
 *    Hero CSS, so Admin-selected Hero images/presets actually become visible.
 */
(function appleSeedRuntimeBridge(){
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    if (file === 'admin.html') {
        let done = false;
        const timer = setInterval(function(){
            if (done) return;
            try {
                if (typeof window.heroImagesFromCss !== 'function') return;

                const field = document.getElementById('themeCustomCss');
                const css = String(field?.value || '');
                // Wait until loadTheme()/refreshAll() has populated the textarea.
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

                // Restore AI management access on Admin builds that predate the link.
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
        return;
    }

    // Apply Theme CSS on the public homepage only. Root path also maps to index.html.
    if (file !== 'index.html') return;

    const applyPublicTheme = async function(){
        try {
            const base = String(window.SUPABASE_URL || '').replace(/\/+$/,'');
            const key = String(window.SUPABASE_ANON_KEY || '');
            if (!base || !key) return;

            const res = await fetch(base + '/rest/v1/site_theme_settings?id=eq.1&select=custom_css', {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    apikey: key,
                    Authorization: 'Bearer ' + key
                }
            });
            if (!res.ok) return;
            const rows = await res.json();
            const css = String(rows?.[0]?.custom_css || '').trim();
            if (!css) return;

            const old = document.getElementById('apple-seed-theme-cms-live');
            if (old) old.remove();
            const style = document.createElement('style');
            style.id = 'apple-seed-theme-cms-live';
            style.setAttribute('data-apple-seed-theme', '1');
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
        } catch (err) {
            console.warn('Apple Seed public Theme load:', err);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPublicTheme, {once:true});
    } else {
        applyPublicTheme();
    }
})();
