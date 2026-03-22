import { ethers } from 'ethers'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const RPC = 'https://polygon-bor-rpc.publicnode.com'
const PK = '0x8957160ca8e393972bb7478e3677f2b7baa1b2982a8ea637743c85a13c7a33e7'
const USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
const FEE_RECIPIENT = '0xeE9A00D4335DB2007386e861392059bE25F1D93C'

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC)
  const wallet = new ethers.Wallet(PK, provider)

  const balance = await provider.getBalance(wallet.address)
  console.log('Deployer:', wallet.address)
  console.log('Balance:', ethers.formatEther(balance), 'MATIC')

  // Read compiled artifact
  const artifactPath = resolve(__dirname, '../artifacts/contracts/KAUSTokenV2.sol/KAUSTokenV2.json')
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet)
  console.log('Deploying KAUSTokenV2...')

  const contract = await factory.deploy(USDC, FEE_RECIPIENT)
  console.log('Tx hash:', contract.deploymentTransaction().hash)
  console.log('Waiting for deployment...')
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('KAUSTokenV2 deployed to:', address)

  // Update .env.local
  const envPath = resolve(__dirname, '../../.env.local')
  let env = readFileSync(envPath, 'utf8')
  env = env.replace(/NEXT_PUBLIC_KAUS_CONTRACT=.*/g, `NEXT_PUBLIC_KAUS_CONTRACT=${address}`)
  writeFileSync(envPath, env)
  console.log('Updated .env.local with new contract address')

  return address
}

main().catch(err => {
  console.error('Deployment failed:', err)
  process.exit(1)
})
