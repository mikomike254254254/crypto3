import { X, Copy, QrCode, Check } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface DepositModalProps {
  onClose: () => void;
}

export function DepositModal({ onClose }: DepositModalProps) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const walletAddress = "0x7a9f...3d4e";

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-[340px] rounded-2xl p-5 ${
        isDark ? 'bg-neutral-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Receive
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

        {/* QR Code */}
        <div className={`flex justify-center mb-4 p-4 rounded-xl ${
          isDark ? 'bg-neutral-800' : 'bg-neutral-50'
        }`}>
          <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center">
            <QrCode className="w-32 h-32 text-black" />
          </div>
        </div>

        {/* Wallet Address */}
        <div className="mb-4">
          <p className={`text-[10px] mb-1.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Wallet Address
          </p>
          <div className={`flex items-center justify-between p-3 rounded-xl ${
            isDark ? 'bg-neutral-800' : 'bg-neutral-50'
          }`}>
            <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {walletAddress}
            </span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black text-white text-[10px] font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Network */}
        <div className="mb-4">
          <p className={`text-[10px] mb-1.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Network
          </p>
          <div className={`p-3 rounded-xl ${
            isDark ? 'bg-neutral-800' : 'bg-neutral-50'
          }`}>
            <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              Ethereum (ERC-20)
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className={`p-3 rounded-xl border ${
          isDark 
            ? 'bg-yellow-900/20 border-yellow-700' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <p className={`text-[10px] ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            Only send USDT to this address. Sending other tokens may result in permanent loss.
          </p>
        </div>
      </div>
    </div>
  );
}