const PUBLISHER = /^[a-zA-Z0-9._-]{1,60}$/;
export function buildBrazilEmbedUrl(publisher = 'partner') {
  if (typeof publisher !== 'string' || !PUBLISHER.test(publisher)) return null;
  const url = new URL('https://nexualpha.com/embed/calculator');
  url.search = new URLSearchParams({ locale: 'pt-BR', market: 'BR', product: 'spot',
    publisher, utm_source: 'embed_widget', utm_campaign: 'brazil-pilot' }).toString();
  return url.href;
}

export function buildBrazilEmbedCode(publisher) {
  const url = buildBrazilEmbedUrl(publisher);
  return url ? `<iframe\n  src="${url.replaceAll('&', '&amp;')}"\n  title="NexuAlpha: simular custos em BRL"\n  width="100%" height="680"\n  style="max-width: 560px; border: 0; background: #070A0E;"\n  loading="lazy"\n></iframe>` : null;
}
