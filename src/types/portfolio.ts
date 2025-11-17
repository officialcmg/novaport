// Zapper API token structure
export interface ZapperToken {
  tokenAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  verified: boolean;
  price: number;
  balance: number;
  balanceUSD: number;
  balanceRaw: string;
  imgUrlV2: string | null;
  network: {
    name: string;
  };
}

export interface PortfolioData {
  success: boolean;
  totalBalanceUSD: number;
  tokens: ZapperToken[];
}

// For the UI
export interface Asset {
  address: string;
  name: string;
  symbol: string;
  balance: number;
  balanceUSD: number;
  price: number;
  percentage: number;
  logo: string | null;
  verified: boolean;
}
