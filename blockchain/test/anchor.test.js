/**
 * REAL contract test — deploys FaceRecordAnchor to an in-process EVM
 * (web3.py EthereumTesterProvider) from Python? No — this file uses ethers +
 * a local node. For a zero-setup test run `python3 ../scripts/test_contract.py`
 * which spins an in-process chain, deploys the compiled bytecode and asserts
 * store/verify/duplicate-revert behavior.
 *
 * If you run a local node (e.g. `anvil` or `hardhat node`):
 *   RPC_URL=http://127.0.0.1:8545 PRIVATE_KEY=<anvil key> node anchor.test.js
 */
const assert = require('assert')
async function main() {
  const { RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env
  assert(RPC_URL && PRIVATE_KEY && CONTRACT_ADDRESS, 'point this at a local node (anvil/hardhat) and a deployed CONTRACT_ADDRESS')
  const ethers = require('ethers')
  const artifact = require('../artifacts/FaceRecordAnchor.json')
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
  const c = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet)
  const rh = ethers.id('demo-record-1')
  const sh = ethers.id('demo-source-1')
  await (await c.storeRecord(rh, sh, Math.floor(Date.now() / 1000))).wait()
  const [verified] = await c.verifyRecord(rh)
  assert.ok(verified, 'record should verify')
  await assert.rejects(() => c.storeRecord(rh, sh, Math.floor(Date.now() / 1000)), /already anchored/)
  console.log('✓ anchor.test.js passed (store → verify → duplicate rejected)')
}
main().catch((e) => { console.error(e); process.exit(1) })
