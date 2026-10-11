// Brazil BCB virtual-asset authorization deadline (owner plan 2026-10-12): per-exchange status in Brazil and the short
// notice shown on /pt-br/exchanges pages. Small on purpose: the venue and directory chunks import it; the article copy
// lives in brazil-vasp-deadline.js (topic route chunk only).
//
// Rules: a status comes only from the exchange's own official page or from a Banco Central do Brasil page, with the
// source URL and the source's date. No official statement found -> "unknown" (rendered "não confirmado" in pt-BR).
// Never inferred from press or aggregator coverage. An exchange whose status is "leaving" gets no partner CTA.
import { brazilDeadlinePathFor } from "./brazil-vasp-deadline-slugs.js";
import { localizedHref } from "./locale-routing.js";

export const BRAZIL_DEADLINE_DATE = "2026-10-30";
export const BRAZIL_DEADLINE_REVIEWED_AT = "2026-10-12";

export const BRAZIL_STATUS_KEYS = Object.freeze(["authorized", "applied", "migrating", "leaving", "unknown"]);

// Checked 2026-10-12. "unknown" = neither the exchange nor the BCB has published a filing or an authorization.
// None of these exchanges appears under its own name in the BCB open-data list of pending authorization requests
// (https://dadosabertos.bcb.gov.br/dataset/processos-de-autorizacao, data as of 2026-09-30); that file does not show
// October filings or filings under another company name. Secondary press (Valor, Decrypt, aggregators) is not used.
const row = (slug, name, status, source, sourceDate, sourceLabel, note) => Object.freeze({ slug, name, status, source, sourceDate, sourceLabel, note: Object.freeze(note), profile: `/exchanges/${slug}`, checkedOn: BRAZIL_DEADLINE_REVIEWED_AT });
export const BRAZIL_VASP_STATUS = Object.freeze([
  row("okx", "OKX", "unknown", "https://www.okx.com/pt-br/help/a-okx-e-uma-corretora-cripto-brasileira", "2026-08-11", "OKX (pt-BR help)", {
    en: "OKX says Brazilian residents are served by OKX Serviços Digitais Ltda. (CNPJ 50.459.025/0001-26). It has not published whether it filed for BCB authorization.",
    "pt-BR": "A OKX informa que residentes no Brasil são atendidos pela OKX Serviços Digitais Ltda. (CNPJ 50.459.025/0001-26). Não publicou se pediu autorização ao BCB.",
  }),
  row("binance", "Binance", "unknown", "https://www.binance.com/pt-BR/blog/all/binance-alcan%C3%A7a-21%C2%BA-marco-regulat%C3%B3rio-global--com-licen%C3%A7a-de-corretora-no-brasil-1902140086083321430", "2025-01-02", "Binance blog", {
    en: "Binance says the BCB approved its purchase of the broker Sim;paul (securities distribution and e-money licences). That is a different licence; no statement on a filing under Resolution 520 found.",
    "pt-BR": "A Binance informa que o BCB aprovou a compra da corretora Sim;paul (licenças de distribuição de valores e moeda eletrônica). É outra licença; não encontramos declaração sobre pedido pela Resolução 520.",
  }),
  row("bybit", "Bybit", "unknown", "https://announcements.bybit.com/en/article/important-update-for-bybit-users-in-brazil--art1501e51cfacf/", "2026-07-20", "Bybit announcement", {
    en: "Bybit published “Important update for Bybit users in Brazil” on 20 Jul 2026, but the page refused our access, so its content is not summarized here. Read it on Bybit's site.",
    "pt-BR": "A Bybit publicou “Important update for Bybit users in Brazil” em 20/07/2026, mas a página recusou nosso acesso, então o conteúdo não é resumido aqui. Leia no site da Bybit.",
  }),
  row("bitget", "Bitget", "unknown", "https://www.bitget.com/promotion/regulatory-license", null, "Bitget licences", {
    en: "Bitget's licence page names no Brazilian authorization. No Brazil statement found.",
    "pt-BR": "A página de licenças da Bitget não cita autorização no Brasil. Nenhuma declaração sobre o Brasil encontrada.",
  }),
  row("mexc", "MEXC", "unknown", "https://www.mexc.com/learn/article/mexc-restricted-countries-complete-list-of-prohibited-limited-regions/1", "2026-10-08", "MEXC restricted regions", {
    en: "MEXC's restricted-regions article does not name Brazil. No statement on a BCB filing found.",
    "pt-BR": "O artigo da MEXC sobre regiões restritas não cita o Brasil. Nenhuma declaração sobre pedido ao BCB encontrada.",
  }),
  row("gate-io", "Gate", "unknown", null, null, null, {
    en: "No official Gate statement on Brazil found.",
    "pt-BR": "Nenhuma declaração oficial da Gate sobre o Brasil encontrada.",
  }),
  row("kucoin", "KuCoin", "unknown", "https://www.kucoin.com/legal/terms-of-use", "2026-09-29", "KuCoin terms of use", {
    en: "KuCoin's terms send Brazilian residents to separate “KuCoin Brasil – Terms of Use”. No statement on a BCB filing found.",
    "pt-BR": "Os termos da KuCoin remetem residentes no Brasil a “KuCoin Brasil – Terms of Use”. Nenhuma declaração sobre pedido ao BCB encontrada.",
  }),
  row("kraken", "Kraken", "unknown", "https://www.kraken.com/legal/br-terms", "2026-09-14", "Kraken Brazil terms", {
    en: "Kraken's Brazil terms name Payward Brasil SPSAV Ltda. (CNPJ 61.533.076/0001-77). No statement on a BCB filing found.",
    "pt-BR": "Os termos da Kraken para o Brasil citam a Payward Brasil SPSAV Ltda. (CNPJ 61.533.076/0001-77). Nenhuma declaração sobre pedido ao BCB encontrada.",
  }),
]);

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const L = (values) => Object.freeze(Object.fromEntries(LOCALES.map((locale, index) => [locale, values[index]])));

const STATUS_LABELS = Object.freeze({
  authorized: L(["Authorized by the BCB", "已获巴西央行授权", "已獲巴西央行授權", "Autorizada por el BCB", "Autorizada pelo BCB", "Autorisée par la BCB", "Von der BCB zugelassen", "Autorizzata dalla BCB", "BCB の認可取得", "BCB 인가 완료", "Авторизована BCB", "BCB tarafından yetkilendirildi", "Diotorisasi BCB", "Đã được BCB cấp phép", "مرخّصة من البنك المركزي البرازيلي"]),
  applied: L(["Filed for authorization", "已提交授权申请", "已提交授權申請", "Solicitó autorización", "Pedido de autorização protocolado", "Demande d’autorisation déposée", "Zulassung beantragt", "Autorizzazione richiesta", "認可を申請済み", "인가 신청 완료", "Заявка на авторизацию подана", "Yetki başvurusu yapıldı", "Telah mengajukan otorisasi", "Đã nộp đơn xin cấp phép", "قدّمت طلب ترخيص"]),
  migrating: L(["Moving users to a local entity", "正在将用户迁移至本地实体", "正在將用戶遷移至本地實體", "Migrando usuarios a una entidad local", "Migrando usuários para entidade local", "Transfert des clients vers une entité locale", "Überträgt Kunden auf eine lokale Gesellschaft", "Trasferisce gli utenti a un’entità locale", "現地法人へ利用者を移管中", "현지 법인으로 이용자 이전 중", "Переводит клиентов в местную компанию", "Kullanıcıları yerel şirkete taşıyor", "Memindahkan pengguna ke entitas lokal", "Đang chuyển người dùng sang pháp nhân địa phương", "تنقل المستخدمين إلى كيان محلي"]),
  leaving: L(["Leaving Brazil", "退出巴西", "退出巴西", "Saliendo de Brasil", "Saindo do Brasil", "Quitte le Brésil", "Zieht sich aus Brasilien zurück", "Lascia il Brasile", "ブラジルから撤退", "브라질 철수", "Уходит из Бразилии", "Brezilya’dan çıkıyor", "Keluar dari Brasil", "Rời Brazil", "تنسحب من البرازيل"]),
  unknown: L(["Not confirmed", "未确认", "未確認", "No confirmado", "Não confirmado", "Non confirmé", "Nicht bestätigt", "Non confermato", "未確認", "미확인", "Не подтверждено", "Doğrulanmadı", "Belum dikonfirmasi", "Chưa xác nhận", "غير مؤكد"]),
});

const pick = (table, locale) => table[LOCALES.includes(locale) ? locale : "en"];

export function brazilStatusLabel(status, locale = "en") {
  return pick(STATUS_LABELS[BRAZIL_STATUS_KEYS.includes(status) ? status : "unknown"], locale);
}

export function brazilVaspStatusFor(slug) {
  return BRAZIL_VASP_STATUS.find((row) => row.slug === slug) || null;
}

// Partner CTAs on the Brazil page only for an exchange with an official, positive Brazil record (authorized, filed, or
// moving users to its local entity). "leaving" is never promoted; "unknown" is not promoted either, because a sign-up
// link next to an unconfirmed status two weeks before the deadline would read as an endorsement.
const PROMOTABLE_STATUSES = new Set(["authorized", "applied", "migrating"]);
export function brazilPromotable(row) {
  return Boolean(row && PROMOTABLE_STATUSES.has(row.status));
}

// Notice on /pt-br/exchanges (directory) and /pt-br/exchanges/<slug> (profiles in the status table).
const NOTICE = L([
  { title: "Brazil: Central Bank authorization deadline on 30 Oct 2026", body: "Crypto exchanges already serving Brazil must file for authorization with the Banco Central do Brasil by 30 October 2026; foreign exchanges must move their clients to a company authorized in Brazil.", venue: (name, status) => `${name} in Brazil: ${status}.`, link: "Status of each exchange and what to check" },
  { title: "巴西：央行授权申请截止日为 2026 年 10 月 30 日", body: "已在巴西提供服务的加密交易所须在 2026 年 10 月 30 日前向巴西中央银行提交授权申请。", venue: (name, status) => `${name} 在巴西：${status}。`, link: "查看各交易所状态与核对要点" },
  { title: "巴西：央行授權申請截止日為 2026 年 10 月 30 日", body: "已在巴西提供服務的加密交易所須在 2026 年 10 月 30 日前向巴西中央銀行提交授權申請。", venue: (name, status) => `${name} 在巴西：${status}。`, link: "查看各交易所狀態與核對要點" },
  { title: "Brasil: plazo de autorización del Banco Central el 30/10/2026", body: "Los exchanges cripto que ya atienden a Brasil deben solicitar autorización al Banco Central do Brasil hasta el 30 de octubre de 2026.", venue: (name, status) => `${name} en Brasil: ${status}.`, link: "Estado de cada exchange y qué revisar" },
  { title: "Prazo do Banco Central: 30 de outubro de 2026", body: "Corretoras cripto que já atendem o Brasil precisam pedir autorização ao Banco Central do Brasil até 30 de outubro de 2026; as estrangeiras precisam transferir os clientes para uma empresa autorizada no país.", venue: (name, status) => `${name} no Brasil: ${status}.`, link: "Status de cada corretora e o que verificar" },
  { title: "Brésil : date limite d’autorisation de la Banque centrale le 30/10/2026", body: "Les plateformes crypto qui servent déjà le Brésil doivent demander une autorisation au Banco Central do Brasil avant le 30 octobre 2026.", venue: (name, status) => `${name} au Brésil : ${status}.`, link: "Statut de chaque plateforme et points à vérifier" },
  { title: "Brasilien: Zulassungsfrist der Zentralbank am 30.10.2026", body: "Krypto-Börsen, die bereits Kunden in Brasilien bedienen, müssen bis zum 30. Oktober 2026 eine Zulassung bei der Banco Central do Brasil beantragen.", venue: (name, status) => `${name} in Brasilien: ${status}.`, link: "Status jeder Börse und was zu prüfen ist" },
  { title: "Brasile: scadenza per l’autorizzazione della Banca centrale il 30/10/2026", body: "Gli exchange crypto che già servono il Brasile devono chiedere l’autorizzazione al Banco Central do Brasil entro il 30 ottobre 2026.", venue: (name, status) => `${name} in Brasile: ${status}.`, link: "Stato di ogni exchange e cosa verificare" },
  { title: "ブラジル：中央銀行への認可申請期限は 2026年10月30日", body: "すでにブラジルで営業している暗号資産取引所は、2026年10月30日までにブラジル中央銀行へ認可を申請する必要があります。", venue: (name, status) => `ブラジルでの ${name}：${status}。`, link: "各取引所の状況と確認ポイント" },
  { title: "브라질: 중앙은행 인가 신청 마감 2026년 10월 30일", body: "이미 브라질 이용자에게 서비스하는 암호화폐 거래소는 2026년 10월 30일까지 브라질 중앙은행에 인가를 신청해야 합니다.", venue: (name, status) => `브라질 내 ${name}: ${status}.`, link: "거래소별 상태와 확인할 점" },
  { title: "Бразилия: срок подачи заявок в Центробанк — 30.10.2026", body: "Криптобиржи, которые уже обслуживают клиентов в Бразилии, должны подать заявку на авторизацию в Banco Central do Brasil до 30 октября 2026 года.", venue: (name, status) => `${name} в Бразилии: ${status}.`, link: "Статус каждой биржи и что проверить" },
  { title: "Brezilya: Merkez Bankası yetki başvurusu için son tarih 30.10.2026", body: "Brezilya’da zaten hizmet veren kripto borsaları 30 Ekim 2026’ya kadar Banco Central do Brasil’e yetki başvurusu yapmalıdır.", venue: (name, status) => `${name} Brezilya’da: ${status}.`, link: "Her borsanın durumu ve kontrol edilecekler" },
  { title: "Brasil: tenggat otorisasi Bank Sentral 30/10/2026", body: "Bursa kripto yang sudah melayani Brasil wajib mengajukan otorisasi ke Banco Central do Brasil paling lambat 30 Oktober 2026.", venue: (name, status) => `${name} di Brasil: ${status}.`, link: "Status tiap bursa dan yang perlu diperiksa" },
  { title: "Brazil: hạn nộp hồ sơ cấp phép cho Ngân hàng Trung ương là 30/10/2026", body: "Các sàn tiền mã hóa đang phục vụ Brazil phải nộp hồ sơ xin cấp phép với Banco Central do Brasil trước ngày 30/10/2026.", venue: (name, status) => `${name} tại Brazil: ${status}.`, link: "Trạng thái từng sàn và những điều cần kiểm tra" },
  { title: "البرازيل: آخر موعد لطلب ترخيص البنك المركزي هو 30/10/2026", body: "يجب على منصات العملات الرقمية التي تخدم البرازيل بالفعل أن تتقدّم بطلب ترخيص إلى البنك المركزي البرازيلي بحلول 30 أكتوبر 2026.", venue: (name, status) => `${name} في البرازيل: ${status}.`, link: "حالة كل منصة وما يجب التحقق منه" },
]);

export const BRAZIL_NOTICE_LOCALES = Object.freeze(["pt-BR"]);

/** Notice copy for a locale and (optionally) one exchange; null when the locale does not show the notice. */
export function brazilDeadlineNotice(locale = "en", slug = null) {
  if (!BRAZIL_NOTICE_LOCALES.includes(locale)) return null;
  const copy = pick(NOTICE, locale);
  const row = slug ? brazilVaspStatusFor(slug) : null;
  if (slug && !row) return null;
  return {
    title: copy.title,
    body: copy.body,
    venue: row ? copy.venue(row.name, brazilStatusLabel(row.status, locale)) : null,
    status: row?.status || null,
    link: copy.link,
    href: localizedHref(brazilDeadlinePathFor(locale), { locale }),
  };
}

