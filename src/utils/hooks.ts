import { useState, useEffect } from "react";
import { Wallet, Crypto, Transaction } from "../types/crypto";

export function useWalletData() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Simulated wallet data
    const walletData: Wallet[] = [
      {
        id: '1',
        name: 'USDT Wallet',
        symbol: 'USDT',
        balance: 8542.50,
        color: 'green',
        address: '0x7a9B8c6D5e4F3a2B1c0D9e8F7a6B5c4D3e2F1a0B',
      },
      {
        id: '2',
        name: 'Bitcoin Wallet',
        symbol: 'BTC',
        balance: 0.4521,
        color: 'orange',
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      },
      {
        id: '3',
        name: 'Ethereum Wallet',
        symbol: 'ETH',
        balance: 2.1847,
        color: 'blue',
        address: '0x3b2C4d5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c',
      },
    ];

    const cryptoData: Crypto[] = [
      {
        id: 'btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 67234.50,
        change24h: 2.45,
        volume: 28500000000,
        marketCap: 1320000000000,
        icon: 'BTC',
        color: 'orange',
      },
      {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3456.78,
        change24h: -1.23,
        volume: 15200000000,
        marketCap: 415000000000,
        icon: 'ETH',
        color: 'blue',
      },
      {
        id: 'usdt',
        symbol: 'USDT',
        name: 'Tether',
        price: 1.00,
        change24h: 0.01,
        volume: 45000000000,
        marketCap: 95000000000,
        icon: 'USDT',
        color: 'green',
      },
      {
        id: 'bnb',
        symbol: 'BNB',
        name: 'BNB',
        price: 584.32,
        change24h: 3.67,
        volume: 1800000000,
        marketCap: 87000000000,
        icon: 'B',
        color: 'yellow',
      },
      {
        id: 'sol',
        symbol: 'SOL',
        name: 'Solana',
        price: 142.89,
        change24h: -0.89,
        volume: 2300000000,
        marketCap: 62000000000,
        icon: 'S',
        color: 'purple',
      },
    ];

    const transactionData: Transaction[] = [
      {
        id: '1',
        type: 'receive',
        amount: 500,
        symbol: 'USDT',
        timestamp: new Date(Date.now() - 3600000),
        status: 'completed',
        address: '0x7a9B...a7B8c',
        fee: 1.5,
      },
      {
        id: '2',
        type: 'send',
        amount: 0.05,
        symbol: 'BTC',
        timestamp: new Date(Date.now() - 7200000),
        status: 'completed',
        address: 'bc1q...wlh',
        fee: 0.0001,
      },
      {
        id: '3',
        type: 'swap',
        amount: 1000,
        symbol: 'USDT',
        timestamp: new Date(Date.now() - 86400000),
        status: 'completed',
        fee: 2.0,
      },
    ];

    setWallets(walletData);
    setCryptos(cryptoData);
    setTransactions(transactionData);
  }, []);

  return { wallets, cryptos, transactions };
}
