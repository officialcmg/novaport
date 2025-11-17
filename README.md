IMPORTANT: THIS REPO WAS SCAFFOLDED AS A PRIVY NEXTJS STARTER APP FROM [https://github.com/privy-io/examples/blob/main/privy-next-starter/README.md](https://github.com/privy-io/examples/blob/main/privy-next-starter/README.md)

# Novaport 🚀

**Smart Portfolio Management for Moonbeam DeFi**

Novaport brings intuitive, Web2-style UX to decentralized portfolio management on Moonbeam. Login with Google, manage your tokens with physics-inspired sliders, and rebalance your portfolio - all with **zero gas fees** thanks to account abstraction (ERC-4337).

## ✨ Features

### 🎯 Core Features
- **Social Login** - Login with Google, Twitter, or email (powered by Privy)
- **Smart Wallet** - Automatic ERC-4337 smart account creation
- **Portfolio Dashboard** - Real-time portfolio tracking via Zapper API
- **Intuitive Sliders** - Adjust allocations with "Laws of Motion" physics
- **One-Click Rebalancing** - LI.FI powered swaps across DEXs
- **Batch Send** - Send multiple tokens to multiple addresses in one transaction
- **Zero Gas Fees** - All transactions sponsored by Pimlico paymaster
- **Token Search** - Add 40+ verified Moonbeam tokens

### 🎨 The "Laws of Motion" Sliders
Inspired by Newton's laws, our sliders make portfolio rebalancing intuitive:
- **LAW ONE:** Slider values always sum to 100%
- **LAW TWO:** Moving one slider causes the "last" slider to move equal and opposite
- **LAW THREE:** The last unlocked slider cannot be moved
- **Slider Locking:** Lock sliders to keep allocations fixed during rebalancing

## 🛠️ Tech Stack

- **Next.js 15** - React framework with Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern styling
- **Privy** - Social login & embedded wallets
- **Pimlico** - ERC-4337 account abstraction & gas sponsorship
- **Zapper API** - Multi-protocol portfolio aggregation
- **LI.FI** - Cross-DEX swap routing
- **Viem** - Ethereum interactions
- **Moonbeam** - Polkadot's EVM-compatible parachain

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9.15+

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd novaport
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Update `.env.local` with your API keys:

```env
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_PRIVY_SIGNER_ID=your-privy-signer-id

# Pimlico (Gas Sponsorship)
NEXT_PUBLIC_PIMLICO_API_KEY=your-pimlico-api-key

# Zapper (Portfolio Data)
ZAPPER_API_KEY=your-zapper-api-key

# LI.FI (Swap Quotes) - Optional
LIFI_API_KEY=your-lifi-api-key
```

**Get Your API Keys:**
- Privy: [dashboard.privy.io](https://dashboard.privy.io)
- Pimlico: [dashboard.pimlico.io](https://dashboard.pimlico.io)
- Zapper: [zapper.xyz/api](https://zapper.xyz/api)
- LI.FI: [li.fi](https://li.fi) (optional)

### 3. Run Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production
```bash
pnpm build
pnpm start
```

## 📖 How to Use

### Getting Started
1. **Login** - Click "Login" and authenticate with Google/Twitter/Email
2. **Wait for Wallet** - Your smart wallet is created automatically
3. **View Portfolio** - See your token balances and allocations

### Managing Your Portfolio
1. **Adjust Sliders** - Drag sliders to set target allocations
2. **Lock Sliders** - Click lock icon to fix certain allocations
3. **Click Rebalance** - Review swap quotes from LI.FI
4. **Confirm** - Execute all swaps in one transaction (gas-free!)

### Sending Tokens
1. **Click "Batch Send"** - Open the batch send modal
2. **Select Token** - Choose from your portfolio
3. **Enter Recipient** - Add recipient address
4. **Click MAX/50%/25%** - Quick amount selection
5. **Add More Sends** - Optionally send multiple tokens
6. **Execute** - Send all in one transaction (gas-free!)

### Adding Tokens
1. **Click "+ Add Token"** - Open token search
2. **Search** - Filter 40+ verified Moonbeam tokens
3. **Select & Add** - Token appears in your portfolio at 0%

## 🎯 Key Components

### Portfolio Management (`src/components/portfolio.tsx`)
- Real-time portfolio fetching from Zapper
- Slider-based allocation management
- Rebalancing logic and execution
- Batch operations coordination

### Batch Send Modal (`src/components/batch-send-modal.tsx`)
- Multi-token, multi-recipient transfers
- Native (GLMR) and ERC-20 token support
- Smart decimal handling (8 for WBTC, 6 for USDC, etc.)
- MAX/percentage quick select buttons

### Add Token Modal (`src/components/add-token-modal.tsx`)
- Search 40+ verified Moonbeam tokens
- Alphabetical sorting
- Filter by symbol, name, or address

### Rebalancing Service (`src/services/rebalancingService.ts`)
- Portfolio rebalancing algorithm
- Swap calculation with minimum thresholds
- Native token detection
- LI.FI integration

## 🔧 API Routes

### `/api/portfolio`
Fetches portfolio data from Zapper API
- **Method:** GET
- **Params:** `address` (wallet address)
- **Returns:** Token balances, USD values, decimals

### `/api/swap-quote`
Gets swap quotes from LI.FI
- **Method:** POST
- **Body:** `fromToken`, `toToken`, `fromAmount`, `fromAddress`, `slippage`
- **Returns:** Swap route, transaction data, estimated amounts

## 📦 Deployment

### Deploy to Netlify
```bash
# Push to Git
git add .
git commit -m "Ready for deployment"
git push

# Netlify will auto-detect Next.js from netlify.toml
```

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

### Environment Variables (Production)
Set these in your hosting platform:
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_PRIVY_SIGNER_ID`
- `NEXT_PUBLIC_PIMLICO_API_KEY`
- `ZAPPER_API_KEY`
- `LIFI_API_KEY` (optional)

## 🧪 Testing

### Test Scenarios
1. **Social Login** - Login/logout with different providers
2. **Portfolio Loading** - Check Zapper integration
3. **Slider Logic** - Test all three laws of motion
4. **Rebalancing** - Execute real swaps (testnet recommended)
5. **Batch Send** - Send multiple tokens
6. **Token Search** - Add new tokens to portfolio

### Console Logging
Open browser DevTools (F12) to see detailed logs:
- 🔍 Validation steps
- 💸 Transaction details
- 🚀 Execution flow
- ✅ Success confirmations
- ❌ Error details

## 🐛 Troubleshooting

### "No smart account address"
- Wait a few seconds after login for wallet creation
- Check console for Privy initialization logs

### "Failed to fetch portfolio"
- Verify `ZAPPER_API_KEY` is set correctly
- Check if wallet has any tokens on Moonbeam

### "Insufficient balance" errors
- Use MAX button to send exact balance
- Account for small amounts left for potential gas

### Slider won't move
- Check if it's the last unlocked slider (LAW THREE)
- Unlock another slider to enable movement

### Batch send fails silently
- Open console (F12) for detailed error logs
- Verify token decimals are correct
- Check recipient addresses are valid

See [BATCH_SEND_FIXES.md](./BATCH_SEND_FIXES.md) for detailed debugging.

## 📝 Documentation

- [SLIDER_LAWS.md](./SLIDER_LAWS.md) - Detailed slider logic documentation
- [DEPLOY.md](./DEPLOY.md) - Quick deployment guide
- [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) - Full Netlify setup
- [BATCH_SEND_FIXES.md](./BATCH_SEND_FIXES.md) - Batch send technical details
- [NEW_FEATURES.md](./NEW_FEATURES.md) - Feature implementation notes

## 🔗 Relevant Links

- [Moonbeam](https://moonbeam.network) - EVM-compatible Polkadot parachain
- [Privy](https://privy.io) - Social login & embedded wallets
- [Pimlico](https://pimlico.io) - Account abstraction infrastructure
- [Zapper](https://zapper.xyz) - Portfolio aggregation API
- [LI.FI](https://li.fi) - Cross-chain swap routing
- [Moonscan](https://moonscan.io) - Moonbeam block explorer

## 🏆 Built For

**Polkadot Hackathon** - Showcasing account abstraction and intuitive DeFi UX on Moonbeam

## 📄 License

MIT

---

**Made with ❤️ for the Polkadot ecosystem**
