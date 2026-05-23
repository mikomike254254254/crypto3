import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { BalanceCard } from "./components/BalanceCard";
import { QuickActions } from "./components/QuickActions";
import { Markets } from "./components/Markets";
import { Footer } from "./components/Footer";
import { ExplorePage } from "./pages/ExplorePage";
import { WalletPage } from "./pages/WalletPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { DepositModal } from "./components/DepositModal";
import { WithdrawModal } from "./components/WithdrawModal";
import { KYCModal } from "./components/KYCModal";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { AdminPage } from "./pages/AdminPage";
import { NotificationBanner } from "./components/NotificationBanner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Crypto, Transaction, Wallet } from "./types/crypto";
import { openSupportChat, setSupportVisibility } from "./lib/supportWidget";
import {
  createWalletTransaction,
  dismissNotification,
  fetchNotificationsFromBackend,
  fetchProfileFromBackend,
  fetchTransactionsFromBackend,
  fetchWalletsFromBackend,
  updateProfileInBackend,
  WalletNotification,
} from "./services/walletBackend";

function AppContent() {
  const { isDark } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [activeMarketTab, setActiveMarketTab] = useState("watchlist");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showKYC, setShowKYC] = useState(false);
  const [kycStatus, setKycStatus] = useState<"not_started" | "pending" | "verified" | "rejected">("not_started");
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState("usdt");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<WalletNotification[]>([]);

  const [wallets, setWallets] = useState<Wallet[]>([
    { id: "usdt", name: "USDT Wallet", symbol: "USDT", balance: 0, change: 0.4, color: "green" },
    { id: "xrp", name: "XRP Wallet", symbol: "XRP", balance: 0, change: 1.1, color: "blue" },
    { id: "btc", name: "BTC Wallet", symbol: "BTC", balance: 0, change: -2.1, color: "orange" },
    { id: "eth", name: "ETH Wallet", symbol: "ETH", balance: 0, change: 3.8, color: "blue" },
  ]);

  // Crypto data state
  const [cryptoData, setCryptoData] = useState<Crypto[]>([
    { id: "btc", name: "Bitcoin", symbol: "BTC", price: 43250.0, change: 2.34, isUp: true, sparkline: [42000, 42100, 41900, 42300, 42500, 42400, 43250], marketCap: "847.2B", volume: "28.5B" },
    { id: "eth", name: "Ethereum", symbol: "ETH", price: 2285.5, change: -1.28, isUp: false, sparkline: [2300, 2320, 2290, 2280, 2270, 2295, 2285], marketCap: "274.8B", volume: "15.2B" },
    { id: "bnb", name: "BNB", symbol: "BNB", price: 312.45, change: 4.56, isUp: true, sparkline: [298, 302, 305, 308, 310, 311, 312], marketCap: "48.2B", volume: "1.8B" },
    { id: "sol", name: "Solana", symbol: "SOL", price: 98.72, change: 8.92, isUp: true, sparkline: [88, 90, 92, 95, 96, 97, 98], marketCap: "42.1B", volume: "2.3B" },
    { id: "xrp", name: "XRP", symbol: "XRP", price: 0.5234, change: -0.85, isUp: false, sparkline: [0.53, 0.528, 0.525, 0.522, 0.52, 0.524, 0.523], marketCap: "28.4B", volume: "1.1B" },
    { id: "ada", name: "Cardano", symbol: "ADA", price: 0.4521, change: 1.23, isUp: true, sparkline: [0.44, 0.445, 0.448, 0.45, 0.451, 0.452, 0.452], marketCap: "16.1B", volume: "0.4B" },
    { id: "doge", name: "Dogecoin", symbol: "DOGE", price: 0.0821, change: 12.45, isUp: true, sparkline: [0.072, 0.074, 0.076, 0.078, 0.079, 0.08, 0.082], marketCap: "11.7B", volume: "0.9B" },
    { id: "avax", name: "Avalanche", symbol: "AVAX", price: 35.67, change: -3.21, isUp: false, sparkline: [37, 36.8, 36.5, 36.2, 35.9, 35.8, 35.7], marketCap: "13.2B", volume: "0.5B" },
  ]);

  // Check auth and user data on mount
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      return;
    }

    const savedStatus = localStorage.getItem(`kycStatus:${user.id}`);
    setKycStatus((savedStatus as "not_started" | "pending" | "verified" | "rejected") || "not_started");

    fetchWalletsFromBackend()
      .then(({ wallets: backendWallets }) => setWallets(backendWallets))
      .catch((error) => console.warn("Wallet backend unavailable, using local wallet state.", error));

    fetchProfileFromBackend()
      .then(({ profile }) => {
        setKycStatus((profile.kyc_status as "not_started" | "pending" | "verified" | "rejected") || "not_started");
        setOnboardingComplete(Boolean(profile.onboarding_complete));
      })
      .catch((error) => console.warn("Profile backend unavailable, using local profile state.", error));

    fetchTransactionsFromBackend()
      .then(({ transactions: backendTransactions }) => setTransactions(backendTransactions))
      .catch((error) => console.warn("Transaction backend unavailable, using local transaction state.", error));

    fetchNotificationsFromBackend()
      .then(({ notifications: items }) => setNotifications(items))
      .catch((error) => console.warn("Notifications unavailable.", error));
  }, [authLoading, user]);

  useEffect(() => {
    if (!user || !onboardingComplete) return;

    const interval = window.setInterval(() => {
      fetchNotificationsFromBackend()
        .then(({ notifications: items }) => setNotifications(items))
        .catch(() => undefined);

      fetchTransactionsFromBackend()
        .then(({ transactions: backendTransactions }) => setTransactions(backendTransactions))
        .catch(() => undefined);
    }, 20000);

    return () => window.clearInterval(interval);
  }, [onboardingComplete, user]);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCryptoData(prev => prev.map(crypto => ({
        ...crypto,
        price: crypto.price * (1 + (Math.random() - 0.5) * 0.002),
        change: Number(((crypto.change ?? 0) + (Math.random() - 0.5) * 0.1).toFixed(2)),
      })));
    }, 180000);
    return () => clearInterval(interval);
  }, []);

  const currentWallet = wallets.find(w => w.id === selectedWallet) || wallets[0];
  const priceBySymbol = Object.fromEntries(cryptoData.map((crypto) => [crypto.symbol, crypto.price]));
  const totalWalletValue = wallets.reduce((sum, wallet) => sum + wallet.balance * (priceBySymbol[wallet.symbol] || 1), 0);
  const isAdminRoute = window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/mikeadmin");

  useEffect(() => {
    void setSupportVisibility(!user && !isAdminRoute);
  }, [isAdminRoute, user]);

  if (window.location.pathname.startsWith("/admin")) {
    window.history.replaceState(null, "", "/mikeadmin");
    return <AdminPage />;
  }

  if (window.location.pathname.startsWith("/mikeadmin")) {
    return <AdminPage />;
  }

  const handleKYCComplete = () => {
    if (user) {
      localStorage.setItem(`kycStatus:${user.id}`, 'pending');
    }
    setKycStatus("pending");
    setShowKYC(false);
    updateProfileInBackend({ kycStatus: "pending" })
      .catch((error) => console.warn("KYC status saved locally only.", error));
  };

  const handleDeposit = async (amount: number, walletId: string) => {
    setWallets(prev => prev.map(w => 
      w.id === walletId ? { ...w, balance: w.balance + amount } : w
    ));
    setShowDeposit(false);

    try {
      const { wallets: backendWallets } = await createWalletTransaction("deposit", walletId, amount);
      setWallets(backendWallets);
      const { transactions: backendTransactions } = await fetchTransactionsFromBackend();
      setTransactions(backendTransactions);
    } catch (error) {
      console.warn("Deposit saved locally only.", error);
    }
  };

  const handleWithdraw = async (amount: number, walletId: string, address = "", network = "") => {
    if (kycStatus !== "verified") {
      setShowWithdraw(false);
      setShowKYC(true);
      return;
    }
    setWallets(prev => prev.map(w => 
      w.id === walletId ? { ...w, balance: Math.max(0, w.balance - amount) } : w
    ));
    setShowWithdraw(false);

    try {
      const { wallets: backendWallets } = await createWalletTransaction("withdraw", walletId, amount, { address, network });
      setWallets(backendWallets);
      const { transactions: backendTransactions } = await fetchTransactionsFromBackend();
      setTransactions(backendTransactions);
    } catch (error) {
      console.warn("Withdrawal saved locally only.", error);
    }
  };

  const requireKycForSend = () => {
    if (kycStatus !== "verified") {
      setShowKYC(true);
      return false;
    }
    return true;
  };

  const handleDismissNotification = async (id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)));
    try {
      await dismissNotification(id);
    } catch {
      // keep UI dismissed locally
    }
  };

  const handleSend = async (amount: number, walletId: string, address: string, network: string) => {
    if (!requireKycForSend()) {
      setShowDeposit(false);
      return;
    }

    setWallets(prev => prev.map(w =>
      w.id === walletId ? { ...w, balance: Math.max(0, w.balance - amount) } : w
    ));
    setShowDeposit(false);

    try {
      const { wallets: backendWallets } = await createWalletTransaction("send", walletId, amount, { address, network });
      setWallets(backendWallets);
      const { transactions: backendTransactions } = await fetchTransactionsFromBackend();
      setTransactions(backendTransactions);
    } catch (error) {
      console.warn("Send saved locally only.", error);
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 0:
        return (
          <>
            <Header walletId={currentWallet.accountNumber || currentWallet.address} />
            <div className="px-4 pb-4 pt-2">
              <BalanceCard
                wallet={currentWallet}
                wallets={wallets}
                totalValue={totalWalletValue}
                selectedWallet={selectedWallet}
                onWalletChange={setSelectedWallet}
                onDeposit={() => setShowDeposit(true)}
                onWithdraw={() => setShowWithdraw(true)}
                kycVerified={kycStatus === "verified"}
              />
            </div>
            <div className="px-4 pb-5">
              <QuickActions
                onAction={(action) => {
                  if (action === "buy") setShowDeposit(true);
                  if (action === "sell") {
                    if (!requireKycForSend()) return;
                    setShowWithdraw(true);
                  }
                }}
              />
            </div>
            <div className="px-4 pb-6">
              <Markets
                cryptoData={cryptoData}
                activeTab={activeMarketTab}
                onTabChange={setActiveMarketTab}
              />
            </div>
          </>
        );
      case 1:
        return <ExplorePage cryptoData={cryptoData} />;
      case 2:
        return <WalletPage wallets={wallets} totalValue={totalWalletValue} transactions={transactions} onDeposit={() => setShowDeposit(true)} onWithdraw={() => setShowWithdraw(true)} kycVerified={kycStatus === "verified"} />;
      case 3:
        return <ProfilePage user={user} wallets={wallets} transactions={transactions} totalValue={totalWalletValue} kycStatus={kycStatus} onKYC={() => setShowKYC(true)} />;
      case 4:
        return (
          <SettingsPage
            user={user}
            onKYC={() => setShowKYC(true)}
            kycVerified={kycStatus === "verified"}
            onLogout={signOut}
            onSupport={() => { void openSupportChat(); }}
          />
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-900' : 'bg-neutral-300'}`}>
        <div className="w-8 h-8 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (!onboardingComplete) {
    return (
      <OnboardingPage
        skipAuth
        initialEmail={user.email || ""}
        onComplete={() => {
          setOnboardingComplete(true);
          fetchWalletsFromBackend().then(({ wallets: backendWallets }) => setWallets(backendWallets)).catch(() => undefined);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-neutral-950' : 'bg-neutral-200'}`}>
      <div className={`w-full min-h-screen relative transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-neutral-100'}`}>
        <div className={`min-h-screen overflow-y-auto pb-28 pt-1 transition-colors duration-300 scroll-smooth-y ${isDark ? 'bg-black' : 'bg-neutral-100'}`}>
          <div className="mx-auto w-full max-w-5xl">
            <NotificationBanner notifications={notifications} onDismiss={handleDismissNotification} />
            {renderPage()}
          </div>
        </div>
        <Footer activeTab={activeTab} onTabChange={setActiveTab} />
        
        {showDeposit && (
          <DepositModal 
            wallet={currentWallet} 
            onClose={() => setShowDeposit(false)}
            onDeposit={handleDeposit}
            onSend={handleSend}
            kycVerified={kycStatus === "verified"}
            onKYC={() => { setShowDeposit(false); setShowKYC(true); }}
            onPaystackDeposit={async (backendWallets) => {
              setWallets(backendWallets);
              const { transactions: backendTransactions } = await fetchTransactionsFromBackend();
              setTransactions(backendTransactions);
            }}
          />
        )}
        {showWithdraw && (
          <WithdrawModal 
            wallet={currentWallet} 
            wallets={wallets} 
            onClose={() => setShowWithdraw(false)}
            onWithdraw={handleWithdraw}
            kycVerified={kycStatus === "verified"}
            onKYC={() => { setShowWithdraw(false); setShowKYC(true); }}
          />
        )}
        {showKYC && (
          <KYCModal 
            onClose={() => setShowKYC(false)} 
            onComplete={handleKYCComplete}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
