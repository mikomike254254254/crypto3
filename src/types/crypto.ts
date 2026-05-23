export interface Crypto {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change?: number;
  isUp?: boolean;
  sparkline?: number[];
  marketCap: string | number;
  volume: string | number;
  change24h?: number;
  icon?: string;
  color?: string;
}

export interface Wallet {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  change?: number;
  color: string;
  address?: string;
  accountNumber?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'buy' | 'sell' | 'deposit' | 'withdraw' | 'gas_fee' | 'kyc_bonus';
  amount: number;
  currency?: string;
  symbol?: string;
  date?: string;
  timestamp?: Date;
  status: 'completed' | 'pending' | 'failed';
  address?: string;
  fee?: number;
  label?: string;
}
