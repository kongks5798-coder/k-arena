import { ethers, network, run } from "hardhat"
import * as fs from "fs"

/**
 * KAUS Token — Quick Deploy Script
 *
 * deploy.ts   → 프로덕션용 (TREASURY + FEE_COLLECTOR 분리 필수)
 * deploy-kaus.ts → 이 파일: 개발/테스트용 (deployer = treasury = feeCollector 허용)
 *
 * Usage:
 *   # Hardhat local
 *   npx hardhat run scripts/deploy-kaus.ts
 *
 *   # Polygon Amoy testnet (권장 — Mumbai 대체, 2024.04~)
 *   npx hardhat run scripts/deploy-kaus.ts --network amoy
 *
 *   # Polygon Mumbai testnet (deprecated 2024.04 — RPC 불안정 가능)
 *   npx hardhat run scripts/deploy-kaus.ts --network mumbai
 *
 *   # Polygon Mainnet
 *   npx hardhat run scripts/deploy-kaus.ts --network polygon
 *
 * .env required (blockchain/.env):
 *   DEPLOYER_PRIVATE_KEY=0x...
 *   TREASURY_ADDRESS=0x...        (선택 — 없으면 deployer 사용)
 *   FEE_COLLECTOR_ADDRESS=0x...   (선택 — 없으면 deployer 사용)
 *   POLYGONSCAN_API_KEY=...       (선택 — 없으면 검증 스킵)
 */

const TESTNET_EXPLORERS: Record<string, string> = {
  amoy:    "https://amoy.polygonscan.com",
  mumbai:  "https://mumbai.polygonscan.com",
  hardhat: "http://localhost:8545",
}

async function main() {
  const [deployer] = await ethers.getSigners()
  const netName  = network.name
  const chainId  = (await ethers.provider.getNetwork()).chainId
  const isLocal  = netName === "hardhat"
  const isMainnet = netName === "polygon"
  const isTestnet = netName === "amoy" || netName === "mumbai"
  const explorer  = isMainnet
    ? "https://polygonscan.com"
    : (TESTNET_EXPLORERS[netName] ?? "")

  const TREASURY      = process.env.TREASURY_ADDRESS      || deployer.address
  const FEE_COLLECTOR = process.env.FEE_COLLECTOR_ADDRESS || deployer.address

  const balance = await ethers.provider.getBalance(deployer.address)

  console.log(`
╔══════════════════════════════════════════════════════╗
║          KAUS Token Quick Deploy                     ║
╚══════════════════════════════════════════════════════╝
  Network:        ${netName} (chainId ${chainId})
  Deployer:       ${deployer.address}
  Balance:        ${ethers.formatEther(balance)} ${isMainnet ? "MATIC" : isLocal ? "ETH" : "MATIC"}
  Treasury:       ${TREASURY}${TREASURY === deployer.address ? " (= deployer)" : ""}
  Fee Collector:  ${FEE_COLLECTOR}${FEE_COLLECTOR === deployer.address ? " (= deployer)" : ""}
`)

  if (TREASURY === deployer.address && isMainnet) {
    console.warn("⚠️  WARNING: Treasury = deployer on mainnet. Set TREASURY_ADDRESS to a Gnosis Safe!")
  }
  if (netName === "mumbai") {
    console.warn("⚠️  Mumbai deprecated April 2024. Consider --network amoy instead.")
  }
  if (isMainnet) {
    console.log("🔴 MAINNET — deploying in 5 seconds. Ctrl+C to cancel.")
    await new Promise(r => setTimeout(r, 5000))
  }

  // ── Deploy ──────────────────────────────────────────────────────────────
  console.log("⟳ Deploying KAUSToken...")
  const Factory = await ethers.getContractFactory("KAUSToken")
  const kaus = await Factory.deploy(TREASURY, FEE_COLLECTOR)
  await kaus.waitForDeployment()

  const addr   = await kaus.getAddress()
  const txHash = kaus.deploymentTransaction()?.hash ?? "(local)"

  console.log(`
✅ Deployed!
   Address:  ${addr}
   TX:       ${txHash}
   Explorer: ${explorer ? `${explorer}/token/${addr}` : "n/a (local)"}
`)

  // ── Verify tokenomics ───────────────────────────────────────────────────
  const [supply, maxSupply,,,,, genesis, priceUSDC] = await kaus.platformStats()
  console.log(`Token info:
   Supply:   ${ethers.formatEther(supply)} / ${ethers.formatEther(maxSupply)} KAUS
   Price:    $${Number(priceUSDC) / 1_000_000} USDC
   Genesis:  ${genesis}/999 sold`)

  // ── Save deployment.json ────────────────────────────────────────────────
  const info = {
    contractAddress: addr,
    txHash,
    network: netName,
    chainId: chainId.toString(),
    deployer: deployer.address,
    treasury: TREASURY,
    feeCollector: FEE_COLLECTOR,
    deployedAt: new Date().toISOString(),
    tokenomics: {
      maxSupply:    "100,000,000 KAUS",
      initialMint:  "10,000,000 KAUS → Treasury",
      initialPrice: "$1.00 USDC",
      feeRate:      "0.1%",
    },
  }

  fs.mkdirSync("./config", { recursive: true })
  const outPath = `./config/deployment-${netName}.json`
  fs.writeFileSync(outPath, JSON.stringify(info, null, 2))
  console.log(`\n✓ Saved → ${outPath}`)

  // ── Polygonscan verify ──────────────────────────────────────────────────
  if (!isLocal && process.env.POLYGONSCAN_API_KEY) {
    console.log("\n⟳ Verifying on Polygonscan (30s delay)...")
    await new Promise(r => setTimeout(r, 30_000))
    try {
      await run("verify:verify", {
        address: addr,
        constructorArguments: [TREASURY, FEE_COLLECTOR],
      })
      console.log("✓ Contract verified on Polygonscan!")
    } catch (e: unknown) {
      console.log("⚠ Verification:", e instanceof Error ? e.message : String(e))
    }
  } else if (!isLocal) {
    console.log("\n(skipping verification — no POLYGONSCAN_API_KEY)")
  }

  // ── Next steps ──────────────────────────────────────────────────────────
  const isAmoyOrMumbai = isTestnet ? `\n  Faucet:  https://faucet.polygon.technology/ (get test MATIC)` : ""
  console.log(`
╔══════════════════════════════════════════════════════╗
║  ✅ DEPLOYMENT COMPLETE                              ║
╚══════════════════════════════════════════════════════╝
  Add to Vercel environment variables:

  NEXT_PUBLIC_KAUS_CONTRACT=${addr}
  NEXT_PUBLIC_KAUS_PRICE_USDC=1.00
  NEXT_PUBLIC_CHAIN_ID=${chainId}
  NEXT_PUBLIC_POLYGON_RPC=${isMainnet ? "https://polygon-rpc.com" : isTestnet ? `https://rpc${netName === "amoy" ? "-amoy.polygon.technology" : "-mumbai.maticvigil.com"}` : "http://localhost:8545"}
${isAmoyOrMumbai}
  Explorer: ${explorer ? `${explorer}/token/${addr}` : "n/a"}
`)
}

main().catch(e => { console.error(e); process.exit(1) })
