import { useState } from "react";
import { 
  User, Shield, Bell, CreditCard, FileText, ChevronRight, 
  Check, AlertTriangle, UserCheck, ArrowRight, Copy
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Transaction, Wallet } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";

interface ProfilePageProps {
  onKYC?: () => void;
  wallets?: Wallet[];
  transactions?: Transaction[];
  totalValue?: number;
  kycStatus?: "not_started" | "pending" | "verified" | "rejected";
  user?: SupabaseUser | null;
}

export function ProfilePage({ onKYC, wallets = [], transactions = [], totalValue = 0, kycStatus = "not_started", user: authUser }: ProfilePageProps) {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();
  const fullName = authUser?.user_metadata?.full_name || authUser?.email?.split("@")[0] || "Wallet User";
  const email = authUser?.email || "signed-in user";
  const primaryWallet = wallets[0]?.address || "No wallet yet";
  const totalTransactions = transactions.length;
  const totalVolume = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const joinDate = authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently";
  const initials = fullName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
  const kycVerified = kycStatus === "verified";
  const kycPending = kycStatus === "pending";

  const menuItems = [
    { icon: Shield, label: 'Security', description: 'Password & 2FA', badge: 'Strong' },
    { icon: Bell, label: 'Notifications', description: 'Alerts & emails' },
    { icon: CreditCard, label: 'Payment Methods', description: 'Cards & banks' },
    { icon: FileText, label: 'Transaction History', description: 'View all activity' },
  ];

  const copyWallet = async () => {
    await navigator.clipboard.writeText(primaryWallet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="px-4 pt-2 pb-6">
      {/* Header */}
      <h1 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Profile</h1>

      {/* Profile Card */}
      <div className={`rounded-2xl p-4 mb-4 shadow-sm ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-xl font-bold">{initials || "WU"}</span>
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>{fullName}</h2>
            <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{email}</p>
            <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-400"}`}>Member since {joinDate}</p>
          </div>
        </div>

        <div className={`rounded-xl p-3 mb-4 flex items-center gap-3 ${isDark ? "bg-neutral-800" : "bg-neutral-50"}`}>
          <div className="flex-1 min-w-0">
            <p className={`text-xs mb-1 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Primary wallet</p>
            <p className={`text-sm font-mono truncate ${isDark ? "text-white" : "text-black"}`}>{primaryWallet}</p>
          </div>
          <button onClick={copyWallet} className="bg-black text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-xl p-3 ${isDark ? "bg-neutral-800" : "bg-neutral-50"}`}>
            <p className={`text-xs mb-1 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Wallet Value</p>
            <p className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</p>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? "bg-neutral-800" : "bg-neutral-50"}`}>
            <p className={`text-xs mb-1 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Transactions</p>
            <p className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>{totalTransactions}</p>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? "bg-neutral-800" : "bg-neutral-50"}`}>
            <p className={`text-xs mb-1 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Total Volume</p>
            <p className={`text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>{totalVolume.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* KYC Status - Black/Grey gradient like Settings */}
      <button 
        onClick={onKYC}
        className="w-full text-left bg-gradient-to-br from-black via-neutral-800 to-neutral-600 rounded-2xl p-4 mb-4"
        style={{
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">KYC Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded-full">
              Level {kycVerified ? 2 : kycPending ? 1 : 0}
            </span>
            <ArrowRight className="w-4 h-4 text-white/60" />
          </div>
        </div>
        
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/80">Verification Status</span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${kycVerified ? 'text-green-300' : kycPending ? 'text-cyan-200' : 'text-amber-300'}`}>
              {kycVerified ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {kycVerified ? 'Verified' : kycPending ? 'Pending review' : 'Needs review'}
            </span>
          </div>
        </div>
      </button>

      {/* Menu Items */}
      <div className={`rounded-2xl shadow-sm overflow-hidden ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 p-4 transition-colors last:border-0 ${isDark ? "hover:bg-neutral-800 border-b border-neutral-800" : "hover:bg-neutral-50 border-b border-neutral-100"}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`}>
              <item.icon className={`w-4 h-4 ${isDark ? "text-white" : "text-black"}`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{item.label}</p>
              <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{item.description}</p>
            </div>
            {item.badge && (
              <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
            <ChevronRight className={`w-4 h-4 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
          </button>
        ))}
      </div>

      {/* Referral Section */}
      <div className={`rounded-2xl p-4 mt-4 ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-neutral-50"}`}>
        <p className={`text-sm font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Referral Code</p>
        <div className="flex items-center gap-2">
          <div className={`flex-1 rounded-xl py-2 px-3 ${isDark ? "bg-neutral-800" : "bg-white"}`}>
            <p className={`text-sm font-mono ${isDark ? "text-white" : "text-black"}`}>{primaryWallet.slice(0, 12).toUpperCase()}</p>
          </div>
          <button onClick={copyWallet} className="bg-black text-white text-xs font-medium px-4 py-2 rounded-xl">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className={`text-xs mt-2 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Share your Wallex wallet address to receive transfers faster.</p>
      </div>
    </div>
  );
}
