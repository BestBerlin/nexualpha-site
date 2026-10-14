// Entry-safe routing and link labels; guide prose stays in its deferred chunk.
export const BITGET_GUIDE_PATH = '/guides/bitget-first-trade';
export const BITGET_GUIDE_LOCALES = Object.freeze(['zh-Hans', 'en', 'id', 'es', 'pt-BR']);
export const isBitgetGuidePath = pathname => String(pathname || '').replace(/\/+$/, '') === BITGET_GUIDE_PATH;
export function bitgetGuideAvailable(locale, market) {
  return BITGET_GUIDE_LOCALES.includes(locale) && String(market || '').toUpperCase() !== 'TR';
}
export function bitgetGuideLabel(locale) {
  return ({ 'zh-Hans': 'Bitget 首次交易：7 步指南', en: 'Your first Bitget trade: 7 steps', id: 'Transaksi pertama di Bitget: 7 langkah', es: 'Tu primera operación en Bitget: 7 pasos', 'pt-BR': 'Sua primeira operação na Bitget: 7 passos' })[locale];
}
