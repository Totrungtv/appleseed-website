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
        return;
    }

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

/*
 * Hero artwork renderer.
 * The Admin supplies a transparent PNG/WebP per slot (1000x2000 recommended).
 * This layer removes the old decorative phone shell and lets each uploaded
 * artwork keep its own aspect ratio, so the entire phone artwork stays visible.
 */
(function appleSeedHeroArtwork(){
    if ((location.pathname.split('/').pop() || 'index.html').toLowerCase() !== 'index.html') return;

    const STYLE_ID = 'apple-seed-hero-artwork-fit-v1';

    function installStyle(){
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
#apple-seed-premium-home .as3-stage{
  position:relative!important;
  height:520px!important;
  min-height:520px!important;
  overflow:visible!important;
}
#apple-seed-premium-home .as3-stage .as3-phone{
  display:none!important;
  position:absolute!important;
  width:145px!important;
  height:290px!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  filter:none!important;
  transform-origin:center center!important;
}
#apple-seed-premium-home .as3-stage .as3-phone.as3-cms-has-image{
  display:block!important;
}
#apple-seed-premium-home .as3-stage .as3-phone:before,
#apple-seed-premium-home .as3-stage .as3-phone:after,
#apple-seed-premium-home .as3-stage .as3-phone .as3-island{
  display:none!important;
}
#apple-seed-premium-home .as3-stage .as3-screen{
  position:absolute!important;
  inset:0!important;
  overflow:visible!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
}
#apple-seed-premium-home .as3-stage .as3-screen img[data-cms-hero-phone="1"]{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  max-width:none!important;
  max-height:none!important;
  padding:0!important;
  object-fit:contain!important;
  object-position:center center!important;
  border-radius:0!important;
  background:transparent!important;
  display:block!important;
}
#apple-seed-premium-home .as3-p1.as3-cms-has-image{left:0!important;top:150px!important;z-index:2!important;transform:rotate(-7deg) scale(.86)!important}
#apple-seed-premium-home .as3-p2.as3-cms-has-image{left:15%!important;top:66px!important;z-index:3!important;transform:rotate(-3deg) scale(.92)!important}
#apple-seed-premium-home .as3-p3.as3-cms-has-image{left:31%!important;top:0!important;z-index:6!important;transform:scale(1.03)!important}
#apple-seed-premium-home .as3-p4.as3-cms-has-image{left:48%!important;top:70px!important;z-index:4!important;transform:rotate(3deg) scale(.92)!important}
#apple-seed-premium-home .as3-p5.as3-cms-has-image{left:65%!important;top:148px!important;z-index:3!important;transform:rotate(7deg) scale(.86)!important}
#apple-seed-premium-home .as3-p6.as3-cms-has-image{left:79%!important;top:104px!important;z-index:2!important;transform:rotate(10deg) scale(.80)!important}
#apple-seed-premium-home .as3-label{display:none!important}
#apple-seed-premium-home.as3-cms-background-loaded{
  background-repeat:no-repeat!important;
  background-position:center center!important;
  background-size:cover!important;
}
#apple-seed-premium-home.as3-cms-background-loaded:before{background:transparent!important}
#apple-seed-premium-home.as3-cms-background-loaded:after{background:none!important}
@media(max-width:1100px){
  #apple-seed-premium-home .as3-stage{height:470px!important;min-height:470px!important;max-width:900px!important;margin:0 auto!important}
  #apple-seed-premium-home .as3-p1.as3-cms-has-image{left:0!important}
  #apple-seed-premium-home .as3-p2.as3-cms-has-image{left:13%!important}
  #apple-seed-premium-home .as3-p3.as3-cms-has-image{left:29%!important}
  #apple-seed-premium-home .as3-p4.as3-cms-has-image{left:45%!important}
  #apple-seed-premium-home .as3-p5.as3-cms-has-image{left:61%!important}
  #apple-seed-premium-home .as3-p6.as3-cms-has-image{left:76%!important}
}
@media(max-width:560px){
  #apple-seed-premium-home .as3-stage{height:360px!important;min-height:360px!important}
  #apple-seed-premium-home .as3-stage .as3-phone{width:92px!important;height:184px!important}
  #apple-seed-premium-home .as3-p1.as3-cms-has-image{left:0!important;top:132px!important}
  #apple-seed-premium-home .as3-p2.as3-cms-has-image{left:16%!important;top:76px!important}
  #apple-seed-premium-home .as3-p3.as3-cms-has-image{left:32%!important;top:18px!important}
  #apple-seed-premium-home .as3-p4.as3-cms-has-image{left:48%!important;top:76px!important}
  #apple-seed-premium-home .as3-p5.as3-cms-has-image{left:64%!important;top:132px!important}
  #apple-seed-premium-home .as3-p6.as3-cms-has-image{left:80%!important;top:98px!important}
}
`;
        (document.head || document.documentElement).appendChild(style);
    }

    function getThemeCss(){
        return document.getElementById('apple-seed-theme-cms-live')?.textContent || '';
    }

    function readUrl(css, selector){
        const s = String(css || '');
        const escaped = selector.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
        const patterns = [
            new RegExp(escaped + '\\s*\\{[^}]*background-image\\s*:\\s*url\\(\\s*[\"\\\']?([^\"\\\')]+)[\"\\\']?\\s*\\)', 'i'),
            new RegExp(escaped + '\\s*\\{[^}]*background\\s*:\\s*url\\(\\s*[\"\\\']?([^\"\\\')]+)[\"\\\']?\\s*\\)', 'i')
        ];
        for(const re of patterns){
            const m=s.match(re);
            if(m?.[1]) return String(m[1]).replace(/\\\\([\"\\\'])/g,'$1').trim();
        }
        return '';
    }

    function apply(css){
        installStyle();
        const hero=document.getElementById('apple-seed-premium-home');
        if(!hero) return false;

        const bg=readUrl(css,'#apple-seed-premium-home');
        if(bg){
            hero.style.setProperty('background-image',`url("${bg.replace(/"/g,'\\"')}")`,'important');
            hero.style.setProperty('background-size','cover','important');
            hero.style.setProperty('background-position','center center','important');
            hero.style.setProperty('background-repeat','no-repeat','important');
            hero.classList.add('as3-cms-background-loaded');
        }

        for(let i=1;i<=6;i++){
            const phone=hero.querySelector('.as3-p'+i);
            const screen=phone?.querySelector('.as3-screen');
            if(!phone || !screen) continue;

            const url=readUrl(css,'#apple-seed-premium-home .as3-p'+i);
            let img=screen.querySelector('img[data-cms-hero-phone="1"]');
            if(url){
                phone.classList.add('as3-cms-has-image');
                if(!img){
                    img=document.createElement('img');
                    img.setAttribute('data-cms-hero-phone','1');
                    screen.appendChild(img);
                }
                if(img.getAttribute('src') !== url) img.src=url;
                img.alt='Apple Seed iPhone '+i;
                img.loading='eager';
                img.decoding='async';
            }else{
                phone.classList.remove('as3-cms-has-image');
                if(img) img.remove();
            }
        }
        return true;
    }

    function boot(){
        let tries=0;
        const tick=()=>{
            const css=getThemeCss();
            if(css && apply(css)) return;
            if(++tries<100) setTimeout(tick,250);
        };
        tick();
    }

    boot();
    new MutationObserver(()=>{
        const css=getThemeCss();
        if(css) apply(css);
    }).observe(document.head,{childList:true,subtree:true,characterData:true});
})();
