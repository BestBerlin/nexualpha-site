import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const preamble = String.raw`
import importlib.util, pathlib, tempfile, json, sys
sys.dont_write_bytecode = True
path = pathlib.Path('docs/evidence/four-week-growth-20260927/r94-origin-preflight.py')
spec = importlib.util.spec_from_file_location('preflight', path)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
class Clock:
 def __init__(self): self.now = 0
 def time(self): return self.now
 def sleep(self, n): self.now += n
clock = Clock()
starts = []
peak = [0]
class Future:
 def __init__(self, fn, url):
  self.fn, self.url, self.ready = fn, url, clock.time()+0.75
  self.cancelled = False
 def done(self): return clock.time() >= self.ready
 def result(self): return self.fn(self.url)
 def cancel(self): self.cancelled = True
class Pool:
 def __init__(self, max_workers):
  assert max_workers == 2
  self.futures = []
 def submit(self, fn, url):
  starts.append(clock.time())
  future = Future(fn, url)
  self.futures.append(future)
  peak[0] = max(peak[0], sum(not f.done() and not f.cancelled for f in self.futures))
  return future
 def shutdown(self, wait): assert wait is False
m.concurrent.futures.ThreadPoolExecutor = Pool
`;

function probe(body) {
  const result = spawnSync('python3', ['-c', preamble + body], {
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr || String(result.error));
}

test('all 861 URLs complete with two pending requests and globally spaced starts', () => {
  probe(String.raw`
urls = ['url-'+str(i) for i in range(861)]
rows = m.bounded_scan(urls, lambda u: {'url':u,'issues':[]}, clock.time, clock.sleep)
assert len(rows) == 861 and {r['url'] for r in rows} == set(urls)
assert peak[0] <= 2
assert all(b-a >= 0.5-1e-9 for a,b in zip(starts,starts[1:]))
`);
});

test('HTTP findings remain failures while origin connection errors stop new work', () => {
  probe(String.raw`
def check(url):
 if url == 'bad': return {'url':url,'issues':['HTTP_ERROR:404']}
 if url == 'offline': return {'url':url,'issues':['URLError'],'originConnectionIssue':True}
 return {'url':url,'issues':[]}
try:
 m.bounded_scan(['bad','offline','unrun','unrun2'],check,clock.time,clock.sleep)
 raise AssertionError('expected abort')
except m.ScanAborted as exc:
 assert str(exc) == 'ORIGIN_CONNECTION_ISSUE'
 assert any('HTTP_ERROR:404' in r['issues'] for r in exc.rows)
 assert len(starts) < 4
 with tempfile.TemporaryDirectory() as directory:
  target = pathlib.Path(directory)/'PREFLIGHT.json'
  target.write_text('{"status":"PASS"}')
  m.write_failure(directory,str(exc),exc.rows,exc.total)
  result = json.loads(target.read_text())
  assert result['status'] == 'FAIL'
  assert result['remainingRows'] > 0
  assert result['originIssues']
`);
});

test('budget expiry preserves partial evidence and cannot return successful scan', () => {
  probe(String.raw`
try:
 m.bounded_scan(['a','b','c'],lambda u: {'url':u,'issues':[]},clock.time,clock.sleep,budget=0.9)
 raise AssertionError('expected deadline')
except m.ScanAborted as exc:
 assert str(exc) == 'OVERALL_DEADLINE'
 assert len(exc.rows) == 1 and exc.total == 3
 assert len(starts) == 2
`);
});

test('main invalidates stale PASS and leaves the hard deadline armed on failure', () => {
  probe(String.raw`
import types
with tempfile.TemporaryDirectory() as directory:
 target = pathlib.Path(directory)/'PREFLIGHT.json'
 target.write_text('{"status":"PASS"}')
 real_path = pathlib.Path
 m.pathlib = types.SimpleNamespace(Path=lambda value: real_path(directory) if str(value)=='/data/private/nexualpha/r93-web-release' else real_path(value))
 alarms = []
 handlers = []
 m.signal.signal = lambda number, handler: handlers.append(handler)
 m.signal.alarm = lambda seconds: alarms.append(seconds)
 def fail():
  assert not target.exists(), 'stale PASS must be gone before any probe'
  raise AssertionError('EARLY_ACCEPTANCE_FAILURE')
 m.run_acceptance = fail
 try:
  m.main()
  raise AssertionError('main must fail')
 except AssertionError as exc:
  assert str(exc) == 'EARLY_ACCEPTANCE_FAILURE'
 assert json.loads(target.read_text())['status'] == 'FAIL'
 assert alarms == [900]
 def exit_process(status): raise SystemExit(status)
 m.os._exit = exit_process
 try:
  handlers[0](None,None)
  raise AssertionError('hard deadline must exit')
 except SystemExit as exc:
  assert exc.code == 1
 assert json.loads(target.read_text())['reason'] == 'HARD_OVERALL_DEADLINE'
`);
});
