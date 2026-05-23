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
import { SwapModal } from "./components/SwapModal";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PaySendPage } from "./pages/PaySendPage";
import { AdminPage } from "./pages/AdminPage";
import { NotificationBanner } from "./components/NotificationBanner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Crypto, Transaction, Wallet } from "./types/crypto";
import { loadUserSettings } from "./lib/userSettings";
import {
  applyReferralCode,
  createWalletTransaction,
  dismissNotification,
  fetchNotificationsFromBackend,
  fetchProfileFromBackend,
  fetchTransactionsFromBackend,
  fetchWalletsFromBackend,
  markAllNotificationsRead,
  updateProfileInBackend,
  WalletNotification,
} from "./services/walletBackend";
import { marketAssetsToCrypto, useLiveMarketPrices } from "./hooks/useLiveMarketPrices";
import { AppLoadingSkeleton } from "./components/AppLoadingSkeleton";

function AppContent() {
  const { isDark } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [activeMarketTab, setActiveMarketTab] = useState("watchlist");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showKYC, setShowKYC] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [kycStatus, setKycStatus] = useState<"not_started" | "pending" | "verified" | "rejected">("not_started");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileCharacter, setProfileCharacter] = useState<string | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState("usdt");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<WalletNotification[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  const [wallets, setWallets] = useState<Wallet[]>([
    { id: "usdt", name: "USDT Wallet", symbol: "USDT", balance: 0, change: 0.4, color: "green" },
    { id: "xrp", name: "XRP Wallet", symbol: "XRP", balance: 0, change: 1.1, color: "blue" },
    { id: "btc", name: "BTC Wallet", symbol: "BTC", balance: 0, change: -2.1, color: "orange" },
    { id: "eth", name: "ETH Wallet", symbol: "ETH", balance: 0, change: 3.8, color: "blue" },
  ]);

  const { assets: liveAssets } = useLiveMarketPrices();
  const cryptoData: Crypto[] = marketAssetsToCrypto(liveAssets);

  // Check auth and user data on mount
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setProfileLoading(false);
      setOnboardingComplete(false);
      return;
    }

    setProfileLoading(true);

    const savedStatus = localStorage.getItem(`kycStatus:${user.id}`);
    setKycStatus((savedStatus as "not_started" | "pending" | "verified" | "rejected") || "not_started");

    fetchWalletsFromBackend()
      .then(({ wallets: backendWallets }) => setWallets(backendWallets))
      .catch((error) => console.warn("Wallet backend unavailable, using local wallet state.", error));

    fetchProfileFromBackend()
      .then(({ profile }) => {
        setKycStatus((profile.kyc_status as "not_started" | "pending" | "verified" | "rejected") || "not_started");
        const done =
          Boolean(profile.onboarding_complete) ||
          Boolean(user.user_metadata?.onboarding_complete) ||
          localStorage.getItem(`wallex.onboarding:${user.id}`) === "true";
        setOnboardingComplete(done);
        setProfileCharacter(profile.avatar_character || (user.user_metadata?.avatar_character as string) || null);
        setProfileAvatarUrl(profile.avatar_url || (user.user_metadata?.avatar_url as string) || null);
      })
      .catch(() => {
        const done =
          Boolean(user.user_metadata?.onboarding_complete) ||
          localStorage.getItem(`wallex.onboarding:${user.id}`) === "true";
        setOnboardingComplete(done);
      })
      .finally(() => setProfileLoading(false));

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

  const currentWallet = wallets.find(w => w.id === selectedWallet) || wallets[0];
  const priceBySymbol = Object.fromEntries(cryptoData.map((crypto) => [crypto.symbol, crypto.price]));
  const totalWalletValue = wallets.reduce((sum, wallet) => sum + wallet.balance * (priceBySymbol[wallet.symbol] || 1), 0);
  const isAdminRoute = window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/mikeadmin");
  const isPayRoute = window.location.pathname === "/pay" || window.location.pathname.startsWith("/pay/");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("wallex.pendingReferral", ref.toUpperCase());
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setDisplayCurrency(loadUserSettings(user.id).currency);
  }, [user?.id]);

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

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore
    }
  };

  const refreshWalletData = async () => {
    await Promise.all([
      fetchWalletsFromBackend().then(({ wallets: w }) => setWallets(w)).catch(() => undefined),
      fetchTransactionsFromBackend().then(({ transactions: t }) => setTransactions(t)).catch(() => undefined),
      fetchNotificationsFromBackend().then(({ notifications: n }) => setNotifications(n)).catch(() => undefined),
    ]);
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
      console.warn("Send failed.", error);
      throw error;
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 0:
        return (
          <>
            <div className="px-4 pb-4 pt-1">
              <BalanceCard
                wallet={currentWallet}
                wallets={wallets}
                totalValue={totalWalletValue}
                displayCurrency={displayCurrency}
                priceAssets={liveAssets}
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
                  if (action === "swap") setShowSwap(true);
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
        return (
          <WalletPage
            wallets={wallets}
            totalValue={totalWalletValue}
            displayCurrency={displayCurrency}
            priceAssets={liveAssets}
            transactions={transactions}
            onDeposit={() => setShowDeposit(true)}
            onWithdraw={() => setShowWithdraw(true)}
            kycVerified={kycStatus === "verified"}
          />
        );
      case 3:
        return (
          <ProfilePage
            user={user}
            wallets={wallets}
            transactions={transactions}
            totalValue={totalWalletValue}
            kycStatus={kycStatus}
            avatarCharacterId={profileCharacter}
            avatarUrl={profileAvatarUrl}
            onKYC={() => setShowKYC(true)}
            onAvatarSaved={(characterId, url) => {
              setProfileCharacter(characterId);
              setProfileAvatarUrl(url);
            }}
          />
        );
      case 4:
        return (
          <SettingsPage
            user={user}
            onCurrencyChange={setDisplayCurrency}
            onKYC={() => setShowKYC(true)}
            kycVerified={kycStatus === "verified"}
            onLogout={async () => {
              await signOut();
              window.location.href = "/";
            }}
          />
        );
      default:
        return null;
    }
  };

  if (authLoading || (user && profileLoading)) {
    return <AppLoadingSkeleton />;
  }

  if (!user) {
    if (isPayRoute) {
      return (
        <PaySendPage
          user={null}
          wallets={[]}
          kycVerified={false}
          onSend={async () => undefined}
          onNeedLogin={() => {
            window.history.replaceState(null, "", "/");
          }}
          onNeedKyc={() => undefined}
          onDone={() => {
            window.history.replaceState(null, "", "/");
          }}
        />
      );
    }
    return <LandingPage />;
  }

  if (!onboardingComplete) {
    return (
      <OnboardingPage
        skipAuth
        characterOnly
        initialEmail={user.email || ""}
        onComplete={() => {
          if (user?.id) {
            localStorage.setItem(`wallex.onboarding:${user.id}`, "true");
          }
          setOnboardingComplete(true);
          fetchProfileFromBackend()
            .then(({ profile }) => {
              setProfileCharacter(profile.avatar_character || null);
              setProfileAvatarUrl(profile.avatar_url || null);
            })
            .catch(() => undefined);
          fetchWalletsFromBackend().then(({ wallets: backendWallets }) => setWallets(backendWallets)).catch(() => undefined);
          const pendingRef = localStorage.getItem("wallex.pendingReferral");
          if (pendingRef) {
            applyReferralCode(pendingRef)
              .then(() => localStorage.removeItem("wallex.pendingReferral"))
              .catch(() => undefined);
          }
        }}
      />
    );
  }

  if (isPayRoute) {
    return (
      <>
        <PaySendPage
          user={user}
          wallets={wallets}
          kycVerified={kycStatus === "verified"}
          onSend={handleSend}
          onNeedLogin={() => {
            window.history.replaceState(null, "", "/");
          }}
          onNeedKyc={() => setShowKYC(true)}
          onDone={() => {
            window.history.replaceState(null, "", "/");
          }}
        />
        {showKYC && <KYCModal onClose={() => setShowKYC(false)} onComplete={handleKYCComplete} />}
      </>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-neutral-200"}`}>
      <div className={`w-full min-h-screen relative transition-colors duration-300 ${isDark ? "bg-neutral-950" : "bg-neutral-100"}`}>
        <div className={`min-h-screen overflow-y-auto pb-28 pt-1 transition-colors duration-300 scroll-smooth-y page-scroll-in ${isDark ? "bg-neutral-950" : "bg-neutral-100"}`}>
          <div className="mx-auto w-full max-w-5xl">
            <NotificationBanner notifications={notifications} onDismiss={handleDismissNotification} />
            <Header
              walletId={currentWallet.accountNumber || currentWallet.address}
              avatarCharacterId={profileCharacter}
              avatarUrl={profileAvatarUrl}
              notifications={notifications}
              onDismissNotification={handleDismissNotification}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onSync={refreshWalletData}
            />
            <div key={activeTab} className="tab-panel-enter">
              {renderPage()}
            </div>
          </div>
        </div>
        <Footer activeTab={activeTab} onTabChange={setActiveTab} />
        
        {showDeposit && (
          <DepositModal 
            wallet={currentWallet}
            wallets={wallets}
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
        {showSwap && (
          <SwapModal
            wallets={wallets}
            onClose={() => setShowSwap(false)}
            onSwapped={(nextWallets) => {
              setWallets(nextWallets);
              fetchTransactionsFromBackend()
                .then(({ transactions: backendTransactions }) => setTransactions(backendTransactions))
                .catch(() => undefined);
            }}
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
