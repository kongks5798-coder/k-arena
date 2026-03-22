const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying KAUS with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");

  // Polygon USDC 주소 (네이티브 USDC)
  const POLYGON_USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
  const FEE_RECIPIENT = process.env.OWNER_WALLET || deployer.address;

  const KAUSToken = await ethers.getContractFactory("KAUSToken");
  const kaus = await KAUSToken.deploy(POLYGON_USDC, FEE_RECIPIENT);
  await kaus.waitForDeployment();

  const address = await kaus.getAddress();
  console.log("✅ KAUSToken deployed to:", address);
  console.log("Fee Recipient:", FEE_RECIPIENT);

  // .env에 저장
  const fs = require("fs");
  const envLine = `\nNEXT_PUBLIC_KAUS_CONTRACT=${address}\nNEXT_PUBLIC_KAUS_CHAIN_ID=137\n`;
  fs.appendFileSync(".env.local", envLine);
  console.log("📝 .env.local updated");
}

main().catch(console.error);
