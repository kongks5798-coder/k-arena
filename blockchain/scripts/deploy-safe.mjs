import { ethers } from 'ethers'
import { writeFileSync, readFileSync } from 'fs'

const RPC = 'https://polygon-bor-rpc.publicnode.com'
const PK = '0x8957160ca8e393972bb7478e3677f2b7baa1b2982a8ea637743c85a13c7a33e7'
const OWNER = '0xeE9A00D4335DB2007386e861392059bE25F1D93C'
const KAUS = '0xfBfbb12E10f8b3418C278147F37507526670B247'

// Gnosis Safe factory on Polygon
const FACTORY = '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2'
const MASTER_COPY = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'

const FACTORY_ABI = [
  'function createProxy(address masterCopy, bytes memory data) returns (address proxy)',
  'event ProxyCreation(address proxy, address singleton)',
]

const SAFE_ABI = [
  'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver)',
]

// GnosisSafe setup calldata: 1-of-1 with OWNER as sole signer
function encodeSafeSetup(owner) {
  const iface = new ethers.Interface(SAFE_ABI)
  return iface.encodeFunctionData('setup', [
    [owner],       // owners
    1,             // threshold (1-of-1)
    ethers.ZeroAddress, // to (no delegatecall)
    '0x',          // data
    ethers.ZeroAddress, // fallbackHandler
    ethers.ZeroAddress, // paymentToken
    0,             // payment
    ethers.ZeroAddress, // paymentReceiver
  ])
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC)
  const wallet = new ethers.Wallet(PK, provider)

  const balance = await provider.getBalance(wallet.address)
  console.log(`Wallet: ${wallet.address}`)
  console.log(`Balance: ${ethers.formatEther(balance)} MATIC`)

  if (balance === 0n) {
    throw new Error('Wallet has no MATIC for gas. Please fund the wallet first.')
  }

  console.log('\n[1/2] Deploying Gnosis Safe...')
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, wallet)
  const setupData = encodeSafeSetup(OWNER)

  // Use explicit gas settings to avoid replacement underpriced errors
  const feeData = await provider.getFeeData()
  const maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas * 2n : ethers.parseUnits('300', 'gwei')
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 2n : ethers.parseUnits('40', 'gwei')
  console.log(`Gas: maxFee=${ethers.formatUnits(maxFeePerGas, 'gwei')} gwei, priority=${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`)

  const tx = await factory.createProxy(MASTER_COPY, setupData, {
    maxFeePerGas,
    maxPriorityFeePerGas,
  })
  console.log('TX submitted:', tx.hash)
  const receipt = await tx.wait()
  console.log('TX confirmed in block:', receipt.blockNumber)

  // Parse ProxyCreation event
  // Topic: 0x4f51faf6c4561ff95f067657e43439f0f856d97c04d9ec9070a6199ad418e235
  // ProxyCreation(address proxy, address singleton)
  // proxy address is in data[0..32] (first 32 bytes = 12 zero padding + 20 byte address)
  const proxyCreationTopic = ethers.id('ProxyCreation(address,address)')
  const event = receipt.logs.find(l => l.topics[0] === proxyCreationTopic)

  let safeAddress
  if (event) {
    // proxy address is first param in data (ABI-encoded address = 32 bytes, last 20 are the address)
    safeAddress = ethers.getAddress('0x' + event.data.slice(26, 66))
  } else {
    // Fallback: The Safe proxy address is the address field of log emitted by the proxy itself (first log)
    if (receipt.logs.length > 0) {
      safeAddress = ethers.getAddress(receipt.logs[0].address)
      console.log('ProxyCreation event topic not matched, using log[0].address as fallback:', safeAddress)
    } else {
      console.log('All logs:', JSON.stringify(receipt.logs.map(l => ({ topics: l.topics, address: l.address })), null, 2))
      throw new Error('Could not find Safe address in receipt')
    }
  }

  console.log('✅ Gnosis Safe deployed:', safeAddress)
  console.log('   TX: https://polygonscan.com/tx/' + tx.hash)

  // Transfer KAUSToken ownership to Safe
  console.log('\n[2/2] Transferring KAUSToken ownership to Safe...')
  const kaus = new ethers.Contract(KAUS, ['function transferOwnership(address newOwner)'], wallet)
  const tx2 = await kaus.transferOwnership(safeAddress)
  console.log('TX submitted:', tx2.hash)
  await tx2.wait()
  console.log('✅ Ownership transferred to Safe.')
  console.log('   TX: https://polygonscan.com/tx/' + tx2.hash)

  // Update .env.local
  const envPath = '../../.env.local'
  try {
    let env = readFileSync(envPath, 'utf8')
    if (!env.includes('GNOSIS_SAFE_ADDRESS')) {
      env += `\nGNOSIS_SAFE_ADDRESS=${safeAddress}\n`
      writeFileSync(envPath, env)
      console.log('\nUpdated .env.local with GNOSIS_SAFE_ADDRESS')
    } else {
      // Update existing value
      env = env.replace(/GNOSIS_SAFE_ADDRESS=.*/, `GNOSIS_SAFE_ADDRESS=${safeAddress}`)
      writeFileSync(envPath, env)
      console.log('\nUpdated existing GNOSIS_SAFE_ADDRESS in .env.local')
    }
  } catch (e) {
    console.warn('Could not update .env.local:', e.message)
  }

  console.log('\n========================================')
  console.log('SUMMARY')
  console.log('========================================')
  console.log('Gnosis Safe Address:', safeAddress)
  console.log('Owner:              ', OWNER)
  console.log('KAUS Contract:      ', KAUS)
  console.log('Deploy TX:          ', 'https://polygonscan.com/tx/' + tx.hash)
  console.log('Transfer TX:        ', 'https://polygonscan.com/tx/' + tx2.hash)
  console.log('========================================')

  return safeAddress
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
