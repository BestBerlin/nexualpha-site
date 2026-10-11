#!/usr/bin/env python3
import argparse
import json
import pathlib
import sys
from urllib.parse import urljoin


def main():
    parser = argparse.ArgumentParser(description="Capture Starter Path browser evidence.")
    parser.add_argument("--base-url", default="http://127.0.0.1:4173")
    parser.add_argument("--out", default="docs/evidence/starter-module/browser-screenshots")
    parser.add_argument("--paths", default="/starter,/starter/what-am-i-buying")
    parser.add_argument("--widths", default="390,768,1440")
    args = parser.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        print(json.dumps({
            "status": "fail",
            "reason": "python-playwright-unavailable",
            "error": str(exc),
        }, ensure_ascii=False))
        return 1

    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = [item.strip() for item in args.paths.split(",") if item.strip()]
    widths = [int(item.strip()) for item in args.widths.split(",") if item.strip()]
    results = []
    page_errors = []

    def launch_browser(playwright):
        errors = []
        for options in ({}, {"channel": "chrome"}, {"executable_path": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}):
            try:
                return playwright.chromium.launch(**options)
            except Exception as exc:
                errors.append({"options": options, "error": str(exc)})
        raise RuntimeError(json.dumps(errors, ensure_ascii=False))

    with sync_playwright() as p:
        browser = launch_browser(p)
        try:
            for path in paths:
                for width in widths:
                    page = browser.new_page(viewport={"width": width, "height": 1200}, device_scale_factor=1)
                    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
                    url = urljoin(args.base_url.rstrip("/") + "/", path.lstrip("/"))
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    page.wait_for_selector(".starter-page", timeout=15000)
                    overflow = page.evaluate("""
                        () => {
                          const viewportWidth = document.documentElement.clientWidth;
                          const bad = [];
                          for (const el of document.querySelectorAll('body *')) {
                            const box = el.getBoundingClientRect();
                            if (box.width > 24 && box.right > viewportWidth + 2) {
                              const style = getComputedStyle(el);
                              if (style.position !== 'fixed') {
                                bad.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`);
                              }
                            }
                          }
                          return bad.slice(0, 10);
                        }
                    """)
                    h1 = page.locator("h1").first.inner_text(timeout=15000)
                    text = page.locator("body").inner_text(timeout=15000)
                    safe_path = path.strip("/").replace("/", "__") or "home"
                    screenshot = out_dir / f"{safe_path}-{width}.png"
                    page.screenshot(path=str(screenshot), full_page=True)
                    row = {
                        "path": path,
                        "width": width,
                        "url": url,
                        "screenshot": str(screenshot),
                        "overflow": overflow,
                        "h1": h1,
                        "hasStarterCopy": ("Starter Path" in text) or ("新手村" in text),
                    }
                    if path.rstrip("/").endswith("what-am-i-buying") and width == widths[0]:
                        checklist_items = page.locator(".starter-checklist input")
                        for index in range(checklist_items.count()):
                            checklist_items.nth(index).check()
                        page.reload(wait_until="networkidle")
                        page.wait_for_selector(".starter-page", timeout=15000)
                        row["completionPersisted"] = "Level complete" in page.locator("body").inner_text(timeout=15000) or "这一关已完成" in page.locator("body").inner_text(timeout=15000)
                    results.append(row)
                    page.close()
        finally:
            browser.close()

    payload = {
        "status": "pass" if all(not row["overflow"] and row["hasStarterCopy"] and row.get("completionPersisted", True) for row in results) and not page_errors else "fail",
        "pageErrors": page_errors,
        "results": results,
    }
    (out_dir / "results.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False))
    return 0 if payload["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
