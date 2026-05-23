import { useEffect, useMemo, useState } from "react";
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
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CryptoLogo } from "../components/CryptoLogo";

type AuthMode = "signup" | "signin";

const assets = [
  { symbol: "BTC", name: "Bitcoin", price: 67432, change: 2.4 },
  { symbol: "ETH", name: "Ethereum", price: 3521, change: -1.2 },
  { symbol: "USDT", name: "Tether", price: 1, change: 0.0 },
  { symbol: "SOL", name: "Solana", price: 142, change: 5.8 },
  { symbol: "XRP", name: "XRP", price: 0.52, change: -0.8 },
  { symbol: "ADA", name: "Cardano", price: 0.45, change: 3.2 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.082, change: 1.8 },
  { symbol: "BNB", name: "BNB", price: 612, change: 0.9 },
  { symbol: "AVAX", name: "Avalanche", price: 35.67, change: -0.4 },
  { symbol: "MATIC", name: "Polygon", price: 0.72, change: 2.1 },
  { symbol: "LTC", name: "Litecoin", price: 84.2, change: 0.7 },
  { symbol: "TRX", name: "Tron", price: 0.12, change: 1.1 },
];

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
  const [rates, setRates] = useState(assets);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRates((current) =>
        current.map((asset) => ({
          ...asset,
          price: Math.max(asset.price * (1 + (Math.random() - 0.5) * 0.008), asset.price < 1 ? 0.0001 : 0.01),
          change: asset.change + (Math.random() - 0.5) * 0.2,
        })),
      );
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const featured = useMemo(() => rates.slice(0, 4), [rates]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black overflow-hidden ring-2 ring-slate-100">
              <img src="/wallex-logo.jpg" alt="Wallex" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-950">Wallex</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#markets" className="hover:text-slate-950 transition-colors">Markets</a>
            <a href="#assets" className="hover:text-slate-950 transition-colors">Assets</a>
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
        <section className="relative overflow-hidden bg-gradient-to-b from-cyan-50 via-white to-slate-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.15),transparent_50%)]" />
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center relative">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-cyan-900 shadow-sm">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                Production-ready crypto wallet · wallex.online
              </div>
              <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-950 leading-[1.05]">
                Your crypto wallet.
                <span className="block text-cyan-700">Built for real users.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-600 leading-relaxed">
                Sign up with Google or email, buy with Paystack, receive instantly, and send wallet-to-wallet on Wallex — with KYC protection and live balances.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setAuthMode("signup")} className="rounded-2xl bg-slate-950 text-white px-7 py-4 text-sm font-semibold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/25">
                  Open free wallet
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setAuthMode("signin")} className="rounded-2xl border border-slate-300 bg-white px-7 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  Log in
                </button>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 12+ assets</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Paystack buy</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> KYC send/sell</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 p-5">
              <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Portfolio preview</p>
                    <p className="text-3xl font-bold mt-1">Multi-asset</p>
                  </div>
                  <Wallet className="w-9 h-9 text-cyan-300" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-6">
                  {featured.map((asset) => (
                    <div key={asset.symbol} className="rounded-2xl bg-white/10 p-2 flex flex-col items-center gap-1">
                      <CryptoLogo symbol={asset.symbol} size={32} className="!rounded-xl !border-white/20" />
                      <p className="text-[10px] font-semibold">{asset.symbol}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto scroll-smooth-y">
                {featured.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <CryptoLogo symbol={asset.symbol} size={40} />
                      <div>
                        <p className="font-semibold text-sm">{asset.name}</p>
                        <p className="text-xs text-slate-500">{asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatUsd(asset.price)}</p>
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

        <section id="markets" className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Live market overview</h2>
              <p className="text-slate-500 mt-2">Track major assets with recognizable crypto branding.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Updating
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
                    <p className="font-semibold text-sm">{formatUsd(asset.price)}</p>
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

        <section id="assets" className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
            <h2 className="text-3xl font-bold text-center text-slate-950">Supported cryptocurrencies</h2>
            <p className="text-center text-slate-500 mt-2 max-w-lg mx-auto">Hold, receive, and trade across the assets your clients expect.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {assets.map((asset) => (
                <div key={asset.symbol} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <CryptoLogo symbol={asset.symbol} size={36} />
                  <span className="text-sm font-semibold text-slate-800">{asset.symbol}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <h2 className="text-3xl font-bold text-center text-slate-950 mb-2">Enterprise-grade security</h2>
          <p className="text-center text-slate-500 mb-10 max-w-2xl mx-auto">Built for production traffic — secure auth, verified payments, and protected admin operations.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, title: "Supabase auth", text: "Google OAuth and email login with encrypted sessions on wallex.online." },
              { icon: LockKeyhole, title: "KYC gating", text: "Receive and buy without KYC. Send and sell require verified identity." },
              { icon: Zap, title: "Paystack payments", text: "Card, bank, and mobile money top-ups with server-side verification." },
              { icon: Shield, title: "Locked admin", text: "Operations console at /mikeadmin with email + password — not public." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                <item.icon className="w-8 h-8 text-cyan-600" />
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Supabase</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Paystack</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Google Sign-In</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">SSL · wallex.online</span>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <img src="/wallex-logo.jpg" alt="" className="w-8 h-8 rounded-lg" />
                <span className="font-bold text-slate-950">Wallex</span>
              </div>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">Crypto wallet for your clients — wallex.online</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 text-sm">
              <button type="button" onClick={() => setAuthMode("signup")} className="font-semibold text-slate-950 hover:text-cyan-700">
                Create wallet
              </button>
              <a href="mailto:support@wallex.online" className="text-slate-500 hover:text-slate-950">
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
