import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Prefer JWT anon key over publishable key for better compatibility
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Wallex database client is missing configuration.");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
