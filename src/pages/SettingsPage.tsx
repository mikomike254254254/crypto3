import { useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Smartphone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface SettingsPageProps {
  onCurrencyChange?: (currency: string) => void;
  onLogout?: () => void;
  onKYC?: () => void;
  onSupport?: () => void;
  kycVerified?: boolean;
}

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "KSH", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "EUR", name: "Euro", symbol: "EUR" },
  { code: "GBP", name: "British Pound", symbol: "GBP" },
  { code: "JPY", name: "Japanese Yen", symbol: "JPY" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "CNY" },
  { code: "INR", name: "Indian Rupee", symbol: "INR" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
];

export function SettingsPage({ onCurrencyChange, onLogout, onKYC, onSupport, kycVerified }: SettingsPageProps) {
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleCurrencySelect = (code: string) => {
    setSelectedCurrency(code);
    onCurrencyChange?.(code);
    setShowCurrencyModal(false);
  };

  const accountSettings = [
    { icon: User, label: "Personal Info", description: "Name, email, phone number" },
    { icon: CreditCard, label: "Payment Methods", description: "Cards & bank accounts" },
    {
      icon: FileText,
      label: "Documents",
      description: kycVerified ? "KYC verified" : "KYC & verification",
      onClick: onKYC,
    },
  ];

  const securitySettings = [
    { icon: Lock, label: "Change Password", description: "Update your password" },
    {
      icon: Smartphone,
      label: "Two-Factor Auth",
      description: "Extra security layer",
      toggle: true,
      value: biometric,
      onChange: () => setBiometric(!biometric),
    },
    { icon: Globe, label: "Auto-Lock", description: "5 min" },
  ];

  const privacySettings = [
    {
      icon: Eye,
      label: "Hide Balance",
      description: "Hide amounts on balance screens",
      toggle: true,
      value: hideBalance,
      onChange: () => setHideBalance(!hideBalance),
    },
  ];

  const notificationSettings = [
    {
      icon: Bell,
      label: "Push Notifications",
      description: "General alerts",
      toggle: true,
      value: notifications,
      onChange: () => setNotifications(!notifications),
    },
    {
      icon: DollarSign,
      label: "Price Alerts",
      description: "Crypto price changes",
      toggle: true,
      value: priceAlerts,
      onChange: () => setPriceAlerts(!priceAlerts),
    },
    {
      icon: CreditCard,
      label: "Transaction Alerts",
      description: "Send & receive notifications",
      toggle: true,
      value: transactionAlerts,
      onChange: () => setTransactionAlerts(!transactionAlerts),
    },
  ];

  const supportSettings = [
    { icon: HelpCircle, label: "Help Center", description: "FAQs & guides", onClick: () => window.open("https://wallex.online/#security", "_blank", "noopener,noreferrer") },
    { icon: MessageCircle, label: "Contact Support", description: "Chat with us", onClick: onSupport },
    { icon: Mail, label: "Feedback", description: "Send suggestions", onClick: () => window.location.assign("mailto:mikomike420@gmail.com?subject=Wallex%20feedback") },
    { icon: Info, label: "About", description: "App version & info", onClick: () => setShowAbout(true) },
  ];

  const renderSettingsItem = (item: any, index: number, isLast: boolean) => (
    <div
      key={index}
      className={`flex items-center gap-3 p-4 ${!isLast ? (isDark ? "border-b border-neutral-800" : "border-b border-neutral-100") : ""} ${
        item.onClick || item.toggle ? (isDark ? "cursor-pointer hover:bg-neutral-800" : "cursor-pointer hover:bg-neutral-50") : ""
      }`}
      onClick={item.toggle ? item.onChange : item.onClick}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`}>
        <item.icon className={`w-4 h-4 ${isDark ? "text-white" : "text-black"}`} />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{item.label}</p>
        <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{item.description}</p>
      </div>
      {item.toggle ? (
        <button
          onClick={(event) => {
            event.stopPropagation();
            item.onChange();
          }}
          className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${item.value ? "bg-green-500" : "bg-neutral-200"}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${item.value ? "right-0.5" : "left-0.5"}`} />
        </button>
      ) : (
        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
      )}
    </div>
  );

  const renderSection = (title: string, items: any[]) => (
    <div className="mb-4">
      <h3 className={`text-xs font-semibold uppercase mb-2 px-1 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{title}</h3>
      <div className={`rounded-2xl shadow-sm overflow-hidden ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
        {items.map((item, index) => renderSettingsItem(item, index, index === items.length - 1))}
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-6">
      <h1 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Settings</h1>

      <button
        onClick={() => setShowCurrencyModal(true)}
        className="w-full text-left bg-gradient-to-br from-black via-neutral-800 to-neutral-600 rounded-2xl p-4 mb-4"
        style={{ boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Currency</p>
              <p className="text-xs text-white/70">Display amounts in your preferred currency</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white bg-white/20 px-3 py-1 rounded-full">{selectedCurrency}</span>
            <ChevronRight className="w-4 h-4 text-white/60" />
          </div>
        </div>
      </button>

      {renderSection("Account", accountSettings)}
      {renderSection("Security", securitySettings)}
      {renderSection("Privacy", privacySettings)}
      {renderSection("Notifications", notificationSettings)}
      {renderSection("Support", supportSettings)}

      <div className="mb-4">
        <h3 className={`text-xs font-semibold uppercase mb-2 px-1 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Appearance</h3>
        <div className={`rounded-2xl shadow-sm overflow-hidden ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
          <div className="flex items-center gap-3 p-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`}>
              <Moon className={`w-4 h-4 ${isDark ? "text-white" : "text-black"}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Dark Mode</p>
              <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Switch to dark theme</p>
            </div>
            <button onClick={toggleTheme} className={`w-11 h-6 rounded-full transition-all relative ${isDark ? "bg-green-500" : "bg-neutral-200"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${isDark ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
          <div className={`flex items-center gap-3 p-4 ${isDark ? "border-t border-neutral-800" : "border-t border-neutral-100"}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`}>
              <Globe className={`w-4 h-4 ${isDark ? "text-white" : "text-black"}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Language</p>
              <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>English (US)</p>
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className={`text-xs font-semibold uppercase mb-2 px-1 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Danger Zone</h3>
        <div className={`rounded-2xl shadow-sm overflow-hidden ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
          <button onClick={onLogout} className={`w-full flex items-center gap-3 p-4 ${isDark ? "border-b border-neutral-800" : "border-b border-neutral-100"}`}>
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-500">Log Out</p>
              <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Sign out of your account</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-500">Delete Account</p>
              <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Permanently delete your account</p>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-400"}`}>Version 1.0.0</p>
        <p className={`text-xs mt-1 ${isDark ? "text-neutral-500" : "text-gray-400"}`}>(c) 2026 Wallex</p>
      </div>

      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className={`w-full rounded-t-3xl max-h-[80%] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 ${isDark ? "bg-neutral-950" : "bg-white"}`}>
            <div className={`p-4 flex items-center justify-between ${isDark ? "border-b border-neutral-800" : "border-b border-neutral-100"}`}>
              <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>Select Currency</h2>
              <button onClick={() => setShowCurrencyModal(false)} className={`p-2 rounded-full ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"}`}>
                <X className={`w-5 h-5 ${isDark ? "text-neutral-300" : "text-gray-600"}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency.code)}
                  className={`w-full flex items-center gap-3 p-4 transition-colors ${
                    isDark ? "border-b border-neutral-800 hover:bg-neutral-900" : "border-b border-neutral-100 hover:bg-neutral-50"
                  } ${
                    selectedCurrency === currency.code ? (isDark ? "bg-neutral-900" : "bg-neutral-50") : ""
                  }`}
                >
                  <span className={`text-sm font-semibold w-10 ${isDark ? "text-white" : "text-black"}`}>{currency.code}</span>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{currency.name}</p>
                    <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{currency.code} - {currency.symbol}</p>
                  </div>
                  {selectedCurrency === currency.code && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className={`p-4 ${isDark ? "border-t border-neutral-800 bg-neutral-900" : "border-t border-neutral-100 bg-neutral-50"}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>QUICK SELECT</p>
              <div className="flex flex-wrap gap-2">
                {currencies.slice(0, 6).map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencySelect(currency.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedCurrency === currency.code
                        ? "bg-black text-white"
                        : isDark ? "bg-neutral-950 text-neutral-300 border border-neutral-700 hover:border-neutral-500" : "bg-white text-gray-600 border border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {currency.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className={`w-full rounded-t-3xl p-5 ${isDark ? "bg-neutral-950" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>About Wallex</h2>
              <button onClick={() => setShowAbout(false)} className={`p-2 rounded-full ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"}`}>
                <X className={`w-5 h-5 ${isDark ? "text-neutral-300" : "text-gray-600"}`} />
              </button>
            </div>
            <div className={`space-y-2 text-sm ${isDark ? "text-neutral-300" : "text-gray-600"}`}>
              <p>Wallex is your wallet for secure sign in, crypto transfers, KYC review, and admin-issued rewards.</p>
              <p>Support lives inside the app settings so the wallet stays focused until you need help.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
