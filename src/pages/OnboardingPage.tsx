import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gem,
  Mail,
  Star,
  User,
  Waves,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface OnboardingPageProps {
  onComplete: (userData: UserData) => void;
}

interface UserData {
  name: string;
  email: string;
  avatar: string;
}

const avatars = [
  { id: 1, gradient: "from-blue-500 to-purple-600", icon: CircleDollarSign },
  { id: 2, gradient: "from-green-500 to-teal-600", icon: Gem },
  { id: 3, gradient: "from-orange-500 to-red-600", icon: Flame },
  { id: 4, gradient: "from-pink-500 to-rose-600", icon: Star },
  { id: 5, gradient: "from-indigo-500 to-blue-600", icon: Waves },
  { id: 6, gradient: "from-amber-500 to-orange-600", icon: Crown },
];

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { signInWithGoogle, signUpWithEmail } = useAuth();
  const [step, setStep] = useState(0);
  const [signupMethod, setSignupMethod] = useState<"google" | "email" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const handleGoogleSignup = () => {
    setIsLoading(true);
    setError("");
    setSignupMethod("google");
    signInWithGoogle().catch((err) => {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Google sign in failed");
    });
  };

  const handleEmailSignup = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setSignupMethod("email");
    setStep(2);
  };

  const handleComplete = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (selectedAvatar === null) {
      setError("Please select an avatar");
      return;
    }

    setIsLoading(true);
    signUpWithEmail(email, password, name)
      .then(({ requiresEmailConfirmation }) => {
        setIsLoading(false);
        if (requiresEmailConfirmation) {
          setConfirmationEmail(email);
          setStep(3);
          return;
        }

        onComplete({
          name,
          email,
          avatar: avatars[selectedAvatar - 1].gradient,
        });
      })
      .catch((err) => {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : "Account creation failed");
      });
  };

  const renderStep0 = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-black to-neutral-700 flex items-center justify-center mb-6 shadow-xl">
        <img src="/wallex-logo.jpg" alt="Wallex" className="w-full h-full object-cover rounded-2xl" />
      </div>

      <h1 className="text-2xl font-bold text-black mb-2">Welcome to Wallex</h1>
      <p className="text-sm text-gray-500 mb-8">The simplest way to manage your crypto</p>

      <div className="w-full space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-left">
            <X className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-neutral-200 rounded-xl py-4 px-6 hover:bg-neutral-50 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium text-black">Continue with Google</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        <button
          onClick={() => setStep(1)}
          className="w-full flex items-center justify-center gap-3 bg-black rounded-xl py-4 px-6 hover:bg-neutral-800 transition-all"
        >
          <Mail className="w-5 h-5 text-white" />
          <span className="text-sm font-medium text-white">Continue with Email</span>
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  );

  const renderStep1 = () => (
    <div className="px-4 pt-4">
      <button onClick={() => setStep(0)} className="flex items-center gap-2 text-gray-500 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Back</span>
      </button>

      <h1 className="text-2xl font-bold text-black mb-2">Create account</h1>
      <p className="text-sm text-gray-500 mb-6">Enter your email and create a password</p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-neutral-50 rounded-xl py-4 pl-11 pr-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black border border-neutral-200"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full bg-neutral-50 rounded-xl py-4 px-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black border border-neutral-200"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <X className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleEmailSignup}
          className="w-full bg-black text-white rounded-xl py-4 text-sm font-medium hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="px-4 pt-4">
      <button
        onClick={() => setStep(signupMethod === "google" ? 0 : 1)}
        className="flex items-center gap-2 text-gray-500 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Back</span>
      </button>

      <h1 className="text-2xl font-bold text-black mb-2">Set up your profile</h1>
      <p className="text-sm text-gray-500 mb-6">Choose your avatar and enter your name</p>

      <div className="mb-6">
        <label className="text-xs font-medium text-gray-600 mb-3 block">Choose your avatar</label>
        <div className="grid grid-cols-3 gap-3">
          {avatars.map((avatar) => {
            const AvatarIcon = avatar.icon;
            return (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`aspect-square rounded-2xl flex items-center justify-center transition-all relative ${
                  selectedAvatar === avatar.id ? "ring-2 ring-black ring-offset-2" : "hover:scale-105"
                } bg-gradient-to-br ${avatar.gradient}`}
              >
                <AvatarIcon className="w-9 h-9 text-white" />
                {selectedAvatar === avatar.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs font-medium text-gray-600 mb-1 block">Your Name</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-neutral-50 rounded-xl py-4 pl-11 pr-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black border border-neutral-200"
          />
        </div>
      </div>

      <div className="bg-neutral-50 rounded-xl p-3 mb-6">
        <p className="text-xs text-gray-500">Account email</p>
        <p className="text-sm font-medium text-black">{email}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 mb-4">
          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={isLoading}
        className="w-full bg-black text-white rounded-xl py-4 text-sm font-medium hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Create Account
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mb-6 shadow-xl">
        <Mail className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-black mb-2">Confirm your email</h1>
      <p className="text-sm text-gray-500 mb-6">
        Supabase created the account, but email confirmation is enabled. Open the confirmation link sent to {confirmationEmail}.
      </p>
      <button
        onClick={() => setStep(0)}
        className="w-full bg-black text-white rounded-xl py-4 text-sm font-medium hover:bg-neutral-800 transition-all"
      >
        Back to sign in
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {step > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-100 z-50">
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>
      )}

      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}
