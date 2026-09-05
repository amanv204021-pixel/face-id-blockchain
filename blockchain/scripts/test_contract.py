#!/usr/bin/env python3
"""End-to-end smart-contract test with ZERO external chain required.

Deploys the compiled FaceRecordAnchor bytecode to an in-process EVM
(eth-tester / py-evm via web3's EthereumTesterProvider), then asserts:
  1. storeRecord anchors a hash and emits RecordAnchored
  2. verifyRecord returns verified=True with the right source hash
  3. anchoring the same hash twice reverts ("already anchored")
  4. an unknown hash verifies as False

Run:  pip install web3 eth-tester py-evm  &&  python3 scripts/test_contract.py
(requires artifacts/FaceRecordAnchor.json — run scripts/compile.py first)
"""
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
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
    art = json.loads(ART.read_text())
    w3 = Web3(EthereumTesterProvider())
    acct = w3.eth.accounts[0]
    Contract = w3.eth.contract(abi=art["abi"], bytecode=art["bytecode"])
    tx = Contract.constructor().transact({"from": acct})
    rcpt = w3.eth.wait_for_transaction_receipt(tx)
    c = w3.eth.contract(address=rcpt.contractAddress, abi=art["abi"])
    print(f"deployed at {rcpt.contractAddress}")

    rh = w3.keccak(text="demo-record-1")
    sh = w3.keccak(text="demo-source-1")
    ts = w3.eth.get_block("latest").timestamp

    tx = c.functions.storeRecord(rh, sh, ts).transact({"from": acct})
    w3.eth.wait_for_transaction_receipt(tx)
    logs = c.events.RecordAnchored().get_logs(from_block=0)
    assert logs and logs[0]["args"]["recordHash"] == rh, "RecordAnchored event missing"
    print("✓ storeRecord anchored + RecordAnchored emitted")

    verified, got_sh, got_ts, _ = c.functions.verifyRecord(rh).call()
    assert verified and got_sh == sh, "verifyRecord mismatch"
    print("✓ verifyRecord returns verified=True + source hash")

    try:
        c.functions.storeRecord(rh, sh, ts).call({"from": acct})
        raise AssertionError("duplicate anchor did not revert")
    except Exception as e:
        assert "already anchored" in str(e), f"unexpected revert: {e}"
        print("✓ duplicate anchor reverts (already anchored)")

    unknown = w3.keccak(text="never-anchored")
    verified2, *_ = c.functions.verifyRecord(unknown).call()
    assert not verified2
    print("✓ unknown hash verifies as False")
    print("\nALL CONTRACT TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
