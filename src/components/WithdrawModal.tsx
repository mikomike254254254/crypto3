import { useState } from "react";
import { X, ArrowUpFromLine, AlertCircle, Camera, ChevronDown, Clock, Check } from "lucide-react";
import { Wallet as WalletType } from "../types/crypto";
import { QRScanner } from "./QRScanner";
import { parseScannedWalletValue } from "../utils/wallexLinks";

interface WithdrawModalProps {
  wallet: WalletType;
  wallets: WalletType[];
  onClose: () => void;
  onWithdraw?: (amount: number, walletId: string, address: string, network: string) => void | Promise<void>;
  kycVerified?: boolean;
  onKYC?: () => void;
}

export function WithdrawModal({ wallet, wallets, onClose, onWithdraw, kycVerified = true, onKYC }: WithdrawModalProps) {
  const [step, setStep] = useState<'amount' | 'address' | 'confirm' | 'success'>('amount');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(wallet);
  const [scannerOpen, setScannerOpen] = useState(false);

  const networks = [
    { id: 'TRC20', name: 'TRC20', fee: '1 USDT', time: '~3 min' },
    { id: 'ERC20', name: 'ERC20', fee: '5 USDT', time: '~5 min' },
    { id: 'BEP20', name: 'BEP20 (BSC)', fee: '0.5 USDT', time: '~3 min' },
  ];

  const recentAddresses = [
    { address: '0x7a9...f3d', label: 'My Wallet 1' },
    { address: '0x3b2...a1c', label: 'My Wallet 2' },
    { address: '0x9c8...b2e', label: 'Exchange' },
  ];

  const handleContinue = () => {
    if (step === 'amount') setStep('address');
    else if (step === 'address') setStep('confirm');
    else if (step === 'confirm') {
      if (!kycVerified) {
        onKYC?.();
        return;
      }
      onWithdraw?.(Number(amount), selectedWallet.id, address, selectedNetwork);
      setStep('success');
    }
  };

  const handleBack = () => {
    if (step === 'address') setStep('amount');
    else if (step === 'confirm') setStep('address');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl max-h-[90%] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              selectedWallet.color === 'green' ? 'bg-green-500' : 
              selectedWallet.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
            }`}>
              <span className="text-white text-sm font-bold">{selectedWallet.symbol.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-black">Withdraw {selectedWallet.symbol}</h2>
              <p className="text-xs text-gray-500">Available: ${selectedWallet.balance.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            {['Amount', 'Address', 'Confirm'].map((s, i) => {
              const currentIndex = ['amount', 'address', 'confirm', 'success'].indexOf(step);
              const isActive = i <= currentIndex;
              const isPast = i < currentIndex;
              
              return (
                <div key={s} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isPast ? 'bg-green-500 text-white' :
                    isActive ? 'bg-black text-white' : 'bg-neutral-200 text-gray-500'
                  }`}>
                    {isPast ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`ml-2 text-xs font-medium ${
                    isActive ? 'text-black' : 'text-gray-400'
                  }`}>
                    {s}
                  </span>
                  {i < 2 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      isPast ? 'bg-green-500' : 'bg-neutral-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {step === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Withdrawal Submitted</h3>
              <p className="text-sm text-gray-500 mb-6">
                Your withdrawal of {amount} {selectedWallet.symbol} has been submitted and is being processed.
              </p>
              <div className="bg-neutral-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Amount</span>
                  <span className="text-sm font-medium text-black">{amount} {selectedWallet.symbol}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Network Fee</span>
                  <span className="text-sm font-medium text-black">1 {selectedWallet.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Estimated Time</span>
                  <span className="text-sm font-medium text-black">~3-5 minutes</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-full bg-black text-white rounded-xl py-4 font-medium text-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {step === 'amount' && (
                <>
                  {/* Wallet Selection */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                      From Wallet
                    </label>
                    <button 
                      onClick={() => setShowWalletSelect(!showWalletSelect)}
                      className="w-full bg-neutral-50 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedWallet.color === 'green' ? 'bg-green-500' : 
                          selectedWallet.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          <span className="text-white text-xs font-bold">{selectedWallet.symbol.charAt(0)}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-black">{selectedWallet.name}</p>
                          <p className="text-xs text-gray-500">${selectedWallet.balance.toLocaleString()}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showWalletSelect ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showWalletSelect && (
                      <div className="mt-2 bg-white border border-neutral-200 rounded-xl overflow-hidden">
                        {wallets.map((w) => (
                          <button
                            key={w.id}
                            onClick={() => {
                              setSelectedWallet(w);
                              setShowWalletSelect(false);
                            }}
                            className="w-full p-3 flex items-center gap-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              w.color === 'green' ? 'bg-green-500' : 
                              w.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              <span className="text-white text-xs font-bold">{w.symbol.charAt(0)}</span>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-black">{w.name}</p>
                              <p className="text-xs text-gray-500">${w.balance.toLocaleString()}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                      Amount to Withdraw
                    </label>
                    <div className="bg-neutral-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 text-3xl font-bold text-black bg-transparent focus:outline-none"
                        />
                        <div className={`px-3 py-1.5 rounded-full ${
                          selectedWallet.color === 'green' ? 'bg-green-500' : 
                          selectedWallet.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          <span className="text-xs font-medium text-white">{selectedWallet.symbol}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          ~ ${(parseFloat(amount) || 0).toLocaleString()} USD
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setAmount((selectedWallet.balance * 0.25).toFixed(2))}
                            className="text-xs text-black font-medium px-2 py-1 bg-neutral-200 rounded"
                          >
                            25%
                          </button>
                          <button 
                            onClick={() => setAmount((selectedWallet.balance * 0.5).toFixed(2))}
                            className="text-xs text-black font-medium px-2 py-1 bg-neutral-200 rounded"
                          >
                            50%
                          </button>
                          <button 
                            onClick={() => setAmount(selectedWallet.balance.toString())}
                            className="text-xs text-black font-medium px-2 py-1 bg-neutral-200 rounded"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Network Selection */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                      Network
                    </label>
                    <div className="space-y-2">
                      {networks.map((network) => (
                        <button
                          key={network.id}
                          onClick={() => setSelectedNetwork(network.id)}
                          className={`w-full p-3 rounded-xl border-2 flex items-center justify-between ${
                            selectedNetwork === network.id
                              ? 'border-black bg-neutral-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full border-2 ${
                              selectedNetwork === network.id
                                ? 'border-black bg-black'
                                : 'border-gray-300'
                            }`} />
                            <span className="text-sm font-medium text-black">{network.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Fee: {network.fee}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 'address' && (
                <>
                  {/* Address Input */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                      Recipient Address
                    </label>
                    <div className="relative">
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter the wallet address"
                        rows={3}
                        className="w-full bg-neutral-50 rounded-xl py-3 px-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black font-mono resize-none"
                      />
                      <button onClick={() => setScannerOpen(true)} className="absolute right-3 bottom-3 p-2 bg-neutral-100 rounded-lg" aria-label="Scan QR code">
                        <Camera className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Addresses */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                      Recent Addresses
                    </label>
                    <div className="space-y-2">
                      {recentAddresses.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => setAddress(item.address)}
                          className="w-full bg-neutral-50 rounded-xl p-3 flex items-center justify-between hover:bg-neutral-100 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-black">{item.label}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.address}</p>
                          </div>
                          <Clock className="w-4 h-4 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-red-800">Double-check the address</p>
                        <p className="text-xs text-red-700 mt-1">
                          Transactions cannot be reversed once confirmed. Make sure the address is correct.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 'confirm' && (
                <>
                  {/* Confirmation Details */}
                  <div className="bg-neutral-50 rounded-2xl p-4 mb-4">
                    <h3 className="text-sm font-semibold text-black mb-3">Transaction Details</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Amount</span>
                        <span className="text-sm font-medium text-black">{amount} {selectedWallet.symbol}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Network Fee</span>
                        <span className="text-sm font-medium text-black">1 {selectedWallet.symbol}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-sm font-bold text-black">{(parseFloat(amount) + 1).toFixed(2)} {selectedWallet.symbol}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-2xl p-4 mb-4">
                    <h3 className="text-sm font-semibold text-black mb-3">Destination</h3>
                    <p className="text-xs text-gray-500 font-mono break-all">{address || '0x7a9B8cD2E3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c'}</p>
                  </div>

                  <div className="bg-neutral-50 rounded-2xl p-4 mb-4">
                    <h3 className="text-sm font-semibold text-black mb-3">Network</h3>
                    <p className="text-sm text-gray-600">{selectedNetwork}</p>
                    <p className="text-xs text-gray-500 mt-1">Estimated arrival: ~3-5 minutes</p>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {step !== 'amount' && (
                  <button 
                    onClick={handleBack}
                    className="flex-1 bg-neutral-100 text-black rounded-xl py-4 font-medium text-sm"
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={handleContinue}
                  className="flex-1 bg-black text-white rounded-xl py-4 font-medium text-sm hover:bg-neutral-800 transition-colors"
                >
                  {step === 'confirm' ? 'Confirm Withdrawal' : 'Continue'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {scannerOpen && (
        <QRScanner
          onClose={() => setScannerOpen(false)}
          onResult={(value) => {
            setAddress(parseScannedWalletValue(value).address);
            setScannerOpen(false);
          }}
        />
      )}
    </div>
  );
}
