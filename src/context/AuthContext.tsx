import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { buildWallexRedirectUrl } from "../utils/canonicalOrigin";
import { googleProfilePatch, isGoogleAuthUser } from "../utils/googleProfile";
import { updateProfileInBackend } from "../services/walletBackend";
import { CUSTOM_AVATAR_ID } from "../constants/characters";

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

function cleanOAuthUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.hash = "";
  const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");
  window.history.replaceState({}, document.title, next || "/");
}

async function recoverOAuthSession(): Promise<Session | null> {
  if (typeof window === "undefined") return null;

  const search = window.location.search;
  const hash = window.location.hash;

  if (search.includes("code=")) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(search);
    if (error) {
      console.error("[AUTH] exchangeCodeForSession failed:", error.message);
      return null;
    }
    cleanOAuthUrl();
    return data.session;
  }

  if (hash.includes("access_token=")) {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        console.error("[AUTH] setSession from hash failed:", error.message);
        return null;
      }
      window.history.replaceState({}, document.title, window.location.pathname);
      return data.session;
    }
  }

  return null;
}

async function syncGoogleProfile(user: User) {
  if (!isGoogleAuthUser(user)) return;

  const { fullName, avatarUrl, metadata } = googleProfilePatch(user);

  try {
    await supabase.auth.updateUser({ data: metadata });
  } catch (error) {
    console.warn("[AUTH] Could not update Google metadata:", error);
  }

  try {
    await updateProfileInBackend({
      fullName: fullName || undefined,
      avatarUrl: avatarUrl || undefined,
      avatarCharacter: avatarUrl ? CUSTOM_AVATAR_ID : undefined,
    });
  } catch (error) {
    console.warn("[AUTH] Profile API sync deferred until onboarding:", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setAuthReady(true);
      }
    }, 8000);

    async function initializeAuth() {
      try {
        const oauthSession = await recoverOAuthSession();
        if (oauthSession?.user && mounted) {
          setSession(oauthSession);
          setUser(oauthSession.user);
          await syncGoogleProfile(oauthSession.user);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("[AUTH SESSION ERROR]", error);
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user && mounted) {
            setUser(userData.user);
          } else if (mounted) {
            setSession(null);
            setUser(null);
          }
          return;
        }

        const sessionData = data?.session ?? null;
        if (!mounted) return;

        setSession(sessionData);
        setUser(sessionData?.user ?? null);

        if (sessionData?.user) {
          await syncGoogleProfile(sessionData.user);
        }

        if (sessionData && window.location.hash) {
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

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_IN" && newSession?.user) {
        void syncGoogleProfile(newSession.user);
        if (window.location.hash || window.location.search.includes("code=")) {
          cleanOAuthUrl();
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      authReady,
      signUpWithEmail: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: buildWallexRedirectUrl("/") },
        });
        if (error) throw error;
        return { requiresEmailConfirmation: !data.session };
      },
      sendSignUpOtp: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true, emailRedirectTo: buildWallexRedirectUrl("/") },
        });
        if (error) throw error;
      },
      verifySignUpOtp: async (email, token) => {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: "email",
        });
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
        const redirectTo = buildWallexRedirectUrl(redirectPath);
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });
        if (error) throw new Error(`Google sign in failed: ${error.message}`);
        if (!data?.url) throw new Error("Google OAuth is not configured. Check Supabase Google provider settings.");
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
    }),
    [user, session, loading, authReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
