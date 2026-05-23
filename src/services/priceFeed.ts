import { useEffect, useRef } from 'react';
import { Crypto, Wallet } from '../types/crypto';

// Simulated secure price feed service
class PriceFeedService {
  private static instance: PriceFeedService;
  private subscribers: Map<string, (data: Crypto[]) => void> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private lastPrices: Map<string, number> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private updateCount: number = 0;

  // Market cap ranges for different coins (in billions)
  private marketCapRanges: Map<string, { min: number; max: number; volatility: number }> = new Map([
    ['btc', { min: 800, max: 900, volatility: 0.001 }],   // Large cap - lower volatility
    ['eth', { min: 260, max: 290, volatility: 0.0015 }],
    ['bnb', { min: 45, max: 52, volatility: 0.002 }],
    ['sol', { min: 38, max: 48, volatility: 0.003 }],     // Mid cap - medium volatility
    ['xrp', { min: 25, max: 32, volatility: 0.0025 }],
    ['ada', { min: 14, max: 18, volatility: 0.003 }],
    ['doge', { min: 10, max: 14, volatility: 0.004 }],    // Small cap - higher volatility
    ['avax', { min: 11, max: 16, volatility: 0.0035 }],
  ]);

  private constructor() {
    // Initialize base prices
    this.lastPrices.set('btc', 43250.0);
    this.lastPrices.set('eth', 2285.5);
    this.lastPrices.set('bnb', 312.45);
    this.lastPrices.set('sol', 98.72);
    this.lastPrices.set('xrp', 0.5234);
    this.lastPrices.set('ada', 0.4521);
    this.lastPrices.set('doge', 0.0821);
    this.lastPrices.set('avax', 35.67);

    // Initialize price history
    this.lastPrices.forEach((price, symbol) => {
      const history: number[] = [];
      for (let i = 0; i < 7; i++) {
        const variance = (Math.random() - 0.5) * price * 0.05;
        history.push(price + variance);
      }
      history.push(price);
      this.priceHistory.set(symbol, history);
    });
  }

  static getInstance(): PriceFeedService {
    if (!PriceFeedService.instance) {
      PriceFeedService.instance = new PriceFeedService();
    }
    return PriceFeedService.instance;
  }

  // Generate realistic price movements based on market cap
  private generateNewPrice(currentPrice: number, symbol: string): number {
    const config = this.marketCapRanges.get(symbol);
    const volatility = config?.volatility || 0.002;
    
    // Use geometric Brownian motion for realistic price simulation
    const drift = 0.00001; // Small upward drift
    const randomShock = (Math.random() - 0.5) * 2;
    
    // Apply mean reversion to keep prices within reasonable bounds
    const meanReversion = 0.0001;
    const basePrice = this.lastPrices.get(symbol) || currentPrice;
    const reversionForce = (basePrice - currentPrice) * meanReversion;
    
    const priceChange = currentPrice * (drift + volatility * randomShock) + reversionForce;
    const newPrice = currentPrice + priceChange;
    
    // Ensure price doesn't go negative
    return Math.max(currentPrice * 0.5, newPrice);
  }

  // Calculate market cap from price
  private calculateMarketCap(symbol: string, price: number): string {
    const config = this.marketCapRanges.get(symbol);
    if (!config) return '0';
    
    // Simulate circulating supply based on market cap range
    const avgMarketCap = (config.min + config.max) / 2;
    const circulatingSupply = avgMarketCap * 1e9 / (this.lastPrices.get(symbol) || 100);
    const marketCap = (price * circulatingSupply) / 1e9;
    
    if (marketCap >= 100) {
      return marketCap.toFixed(1) + 'B';
    } else {
      return marketCap.toFixed(2) + 'B';
    }
  }

  // Calculate volume based on market cap
  private calculateVolume(symbol: string, price: number): string {
    const config = this.marketCapRanges.get(symbol);
    if (!config) return '0';
    
    // Volume typically 5-15% of market cap for active coins
    const avgMarketCap = (config.min + config.max) / 2;
    const volumeRatio = 0.05 + Math.random() * 0.1;
    const volume = (avgMarketCap * volumeRatio);
    
    if (volume >= 1) {
      return volume.toFixed(1) + 'B';
    } else {
      return (volume * 1000).toFixed(0) + 'M';
    }
  }

  private updatePrices(): Crypto[] {
    this.updateCount++;
    const updates: Crypto[] = [];

    const cryptoConfigs = [
      { id: 'btc', name: 'Bitcoin', symbol: 'BTC' },
      { id: 'eth', name: 'Ethereum', symbol: 'ETH' },
      { id: 'bnb', name: 'BNB', symbol: 'BNB' },
      { id: 'sol', name: 'Solana', symbol: 'SOL' },
      { id: 'xrp', name: 'XRP', symbol: 'XRP' },
      { id: 'ada', name: 'Cardano', symbol: 'ADA' },
      { id: 'doge', name: 'Dogecoin', symbol: 'DOGE' },
      { id: 'avax', name: 'Avalanche', symbol: 'AVAX' },
    ];

    cryptoConfigs.forEach(config => {
      const lastPrice = this.lastPrices.get(config.id) || 100;
      const newPrice = this.generateNewPrice(lastPrice, config.id);
      this.lastPrices.set(config.id, newPrice);

      // Update price history (keep last 7 data points)
      const history = this.priceHistory.get(config.id) || [];
      history.shift();
      history.push(newPrice);
      this.priceHistory.set(config.id, [...history]);

      // Calculate percentage change from first history point
      const oldPrice = history[0] || newPrice;
      const change = ((newPrice - oldPrice) / oldPrice) * 100;

      updates.push({
        ...config,
        price: newPrice,
        change: parseFloat(change.toFixed(2)),
        isUp: change >= 0,
        sparkline: [...history],
        marketCap: this.calculateMarketCap(config.id, newPrice),
        volume: this.calculateVolume(config.id, newPrice),
      });
    });

    return updates;
  }

  subscribe(id: string, callback: (data: Crypto[]) => void): () => void {
    this.subscribers.set(id, callback);

    if (this.intervalId === null) {
      // Start price updates every 10 minutes (600000ms)
      // For demo purposes, we'll use 10 seconds to show it working
      // In production, change to 600000 for actual 10-minute intervals
      const UPDATE_INTERVAL = 10000; // 10 seconds for demo (change to 600000 for 10 min)
      
      this.intervalId = setInterval(() => {
        const updates = this.updatePrices();
        this.subscribers.forEach(cb => cb(updates));
      }, UPDATE_INTERVAL);

      // Send initial data immediately
      const initialUpdates = this.updatePrices();
      callback(initialUpdates);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
      if (this.subscribers.size === 0 && this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };
  }

  getCurrentPrice(symbol: string): number {
    return this.lastPrices.get(symbol.toLowerCase()) || 0;
  }

  getUpdateCount(): number {
    return this.updateCount;
  }
}

// Wallet balance calculator service
class WalletBalanceService {
  private static instance: WalletBalanceService;

  private constructor() {}

  static getInstance(): WalletBalanceService {
    if (!WalletBalanceService.instance) {
      WalletBalanceService.instance = new WalletBalanceService();
    }
    return WalletBalanceService.instance;
  }

  // Calculate USD value of wallet holdings
  calculateUSDValue(holdings: { symbol: string; amount: number }[], prices: Map<string, number>): number {
    return holdings.reduce((total, holding) => {
      const price = prices.get(holding.symbol.toLowerCase()) || 0;
      return total + (holding.amount * price);
    }, 0);
  }

  // Update wallet balances based on price changes (for tracking value, not actual balance)
  updateWalletValues(wallets: Wallet[], cryptoData: Crypto[]): Wallet[] {
    const priceMap = new Map<string, number>();
    cryptoData.forEach(crypto => {
      priceMap.set(crypto.symbol.toLowerCase(), crypto.price);
    });

    return wallets.map(wallet => {
      const price = priceMap.get(wallet.symbol.toLowerCase()) || 1;
      const usdValue = wallet.balance * price;
      
      // Find matching crypto for change percentage
      const matchingCrypto = cryptoData.find(c => c.symbol.toLowerCase() === wallet.symbol.toLowerCase());
      const change = matchingCrypto?.change || 0;

      return {
        ...wallet,
        usdValue,
        change,
      };
    });
  }
}

// React hooks for using the services
export function useCryptoPriceUpdates(setCryptoData: React.Dispatch<React.SetStateAction<Crypto[]>>) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const priceFeed = PriceFeedService.getInstance();
    
    unsubscribeRef.current = priceFeed.subscribe('app', (updates) => {
      setCryptoData(updates);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [setCryptoData]);
}

export function useWalletBalanceUpdates(
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>,
  cryptoData: Crypto[]
) {
  useEffect(() => {
    const walletService = WalletBalanceService.getInstance();
    setWallets(prev => walletService.updateWalletValues(prev, cryptoData));
  }, [cryptoData, setWallets]);
}

export { PriceFeedService, WalletBalanceService };