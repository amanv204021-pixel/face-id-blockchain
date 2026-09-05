"""Slow-motion capture pass: runs the pipeline with ?speed=0.12 so every 3D
scene stays on screen long enough to be photographed under software WebGL.
Overwrites the per-stage screenshots with genuine frames.

Run:  python3 scripts/capture_stages.py
"""
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / "docs" / "screenshots"

# stage panel marker -> filename (panel appears while its scene renders)
MARKERS = [
    ("STAGE 02", "03-detect.png"),
    ("STAGE 03", "04-encode.png"),
    ("STAGE 04", "05-search.png"),
    ("STAGE 05", "06-match.png"),
    ("STAGE 06", "07-hash.png"),
    ("STAGE 07", "08-chain.png"),
    ("STAGE 08", "09-verified.png"),
]


def main() -> int:
    import urllib.request
    req = urllib.request.Request("http://localhost:5173/api/demo/reset-chain", method="POST")
    urllib.request.urlopen(req)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=[
            "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader-webgl",
            "--disable-gpu-sandbox", "--no-sandbox",
        ])
        page = browser.new_page(viewport={"width": 1180, "height": 720})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        page.goto("http://localhost:5173/?speed=0.12", wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        page.get_by_text("START VERIFICATION").click()
        page.wait_for_timeout(1200)
        page.get_by_text("RUN FULL PIPELINE").click()

        seen = set()
        deadline = time.time() + 600
        while time.time() < deadline and len(seen) < len(MARKERS):
            for marker, fname in MARKERS:
                if marker in seen:
                    continue
                try:
                    loc = page.get_by_text(marker, exact=False).first
                    if loc.is_visible():
                        page.wait_for_timeout(700)  # let the 3D scene settle
                        page.screenshot(path=str(SHOTS / fname))
                        seen.add(marker)
                        print(f"captured {fname} ({marker})")
                except Exception:
                    pass
            page.wait_for_timeout(300)

        try:
            page.wait_for_selector("text=VERIFICATION COMPLETE", timeout=60_000)
            page.wait_for_timeout(700)
            page.screenshot(path=str(SHOTS / "09b-finalbox.png"))
            print("captured 09b-finalbox")
        except Exception:
            print("final box missed")
        browser.close()
    print("errors:", len(errors))
    return 0 if len(seen) == len(MARKERS) else 1


if __name__ == "__main__":
    sys.exit(main())
