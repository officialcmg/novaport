# Deploy SimpleAccountFactory with Remix

## Step 1: Upload Contracts to Remix (Super Easy!)

All the contracts are already in your project in the `contracts/` folder with the correct structure:

```
contracts/
├── accounts/
│   ├── SimpleAccountFactory.sol    ← This is what you'll deploy
│   ├── SimpleAccount.sol
│   └── callback/
│       └── TokenCallbackHandler.sol
├── core/
│   ├── BaseAccount.sol
│   └── Helpers.sol
└── interfaces/
    ├── IEntryPoint.sol
    ├── ISenderCreator.sol
    └── PackedUserOperation.sol
```

### Upload to Remix:

**Option A: Drag and Drop (Easiest)**
1. Go to https://remix.ethereum.org
2. **Drag the entire `contracts` folder** from your project into Remix's File Explorer
3. Done! All files with correct structure are uploaded

**Option B: Upload Folder**
1. Go to https://remix.ethereum.org
2. Right-click in Remix File Explorer → "Upload Folder"
3. Select the `contracts` folder from your project
4. Done!

## Step 2: Compile

1. In Remix, open `contracts/accounts/SimpleAccountFactory.sol`
2. Go to "Solidity Compiler" tab
3. Select compiler version: **0.8.28**
4. Enable optimization: **Yes** with **200** runs
5. Click "Compile SimpleAccountFactory.sol"
6. Wait for compilation (Remix auto-downloads OpenZeppelin contracts)

✅ All dependencies should resolve automatically!

## Step 3: Deploy

1. Go to "Deploy & Run Transactions" tab
2. Environment: Select **"Injected Provider - MetaMask"**
3. Connect MetaMask to **Moonbeam network** (Chain ID: 1284)
4. Contract dropdown: Select **`SimpleAccountFactory`**
5. Constructor Arguments:
   - `_ENTRYPOINT`: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
6. Click **"Deploy"**
7. Confirm transaction in MetaMask
8. Wait for deployment confirmation

## Step 4: Save the Deployed Address

✅ After successful deployment:
- Copy the **Factory Contract Address** from Remix
- Example: `0x1234567890abcdefABCDEF1234567890abcdef12`
- **Save this!** You'll need it for the custom smart wallet hook

---

## Step 5: Verify on Moonscan (Recommended)

1. Go to https://moonscan.io
2. Search for your deployed factory address
3. Click "Contract" tab → "Verify & Publish"
4. Fill in:
   - Compiler Type: **Solidity (Single file)**
   - Compiler Version: **v0.8.28+commit...** (match your Remix version)
   - Optimization: **Yes** with **200** runs
   - Constructor Arguments (ABI-encoded):
     ```
     0000000000000000000000005FF137D4b0FDCD49DcA30c7CF57E578a026d2789
     ```
5. Paste the **flattened contract code** (use Remix's "Flatten" plugin)
6. Submit for verification

---

## Step 6: Use in Your App

Update `CUSTOM_SMART_WALLET_SETUP.md`:
```typescript
factoryAddress: "YOUR_DEPLOYED_FACTORY_ADDRESS", // Use the address from Step 2
```

---

## Important Notes

### EntryPoint Address (Pre-deployed on Moonbeam)
```
0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
```
This is **already deployed** on Moonbeam. You don't need to deploy it.

### Why This Works
- The factory creates smart accounts
- Each smart account is controlled by your Privy embedded wallet (as signer)
- EntryPoint handles the ERC-4337 user operations
- Moonbeam has EntryPoint deployed ✅

### For Hackathon Documentation
```
Smart Account Architecture:
- Deployed SimpleAccountFactory to Moonbeam
- Factory Address: 0xYOUR_ADDRESS
- EntryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
- Users authenticate via Privy embedded wallets
- Embedded wallets act as signers for smart accounts
- Smart accounts enable gas sponsorship and batched transactions
```

---

## Troubleshooting

**"Cannot find module" errors in Remix:**
- Click "Refresh" button in File Explorer
- Manually create missing directories
- Remix will auto-download OpenZeppelin packages

**Compilation fails:**
- Ensure Solidity version is exactly **0.8.28**
- Enable optimization
- Wait for all imports to resolve

**Deployment fails:**
- Check MetaMask is connected to Moonbeam (Chain ID: 1284)
- Ensure you have GLMR for gas
- Verify EntryPoint address is correct
