// Origin is authoritative when present. Missing-Origin beacons require browser
// Fetch Metadata proving same-origin; language/referrer are not origin evidence.
export function analyticsOriginAllowed(request, expectedOrigin, { allowMissingOrigin = false } = {}) {
  if (!expectedOrigin || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  return origin ? origin === expectedOrigin : allowMissingOrigin && request.headers.get('sec-fetch-site') === 'same-origin';
}
