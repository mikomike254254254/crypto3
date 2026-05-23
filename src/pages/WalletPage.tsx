import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Clock, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Wallet, Transaction } from "../types/crypto";
import { useTheme } from "../context/ThemeContext";
import { CryptoLogo } from "../components/CryptoLogo";

interface WalletPageProps {
  wallets: Wallet[];
  totalValue?: number;
  transactions?: Transaction[];
  onDeposit: () => void;
  onWithdraw: () => void;
  kycVerified?: boolean;
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'receive', amount: 250.00, currency: 'USDT', date: '2024-01-15', status: 'completed', address: '0x7a9...f3d' },
  { id: '2', type: 'send', amount: 100.00, currency: 'USDT', date: '2024-01-14', status: 'completed', address: '0x3b2...a1c' },
  { id: '3', type: 'swap', amount: 0.05, currency: 'BTC', date: '2024-01-14', status: 'completed' },
  { id: '4', type: 'buy', amount: 500.00, currency: 'USDT', date: '2024-01-13', status: 'completed' },
  { id: '5', type: 'sell', amount: 0.5, currency: 'ETH', date: '2024-01-12', status: 'pending' },
  { id: '6', type: 'send', amount: 75.00, currency: 'USDT', date: '2024-01-11', status: 'failed', address: '0x9c8...b2e' },
];

export function WalletPage({ wallets, totalValue, transactions = mockTransactions, onDeposit, onWithdraw }: WalletPageProps) {
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const { isDark } = useTheme();

  const currentWallet = wallets[selectedWallet];
  const totalBalance = totalValue ?? wallets.reduce((sum, w) => sum + w.balance, 0);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'send', label: 'Sent' },
    { id: 'receive', label: 'Received' },
    { id: 'pending', label: 'Pending' },
  ];

  const filteredTransactions = activeFilter === 'all'
    ? transactions
    : activeFilter === 'pending'
    ? transactions.filter(t => t.status === 'pending')
    : transactions.filter(t => t.type === activeFilter);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return <ArrowUpFromLine className="w-4 h-4" />;
      case 'withdraw': return <ArrowUpFromLine className="w-4 h-4" />;
      case 'receive': return <ArrowDownToLine className="w-4 h-4" />;
      case 'deposit': return <ArrowDownToLine className="w-4 h-4" />;
      case 'swap': return <ArrowRightLeft className="w-4 h-4" />;
      case 'buy': return <ArrowDownToLine className="w-4 h-4" />;
      case 'sell': return <ArrowUpFromLine className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send': return 'bg-red-100 text-red-600';
      case 'withdraw': return 'bg-red-100 text-red-600';
      case 'receive': return 'bg-green-100 text-green-600';
      case 'deposit': return 'bg-green-100 text-green-600';
      case 'swap': return 'bg-blue-100 text-blue-600';
      case 'buy': return 'bg-green-100 text-green-600';
      case 'sell': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const transactionLabel = (tx: Transaction) => {
    if (tx.label?.includes("Gas fee")) return "Gas fee";
    if (tx.label?.includes("KYC verification bonus")) return tx.status === "pending" ? "KYC bonus (pending)" : "KYC bonus";
    if (tx.type === "withdraw") return "Withdrawal";
    if (tx.type === "gas_fee") return "Gas fee";
    if (tx.type === "kyc_bonus") return tx.status === "pending" ? "KYC bonus (pending)" : "KYC bonus";
    return tx.type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="px-4 pt-2 pb-6">
      {/* Header */}
      <h1 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Wallet</h1>

      {/* Total Balance Card */}
      <div className="bg-black rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400 font-medium">Total Balance</p>
          <button onClick={() => setIsHidden(!isHidden)} className="p-1">
            {isHidden ? (
              <EyeOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          {isHidden ? '******' : `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        </h2>
        
        {/* Quick Actions - Fixed buttons */}
        <div className="flex gap-2">
          <button 
            onClick={onDeposit}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black rounded-full py-2.5 font-medium text-sm hover:bg-neutral-200 transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </button>
          <button 
            onClick={onWithdraw}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white rounded-full py-2.5 font-medium text-sm border border-white/20 hover:bg-white/20 transition-colors"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      {/* Wallet Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {wallets.map((wallet, index) => (
          <button
            key={wallet.id}
            onClick={() => setSelectedWallet(index)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              selectedWallet === index
                ? 'bg-black text-white'
                : isDark ? 'bg-neutral-900 text-neutral-300 border border-neutral-800' : 'bg-white text-gray-600'
            }`}
          >
            <CryptoLogo symbol={wallet.symbol} size={22} className="!border-0" />
            {wallet.symbol}
          </button>
        ))}
      </div>

      {/* Transaction Filters */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>Transactions</h3>
        <button className={`flex items-center gap-1 text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
          <Clock className="w-3.5 h-3.5" />
          History
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.id
                ? 'bg-black text-white'
                : isDark ? 'bg-neutral-900 text-neutral-400 border border-neutral-800' : 'bg-white text-gray-500'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className={`rounded-2xl shadow-sm overflow-hidden ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
        {filteredTransactions.map((tx, index) => (
          <div 
            key={tx.id}
            className={`flex items-center gap-3 p-4 ${
              index !== filteredTransactions.length - 1 ? (isDark ? 'border-b border-neutral-800' : 'border-b border-neutral-100') : ''
            }`}
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(tx.type)}`}>
              {getTransactionIcon(tx.type)}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-medium text-sm capitalize ${isDark ? "text-white" : "text-black"}`}>{transactionLabel(tx)}</span>
                <span className={`font-semibold text-sm ${
                  tx.type === 'send' || tx.type === 'sell' || tx.type === 'withdraw' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {tx.type === 'send' || tx.type === 'sell' || tx.type === 'withdraw' ? '-' : '+'}
                  {tx.amount.toLocaleString()} {tx.currency}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-500"}`}>{formatDate(tx.date ?? new Date().toISOString())}</span>
                <span className={`text-xs font-medium capitalize ${getStatusColor(tx.status)}`}>
                  {tx.status}
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center">
            <p className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
