#!/usr/bin/env python3
"""Test the FULL live-web3 anchoring path in chain.py — no external node needed.

Monkeypatches chain._make_w3 to return an in-process EVM (eth-tester), deploys
FaceRecordAnchor, then calls chain.anchor_record() exactly as production would:
sign → send → wait for receipt → event → record persisted → verify_tx OK.
Also asserts the backend falls back to the simulated chain when web3 fails.

Run:  python3 scripts/test_web3_path.py   (needs artifacts from compile.py)
"""
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
BACKEND = BASE.parent / "backend"
sys.path.insert(0, str(BACKEND))

ART = BASE / "artifacts" / "FaceRecordAnchor.json"


def main() -> int:
    if not ART.exists():
        print("Run scripts/compile.py first.")
        return 1
    try:
        from web3 import EthereumTesterProvider, Web3
    except ImportError:
        print("pip install web3 eth-tester py-evm")
        return 1

    from app.services import chain as chain_svc

    art = json.loads(ART.read_text())

    # In-process chain; create our own key and fund it from a tester account.
    import os
    from eth_tester import EthereumTester
    tester = EthereumTester()
    w3 = Web3(EthereumTesterProvider(tester))
    tester_addr = tester.get_accounts()[0]
    acct = w3.eth.account.from_key("0x" + os.urandom(32).hex())
    tester.send_transaction({"from": tester_addr, "to": acct.address,
                             "value": w3.to_wei(10, "ether"), "gas": 21000,
                             "gas_price": int(w3.eth.gas_price) + 1})

    # Deploy
    Contract = w3.eth.contract(abi=art["abi"], bytecode=art["bytecode"])
    rcpt = w3.eth.wait_for_transaction_receipt(Contract.constructor().transact({"from": tester_addr}))
    print(f"in-process EVM · contract at {rcpt.contractAddress}")

    # Patch config + provider factory → production code path with test provider
    chain_svc.BLOCKCHAIN_RPC_URL = "in-process"
    chain_svc.BLOCKCHAIN_PRIVATE_KEY = acct.key.hex() if isinstance(acct.key, bytes) else str(acct.key)
    chain_svc.CONTRACT_ADDRESS = rcpt.contractAddress
    chain_svc._make_w3 = lambda: w3

    record = {"recordType": "FaceVerificationDemo", "imageHash": "ab" * 32, "matchStatus": "MATCH_FOUND",
              "similarity": 97.5, "timestamp": "2026-09-05T00:00:00+00:00", "pipelineVersion": "test"}
    from app.services.hashing import hash_record, sha256_bytes
    rh = hash_record(record)          # exactly what the production pipeline does
    sh = sha256_bytes(b"https://demo-index.local/fixtures/subject_repost_copy.jpg")

    res = chain_svc.anchor_record(rh, sh, record)
    assert not res["simulated"], "should have used the real web3 path"
    print(f"✓ anchor_record via web3: tx {res['tx_hash'][:18]}… block {res['block_number']} · {res['network']}")

    v = chain_svc.verify_tx(res["tx_hash"])
    assert v["status"] == "VERIFIED", v
    print("✓ verify_tx reads back VERIFIED on the web3-anchored record")

    # On-chain check with an independent contract read:
    c = w3.eth.contract(address=rcpt.contractAddress, abi=art["abi"])
    verified, got_sh, _, _ = c.functions.verifyRecord(bytes.fromhex(rh)).call()
    assert verified and got_sh == bytes.fromhex(sh)
    print("✓ independent verifyRecord() on-chain confirms hash + source")

    # Failure fallback: bad RPC → simulated chain
    chain_svc.BLOCKCHAIN_RPC_URL = "http://127.0.0.1:1"  # dead
    chain_svc._make_w3 = lambda: Web3(Web3.HTTPProvider("http://127.0.0.1:1"))
    sim = chain_svc.anchor_record("ff" * 32, "a2" * 32, record)
    assert sim["simulated"], "should fall back to simulated chain on RPC failure"
    print("✓ dead RPC → graceful fallback to simulated chain")

    print("\nWEB3 PATH TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
