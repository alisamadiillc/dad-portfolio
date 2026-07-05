import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

/**
 * Browser Supabase client (anon key only).
 *
 * Auth is delegated to Clerk via the native integration: `accessToken` returns
 * the current Clerk session token on every request, so Postgres RLS sees the
 * Clerk user. No service-role key ships to the client — RLS is the trust
 * boundary.
 *
 * Requires the Clerk <-> Supabase integration enabled in both dashboards.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => (await window.Clerk?.session?.getToken()) ?? null,
});
