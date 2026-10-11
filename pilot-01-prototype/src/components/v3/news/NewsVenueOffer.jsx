// News → sign-up (owner 2026-10-10): a reader of an exchange's news sees that exchange's sign-up with our invite code.
// Owner placement: under the article, in the side rail on desktop, and (where there is no rail, i.e. phones and
// tablets) a light card that slides in after 15 seconds of reading (never an interstitial; one tap closes it for the session; skipped while the inline card is on screen).
// Only venues with a real invite route are offered; the commission disclosure is inside every card.
import React, { useEffect, useRef, useState } from "react";
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

 // l10n: needs native review
 ur: {lead:(n)=>`${n} پر تجارت کرتے ہیں؟`,go:(n)=>`${n} پر رجسٹر کریں`,code:"دعوتی کوڈ",copy:"کاپی",copied:"کاپی ہو گیا ✓",close:"بند کریں",fallback:"ہمارے شراکتی لنک سے رجسٹر کریں"},
 // l10n: needs native review
 uk: {lead:(n)=>`Торгуєте на ${n}?`,go:(n)=>`Зареєструватися на ${n}`,code:"Код запрошення",copy:"Копіювати",copied:"Скопійовано ✓",close:"Закрити",fallback:"Зареєструватися через наше партнерське посилання"},
};
const copyFor = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
const DISMISS_KEY = "nexu.newsOffer.closed";
const READ_DELAY_MS = 15000;

function OfferBody({ slug, cta, locale, t, placement }) {
  const [copied, setCopied] = useState(false);
  const name = cta.name || slug;
  const terms = ownerRebateLine(slug, locale, name) || t.fallback;
  const doCopy = async () => { try { await navigator.clipboard.writeText(cta.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ } };
  return (
    <>
      <div className="news-offer__head">
        <span className="news-offer__logo"><BrandMark slug={slug} compact /></span>
        <div><b>{t.lead(name)}</b><small>{terms}</small></div>
      </div>
      <div className="news-offer__act">
        {cta.inviteCode && (
          <div className="news-offer__code"><span>{t.code}</span><code translate="no">{cta.inviteCode}</code><button type="button" onClick={doCopy} aria-live="polite">{copied ? t.copied : t.copy}</button></div>
        )}
        <a className="news-offer__go" href={cta.registrationUrl} target="_blank" rel="sponsored noopener noreferrer"
          data-cta-kind="registration" data-cta-platform={slug} data-cta-placement={placement} data-cta-code={cta.inviteCode || undefined}>
          {t.go(name)} <span aria-hidden="true">→</span>
        </a>
      </div>
      <CommissionDisclosureLine locale={locale} className="news-offer__ad" placement={placement} />
    </>
  );
}

/** variant: "inline" (under the article), "rail" (desktop side rail), "timed" (slides in after 15 s of reading). */
export function NewsVenueOffer({ venues, locale = "en", market, articleSlug, variant = "inline" }) {
  const t = copyFor(locale);
  const pick = pickNewsOfferVenue(venues, locale, market);
  const [shown, setShown] = useState(false);
  const [closed, setClosed] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (variant !== "timed" || !pick) return undefined;
    try { if (sessionStorage.getItem(DISMISS_KEY)) return undefined; } catch { /* storage blocked: still offer */ }
    // Count only time the page is visible; wait while the inline card is already on screen.
    let left = READ_DELAY_MS, started = Date.now();
    const fire = () => {
      // Desktop already shows the side-rail card: no second, floating one.
      const rail = document.querySelector(".news-offer--rail");
      if (rail && getComputedStyle(rail).display !== "none") return;
      const r = document.querySelector(".news-offer--inline")?.getBoundingClientRect();
      if (r && r.top < window.innerHeight && r.bottom > 0) { timer.current = setTimeout(fire, 4000); return; }
      setShown(true);
    };
    const arm = () => { started = Date.now(); timer.current = setTimeout(fire, left); };
    const onVis = () => {
      if (document.visibilityState === "hidden") { clearTimeout(timer.current); left = Math.max(0, left - (Date.now() - started)); }
      else arm();
    };
    arm();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearTimeout(timer.current); document.removeEventListener("visibilitychange", onVis); };
  }, [variant, pick?.slug]);

  if (!pick) return null;
  const label = t.lead(pick.cta.name || pick.slug);
  const placement = `news-offer-${variant}-${articleSlug || "article"}`;
  if (variant !== "timed") {
    return (
      <aside className={`news-offer news-offer--${variant}`} aria-label={label} data-offer-venue={pick.slug}>
        <OfferBody slug={pick.slug} cta={pick.cta} locale={locale} t={t} placement={placement} />
      </aside>
    );
  }
  if (closed) return null;
  const close = () => { setClosed(true); try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } };
  return (
    <aside className={`news-offer news-offer--timed${shown ? " is-shown" : ""}`} aria-label={label} {...(shown ? {} : { inert: true, "aria-hidden": "true" })} data-offer-venue={pick.slug}>
      <button type="button" className="news-offer__close" onClick={close} aria-label={t.close}>×</button>
      <OfferBody slug={pick.slug} cta={pick.cta} locale={locale} t={t} placement={placement} />
    </aside>
  );
}

export default NewsVenueOffer;
