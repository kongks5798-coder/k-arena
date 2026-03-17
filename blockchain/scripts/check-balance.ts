import { ethers } from "hardhat";
async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Address:", signer.address);
  const bal = await ethers.provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(bal), "POL");
}
main().catch(console.error);
