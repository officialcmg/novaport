# 📖 LI.FI API Integration Guide - THE BIBLE

## 🔑 1. API KEYS

### ❌ **NO API KEY REQUIRED FOR BASIC USE**
- LI.FI API works **WITHOUT** an API key
- API key is **OPTIONAL** and only needed for **higher rate limits**

### Rate Limits:
**Unauthenticated (No API Key):**
- 20 requests per minute (rpm) for all requests combined

**Authenticated (With API Key):**
- Higher limits (need to check their plans page)

### How to Use API Key (Optional):
```bash
curl 'https://li.quest/v1/quote?...' \
  --header 'x-lifi-api-key: YOUR_CUSTOM_KEY'
```

**For now: We'll start WITHOUT an API key, add later if needed.**

---

## ✅ 2. APPROVALS - CRITICAL FOR ERC-20 SWAPS

### 🚨 **THE APPROVAL RULE:**
**EVERY ERC-20 token swap requires TWO transactions:**
1. **APPROVAL transaction** - Approve the router to spend your tokens
2. **SWAP transaction** - Execute the actual swap

### ⚡ **Native Token Exception:**
- **GLMR (native token)** does NOT need approval
- Only ERC-20 tokens need approval

---

## 📋 3. THE APPROVAL PROCESS (From LI.FI Docs)

### Step 1: Get Quote
```typescript
GET https://li.quest/v1/quote?
  fromChain=1284&
  toChain=1284&
  fromToken=0xTOKEN_ADDRESS&
  toToken=0xTOKEN_ADDRESS&
  fromAmount=1000000000000000000&
  fromAddress=0xUSER_ADDRESS
```

### Step 2: Check Response for `approvalAddress`
```json
{
  "estimate": {
    "approvalAddress": "0x1111111254fb6c44bac0bed2854e76f90643097d",
    // ☝️ THIS is the address you need to approve!
  },
  "transactionRequest": {
    "to": "0x...",
    "data": "0x...",
    "value": "0x..."
  }
}
```

### Step 3: Check Current Allowance
```typescript
// ERC-20 Contract ABI (approve function)
const ERC20_ABI = [
  {
    "name": "allowance",
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

// Check current allowance
const allowance = await tokenContract.allowance(
  userAddress,      // owner
  approvalAddress   // spender (from quote response)
);

if (allowance < swapAmount) {
  // Need to approve!
}
```

### Step 4: Create Approval Transaction
```typescript
import { encodeFunctionData } from 'viem';

const approvalData = encodeFunctionData({
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [
    approvalAddress,  // spender (from quote)
    swapAmount        // amount to approve
  ]
});

const approvalCall = {
  to: tokenAddress,      // The ERC-20 token contract
  data: approvalData,
  value: 0n              // Always 0 for approvals
};
```

---

## 🔥 4. BATCHING: STRICT ORDER FOR MULTIPLE SWAPS

### **YOUR REQUIREMENT:**
```
APPROVAL1 → SWAP1 → APPROVAL2 → SWAP2 → APPROVAL3 → SWAP3
```

### **Example: 3 Swaps (GLMR → WETH → USDC)**

```typescript
// Swap 1: GLMR → WETH
const quote1 = await getQuote(GLMR, WETH, amount1);
// ❌ NO APPROVAL needed (GLMR is native)

// Swap 2: WETH → USDC  
const quote2 = await getQuote(WETH, USDC, amount2);
// ✅ APPROVAL needed (WETH is ERC-20)

// Swap 3: USDC → DAI
const quote3 = await getQuote(USDC, DAI, amount3);
// ✅ APPROVAL needed (USDC is ERC-20)

// BUILD BATCH CALLS IN STRICT ORDER:
const calls = [
  // SWAP 1 (no approval needed for native GLMR)
  {
    to: quote1.transactionRequest.to,
    data: quote1.transactionRequest.data,
    value: BigInt(quote1.transactionRequest.value)
  },
  
  // APPROVAL 2 (for WETH)
  {
    to: WETH_ADDRESS,
    data: encodeApproval(quote2.estimate.approvalAddress, wethAmount),
    value: 0n
  },
  // SWAP 2
  {
    to: quote2.transactionRequest.to,
    data: quote2.transactionRequest.data,
    value: BigInt(quote2.transactionRequest.value)
  },
  
  // APPROVAL 3 (for USDC)
  {
    to: USDC_ADDRESS,
    data: encodeApproval(quote3.estimate.approvalAddress, usdcAmount),
    value: 0n
  },
  // SWAP 3
  {
    to: quote3.transactionRequest.to,
    data: quote3.transactionRequest.data,
    value: BigInt(quote3.transactionRequest.value)
  }
];

// Execute atomically with gas sponsorship!
await executeBatchSwap(calls);
```

---

## 🎯 5. IMPLEMENTATION CHECKLIST

### Backend Route: `/api/swap-quote`
```typescript
export async function POST(request: NextRequest) {
  const { fromToken, toToken, amount, userAddress } = await request.json();
  
  const response = await fetch(
    `https://li.quest/v1/quote?` +
    `fromChain=1284&` +
    `toChain=1284&` +
    `fromToken=${fromToken}&` +
    `toToken=${toToken}&` +
    `fromAmount=${amount}&` +
    `fromAddress=${userAddress}`
  );
  
  const quote = await response.json();
  
  return NextResponse.json({
    transactionRequest: quote.transactionRequest,
    approvalAddress: quote.estimate.approvalAddress,
    estimate: quote.estimate
  });
}
```

### Helper: Check if Approval Needed
```typescript
function needsApproval(tokenAddress: string): boolean {
  const NATIVE_TOKEN = "0x0000000000000000000000000000000000000802"; // GLMR
  const NATIVE_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  
  return tokenAddress !== NATIVE_TOKEN && 
         tokenAddress !== NATIVE_PLACEHOLDER;
}
```

### Helper: Create Approval Call
```typescript
function createApprovalCall(
  tokenAddress: string,
  approvalAddress: string,
  amount: bigint
) {
  const approvalData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [approvalAddress, amount]
  });
  
  return {
    to: tokenAddress,
    data: approvalData,
    value: 0n
  };
}
```

### Main Rebalance Logic
```typescript
async function handleRebalance() {
  // 1. Calculate swaps needed based on slider changes
  const swaps = calculateSwapsNeeded(assets, sliderValues);
  
  // 2. Get quotes for all swaps
  const quotes = await Promise.all(
    swaps.map(swap => 
      fetch('/api/swap-quote', {
        method: 'POST',
        body: JSON.stringify({
          fromToken: swap.fromToken,
          toToken: swap.toToken,
          amount: swap.amount,
          userAddress: smartAccountAddress
        })
      }).then(r => r.json())
    )
  );
  
  // 3. Build batch calls in strict order: APPROVAL, SWAP, APPROVAL, SWAP...
  const calls = [];
  
  for (let i = 0; i < swaps.length; i++) {
    const swap = swaps[i];
    const quote = quotes[i];
    
    // Add APPROVAL if needed (ERC-20 only)
    if (needsApproval(swap.fromToken)) {
      calls.push(
        createApprovalCall(
          swap.fromToken,
          quote.approvalAddress,
          BigInt(swap.amount)
        )
      );
    }
    
    // Add SWAP
    calls.push({
      to: quote.transactionRequest.to,
      data: quote.transactionRequest.data,
      value: BigInt(quote.transactionRequest.value || 0)
    });
  }
  
  // 4. Execute batch atomically with gas sponsorship!
  const hash = await executeBatchSwap(calls);
  console.log(`✅ Rebalance complete: ${hash}`);
}
```

---

## 🔍 6. KEY INSIGHTS FROM DOCS

### ✅ What LI.FI Returns:
- `transactionRequest.to` - Router contract address
- `transactionRequest.data` - Encoded swap calldata
- `transactionRequest.value` - ETH/GLMR value to send
- `estimate.approvalAddress` - Address to approve tokens to
- `estimate.toAmount` - Expected output
- `estimate.toAmountMin` - Minimum output (with slippage)

### ✅ Native Token Addresses:
- LI.FI uses: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` for native
- Moonbeam GLMR: `0x0000000000000000000000000000000000000802`
- Both should work, but use GLMR precompile for consistency

### ✅ Slippage:
- Default is 0.3% (0.003)
- Add `&slippage=0.005` for 0.5% slippage

---

## 🚀 7. TESTING PLAN

1. **Test Single Swap (Native → ERC-20)**
   - GLMR → WETH (no approval needed)
   
2. **Test Single Swap (ERC-20 → ERC-20)**
   - WETH → USDC (approval + swap)
   
3. **Test Batch (3 swaps)**
   - GLMR → WETH (swap only)
   - WETH → USDC (approval + swap)
   - USDC → DAI (approval + swap)

4. **Verify on Moonscan**
   - Check all transactions executed
   - Check gas was sponsored by Pimlico

---

## 📌 CRITICAL REMINDERS

1. **NO API KEY needed initially** (20 rpm is fine for testing)
2. **ALWAYS check `approvalAddress` from quote response**
3. **ONLY approve ERC-20 tokens, NOT native GLMR**
4. **Maintain strict order: APPROVAL → SWAP → APPROVAL → SWAP**
5. **Use `executeBatchSwap` for atomic execution with gas sponsorship**

Ready to implement! 🚀
