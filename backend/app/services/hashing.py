"""Cryptographic helpers — SHA-256 file/bytes hashing and canonical JSON hashing."""
import hashlib
import json


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical_json(record: dict) -> bytes:
    """Deterministic JSON encoding: sorted keys, no whitespace."""
    return json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def hash_record(record: dict) -> str:
    return sha256_bytes(canonical_json(record))
