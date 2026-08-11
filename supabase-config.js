// AppleSeed Supabase configuration
// Replace the value below with your Supabase Publishable/anon key.
// NEVER put the service_role/secret key in a public website.

const SUPABASE_URL = "https://nuismqcjyutqigdydfkg.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_Z3pTEseMEeoiGU9dYJ1NwQ_Ko7li9Sz";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
