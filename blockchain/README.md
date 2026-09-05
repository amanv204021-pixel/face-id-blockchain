# Blockchain — FaceRecordAnchor.sol

Stores ONLY record hashes (bytes32) + source hash + timestamp. Emits
`RecordAnchored(recordHash, sourceHash, timestamp, anchoredBy)`.

```bash
# compile + zero-setup test (in-process EVM)
pip install py-solc-x web3 eth-tester py-evm
python3 scripts/compile.py
python3 scripts/test_contract.py

# deploy to a testnet (needs `npm install ethers`)
RPC_URL=<rpc> PRIVATE_KEY=<test key> node scripts/deploy.js
RECORD_HASH=0x... CONTRACT_ADDRESS=0x... RPC_URL=<rpc> node scripts/verify.js
```

ABI lives in `artifacts/FaceRecordAnchor.json` (gitignored artifact —
regenerate with compile.py). Backend picks the contract up automatically when
BLOCKCHAIN_RPC_URL + BLOCKCHAIN_PRIVATE_KEY + CONTRACT_ADDRESS are set.
