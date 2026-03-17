import { ethers, network, run } from "hardhat"
import * as fs from "fs"

/**
 * KAUS Token — Polygon Deployment Script
 *
 * REQUIRED before running:
 * 1. Create MetaMask wallet → copy address as TREASURY_ADDRESS
 * 2. Create second wallet   → copy address as FEE_COLLECTOR_ADDRESS
 * 3. Get MATIC: https://polygon.technology (need ~5 MATIC for gas)
 * 4. Fill in blockchain/.env
 *
 * Test:  npx hardhat run scripts/deploy.ts --network amoy
 * Live:  npx hardhat run scripts/deploy.ts --network polygon
 */
async function main() {
  const [deployer] = await ethers.getSigners()
  const chainId = (await ethers.provider.getNetwork()).chainId
  const isMainnet = network.name === "polygon"

  console.log("═══════════════════════════════════════════════")
  console.log(" KAUS Token Deployment")
  console.log("═══════════════════════════════════════════════")
  console.log(` Network:        ${network.name} (${chainId})`)
  console.log(` Deployer:       ${deployer.address}`)
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log(` MATIC balance:  ${ethers.formatEther(balance)} MATIC`)

  // Wallet addresses
  const TREASURY      = process.env.TREASURY_ADDRESS      ?? ""
  const FEE_COLLECTOR = process.env.FEE_COLLECTOR_ADDRESS ?? ""

  if (!TREASURY || !FEE_COLLECTOR) {
    console.error("\n❌ Missing TREASURY_ADDRESS or FEE_COLLECTOR_ADDRESS in .env")
    process.exit(1)
  }

  console.log(` Treasury:       ${TREASURY}`)
  console.log(` Fee Collector:  ${FEE_COLLECTOR}`)
  console.log("═══════════════════════════════════════════════")

  if (isMainnet) {
    console.log("\n⚠️  MAINNET DEPLOYMENT — double check addresses!")
    console.log("Press Ctrl+C to cancel, waiting 5 seconds...")
    await new Promise(r => setTimeout(r, 5000))
  }

  // Deploy
  console.log("\n⟳ Deploying KAUSToken...")
  const KAUSToken = await ethers.getContractFactory("KAUSToken")
  const kaus = await KAUSToken.deploy(TREASURY, FEE_COLLECTOR)
  await kaus.waitForDeployment()

  const contractAddress = await kaus.getAddress()
  const txHash = kaus.deploymentTransaction()?.hash ?? ""

  console.log(`\n✓ Deployed!`)
  console.log(`  Contract:     ${contractAddress}`)
  console.log(`  TX:           ${txHash}`)
  console.log(`  Explorer:     https://${isMainnet ? "" : "amoy."}polygonscan.com/token/${contractAddress}`)

  // Verify tokenomics
  const [supply, maxSupply,,,,, genesis, priceUSDC] = await kaus.platformStats()
  console.log(`\n  Supply:       ${ethers.formatEther(supply)} / ${ethers.formatEther(maxSupply)} KAUS`)
  console.log(`  Price:        $${Number(priceUSDC) / 1_000_000} USDC`)
  console.log(`  Genesis:      ${genesis} / 999 sold`)

  // Save deployment
  const info = {
    contractAddress, txHash,
    network: network.name, chainId: chainId.toString(),
    deployer: deployer.address,
    treasury: TREASURY, feeCollector: FEE_COLLECTOR,
    tokenomics: {
      maxSupply: "100,000,000 KAUS",
      initialMint: "10,000,000 KAUS → Treasury",
      initialPrice: "$1.00 USDC",
      feeRate: "0.1%",
      burnShare: "50% of fees",
      holderShare: "30% → Genesis holders",
      opsShare: "20% → Field Nine",
      genesisPrice: "500 KAUS = $500",
      genesisMax: 999,
    },
    deployedAt: new Date().toISOString(),
  }

  const outPath = `./config/deployment-${network.name}.json`
  fs.mkdirSync("./config", { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(info, null, 2))
  console.log(`\n✓ Saved → ${outPath}`)

  // Polygonscan verification
  if (network.name !== "hardhat" && process.env.POLYGONSCAN_API_KEY) {
    console.log("\n⟳ Verifying on Polygonscan (30s delay)...")
    await new Promise(r => setTimeout(r, 30000))
    try {
      await run("verify:verify", { address: contractAddress, constructorArguments: [TREASURY, FEE_COLLECTOR] })
      console.log("✓ Verified on Polygonscan!")
    } catch (e: unknown) {
      console.log("⚠ Verification:", e instanceof Error ? e.message : String(e))
    }
  }

  console.log(`
═══════════════════════════════════════════════
 ✓ DEPLOYMENT COMPLETE
═══════════════════════════════════════════════
 Add to Vercel environment variables:

 NEXT_PUBLIC_KAUS_CONTRACT=${contractAddress}
 NEXT_PUBLIC_KAUS_PRICE_USDC=1.00
 NEXT_PUBLIC_CHAIN_ID=${chainId}
 NEXT_PUBLIC_POLYGON_RPC=https://polygon-rpc.com
═══════════════════════════════════════════════`)
}

main().catch(e => { console.error(e); process.exit(1) })
