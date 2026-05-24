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

// Handle OAuth callback from URL hash
async function handleOAuthHash() {
  if (typeof window === "undefined") return;
  
  const hash = window.location.hash;
  if (hash && hash.includes("access_token")) {
    console.log("[OAuth] Found access token in URL hash");
    // Supabase should auto-detect the session from the hash
  }
}

// Run on module load
handleOAuthHash();

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    if (typeof window !== "undefined" && window.location.hash) {
      console.log("[OAuth] Session established, cleaning URL hash");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }
  if (event === "TOKEN_REFRESHED" && session) {
    console.log("Token refreshed for user:", session.user?.email);
  } else if (event === "SIGNED_OUT") {
    console.log("User signed out");
  }
  if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
    console.log("[OAuth] Auth event:", event, session?.user?.email);
  }
});
