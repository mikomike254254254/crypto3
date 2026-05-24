import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { EmailOtpVerification } from "./EmailOtpVerification";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function LandingAuthPanel() {
  const { signInWithGoogle, signInWithEmail, sendSignUpOtp } = useAuth();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const handleGoogleSignIn = async () => {
     setLoading(true);
     setError("");
     try {
       console.log("[LandingAuthPanel] Starting Google sign in...");
       await signInWithGoogle("/");
     } catch (err) {
       console.error("[LandingAuthPanel] Google sign in caught error:", err);
       const msg = err instanceof Error ? err.message : "Google sign in failed";
       setError(msg);
       setLoading(false);
     }
   };

  const submit = async () => {
    setError("");
    if (!email.includes("@") || password.length < 6 || (mode === "signup" && !name.trim())) {
      setError(mode === "signup" ? "Enter name, email, and password (6+ chars)." : "Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await sendSignUpOtp(email);
        setStep("otp");
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="signup" className="mt-8 rounded-[1.75rem] border border-slate-200/90 bg-white/95 backdrop-blur-sm p-6 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] max-w-md animate-fade-up ring-1 ring-white/80">
      <p className="text-xs font-semibold uppercase tracking-wider text-black/60 mb-1">wallex.online</p>
      <h2 className="text-xl font-bold text-black">{mode === "signup" ? "Sign up" : "Log in"}</h2>
      <p className="text-sm text-black/70 mt-1 mb-4">
        {mode === "signup"
          ? "Then choose your chibi crypto profile character (Bull, Queen, Hacker, Astronaut, Ape, or Whale)."
          : "Welcome back — open your Wallex wallet."}
      </p>

      {error ? <p className="text-sm text-rose-600 mb-3 bg-rose-50 p-2 rounded">{error}</p> : null}

{step === "otp" && mode === "signup" ? (
         <EmailOtpVerification
           email={email}
           name={name}
           password={password}
           onVerified={() => {
             setStep("form");
             setMode("signin");
           }}
           onBack={() => setStep("form")}
         />
       ) : (
        <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-[1.25rem] border-2 border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-950 hover:bg-slate-50 flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm mb-3"
            />
          )}

          <div className="relative mb-3">
            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm"
            />
          </div>

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="w-full rounded-[1.25rem] bg-slate-950 text-white py-3.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Send verification code" : "Log in"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setStep("form"); }} className="w-full mt-3 text-sm text-slate-500 hover:text-slate-950">
            {mode === "signup" ? "Already have an account? Log in" : "New here? Create a wallet"}
          </button>
        </>
      )}
    </div>
  );
}
