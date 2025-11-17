import { useState } from "react";
import { Address, encodeFunctionData } from "viem";
import { useSmartWallet } from "./useSmartWallet";

/**
 * Hook for batching multiple swap transactions into a single user operation.
 * This follows permissionless.js docs exactly for batch transactions.
 * 
 * Benefits:
 * - Single user operation = one signature instead of multiple
 * - Atomic execution = all swaps succeed or all fail
 * - Gas sponsored by Pimlico paymaster
 * - Cheaper than individual transactions
 */

export interface SwapCall {
  to: Address;
  value: bigint;
  data: `0x${string}`;
}

export function useBatchSwap() {
  const { smartAccountClient, isLoading: walletLoading } = useSmartWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Execute a batch of swaps in a single user operation.
   * 
   * Example usage:
   * ```
   * const swaps = [
   *   {
   *     to: "0xRouterAddress",
   *     value: parseEther("1.0"),
   *     data: encodeFunctionData({
   *       abi: routerAbi,
   *       functionName: "swapExactETHForTokens",
   *       args: [minAmountOut, path, account.address, deadline]
   *     })
   *   },
   *   {
   *     to: "0xAnotherRouterAddress",
   *     value: 0n,
   *     data: encodeFunctionData({
   *       abi: routerAbi,
   *       functionName: "swapExactTokensForTokens",
   *       args: [amountIn, minAmountOut, path, account.address, deadline]
   *     })
   *   }
   * ];
   * 
   * const hash = await executeBatchSwap(swaps);
   * ```
   */
  const executeBatchSwap = async (calls: SwapCall[]): Promise<string> => {
    if (!smartAccountClient) {
      throw new Error("Smart account client not ready");
    }

    setIsExecuting(true);
    setError(null);

    try {
      // This is the EXACT pattern from permissionless.js docs
      // See: https://docs.pimlico.io/permissionless/how-to/accounts/use-light-account
      const hash = await smartAccountClient.sendUserOperation({
        calls: calls.map(call => ({
          to: call.to,
          value: call.value,
          data: call.data,
        })),
      });

      setTxHash(hash);
      console.log("✅ Batch swap executed:", hash);
      console.log(`🔍 View on Moonscan: https://moonscan.io/tx/${hash}`);
      
      return hash;
    } catch (err) {
      console.error("❌ Batch swap failed:", err);
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Execute a single swap (convenience method).
   * Still goes through user operation for gas sponsorship.
   */
  const executeSingleSwap = async (call: SwapCall): Promise<string> => {
    return executeBatchSwap([call]);
  };

  return {
    executeBatchSwap,
    executeSingleSwap,
    isExecuting,
    txHash,
    error,
    isReady: !!smartAccountClient && !walletLoading,
  };
}
