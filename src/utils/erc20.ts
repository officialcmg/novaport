import { encodeFunctionData } from "viem";

/**
 * ERC-20 ABI for approve function
 */
export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/**
 * Create approval transaction data for ERC-20 token
 */
export function createApprovalCallData(
  spenderAddress: string,
  amount: bigint
): string {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spenderAddress as `0x${string}`, amount],
  });
}

/**
 * Check if token is native (GLMR on Moonbeam)
 */
export function isNativeToken(tokenAddress: string): boolean {
  const GLMR_PRECOMPILE = "0x0000000000000000000000000000000000000802";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const NATIVE_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  
  const addr = tokenAddress.toLowerCase();
  return (
    addr === GLMR_PRECOMPILE.toLowerCase() ||
    addr === ZERO_ADDRESS.toLowerCase() ||
    addr === NATIVE_PLACEHOLDER.toLowerCase()
  );
}
