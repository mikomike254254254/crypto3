export const NETWORKS = {
  TRC20: {
    name: 'TRC-20 (Tron)',
    fee: 1,
    feeSymbol: 'USDT',
    time: '~3 minutes',
    confirmations: 20,
  },
  ERC20: {
    name: 'ERC-20 (Ethereum)',
    fee: 5,
    feeSymbol: 'USDT',
    time: '~5 minutes',
    confirmations: 12,
  },
  BEP20: {
    name: 'BEP-20 (BSC)',
    fee: 0.8,
    feeSymbol: 'USDT',
    time: '~3 minutes',
    confirmations: 15,
  },
  OMNI: {
    name: 'Omni Layer',
    fee: 15,
    feeSymbol: 'USDT',
    time: '~10 minutes',
    confirmations: 6,
  },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  }
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  return num.toLocaleString();
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return address.slice(0, 8) + '...' + address.slice(-6);
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function calculateNetworkFee(network: keyof typeof NETWORKS, amount: number): number {
  const baseFee = NETWORKS[network]?.fee || 1;
  // Add percentage-based fee for larger amounts
  const percentageFee = amount * 0.001; // 0.1%
  return baseFee + percentageFee;
}

export function validateAddress(address: string, network: keyof typeof NETWORKS): boolean {
  if (!address) return false;
  
  // Basic validation - in production, you'd have network-specific validation
  switch (network) {
    case 'TRC20':
      return address.startsWith('T') && address.length === 34;
    case 'ERC20':
      return address.startsWith('0x') && address.length === 42;
    case 'BEP20':
      return address.startsWith('0x') && address.length === 42;
    default:
      return address.length > 20;
  }
}