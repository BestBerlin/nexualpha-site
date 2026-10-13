// Backup sign-up links for regions where the official exchange domain does not open (owner 2026-10-13):
// /go/<venue>-alt redirects to the venue's mirror registration link with the same invite code. The server health-checks
// the mirror and falls back to the official registration URL with the code when the mirror does not answer 2xx/3xx.
// Shown only next to a primary sign-up button in promotable locales; rel="nofollow sponsored"; never in the sitemap.
// URLs are picked from the partner registry's alternates, never typed here.
import { partnerRegistry } from "./partner-registry.js";

const MIRROR_HOSTS = Object.freeze({ binance: "www.bsmkweb.cc", okx: "www.topzhjdgxcb.net", bitget: "partner.bitget.com" });

function pickMirror(venue) {
  const partner = partnerRegistry[venue];
  const host = MIRROR_HOSTS[venue];
  if (!partner?.hasReferral || !host || !partner.inviteCode) return null;
  const code = String(partner.inviteCode);
  const alternates = (partner.alternateRegistrationUrls || []).map((href) => { try { return new URL(href); } catch { return null; } })
    .filter((url) => url?.hostname === host);
  if (venue === "binance") return alternates.find((url) => url.searchParams.get("ref") === code && [...url.searchParams.keys()].length === 1)?.href || null;
  if (venue === "bitget") return alternates[0]?.href || null;
  if (venue === "okx") {
    // Owner 2026-10-13: the OKX primary code (registry inviteCode) is valid on the mirror domain too, written upper case.
    const existing = alternates.find((url) => url.pathname.toLowerCase() === `/join/${code.toLowerCase()}`);
    if (existing) return existing.href;
    return alternates.length ? `https://${host}/join/${code.toUpperCase()}` : null;
  }
  return null;
}

/** Venue -> mirror registration URL carrying the registry code. */
export const BACKUP_SIGNUP_URLS = Object.freeze(Object.fromEntries(Object.keys(MIRROR_HOSTS)
  .map((venue) => [venue, pickMirror(venue)]).filter(([, href]) => href)));

export const backupSignupSlug = (venue) => (BACKUP_SIGNUP_URLS[venue] ? `${venue}-alt` : null);

/** /go/<venue>-alt for a venue with a mirror (null otherwise). */
export function backupSignupHref(venue, { src } = {}) {
  const slug = backupSignupSlug(venue);
  if (!slug) return null;
  return src ? `/go/${slug}?src=${encodeURIComponent(src)}` : `/go/${slug}`;
}

/** Venue of a /go/<venue>-alt slug, or null. */
export function backupSignupVenue(slug) {
  const match = /^([a-z0-9-]+)-alt$/.exec(String(slug || ""));
  return match && BACKUP_SIGNUP_URLS[match[1]] ? match[1] : null;
}

export const BACKUP_SIGNUP_COPY = Object.freeze({
  "zh-Hans": "官网打不开？用备用注册链接",
  en: "Can't open the site? Use the backup link",
  es: "¿No abre la web oficial? Usa el enlace alternativo",
  "pt-BR": "O site oficial não abre? Use o link alternativo",
  fr: "Le site officiel ne s'ouvre pas ? Utilisez le lien de secours",
  de: "Offizielle Seite lädt nicht? Nutze den Ersatzlink",
  ja: "公式サイトが開けない場合は予備リンクへ",
  ko: "공식 사이트가 열리지 않나요? 예비 링크를 사용하세요",
  tr: "Resmi site açılmıyor mu? Yedek bağlantıyı kullanın",
  id: "Situs resmi tidak bisa dibuka? Pakai tautan cadangan",
  it: "Il sito ufficiale non si apre? Usa il link di riserva",
});
export const backupSignupLabel = (locale) => BACKUP_SIGNUP_COPY[locale] || BACKUP_SIGNUP_COPY.en;
