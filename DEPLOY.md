# 🚀 Quick Deploy to Netlify

## ✅ All Tokens Verified
**All 40+ tokens in tokenlist.json are Moonbeam tokens (chainId: 1284)** ✅

---

## 📦 Files Created

1. **`netlify.toml`** - Netlify configuration for Next.js
2. **`.env.example`** - Updated with all required environment variables
3. **`NETLIFY_DEPLOYMENT.md`** - Full deployment guide

---

## ⚡ Quick Deploy Steps

### **1. Push to Git**
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### **2. Connect to Netlify**
1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Select your Git repository
4. Netlify will auto-detect Next.js settings from `netlify.toml`

### **3. Set Environment Variables**
In Netlify dashboard → **Site settings** → **Environment variables**:

```
NEXT_PUBLIC_PRIVY_APP_ID = <your-privy-app-id>
NEXT_PUBLIC_PRIVY_SIGNER_ID = <your-signer-id>
NEXT_PUBLIC_PIMLICO_API_KEY = <your-pimlico-key>
ZAPPER_API_KEY = <your-zapper-key>
LIFI_API_KEY = <your-lifi-key>  (optional)
```

### **4. Deploy!**
Click **Deploy site** - that's it! 🎉

---

## 🔧 What Changed

### **Build Configuration**
- ✅ Created `netlify.toml` with Next.js runtime
- ✅ Removed `--turbopack` from build command (experimental for production)
- ✅ Configured for pnpm package manager
- ✅ Set Node 20 environment

### **Environment Variables**
- ✅ Updated `.env.example` with all required vars
- ✅ Documented which are required vs optional

### **Token List**
- ✅ Verified all 40+ tokens are Moonbeam (chainId: 1284)
- ✅ Correct decimals for each token (8 for WBTC, 6 for USDC, 18 for GLMR, etc.)

---

## 🎯 Post-Deploy Testing

After deployment, test these features:
1. ✅ Privy login
2. ✅ Portfolio loads (Zapper API)
3. ✅ Add Token modal shows tokens alphabetically
4. ✅ Batch Send with MAX/50%/25% buttons
5. ✅ Slider locking (both sliders can move)
6. ✅ Rebalancing (LI.FI quotes)

---

## 📞 Need Help?

See **`NETLIFY_DEPLOYMENT.md`** for:
- Detailed deployment guide
- Troubleshooting common issues
- Security checklist
- Performance optimization

---

**Your app is ready to deploy!** 🚀

**One-liner for CLI deployment:**
```bash
netlify init && netlify env:import .env && netlify deploy --prod
```

Or just push to Git and let Netlify auto-deploy! ✨
