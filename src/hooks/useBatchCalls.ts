import { useBatchSwap } from "./useBatchSwap";

/**
 * Hook for batching multiple calls (swaps, sends, approvals) into a single user operation.
 * This is literally just useBatchSwap renamed because these functions work for ANY call type lol
 * 
 * executeBatchSwap = executeBatchCalls (they're the same thing!)
 * executeSingleSwap = executeSingleCall (they're the same thing!)
 */
export function useBatchCalls() {
  const {
    executeBatchSwap,
    executeSingleSwap,
    isExecuting,
    txHash,
    error,
    isReady,
  } = useBatchSwap();

  return {
    executeBatchCalls: executeBatchSwap,
    executeSingleCall: executeSingleSwap,
    isExecuting,
    txHash,
    error,
    isReady,
  };
}
