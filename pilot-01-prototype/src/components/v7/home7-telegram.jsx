// Home Telegram block (owner 2026-10-10: Telegram must be visible, zh + en channels, bot runs the group).
// Public channels: zh @NexuAlphaClub, en @NexuAlphaGlobal, ru @NexuAlphaRU (tr / vi channels are private, not listed).
// The bot card sells what subscribers get today: custom /alert rules and the 21:00 SGT daily digest.
export const TELEGRAM_ENTRIES = Object.freeze({
  channelZh: "https://t.me/NexuAlphaClub",
  group: "https://t.me/NexuAlphaWorld",
  channelEn: "https://t.me/NexuAlphaGlobal",
  channelRu: "https://t.me/NexuAlphaRU",
  bot: "https://t.me/NexuAlphaAssistantBot",
});

const COPY = {
  en: { h: "Follow us on Telegram", sub: "Set your own price and liquidation alerts, get a daily digest at 21:00 SGT and catch exchange campaigns first.", ch: "Chinese channel", chD: "Campaigns, listings and a Monday tool of the week", en: "English channel", enD: "The same feed in English", ruc: "Russian channel", rucD: "The same feed in Russian", grp: "Community group", grpD: "Ask questions and talk with other traders", bot: "Assistant bot", botD: "Custom alerts like /alert btc > 70000, plus the 21:00 SGT digest", go: "Join" },
  "zh-Hans": { h: "在 Telegram 上第一时间收到", sub: "自定义价格和爆仓提醒，每天 21:00 SGT 收到简报，交易所活动第一时间知道。", ch: "中文频道", chD: "交易所活动、上新和每周一的本周工具", en: "英文频道", enD: "同步推送英文版", ruc: "俄语频道", rucD: "同步推送俄语版", grp: "交流群", grpD: "提问答疑，和其他交易者交流", bot: "助手机器人", botD: "自定义提醒（如 /alert btc > 70000）和 21:00 SGT 每日简报", go: "加入" },
  "zh-Hant": { h: "在 Telegram 上第一時間收到", sub: "自訂價格和爆倉提醒，每天 21:00 SGT 收到簡報，交易所活動第一時間知道。", ch: "中文頻道", chD: "交易所活動、上新和每週一的本週工具", en: "英文頻道", enD: "同步推送英文版", ruc: "俄語頻道", rucD: "同步推送俄語版", grp: "交流群", grpD: "提問答疑，和其他交易者交流", bot: "助手機器人", botD: "自訂提醒（如 /alert btc > 70000）和 21:00 SGT 每日簡報", go: "加入" },
  ja: { h: "Telegram で最新情報を受け取る", sub: "価格や清算のアラートを自分で設定、毎日 21:00 SGT にダイジェスト、取引所キャンペーンもいち早く。", ch: "中国語チャンネル", chD: "キャンペーン、新規上場、月曜の今週のツール", en: "英語チャンネル", enD: "同じ内容を英語で配信", ruc: "ロシア語チャンネル", rucD: "同じ内容をロシア語で配信", grp: "コミュニティ", grpD: "質問やトレーダー同士の交流", bot: "アシスタントBot", botD: "/alert btc > 70000 などのカスタムアラートと 21:00 SGT のダイジェスト", go: "参加" },
  ko: { h: "Telegram에서 가장 먼저 받아보세요", sub: "가격·청산 알림을 직접 설정하고, 매일 21:00 SGT 다이제스트를 받고, 거래소 이벤트를 가장 먼저 확인하세요.", ch: "중국어 채널", chD: "이벤트, 신규 상장, 월요일 이번 주 도구", en: "영어 채널", enD: "같은 소식을 영어로", ruc: "러시아어 채널", rucD: "같은 소식을 러시아어로", grp: "커뮤니티 그룹", grpD: "질문하고 다른 트레이더와 대화", bot: "어시스턴트 봇", botD: "/alert btc > 70000 같은 맞춤 알림과 21:00 SGT 다이제스트", go: "참여" },
  tr: { h: "Telegram'da ilk siz öğrenin", sub: "Kendi fiyat ve tasfiye uyarılarını kur, her gün 21:00 SGT'de özet al, borsa kampanyalarını ilk sen gör.", ch: "Çince kanal", chD: "Kampanyalar, listelemeler ve pazartesi haftanın aracı", en: "İngilizce kanal", enD: "Aynı akış İngilizce", ruc: "Rusça kanal", rucD: "Aynı akış Rusça", grp: "Topluluk grubu", grpD: "Soru sorun, diğer yatırımcılarla konuşun", bot: "Asistan bot", botD: "/alert btc > 70000 gibi kişisel uyarılar ve 21:00 SGT özeti", go: "Katıl" },
  es: { h: "Síguenos en Telegram", sub: "Crea tus propias alertas de precio y liquidaciones, recibe un resumen diario a las 21:00 SGT y entérate primero de las campañas.", ch: "Canal en chino", chD: "Campañas, listados y la herramienta de la semana cada lunes", en: "Canal en inglés", enD: "Las mismas noticias en inglés", ruc: "Canal en ruso", rucD: "Las mismas noticias en ruso", grp: "Grupo de la comunidad", grpD: "Pregunta y habla con otros traders", bot: "Bot asistente", botD: "Alertas a tu medida como /alert btc > 70000 y el resumen de las 21:00 SGT", go: "Unirse" },
  "pt-BR": { h: "Siga a gente no Telegram", sub: "Crie seus alertas de preço e liquidação, receba um resumo diário às 21:00 SGT e veja as campanhas primeiro.", ch: "Canal em chinês", chD: "Campanhas, listagens e a ferramenta da semana às segundas", en: "Canal em inglês", enD: "O mesmo conteúdo em inglês", ruc: "Canal em russo", rucD: "O mesmo conteúdo em russo", grp: "Grupo da comunidade", grpD: "Tire dúvidas e converse com outros traders", bot: "Bot assistente", botD: "Alertas personalizados como /alert btc > 70000 e o resumo das 21:00 SGT", go: "Entrar" },
  fr: { h: "Suivez-nous sur Telegram", sub: "Créez vos alertes de prix et de liquidations, recevez un point quotidien à 21:00 SGT et voyez les campagnes en premier.", ch: "Canal en chinois", chD: "Campagnes, listings et l’outil de la semaine le lundi", en: "Canal en anglais", enD: "Le même fil en anglais", ruc: "Canal en russe", rucD: "Le même fil en russe", grp: "Groupe communautaire", grpD: "Posez vos questions, échangez entre traders", bot: "Bot assistant", botD: "Alertes sur mesure comme /alert btc > 70000 et le point de 21:00 SGT", go: "Rejoindre" },
  de: { h: "Folgen Sie uns auf Telegram", sub: "Eigene Preis- und Liquidationsalarme, ein tägliches Briefing um 21:00 SGT und Börsenaktionen zuerst.", ch: "Chinesischer Kanal", chD: "Aktionen, Listings und montags das Tool der Woche", en: "Englischer Kanal", enD: "Derselbe Feed auf Englisch", ruc: "Russischer Kanal", rucD: "Derselbe Feed auf Russisch", grp: "Community-Gruppe", grpD: "Fragen stellen, mit anderen Tradern sprechen", bot: "Assistent-Bot", botD: "Eigene Alarme wie /alert btc > 70000 und das Briefing um 21:00 SGT", go: "Beitreten" },
  ru: { h: "Следите за нами в Telegram", sub: "Свои уведомления о ценах и ликвидациях, ежедневная сводка в 21:00 SGT и акции бирж — раньше всех.", ch: "Китайский канал", chD: "Акции, листинги и инструмент недели по понедельникам", en: "Английский канал", enD: "Та же лента на английском", ruc: "Русский канал", rucD: "Новости, листинги и акции на русском", grp: "Группа сообщества", grpD: "Задавайте вопросы и общайтесь с трейдерами", bot: "Бот-ассистент", botD: "Свои уведомления вроде /alert btc > 70000 и сводка в 21:00 SGT", go: "Вступить" },
  ar: { h: "تابعنا على Telegram", sub: "أنشئ تنبيهات الأسعار والتصفية الخاصة بك، واحصل على موجز يومي في 21:00 SGT، واعرف حملات المنصات أولًا.", ch: "القناة الصينية", chD: "الحملات والإدراجات وأداة الأسبوع كل اثنين", en: "القناة الإنجليزية", enD: "نفس المحتوى بالإنجليزية", ruc: "القناة الروسية", rucD: "نفس المحتوى بالروسية", grp: "مجموعة المجتمع", grpD: "اطرح أسئلتك وتحدث مع المتداولين", bot: "البوت المساعد", botD: "تنبيهات مخصصة مثل /alert btc > 70000 وموجز 21:00 SGT", go: "انضم" },
  id: { h: "Ikuti kami di Telegram", sub: "Atur peringatan harga dan likuidasi sendiri, dapatkan ringkasan harian pukul 21:00 SGT, dan tahu kampanye bursa lebih dulu.", ch: "Kanal bahasa Mandarin", chD: "Kampanye, listing, dan alat minggu ini tiap Senin", en: "Kanal bahasa Inggris", enD: "Isi yang sama dalam bahasa Inggris", ruc: "Kanal bahasa Rusia", rucD: "Isi yang sama dalam bahasa Rusia", grp: "Grup komunitas", grpD: "Bertanya dan ngobrol dengan trader lain", bot: "Bot asisten", botD: "Peringatan kustom seperti /alert btc > 70000 dan ringkasan 21:00 SGT", go: "Gabung" },
  vi: { h: "Theo dõi chúng tôi trên Telegram", sub: "Tự đặt cảnh báo giá và thanh lý, nhận bản tin hằng ngày lúc 21:00 SGT và biết sự kiện sàn sớm nhất.", ch: "Kênh tiếng Trung", chD: "Sự kiện, niêm yết và công cụ của tuần mỗi thứ Hai", en: "Kênh tiếng Anh", enD: "Cùng nội dung bằng tiếng Anh", ruc: "Kênh tiếng Nga", rucD: "Cùng nội dung bằng tiếng Nga", grp: "Nhóm cộng đồng", grpD: "Hỏi đáp và trò chuyện với các trader", bot: "Bot trợ lý", botD: "Cảnh báo tùy chỉnh như /alert btc > 70000 và bản tin 21:00 SGT", go: "Tham gia" },
  it: { h: "Seguici su Telegram", sub: "Crea i tuoi avvisi su prezzi e liquidazioni, ricevi un riepilogo alle 21:00 SGT e scopri per primo le campagne.", ch: "Canale in cinese", chD: "Campagne, listing e lo strumento della settimana il lunedì", en: "Canale in inglese", enD: "Lo stesso feed in inglese", ruc: "Canale in russo", rucD: "Lo stesso feed in russo", grp: "Gruppo della community", grpD: "Fai domande e parla con altri trader", bot: "Bot assistente", botD: "Avvisi personalizzati come /alert btc > 70000 e il riepilogo delle 21:00 SGT", go: "Entra" },
  // l10n: needs native review
  ur: { h: "Telegram پر ہمیں فالو کریں", sub: "قیمت اور لیکویڈیشن کے اپنے الرٹس بنائیں، روزانہ 21:00 SGT پر خلاصہ پائیں اور ایکسچینج مہمات سب سے پہلے جانیں۔", ch: "چینی چینل", chD: "مہمات، لسٹنگز اور پیر کو ہفتے کا ٹول", en: "انگریزی چینل", enD: "وہی فیڈ انگریزی میں", ruc: "روسی چینل", rucD: "وہی فیڈ روسی میں", grp: "کمیونٹی گروپ", grpD: "سوال پوچھیں اور دوسرے ٹریڈرز سے بات کریں", bot: "معاون بوٹ", botD: "/alert btc > 70000 جیسے اپنے الرٹس اور 21:00 SGT کا خلاصہ", go: "شامل ہوں" },
  // l10n: needs native review
  uk: { h: "Стежте за нами в Telegram", sub: "Власні сповіщення про ціни й ліквідації, щоденний дайджест о 21:00 SGT і кампанії бірж першими.", ch: "Китайський канал", chD: "Кампанії, лістинги й інструмент тижня щопонеділка", en: "Англійський канал", enD: "Та сама стрічка англійською", ruc: "Російський канал", rucD: "Та сама стрічка російською", grp: "Спільнота", grpD: "Ставте запитання й спілкуйтеся з іншими трейдерами", bot: "Бот-помічник", botD: "Власні сповіщення на кшталт /alert btc > 70000 і дайджест о 21:00 SGT", go: "Приєднатися" },
};

export const telegramCopy = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);

function PlaneIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M21.6 3.2 2.9 10.4c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.8c.3-1.3-.5-1.9-1.4-1.5ZM8.3 13.2l10.4-6.6c.5-.3.9-.1.6.2l-8.9 8-.3 3.7-1.8-5.3Z" /></svg>;
}

export function TelegramBlock({ locale }) {
  const t = telegramCopy(locale);
  // Two channel cards keep the four-card grid: the reader's own-language channel first (zh, ru, otherwise en), then
  // English (or Chinese for an English reader).
  const zhFirst = String(locale || "").startsWith("zh");
  const zh = TELEGRAM_ENTRIES.channelZh && { key: "zh", href: TELEGRAM_ENTRIES.channelZh, name: t.ch, desc: t.chD, handle: "@NexuAlphaClub" };
  const en = TELEGRAM_ENTRIES.channelEn && { key: "en", href: TELEGRAM_ENTRIES.channelEn, name: t.en, desc: t.enD, handle: `@${TELEGRAM_ENTRIES.channelEn.split("/").pop()}` };
  const ru = TELEGRAM_ENTRIES.channelRu && { key: "ru", href: TELEGRAM_ENTRIES.channelRu, name: t.ruc, desc: t.rucD, handle: `@${TELEGRAM_ENTRIES.channelRu.split("/").pop()}` };
  const channels = (zhFirst ? [zh, en] : locale === "ru" ? [ru, en] : [en, zh]).filter(Boolean);
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
              <span className="h7-tg-go">{t.go} <span className="h7-tg-arrow" aria-hidden="true">→</span></span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
