// AppleSeed Supabase configuration
// Replace the value below with your Supabase Publishable/anon key.
// NEVER put the service_role/secret key in a public website.

const SUPABASE_URL = "https://nuismqcjyutqigydyfkg.supabase.co";
const SUPABASE_ANON_KEY = "PASTE_YOUR_PUBLISHABLE_OR_ANON_KEY_HERE";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
