export interface SwapQuote {
  transactionRequest: {
    to: string;
    data: string;
    value: string;
    from: string;
    chainId: number;
    gasLimit: string;
  };
  estimate: {
    approvalAddress: string;
    toAmount: string;
    toAmountMin: string;
    fromAmount: string;
  };
  action: {
    fromToken: {
      address: string;
      symbol: string;
      decimals: number;
    };
    toToken: {
      address: string;
      symbol: string;
      decimals: number;
    };
  };
}

export interface SwapWithQuote {
  fromToken: string;
  toToken: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  fromAmountUSD: number;
  quote: SwapQuote;
  needsApproval: boolean;
}

export interface BatchCallData {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
  description: string; // For UI display
}
