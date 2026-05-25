import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { getWallexOrigin } from "../utils/canonicalOrigin";

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
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log("[AUTH] Safety timeout - forcing authReady");
        setLoading(false);
        setAuthReady(true);
      }
    }, 8000);

    async function initializeAuth() {
      try {
        console.log("[AUTH] Starting initialization");

        // Get the session - detectSessionInUrl handles OAuth redirects automatically
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AUTH SESSION ERROR]", error);
          
          // Try getUser as fallback
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user && mounted) {
            console.log("[AUTH] User recovered via getUser:", userData.user.email);
            setUser(userData.user);
          } else {
            if (mounted) {
              setSession(null);
              setUser(null);
            }
            return;
          }
        }

        const sessionData = data?.session || null;
        console.log("[AUTH] Session loaded", !!sessionData, sessionData?.user?.email);

        if (!mounted) return;

        setSession(sessionData);
        setUser(sessionData?.user ?? null);

        // Clean OAuth hash after successful session restore
        if (sessionData && typeof window !== "undefined" && window.location.hash) {
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
        clearTimeout(timeout);
        if (mounted) {
          setLoading(false);
          setAuthReady(true);
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[AUTH EVENT]", event, newSession?.user?.email || "no user");
      if (!mounted) return;
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
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
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: getWallexOrigin() },
      });
      if (error) throw error;
      return { requiresEmailConfirmation: !data.session };
    },
    sendSignUpOtp: async (email) => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: getWallexOrigin() },
      });
      if (error) throw error;
    },
    verifySignUpOtp: async (email, token) => {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "email" });
      if (error) throw error;
    },
    completeSignUpProfile: async (password, name) => {
      const { error } = await supabase.auth.updateUser({ password, data: { full_name: name } });
      if (error) throw error;
    },
    signInWithEmail: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signInWithGoogle: async (redirectPath = "/") => {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://wallex.online";
      const redirectUrl = `${origin.replace(/\/$/, "")}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
      if (error) throw new Error(`Google sign in failed: ${error.message}`);
      if (!data?.url) throw new Error("Google OAuth not configured.");
      window.location.href = data.url;
    },
    signOut: async () => {
      await supabase.auth.signOut({ scope: "global" }).catch(() => supabase.auth.signOut({ scope: "local" }));
      setSession(null);
      setUser(null);
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("wallex.") || key.startsWith("kycStatus:")) localStorage.removeItem(key);
      });
    },
  }), [user, session, loading, authReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}