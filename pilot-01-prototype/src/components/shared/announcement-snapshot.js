// A collector timestamp is freshness evidence; individual announcement publication dates are not.
export const ANNOUNCEMENT_MAX_AGE_MS = 15 * 60 * 1000;
export function announcementSnapshot(feed, now = Date.now()) {
  const valid = feed && Array.isArray(feed.items);
  const generated = Date.parse(feed?.generatedAt);
  const age = now - generated;
  const failed = Object.values(feed?.sources || {}).some((source) => {
    const timestamp = source?.lastGoodAt || source?.at;
    const time = Date.parse(timestamp);
    return source?.ok === false || timestamp && (!Number.isFinite(time) || now - time > ANNOUNCEMENT_MAX_AGE_MS || time - now > 60_000);
  });
  const freshness = !valid || !Number.isFinite(generated) || age < -60_000 ? 'unavailable'
    : age > ANNOUNCEMENT_MAX_AGE_MS || feed.stale === true || failed || feed.status && feed.status !== 'OK' ? 'stale' : 'current';
  return { ...(valid ? feed : {}), generatedAt: feed?.generatedAt || null, renderedAt: new Date(now).toISOString(),
    freshness, stale: freshness !== 'current', items: valid ? feed.items : [] };
}
const LABELS = {
  en: ['Updated', 'Stale', 'Unavailable'], 'zh-Hans': ['已更新', '数据过期', '暂不可用'], 'zh-Hant': ['已更新', '資料過期', '暫不可用'],
  es: ['Actualizado', 'Desactualizado', 'No disponible'], 'pt-BR': ['Atualizado', 'Desatualizado', 'Indisponível'],
  fr: ['À jour', 'Périmé', 'Indisponible'], de: ['Aktuell', 'Veraltet', 'Nicht verfügbar'], it: ['Aggiornato', 'Obsoleto', 'Non disponibile'],
  ja: ['更新済み', '古いデータ', '利用不可'], ko: ['업데이트됨', '오래된 데이터', '사용 불가'], ru: ['Обновлено', 'Устарело', 'Недоступно'],
  tr: ['Güncel', 'Güncel değil', 'Kullanılamıyor'], id: ['Diperbarui', 'Kedaluwarsa', 'Tidak tersedia'],
  vi: ['Đã cập nhật', 'Đã cũ', 'Không khả dụng'], ar: ['محدّث', 'بيانات قديمة', 'غير متاح'],
};
export function announcementStatusLabel(status, locale) {
  return (LABELS[locale] || LABELS.en)[status === 'current' ? 0 : status === 'stale' ? 1 : 2];
}
