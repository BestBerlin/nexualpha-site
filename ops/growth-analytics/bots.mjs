// Kept local so the analytics directory can be installed independently of the site.
// umami.test.mjs enforces parity with the server classifier.
export const AUTOMATED_ANALYTICS_UA = /bot|curl|wget|python|slurp|preview|whatsapp|node\b|undici|crawler|spider|headless|googleother|google-inspectiontool|facebookexternalhit|bytespider|chatgpt-user|gptbot|claudebot|perplexitybot|applebot|playwright|puppeteer|nexualpha[ /_-]*(?:qa|smoke|probe|link health)|codex[ /_-]*(?:qa|audit|smoke)|lighthouse|chrome-lighthouse/i;
const values = text => String(text || '').split(',').map(x => x.trim()).filter(Boolean);
// An ASN is a risk indicator, not evidence that its user is a bot.
export const DATACENTER_ASNS = new Set(['16509','14618','15169','8075','14061','24940','16276','13335']);
export function classifyTraffic(session = {}, events = [], env = {}) {
  const reasons = [];
  const ua = String(session.userAgent || session.ua || session.browser || '');
  if (AUTOMATED_ANALYTICS_UA.test(ua)) reasons.push('automated_ua');
  if (values(env.ANALYTICS_QA_UAS).some(x => ua.toLowerCase().includes(x.toLowerCase()))) reasons.push('qa_ua');
  if (session.ip && values(env.ANALYTICS_QA_IPS).includes(session.ip)) reasons.push('qa_ip');
  if (session.qa === true || session.analyticsMode === 'smoke' || session.analyticsMode === 'test') reasons.push('qa_marker');
  if (session.javascript === false || session.noJs === true) reasons.push('no_js');
  const times = events.map(e => Date.parse(e.createdAt || e.t)).filter(Number.isFinite).sort((a,b) => a-b);
  // A configurable high bar marks suspicious bursts; never count them as humans.
  if (times.some((t,i) => i >= 119 && t-times[i-119] < 60_000)) reasons.push('request_burst');
  const asn = String(session.asn || '').replace(/^AS/i, '');
  if (DATACENTER_ASNS.has(asn) || values(env.ANALYTICS_DATACENTER_ASNS).map(x => x.replace(/^AS/i,'')).includes(asn)) reasons.push('datacenter_asn');
  const definite = reasons.some(r => ['automated_ua','qa_ua','qa_ip','qa_marker'].includes(r));
  return { classification: definite ? 'bot_or_qa' : reasons.length ? 'unknown' : 'human_candidate', reasons };
}
