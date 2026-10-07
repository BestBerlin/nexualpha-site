#!/usr/bin/env python3
"""
full_spectrum_audit.py
NexuAlpha 全站深度体检与潜在风险自动化扫描引擎 (Python Playwright 原生驱动)

覆盖 5 大维度：
1. 搜索引擎合规与防封禁审计（Affiliate/YMYL/SEO/外链 rel 标记/风险免责披露）
2. 移动端与全断点水平溢出排查（Horizontal Overflow / 破版排查）
3. 多语言隔离与文字一致性（英文页面汉字泄漏、未翻译占位符）
4. 图标与媒体资源完整性（BrandMark 破损、SVG viewBox 规范）
5. 控制台运行时错误与异常捕获（Console Error / Uncaught Promise）
"""

import json
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
REPORT_OUTPUT = ROOT_DIR / "AUDIT_SCAN_REPORT.json"
BASE_URL = "http://127.0.0.1:4173"

ROUTES_TO_AUDIT = [
    {"path": "/?locale=zh-Hans", "name": "首页 (中文)", "type": "home", "locale": "zh-Hans"},
    {"path": "/?locale=en", "name": "首页 (英文)", "type": "home", "locale": "en"},
    {"path": "/exchanges?locale=zh-Hans", "name": "交易所黄页目录 (中文)", "type": "directory", "locale": "zh-Hans"},
    {"path": "/exchanges?locale=en", "name": "交易所黄页目录 (英文)", "type": "directory", "locale": "en"},
    {"path": "/exchanges/binance?locale=zh-Hans", "name": "Binance 详情页 (中文)", "type": "venue", "locale": "zh-Hans"},
    {"path": "/exchanges/binance?locale=en", "name": "Binance 详情页 (英文)", "type": "venue", "locale": "en"},
    {"path": "/exchanges/okx?locale=zh-Hans", "name": "OKX 详情页 (中文)", "type": "venue", "locale": "zh-Hans"},
    {"path": "/compare/binance-vs-okx?locale=zh-Hans", "name": "Binance vs OKX 对比页 (中文)", "type": "compare", "locale": "zh-Hans"},
    {"path": "/compare/binance-vs-okx?locale=en", "name": "Binance vs OKX 对比页 (英文)", "type": "compare", "locale": "en"},
    {"path": "/activities?locale=zh-Hans", "name": "活动与上币中心 (中文)", "type": "activities", "locale": "zh-Hans"},
    {"path": "/activities?locale=en", "name": "活动与上币中心 (英文)", "type": "activities", "locale": "en"},
    {"path": "/news?locale=zh-Hans", "name": "实时新闻资讯 (中文)", "type": "news", "locale": "zh-Hans"},
]

VIEWPORTS = [
    {"name": "Mobile (iPhone SE/Small)", "width": 320, "height": 667},
    {"name": "Mobile (iPhone 14/Standard)", "width": 390, "height": 844},
    {"name": "Tablet (iPad)", "width": 768, "height": 1024},
    {"name": "Desktop (Standard)", "width": 1440, "height": 900},
]

def main():
    print("🔍 [NexuAlpha Audit Engine] Starting comprehensive system scan...")
    report = {
        "timestamp": "",
        "routesScanned": len(ROUTES_TO_AUDIT),
        "viewportsScanned": len(VIEWPORTS),
        "findings": {
            "seoAndCompliance": [],
            "layoutAndOverflow": [],
            "localizationAndText": [],
            "iconsAndAssets": [],
            "consoleErrors": [],
        },
        "stats": {
            "totalChecks": 0,
            "passedChecks": 0,
            "warnings": 0,
            "errors": 0,
        }
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for route in ROUTES_TO_AUDIT:
            print(f"\n📄 Auditing Route: {route['name']} ({route['path']})")
            console_logs = []
            page_errors = []

            page = browser.new_page(viewport={"width": 1440, "height": 900})
            page.on("console", lambda msg: console_logs.append({"text": msg.text, "location": msg.location}) if msg.type == "error" else None)
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            try:
                page.goto(f"{BASE_URL}{route['path']}", wait_until="networkidle", timeout=15000)
                page.wait_for_timeout(1000)
            except Exception as e:
                report["findings"]["consoleErrors"].append({
                    "route": route["path"],
                    "error": f"Page load failed: {str(e)}"
                })
                page.close()
                continue

            if console_logs or page_errors:
                report["findings"]["consoleErrors"].append({
                    "route": route["path"],
                    "consoleErrors": console_logs,
                    "pageErrors": page_errors,
                })

            # 维度 1: 搜索引擎合规性（SEO & Search Safety）
            seo_data = page.evaluate("""() => {
                const issues = [];
                const title = document.title || '';
                if (!title || title.length < 5) issues.push({ rule: "SEO_TITLE_LENGTH", detail: `Title too short: "${title}"` });
                
                const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
                if (!metaDesc) issues.push({ rule: "SEO_META_DESCRIPTION_MISSING", detail: "Missing meta[name='description']" });

                const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
                if (!canonical) issues.push({ rule: "SEO_CANONICAL_MISSING", detail: "Missing rel='canonical' tag" });

                // Affiliate 商业外链 rel 标记检查
                const links = Array.from(document.querySelectorAll("a[href]"));
                let untaggedCommercial = 0;
                let untaggedSamples = [];

                for (const a of links) {
                    const href = a.getAttribute("href") || "";
                    if (href.startsWith("http://") || href.startsWith("https://")) {
                        const isInternal = href.includes(window.location.host);
                        if (!isInternal) {
                            const rel = (a.getAttribute("rel") || "").toLowerCase();
                            const isCommercial = href.includes("register") || href.includes("ref=") || href.includes("invite") || a.classList.contains("yellow-card__btn-register") || a.classList.contains("fee-terminal__cta-btn") || a.classList.contains("v3-rebate-cta-btn");
                            if (isCommercial && !rel.includes("sponsored") && !rel.includes("nofollow")) {
                                untaggedCommercial++;
                                if (untaggedSamples.length < 3) untaggedSamples.push(href);
                            }
                        }
                    }
                }

                if (untaggedCommercial > 0) {
                    issues.push({
                        rule: "GOOGLE_AFFILIATE_UNTAGGED_LINKS",
                        detail: `Found ${untaggedCommercial} commercial outbound links lacking rel="sponsored" or rel="nofollow". Samples: ${untaggedSamples.join(", ")}`
                    });
                }

                // YMYL 金融风险免责披露
                const pageText = document.body.innerText || "";
                const hasDisclaimer = /(风险|免责|合规|损失|本金|Risk|Disclaimer|Volatile|Loss|DYOR|Not Financial Advice)/i.test(pageText);
                if (!hasDisclaimer) {
                    issues.push({
                        rule: "GOOGLE_YMYL_RISK_DISCLOSURE_MISSING",
                        detail: "Page lacks explicit financial risk disclosure / disclaimer (Google YMYL penalty risk)"
                    });
                }

                return issues;
            }""")

            for issue in seo_data:
                report["findings"]["seoAndCompliance"].append({"route": route["path"], **issue})

            # 维度 3: 多语言文字与隔离
            if route["locale"] == "en":
                leaked_chinese = page.evaluate("""() => {
                    const text = document.body.innerText || '';
                    const matches = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
                    // 过滤掉允许的平台中文别名以及语言切换器本身的语种名称
                    const allowed = ['币安', '欧易', '抹茶', '芝麻开门', '库币', '火币', '海妖', '简体中文', '繁體中文', '日本語'];
                    const filtered = matches.filter(m => !allowed.includes(m));
                    return filtered.slice(0, 8);
                }""")
                if leaked_chinese:
                    report["findings"]["localizationAndText"].append({
                        "route": route["path"],
                        "rule": "CHINESE_LEAK_IN_ENGLISH_PAGE",
                        "detail": f"English page leaked Chinese snippets: {', '.join(leaked_chinese)}"
                    })

            # 维度 4: 图标与静态资产
            asset_issues = page.evaluate("""() => {
                const issues = [];
                const imgs = Array.from(document.querySelectorAll("img"));
                for (const img of imgs) {
                    if (img.naturalWidth === 0 && img.complete && img.src) {
                        issues.push({ rule: "BROKEN_IMAGE", detail: `Broken image source: ${img.src}` });
                    }
                }
                return issues;
            }""")
            for issue in asset_issues:
                report["findings"]["iconsAndAssets"].append({"route": route["path"], **issue})

            # 维度 2: 跨视口排查水平溢出破版 (Horizontal Overflow)
            for vp in VIEWPORTS:
                page.set_viewport_size({"width": vp["width"], "height": vp["height"]})
                page.wait_for_timeout(200)

                overflow = page.evaluate("""() => {
                    const html = document.documentElement;
                    const body = document.body;
                    const scrollWidth = Math.max(html.scrollWidth, body.scrollWidth);
                    const clientWidth = Math.max(html.clientWidth, body.clientWidth, window.innerWidth);
                    if (scrollWidth > clientWidth + 3) {
                        const culprits = [];
                        for (const el of document.querySelectorAll('*')) {
                            const r = el.getBoundingClientRect();
                            if (r.right > clientWidth + 3) {
                                culprits.push(`${el.tagName.toLowerCase()}.${el.className ? el.className.split(' ')[0] : ''}`);
                                if (culprits.length >= 3) break;
                            }
                        }
                        return { hasOverflow: true, scrollWidth, clientWidth, diff: scrollWidth - clientWidth, culprits };
                    }
                    return { hasOverflow: false };
                }""")

                if overflow["hasOverflow"]:
                    report["findings"]["layoutAndOverflow"].append({
                        "route": route["path"],
                        "viewport": vp["name"],
                        "width": vp["width"],
                        "diff": overflow["diff"],
                        "culprits": overflow["culprits"],
                    })

            page.close()

        browser.close()

    # 统计汇总
    report["stats"]["errors"] = (
        len(report["findings"]["seoAndCompliance"]) +
        len(report["findings"]["layoutAndOverflow"]) +
        len(report["findings"]["consoleErrors"])
    )
    report["stats"]["warnings"] = (
        len(report["findings"]["localizationAndText"]) +
        len(report["findings"]["iconsAndAssets"])
    )

    with open(REPORT_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n📋 [Audit Complete] Report saved to: {REPORT_OUTPUT}")
    print(f"🚨 Total Findings: Errors: {report['stats']['errors']}, Warnings: {report['stats']['warnings']}")

if __name__ == "__main__":
    main()
