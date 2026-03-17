# KAUS Token — Blockchain Setup Guide

## Overview

KAUS is the native token of K-Arena AI Financial Exchange, deployed on **Polygon Mainnet**.

| Property | Value |
|----------|-------|
| Name | KAUS Token |
| Symbol | KAUS |
| Network | Polygon (chainId: 137) |
| Standard | ERC-20 + ERC-20Permit |
| Max Supply | 100,000,000 KAUS |
| Initial Mint | 10,000,000 KAUS → Treasury |
| Fee Rate | 0.1% per trade |
| Genesis Price | 500 KAUS/slot |

---

## Quick Deploy

### 1. Install dependencies
```bash
cd blockchain
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your keys
```

### 3. Set up Gnosis Safe (Treasury)
1. Go to https://app.safe.global/new-safe
2. Create 2/3 multisig with Field Nine team wallets
3. Copy Safe address → TREASURY_ADDRESS in .env

### 4. Test on Amoy testnet
```bash
# Get test MATIC from: https://faucet.polygon.technology
npm run deploy:testnet
```

### 5. Deploy to Polygon Mainnet
```bash
# Fund deployer with ~5 MATIC for gas
npm run deploy:mainnet
```

### 6. Add to Vercel
```
NEXT_PUBLIC_KAUS_CONTRACT=0x...
NEXT_PUBLIC_CHAIN_ID=137
```

---

## Revenue Flow

```
Every K-Arena trade:
  Agent wallet → 0.1% KAUS → feeCollector wallet

Genesis purchase:
  Agent wallet → 500 KAUS → Treasury wallet

Monthly distribution:
  feeCollector → 70% → Genesis holders (distributeFees())
  feeCollector → 10% → Burned (burnFees())
  feeCollector → 20% → Ops retained

Withdrawal:
  KAUS (in feeCollector) → QuickSwap → USDC → Binance → KRW → Bank
```

---

## Contract Functions

### Admin (Gnosis Safe)
- `distributeFees(address[])` — Monthly fee distribution to Genesis holders
- `burnFees(uint256)` — Deflationary burn
- `setFeeRate(uint256)` — Adjust fee (max 1%)
- `setTreasury(address)` — Update treasury address

### Platform (K-Arena server)
- `collectFee(agent, amount, txId)` — Called on each trade (FEE_ROLE)
- `mint(to, amount)` — Mint new KAUS (MINTER_ROLE)

### Public
- `mintGenesis()` — Purchase Genesis membership (500 KAUS)
- `transfer(to, amount)` — Standard ERC-20 transfer
- `platformStats()` — View aggregate stats

---

## Security

- **Gnosis Safe** as treasury (multisig, no single point of failure)
- **AccessControl** roles (MINTER, PAUSER, FEE, ADMIN)
- **ERC20Pausable** for emergency stop
- **OpenZeppelin** audited contracts (v5)
- **Contract verification** on Polygonscan

---

## Add KAUS to MetaMask

1. Open MetaMask → Add Token
2. Select "Custom Token"
3. Contract Address: `[deployed address]`
4. Symbol: `KAUS`
5. Decimals: `18`
