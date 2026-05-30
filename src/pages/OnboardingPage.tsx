import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Mail,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CUSTOM_AVATAR_ID, getCharacter, WALLEX_CHARACTERS } from "../constants/characters";
import { ProfileAvatarPicker } from "../components/ProfileAvatarPicker";
import { updateProfileInBackend } from "../services/walletBackend";
import { getGoogleAvatarUrl, getGoogleDisplayName } from "../utils/googleProfile";

interface OnboardingPageProps {
  onComplete: () => void;
  initialEmail?: string;
  skipAuth?: boolean;
  /** After landing login/signup — only pick profile character */
  characterOnly?: boolean;
}

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

export function OnboardingPage({ onComplete, initialEmail = "", skipAuth = false, characterOnly = false }: OnboardingPageProps) {
  const { user, signInWithGoogle, signUpWithEmail } = useAuth();
  const [step, setStep] = useState(characterOnly || skipAuth ? 2 : 0);
  const [email, setEmail] = useState(initialEmail || user?.email || "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(getGoogleDisplayName(user) || "");
  const [selectedCharacter, setSelectedCharacter] = useState(WALLEX_CHARACTERS[0].id);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!user) return;
    const googleName = getGoogleDisplayName(user);
    const googlePhoto = getGoogleAvatarUrl(user);
    if (googleName) setName(googleName);
    if (googlePhoto) {
      setCustomAvatarUrl(googlePhoto);
      setSelectedCharacter(CUSTOM_AVATAR_ID);
    }
  }, [user]);

  const displayName = () => {
    const trimmed = name.trim();
    if (trimmed) return trimmed;
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Wallet User";
  };

  const finishOnboarding = async () => {
    const character = getCharacter(selectedCharacter);
    const isCustom = selectedCharacter === CUSTOM_AVATAR_ID;
    if (isCustom && !customAvatarUrl.trim()) {
      throw new Error("Paste a valid image URL or pick one of the avatars.");
    }
    await updateProfileInBackend({
      fullName: displayName(),
      avatarCharacter: isCustom ? CUSTOM_AVATAR_ID : character.id,
      avatarGradient: character.gradient,
      avatarUrl: isCustom ? customAvatarUrl.trim() : character.imageUrl,
      onboardingComplete: true,
    });
    if (user?.id) {
      localStorage.setItem(`wallex.onboarding:${user.id}`, "true");
    }
    onComplete();
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithGoogle("/");
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Google sign in failed");
    }
  };

  const handleEmailContinue = () => {
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password with at least 6 characters.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleComplete = () => {
    setIsLoading(true);
    setError("");

    if (skipAuth && user) {
      finishOnboarding()
        .catch((err) => setError(err instanceof Error ? err.message : "Could not save profile"))
        .finally(() => setIsLoading(false));
      return;
    }

    signUpWithEmail(email, password, name.trim())
      .then(async ({ requiresEmailConfirmation }) => {
        if (requiresEmailConfirmation) {
          setConfirmationEmail(email);
          setStep(3);
          setIsLoading(false);
          return;
        }
        await finishOnboarding();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Account creation failed");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-slate-50">
      {step > 0 && step < 3 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100 z-50">
          <div className="h-full bg-slate-950 transition-all duration-500" style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>
      )}

      {step === 0 && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl mb-6 ring-4 ring-white">
            <img src="/logo.png" alt="Wallex" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-slate-950">Welcome to Wallex</h1>
          <p className="text-sm text-slate-500 mt-2 mb-8">Log in or sign up, then choose your crypto profile character.</p>

          {error ? <div className="w-full mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-950 hover:bg-slate-50 flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5 w-full">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={() => setStep(1)} className="w-full rounded-2xl bg-slate-950 text-white py-4 text-sm font-semibold hover:bg-slate-800 flex items-center justify-center gap-2">
            <Mail className="w-5 h-5" />
            Continue with Email
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="max-w-md mx-auto px-4 py-8 min-h-screen">
          <button type="button" onClick={() => setStep(0)} className="flex items-center gap-2 text-slate-500 mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-950">Create account</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">Sign up with your email on wallex.online</p>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (6+ characters)"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm pr-12"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <button type="button" onClick={handleEmailContinue} className="w-full rounded-2xl bg-slate-950 text-white py-4 text-sm font-semibold flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-lg mx-auto px-4 py-8 min-h-screen">
          {!skipAuth && (
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 mb-6">
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}

          <h1 className="text-2xl font-bold text-slate-950">Choose your profile picture</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">Pick one of six ape avatars or paste your own image URL.</p>

          <ProfileAvatarPicker
            selectedId={selectedCharacter}
            customUrl={customAvatarUrl}
            onSelectId={setSelectedCharacter}
            onCustomUrlChange={setCustomAvatarUrl}
            avatarSize={72}
          />

          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your name</label>
          <div className="relative mt-2 mb-6">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we call you?"
              className="w-full rounded-2xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm"
            />
          </div>

          {error ? <p className="text-sm text-rose-600 mb-4">{error}</p> : null}

          <button
            type="button"
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full rounded-2xl bg-slate-950 text-white py-4 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? "Creating wallet..." : "Open my Wallex wallet"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center max-w-md mx-auto">
          <Mail className="w-12 h-12 text-slate-950 mb-4" />
          <h1 className="text-2xl font-bold text-slate-950">Confirm your email</h1>
          <p className="text-sm text-slate-500 mt-2">We sent a link to {confirmationEmail}. After confirming, log in again to finish onboarding.</p>
          <button type="button" onClick={() => setStep(0)} className="mt-8 w-full rounded-2xl bg-slate-950 text-white py-4 text-sm font-semibold">
            Back to sign in
          </button>
        </div>
      )}
    </div>
  );
}
