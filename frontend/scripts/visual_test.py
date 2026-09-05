"""Headless visual end-to-end test: drives the REAL app in a real browser
(software WebGL), clicks through the entire pipeline and screenshots each
3D stage, while collecting any console/page errors.

Timing-robust: waits for actual UI state transitions (stage panel headers,
final verdict box) instead of fixed sleeps — tolerates slow software GL.

Run:  python3 scripts/visual_test.py   (backend + frontend must be running)
"""
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / "docs" / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

STAGES = ["STAGE 02", "STAGE 03", "STAGE 04", "STAGE 05", "STAGE 06", "STAGE 07", "STAGE 08"]
NAMES = {
    "STAGE 02": "03-detect.png", "STAGE 03": "04-encode.png", "STAGE 04": "05-search.png",
    "STAGE 05": "06-match.png", "STAGE 06": "07-hash.png", "STAGE 07": "08-chain.png",
    "STAGE 08": "09-verified.png",
}


def main() -> int:
    import urllib.request
    req = urllib.request.Request("http://localhost:5173/api/demo/reset-chain", method="POST")
    urllib.request.urlopen(req)
    errors: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=[
            "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader-webgl",
            "--disable-gpu-sandbox", "--no-sandbox",
        ])
        page = browser.new_page(viewport={"width": 1180, "height": 720})
        page.on("pageerror", lambda e: errors.append(f"PAGEERROR: {e}"))
        page.on("console", lambda m: errors.append(f"CONSOLE {m.type}: {m.text}") if m.type == "error" else None)

        t0 = time.time()
        page.goto("http://localhost:5173", wait_until="domcontentloaded")
        page.wait_for_timeout(5000)
        webgl = page.evaluate("() => { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }")
        print(f"WebGL available: {webgl}  (loaded in {time.time()-t0:.1f}s)")
        page.screenshot(path=str(SHOTS / "01-intro.png"))
        print("shot 01-intro")

        page.get_by_text("START VERIFICATION").click()
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOTS / "02-upload.png"))
        print("shot 02-upload")

        page.get_by_text("RUN FULL PIPELINE").click()

        # Screenshot each stage as its panel first appears (state-driven, not time-driven)
        seen = set()
        deadline = time.time() + 420  # generous for software GL
        while time.time() < deadline and len(seen) < len(STAGES):
            for marker in STAGES:
                if marker in seen:
                    continue
                loc = page.get_by_text(marker, exact=False).first
                try:
                    if loc.is_visible():
                        page.screenshot(path=str(SHOTS / NAMES[marker]))
                        seen.add(marker)
                        print(f"shot {NAMES[marker]}  ({marker} visible)")
                except Exception:
                    pass
            page.wait_for_timeout(400)

        # Final verdict box
        try:
            page.wait_for_selector("text=VERIFICATION COMPLETE", timeout=120_000)
            page.wait_for_timeout(800)
            page.screenshot(path=str(SHOTS / "09b-finalbox.png"))
            print("shot 09b-finalbox (VERIFICATION COMPLETE)")
        except Exception as e:
            print("final box not reached:", e.__class__.__name__)

        # Tamper-evidence flow
        try:
            page.get_by_text("simulate tampering").click(timeout=20_000)
            page.wait_for_selector("text=HASH MISMATCH", timeout=60_000)
            page.wait_for_timeout(600)
            page.screenshot(path=str(SHOTS / "10-tamper-mismatch.png"))
            print("shot 10-tamper-mismatch (HASH MISMATCH shown)")
            page.get_by_text("restore record").click(timeout=20_000)
            page.wait_for_timeout(2500)
        except Exception as e:
            print("tamper flow incomplete:", e.__class__.__name__)

        browser.close()

    print("\n--- console/page errors:", len(errors))
    for e in errors[:12]:
        print("  ", e[:220])
    return 0


if __name__ == "__main__":
    sys.exit(main())
