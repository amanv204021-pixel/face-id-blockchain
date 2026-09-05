"""Blockchain anchoring service.

Default: LOCAL SIMULATED CHAIN — an honest, clearly-labeled in-memory/persisted
chain (blocks link via previous-block hash; tx hashes are SHA-256). Good enough
to demonstrate tamper-evidence without spending testnet funds.

LIVE MODE: if BLOCKCHAIN_RPC_URL + BLOCKCHAIN_PRIVATE_KEY + CONTRACT_ADDRESS
are configured and the `web3` package is installed, records are anchored by
calling FaceRecordAnchor.storeRecord on an EVM testnet (see /blockchain).
"""
import json
import logging
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.config import BLOCKCHAIN_PRIVATE_KEY, BLOCKCHAIN_RPC_URL, CHAIN_FILE, CONTRACT_ADDRESS, RECORDS_DIR
from app.services.hashing import sha256_bytes

log = logging.getLogger("chain")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _load_chain() -> list:
    if CHAIN_FILE.exists():
        return json.loads(CHAIN_FILE.read_text())
    return []


def _save_chain(blocks: list) -> None:
    CHAIN_FILE.write_text(json.dumps(blocks, indent=2))


def _make_w3() -> "Web3":
    """Provider factory — patchable in tests so the full web3 path can run
    against an in-process EVM (see blockchain/scripts/test_web3_path.py)."""
    from web3 import Web3
    return Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC_URL))


def _contract_abi() -> list:
    """Load the compiled contract ABI (artifacts from solc, or local copy)."""
    candidates = [
        RECORDS_DIR.parents[1] / "blockchain" / "artifacts" / "FaceRecordAnchor.json",
        Path(__file__).parents[1] / "contracts" / "FaceRecordAnchor.json",
    ]
    for p in candidates:
        if p.exists():
            data = json.loads(p.read_text())
            if data.get("abi"):
                return data["abi"]
    raise FileNotFoundError("FaceRecordAnchor ABI not found — run blockchain/scripts/compile.py")


def _web3_anchor(record_hash: str, source_hash: str) -> Optional[dict]:
    """Attempt anchoring on a real EVM chain. Returns None if unavailable."""
    try:
        from web3 import Web3  # heavy optional dependency
    except ImportError:
        return None
    try:
        w3 = _make_w3()
        acct = w3.eth.account.from_key(BLOCKCHAIN_PRIVATE_KEY)
        abi = _contract_abi()
        c = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)
        rh = bytes.fromhex(record_hash)
        sh = bytes.fromhex(source_hash)
        tx = c.functions.storeRecord(rh, sh, w3.eth.get_block("latest").timestamp).build_transaction({
            "from": acct.address, "nonce": w3.eth.get_transaction_count(acct.address),
            "gas": 200000, "maxFeePerGas": w3.to_wei(30, "gwei"), "maxPriorityFeePerGas": w3.to_wei(2, "gwei"),
            "chainId": w3.eth.chain_id,
        })
        signed = acct.sign_transaction(tx)
        sent = w3.eth.send_raw_transaction(signed.raw_transaction)
        rcpt = w3.eth.wait_for_transaction_receipt(sent, timeout=180)
        return {"tx_hash": sent.hex(), "block_number": rcpt.blockNumber,
                "network": f"EVM chainId {w3.eth.chain_id}", "simulated": False}
    except Exception as e:  # pragma: no cover
        log.warning("web3 anchoring failed, falling back to simulated chain: %s", e)
        return None


def anchor_record(record_hash: str, source_hash: str, record: dict) -> dict:
    """Anchor the (non-biometric) record hash. Returns anchor metadata."""
    live = _web3_anchor(record_hash, source_hash)
    if live is not None:
        tx_hash = "0x" + live["tx_hash"]
        ts = _now_iso()
    else:
        blocks = _load_chain()
        prev = blocks[-1]["block_hash"] if blocks else "0x" + "0" * 64
        nonce = secrets.token_hex(8)
        ts = _now_iso()
        payload = f"{record_hash}{source_hash}{ts}{nonce}{prev}"
        tx_hash = "0x" + sha256_bytes(payload.encode())
        block_hash = "0x" + sha256_bytes((tx_hash + prev + str(len(blocks))).encode())
        blocks.append({
            "block_number": len(blocks) + 1, "block_hash": block_hash, "tx_hash": tx_hash,
            "record_hash": record_hash, "source_hash": source_hash,
            "timestamp": ts, "previous_block_hash": prev, "status": "VERIFIED",
        })
        _save_chain(blocks)
        live = {"tx_hash": tx_hash, "block_number": len(blocks),
                "network": "local-simulated-chain (demo)", "simulated": True}
        tx_hash = "0x" + live["tx_hash"].removeprefix("0x") if False else live["tx_hash"]
    # Persist the canonical record so anyone can re-hash and compare later.
    (RECORDS_DIR / f"{live['tx_hash'].removeprefix('0x')}.json").write_text(
        json.dumps({"record": record, "record_hash": record_hash, "tx_hash": live["tx_hash"],
                    "anchored_at": ts}, indent=2))
    return {"status": "ok", "tx_hash": live["tx_hash"], "block_number": live["block_number"],
            "timestamp": ts, "network": live["network"], "simulated": live["simulated"],
            "explorer_note": ("Simulated chain — tamper-evidence logic identical to the "
                              "on-chain contract in /blockchain") if live["simulated"] else ""}


def get_record(tx_hash: str) -> Optional[dict]:
    p = RECORDS_DIR / f"{tx_hash.lower().removeprefix('0x')}.json"
    if not p.exists():
        return None
    return json.loads(p.read_text())


def verify_tx(tx_hash: str) -> dict:
    data = get_record(tx_hash)
    if data is None:
        return {"status": "NOT_FOUND", "tx_hash": tx_hash, "message":
                "Transaction not found in this demo chain. Run the pipeline first."}
    from app.services.hashing import hash_record
    stored = data["record_hash"]
    recomputed = hash_record(data["record"])
    verified = stored == recomputed
    return {
        "status": "VERIFIED" if verified else "HASH_MISMATCH",
        "tx_hash": data["tx_hash"],
        "stored_record_hash": stored,
        "recomputed_record_hash": recomputed,
        "record": data["record"],
        "message": ("Record integrity confirmed — no modification detected since anchoring."
                    if verified else
                    "⚠ HASH MISMATCH — the off-chain record was modified after anchoring. "
                    "Tamper-evidence triggered (this is the demo 'simulate tamper' path)."),
    }


def tamper_record(tx_hash: str) -> dict:
    """DEMO ONLY: mutate the stored off-chain record to demonstrate tamper-evidence."""
    data = get_record(tx_hash)
    if data is None:
        return {"status": "NOT_FOUND"}
    data["record"]["matchStatus"] = "TAMPERED"
    (RECORDS_DIR / f"{tx_hash.lower().removeprefix('0x')}.json").write_text(json.dumps(data, indent=2))
    return {"status": "TAMPERED", "message": "Off-chain record mutated. Run verify to see the mismatch."}


def restore_record(tx_hash: str) -> dict:
    data = get_record(tx_hash)
    if data is None:
        return {"status": "NOT_FOUND"}
    data["record"]["matchStatus"] = data["record"].get("matchStatus", "MATCH_FOUND")
    if data["record"]["matchStatus"] == "TAMPERED":
        data["record"]["matchStatus"] = "MATCH_FOUND"
    (RECORDS_DIR / f"{tx_hash.lower().removeprefix('0x')}.json").write_text(json.dumps(data, indent=2))
    return {"status": "RESTORED"}
