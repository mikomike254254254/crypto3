import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { buildWallexRedirectUrl, getWallexOrigin } from "../utils/canonicalOrigin";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  sendSignUpOtp: (email: string) => Promise<void>;
  verifySignUpOtp: (email: string, token: string) => Promise<void>;
  completeSignUpProfile: (password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log("[AUTH] Starting initialization");

        // Check if we have an OAuth callback in the URL
        const hasOAuthCallback = typeof window !== "undefined" && 
          window.location.hash && 
          window.location.hash.includes("access_token");

        let sessionData = null;
        let sessionError = null;

        if (hasOAuthCallback) {
          console.log("[AUTH] OAuth callback detected, waiting for Supabase to process URL hash...");
          
          // Wait for Supabase to process the OAuth hash
          // The detectSessionInUrl option processes this automatically
          // but we need to wait for it to complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Try to get the session
        const { data, error } = await supabase.auth.getSession();
        sessionData = data;
        sessionError = error;

        if (sessionError) {
          console.error("[AUTH SESSION ERROR]", sessionError);
          
          // Try getUser as fallback
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userData?.user && mounted) {
            console.log("[AUTH] User recovered via getUser:", userData.user.email);
            // Create a minimal session from user data if needed
            setUser(userData.user);
          } else {
            await supabase.auth.signOut();
            if (typeof window !== "undefined") {
              localStorage.clear();
              sessionStorage.clear();
            }
            if (mounted) {
              setSession(null);
              setUser(null);
            }
          }
          return;
        }

        console.log("[AUTH] Session loaded", !!sessionData.session, sessionData.session?.user?.email);

        if (!mounted) return;

        setSession(sessionData.session ?? null);
        setUser(sessionData.session?.user ?? null);

        // Clean OAuth hash after successful session restore
        if (sessionData.session && typeof window !== "undefined" && window.location.hash) {
          console.log("[AUTH] Cleaning OAuth hash from URL");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error("[AUTH INIT FAILED]", err);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthReady(true);
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes - this fires when OAuth callback is processed
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[AUTH EVENT]", event, newSession?.user?.email || "no user");

      if (!mounted) return;

      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);

      // Clean OAuth hash after successful auth
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && typeof window !== "undefined" && window.location.hash) {
        console.log("[AUTH] " + event + " - cleaning URL hash");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    authReady,
    signUpWithEmail: async (email, password, name) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: getWallexOrigin(),
        },
      });

      if (error) {
        throw error;
      }

      return { requiresEmailConfirmation: !data.session };
    },
    sendSignUpOtp: async (email) => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: getWallexOrigin(),
        },
      });

      if (error) throw error;
    },
    verifySignUpOtp: async (email, token) => {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "email",
      });

      if (error) throw error;

      if (data.session) {
        console.log("OTP verified and user signed in:", data.session.user?.email);
      } else {
        console.log("OTP verified, but no session established");
      }
    },
    completeSignUpProfile: async (password, name) => {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { full_name: name },
      });

      if (error) throw error;
    },
    signInWithEmail: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    },
    signInWithGoogle: async (redirectPath = "/") => {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://wallex.online";
      const redirectUrl = `${origin.replace(/\/$/, "")}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;
      console.log("[Google OAuth] Starting - origin:", origin, "redirectUrl:", redirectUrl);

      try {
        console.log("[Google OAuth] Calling signInWithOAuth with provider: google");
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

        console.log("[Google OAuth] Response - data:", data, "error:", error);

        if (error) {
          console.error("[Google OAuth] Error object:", error);
          const msg = error.message || error.toString() || "Google OAuth failed";
          throw new Error(`Google sign in failed: ${msg}`);
        }

        if (!data?.url) {
          console.error("[Google OAuth] No URL in response data:", data);
          throw new Error("Google OAuth not configured. Please contact support or check Supabase Dashboard → Authentication → Providers → Google.");
        }

        console.log("[Google OAuth] Redirecting to:", data.url);
        window.location.href = data.url;
      } catch (err) {
        console.error("[Google OAuth] Exception caught:", err);
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Google sign in failed: ${msg}`);
      }
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      }
      setSession(null);
      setUser(null);
      localStorage.removeItem("wallex.onboarding");
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("wallex.") || key.startsWith("kycStatus:")) {
          localStorage.removeItem(key);
        }
      });
    },
  }), [user, session, loading, authReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}