import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client for client-side use (browser)
 * Uses the public anon key which is safe to expose
 */
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
