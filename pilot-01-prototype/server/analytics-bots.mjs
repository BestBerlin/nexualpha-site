// Shared deterministic exclusions. IP/ASN values are inspected in memory only.
export const AUTOMATED_ANALYTICS_UA = /bot|curl|wget|python|slurp|preview|whatsapp|node\b|undici|crawler|spider|headless|googleother|google-inspectiontool|facebookexternalhit|bytespider|chatgpt-user|gptbot|claudebot|perplexitybot|applebot|playwright|puppeteer|nexualpha[ /_-]*(?:qa|smoke|probe|link health)|codex[ /_-]*(?:qa|audit|smoke)|lighthouse|chrome-lighthouse/i;
const list = value => String(value || '').split(',').map(x => x.trim()).filter(Boolean);
export function isAutomatedAnalyticsRequest(request, { env = process.env, clientIp } = {}) {
  const ua = request.headers.get('user-agent') || '';
  if (AUTOMATED_ANALYTICS_UA.test(ua)) return true;
  if (list(env.ANALYTICS_QA_UAS).some(marker => ua.toLowerCase().includes(marker.toLowerCase()))) return true;
  // Do not trust client-supplied XFF or X-Real-IP here. Callers may pass a proxy-validated address.
  return Boolean(clientIp && list(env.ANALYTICS_QA_IPS).includes(clientIp.replace(/^::ffff:/, '')));
}
