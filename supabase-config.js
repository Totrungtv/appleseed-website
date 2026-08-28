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

/* Entertainment-only DOM hardening.
   entertainment.html references #tiktokStatus from its official-player controls,
   but the current markup does not render that status node. Create it before the
   page's inline Entertainment script binds its handlers. Other pages are untouched. */
if (location.pathname.endsWith('/entertainment.html')) {
    const ensureTikTokStatus = () => {
        const frame = document.getElementById('tiktokFrame');
        if (!frame || document.getElementById('tiktokStatus')) return;
        const host = frame.parentElement;
        if (!host) return;
        const status = document.createElement('div');
        status.id = 'tiktokStatus';
        status.className = 'tiktok-status';
        status.textContent = 'Sẵn sàng phát TikTok bằng trình phát chính thức.';
        host.appendChild(status);
    };
    ensureTikTokStatus();
}
