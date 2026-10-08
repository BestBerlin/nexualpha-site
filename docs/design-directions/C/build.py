# generates three self-contained single-file pages from one source of tokens
CSS = r"""
:root{
  --paper:#F1ECE2; --ink:#161412; --tomato:#E5381F; --paper-2:#E7E0D2;
  --f-display:'Archivo','Inter Display','DejaVu Sans Condensed','Helvetica Neue',sans-serif;
  --f-mono:'IBM Plex Mono','DejaVu Sans Mono',ui-monospace,monospace;
  --t0:12px; --t1:15px; --t2:20px; --t3:32px; --t4:64px; --t5:120px; --t6:240px;
  --gut:24px; --pad:48px;
}
@media (max-width:760px){:root{--t3:24px;--t4:44px;--t5:60px;--t6:136px;--gut:16px;--pad:16px}}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--paper)}
body{background:var(--paper);color:var(--ink);font:400 var(--t1)/24px var(--f-display);font-stretch:100%;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}
.wrap{max-width:1440px;margin:0 auto;padding:0 var(--pad)}
.g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gut)}
.lab{font:500 var(--t0)/16px var(--f-mono);text-transform:uppercase;letter-spacing:.08em}
.disp{font-family:var(--f-display);font-weight:800;font-stretch:62%;text-transform:uppercase;letter-spacing:-.01em;line-height:.86}
.rule{border-top:8px solid var(--ink)}
.rule-t{border-top:2px solid var(--ink)}
.red{background:var(--tomato);color:var(--ink)}
.ink{background:var(--ink);color:var(--paper)}
/* nav */
.nav{display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{font-weight:900;font-stretch:62%;font-size:var(--t3);line-height:32px;text-transform:uppercase;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
.logo i{display:inline-block;width:20px;height:20px;background:var(--tomato);border-radius:50%}
.nav ul{display:flex;gap:32px;list-style:none}
.nav a{border-bottom:2px solid transparent;padding-bottom:2px}
.nav a.on,.nav a:hover{border-color:var(--ink)}
@media(max-width:760px){.nav ul{gap:16px}.nav li:nth-child(n+3){display:none}}
/* buttons */
.cta{display:inline-flex;align-items:center;justify-content:space-between;gap:16px;height:48px;padding:0 16px;background:var(--ink);color:var(--paper);font:500 var(--t0)/16px var(--f-mono);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
.cta:hover{background:var(--tomato);color:var(--ink)}
.cta.on-red{background:var(--ink);color:var(--paper)}
.cta.ghost{background:transparent;color:var(--ink);border:2px solid var(--ink)}
.cta.paper{background:var(--paper);color:var(--ink)}
/* hero */
.hero{padding-top:48px}
.hero .h1{grid-column:1/10;font-size:var(--t5);padding-bottom:40px}
.hero .h1 em{font-style:normal;color:var(--tomato)}
.hero .side{grid-column:10/13;grid-row:1/3;align-self:stretch;padding:24px;display:flex;flex-direction:column;justify-content:space-between;min-height:480px;margin-bottom:48px}
.side .big{font-size:var(--t6);line-height:.8;font-weight:900;font-stretch:62%;letter-spacing:-.02em}
.side p{font-weight:600;font-size:var(--t2);line-height:28px}
.hero .lead{grid-column:1/7;font-size:var(--t2);line-height:28px;padding-bottom:48px}
.hero .meta{grid-column:7/10;padding-bottom:48px;align-self:end}
.hero .meta li{list-style:none;display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid var(--ink)}
@media(max-width:760px){
 .hero{padding-top:24px}
 .hero .h1,.hero .lead,.hero .meta{grid-column:1/13}
 .hero .side{grid-column:1/13;grid-row:auto;min-height:0;margin:0 0 32px;flex-direction:row;align-items:flex-end;gap:16px}
 .hero .h1{padding-bottom:24px}.hero .lead{padding-bottom:24px}.hero .meta{padding-bottom:32px}
 .side p{font-size:var(--t1);line-height:20px;max-width:140px}
}
/* list */
.lh{padding:12px 0;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gut)}
.lh span:nth-child(1){grid-column:1/2}.lh span:nth-child(2){grid-column:2/6}.lh span:nth-child(3){grid-column:6/9}.lh span:nth-child(4){grid-column:9/13}
@media(max-width:760px){.lh span:nth-child(n+3){display:none}.lh span:nth-child(2){grid-column:2/13}}
.row{border-top:2px solid var(--ink);padding:24px 0 28px;grid-template-areas:"idx nm nm nm nm fee fee fee act act act act" ". vd vd vd vd vd vd vd act act act act";row-gap:8px;align-items:start}
.row:hover{background:var(--paper-2)}
.row .idx{grid-area:idx;padding-top:12px}
.row .nm{grid-area:nm;font-size:var(--t4);font-weight:800;font-stretch:62%;line-height:.9;text-transform:uppercase;letter-spacing:-.01em}
.row .fee{grid-area:fee;display:flex;flex-direction:column;gap:4px}
.row .fee b{font-size:var(--t4);font-weight:800;font-stretch:62%;line-height:.9;color:var(--tomato);letter-spacing:-.01em;white-space:nowrap}
.row .fee .lab{opacity:.75}
.row .vd{grid-area:vd;max-width:560px}
.row .act{grid-area:act;display:flex;flex-direction:column;gap:12px;align-self:end}
.row .code{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid var(--ink);padding-bottom:8px;font:500 var(--t0)/16px var(--f-mono);text-transform:uppercase;letter-spacing:.08em}
.row .code b{font:600 var(--t2)/24px var(--f-mono);letter-spacing:.02em;text-transform:none}
.row .code.none b{opacity:.35}
.rows-end{border-top:8px solid var(--ink)}
@media(max-width:760px){
 .row{grid-template-areas:"idx nm nm nm nm nm nm nm nm nm nm nm" ". fee fee fee fee fee fee fee fee fee fee fee" ". vd vd vd vd vd vd vd vd vd vd vd" ". act act act act act act act act act act act";row-gap:8px;padding:20px 0 24px}
 .row .idx{padding-top:4px}
}
/* compare entry */
.cmp{margin-top:0;padding:48px 0 0;overflow:hidden}
.cmp .row1{align-items:end;padding-bottom:0}
.cmp .vs{grid-column:1/13;font-size:calc(var(--t6)*.86);line-height:.8;font-weight:900;font-stretch:62%;text-transform:uppercase;letter-spacing:-.02em;white-space:nowrap}
.cmp .pick{grid-column:1/6;padding:24px 0}
.cmp .pick .nm{font-size:var(--t4);line-height:.9;margin-top:8px}
.cmp .txt{grid-column:6/10;padding:24px 0;font-size:var(--t2);line-height:28px}
.cmp .go{grid-column:10/13;padding:24px 0 24px;align-self:end}
.cmp .vs span{display:inline-block}
.cmp .vs .o{color:var(--paper)}
@media(max-width:760px){.cmp{padding-top:32px}.cmp .pick,.cmp .txt,.cmp .go{grid-column:1/13;padding:12px 0}.cmp .go{padding-bottom:32px}.cmp .txt{font-size:var(--t1);line-height:24px}}
/* method */
.meth{padding:0}
.meth .cell{grid-column:span 3;padding:24px 0 48px;border-top:8px solid var(--ink)}
.meth .n{font-size:var(--t6);line-height:.8;font-weight:900;font-stretch:62%;color:var(--tomato);margin-bottom:16px;letter-spacing:-.02em}
.meth h4{font-size:var(--t3);line-height:32px;font-weight:800;font-stretch:62%;text-transform:uppercase;margin-bottom:8px}
.meth p{max-width:280px}
.meth .head{padding:48px 0 24px}
.meth .head .disp{font-size:var(--t5)}
@media(max-width:760px){.meth .cell{grid-column:1/13;padding-bottom:32px}.meth .n{font-size:var(--t5)}.meth .head{padding-top:48px}}
/* footer */
.foot{margin-top:48px;padding:48px 0 0;overflow:hidden}
.foot .d{grid-column:1/7;font-size:var(--t1)}
.foot .d p+p{margin-top:12px}
.foot .l{grid-column:8/13;display:flex;gap:48px}
.foot ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.foot .big{font-size:var(--t6);line-height:.78;font-weight:900;font-stretch:62%;text-transform:uppercase;letter-spacing:-.02em;color:var(--tomato);margin-top:48px;white-space:nowrap;transform:translateY(8%)}
@media(max-width:760px){.foot .d,.foot .l{grid-column:1/13}.foot .l{margin-top:32px;gap:32px}.foot .big{font-size:calc(var(--t6)*1.12)}}
"""
HEAD = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>{css}{extra}</style></head><body>
"""
def nav(on):
    items=[("Compare","compare.html"),("Exchanges","home.html#list"),("Method","home.html#method"),("Disclosure","home.html#disclosure")]
    li="".join(f'<li><a class="lab{" on" if n==on else ""}" href="{h}">{n}</a></li>' for n,h in items)
    return f'<div class="wrap"><nav class="nav"><a class="logo" href="home.html"><i></i>NexuAlpha</a><ul>{li}</ul></nav></div>'
FOOT = """
<footer class="foot ink" id="disclosure"><div class="wrap">
 <div class="g"><div class="d">
  <p class="lab" style="color:var(--tomato)">Disclosure</p>
  <p>NexuAlpha earns a commission when you open an account through an official referral route. It costs you nothing extra and never changes how we score fees. Fee figures are published base-tier rates; confirm on the exchange before you trade. Not financial advice.</p>
  <p class="lab">Rates checked Oct 2026</p></div>
  <div class="l"><ul><li class="lab" style="opacity:.6">Site</li><li><a href="compare.html">Compare</a></li><li><a href="binance.html">Binance</a></li><li><a href="home.html#method">Method</a></li></ul>
  <ul><li class="lab" style="opacity:.6">Legal</li><li>Referral policy</li><li>Risk notice</li><li>Contact</li></ul></div></div>
 <div class="big">NexuAlpha</div></div></footer>
</body></html>"""

ROWS=[
("Binance","0.075–0.10%","Spot, base tier","Deepest order books and the widest product shelf; the default first account.","11350287"),
("Coinbase","0.00–0.60%","Maker, Advanced","Cleanest onboarding for US and EU users; retail fees run high, Advanced runs low.",None),
("Bybit","0.02–0.10%","Perp to spot","Derivatives-first with a fast interface; spot depth trails the top two.","48553"),
("Bitget","0.02–0.10%","Perp to spot","Strong copy-trading tools and a broad altcoin list at middle-of-pack fees.","C6PRAF"),
("OKX","0.02–0.10%","Perp to spot","Lowest base spot maker fee of the majors, plus a built-in on-chain wallet.","nexu888"),
("Kraken","0.00–0.40%","Maker, Pro","Long regulatory track record; fees fall quickly with 30-day volume.",None),
("Hyperliquid","0.015–0.045%","Perps, base tier","On-chain order book with no sign-up; self-custody, perps only.",None),
("Uniswap","0.01–1.00%","Pool tier","Swap straight from your wallet; pay pool and network fees, no account.",None),
]
def rows():
    out=[]
    for i,(n,f,l,v,c) in enumerate(ROWS,1):
        code=(f'<div class="code"><span>Code</span><b>{c}</b></div>' if c else '<div class="code none"><span>Code</span><b>None</b></div>')
        href="binance.html" if n=="Binance" else "#"
        out.append(f'<article class="row g"><span class="idx lab">{i:02d}</span><h3 class="nm"><a href="{href}">{n}</a></h3><div class="fee"><b>{f}</b><span class="lab">{l}</span></div><p class="vd">{v}</p><div class="act">{code}<a class="cta" href="#">Open official signup <span>&rarr;</span></a></div></article>')
    return "\n".join(out)

home = HEAD.format(title="NexuAlpha Home", css=CSS, extra="") + nav("Exchanges") + f"""
<main>
<section class="hero"><div class="wrap"><div class="rule"></div><div class="g" style="padding-top:32px">
  <h1 class="h1 disp">Compare crypto platforms and <em>official</em> account routes</h1>
  <aside class="side red"><span class="lab">Index</span><div class="big">08</div><p>platforms, one honest fee table.</p></aside>
  <p class="lead">Every exchange below links to its own official signup page. Fees are published rates, verdicts are one line, and referral codes are shown in plain sight.</p>
  <ul class="meta lab"><li><span>Platforms</span><span>08</span></li><li><span>Codes</span><span>04</span></li><li><span>Checked</span><span>Oct 2026</span></li></ul>
</div></div></section>
<section id="list"><div class="wrap"><div class="rule"></div>
 <div class="lh lab"><span>No.</span><span>Platform &middot; Verdict</span><span>Fee range</span><span>Code &middot; Route</span></div>
 {rows()}
 </div></section>
<section class="cmp red"><div class="wrap">
 <div class="g row1"><div class="vs">Binance <span class="o">vs</span> OKX</div></div>
 <div class="g" style="border-top:8px solid var(--ink);margin-top:24px">
  <div class="pick"><p class="lab">Compare entry</p><p class="nm disp" style="font-size:var(--t4)">Two giants, one table</p></div>
  <p class="txt">Spot and perp fees, discounts, regions and sign-up codes, side by side. Pick any two platforms.</p>
  <div class="go"><a class="cta" href="compare.html">Start comparing <span>&rarr;</span></a></div></div>
</div></section>
<section class="meth" id="method"><div class="wrap">
 <div class="g head"><div style="grid-column:1/9"><p class="lab">Method</p><h2 class="disp">How we score</h2></div></div>
 <div class="g">
  <div class="cell"><div class="n">01</div><h4>Published fees</h4><p>Base-tier maker and taker rates, copied from each fee page.</p></div>
  <div class="cell"><div class="n">02</div><h4>Official routes</h4><p>Signup links go to the exchange itself, never a mirror.</p></div>
  <div class="cell"><div class="n">03</div><h4>Live codes</h4><p>Each referral code is tested at signup before it is listed.</p></div>
  <div class="cell"><div class="n">04</div><h4>Dated checks</h4><p>Every figure carries a check date and is re-read monthly.</p></div>
 </div></div></section>
</main>""" + FOOT

# compare
def crow(lab,a,b,win=None,big=False):
    ca=' class="w"' if win=="a" else ""; cb=' class="w"' if win=="b" else ""
    return f'<div class="cr g"><span class="lab k">{lab}</span><div{ca}><b>{a}</b></div><div{cb}><b>{b}</b></div></div>'
CCSS="""
.ch{padding-top:48px}
.ch .t{font-size:var(--t5);grid-column:1/10}
.side2{grid-column:10/13;grid-row:1/3;padding:24px;display:flex;flex-direction:column;justify-content:space-between;margin-bottom:32px}
.side2 b{font-size:var(--t6);line-height:.8;font-weight:900;font-stretch:62%}
@media(max-width:760px){.side2{display:none}.ch .t{grid-column:1/13}}
.ch .t .x{color:var(--tomato)}
.ch .lead{grid-column:1/7;font-size:var(--t2);line-height:28px;padding:32px 0 48px}
.hdr{position:relative}
.hd{padding:24px 0 24px;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gut)}
.hd .a,.hd .b{padding:24px;min-height:0}
.hd .a{grid-column:4/8}.hd .b{grid-column:8/13}
.hd .nm{font-size:var(--t5);line-height:.86;font-weight:800;font-stretch:62%;text-transform:uppercase}
.hd .a{background:var(--tomato)}.hd .b{background:var(--ink);color:var(--paper)}
.hd .c{display:flex;justify-content:space-between;align-items:center;margin-top:24px;gap:8px;flex-wrap:wrap}
.hd .c b{font:600 var(--t2)/24px var(--f-mono)}
.cr{border-top:2px solid var(--ink);padding:20px 0 20px;align-items:end}
.cr .k{grid-column:1/4;align-self:center}
.cr>div:nth-child(2){grid-column:4/8;padding-left:24px}.cr>div:nth-child(3){grid-column:8/13;padding-left:24px}
.cr b{font-size:var(--t4);line-height:.9;font-weight:800;font-stretch:62%;text-transform:uppercase;display:inline-block}
.cr b.s{font-size:var(--t2);line-height:28px;font-weight:500;font-stretch:100%;text-transform:none}
.cr .w b{box-shadow:inset 0 -.2em 0 var(--tomato)}
.cr .w b.s{box-shadow:none;text-decoration:underline;text-decoration-color:var(--tomato);text-decoration-thickness:6px;text-underline-offset:4px}
.verdict{margin-top:48px;padding:48px 0}
.verdict .l{grid-column:1/4}.verdict .p{grid-column:4/13;font-size:var(--t3);line-height:36px;font-weight:600;max-width:900px}
.verdict .p em{font-style:normal;background:var(--paper);padding:0 6px}
.two{padding:48px 0 0}
.two .a,.two .b{padding:24px 0 24px}
.two .a{grid-column:4/8;padding-right:24px}.two .b{grid-column:8/13;padding-right:24px}
.two .big{font-size:var(--t3);font-weight:800;font-stretch:62%;text-transform:uppercase;line-height:32px;margin-bottom:12px}
@media(max-width:760px){
 .ch{padding-top:24px}.ch .lead{grid-column:1/13;padding:24px 0 32px}
 .hd{display:flex;flex-direction:column;gap:12px;padding-top:0}
 .hd .a,.hd .b{padding:16px}.hd .nm{font-size:var(--t5)}
 .cr{display:block;padding:16px 0}.cr .k{display:block;margin-bottom:8px}
 .cr>div{display:inline-block;width:49%;vertical-align:top;padding:0 !important}
 .cr b{font-size:var(--t4)}.cr b.s{font-size:var(--t1);line-height:20px;font-weight:600}
 .cr>div:nth-child(2){padding-right:8px !important}
 .verdict .l,.verdict .p{grid-column:1/13}.verdict .p{font-size:var(--t2);line-height:28px;margin-top:12px}
 .two .a,.two .b{grid-column:1/13;padding-right:0}
}
"""
compare = HEAD.format(title="Binance vs OKX", css=CSS, extra=CCSS) + nav("Compare") + f"""
<main><section class="ch"><div class="wrap"><div class="rule"></div><div class="g" style="padding-top:32px">
 <h1 class="t disp">Binance <span class="x">vs</span> OKX</h1>
 <aside class="side2 red"><span class="lab">Fields</span><b>08</b></aside>
 <p class="lead">Two of the largest spot and derivatives venues, read from their own fee pages. Underline marks the lower or stronger side.</p></div>
 <div class="hd">
  <div style="grid-column:1/4" class="lab">01 &middot; Head to head</div>
  <div class="a"><p class="lab">Left</p><div class="nm">Binance</div><div class="c"><span class="lab">Code</span><b>11350287</b></div><div style="margin-top:16px"><a class="cta on-red" style="width:100%" href="#">Open official signup <span>&rarr;</span></a></div></div>
  <div class="b"><p class="lab">Right</p><div class="nm">OKX</div><div class="c"><span class="lab">Code</span><b>nexu888</b></div><div style="margin-top:16px"><a class="cta paper" style="width:100%" href="#">Open official signup <span>&rarr;</span></a></div></div>
 </div>
 {crow("Spot maker","0.10%","0.08%","b")}
 {crow("Spot taker","0.10%","0.10%")}
 {crow("Perp maker","0.02%","0.02%")}
 {crow("Perp taker","0.05%","0.05%")}
 {crow("Fee discount","25% off in BNB","Volume tiers only","a").replace("<b>","<b class='s'>")}
 {crow("Reserves proof","Published","Published").replace("<b>","<b class='s'>")}
 {crow("Built-in wallet","Binance Wallet","OKX Wallet").replace("<b>","<b class='s'>")}
 {crow("Best for","Liquidity depth","Lower maker fee").replace("<b>","<b class='s'>")}
 <div class="rows-end"></div></div></section>
<section class="verdict red"><div class="wrap"><div class="g"><p class="lab l">Verdict</p>
 <p class="p">Choose <em>Binance</em> if depth and the widest product shelf matter. Choose <em>OKX</em> if you place mostly maker spot orders and want the wallet built in. Many traders hold both.</p></div></div></section>
<section class="two"><div class="wrap"><div class="g">
 <div class="a"><p class="lab">Binance route</p><p class="big">Use code 11350287</p><a class="cta" href="binance.html">Read Binance review <span>&rarr;</span></a></div>
 <div class="b"><p class="lab">OKX route</p><p class="big">Use code nexu888</p><a class="cta ghost" href="#">Open official signup <span>&rarr;</span></a></div>
</div></div></section></main>""" + FOOT

BCSS="""
.bh{padding-top:32px}
.bh .crumb{display:flex;justify-content:space-between;padding:8px 0 16px}
.bh .name{font-size:min(calc(var(--t6)*1.88),29vw);line-height:.78;font-weight:900;font-stretch:62%;text-transform:uppercase;letter-spacing:-.02em;grid-column:1/13;margin-left:-6px;white-space:nowrap}
.bh .tag{grid-column:1/8;font-size:var(--t2);line-height:28px;padding:32px 0 48px;max-width:640px;align-self:end}
.bh .claim{grid-column:8/13;padding:24px;display:flex;flex-direction:column;gap:16px;margin-top:8px}
.claim .code{font:600 var(--t4)/56px var(--f-mono);letter-spacing:-.03em}
.claim .cta{height:56px}
.stats{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gut)}
.stats .s{grid-column:span 4;border-top:8px solid var(--ink);padding:16px 0 32px}
.stats .s b{display:block;font-size:calc(var(--t6)*.64);line-height:.8;font-weight:900;font-stretch:62%;color:var(--tomato);letter-spacing:-.02em;margin:16px 0 12px}
.fx{padding-top:48px}
.fx h2{grid-column:1/5;font-size:var(--t4);}
.fx .list{grid-column:5/13}
.fx .it{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));column-gap:var(--gut);border-top:2px solid var(--ink);padding:16px 0}
.fx .it .lab{grid-column:1/3;padding-top:4px}.fx .it span:last-child{grid-column:3/9;font-size:var(--t2);line-height:28px}
.f1{grid-column:1/8}.f2{grid-column:9/13;align-self:end}
@media(max-width:760px){.f1,.f2{grid-column:1/13}.f2{margin-top:24px}}
.pc{margin-top:48px;padding:48px 0}
.pc .c1,.pc .c2{grid-column:span 6}
.pc h3{font-size:var(--t3);line-height:32px;font-weight:800;font-stretch:62%;text-transform:uppercase;margin-bottom:12px}
.pc li{list-style:none;padding:12px 0;border-top:2px solid var(--ink)}
.pc .ink li{border-color:var(--paper)}
@media(max-width:760px){
 .bh{padding-top:16px}.bh .name{font-size:calc(var(--t6)*.82);white-space:nowrap;line-height:.82;margin-left:-2px}
 .bh .tag{grid-column:1/13;padding:24px 0}
 .bh .claim{grid-column:1/13;margin-top:0}.claim .code{font-size:var(--t4);line-height:48px}
 .stats .s{grid-column:1/13;padding-bottom:24px}.stats .s b{font-size:calc(var(--t6)*.8)}
 .fx h2,.fx .list{grid-column:1/13}.fx h2{margin-bottom:24px}
 .fx .it{display:block}.fx .it span:last-child{display:block;font-size:var(--t1);line-height:24px}
 .pc .c1,.pc .c2{grid-column:1/13}.pc .c2{margin-top:32px}
}
"""
binance = HEAD.format(title="Binance Review", css=CSS, extra=BCSS) + nav("Exchanges") + """
<main><section class="bh"><div class="wrap"><div class="rule"></div>
 <div class="crumb lab"><span>Home / Exchanges / 01</span><span>Checked Oct 2026</span></div>
 <div class="g"><h1 class="name">Binance</h1></div>
 <div class="g"><p class="tag">Highest liquidity, widest product shelf, and a 0.10% spot base fee that drops to 0.075% when you pay in BNB.</p>
  <aside class="claim red"><p class="lab">Referral code</p><div class="code">11350287</div><a class="cta on-red" href="#">Open official signup <span>&rarr;</span></a><p class="lab">Official route &middot; no extra cost</p></aside></div>
 <div style="height:48px"></div>
 <div class="stats">
  <div class="s"><p class="lab">Spot base</p><b>0.10%</b><p>Maker and taker, lowest volume tier.</p></div>
  <div class="s"><p class="lab">With BNB</p><b>0.075%</b><p>25% discount when fees are paid in BNB.</p></div>
  <div class="s"><p class="lab">Perp base</p><b>0.02%</b><p>Maker rate; taker is 0.05% on USD-M futures.</p></div>
 </div></div></section>
<section class="fx"><div class="wrap"><div class="g"><h2 class="disp">Quick facts</h2><div class="list">
 <div class="it"><span class="lab">Founded</span><span>2017</span></div>
 <div class="it"><span class="lab">Products</span><span>Spot, margin, futures, earn, copy trading, on-chain wallet.</span></div>
 <div class="it"><span class="lab">Safety</span><span>Proof of reserves published; SAFU emergency fund.</span></div>
 <div class="it"><span class="lab">Watch</span><span>Available products depend on your country; check eligibility first.</span></div>
 <div class="it"><span class="lab">Verdict</span><span>The default first account for most traders who want depth.</span></div>
</div></div></div></section>
<section class="pc"><div class="wrap"><div class="g">
 <div class="c1"><h3>Strong on</h3><ul><li>Order-book depth on major pairs</li><li>Product breadth under one login</li><li>Low base fees, further cut by BNB</li></ul></div>
 <div class="c2"><h3>Weaker on</h3><ul><li>Regional product limits</li><li>Dense interface for beginners</li><li>Maker spot fee above OKX base</li></ul></div>
</div></div></section>
<section class="red" style="padding:48px 0"><div class="wrap"><div class="g"><div class="f1"><p class="disp" style="font-size:var(--t5)">Binance or OKX?</p></div>
 <div class="f2"><a class="cta" style="width:100%" href="compare.html">Compare both <span>&rarr;</span></a></div></div></div></section>
</main>""" + FOOT
for n,h in (("home",home),("compare",compare),("binance",binance)):
    open(f"/home/claude/directions/C/{n}.html","w").write(h)
