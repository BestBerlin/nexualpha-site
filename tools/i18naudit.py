#!/usr/bin/env python3
"""i18naudit.py BASE_URL [locales,comma] [paths,comma]
Flags visible text nodes that are plain English in non-English locales."""
import asyncio, sys, re
from playwright.async_api import async_playwright
BASE = sys.argv[1].rstrip('/')
PFX = {'en':'','zh-Hans':'/zh-hans','zh-Hant':'/zh-hant','ja':'/ja','ko':'/ko','tr':'/tr','fr':'/fr','de':'/de','es':'/es','pt-BR':'/pt-br','ru':'/ru','ar':'/ar','id':'/id-id','vi':'/vi','it':'/it'}
LOCS = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else [l for l in PFX if l != 'en']
PATHS = sys.argv[3].split(',') if len(sys.argv) > 3 else ['/', '/exchanges', '/exchanges/binance', '/compare/binance-vs-okx', '/br']  # country routes (/br,/mx,...) are audited only under their own locale, unprefixed
STOP = set('''the and for with from your you our are not all any can how what why when where which who this that these those
verified verify verification crypto platforms platform directory venues venue flagship zero custody spot margin futures perps perp
fees fee maker taker open register account offer eligibility shortlist funding deposit withdrawal withdrawals method methods
compare comparison compared review reviews reviewed official source sources updates update latest news read more view show hide
fewer less full disclosure related research continue jump filter filters sort search clear reset apply selected select all
region regions product products support supported supports available availability pending checked check cost costs rate rates
route finder pick start get started learn guide guides trading trade traders exchange exchanges evidence only first before after
without into onto over under between via best top high low new old free paid fast faster slow cheaper cheapest
choose chooses choice choices decide decision need needs want wants match matches matchup matchups popular preview step steps
next back previous page pages list lists table tables row rows column columns total count counts live data last days day week
month year years today now status active inactive key keys proof proofs risk risks notes note summary details detail overview
sign login log out join create contact about terms privacy policy methodology disclosure disclosures affiliate referral
link links code codes bonus bonuses reward rewards discount discounts save saves saving savings lifetime rebate rebates
market markets pairs pair coin coins token tokens asset assets wallet wallets security safe safer safety audit audits
cold storage reserve reserves compliance license licensed licence regulated regulation regulatory country countries
unavailable restricted local currency currencies bank transfer card payment payments instant
wins win lose better worse than then there here also just like make made makes see sees seen use used uses using
finish done complete completed copy copied share shared download downloads upload
shown shows showing hidden visible add added remove removed edit saved result results found none
sure confirm lookalike domain domains url phishing scam scams bookmark bookmarks
'''.split())
AMBIG = set('open all one pro per via top new low high not spot perps perp futures route platform platforms code region risk margin funding domain proof proofs reserve reserves maker taker wallet token tokens fiat center centre copy trading contact reset referral coin directory guides guide assets asset affiliate details detail shortlist account status cex dex support'.split())  # loanwords that are also valid in fr/de/es/it/id/vi/pt
LATIN_LOAN = re.compile(r'\b(spot|perps?|funding|eligibility|maker|taker|futures|copy trading|shortlist)\b', re.I)
DOMAIN = re.compile(r'\b[\w-]+\.(?:com|io|exchange|trade|xyz|org|net|finance|app)\b', re.I)
NONLATIN = {'zh-Hans','zh-Hant','ja','ko','ru','ar'}
COUNTRY = {'/br':'pt-BR','/mx':'es','/tw':'zh-Hant','/hk':'zh-Hant','/jp':'ja','/kr':'ko','/vn':'vi','/id':'id'}
WORD = re.compile(r"[A-Za-z][A-Za-z'’]+")
JS = '''()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
while(n=w.nextNode()){const p=n.parentElement;if(!p)continue;const tg=p.tagName;if(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE'].includes(tg))continue;
if(p.closest('[lang="en"]'))continue;const cs=getComputedStyle(p);if(cs.display==='none'||cs.visibility==='hidden')continue;const r=p.getBoundingClientRect();if(r.width===0&&r.height===0)continue;
const t=n.textContent.replace(/\\s+/g,' ').trim();if(t)out.push(t)}return out}'''
def english(t):
    t = DOMAIN.sub(' ', t)
    words = [w for w in WORD.findall(t) if not w.isupper() and w.lower() not in ('pix','binance','okx','bybit','telegram','bitget','kraken','coinbase','bnb','vip','usdc','kyc')]
    if not words: return False
    stops = [w for w in words if w.lower() in STOP and w.lower() not in AMBIG]
    if not stops: return False
    return len(stops) >= len(words) * 0.5 and (len(stops) >= 2 or len(words) <= 3 or len(stops) / len(words) >= .6)
async def main():
    total = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        for loc in LOCS:
            seen = {}
            for path in PATHS:
                if path in COUNTRY and COUNTRY[path] != loc: continue
                url = BASE + (path if path in COUNTRY else PFX[loc] + ('' if path == '/' and PFX[loc] else path))
                try:
                    await pg.goto(url, wait_until='networkidle', timeout=60000); await pg.wait_for_timeout(1200)
                    h = await pg.evaluate('document.body.scrollHeight')
                    for y in range(0, h, 900):
                        await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(60)
                    await pg.wait_for_timeout(500)
                    texts = await pg.evaluate(JS)
                except Exception as e:
                    print(f'[{loc}] {path} ERROR {e}'); continue
                for t in dict.fromkeys(texts):
                    if english(t): seen.setdefault(t, []).append(path)
                    elif loc in NONLATIN and LATIN_LOAN.search(DOMAIN.sub(' ', t)) and re.search(r'[^\x00-\x7f]', t): seen.setdefault('[mixed] ' + t, []).append(path)
            print(f'== {loc}: {len(seen)} flagged')
            for t, ps in seen.items(): print(f'   {t[:140]!r}  @ {",".join(ps)}')
            total += len(seen)
        await b.close()
    print('TOTAL flagged:', total)
asyncio.run(main())
