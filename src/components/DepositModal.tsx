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
  const topUpUsd = Number(topUpAmount);
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
        amount,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        reference,
        onSuccess: async (confirmedReference) => {
          try {
            const { wallets: nextWallets } = await verifyPaystackDeposit(confirmedReference, topUpWallet.id, amount);
            await onPaystackDeposit?.(nextWallets);
            setTopUpAmount("");
            onClose();
          } catch (error) {
            setTopUpError(error instanceof Error ? error.message : "Top-up could not be verified. Try again.");
            setIsTopUpLoading(false);
          }
        },
        onCancel: () => {
          setIsTopUpLoading(false);
        },
        onError: (message) => {
          setTopUpError(message);
          setIsTopUpLoading(false);
        },
      });
    } catch (error) {
      setTopUpError(error instanceof Error ? error.message : "Top-up checkout could not start.");
      setIsTopUpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl max-h-[92%] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-4 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${wallet.color === "green" ? "bg-green-500" : wallet.color === "orange" ? "bg-orange-500" : "bg-blue-500"}`}>
              <span className="text-white text-sm font-bold">{wallet.symbol.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{activeTab === "deposit" ? "Receive" : "Send"} {wallet.symbol}</h2>
              <p className="text-xs text-gray-500">Account: {accountNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full active:bg-neutral-200">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex border-b border-neutral-100 bg-neutral-50">
          <button
            onClick={() => setActiveTab("deposit")}
            className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "deposit" ? "text-black bg-white border-b-2 border-black" : "text-gray-500"}`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Receive
          </button>
          <button
            onClick={() => setActiveTab("send")}
            className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "send" ? "text-black bg-white border-b-2 border-black" : "text-gray-500"}`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Send
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "deposit" ? (
            <div className="p-4">
              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Select Network</label>
                <div className="relative">
                  <button onClick={() => setShowNetworkDropdown(!showNetworkDropdown)} className="w-full bg-neutral-50 rounded-xl p-3.5 flex items-center justify-between border border-neutral-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{selectedNetworkData.id.charAt(0)}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-black">{selectedNetworkData.name}</p>
                        <p className="text-xs text-gray-500">Fee: {selectedNetworkData.fee}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showNetworkDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showNetworkDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-10">
                      {networks.map((network) => (
                        <button
                          key={network.id}
                          onClick={() => {
                            setSelectedNetwork(network.id);
                            setShowNetworkDropdown(false);
                          }}
                          className={`w-full p-3 flex items-center justify-between hover:bg-neutral-50 border-b border-neutral-100 last:border-0 ${selectedNetwork === network.id ? "bg-neutral-50" : ""}`}
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-black">{network.name}</p>
                            <p className="text-xs text-gray-500">Fee: {network.fee} | {network.time}</p>
                          </div>
                          {selectedNetwork === network.id && <Check className="w-5 h-5 text-green-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{wallet.symbol} Receive QR</label>
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
                  {showQR ? (
                    <div className="flex flex-col items-center">
                      <div className="w-56 h-56 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center mb-3 p-4">
                        <QRCodeSVG value={receiveLink} size={188} level="H" includeMargin />
                      </div>
                      <p className="text-xs text-gray-500 text-center break-all px-2">{receiveLink}</p>
                      <button onClick={() => setShowQR(false)} className="text-xs text-gray-500 underline mt-3">Hide QR Code</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowQR(true)} className="w-full flex items-center justify-center gap-2 py-4 text-sm text-gray-600">
                      <QrCode className="w-5 h-5" />
                      Show QR Code
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-5">
                {[
                  { label: "Wallex account number", value: accountNumber, key: "account" },
                  { label: "Wallet address", value: walletAddress, key: "address" },
                  { label: "Payment link", value: receiveLink, key: "link" },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{item.label}</label>
                    <div className="bg-neutral-50 rounded-xl p-3 flex items-center gap-2 border border-neutral-200">
                      <p className="flex-1 text-xs text-black font-mono break-all leading-relaxed">{item.value}</p>
                      <button onClick={() => copyToClipboard(item.value, item.key)} className="p-2.5 bg-black rounded-lg hover:bg-neutral-800 transition-colors flex-shrink-0">
                        {copied === item.key ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 mb-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <BadgeDollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">Top up with card or bank</p>
                    <p className="text-xs text-gray-600">Pay in USD — credited to your selected wallet in real time.</p>
                    <p className="text-xs font-semibold text-emerald-700 mt-1">No KYC required to deposit or receive.</p>
                  </div>
                </div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Wallet to credit</label>
                <select
                  value={topUpWalletId}
                  onChange={(e) => setTopUpWalletId(e.target.value)}
                  className="w-full mb-3 bg-white rounded-xl border border-neutral-200 px-4 py-3 text-sm text-black"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.symbol})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={topUpAmount}
                    onChange={(event) => setTopUpAmount(event.target.value)}
                    placeholder="USD amount"
                    className="flex-1 bg-white rounded-xl border border-neutral-200 px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={handleTopUp}
                    disabled={isTopUpLoading}
                    className="bg-black text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {isTopUpLoading ? "Opening..." : "Top up"}
                  </button>
                </div>
                {Number.isFinite(topUpUsd) && topUpUsd > 0 ? (
                  <p className="text-xs text-slate-600 mt-2">
                    ≈ <span className="font-semibold text-black">{topUpCryptoPreview.toLocaleString()}</span> {topUpWallet.symbol}
                    <span className="text-gray-400"> @ ${topUpTokenPrice.toLocaleString()}/{topUpWallet.symbol}</span>
                  </p>
                ) : null}
                {topUpError ? <p className="text-xs text-rose-600 mt-2">{topUpError}</p> : null}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">Only send {wallet.symbol} through {selectedNetworkData.name}. The QR includes wallex.online, account number, wallet, network, and receive address.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {!kycVerified ? (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">KYC required to send crypto</p>
                  <p className="text-xs text-amber-700 mt-1">Receiving and buying do not require KYC. Complete verification to send or sell.</p>
                  <button type="button" onClick={onKYC} className="mt-3 w-full rounded-xl bg-black text-white py-3 text-sm font-semibold">
                    Verify KYC
                  </button>
                </div>
              ) : null}

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Recipient Wallex link or wallet ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={sendAddress}
                    onChange={(event) => setSendAddress(event.target.value)}
                    placeholder="Enter wallet address or scan QR"
                    className="w-full bg-neutral-50 rounded-xl py-3.5 px-4 pr-24 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black border border-neutral-200"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button onClick={() => setScannerOpen(true)} className="p-2 bg-neutral-100 rounded-lg hover:bg-neutral-200" aria-label="Scan QR code">
                      <Camera className="w-4 h-4 text-gray-600" />
                    </button>
                    <button onClick={() => copyToClipboard(sendAddress, "send")} className="p-2 bg-neutral-100 rounded-lg hover:bg-neutral-200" aria-label="Copy recipient">
                      <Link2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Recent Wallex Targets</label>
                <div className="space-y-2">
                  {recentAddresses.map((item, index) => (
                    <button key={index} onClick={() => setSendAddress(item.address)} className="w-full bg-neutral-50 rounded-xl p-3 flex items-center justify-between hover:bg-neutral-100 border border-neutral-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium text-black">{item.label}</p>
                          <p className="text-xs text-gray-500 font-mono truncate">{item.address}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Clock className="w-4 h-4 text-gray-400 ml-auto" />
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Amount to Send</label>
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                  <div className="flex items-center gap-3 mb-3">
                    <input type="number" value={sendAmount} onChange={(event) => setSendAmount(event.target.value)} placeholder="0.00" className="flex-1 text-3xl font-bold text-black bg-transparent focus:outline-none" />
                    <div className={`px-3 py-1.5 rounded-full ${wallet.color === "green" ? "bg-green-500" : wallet.color === "orange" ? "bg-orange-500" : "bg-blue-500"}`}>
                      <span className="text-xs font-medium text-white">{wallet.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Available: ${wallet.balance.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setSendAmount((wallet.balance * 0.25).toFixed(2))} className="text-xs text-black font-medium px-2.5 py-1 bg-neutral-200 rounded-md hover:bg-neutral-300">25%</button>
                      <button onClick={() => setSendAmount((wallet.balance * 0.5).toFixed(2))} className="text-xs text-black font-medium px-2.5 py-1 bg-neutral-200 rounded-md hover:bg-neutral-300">50%</button>
                      <button onClick={() => setSendAmount(wallet.balance.toString())} className="text-xs text-black font-medium px-2.5 py-1 bg-neutral-200 rounded-md hover:bg-neutral-300">Max</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Estimated Fee</span>
                  <span className="text-sm font-medium text-black">~1.5 {wallet.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Processing</span>
                  <span className="text-sm font-medium text-black">Saved to your wallet</span>
                </div>
              </div>

              <button onClick={handleSend} className="w-full bg-black text-white rounded-xl py-4 font-medium text-sm hover:bg-neutral-800 active:bg-neutral-900 transition-colors">
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
              } catch {
                window.location.href = `/pay?${raw.split("?")[1] || ""}`;
              }
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
