import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Menu,
  Shield,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CryptoLogo } from "../components/CryptoLogo";
import { LandingAuthPanel } from "../components/LandingAuthPanel";
import { LandingCharacterShowcase } from "../components/LandingCharacterShowcase";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { SkyClouds } from "../components/SkyClouds";
import { TestimonialsMarquee } from "../components/landing/TestimonialsMarquee";
import { FaqSection } from "../components/landing/FaqSection";
import { MpesaBanner } from "../components/landing/MpesaBanner";
import { useLiveMarketPrices } from "../hooks/useLiveMarketPrices";
import { SUPPORT_EMAIL, supportMailto } from "../constants/support";

type AuthMode = "signup" | "signin";

function formatUsd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  });
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

function AuthDialog({ mode, onModeChange, onClose }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onClose: () => void }) {
  const { signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const title = mode === "signup" ? "Create your Wallex wallet" : "Welcome back";
  const submitText = mode === "signup" ? "Create wallet" : "Log in";

  const submit = async () => {
    setError("");
    setConfirmationEmail("");

    if (!email.includes("@") || password.length < 6 || (mode === "signup" && !name.trim())) {
      setError(mode === "signup" ? "Enter your name, a valid email, and a 6+ character password." : "Enter a valid email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signUpWithEmail(email, password, name.trim());
        if (result.requiresEmailConfirmation) {
          setConfirmationEmail(email);
        }
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
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">Secure sign-in powered by Supabase on wallex.online</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {confirmationEmail ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Check your inbox at {confirmationEmail}, confirm your email, then log in to finish setup.
            </div>
          ) : null}

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              signInWithGoogle("/").catch((err) => {
                setLoading(false);
                setError(err instanceof Error ? err.message : "Google sign in failed");
              });
            }}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {mode === "signup" ? (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          ) : null}

          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@email.com"
              className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>

          <div className="relative">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Toggle password">
              {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <button type="button" onClick={submit} disabled={loading} className="w-full rounded-2xl bg-slate-950 text-white py-3 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
            {loading ? "Please wait..." : submitText}
          </button>

          <button type="button" onClick={() => onModeChange(mode === "signup" ? "signin" : "signup")} className="w-full text-sm text-slate-500 hover:text-slate-950">
            {mode === "signup" ? "Already have a wallet? Log in" : "New to Wallex? Create a wallet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const { assets: rates, priceTick, updatedAt } = useLiveMarketPrices();

  const featured = useMemo(() => rates.slice(0, 4), [rates]);
  const priceUpdatedLabel = updatedAt
    ? `Live · ${new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Live prices";

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black overflow-hidden ring-2 ring-slate-100">
              <img src="/logo.png" alt="Wallex" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-950">Wallex</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#markets" className="hover:text-slate-950 transition-colors">Markets</a>
            <a href="#assets" className="hover:text-slate-950 transition-colors">Assets</a>
            <a href="#faq" className="hover:text-slate-950 transition-colors">FAQ</a>
            <a href="#security" className="hover:text-slate-950 transition-colors">Security</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button type="button" onClick={() => setAuthMode("signin")} className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Log in
            </button>
            <button type="button" onClick={() => setAuthMode("signup")} className="rounded-2xl bg-slate-950 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 shadow-lg shadow-slate-900/20">
              Get started
            </button>
          </div>
          <button type="button" onClick={() => setMenuOpen((current) => !current)} className="md:hidden rounded-2xl p-2 hover:bg-slate-100" aria-label="Menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        {menuOpen ? (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2">
            <a href="#markets" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-50">Markets</a>
            <a href="#assets" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-50">Assets</a>
            <button type="button" onClick={() => setAuthMode("signin")} className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-slate-50">
              Log in
            </button>
            <button type="button" onClick={() => setAuthMode("signup")} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Get started
            </button>
          </div>
        ) : null}
      </nav>

      <main>
        <section className="relative overflow-hidden landing-sky">
          <SkyClouds />
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center relative z-10">
            <div>
              <p className="inline-block rounded-full bg-white/90 border border-sky-200 px-4 py-2 text-sm font-semibold text-black shadow-sm">
                Wallex · wallex.online
              </p>
              <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-black leading-[1.05]">
                Log in or sign up.
                <span className="block">Pick your crypto character.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-black/80 leading-relaxed">
                Google or email sign-in. Choose a profile character. Buy, receive, swap, and send crypto.
              </p>
              <LandingAuthPanel />
              <LandingCharacterShowcase />

              <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-black/70">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-black" /> 12 assets</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-black" /> Paystack</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-black" /> Wallet transfers</span>
              </div>
            </div>

            <div className="animate-hero-float lg:translate-y-[-6px] bg-white/95 backdrop-blur-sm rounded-[2rem] border border-slate-200/80 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.18)] p-6 ring-1 ring-white/60">
              <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-950 to-slate-800 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Portfolio preview</p>
                    <p className="text-3xl font-bold mt-1">Multi-asset</p>
                  </div>
                  <Wallet className="w-9 h-9 text-cyan-300" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-6">
                  {featured.map((asset) => (
                    <div key={asset.symbol} className="rounded-2xl bg-white/10 p-2 flex flex-col items-center gap-1 backdrop-blur-sm">
                      <CryptoLogo symbol={asset.symbol} size={32} className="!rounded-xl !border-white/20" />
                      <p className="text-[10px] font-semibold">{asset.symbol}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto scroll-smooth-y">
                {featured.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between rounded-2xl bg-slate-50/90 p-3 border border-slate-100/80">
                    <div className="flex items-center gap-3">
                      <CryptoLogo symbol={asset.symbol} size={40} />
                      <div>
                        <p className="font-semibold text-sm">{asset.name}</p>
                        <p className="text-xs text-slate-500">{asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        <AnimatedNumber key={`${asset.symbol}-${priceTick}`} value={asset.price} format={formatUsd} />
                      </p>
                      <p className={`text-xs font-medium ${asset.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {asset.change >= 0 ? "+" : ""}
                        {asset.change.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="markets" className="max-w-7xl mx-auto px-4 md:px-6 py-16 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-black">Market prices</h2>
              <p className="text-black/60 mt-2">USD prices from CoinGecko. Refreshes every 5 minutes.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 border border-sky-200 px-4 py-2 text-sm font-semibold text-black">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {priceUpdatedLabel}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rates.map((asset) => (
              <div key={asset.symbol} className="rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <CryptoLogo symbol={asset.symbol} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-950 truncate">{asset.name}</p>
                    <p className="text-xs text-slate-500">{asset.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      <AnimatedNumber key={`m-${asset.symbol}-${priceTick}`} value={asset.price} format={formatUsd} />
                    </p>
                    <p className={`text-xs flex items-center justify-end gap-0.5 ${asset.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {asset.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {asset.change >= 0 ? "+" : ""}
                      {asset.change.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <MpesaBanner />

        <section id="assets" className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
            <h2 className="text-3xl font-bold text-center text-black">Supported assets</h2>
            <p className="text-center text-black/60 mt-2 max-w-lg mx-auto">BTC, ETH, USDT, XRP, SOL, and more.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {rates.map((asset) => (
                <div key={asset.symbol} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <CryptoLogo symbol={asset.symbol} size={36} />
                  <span className="text-sm font-semibold text-slate-800">{asset.symbol}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TestimonialsMarquee />

        <FaqSection />

        <section id="security" className="max-w-7xl mx-auto px-4 md:px-6 py-20 bg-slate-50">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-black">Security</h2>
            <p className="text-black/70 mt-4">Encrypted sign-in, verified deposits, and ID checks before send or sell.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mt-12">
            {[
              { icon: ShieldCheck, title: "Sign-in", text: "Google or email on wallex.online." },
              { icon: LockKeyhole, title: "KYC", text: "Required to send or sell. Receive and buy work without it." },
              { icon: Zap, title: "Deposits", text: "Paystack top-ups verified on our servers." },
              { icon: Shield, title: "Ledger", text: "Every transfer is recorded on your wallet." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <item.icon className="w-6 h-6 text-black" />
                <h3 className="mt-4 text-lg font-bold text-black">{item.title}</h3>
                <p className="mt-2 text-sm text-black/70">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href={supportMailto()} className="inline-flex rounded-2xl bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-800">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg" />
                <span className="font-bold text-slate-950">Wallex</span>
              </div>
              <p className="text-sm text-black/60 mt-2 max-w-xs">Crypto wallet · wallex.online</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 text-sm">
              <button type="button" onClick={() => setAuthMode("signup")} className="font-semibold text-slate-950 hover:text-cyan-700">
                Create wallet
              </button>
              <a href={supportMailto()} className="text-slate-500 hover:text-slate-950">
                Support
              </a>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-8">© {new Date().getFullYear()} Wallex · All rights reserved</p>
        </div>
      </footer>

      {authMode ? <AuthDialog mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} /> : null}
    </div>
  );
}
