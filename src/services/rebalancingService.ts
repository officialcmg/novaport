/**
 * Rebalancing Service
 * 
 * Calculates the optimal swap sequence to rebalance a portfolio
 * from current allocation to target allocation.
 */

export interface TokenBalance {
  address: string;
  symbol: string;
  balance: number;
  balanceUSD: number;
  percentage: number;
  price: number;
}

export interface SwapAction {
  fromToken: string;
  toToken: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  fromAmountUSD: number;
  estimatedToAmount?: number;
  estimatedToAmountUSD?: number;
}

export interface RebalanceResult {
  swaps: SwapAction[];
  totalSwaps: number;
  totalValueUSD: number;
}

/**
 * Calculate swaps needed to rebalance portfolio
 * 
 * Algorithm:
 * 1. Calculate the difference between target and current allocation
 * 2. Identify tokens to sell (current > target) and tokens to buy (current < target)
 * 3. Create swap pairs, prioritizing largest imbalances
 * 4. Generate swap actions with amounts in USD and tokens
 */
export function calculateRebalanceSwaps(
  currentPortfolio: TokenBalance[],
  targetAllocations: number[], // Percentages that sum to 100
  totalPortfolioUSD: number
): RebalanceResult {
  console.log("🔄 Starting rebalance calculation");
  console.log("💰 Total Portfolio USD:", totalPortfolioUSD);
  
  // Step 1: Calculate differences
  const differences = currentPortfolio.map((token, index) => {
    const currentPercent = token.percentage;
    const targetPercent = targetAllocations[index];
    const currentValueUSD = token.balanceUSD;
    const targetValueUSD = (totalPortfolioUSD * targetPercent) / 100;
    const diffUSD = targetValueUSD - currentValueUSD;
    
    console.log(`📊 ${token.symbol}:`, {
      current: `${currentPercent.toFixed(2)}% ($${currentValueUSD.toFixed(2)})`,
      target: `${targetPercent.toFixed(2)}% ($${targetValueUSD.toFixed(2)})`,
      diff: `$${diffUSD.toFixed(2)}`
    });
    
    return {
      token,
      currentPercent,
      targetPercent,
      currentValueUSD,
      targetValueUSD,
      diffUSD,
      diffTokens: diffUSD / token.price
    };
  });

  // Step 2: Separate into sell (negative diff) and buy (positive diff)
  const toSell = differences
    .filter(d => d.diffUSD < -0.01) // Small threshold to avoid dust
    .sort((a, b) => a.diffUSD - b.diffUSD); // Most negative first
  
  const toBuy = differences
    .filter(d => d.diffUSD > 0.01) // Small threshold to avoid dust
    .sort((a, b) => b.diffUSD - a.diffUSD); // Most positive first

  console.log("📉 Tokens to sell:", toSell.map(d => `${d.token.symbol} ($${Math.abs(d.diffUSD).toFixed(2)})`));
  console.log("📈 Tokens to buy:", toBuy.map(d => `${d.token.symbol} ($${d.diffUSD.toFixed(2)})`));

  // Step 3: Create swap pairs
  const swaps: SwapAction[] = [];
  let sellIndex = 0;
  let buyIndex = 0;

  while (sellIndex < toSell.length && buyIndex < toBuy.length) {
    const seller = toSell[sellIndex];
    const buyer = toBuy[buyIndex];
    
    // Determine swap amount (use the smaller of the two needs)
    const swapAmountUSD = Math.min(
      Math.abs(seller.diffUSD),
      buyer.diffUSD
    );
    
    const swapAmountTokens = swapAmountUSD / seller.token.price;
    
    const swap: SwapAction = {
      fromToken: seller.token.address,
      toToken: buyer.token.address,
      fromSymbol: seller.token.symbol,
      toSymbol: buyer.token.symbol,
      fromAmount: swapAmountTokens,
      fromAmountUSD: swapAmountUSD,
    };
    
    console.log(`🔀 Swap ${sellIndex + 1}:`, {
      from: `${swap.fromAmount.toFixed(4)} ${swap.fromSymbol}`,
      to: swap.toSymbol,
      valueUSD: `$${swapAmountUSD.toFixed(2)}`
    });
    
    swaps.push(swap);
    
    // Update remaining amounts
    seller.diffUSD += swapAmountUSD; // Reduce negative diff
    buyer.diffUSD -= swapAmountUSD; // Reduce positive diff
    
    // Move to next if this one is satisfied
    if (Math.abs(seller.diffUSD) < 0.01) sellIndex++;
    if (Math.abs(buyer.diffUSD) < 0.01) buyIndex++;
  }

  console.log(`✅ Rebalance plan: ${swaps.length} swaps`);
  
  return {
    swaps,
    totalSwaps: swaps.length,
    totalValueUSD: swaps.reduce((sum, s) => sum + s.fromAmountUSD, 0)
  };
}

/**
 * Check if token is native (GLMR on Moonbeam)
 */
export function isNativeToken(tokenAddress: string): boolean {
  const GLMR_PRECOMPILE = "0x0000000000000000000000000000000000000802";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const NATIVE_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  
  const addr = tokenAddress.toLowerCase();
  return addr === GLMR_PRECOMPILE.toLowerCase() ||
         addr === ZERO_ADDRESS.toLowerCase() ||
         addr === NATIVE_PLACEHOLDER.toLowerCase();
}
