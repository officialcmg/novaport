"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallet } from "@/hooks/useSmartWallet";
import { useBatchSwap } from "@/hooks/useBatchSwap";
import { useBatchCalls } from "@/hooks/useBatchCalls";
import RebalanceModal from "@/components/rebalance-modal";
import BatchSendModal from "@/components/batch-send-modal";
import AddTokenModal from "@/components/add-token-modal";
import { calculateRebalanceSwaps, isNativeToken } from "@/services/rebalancingService";
import { SwapWithQuote, BatchCallData } from "@/types/swap";
import { createApprovalCallData } from "@/utils/erc20";
import { parseUnits } from "viem";

interface Asset {
  address: string;
  name: string;
  symbol: string;
  balance: number;
  balanceUSD: number;
  price: number;
  percentage: number;
  logo: string | null;
  verified: boolean;
  decimals: number;
  balanceRaw: string;
}

export default function Portfolio() {
  const { user } = usePrivy();
  const { smartAccountAddress, isLoading: smartWalletLoading } = useSmartWallet();
  const { executeBatchSwap, isExecuting } = useBatchSwap();
  const [totalValue, setTotalValue] = useState<number>(0);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sliderValues, setSliderValues] = useState<number[]>([]);
  const [lockedSliders, setLockedSliders] = useState<boolean[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Rebalance modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [swapsWithQuotes, setSwapsWithQuotes] = useState<SwapWithQuote[]>([]);
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
  
  // Batch send modal state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const { executeBatchCalls, isExecuting: isSendExecuting } = useBatchCalls();
  
  // Add token modal state
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);

  // Fetch portfolio data from our API
  const fetchPortfolio = async () => {
      if (!smartAccountAddress || smartWalletLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        // Add timestamp for cache busting
        const timestamp = new Date().getTime();
        console.log(`🔄 Fetching portfolio for ${smartAccountAddress} at ${new Date().toISOString()}`);
        
        const response = await fetch(
          `/api/portfolio?address=${smartAccountAddress}&t=${timestamp}`,
          {
            method: 'GET',
            cache: 'no-store', // Don't cache this request
            headers: {
              'Cache-Control': 'no-cache',
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch portfolio");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.message || data.error);
        }

        // Transform Zapper tokens to our Asset format
        const totalUSD = data.totalBalanceUSD || 0;
        const transformedAssets: Asset[] = data.tokens.map((token: any) => ({
          address: token.tokenAddress,
          name: token.name,
          symbol: token.symbol,
          balance: token.balance,
          balanceUSD: token.balanceUSD,
          price: token.price,
          percentage: totalUSD > 0 ? (token.balanceUSD / totalUSD) * 100 : 0,
          logo: token.imgUrlV2,
          verified: token.verified,
          decimals: token.decimals || 18,
          balanceRaw: token.balanceRaw || "0",
        }));

        console.log("📊 Portfolio fetched successfully:", {
          timestamp: new Date().toISOString(),
          totalUSD,
          rawTokenCount: data.tokens.length,
          assetCount: transformedAssets.length,
          assets: transformedAssets.map(a => ({
            symbol: a.symbol,
            balance: a.balance,
            balanceUSD: a.balanceUSD,
            decimals: a.decimals,
          }))
        });

        setTotalValue(totalUSD);
        setAssets(transformedAssets);
        setSliderValues(transformedAssets.map((asset) => asset.percentage));
        setLockedSliders(transformedAssets.map(() => false));
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError(err instanceof Error ? err.message : "Failed to load portfolio");
      } finally {
        setIsLoading(false);
      }
    };
  
  useEffect(() => {
    fetchPortfolio();
  }, [smartAccountAddress, smartWalletLoading]);

  useEffect(() => {
    // Check if sliders have changed from original portfolio
    const changed = sliderValues.some(
      (value, index) => value !== assets[index]?.percentage
    );
    setHasChanges(changed);
  }, [sliderValues, assets]);

  const handleSliderChange = (index: number, newValue: number) => {
    // DEFINITIONS:
    // - MOVING SLIDER: index (the slider currently being moved)
    // - LOCKED SLIDER: any slider where lockedSliders[i] === true
    // - LAST SLIDER: bottom-most slider EXCLUDING moving slider and locked sliders
    
    // Get all unlocked slider indices
    const unlockedIndices = sliderValues.map((_, i) => i).filter(i => !lockedSliders[i]);
    
    // LAW THREE: WHEN A MOVING SLIDER IS THE LAST SLIDER, IT CANNOT MOVE
    // This happens when there's only ONE unlocked slider
    if (unlockedIndices.length === 1) {
      console.log("⚠️ LAW THREE violated: Only one unlocked slider (moving slider IS the last slider)");
      return;
    }
    
    // Determine LAST SLIDER (bottom-most unlocked slider EXCLUDING the moving slider)
    const otherUnlockedIndices = unlockedIndices.filter(i => i !== index);
    
    if (otherUnlockedIndices.length === 0) {
      console.log("⚠️ LAW THREE violated: No other unlocked sliders (moving slider IS the last slider)");
      return;
    }
    
    const lastSliderIndex = otherUnlockedIndices[otherUnlockedIndices.length - 1];
    
    // Now we can move the slider
    const oldValue = sliderValues[index];
    const diff = newValue - oldValue;
    const newSliderValues = [...sliderValues];
    
    // Update moving slider
    newSliderValues[index] = newValue;

    // LAW TWO: Last slider moves equal and opposite to moving slider
    newSliderValues[lastSliderIndex] = Math.max(0, Math.min(100, newSliderValues[lastSliderIndex] - diff));

    // LAW ONE: Slider values must always sum to 100%
    const total = newSliderValues.reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      // Adjust last slider to ensure 100% total
      newSliderValues[lastSliderIndex] += (100 - total);
    }

    console.log(`✅ Moved slider ${index}: ${oldValue.toFixed(2)}% → ${newValue.toFixed(2)}%`);
    console.log(`✅ Last slider ${lastSliderIndex} adjusted: ${sliderValues[lastSliderIndex].toFixed(2)}% → ${newSliderValues[lastSliderIndex].toFixed(2)}%`);
    
    setSliderValues(newSliderValues);
  };
  
  const toggleSliderLock = (index: number) => {
    const newLockedSliders = [...lockedSliders];
    newLockedSliders[index] = !newLockedSliders[index];
    setLockedSliders(newLockedSliders);
  };
  
  const handleAddToken = (token: any) => {
    // Add token with 0% allocation
    const newAsset: Asset = {
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      balance: 0,
      balanceUSD: 0,
      price: 0,
      percentage: 0,
      logo: token.logoURI || null,
      verified: true,
      decimals: token.decimals || 18,
      balanceRaw: "0",
    };
    
    setAssets([...assets, newAsset]);
    setSliderValues([...sliderValues, 0]);
    setLockedSliders([...lockedSliders, false]);
    setHasChanges(true);
  };

  const handleRebalance = async () => {
    if (!smartAccountAddress) {
      console.error("❌ No smart account address");
      return;
    }

    console.log("🔄 Starting rebalance process...");
    
    // Step 1: Calculate swaps needed
    const rebalanceResult = calculateRebalanceSwaps(
      assets,
      sliderValues,
      totalValue
    );

    if (rebalanceResult.swaps.length === 0) {
      console.log("✅ No swaps needed!");
      return;
    }

    // Step 2: Fetch quotes from LI.FI
    setIsFetchingQuotes(true);
    setIsModalOpen(true);

    try {
      console.log("📡 Fetching quotes from LI.FI...");
      
      const quotesPromises = rebalanceResult.swaps.map(async (swap) => {
        // Convert amount to wei based on token decimals (assuming 18 for now)
        const decimals = 18;
        const amountWei = parseUnits(swap.fromAmount.toString(), decimals).toString();
        
        const response = await fetch("/api/swap-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromToken: swap.fromToken,
            toToken: swap.toToken,
            fromAmount: amountWei,
            fromAddress: smartAccountAddress,
            slippage: 0.005, // 0.5%
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch quote for ${swap.fromSymbol} → ${swap.toSymbol}`);
        }

        const quote = await response.json();
        
        return {
          ...swap,
          quote,
          needsApproval: !isNativeToken(swap.fromToken),
        };
      });

      const swapsWithQuotes = await Promise.all(quotesPromises);
      
      console.log("✅ All quotes fetched:", swapsWithQuotes.length);
      setSwapsWithQuotes(swapsWithQuotes);
    } catch (err) {
      console.error("❌ Error fetching quotes:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch quotes");
      setIsModalOpen(false);
    } finally {
      setIsFetchingQuotes(false);
    }
  };

  const handleConfirmRebalance = async () => {
    console.log("🚀 Executing batch rebalance...");
    console.log("📊 Smart Account:", smartAccountAddress);
    console.log("📊 Swaps to execute:", swapsWithQuotes.length);
    
    // Validate swaps
    for (const swap of swapsWithQuotes) {
      console.log(`🔍 Validating swap: ${swap.fromSymbol} → ${swap.toSymbol}`, {
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        fromAmount: swap.fromAmount,
        needsApproval: swap.needsApproval
      });
      
      // Check if token exists in portfolio
      const hasToken = assets.find(a => 
        a.address.toLowerCase() === swap.fromToken.toLowerCase()
      );
      
      if (!hasToken) {
        const errorMsg = `❌ Token ${swap.fromSymbol} (${swap.fromToken}) not found in portfolio!`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      // Check if sufficient balance
      if (hasToken.balance < swap.fromAmount) {
        const errorMsg = `❌ Insufficient ${swap.fromSymbol} balance. Have: ${hasToken.balance}, Need: ${swap.fromAmount}`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
    }
    
    // Build batch calls in strict order: APPROVAL → SWAP → APPROVAL → SWAP
    const calls: BatchCallData[] = [];
    
    for (const swap of swapsWithQuotes) {
      // Add approval if needed (ERC-20 tokens only)
      if (swap.needsApproval) {
        const approvalData = createApprovalCallData(
          swap.quote.estimate.approvalAddress as `0x${string}`,
          BigInt(swap.quote.estimate.fromAmount)
        );
        
        calls.push({
          to: swap.fromToken as `0x${string}`,
          data: approvalData as `0x${string}`,
          value: BigInt(0),
          description: `Approve ${swap.fromSymbol}`,
        });
        
        console.log(`✅ Added approval: ${swap.fromSymbol}`, {
          token: swap.fromToken,
          spender: swap.quote.estimate.approvalAddress,
          amount: swap.quote.estimate.fromAmount
        });
      }
      
      // Add swap
      calls.push({
        to: swap.quote.transactionRequest.to as `0x${string}`,
        data: swap.quote.transactionRequest.data as `0x${string}`,
        value: BigInt(swap.quote.transactionRequest.value || 0),
        description: `Swap ${swap.fromSymbol} → ${swap.toSymbol}`,
      });
      
      console.log(`✅ Added swap: ${swap.fromSymbol} → ${swap.toSymbol}`, {
        to: swap.quote.transactionRequest.to,
        value: swap.quote.transactionRequest.value,
        dataLength: swap.quote.transactionRequest.data.length
      });
    }

    console.log(`📋 Total calls: ${calls.length}`);
    console.log("📋 Call details:", calls.map(c => ({
      description: c.description,
      to: c.to,
      value: c.value.toString(),
      dataLength: c.data.length
    })));
    
    try {
      console.log("🚀 Sending batch transaction...");
      const hash = await executeBatchSwap(calls);
      console.log(`✅ Rebalance complete! Hash: ${hash}`);
      console.log(`🔍 View on Moonscan: https://moonscan.io/tx/${hash}`);
      
      // Close modal and refresh portfolio
      setIsModalOpen(false);
      setHasChanges(false);
      
      // Refresh portfolio data after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } catch (err) {
      console.error("❌ Rebalance failed:", err);
      
      // Extract more useful error message
      let errorMsg = "Rebalance failed";
      if (err instanceof Error) {
        if (err.message.includes("insufficient")) {
          errorMsg = "Insufficient token balance or allowance";
        } else if (err.message.includes("reverted")) {
          errorMsg = "Transaction simulation failed. Check token balances and approvals.";
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-gray-600 text-sm mb-1">Your Portfolio</div>
          
          {isLoading ? (
            <div className="text-2xl font-semibold mb-4 text-gray-400">
              Loading...
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 mb-4">{error}</div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl font-semibold">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
              <button
                onClick={fetchPortfolio}
                disabled={isLoading}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="Refresh portfolio"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}

          {smartWalletLoading ? (
            <div className="text-xs text-gray-500 mb-4">
              Creating smart account...
            </div>
          ) : smartAccountAddress ? (
            <div className="text-xs text-gray-500 mb-4 font-mono break-all">
              Smart Account: {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
            </div>
          ) : null}
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRebalance}
              disabled={!hasChanges || isLoading || isExecuting}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                hasChanges && !isLoading && !isExecuting
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isExecuting ? "Executing..." : "Rebalance"}
            </button>
            <button
              onClick={() => setIsSendModalOpen(true)}
              disabled={isLoading || assets.length === 0}
              className="py-3 px-4 rounded-xl font-medium transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batch Send 🚀
            </button>
          </div>
          
          <button
            onClick={() => setIsAddTokenModalOpen(true)}
            disabled={isLoading}
            className="w-full mt-3 py-2 px-4 rounded-xl font-medium transition-all border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
          >
            + Add Token
          </button>
        </div>

        {/* Rebalance Modal */}
        <RebalanceModal
          isOpen={isModalOpen}
          onClose={() => !isExecuting && setIsModalOpen(false)}
          swaps={swapsWithQuotes}
          isLoading={isFetchingQuotes}
          isExecuting={isExecuting}
          onConfirm={handleConfirmRebalance}
        />
        
        {/* Batch Send Modal */}
        <BatchSendModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          onExecute={async (calls) => {
            try {
              console.log("🚀 Executing batch send with calls:", calls);
              const txHash = await executeBatchCalls(calls);
              console.log("✅ Batch send successful! TxHash:", txHash);
              // Refresh portfolio after successful send
              setTimeout(fetchPortfolio, 3000);
            } catch (err) {
              console.error("❌ Batch send execution failed:", err);
              throw err; // Re-throw so modal can catch it
            }
          }}
          availableTokens={assets.map(a => ({
            address: a.address,
            symbol: a.symbol,
            decimals: a.decimals,
            balance: a.balance,
            balanceRaw: a.balanceRaw,
            isNative: isNativeToken(a.address),
          }))}
          isExecuting={isSendExecuting}
        />
        
        {/* Add Token Modal */}
        <AddTokenModal
          isOpen={isAddTokenModalOpen}
          onClose={() => setIsAddTokenModalOpen(false)}
          onAddToken={handleAddToken}
          existingTokens={assets.map(a => a.address.toLowerCase())}
        />

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assets found</div>
        ) : (
          <div className="space-y-6">
            {assets.map((asset, index) => (
              <div key={asset.address} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {asset.logo ? (
                      <img
                        src={asset.logo}
                        alt={asset.symbol}
                        width={32}
                        height={32}
                        className="rounded-full"
                        onLoad={() => console.log(`✅ Image loaded: ${asset.symbol} - ${asset.logo}`)}
                        onError={(e) => {
                          console.log(`❌ Image failed: ${asset.symbol} - ${asset.logo}`);
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold ${asset.logo ? "hidden" : ""}`}>
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center space-x-2">
                        <span>{asset.symbol}</span>
                        {asset.verified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {asset.balance.toFixed(4)} {asset.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${(totalValue * sliderValues[index] / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${asset.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Allocation</span>
                    <button
                      onClick={() => toggleSliderLock(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={lockedSliders[index] ? "Unlock slider" : "Lock slider"}
                    >
                      {lockedSliders[index] ? (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <span className="font-medium">{sliderValues[index]?.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.01"
                  value={sliderValues[index] || 0}
                  onChange={(e) => handleSliderChange(index, parseFloat(e.target.value))}
                  disabled={lockedSliders[index]}
                  className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${lockedSliders[index] ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} accent-blue-600`}
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${sliderValues[index]}%, #e5e7eb ${sliderValues[index]}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
