/**
 * Verify an anchored record on-chain:
 *   RECORD_HASH=0x... CONTRACT_ADDRESS=0x... RPC_URL=... node scripts/verify.js
 */
const fs = require('fs')
const path = require('path')

async function main() {
  let ethers
  try { ethers = require('ethers') } catch {
    console.error('Install ethers first:  npm install ethers')
    process.exit(1)
  }
  const { RPC_URL, CONTRACT_ADDRESS, RECORD_HASH } = process.env
  if (!RPC_URL || !CONTRACT_ADDRESS || !RECORD_HASH) {
    console.error('Set RPC_URL, CONTRACT_ADDRESS and RECORD_HASH.')
    process.exit(1)
  }
  const artifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/FaceRecordAnchor.json'), 'utf8'))
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, provider)
  const [verified, sourceHash, ts, by] = await contract.verifyRecord(RECORD_HASH)
  console.log({ verified, sourceHash, timestamp: Number(ts), anchoredBy: by })
}
main().catch((e) => { console.error(e); process.exit(1) })
