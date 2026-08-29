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
                        const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const re = new RegExp(
                            escaped + '\\s*\\{[^}]*background-image\\s*:\\s*url\\(\\s*["\']?([^"\')]+)["\']?\\s*\\)',
                            'i'
                        );
                        const m = block.match(re);
                        return m
                            ? String(m[1]).replace(/\\(["'])/g, '$1').trim()
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
        const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patterns = [
            new RegExp(escaped + '\\s*\\{[^}]*background-image\\s*:\\s*url\\(\\s*["\']?([^"\')]+)["\']?\\s*\\)', 'i'),
            new RegExp(escaped + '\\s*\\{[^}]*background\\s*:\\s*url\\(\\s*["\']?([^"\')]+)["\']?\\s*\\)', 'i')
        ];
        for(const re of patterns){
            const m=s.match(re);
            if(m?.[1]) return String(m[1]).replace(/\\(["'])/g,'$1').trim();
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

/*
 * Apple Seed visual treatment for the existing index Hero.
 * This is a UI-only layer: no routes, content blocks, CMS data or logo asset
 * are replaced. It makes the current structure visually closer to the chosen
 * dark premium reference while preserving the uploaded Hero artwork.
 */
(function appleSeedPremiumVisual(){
    if ((location.pathname.split('/').pop() || 'index.html').toLowerCase() !== 'index.html') return;

    const ID='apple-seed-premium-visual-v1';
    function mount(){
        if(document.getElementById(ID)) return;
        const s=document.createElement('style');
        s.id=ID;
        s.textContent=`
.site-header{
  background:rgba(4,10,17,.96)!important;
  border-bottom:1px solid rgba(255,255,255,.09)!important;
  box-shadow:0 8px 26px rgba(0,0,0,.16)!important;
}
.site-header .nav{max-width:1340px!important}
.site-header .brand-title{color:#f7f9fb!important}
.site-header .brand-sub{color:#aab4bf!important}
.site-header .menu{color:#f3f5f7!important}
.site-header .menu a{color:#f3f5f7!important}
.site-header .booking-nav{
  color:#16130d!important;
  background:linear-gradient(135deg,#d6ad55,#f0d38d)!important;
  border-radius:12px!important;
  padding:12px 18px!important;
  box-shadow:0 10px 25px rgba(211,166,72,.20)!important;
}
.site-header .member-auth-btn{color:#f3f5f7!important}
.site-header .member-auth-btn.primary{
  background:linear-gradient(135deg,#d6ad55,#f0d38d)!important;
  color:#16130d!important;
}
.site-header .member-user-pill{color:#f3f5f7!important}
.site-header .member-logout-btn{color:#f0d38d!important}

#apple-seed-premium-home{
  position:relative!important;
  background-color:#071018!important;
  color:#f7f8fa!important;
  overflow:hidden!important;
}
#apple-seed-premium-home:before{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  background:
    radial-gradient(circle at 62% 38%,rgba(234,190,105,.24),transparent 28%),
    radial-gradient(circle at 46% 20%,rgba(53,105,123,.30),transparent 24%),
    linear-gradient(115deg,#050a10 0%,#0b1620 45%,#111a22 100%)!important;
  pointer-events:none!important;
  z-index:0!important;
}
#apple-seed-premium-home:after{
  content:""!important;
  position:absolute!important;
  left:18%!important;right:18%!important;bottom:70px!important;height:230px!important;
  border-radius:50%!important;
  background:radial-gradient(ellipse,rgba(255,198,98,.20),transparent 67%)!important;
  filter:blur(12px)!important;
  pointer-events:none!important;
  z-index:0!important;
}
#apple-seed-premium-home > .as3-wrap{
  position:relative!important;
  z-index:2!important;
  max-width:1340px!important;
  padding-left:34px!important;
  padding-right:34px!important;
}
#apple-seed-premium-home .as3-main{
  grid-template-columns:minmax(360px,.78fr) minmax(600px,1.22fr)!important;
  gap:26px!important;
  align-items:center!important;
}
#apple-seed-premium-home .as3-copy{
  position:relative!important;
  z-index:20!important;
  padding:0 10px 0 16px!important;
}
#apple-seed-premium-home .as3-kicker{
  color:#56d0a2!important;
  letter-spacing:3.8px!important;
  font-weight:900!important;
}
#apple-seed-premium-home .as3-title{
  color:#f8fafc!important;
  text-shadow:0 8px 32px rgba(0,0,0,.32)!important;
}
#apple-seed-premium-home .as3-title span{
  background:linear-gradient(90deg,#f0f3f5 0%,#4fd3a1 58%,#bcdcca 100%)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  color:transparent!important;
}
#apple-seed-premium-home .as3-sub{color:#eef2f4!important}
#apple-seed-premium-home .as3-sub b{color:#d5ad56!important}
#apple-seed-premium-home .as3-desc{color:#b9c3cc!important}
#apple-seed-premium-home .as3-note{color:#7e8c97!important}
#apple-seed-premium-home .as3-btn{
  border-color:rgba(255,255,255,.18)!important;
  background:rgba(255,255,255,.06)!important;
  color:#f5f7f9!important;
  box-shadow:0 10px 28px rgba(0,0,0,.20)!important;
  backdrop-filter:blur(10px)!important;
}
#apple-seed-premium-home .as3-btn.gold{
  background:linear-gradient(135deg,#38c99a,#65dfb7)!important;
  border-color:#56d0a2!important;
  color:#06120d!important;
  box-shadow:0 14px 34px rgba(36,198,151,.26)!important;
}
#apple-seed-premium-home .as3-stage{
  height:610px!important;
  min-height:610px!important;
  perspective:1500px!important;
}
#apple-seed-premium-home .as3-stage:before{
  width:760px!important;height:760px!important;
  left:54%!important;top:-70px!important;
  background:
    radial-gradient(circle,rgba(239,202,130,.32),rgba(62,93,110,.18) 38%,transparent 70%)!important;
}
#apple-seed-premium-home .as3-stage:after{
  content:""!important;
  position:absolute!important;
  left:8%!important;right:3%!important;bottom:62px!important;height:130px!important;
  border-radius:50%!important;
  background:radial-gradient(ellipse,rgba(227,176,83,.34),rgba(227,176,83,0) 68%)!important;
  filter:blur(9px)!important;
  z-index:1!important;
  pointer-events:none!important;
}
#apple-seed-premium-home .as3-stage .as3-phone.as3-cms-has-image{
  box-shadow:0 30px 55px rgba(0,0,0,.34)!important;
  filter:drop-shadow(0 24px 28px rgba(0,0,0,.28))!important;
}
#apple-seed-premium-home .as3-benefits{
  right:0!important;top:46px!important;
  width:112px!important;
  background:rgba(255,255,255,.09)!important;
  border:1px solid rgba(255,255,255,.18)!important;
  box-shadow:0 18px 45px rgba(0,0,0,.28)!important;
  backdrop-filter:blur(14px)!important;
  z-index:40!important;
}
#apple-seed-premium-home .as3-benefit{
  color:#e7edf2!important;
  border-bottom-color:rgba(255,255,255,.11)!important;
}
#apple-seed-premium-home .as3-benefit i{color:#e4b44e!important}
#apple-seed-premium-home .as3-play{
  border-color:#d8ad50!important;
  color:#f0c86a!important;
  background:rgba(0,0,0,.24)!important;
}
#apple-seed-premium-home .as3-discover{color:#c7d0d8!important;z-index:45!important}

#apple-seed-premium-home .as3-services{
  position:relative!important;
  z-index:50!important;
  margin-top:-36px!important;
  gap:10px!important;
}
#apple-seed-premium-home .as3-service{
  min-height:120px!important;
  border:1px solid rgba(255,255,255,.12)!important;
  background:rgba(255,255,255,.96)!important;
  box-shadow:0 18px 38px rgba(0,0,0,.20)!important;
  border-radius:16px!important;
}
#apple-seed-premium-home .as3-service .ico{
  color:#c08b2c!important;
  border-color:rgba(192,139,44,.28)!important;
}
#apple-seed-premium-home .as3-more{
  background:linear-gradient(135deg,#111c25,#182631)!important;
  border-color:rgba(255,255,255,.08)!important;
}
#apple-seed-premium-home .as3-more h3{color:#fff!important}
#apple-seed-premium-home .as3-more p{color:#b9c3cc!important}

@media(max-width:1100px){
  #apple-seed-premium-home .as3-main{
    grid-template-columns:1fr!important;
  }
  #apple-seed-premium-home .as3-copy{
    text-align:center!important;
    max-width:760px!important;
    margin:0 auto!important;
  }
  #apple-seed-premium-home .as3-stage{
    max-width:980px!important;
    margin:0 auto!important;
  }
}
@media(max-width:760px){
  .site-header{
    background:#071018!important;
  }
  #apple-seed-premium-home .as3-title{font-size:48px!important}
  #apple-seed-premium-home .as3-stage{
    height:455px!important;
    min-height:455px!important;
  }
  #apple-seed-premium-home .as3-services{
    margin-top:0!important;
  }
  #apple-seed-premium-home .as3-benefits{display:none!important}
}
@media(max-width:480px){
  #apple-seed-premium-home .as3-title{font-size:39px!important}
  #apple-seed-premium-home > .as3-wrap{
    padding-left:14px!important;
    padding-right:14px!important;
  }
}
`;
        document.head.appendChild(s);
    }
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',mount,{once:true});
    }else{
        mount();
    }
})();
