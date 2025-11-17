"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallet } from "@/hooks/useSmartWallet";

interface Asset {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
}

interface PortfolioData {
  totalValue: number;
  assets: Asset[];
}

// Template data - will be replaced with real data later
const getTemplatePortfolio = (): PortfolioData => ({
  totalValue: 10000,
  assets: [
    { name: "Glimmer", symbol: "GLMR", value: 5000, percentage: 50 },
    { name: "Moonriver", symbol: "MOVR", value: 5000, percentage: 50 },
  ],
});

export default function Portfolio() {
  const { user } = usePrivy();
  const { smartAccountAddress, isLoading: smartWalletLoading } = useSmartWallet();
  const [portfolio, setPortfolio] = useState<PortfolioData>(getTemplatePortfolio());
  const [sliderValues, setSliderValues] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Initialize slider values from portfolio
    if (portfolio.assets.length > 0) {
      setSliderValues(portfolio.assets.map((asset) => asset.percentage));
    }
  }, [portfolio]);

  useEffect(() => {
    // Check if sliders have changed from original portfolio
    const changed = sliderValues.some(
      (value, index) => value !== portfolio.assets[index]?.percentage
    );
    setHasChanges(changed);
  }, [sliderValues, portfolio]);

  const handleSliderChange = (index: number, newValue: number) => {
    // Ensure value is between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, newValue));
    
    const newSliderValues = [...sliderValues];
    const oldValue = newSliderValues[index];
    const difference = clampedValue - oldValue;
    
    // Update the moved slider
    newSliderValues[index] = clampedValue;
    
    // Find the last slider (not the one being moved)
    const lastSliderIndex = newSliderValues.length - 1;
    const adjustIndex = index === lastSliderIndex ? lastSliderIndex - 1 : lastSliderIndex;
    
    // Adjust the last slider to maintain 100% total
    const newAdjustValue = newSliderValues[adjustIndex] - difference;
    
    // Clamp the adjusted value
    newSliderValues[adjustIndex] = Math.max(0, Math.min(100, newAdjustValue));
    
    // Recalculate to ensure exact 100%
    const total = newSliderValues.reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      const correction = 100 - total;
      newSliderValues[adjustIndex] += correction;
      newSliderValues[adjustIndex] = Math.max(0, Math.min(100, newSliderValues[adjustIndex]));
    }
    
    setSliderValues(newSliderValues);
  };

  const handleRebalance = async () => {
    console.log("Rebalancing portfolio with new allocations:", sliderValues);
    console.log("Smart Account Address:", smartAccountAddress);
    
    // TODO: Implement actual swap logic using useBatchSwap
    // Example:
    // import { useBatchSwap } from "@/hooks/useBatchSwap";
    // const { executeBatchSwap } = useBatchSwap();
    // 
    // const swapCalls = calculateSwapCalls(currentAllocation, sliderValues);
    // const hash = await executeBatchSwap(swapCalls);
    // 
    // All swaps will execute atomically with gas sponsored by Pimlico!
  };

  const fetchPortfolio = async () => {
    // TODO: Implement actual portfolio fetching
    // For now, return template data
    return getTemplatePortfolio();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-gray-600 text-sm mb-1">Your Portfolio</div>
          <div className="text-4xl font-semibold mb-4">
            ${portfolio.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
          {smartWalletLoading ? (
            <div className="text-xs text-gray-500 mb-4">
              Creating smart account...
            </div>
          ) : smartAccountAddress ? (
            <div className="text-xs text-gray-500 mb-4 font-mono break-all">
              Smart Account: {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
            </div>
          ) : null}
          <button
            onClick={handleRebalance}
            disabled={!hasChanges}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
              hasChanges
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Rebalance Portfolio
          </button>
        </div>

        <div className="space-y-6">
          {portfolio.assets.map((asset, index) => (
            <div key={asset.symbol}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-medium">
                    {asset.name} ({asset.symbol})
                  </span>
                  <span className="text-gray-600 ml-2">
                    ${(portfolio.totalValue * sliderValues[index] / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="font-medium">{sliderValues[index]?.toFixed(2)}%</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.01"
                value={sliderValues[index] || 0}
                onChange={(e) => handleSliderChange(index, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${sliderValues[index]}%, #e5e7eb ${sliderValues[index]}%, #e5e7eb 100%)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
