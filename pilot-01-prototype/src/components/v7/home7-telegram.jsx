// Home Telegram block (owner 2026-10-10: Telegram must be visible, zh + en channels, bot runs the group).
// Only entries that work today are listed; the English channel and the bot card switch on once their
// handle is set below. The bot runs on CT121 (community poller): fee checks, comparisons, domain verification.
export const TELEGRAM_ENTRIES = Object.freeze({
  channelZh: "https://t.me/NexuAlphaClub",
  group: "https://t.me/NexuAlphaWorld",
  channelEn: null,
  bot: "https://t.me/NexuAlphaAssistantBot",
});

const COPY = {
  en: { h: "Follow us on Telegram", sub: "Exchange announcements, new listings and fee changes, as they happen.", ch: "Chinese channel", chD: "Announcements, campaigns and fee changes", en: "English channel", enD: "The same feed in English", grp: "Community group", grpD: "Ask questions and talk with other traders", bot: "Assistant bot", botD: "Fee checks, exchange comparisons, official-domain checks", go: "Join" },
  "zh-Hans": { h: "在 Telegram 上第一时间收到", sub: "交易所公告、上新和费率变化，第一时间推送给你。", ch: "中文频道", chD: "公告、活动与费率变化推送", en: "英文频道", enD: "同步推送英文版", grp: "交流群", grpD: "提问答疑，和其他交易者交流", bot: "助手机器人", botD: "查费率、比较交易所、核验官方域名", go: "加入" },
  "zh-Hant": { h: "在 Telegram 上第一時間收到", sub: "交易所公告、上新和費率變化，第一時間推送給你。", ch: "中文頻道", chD: "公告、活動與費率變化推送", en: "英文頻道", enD: "同步推送英文版", grp: "交流群", grpD: "提問答疑，和其他交易者交流", bot: "助手機器人", botD: "查費率、比較交易所、核驗官方網域", go: "加入" },
  ja: { h: "Telegram で最新情報を受け取る", sub: "取引所の告知、新規上場、手数料の変更をすぐにお届けします。", ch: "中国語チャンネル", chD: "告知・キャンペーン・手数料変更", en: "英語チャンネル", enD: "同じ内容を英語で配信", grp: "コミュニティ", grpD: "質問やトレーダー同士の交流", bot: "アシスタントBot", botD: "手数料・取引所比較・公式ドメイン確認", go: "参加" },
  ko: { h: "Telegram에서 가장 먼저 받아보세요", sub: "거래소 공지, 신규 상장, 수수료 변경을 바로 알려 드립니다.", ch: "중국어 채널", chD: "공지·이벤트·수수료 변경", en: "영어 채널", enD: "같은 소식을 영어로", grp: "커뮤니티 그룹", grpD: "질문하고 다른 트레이더와 대화", bot: "어시스턴트 봇", botD: "수수료·거래소 비교·공식 도메인 확인", go: "참여" },
  tr: { h: "Telegram'da ilk siz öğrenin", sub: "Borsa duyuruları, yeni listelemeler ve ücret değişiklikleri anında.", ch: "Çince kanal", chD: "Duyurular, kampanyalar ve ücret değişiklikleri", en: "İngilizce kanal", enD: "Aynı akış İngilizce", grp: "Topluluk grubu", grpD: "Soru sorun, diğer yatırımcılarla konuşun", bot: "Asistan bot", botD: "Ücretler, borsa karşılaştırması, resmî alan adı kontrolü", go: "Katıl" },
  es: { h: "Síguenos en Telegram", sub: "Anuncios de exchanges, nuevos listados y cambios de comisiones al momento.", ch: "Canal en chino", chD: "Anuncios, campañas y cambios de comisiones", en: "Canal en inglés", enD: "Las mismas noticias en inglés", grp: "Grupo de la comunidad", grpD: "Pregunta y habla con otros traders", bot: "Bot asistente", botD: "Comisiones, comparativas y verificación de dominios oficiales", go: "Unirse" },
  "pt-BR": { h: "Siga a gente no Telegram", sub: "Anúncios das corretoras, novas listagens e mudanças de taxas na hora.", ch: "Canal em chinês", chD: "Anúncios, campanhas e mudanças de taxas", en: "Canal em inglês", enD: "O mesmo conteúdo em inglês", grp: "Grupo da comunidade", grpD: "Tire dúvidas e converse com outros traders", bot: "Bot assistente", botD: "Taxas, comparações e verificação de domínios oficiais", go: "Entrar" },
  fr: { h: "Suivez-nous sur Telegram", sub: "Annonces des plateformes, nouvelles cotations et changements de frais, en direct.", ch: "Canal en chinois", chD: "Annonces, campagnes et changements de frais", en: "Canal en anglais", enD: "Le même fil en anglais", grp: "Groupe communautaire", grpD: "Posez vos questions, échangez entre traders", bot: "Bot assistant", botD: "Frais, comparatifs et vérification des domaines officiels", go: "Rejoindre" },
  de: { h: "Folgen Sie uns auf Telegram", sub: "Börsenmeldungen, neue Listings und Gebührenänderungen sofort.", ch: "Chinesischer Kanal", chD: "Meldungen, Aktionen und Gebührenänderungen", en: "Englischer Kanal", enD: "Derselbe Feed auf Englisch", grp: "Community-Gruppe", grpD: "Fragen stellen, mit anderen Tradern sprechen", bot: "Assistent-Bot", botD: "Gebühren, Vergleiche und Prüfung offizieller Domains", go: "Beitreten" },
  ru: { h: "Следите за нами в Telegram", sub: "Объявления бирж, новые листинги и изменения комиссий — сразу.", ch: "Китайский канал", chD: "Объявления, акции и изменения комиссий", en: "Английский канал", enD: "Та же лента на английском", grp: "Группа сообщества", grpD: "Задавайте вопросы и общайтесь с трейдерами", bot: "Бот-ассистент", botD: "Комиссии, сравнение бирж, проверка официальных доменов", go: "Вступить" },
  ar: { h: "تابعنا على Telegram", sub: "إعلانات المنصات والإدراجات الجديدة وتغييرات الرسوم فور صدورها.", ch: "القناة الصينية", chD: "الإعلانات والحملات وتغييرات الرسوم", en: "القناة الإنجليزية", enD: "نفس المحتوى بالإنجليزية", grp: "مجموعة المجتمع", grpD: "اطرح أسئلتك وتحدث مع المتداولين", bot: "البوت المساعد", botD: "الرسوم ومقارنة المنصات والتحقق من النطاقات الرسمية", go: "انضم" },
  id: { h: "Ikuti kami di Telegram", sub: "Pengumuman bursa, listing baru, dan perubahan biaya secara langsung.", ch: "Kanal bahasa Mandarin", chD: "Pengumuman, kampanye, dan perubahan biaya", en: "Kanal bahasa Inggris", enD: "Isi yang sama dalam bahasa Inggris", grp: "Grup komunitas", grpD: "Bertanya dan ngobrol dengan trader lain", bot: "Bot asisten", botD: "Biaya, perbandingan bursa, cek domain resmi", go: "Gabung" },
  vi: { h: "Theo dõi chúng tôi trên Telegram", sub: "Thông báo sàn, niêm yết mới và thay đổi phí, cập nhật ngay.", ch: "Kênh tiếng Trung", chD: "Thông báo, sự kiện và thay đổi phí", en: "Kênh tiếng Anh", enD: "Cùng nội dung bằng tiếng Anh", grp: "Nhóm cộng đồng", grpD: "Hỏi đáp và trò chuyện với các trader", bot: "Bot trợ lý", botD: "Phí, so sánh sàn, kiểm tra tên miền chính thức", go: "Tham gia" },
  it: { h: "Seguici su Telegram", sub: "Annunci degli exchange, nuovi listing e cambi di commissioni in tempo reale.", ch: "Canale in cinese", chD: "Annunci, campagne e cambi di commissioni", en: "Canale in inglese", enD: "Lo stesso feed in inglese", grp: "Gruppo della community", grpD: "Fai domande e parla con altri trader", bot: "Bot assistente", botD: "Commissioni, confronti e verifica dei domini ufficiali", go: "Entra" },
};

export const telegramCopy = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);

function PlaneIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M21.6 3.2 2.9 10.4c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.8c.3-1.3-.5-1.9-1.4-1.5ZM8.3 13.2l10.4-6.6c.5-.3.9-.1.6.2l-8.9 8-.3 3.7-1.8-5.3Z" /></svg>;
}

export function TelegramBlock({ locale }) {
  const t = telegramCopy(locale);
  // An English reader sees the English channel first once it exists.
  const zhFirst = String(locale || "").startsWith("zh");
  const channels = [
    TELEGRAM_ENTRIES.channelZh && { key: "zh", href: TELEGRAM_ENTRIES.channelZh, name: t.ch, desc: t.chD, handle: "@NexuAlphaClub" },
    TELEGRAM_ENTRIES.channelEn && { key: "en", href: TELEGRAM_ENTRIES.channelEn, name: t.en, desc: t.enD, handle: `@${TELEGRAM_ENTRIES.channelEn.split("/").pop()}` },
  ].filter(Boolean);
  if (!zhFirst) channels.reverse();
  const cards = [
    ...channels,
    TELEGRAM_ENTRIES.group && { key: "group", href: TELEGRAM_ENTRIES.group, name: t.grp, desc: t.grpD, handle: "@NexuAlphaWorld" },
    TELEGRAM_ENTRIES.bot && { key: "bot", href: `${TELEGRAM_ENTRIES.bot}?start=home`, name: t.bot, desc: t.botD, handle: `@${TELEGRAM_ENTRIES.bot.split("/").pop()}` },
  ].filter(Boolean);
  return (
    <section className="h7-in h7-tg" aria-labelledby="h7-tg-h">
      <div className="h7-ih"><h2 id="h7-tg-h">{t.h}</h2><p>{t.sub}</p></div>
      <ul className="h7-tg-list">
        {cards.map((c) => (
          <li key={c.key}>
            <a className="h7-tg-card" href={c.href} target="_blank" rel="noopener noreferrer" data-cta-kind="telegram" data-cta-placement={`home-v7-telegram-${c.key}`}>
              <span className="h7-tg-ico"><PlaneIcon /></span>
              <span className="h7-tg-txt"><b>{c.name}</b><small>{c.desc}</small><span className="h7-tg-handle" translate="no" dir="ltr">{c.handle}</span></span>
              <span className="h7-tg-go">{t.go} →</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
