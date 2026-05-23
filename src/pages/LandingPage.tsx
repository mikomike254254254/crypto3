import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type AuthMode = "signup" | "signin";

const assets = [
  { symbol: "BTC", mark: "BTC", name: "Bitcoin", price: 67432, change: 2.4, color: "bg-orange-100 text-orange-700" },
  { symbol: "ETH", mark: "ETH", name: "Ethereum", price: 3521, change: -1.2, color: "bg-indigo-100 text-indigo-700" },
  { symbol: "USDT", mark: "USDT", name: "Tether", price: 1, change: 0.0, color: "bg-emerald-100 text-emerald-700" },
  { symbol: "SOL", mark: "SOL", name: "Solana", price: 142, change: 5.8, color: "bg-violet-100 text-violet-700" },
  { symbol: "XRP", mark: "XRP", name: "XRP", price: 0.52, change: -0.8, color: "bg-slate-100 text-slate-700" },
  { symbol: "ADA", mark: "ADA", name: "Cardano", price: 0.45, change: 3.2, color: "bg-sky-100 text-sky-700" },
  { symbol: "DOGE", mark: "DOGE", name: "Dogecoin", price: 0.082, change: 1.8, color: "bg-amber-100 text-amber-700" },
  { symbol: "BNB", mark: "BNB", name: "BNB", price: 612, change: 0.9, color: "bg-yellow-100 text-yellow-700" },
  { symbol: "AVAX", mark: "AVAX", name: "Avalanche", price: 35.67, change: -0.4, color: "bg-red-100 text-red-700" },
  { symbol: "MATIC", mark: "MATIC", name: "Polygon", price: 0.72, change: 2.1, color: "bg-purple-100 text-purple-700" },
  { symbol: "LTC", mark: "LTC", name: "Litecoin", price: 84.2, change: 0.7, color: "bg-zinc-100 text-zinc-700" },
  { symbol: "TRX", mark: "TRX", name: "Tron", price: 0.12, change: 1.1, color: "bg-rose-100 text-rose-700" },
];

function formatUsd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  });
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

  const title = mode === "signup" ? "Open your Wallex wallet" : "Log in to Wallex";
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
            <p className="text-sm text-slate-500 mt-1">Supabase keeps your wallet account and session secure.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {confirmationEmail ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Account created. Open the confirmation link sent to {confirmationEmail}, then come back and log in.
            </div>
          ) : null}

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

          <button
            onClick={() => {
              setLoading(true);
              setError("");
              signInWithGoogle().catch((err) => {
                setLoading(false);
                setError(err instanceof Error ? err.message : "Google sign in failed");
              });
            }}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50 disabled:opacity-60"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
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
            <button onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 text-white py-3 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Please wait..." : submitText}
          </button>

          <button
            onClick={() => onModeChange(mode === "signup" ? "signin" : "signup")}
            className="w-full text-sm text-slate-500 hover:text-slate-950"
          >
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
  const [rates, setRates] = useState(assets.slice(0, 6));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRates((current) =>
        current.map((asset) => ({
          ...asset,
          price: Math.max(asset.price * (1 + (Math.random() - 0.5) * 0.01), asset.price < 1 ? 0.0001 : 0.01),
          change: asset.change + (Math.random() - 0.5) * 0.3,
        })),
      );
    }, 180000);

    return () => window.clearInterval(interval);
  }, []);

  const featured = useMemo(() => rates.slice(0, 3), [rates]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black overflow-hidden flex items-center justify-center">
              <img src="/wallex-logo.jpg" alt="Wallex" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">Wallex</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#rates" className="hover:text-slate-950">Rates</a>
            <a href="#currencies" className="hover:text-slate-950">Currencies</a>
            <a href="#security" className="hover:text-slate-950">Security</a>
            <a href="/mikeadmin" className="hover:text-slate-950">Admin</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setAuthMode("signin")} className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Log in</button>
            <button onClick={() => setAuthMode("signup")} className="rounded-2xl bg-slate-950 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800">Open wallet</button>
          </div>
          <button onClick={() => setMenuOpen((current) => !current)} className="md:hidden rounded-2xl p-2 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        {menuOpen ? (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2">
            <a href="#rates" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-50">Rates</a>
            <a href="#currencies" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-slate-50">Currencies</a>
            <button onClick={() => setAuthMode("signin")} className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-slate-50">Log in</button>
            <button onClick={() => setAuthMode("signup")} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Open wallet</button>
          </div>
        ) : null}
      </nav>

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ecfeff_0%,#f8fafc_70%)]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-[1fr_440px] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-800">
                <Sparkles className="w-4 h-4" />
                Secure crypto wallet for everyday use
              </div>
              <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight text-slate-950 leading-[0.95]">
                Wallex
              </h1>
              <p className="mt-6 max-w-2xl text-lg md:text-xl text-slate-600 leading-8">
                Create a wallet, sign in with Google or email, track supported assets, submit KYC, and receive admin-issued rewards directly in your Supabase-backed account.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button onClick={() => setAuthMode("signup")} className="rounded-2xl bg-slate-950 text-white px-6 py-4 text-sm font-semibold hover:bg-slate-800 flex items-center justify-center gap-2">
                  Open your wallet
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setAuthMode("signin")} className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  Log in
                </button>
              </div>
              <div className="mt-8 grid grid-cols-3 max-w-xl gap-4">
                <div>
                  <p className="text-2xl font-semibold text-slate-950">12+</p>
                  <p className="text-sm text-slate-500">Assets</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-950">KYC</p>
                  <p className="text-sm text-slate-500">Ready</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-950">Admin</p>
                  <p className="text-sm text-slate-500">Rewards</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-5">
              <div className="rounded-3xl bg-slate-950 text-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total balance</p>
                    <p className="text-3xl font-semibold mt-1">$12,573.00</p>
                  </div>
                  <Wallet className="w-8 h-8 text-cyan-300" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-8">
                  {featured.map((asset) => (
                    <div key={asset.symbol} className="rounded-2xl bg-white/10 p-3">
                      <p className="text-sm font-semibold">{asset.mark}</p>
                      <p className="text-xs text-slate-300 mt-2">{asset.symbol}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {featured.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-semibold ${asset.color}`}>{asset.mark}</div>
                      <div>
                        <p className="font-semibold">{asset.name}</p>
                        <p className="text-xs text-slate-500">{asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatUsd(asset.price)}</p>
                      <p className={`text-xs ${asset.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{asset.change >= 0 ? "+" : ""}{asset.change.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="rates" className="max-w-7xl mx-auto px-4 md:px-6 py-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Live USD Rates</h2>
              <p className="text-slate-500 mt-2">Auto-updating demo prices for the supported Wallex assets.</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rates.map((asset) => (
              <div key={asset.symbol} className="rounded-2xl bg-white border border-slate-200 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-semibold ${asset.color}`}>{asset.mark}</div>
                  <div>
                    <p className="font-semibold text-slate-950">{asset.name}</p>
                    <p className="text-sm text-slate-500">{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatUsd(asset.price)}</p>
                  <p className={`text-sm flex items-center justify-end gap-1 ${asset.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {asset.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {asset.change >= 0 ? "+" : ""}{asset.change.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="currencies" className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
            <h2 className="text-3xl font-semibold tracking-tight text-center">Supported crypto symbols</h2>
            <p className="text-center text-slate-500 mt-2">Clean, readable symbols with standard asset tickers.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
              {assets.map((asset) => (
                <div key={asset.symbol} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-semibold ${asset.color}`}>{asset.mark}</div>
                  <p className="mt-3 font-semibold">{asset.name}</p>
                  <p className="text-sm text-slate-500">{asset.symbol}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="max-w-7xl mx-auto px-4 md:px-6 py-16 grid md:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-white border border-slate-200 p-6">
            <ShieldCheck className="w-8 h-8 text-cyan-600" />
            <h3 className="mt-5 text-xl font-semibold">Supabase auth</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Google OAuth and email/password sessions are handled through the same auth provider as the wallet app.</p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200 p-6">
            <LockKeyhole className="w-8 h-8 text-cyan-600" />
            <h3 className="mt-5 text-xl font-semibold">Private admin access</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Admin actions run through server routes with the service role key kept out of browser code.</p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200 p-6">
            <Zap className="w-8 h-8 text-cyan-600" />
            <h3 className="mt-5 text-xl font-semibold">Reward flow</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Admins can credit balances and create transaction history that users see when they open their wallet.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Wallex wallet, auth, admin, and rewards connected.
          </div>
          <button onClick={() => setAuthMode("signup")} className="font-semibold text-slate-950 hover:text-cyan-700">Create wallet</button>
        </div>
      </footer>

      {authMode ? <AuthDialog mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} /> : null}
    </div>
  );
}
