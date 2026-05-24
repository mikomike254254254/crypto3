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
        console.log("[AUTH] Initializing session");

        // First, let Supabase process the URL hash if present (OAuth callback)
        // This ensures the session is properly extracted from the hash fragment
        if (typeof window !== "undefined" && window.location.hash && window.location.hash.includes("access_token")) {
          console.log("[AUTH] OAuth hash detected, waiting for Supabase to process...");
          try {
            // Give Supabase time to process the OAuth callback
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch {
            // ignore
          }
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AUTH SESSION ERROR]", error);

          // Handle clock skew error specifically
          if (error.message?.includes("issued in the future") || error.message?.includes("clock")) {
            console.warn("[AUTH] Clock skew detected - attempting to recover");
            // Try to refresh the session
            const refreshResult = await supabase.auth.refreshSession();
            if (refreshResult.data.session && mounted) {
              console.log("[AUTH] Session recovered via refresh");
              setSession(refreshResult.data.session);
              setUser(refreshResult.data.session.user);
              // Clean OAuth hash after successful recovery
              if (typeof window !== "undefined" && window.location.hash) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              return;
            }
          }

          // Clear invalid session
          await supabase.auth.signOut();

          if (typeof window !== "undefined") {
            // Clear all auth-related storage
            localStorage.clear();
            sessionStorage.clear();
          }

          if (mounted) {
            setSession(null);
            setUser(null);
          }

          return;
        }

        console.log("[AUTH] Session loaded", !!data.session);

        if (!mounted) return;

        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);

        // Clean OAuth hash after successful session restore
        if (data.session && typeof window !== "undefined" && window.location.hash) {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AUTH EVENT]", event, !!session);

      setSession(session ?? null);
      setUser(session?.user ?? null);

      // Clean OAuth hash after successful auth
      if (session && typeof window !== "undefined" && window.location.hash) {
        console.log("[Auth] SIGNED_IN - cleaning URL hash");
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