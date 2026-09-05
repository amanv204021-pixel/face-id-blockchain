#!/usr/bin/env python3
"""Compile FaceRecordAnchor.sol with py-solc-x → artifacts/FaceRecordAnchor.json (abi + bytecode).

    pip install py-solc-x && python3 scripts/compile.py
"""
import json
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "artifacts"


def main() -> int:
    try:
        import solcx
    except ImportError:
        print("pip install py-solc-x first")
        return 1
    version = "0.8.20"
    if not solcx.get_installed_solc_versions():
        print(f"installing solc {version} …")
        solcx.install_solc(version)
    solcx.set_solc_version(version)
    src = (BASE / "contracts" / "FaceRecordAnchor.sol").read_text()
    compiled = solcx.compile_source(src, output_values=["abi", "bin"], optimize=True, optimize_runs=200)
    _, data = next(iter(compiled.items()))
    OUT.mkdir(exist_ok=True)
    (OUT / "FaceRecordAnchor.json").write_text(json.dumps(
        {"abi": data["abi"], "bytecode": "0x" + data["bin"]}, indent=2))
    print(f"✓ compiled → {OUT / 'FaceRecordAnchor.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
