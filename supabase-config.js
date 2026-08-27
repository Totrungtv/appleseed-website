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

// Entertainment-only additive hardening. Other pages are untouched.
if (location.pathname.endsWith('/entertainment.html')) {
    var entertainmentFix = document.createElement('script');
    entertainmentFix.src = './entertainment-runtime-fix.js';
    entertainmentFix.async = true;
    entertainmentFix.setAttribute('data-apple-seed-runtime-fix', 'entertainment');
    document.head.appendChild(entertainmentFix);
}
