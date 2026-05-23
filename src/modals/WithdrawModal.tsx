import { X, ArrowUpRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface WithdrawModalProps {
  onClose: () => void;
}

export function WithdrawModal({ onClose }: WithdrawModalProps) {
  const { isDark } = useTheme();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = () => {
    // Handle send logic
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-[340px] rounded-2xl p-5 ${
        isDark ? 'bg-neutral-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Send
          </h2>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-full ${
              isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
          </button>
        </div>

        {/* Asset */}
        <div className="mb-4">
          <p className={`text-[10px] mb-1.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Asset
          </p>
          <div className={`flex items-center gap-2 p-3 rounded-xl ${
            isDark ? 'bg-neutral-800' : 'bg-neutral-50'
          }`}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">T</span>
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              USDT
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="mb-4">
          <p className={`text-[10px] mb-1.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Recipient Address
          </p>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
            className={`w-full p-3 rounded-xl text-xs outline-none border-2 transition-colors ${
              isDark 
                ? 'bg-neutral-800 text-white border-neutral-700 focus:border-neutral-500 placeholder:text-neutral-500' 
                : 'bg-neutral-50 text-black border-neutral-200 focus:border-neutral-400 placeholder:text-gray-400'
            }`}
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Amount
            </p>
            <p className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Available: 12,573.00 USDT
            </p>
          </div>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`w-full p-3 rounded-xl text-sm outline-none border-2 transition-colors ${
              isDark 
                ? 'bg-neutral-800 text-white border-neutral-700 focus:border-neutral-500 placeholder:text-neutral-500' 
                : 'bg-neutral-50 text-black border-neutral-200 focus:border-neutral-400 placeholder:text-gray-400'
            }`}
          />
        </div>

        {/* Network Fee */}
        <div className={`flex items-center justify-between p-3 rounded-xl mb-4 ${
          isDark ? 'bg-neutral-800' : 'bg-neutral-50'
        }`}>
          <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Network Fee
          </span>
          <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            ~$2.50
          </span>
        </div>

        {/* Warning */}
        <div className={`p-3 rounded-xl border mb-4 ${
          isDark 
            ? 'bg-red-900/20 border-red-700' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-4 h-4 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <p className={`text-[10px] ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Double-check the address. Transactions cannot be reversed once confirmed.
            </p>
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!address || !amount}
          className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            address && amount
              ? 'bg-black text-white hover:bg-neutral-800'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
}