import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  Gift,
  Home,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { clearAdminSession, readAdminSession, writeAdminSession } from "../lib/adminSession";
import { AdminDashboardData, AdminUser, fetchAdminDashboard, loginAdminPanel, runAdminAction } from "../services/adminBackend";

type AdminSection = "dashboard" | "users" | "transactions" | "balances";

const emptyDashboard: AdminDashboardData = {
  totals: { users: 0, tvl: 0, pendingKyc: 0, transactions: 0 },
  users: [],
  transactions: [],
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const tokenPrices: Record<string, number> = {
  USDT: 1,
  XRP: 0.5234,
  BTC: 43250,
  ETH: 2285.5,
};

function statusClass(status: string) {
  if (status === "verified" || status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "rejected" || status === "failed") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function firstWalletSymbol(user: AdminUser) {
  return user.wallets[0]?.symbol || "USDT";
}

function walletUsdValue(user: AdminUser) {
  return user.wallets.reduce((sum, wallet) => sum + wallet.balance * (tokenPrices[wallet.symbol] || 1), 0);
}

export function AdminPage() {
  const [adminSession, setAdminSession] = useState(readAdminSession());
  const [loginEmail, setLoginEmail] = useState("mikomike420@gmail.com");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [section, setSection] = useState<AdminSection>("dashboard");
  const [data, setData] = useState<AdminDashboardData>(emptyDashboard);
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [walletKey, setWalletKey] = useState("usdt");
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState("deposit");
  const [kycStatus, setKycStatus] = useState("verified");
  const [actionMode, setActionMode] = useState<"set_balance" | "award" | "create_transaction" | "wallet_transfer">("award");
  const [toUserId, setToUserId] = useState("");
  const [debitSender, setDebitSender] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedUser = useMemo(
    () => data.users.find((item) => item.id === selectedUserId) || data.users[0],
    [data.users, selectedUserId],
  );

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.users;
    return data.users.filter((item) =>
      [item.name, item.email, item.walletAddress, item.kycStatus].some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [data.users, query]);

  const dashboardTvl = data.users.reduce((sum, item) => sum + walletUsdValue(item), 0);

  const loadDashboard = () => {
    if (!adminSession) return;

    setLoading(true);
    setError("");
    fetchAdminDashboard()
      .then((nextData) => {
        setData(nextData);
        setSelectedUserId((current) => current || nextData.users[0]?.id || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Admin data could not be loaded"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (adminSession) {
      loadDashboard();
    }
  }, [adminSession?.token]);

  useEffect(() => {
    if (selectedUser?.wallets[0]?.id) {
      setWalletKey(selectedUser.wallets[0].id);
    }
  }, [selectedUser?.id]);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const session = await loginAdminPanel(loginEmail, loginPassword);
      const next = { email: session.email, token: session.token, expiresAt: session.expiresAt };
      writeAdminSession(next);
      setAdminSession(next);
      setLoginPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setAdminSession(null);
    setData(emptyDashboard);
  };

  const submitAction = async () => {
    if (!selectedUser) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const nextData = await runAdminAction({
        action: actionMode,
        userId: selectedUser.id,
        toUserId: actionMode === "wallet_transfer" ? toUserId : undefined,
        walletKey,
        amount: Number(amount),
        type: txType,
        debitUser: actionMode === "wallet_transfer" ? debitSender : undefined,
      });
      setData(nextData);
      setNotice("Admin action saved.");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin action failed");
    } finally {
      setSaving(false);
    }
  };

  const updateKyc = async (target: AdminUser) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const nextData = await runAdminAction({
        action: "update_kyc",
        userId: target.id,
        kycStatus,
      });
      setData(nextData);
      setNotice(`${target.name}'s KYC status updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC update failed");
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: Home },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "transactions" as const, label: "Transactions", icon: BadgeDollarSign },
    { id: "balances" as const, label: "Balances", icon: Wallet },
  ];

  if (!adminSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-3xl border border-slate-200 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-black overflow-hidden">
              <img src="/wallex-logo.jpg" alt="Wallex" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Wallex Admin</h1>
              <p className="text-xs text-slate-500">wallex.online/mikeadmin</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6">Secure operations console. Authorized staff only — password required.</p>

          {loginError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loginError}</div> : null}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin email</label>
              <div className="relative mt-2">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin password</label>
              <div className="relative mt-2">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full rounded-2xl bg-slate-950 text-white py-3.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Sign in to admin
            </button>
          </div>

          <a href="/" className="mt-6 block text-center text-sm text-cyan-700 hover:text-cyan-900 font-medium">
            ← Back to wallex.online
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 p-6 flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-black rounded-2xl overflow-hidden">
              <img src="/wallex-logo.jpg" alt="Wallex" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Wallex</h1>
              <p className="text-xs text-slate-500">Admin · {adminSession.email}</p>
            </div>
          </div>
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-medium transition ${section === item.id ? "bg-cyan-100 text-slate-950" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 text-sm font-medium">
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users..."
                className="w-full rounded-2xl bg-slate-100 border border-slate-200 py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
            <button type="button" onClick={loadDashboard} className="rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50" aria-label="Refresh">
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </button>
            <a href="/" className="hidden sm:inline text-sm font-medium text-cyan-700 hover:text-cyan-900">View site</a>
          </header>

          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto flex gap-2">
            {navItems.map((item) => (
              <button key={item.id} type="button" onClick={() => setSection(item.id)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-medium ${section === item.id ? "bg-cyan-100 text-slate-950" : "bg-slate-100 text-slate-600"}`}>
                {item.label}
              </button>
            ))}
          </div>

          <section className="p-4 md:p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-slate-950 capitalize">{section}</h2>
              <p className="text-sm text-slate-500 mt-1">Manage clients, KYC, transfers, and ledger on wallex.online</p>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {notice && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

            {section === "dashboard" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-sm text-slate-500">TVL</p>
                  <p className="text-3xl font-semibold text-slate-950 mt-2">{money.format(dashboardTvl)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-sm text-slate-500">Users</p>
                  <p className="text-3xl font-semibold text-slate-950 mt-2">{data.totals.users}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-sm text-slate-500">Pending KYC</p>
                  <p className="text-3xl font-semibold text-amber-600 mt-2">{data.totals.pendingKyc}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-sm text-slate-500">Transactions</p>
                  <p className="text-3xl font-semibold text-slate-950 mt-2">{data.totals.transactions}</p>
                </div>
              </div>
            )}

            {(section === "users" || section === "balances") && (
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="p-4 text-left font-medium">User</th>
                          <th className="p-4 text-left font-medium">Wallet</th>
                          <th className="p-4 text-left font-medium">Balance</th>
                          <th className="p-4 text-left font-medium">KYC</th>
                          <th className="p-4 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <p className="font-semibold text-slate-950">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.email}</p>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-500">{item.walletAddress || item.id.slice(0, 12)}</td>
                            <td className="p-4 font-semibold text-slate-950">{money.format(walletUsdValue(item))}</td>
                            <td className="p-4">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(item.kycStatus)}`}>{item.kycStatus.replace("_", " ")}</span>
                            </td>
                            <td className="p-4">
                              <button type="button" onClick={() => setSelectedUserId(item.id)} className="text-cyan-700 font-semibold hover:text-cyan-900">
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 h-fit">
                  <h3 className="text-lg font-semibold text-slate-950">Admin action</h3>
                  <p className="text-sm text-slate-500 mt-1">{selectedUser ? selectedUser.email : "No user selected"}</p>

                  <div className="space-y-4 mt-5">
                    <select value={selectedUser?.id || ""} onChange={(event) => setSelectedUserId(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                      {data.users.map((item) => (
                        <option key={item.id} value={item.id}>{item.email || item.name}</option>
                      ))}
                    </select>
                    <select value={actionMode} onChange={(event) => setActionMode(event.target.value as typeof actionMode)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                      <option value="award">Award crypto</option>
                      <option value="wallet_transfer">Transfer to user wallet</option>
                      <option value="set_balance">Set balance</option>
                      <option value="create_transaction">Create transaction</option>
                    </select>
                    {actionMode === "wallet_transfer" && (
                      <>
                        <select value={toUserId} onChange={(event) => setToUserId(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                          <option value="">Select recipient</option>
                          {data.users.filter((item) => item.id !== selectedUser?.id).map((item) => (
                            <option key={item.id} value={item.id}>{item.email || item.name}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" checked={debitSender} onChange={(event) => setDebitSender(event.target.checked)} />
                          Debit selected user&apos;s balance (off = credit from system)
                        </label>
                      </>
                    )}
                    <select value={walletKey} onChange={(event) => setWalletKey(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                      {(selectedUser?.wallets.length ? selectedUser.wallets : [{ id: "usdt", symbol: "USDT" } as any]).map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>{wallet.symbol}</option>
                      ))}
                    </select>
                    {actionMode === "create_transaction" && (
                      <select value={txType} onChange={(event) => setTxType(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                        <option value="deposit">Deposit</option>
                        <option value="withdraw">Withdrawal</option>
                        <option value="receive">Reward</option>
                      </select>
                    )}
                    <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" placeholder={`Amount in ${selectedUser ? firstWalletSymbol(selectedUser) : "USDT"}`} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                    <button type="button" onClick={submitAction} disabled={saving || !selectedUser} className="w-full rounded-2xl bg-cyan-500 text-white py-3 text-sm font-semibold hover:bg-cyan-600 disabled:opacity-60 flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                      Save action
                    </button>
                  </div>

                  {selectedUser && (
                    <div className="border-t border-slate-100 mt-5 pt-5">
                      <h4 className="text-sm font-semibold text-slate-950 mb-3">KYC status</h4>
                      <div className="flex gap-2">
                        <select value={kycStatus} onChange={(event) => setKycStatus(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                          <option value="verified">Verified</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                          <option value="not_started">Not started</option>
                        </select>
                        <button type="button" onClick={() => updateKyc(selectedUser)} disabled={saving} className="rounded-2xl bg-slate-950 text-white px-4 py-2 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === "transactions" && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-4 text-left font-medium">From</th>
                        <th className="p-4 text-left font-medium">To</th>
                        <th className="p-4 text-left font-medium">Type</th>
                        <th className="p-4 text-left font-medium">Amount</th>
                        <th className="p-4 text-left font-medium">Status</th>
                        <th className="p-4 text-left font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="p-4 font-mono text-xs text-slate-500">{tx.fromWallet?.slice(0, 14) || "—"}</td>
                          <td className="p-4 font-mono text-xs text-slate-500">{tx.toWallet?.slice(0, 14) || "—"}</td>
                          <td className="p-4 capitalize text-slate-950">{tx.type}</td>
                          <td className="p-4 font-semibold text-slate-950">{tx.amount} {tx.currency}</td>
                          <td className="p-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(tx.status)}`}>{tx.status}</span>
                          </td>
                          <td className="p-4 text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {!data.transactions.length && (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-slate-400">No transactions yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
