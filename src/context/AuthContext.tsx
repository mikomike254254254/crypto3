import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { buildWallexRedirectUrl, getWallexOrigin } from "../utils/canonicalOrigin";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(data.session);
          if (data.session && typeof window !== "undefined" && window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        }
      } catch (e) {
        console.warn("Auth initialization error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (isMounted) {
        console.log("Auth state change:", event, nextSession?.user?.email);
        setSession(nextSession);
        setLoading(false);
        
        // Handle session expiration
        if (event === "SIGNED_OUT") {
          setSession(null);
        }
        
        // Clear hash after successful sign in
        if (event === "SIGNED_IN" && typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    });

    // Handle OAuth callback hash - extract and process tokens
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Supabase will automatically process this, but we can help by cleaning it up
        const params = new URLSearchParams(hash.substring(1));
        if (params.get("access_token")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    }

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
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
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "signup",
      });

      if (error) throw error;
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
      const baseUrl = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "https://wallex.online";
      const redirectUrl = `${baseUrl}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;
      console.log("Google OAuth redirect URL:", redirectUrl);
      
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false,
          },
        });

        if (error) {
          console.error("Google OAuth error:", error.message);
          throw new Error(error.message || "Google sign in failed");
        }
        
        // If we get a URL in the response but didn't redirect, do it manually
        if (data?.url) {
          console.log("Redirecting to:", data.url);
          window.location.href = data.url;
        }
        
        console.log("Google OAuth initiated successfully");
      } catch (err) {
        console.error("Google OAuth exception:", err);
        throw err instanceof Error ? err : new Error("Google sign in failed");
      }
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      }
      setSession(null);
      localStorage.removeItem("wallex.onboarding");
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("wallex.") || key.startsWith("kycStatus:")) {
          localStorage.removeItem(key);
        }
      });
    },
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
