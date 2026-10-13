#!/usr/bin/env python3
"""Read-only local browser QA of the built beginner path; no external signup is opened."""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get('QA_ORIGIN', 'http://127.0.0.1:4189')
OUT = Path(__file__).resolve().parents[2] / '.beginner-evidence'
COPY = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'beginner-copy'
PREFIX = {'en': '', 'zh-Hans': '/zh-hans', 'zh-Hant': '/zh-hant', 'id': '/id-id', 'pt-BR': '/pt-br', 'uk': '/uk-ua'}
NEUTRAL = {'ru', 'ar', 'zh-Hant', 'ur', 'uk', 'vi'}

async def main():
    OUT.mkdir(exist_ok=True)
    rows = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(reduced_motion='reduce')
        page = await context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for file in sorted(COPY.glob('*.json')):
            copy = json.loads(file.read_text())
            locale = copy['locale']
            prefix = PREFIX.get(locale, '/' + locale)
            for width in [390, 768, 1440]:
                await page.set_viewport_size({'width': width, 'height': 900})
                for kind in ['start', 'questions', 'check']:
                    path = prefix + '/' + copy['slug'][kind]
                    response = await page.goto(BASE + path, wait_until='networkidle')
                    await page.locator('main.nxb').wait_for()
                    # Force hydration without opening any outbound entry.
                    if kind in ['start', 'check']:
                        await page.locator('main.nxb select').select_option('TR' if locale == 'tr' else 'BR')
                    await page.wait_for_timeout(150)
                    main = page.locator('main.nxb')
                    overflow = await main.evaluate('(el) => el.getBoundingClientRect().right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1')
                    assert response.status == 200, (path, response.status)
                    assert await main.locator('h1').count() == 1, path
                    assert not overflow, (path, width, 'overflow')
                    if kind == 'questions':
                        assert await main.locator('article[id^="q-"]').count() == 50, path
                    if locale in NEUTRAL:
                        assert await main.locator('a[href^="/go/"]').count() == 0, path
                        assert await main.locator('code').count() == 0, path
                    rows.append({'path': path, 'locale': locale, 'width': width, 'status': response.status, 'overflow': overflow})
                    if locale == 'en' and kind == 'start' or locale in {'ar', 'ur'} and kind == 'check' and width == 390:
                        await page.screenshot(path=str(OUT / f'{locale}-{kind}-{width}.png'), full_page=True)
        await page.set_viewport_size({'width': 390, 'height': 900})
        await page.goto(BASE + '/start?market=BR', wait_until='networkidle')
        await page.locator('main.nxb select').select_option('TR')
        await page.locator('main.nxb .nxb-choice h2').filter(has_text='OKX').wait_for()
        assert await page.locator('main.nxb .nxb-choice h2').inner_text() == 'OKX'
        await page.locator('main.nxb a[href^="/start/2"]').click()
        await page.locator('main.nxb').wait_for()
        assert 'market=TR' in page.url
        await page.wait_for_timeout(300)
        signup = page.locator('main.nxb a[data-cta-kind="registration"]')
        assert (await signup.get_attribute('href')).startswith('/go/okx?')
        assert 'market=TR' in await signup.get_attribute('href')
        assert await page.locator('main.nxb a[href^="/go/bitget"]').count() == 0
        await page.get_by_role('button', name='Complete', exact=False).click()
        assert await page.locator('main.nxb progress').get_attribute('value') == '1'
        await page.reload(wait_until='networkidle')
        await page.get_by_role('button', name='Reset', exact=True).click()
        assert await page.locator('main.nxb progress').get_attribute('value') == '0'
        await page.goto(BASE + '/check?market=BR', wait_until='networkidle')
        for href, expected in [('https://www.binance.com/', 'Domain matches'), ('https://binance.com.evil.test/', 'Do not use'), ('https://example.org/', 'Unknown')]:
            await page.locator('#nxb-url').fill(href)
            await page.get_by_role('button', name='Check link', exact=True).click()
            await page.locator('main.nxb [role="status"]').filter(has_text=expected).wait_for()
        await page.goto(BASE + '/funding-rates', wait_until='networkidle')
        tip = page.locator('h1 .nx-glossary-tip a')
        await tip.focus()
        assert await page.locator('h1 .nx-glossary-tip [role="tooltip"]').is_visible()
        assert await tip.get_attribute('aria-describedby')
        assert not errors, errors
        await browser.close()
    result = {'status': 'PASS', 'profiles': len(rows), 'pageErrors': errors, 'rows': rows,
              'interactions': ['country choice', 'country survives step navigation and hydration', 'coded OKX route in Türkiye', 'device-local progress', 'progress reset', 'valid/spoof/unknown checker', 'keyboard glossary tooltip']}
    (OUT / 'browser-qa.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps({k: v for k, v in result.items() if k != 'rows'}, ensure_ascii=False))

asyncio.run(main())
