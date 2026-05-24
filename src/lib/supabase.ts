import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Wallex database client is missing configuration.");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseKey ?? "", {
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
