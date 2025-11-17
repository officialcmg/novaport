# Use Smart Wallets on Moonbeam with Privy (Custom Setup)

## Install permissionless.js and viem

```bash
pnpm add permissionless viem
```

## Create Custom Smart Wallet Hook

Create `src/hooks/useCustomSmartWallet.ts`:

```typescript
import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import { createPublicClient, http, Chain } from "viem";
import { moonbeam } from "viem/chains";
import { 
  ENTRYPOINT_ADDRESS_V06,
  createSmartAccountClient,
  walletClientToSmartAccountSigner 
} from "permissionless";
import { 
  signerToSimpleSmartAccount,
  SmartAccount 
} from "permissionless/accounts";

const MOONBEAM_BUNDLER_URL = "https://api.pimlico.io/v2/1284/rpc?apikey=YOUR_PIMLICO_KEY";

export function useCustomSmartWallet() {
  const { user, getEthereumProvider } = usePrivy();
  
  const smartAccountAddress = useMemo(async () => {
    if (!user) return null;
    
    // Get the embedded wallet provider from Privy
    const provider = await getEthereumProvider();
    if (!provider) return null;
    
    // Create public client
    const publicClient = createPublicClient({
      transport: http("https://rpc.api.moonbeam.network"),
      chain: moonbeam,
    });
    
    // Convert Privy's wallet to a signer
    const signer = walletClientToSmartAccountSigner(provider);
    
    // Create simple smart account
    const simpleAccount = await signerToSimpleSmartAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V06,
      signer,
      factoryAddress: "0x0B101803e331184b97b1333298437a1183074fb4", // ✅ DEPLOYED ON MOONBEAM
    });
    
    return simpleAccount.address;
  }, [user, getEthereumProvider]);
  
  return { smartAccountAddress };
}
```

## Use in Your Component

```typescript
import { useCustomSmartWallet } from "@/hooks/useCustomSmartWallet";

function Portfolio() {
  const { smartAccountAddress } = useCustomSmartWallet();
  
  // Use smartAccountAddress
}
```

## Deploy the Factory First

You MUST deploy SimpleAccountFactory to Moonbeam first. Use the eth-infinitism repo.

## Get Pimlico API Key

1. Go to https://dashboard.pimlico.io
2. Create account
3. Get API key
4. Replace in MOONBEAM_BUNDLER_URL

This gives you full control over the smart wallet implementation on Moonbeam!
