import { useMemo, useState } from "react";
import { useLiveMarketPrices } from "../hooks/useLiveMarketPrices";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRightLeft,
  BadgeDollarSign,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Link2,
  QrCode,
  Wallet,
  X,
} from "lucide-react";
import { Wallet as WalletType } from "../types/crypto";
import { useAuth } from "../context/AuthContext";
import { KES_PER_USDT } from "../constants/money";
import { startPaystackCheckout } from "../lib/paystack";
import { verifyPaystackDeposit } from "../services/walletBackend";
import { QRScanner } from "./QRScanner";
import { buildReceiveLink, getAccountNumber, getReceiveAddress, parseScannedWalletValue } from "../utils/wallexLinks";

interface DepositModalProps {
  wallet: WalletType;
  wallets: WalletType[];
  onClose: () => void;
  onDeposit?: (amount: number, walletId: string) => void;
  onSend?: (amount: number, walletId: string, address: string, network: string) => void | Promise<void>;
  onPaystackDeposit?: (wallets: WalletType[]) => void | Promise<void>;
  kycVerified?: boolean;
  onKYC?: () => void;
  initialTab?: "deposit" | "send";
}

const networks = [
  { id: "TRC20", name: "TRC20 (Tron)", fee: "1 USDT", time: "~3 min", confirmations: "20" },
  { id: "ERC20", name: "ERC20 (Ethereum)", fee: "5 USDT", time: "~5 min", confirmations: "12" },
  { id: "BEP20", name: "BEP20 (BSC)", fee: "0.5 USDT", time: "~3 min", confirmations: "15" },
  { id: "SOL", name: "Solana", fee: "0.01 USDT", time: "~1 min", confirmations: "32" },
  { id: "MATIC", name: "Polygon", fee: "0.1 USDT", time: "~2 min", confirmations: "128" },
];

export function DepositModal({ wallet, wallets, onClose, onDeposit: _onDeposit, onSend, onPaystackDeposit, kycVerified = true, onKYC, initialTab = "deposit" }: DepositModalProps) {
  const { user } = useAuth();
  const { assets: liveAssets } = useLiveMarketPrices(60_000);
  const [copied, setCopied] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "send">(initialTab);
  const [selectedNetwork, setSelectedNetwork] = useState("TRC20");
  const [showQR, setShowQR] = useState(true);
  const [sendAmount, setSendAmount] = useState("");
  const [topUpWalletId, setTopUpWalletId] = useState(wallet.id);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpError, setTopUpError] = useState("");
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [sendAddress, setSendAddress] = useState("");
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const topUpWallet = wallets.find((w) => w.id === topUpWalletId) || wallet;
  const topUpKes = Number(topUpAmount);
  const topUpUsd = useMemo(() => (Number.isFinite(topUpKes) && topUpKes > 0 ? topUpKes / KES_PER_USDT : 0), [topUpKes]);
  const topUpTokenPrice = liveAssets.find((a) => a.symbol === topUpWallet.symbol)?.price || (topUpWallet.symbol === "USDT" ? 1 : 1);
  const topUpCryptoPreview = useMemo(() => {
    if (!Number.isFinite(topUpUsd) || topUpUsd <= 0) return 0;
    if (topUpWallet.symbol === "USDT") return topUpUsd;
    return Number((topUpUsd / topUpTokenPrice).toFixed(8));
  }, [topUpUsd, topUpTokenPrice, topUpWallet.symbol]);

  const selectedNetworkData = networks.find((network) => network.id === selectedNetwork) || networks[0];
  const accountNumber = getAccountNumber(wallet);
  const walletAddress = getReceiveAddress(wallet, selectedNetwork);
  const receiveLink = buildReceiveLink(wallet, selectedNetwork);

  const recentAddresses = [
    { address: receiveLink, label: "Wallex Pay Link", time: "Ready" },
    { address: walletAddress, label: `${wallet.symbol} Address`, time: selectedNetwork },
    { address: accountNumber, label: "Account Number", time: "Wallex" },
  ];

  const copyToClipboard = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSend = () => {
    if (!kycVerified) {
      onKYC?.();
      return;
    }
    const parsedAmount = Number(sendAmount);
    if (Number.isFinite(parsedAmount) && parsedAmount > 0 && sendAddress && onSend) {
      onSend(parsedAmount, wallet.id, sendAddress, selectedNetwork);
    }
  };

  const handleTopUp = async () => {
    const amount = Number(topUpAmount);
    if (!user?.email || !Number.isFinite(amount) || amount <= 0) {
      setTopUpError("Enter a valid top-up amount first.");
      return;
    }
    setTopUpError("");
    setIsTopUpLoading(true);
    const reference = `WLX-PS-${Date.now()}`;
    try {
      await startPaystackCheckout({
        amount, currency: "KES", email: user.email,
        name: user.user_metadata?.full_name || user.email, reference,
        onSuccess: async (confirmedReference) => {
          try {
            const { wallets: nextWallets } = await verifyPaystackDeposit(confirmedReference, topUpWallet.id, amount);
            await onPaystackDeposit?.(nextWallets);
            setTopUpAmount("");
            onClose();
          } catch (error) {
            setTopUpError(error instanceof Error ? error.message : "Top-up could not be verified.");
            setIsTopUpLoading(false);
          }
        },
        onCancel: () => setIsTopUpLoading(false),
        onError: (msg) => { setTopUpError(msg); setIsTopUpLoading(false); },
      });
    } catch (error) {
      setTopUpError(error instanceof Error ? error.message : "Checkout could not start.");
      setIsTopUpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end" style={{ backdropFilter: "blur(8px)" }}>
      <div className="w-full bg-neutral-900 rounded-t-3xl max-h-[92%] overflow-hidden flex flex-col shadow-[0_-10px_50px_rgba(0,0,0,0.6)] border-t border-neutral-700">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 px-4 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center ring-1 ring-neutral-600">
              <span className="text-white text-sm font-bold">{wallet.symbol.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{activeTab === "deposit" ? "Receive" : "Send"} {wallet.symbol}</h2>
              <p className="text-xs text-neutral-400">Account: {accountNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full active:scale-90 transition-all">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-700 bg-neutral-800">
          <button onClick={() => setActiveTab("deposit")} className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === "deposit" ? "text-white bg-neutral-900 border-b-2 border-white" : "text-neutral-400 hover:text-neutral-200"}`}>
            <ArrowDownToLine className="w-4 h-4" /> Receive
          </button>
          <button onClick={() => setActiveTab("send")} className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === "send" ? "text-white bg-neutral-900 border-b-2 border-white" : "text-neutral-400 hover:text-neutral-200"}`}>
            <ArrowRightLeft className="w-4 h-4" /> Send
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "deposit" ? (
            <div className="p-4 space-y-4">
              {/* Network selector */}
              <div className="bg-neutral-800 rounded-2xl border border-neutral-700 p-4">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3 block flex items-center gap-2">
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Select Network
                </label>
                <div className="relative">
                  <button onClick={() => setShowNetworkDropdown(!showNetworkDropdown)} className="w-full bg-neutral-900 rounded-xl p-3.5 flex items-center justify-between border border-neutral-700 hover:border-neutral-500 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-700 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{selectedNetworkData.id.charAt(0)}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{selectedNetworkData.name}</p>
                        <p className="text-xs text-neutral-400">Fee: {selectedNetworkData.fee} · {selectedNetworkData.time}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${showNetworkDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showNetworkDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg overflow-hidden z-10">
                      {networks.map((network) => (
                        <button key={network.id} onClick={() => { setSelectedNetwork(network.id); setShowNetworkDropdown(false); }}
                          className={`w-full p-3.5 flex items-center justify-between hover:bg-neutral-700 border-b border-neutral-700 last:border-0 transition-colors ${selectedNetwork === network.id ? "bg-neutral-700" : ""}`}>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">{network.name}</p>
                            <p className="text-xs text-neutral-400">Fee: {network.fee} · {network.time}</p>
                          </div>
                          {selectedNetwork === network.id && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-neutral-800 rounded-2xl border border-neutral-700 p-4">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3 block flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5" /> {wallet.symbol} Receive QR
                </label>
                {showQR ? (
                  <div className="flex flex-col items-center">
                    <div className="w-56 h-56 bg-white rounded-2xl flex items-center justify-center mb-3 p-4">
                      <QRCodeSVG value={receiveLink} size={190} level="H" includeMargin />
                    </div>
                    <p className="text-xs text-neutral-400 text-center break-all px-2 font-mono bg-neutral-900 rounded-lg p-2 w-full">{receiveLink}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => copyToClipboard(receiveLink, "qrlink")} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors">
                        {copied === "qrlink" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied === "qrlink" ? "Copied" : "Copy Link"}
                      </button>
                      <button onClick={() => setShowQR(false)} className="text-xs text-neutral-400 px-3 py-2 rounded-lg border border-neutral-600 hover:bg-neutral-700 transition-colors">Hide QR</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowQR(true)} className="w-full flex items-center justify-center gap-2 py-6 text-sm text-neutral-400 border-2 border-dashed border-neutral-700 rounded-xl hover:bg-neutral-700 transition-colors">
                    <QrCode className="w-5 h-5" /> Show QR Code
                  </button>
                )}
              </div>

              {/* Addresses */}
              <div className="space-y-3">
                {[
                  { label: "Wallex account number", value: accountNumber, key: "account", icon: Wallet },
                  { label: "Wallet address", value: walletAddress, key: "address", icon: Link2 },
                  { label: "Payment link", value: receiveLink, key: "link", icon: BadgeDollarSign },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="bg-neutral-800 rounded-2xl border border-neutral-700 p-4">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Icon className="w-3 h-3" /> {item.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-xs text-neutral-300 font-mono break-all leading-relaxed bg-neutral-900 rounded-lg p-2.5 border border-neutral-700">{item.value}</p>
                        <button onClick={() => copyToClipboard(item.value, item.key)} className={`p-3 rounded-xl transition-all flex-shrink-0 ${copied === item.key ? "bg-emerald-600 text-white" : "bg-white text-black hover:bg-neutral-200"}`}>
                          {copied === item.key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top-up */}
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-neutral-700 flex items-center justify-center">
                    <BadgeDollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Top up with card or bank</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Pay in KES — credited immediately.</p>
                    <p className="text-xs font-semibold text-emerald-400 mt-1">No KYC required to deposit or receive.</p>
                  </div>
                </div>
                <select value={topUpWalletId} onChange={(e) => setTopUpWalletId(e.target.value)}
                  className="w-full mb-3 bg-neutral-900 rounded-xl border border-neutral-700 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white">
                  {wallets.map((w) => (<option key={w.id} value={w.id}>{w.name} ({w.symbol})</option>))}
                </select>
                <div className="flex gap-2">
                  <input type="number" min="1" step="0.01" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} placeholder="Amount in KES" className="flex-1 bg-neutral-900 rounded-xl border border-neutral-700 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white placeholder-neutral-500" />
                  <button onClick={handleTopUp} disabled={isTopUpLoading} className="bg-white text-black rounded-xl px-5 py-3 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-60 transition-all">
                    {isTopUpLoading ? "Opening..." : "Top up"}
                  </button>
                </div>
                {Number.isFinite(topUpKes) && topUpKes > 0 ? (
                  <p className="text-xs text-neutral-400 mt-3 bg-neutral-900 rounded-lg p-3 border border-neutral-700">
                    Pay <span className="font-semibold text-white">KES {topUpKes.toLocaleString("en-KE")}</span> · ≈ <span className="font-semibold text-white">${topUpUsd.toFixed(2)} USD</span> · receive ≈ <span className="font-semibold text-white">{topUpCryptoPreview.toLocaleString()}</span> {topUpWallet.symbol}
                  </p>
                ) : null}
                {topUpError ? <p className="text-xs text-red-400 mt-3 bg-red-900/30 rounded-lg p-2.5">{topUpError}</p> : null}
              </div>

              {/* Warning */}
              <div className="bg-neutral-800 border border-amber-800/50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-300">Network warning</p>
                    <p className="text-xs text-amber-400/70 mt-1 leading-relaxed">Only send {wallet.symbol} through {selectedNetworkData.name}.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {!kycVerified ? (
                <div className="rounded-2xl border border-amber-800/50 bg-amber-900/20 p-4">
                  <p className="text-sm font-semibold text-amber-300">KYC required</p>
                  <p className="text-xs text-amber-400/70 mt-1">Complete verification to send or sell.</p>
                  <button type="button" onClick={onKYC} className="mt-3 w-full rounded-xl bg-white text-black py-3 text-sm font-semibold">Verify KYC</button>
                </div>
              ) : null}

              {/* Recipient input with scan button on right */}
              <div className="bg-neutral-800 rounded-2xl border border-neutral-700 p-4">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2 block flex items-center gap-1.5">
                  <Link2 className="w-3 h-3" /> Recipient
                </label>
                <div className="flex gap-2">
                  <input type="text" value={sendAddress} onChange={(e) => setSendAddress(e.target.value)} placeholder="Wallet address or Wallex link"
                    className="flex-1 bg-neutral-900 rounded-xl py-3 px-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white border border-neutral-700" />
                  <button onClick={() => setScannerOpen(true)} className="px-3 py-3 bg-neutral-700 rounded-xl hover:bg-neutral-600 transition-colors" aria-label="Scan QR">
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Recent targets */}
              <div className="bg-neutral-800 rounded-2xl border border-neutral-700 p-4">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2 block">Recent Targets</label>
                <div className="space-y-2">
                  {recentAddresses.map((item, index) => (
                    <button key={index} onClick={() => setSendAddress(item.address)} className="w-full bg-neutral-900 rounded-xl p-3 flex items-center justify-between hover:bg-neutral-700 border border-neutral-700 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-neutral-300" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-neutral-400 font-mono truncate">{item.address}</p>
                        </div>
                      </div>
                      <Clock className="w-4 h-4 text-neutral-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="bg-neutral-800 rounded-2xl border border-neutral-700 p-4">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2 block">Amount</label>
                <div className="flex items-center gap-3 mb-3">
                  <input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="0.00" className="flex-1 text-3xl font-bold text-white bg-transparent focus:outline-none placeholder-neutral-600" />
                  <div className="px-3 py-1.5 rounded-full bg-neutral-700">
                    <span className="text-xs font-medium text-white">{wallet.symbol}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Available: ${wallet.balance.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setSendAmount((wallet.balance * 0.25).toFixed(2))} className="text-xs text-white font-medium px-2.5 py-1 bg-neutral-700 rounded-md hover:bg-neutral-600">25%</button>
                    <button onClick={() => setSendAmount((wallet.balance * 0.5).toFixed(2))} className="text-xs text-white font-medium px-2.5 py-1 bg-neutral-700 rounded-md hover:bg-neutral-600">50%</button>
                    <button onClick={() => setSendAmount(wallet.balance.toString())} className="text-xs text-white font-medium px-2.5 py-1 bg-neutral-700 rounded-md hover:bg-neutral-600">Max</button>
                  </div>
                </div>
              </div>

              {/* Fee */}
              <div className="bg-neutral-800 rounded-2xl border border-neutral-700 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-neutral-400">Estimated Fee</span>
                  <span className="text-sm font-medium text-white">~1.5 {wallet.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400">Processing</span>
                  <span className="text-sm font-medium text-white">Saved to your wallet</span>
                </div>
              </div>

              <button onClick={handleSend} className="w-full bg-white text-black rounded-xl py-4 font-medium text-sm hover:bg-neutral-200 active:bg-neutral-300 transition-colors">
                Send {wallet.symbol}
              </button>
            </div>
          )}
        </div>
      </div>

      {scannerOpen && (
        <QRScanner
          onClose={() => setScannerOpen(false)}
          onResult={(value) => {
            const raw = value.trim();
            if (raw.includes("/pay?") || raw.includes("account=")) {
              try {
                const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
                window.location.href = `${url.pathname}${url.search}`;
              } catch { window.location.href = `/pay?${raw.split("?")[1] || ""}`; }
              return;
            }
            setSendAddress(parseScannedWalletValue(value).address);
            setScannerOpen(false);
          }}
        />
      )}
    </div>
  );
}