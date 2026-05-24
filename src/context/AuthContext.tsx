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
    
    // First, try to get the current session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (isMounted) {
          if (error) {
            console.warn("Session initialization error:", error.message);
          } else if (data.session) {
            console.log("[Auth] Session found:", data.session.user?.email);
          }
          setSession(data.session);
          // Clean hash from URL if session exists
          if (data.session && typeof window !== "undefined" && window.location.hash && window.location.hash.includes("access_token")) {
            console.log("[Auth] Cleaning OAuth hash from URL");
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
          setLoading(false);
        }
      } catch (e) {
        console.warn("Auth initialization error:", e);
        if (isMounted) setLoading(false);
      }
    };
    
    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (isMounted) {
        console.log("[Auth] State change:", event, nextSession?.user?.email);
        setSession(nextSession);
        setLoading(false);
        
        if (event === "SIGNED_OUT") {
          setSession(null);
        }
        
        if (event === "SIGNED_IN" && typeof window !== "undefined" && window.location.hash) {
          console.log("[Auth] SIGNED_IN - cleaning hash");
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        
        if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        }
      }
    });

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
