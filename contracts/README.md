# ERC-4337 Smart Account Contracts for Moonbeam (v0.6)

## ⚠️ IMPORTANT: Using EntryPoint v0.6

Moonbeam has EntryPoint **v0.6** deployed. These contracts match that version.

## 📁 Folder Structure

```
contracts/
├── accounts/
│   ├── SimpleAccountFactory.sol    ← DEPLOY THIS ONE
│   ├── SimpleAccount.sol
│   └── callback/
│       └── TokenCallbackHandler.sol
├── core/
│   ├── BaseAccount.sol
│   └── Helpers.sol
└── interfaces/
    ├── IEntryPoint.sol
    └── UserOperation.sol
```

## 🚀 How to Deploy in Remix

### Step 1: Upload to Remix
1. Go to https://remix.ethereum.org
2. **Drag the entire `contracts` folder** into Remix File Explorer
3. All files uploaded with correct structure ✅

### Step 2: Compile
1. Open `contracts/accounts/SimpleAccountFactory.sol`
2. Solidity Compiler: **0.8.12** (v0.6 uses this version)
3. Optimization: **Enabled (200 runs)**
4. Click "Compile SimpleAccountFactory.sol"
5. Wait for OpenZeppelin to auto-download

### Step 3: Deploy
1. Deploy & Run Transactions tab
2. Environment: **Injected Provider - MetaMask**
3. Network: **Moonbeam (Chain ID: 1284)**
4. Contract: **SimpleAccountFactory**
5. Constructor: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
6. Click **Deploy**
7. Confirm in MetaMask

### Step 4: Save Address
Copy the deployed factory address!

## ✅ What Gets Deployed

- ✅ Factory contract
- ✅ `SimpleAccount` implementation (deployed in constructor)
- ✅ Ready to create smart accounts!

## 📝 Deployment Info

**EntryPoint v0.6 (Already on Moonbeam):**
```
0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
```

**Network:**
- Chain: Moonbeam
- Chain ID: 1284
- Currency: GLMR
- RPC: https://rpc.api.moonbeam.network

**After Deployment:**
Update `CUSTOM_SMART_WALLET_SETUP.md` with your factory address!

## 🔗 Source

Contracts from: https://github.com/eth-infinitism/account-abstraction
Version: **v0.6.0** (matches Moonbeam's EntryPoint)
Date: November 17, 2025
