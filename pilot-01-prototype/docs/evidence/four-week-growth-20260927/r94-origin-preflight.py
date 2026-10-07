import urllib.request, urllib.parse, json, pathlib, re, html, concurrent.futures, datetime, xml.etree.ElementTree as ET
import time, signal, os, urllib.error, sys

_PROGRESS = {"rows": [], "total": 0}

class ScanAborted(RuntimeError):
 def __init__(self, reason, rows, total):
  super().__init__(reason)
  self.rows = rows
  self.total = total

def bounded_scan(urls, check, clock=time.monotonic, sleep=time.sleep, budget=900):
 # At most two submitted requests; all starts share one global rate limiter.
 deadline = clock() + budget
 next_start = clock()
 rows = []
 pending = {}
 next_index = 0
 _PROGRESS.update(rows=rows, total=len(urls))
 pool = concurrent.futures.ThreadPoolExecutor(max_workers=2)
 try:
  while next_index < len(urls) or pending:
   if clock() >= deadline:
    raise ScanAborted("OVERALL_DEADLINE", rows, len(urls))
   for future in list(pending):
    if future.done():
     url = pending.pop(future)
     try:
      row = future.result()
     except Exception as exc:
      row = {"url": url, "issues": [type(exc).__name__], "originConnectionIssue": True}
     rows.append(row)
     if len(rows) % 100 == 0:
      print(json.dumps({"phase":"sitemap_scan","completed":len(rows),"total":len(urls)}), file=sys.stderr, flush=True)
     if row.get("originConnectionIssue"):
      raise ScanAborted("ORIGIN_CONNECTION_ISSUE", rows, len(urls))
   if next_index < len(urls) and len(pending) < 2 and clock() >= next_start:
    url = urls[next_index]
    pending[pool.submit(check, url)] = url
    next_index += 1
    next_start = clock() + 0.5
   if next_index == len(urls) and not pending:
    break
   # A short coordinator wait observes failures before scheduling more work.
   delay = min(0.05, max(0, deadline - clock()))
   if next_index < len(urls) and len(pending) < 2:
    delay = min(delay, max(0, next_start - clock()))
   sleep(delay)
  return rows
 finally:
  for future in pending:
   future.cancel()
  pool.shutdown(wait=False)

def write_failure(directory, reason, rows, total):
 directory = pathlib.Path(directory)
 directory.mkdir(parents=True, exist_ok=True)
 result = {"status": "FAIL", "reason": reason, "originSitemapRows": len(rows),
           "expectedSitemapRows": total, "remainingRows": max(0, total-len(rows)),
           "rows": rows, "originIssues": [r for r in rows if r.get("issues")],
           "candidateBuildId": "3.0-20261002T-R93-UNISWAP-ANSWER"}
 temporary = directory / "PREFLIGHT.json.tmp"
 temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
 temporary.replace(directory / "PREFLIGHT.json")

def main():
 p=pathlib.Path('/data/private/nexualpha/r93-web-release')
 p.mkdir(parents=True,exist_ok=True)
 try:
  (p/'PREFLIGHT.json').unlink()
 except FileNotFoundError:
  pass
 def hard_deadline(signum, frame):
  # Hard exit also stops worker threads if a slow response never completes.
  try:
   write_failure(p,"HARD_OVERALL_DEADLINE",_PROGRESS["rows"],_PROGRESS["total"])
  finally:
   os._exit(1)
 signal.signal(signal.SIGALRM,hard_deadline)
 signal.alarm(900)
 try:
  run_acceptance()
 except Exception as exc:
  rows = exc.rows if isinstance(exc,ScanAborted) else _PROGRESS["rows"]
  total = exc.total if isinstance(exc,ScanAborted) else _PROGRESS["total"]
  write_failure(p,str(exc),rows,total)
  raise
 else:
  signal.alarm(0)

def run_acceptance():
 base='http://127.0.0.1:18192'; old='http://127.0.0.1:18191'; p=pathlib.Path('/data/private/nexualpha/r93-web-release')
 def get(path,origin=base):
  req=urllib.request.Request(origin+path,headers={'Host':'nexualpha.com'});r=urllib.request.urlopen(req,timeout=10);assert urllib.parse.urlsplit(r.url).netloc == urllib.parse.urlsplit(origin).netloc, 'LEFT_LOOPBACK_ORIGIN';return r.status,r.read().decode()
 assert json.loads(get('/version.json')[1])['buildId']=='3.0-20261002T-R93-UNISWAP-ANSWER'
 assert json.loads(get('/version.json',old)[1])['buildId']=='3.0-20261002T-R90-RETURN-I18N'
 sm=get('/sitemap.xml')[1]; olds=get('/sitemap.xml',old)[1]; ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};urls=[x.text for x in ET.fromstring(sm).findall('s:url/s:loc',ns)];oldurls=[x.text for x in ET.fromstring(olds).findall('s:url/s:loc',ns)];assert set(urls)==set(oldurls) and len(urls)==861

 def check(u):
  try:
   s=urllib.parse.urlsplit(u);status,b=get(s.path+('?' + s.query if s.query else ''));issues=[]
   if status!=200:issues.append('HTTP_NOT_200')
   if not re.search(r'<h1\b',b):issues.append('H1_MISSING')
   if not re.search(r'<title\b[^>]*>[^<]+</title>',b):issues.append('TITLE_MISSING')
   if 'rel="canonical"' not in b:issues.append('CANONICAL_MISSING')
   return {'url':u,'issues':issues}
  except urllib.error.HTTPError as e:return {'url':u,'issues':['HTTP_ERROR:'+str(e.code)]}
  except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:return {'url':u,'issues':[type(e).__name__],'originConnectionIssue':True}
  except Exception as e:return {'url':u,'issues':[type(e).__name__]}
 rows=bounded_scan(urls,check)
 assert len(rows)==861, "INCOMPLETE_SITEMAP_SCAN"
 issues=[r for r in rows if r['issues']];assert not issues, json.dumps(issues[:10])
 invites=['https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy','https://partner.bitget.cafe/bg/C6PRAF','https://www.okx.com/join/nexu888','https://backpack.exchange/join/luckybitcoin']
 inv=[]
 for path in ['/exchanges','/ja/exchanges','/ko/exchanges','/tr/exchanges']:
  b=html.unescape(get(path)[1]);bo=html.unescape(get(path,old)[1]);expected=[u for u in invites if u in bo];assert len(expected)==4 and all(u in b for u in expected),path;inv.append({'path':path,'exactInvites':expected})
 status,b=get('/ko/exchanges?market=KR&product=spot&account_stage=existing_account');assert status == 200; kr_ssr_anchor = 'directory-empty-region-return' in b
 br_checks=[]
 for query, triple in [('utm_source=tg_channel&utm_medium=manual_draft&utm_campaign=r93_origin_a',['tg_channel','manual_draft','r93_origin_a']),('utm_source=site_b&utm_medium=broadcast&utm_campaign=r93_origin_b',['site_b','broadcast','r93_origin_b']),('utm_source=invalid%2Fslash&utm_medium=email&utm_campaign='+('x'*61),[None,None,None]),('',[None,None,None])]:
  path='/br/pix'+('?' + query if query else '')
  req=urllib.request.Request(base+path,headers={'Host':'nexualpha.com','If-None-Match':'"r93-origin-conditional"','If-Modified-Since':'Tue, 01 Sep 2026 00:00:00 GMT'})
  response=urllib.request.urlopen(req,timeout=10);body=response.read().decode();assert response.status==200 and '<h1' in body
  match=re.search(r'<a class="br-chain__primary" href="([^"]+)"',body);assert match
  href=html.unescape(match.group(1));target=urllib.parse.urlsplit(href);params=urllib.parse.parse_qs(target.query)
  assert target.path=='/br/custos'
  assert [params.get(k,[None])[0] for k in ['utm_source','utm_medium','utm_campaign']]==triple
  cache=response.headers.get('cache-control','');assert not query or ('private' in cache and 'no-store' in cache and 'public' not in cache)
  if not query:assert 'r93_origin_a' not in body and 'r93_origin_b' not in body
  br_checks.append({'path':path,'status':response.status,'cacheControl':cache,'primaryHref':href,'conditionalHeadersSent':True})
 question='No depósito Pix, o CPF do pagador e o CNPJ do recebedor são a mesma verificação?'
 status,pixbody=get('/br/pix');assert html.unescape(pixbody).count(question)>=2
 assert 'Não. Confira separadamente quem envia e quem recebe.' in html.unescape(pixbody)
 assert question in get('/llms-full.txt')[1] and question in get('/llms.txt')[1]
 assert 'FAQPage' in pixbody
 assert get('/content/news-feed.json')[1]==get('/content/news-feed.json',old)[1], 'NEWS_FEED_DRIFT'
 for path,title in [('/br/pix','Pix/BRL em corretora cripto no Brasil: checklist de depósito e saque'),('/br/kyc-cpf','KYC e CPF em conta cripto no Brasil: titularidade bancária e benefícios')]:
  body=html.unescape(get(path)[1]);assert '<h1>'+title+'</h1>' in body,path;assert title+' | NexuAlpha' in body,path
 out={'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS','candidateBuildId':'3.0-20261002T-R93-UNISWAP-ANSWER','warmRollback':'R90/18191','brQueryChecks':br_checks,'originSitemapRows':len(rows),'originIssues':issues,'sitemapUrlSetUnchanged':True,'exactInviteChecks':inv,'krDirectoryHTTP':status,'krRecoverySSRAnchorPresent':kr_ssr_anchor,'krRecoveryBrowserRequired':True,'boundary':'861 loopback HTTP title/H1/canonical existence checks, not browser hydration, exhaustive SEO parity or Google index proof. No CTA POST or registrations.'};(p/'PREFLIGHT.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=True))

if __name__ == "__main__":
 main()
