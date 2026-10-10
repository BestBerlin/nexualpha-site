// News → sign-up (owner 2026-10-10: a reader of an exchange's news sees that exchange's sign-up with our invite code).
// A small slide-in card, not an interstitial: it appears after the reader is a third into the article, never covers
// the text on phones (bottom bar), closes with one tap and stays closed for the session. Only venues with a real
// invite route are offered; the commission disclosure sits inside the card.
import React, { useEffect, useState } from "react";
import { pickNewsOfferVenue } from "../../../data/news-offer.js";
import { ownerRebateLine } from "../../../data/owner-rebate-line.js";
import { BrandMark } from "../../brand/BrandMark.jsx";
import { CommissionDisclosureLine } from "../CommissionDisclosureLine.jsx";
import "./news-venue-offer.css";

const COPY = {
  en: { lead: (n) => `Trading on ${n}?`, go: (n) => `Sign up on ${n}`, code: "Invite code", copy: "Copy", copied: "Copied ✓", close: "Close", fallback: "Sign up through our partner link" },
  "zh-Hans": { lead: (n) => `准备在 ${n} 交易？`, go: (n) => `前往 ${n} 注册`, code: "邀请码", copy: "复制", copied: "已复制 ✓", close: "关闭", fallback: "通过合作链接注册" },
  "zh-Hant": { lead: (n) => `準備在 ${n} 交易？`, go: (n) => `前往 ${n} 註冊`, code: "邀請碼", copy: "複製", copied: "已複製 ✓", close: "關閉", fallback: "透過合作連結註冊" },
  ja: { lead: (n) => `${n} で取引しますか？`, go: (n) => `${n} に登録`, code: "招待コード", copy: "コピー", copied: "コピーしました ✓", close: "閉じる", fallback: "パートナーリンクから登録" },
  ko: { lead: (n) => `${n}에서 거래하시나요?`, go: (n) => `${n} 가입하기`, code: "초대 코드", copy: "복사", copied: "복사됨 ✓", close: "닫기", fallback: "파트너 링크로 가입" },
  tr: { lead: (n) => `${n} üzerinde mi işlem yapacaksınız?`, go: (n) => `${n}'e kaydol`, code: "Davet kodu", copy: "Kopyala", copied: "Kopyalandı ✓", close: "Kapat", fallback: "Ortak bağlantıyla kaydol" },
  es: { lead: (n) => `¿Vas a operar en ${n}?`, go: (n) => `Regístrate en ${n}`, code: "Código de invitación", copy: "Copiar", copied: "Copiado ✓", close: "Cerrar", fallback: "Regístrate con nuestro enlace de socio" },
  "pt-BR": { lead: (n) => `Vai operar na ${n}?`, go: (n) => `Cadastre-se na ${n}`, code: "Código de convite", copy: "Copiar", copied: "Copiado ✓", close: "Fechar", fallback: "Cadastre-se pelo link de parceiro" },
  fr: { lead: (n) => `Vous tradez sur ${n} ?`, go: (n) => `S’inscrire sur ${n}`, code: "Code d’invitation", copy: "Copier", copied: "Copié ✓", close: "Fermer", fallback: "Inscription via notre lien partenaire" },
  de: { lead: (n) => `Handeln Sie auf ${n}?`, go: (n) => `Bei ${n} registrieren`, code: "Einladungscode", copy: "Kopieren", copied: "Kopiert ✓", close: "Schließen", fallback: "Über unseren Partnerlink registrieren" },
  ru: { lead: (n) => `Торгуете на ${n}?`, go: (n) => `Регистрация на ${n}`, code: "Код приглашения", copy: "Копировать", copied: "Скопировано ✓", close: "Закрыть", fallback: "Регистрация по партнёрской ссылке" },
  ar: { lead: (n) => `هل تتداول على ${n}؟`, go: (n) => `سجّل في ${n}`, code: "رمز الدعوة", copy: "نسخ", copied: "تم النسخ ✓", close: "إغلاق", fallback: "سجّل عبر رابط الشريك" },
  id: { lead: (n) => `Mau trading di ${n}?`, go: (n) => `Daftar di ${n}`, code: "Kode undangan", copy: "Salin", copied: "Tersalin ✓", close: "Tutup", fallback: "Daftar lewat tautan mitra" },
  vi: { lead: (n) => `Bạn giao dịch trên ${n}?`, go: (n) => `Đăng ký ${n}`, code: "Mã mời", copy: "Sao chép", copied: "Đã chép ✓", close: "Đóng", fallback: "Đăng ký qua liên kết đối tác" },
  it: { lead: (n) => `Fai trading su ${n}?`, go: (n) => `Registrati su ${n}`, code: "Codice invito", copy: "Copia", copied: "Copiato ✓", close: "Chiudi", fallback: "Registrati con il nostro link partner" },
};
const copyFor = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
const DISMISS_KEY = "nexu.newsOffer.closed";

export function NewsVenueOffer({ venues, locale = "en", articleSlug }) {
  const t = copyFor(locale);
  const pick = pickNewsOfferVenue(venues, locale);
  const [shown, setShown] = useState(false);
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pick) return undefined;
    try { if (sessionStorage.getItem(DISMISS_KEY)) { setClosed(true); return undefined; } } catch { /* storage blocked: still show */ }
    const onScroll = () => {
      const doc = document.documentElement;
      const progress = (window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1);
      // the reader must actually have scrolled (a short, still-loading page is not "a third read")
      if (window.scrollY > 600 && progress > 0.33) { setShown(true); window.removeEventListener("scroll", onScroll); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pick?.slug]);

  if (!pick || closed) return null;
  const { slug, cta } = pick;
  const name = cta.name || slug;
  const terms = ownerRebateLine(slug, locale, name) || t.fallback;
  const close = () => { setClosed(true); try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } };
  const doCopy = async () => { try { await navigator.clipboard.writeText(cta.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: code stays visible */ } };

  return (
    <aside className={`news-offer${shown ? " is-shown" : ""}`} aria-label={t.lead(name)} {...(shown ? {} : { inert: "", "aria-hidden": "true" })} data-offer-venue={slug}>
      <button type="button" className="news-offer__close" onClick={close} aria-label={t.close}>×</button>
      <div className="news-offer__head">
        <BrandMark slug={slug} compact />
        <div><b>{t.lead(name)}</b><small>{terms}</small></div>
      </div>
      {cta.inviteCode && (
        <div className="news-offer__code"><span>{t.code}</span><code translate="no">{cta.inviteCode}</code><button type="button" onClick={doCopy} aria-live="polite">{copied ? t.copied : t.copy}</button></div>
      )}
      <a className="news-offer__go" href={cta.registrationUrl} target="_blank" rel="sponsored noopener noreferrer"
        data-cta-kind="registration" data-cta-platform={slug} data-cta-placement={`news-offer-${articleSlug || "article"}`} data-cta-code={cta.inviteCode || undefined}>
        {t.go(name)} →
      </a>
      <CommissionDisclosureLine locale={locale} className="news-offer__ad" placement="news-offer" />
    </aside>
  );
}

export default NewsVenueOffer;
