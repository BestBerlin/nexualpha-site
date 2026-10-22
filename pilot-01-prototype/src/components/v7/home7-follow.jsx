// "Follow NexuAlpha" band (owner 2026-10-23: X and YouTube were invisible, Telegram not pushed hard enough). Sits right
// under the Telegram block in the lazy below-the-fold chunk (home7-below.jsx): pure markup, no state, no effects.
// Links come from src/data/brand-social.js (re-exported by brand-entity.js); Chinese pages get @NexuAlphaCN and
// @NexuAlphaClub. Copy is information only (no rebate or sign-up wording), so neutral locales share the same tone.
import { socialLinksFor } from "../../data/brand-social.js";
import { TelegramGlyph, XGlyph, YouTubeGlyph } from "../shared/SocialIcons.jsx";

// [heading, sub, telegram [value, cta], x [value, cta], youtube [value, cta]]
const COPY = {
  en: ["Follow NexuAlpha", "Fee changes, exchange campaigns and market moves, wherever you read.", ["Real-time alerts and campaign notices as they land", "Join channel"], ["Quick market takes and fee changes", "Follow"], ["Short videos on fees, exchanges and markets", "Watch"]],
  "zh-Hans": ["关注 NexuAlpha", "手续费变化、交易所活动和行情异动，在你常用的平台第一时间看到。", ["实时提醒，活动上线即推送", "加入频道"], ["行情观点与费率变化速览", "关注"], ["手续费、交易所与行情的视频讲解", "观看视频"]],
  "zh-Hant": ["關注 NexuAlpha", "手續費變化、交易所活動與行情異動，在你常用的平台第一時間看到。", ["即時提醒，活動上線即推送", "加入頻道"], ["行情觀點與費率變化速覽", "關注"], ["手續費、交易所與行情的影片講解", "觀看影片"]],
  es: ["Sigue a NexuAlpha", "Cambios de comisiones, campañas de exchanges y movimientos del mercado, donde prefieras leer.", ["Alertas en tiempo real y avisos de campañas al momento", "Unirse al canal"], ["Lecturas rápidas del mercado y cambios de comisiones", "Seguir"], ["Vídeos cortos sobre comisiones, exchanges y mercado", "Ver vídeos"]],
  "pt-BR": ["Siga a NexuAlpha", "Mudanças de taxas, campanhas de exchanges e movimentos do mercado, onde você preferir.", ["Alertas em tempo real e avisos de campanhas na hora", "Entrar no canal"], ["Leituras rápidas do mercado e mudanças de taxas", "Seguir"], ["Vídeos curtos sobre taxas, exchanges e mercado", "Assistir"]],
  fr: ["Suivez NexuAlpha", "Changements de frais, campagnes des plateformes et mouvements du marché, là où vous lisez.", ["Alertes en temps réel et campagnes dès leur sortie", "Rejoindre"], ["Lectures rapides du marché et changements de frais", "Suivre"], ["Vidéos courtes sur les frais, les plateformes et le marché", "Regarder"]],
  de: ["NexuAlpha folgen", "Gebührenänderungen, Börsenaktionen und Marktbewegungen – dort, wo Sie lesen.", ["Echtzeit-Alerts und Aktionen, sobald sie live sind", "Kanal beitreten"], ["Kurze Markteinschätzungen und Gebührenänderungen", "Folgen"], ["Kurze Videos zu Gebühren, Börsen und Markt", "Ansehen"]],
  it: ["Segui NexuAlpha", "Variazioni delle commissioni, campagne degli exchange e movimenti di mercato, dove preferisci.", ["Avvisi in tempo reale e campagne appena escono", "Unisciti"], ["Letture rapide del mercato e variazioni delle commissioni", "Segui"], ["Brevi video su commissioni, exchange e mercato", "Guarda"]],
  ja: ["NexuAlpha をフォロー", "手数料の変更、取引所キャンペーン、相場の動きを、いつものアプリで。", ["リアルタイムのアラートとキャンペーン速報", "チャンネルに参加"], ["相場の見方と手数料変更をすばやく", "フォロー"], ["手数料・取引所・相場を短い動画で解説", "動画を見る"]],
  ko: ["NexuAlpha 팔로우", "수수료 변경, 거래소 이벤트, 시장 움직임을 늘 쓰는 앱에서 받아 보세요.", ["실시간 알림과 이벤트 소식을 바로", "채널 참여"], ["시장 관점과 수수료 변경을 빠르게", "팔로우"], ["수수료·거래소·시장 짧은 영상 해설", "영상 보기"]],
  tr: ["NexuAlpha'yı takip edin", "Komisyon değişiklikleri, borsa kampanyaları ve piyasa hareketleri, nerede okursanız.", ["Anlık uyarılar ve kampanya duyuruları", "Kanala katıl"], ["Kısa piyasa yorumları ve komisyon değişiklikleri", "Takip et"], ["Komisyonlar, borsalar ve piyasa üzerine kısa videolar", "İzle"]],
  ru: ["Подписывайтесь на NexuAlpha", "Изменения комиссий, акции бирж и движения рынка — там, где вам удобно.", ["Уведомления в реальном времени и новости об акциях", "Подписаться"], ["Короткие обзоры рынка и изменения комиссий", "Читать"], ["Короткие видео о комиссиях, биржах и рынке", "Смотреть"]],
  ar: ["تابع NexuAlpha", "تغييرات الرسوم وحملات المنصات وتحركات السوق، أينما تقرأ.", ["تنبيهات فورية وإشعارات الحملات فور صدورها", "انضم إلى القناة"], ["قراءات سريعة للسوق وتغييرات الرسوم", "تابِع"], ["فيديوهات قصيرة عن الرسوم والمنصات والسوق", "شاهد"]],
  id: ["Ikuti NexuAlpha", "Perubahan biaya, kampanye bursa, dan pergerakan pasar, di tempat kamu biasa membaca.", ["Peringatan real-time dan info kampanye begitu rilis", "Gabung kanal"], ["Pandangan pasar singkat dan perubahan biaya", "Ikuti"], ["Video singkat tentang biaya, bursa, dan pasar", "Tonton"]],
  vi: ["Theo dõi NexuAlpha", "Thay đổi phí, sự kiện sàn và biến động thị trường, ở nơi bạn hay đọc.", ["Cảnh báo theo thời gian thực và tin sự kiện ngay khi có", "Tham gia kênh"], ["Nhận định thị trường ngắn và thay đổi phí", "Theo dõi"], ["Video ngắn về phí, sàn giao dịch và thị trường", "Xem video"]],
  // l10n: needs native review
  ur: ["NexuAlpha کو فالو کریں", "فیس میں تبدیلیاں، ایکسچینج مہمات اور مارکیٹ کی حرکت، جہاں آپ پڑھتے ہیں۔", ["فوری الرٹس اور مہمات کی اطلاعات", "چینل میں شامل ہوں"], ["مارکیٹ پر مختصر رائے اور فیس میں تبدیلیاں", "فالو کریں"], ["فیس، ایکسچینجز اور مارکیٹ پر مختصر ویڈیوز", "دیکھیں"]],
  uk: ["Стежте за NexuAlpha", "Зміни комісій, акції бірж і рух ринку — там, де вам зручно.", ["Сповіщення в реальному часі та новини про акції", "Приєднатися"], ["Короткі огляди ринку та зміни комісій", "Стежити"], ["Короткі відео про комісії, біржі та ринок", "Дивитися"]],
};
export const FOLLOW_BAND_COPY = COPY;
export const followBandCopy = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);

export function FollowBand({ locale }) {
  const [heading, sub, tg, x, yt] = followBandCopy(locale);
  const links = socialLinksFor(locale);
  const cards = [
    { key: "telegram", name: "Telegram", href: links.telegramChannel, handle: links.handles.telegramChannel, value: tg[0], cta: tg[1], Glyph: TelegramGlyph, kind: "telegram" },
    { key: "x", name: "X", href: links.x, handle: links.handles.x, value: x[0], cta: x[1], Glyph: XGlyph, kind: "social" },
    { key: "youtube", name: "YouTube", href: links.youtube, handle: links.handles.youtube, value: yt[0], cta: yt[1], Glyph: YouTubeGlyph, kind: "social" },
  ];
  return (
    <section className="h7-in h7-follow" aria-labelledby="h7-follow-h" data-home-follow="">
      <div className="h7-follow-head"><h2 id="h7-follow-h">{heading}</h2><p>{sub}</p></div>
      <ul className="h7-follow-list">
        {cards.map(({ key, name, href, handle, value, cta, Glyph, kind }) => (
          <li key={key}>
            <a className={`h7-follow-card h7-follow-card--${key}`} href={href} target="_blank" rel="noopener" data-cta-kind={kind} data-cta-placement={`home-follow-${key}`}>
              <span className="h7-follow-ico"><Glyph size={20} /></span>
              <span className="h7-follow-txt"><b>{name}</b><span className="h7-follow-handle" translate="no" dir="ltr">{handle}</span><small>{value}</small></span>
              <span className="h7-follow-go">{cta} <span className="h7-follow-arrow" aria-hidden="true">→</span></span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
