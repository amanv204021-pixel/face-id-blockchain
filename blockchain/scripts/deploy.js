/**
 * Deploy FaceRecordAnchor to an EVM testnet (or local node).
 *
 *   cd blockchain && npm install ethers
 *   RPC_URL=https://sepolia.infura.io/v3/<key> \
 *   PRIVATE_KEY=0x... \
 *   node scripts/deploy.js
 *
 * Reads compiled artifacts from ./artifacts/FaceRecordAnchor.json
 * (produced by scripts/compile.py — see README).
 * Prints the deployed address → set CONTRACT_ADDRESS in the backend .env.
 */
const fs = require('fs')
const path = require('path')

async function main() {
  let ethers
  try { ethers = require('ethers') } catch {
    console.error('Install ethers first:  npm install ethers')
    process.exit(1)
  }
  const { RPC_URL, PRIVATE_KEY } = process.env
  if (!RPC_URL || !PRIVATE_KEY) {
    console.error('Set RPC_URL and PRIVATE_KEY environment variables (use a TESTNET key!).')
    process.exit(1)
  }
  const artifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/FaceRecordAnchor.json'), 'utf8'))
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet)
  const contract = await factory.deploy()
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  console.log('✓ FaceRecordAnchor deployed at:', address)
  console.log('  Set this in backend/.env as CONTRACT_ADDRESS')
}
main().catch((e) => { console.error(e); process.exit(1) })
