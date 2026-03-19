import { ethers, network } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  const balance = await ethers.provider.getBalance(deployer.address)
  const chainId = (await ethers.provider.getNetwork()).chainId
  console.log("네트워크:", network.name, `(chainId ${chainId})`)
  console.log("주소:   ", deployer.address)
  console.log("잔액:   ", ethers.formatEther(balance), "POL")
  console.log("배포 가능:", Number(ethers.formatEther(balance)) > 0.01 ? "✅ 가능" : "❌ POL 부족")
}
main().catch(e => { console.error(e); process.exit(1) })
