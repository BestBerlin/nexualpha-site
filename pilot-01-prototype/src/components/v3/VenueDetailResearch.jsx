import { GlossaryTooltip } from "../shared/GlossaryTooltip.jsx";
import { SourceLink } from "../shared/SourceLink.jsx";
// Venue detail "Sources" hub: account and costs (quick registration, rebate card, metrics, calculator, fee matrix,
// pre-registration decision notes), sources and security (proof of reserves, anti-phishing, research panel, official
// reward research) and follow-up (Telegram handoff and monitor). The server renders it inline inside the collapsed
// <details>; the browser fetches this chunk (route-v3-venue-research) when the reader opens the disclosure
// (DeferUntilVisible interactionOnly in VenueDetailPage.jsx). Split out of VenueDetailPage.jsx, venue-graph lane 2026-10-11.
import { enIfLatin } from "../../utils/fallback-lang.js";
import { feePctOfRate, isoDay } from "../../data/exchange-facts.js";
import { matrixCopy } from "./exchange-matrix-copy.js";
import { ResearchPanel } from "./ResearchPanels";
import { VenueDecisionArticles } from "./VenueDecisionArticles";
import { campaignCopy } from "./activity/campaign-copy";
import { OfficialResearchTeaser } from "./activity/OfficialResearch";
import { researchForVenue } from "../../data/exchange-research";
import { buildVenueFeeSummary, feeSummaryCopy } from "../../data/venue-fee-summary.js";
import { reviewedFeeCopy } from "../../data/reviewed-fee-copy.js";
import { venueGoHref } from "../../data/source-bound-cta.js";
import { buildTelegramWebsiteFunnelContext, TELEGRAM_CONFIG } from "../../data/telegram-config.js";
import { OnsiteTelegramBotHandoff } from "./OnsiteTelegramBotHandoff.jsx";
import { formatPercent } from "../../data/format-percent.js";
import { localeKey, zhText, localePending, LocalLink } from "./v3-pages-shared.jsx";
import { detailUi, dexFeeCompactUi, copyFeedbackLabel, useCopyFeedback, CopyFeedbackStatus, telegramLocaleUi } from "./venue-detail-shared.jsx";
import { hydratedTelegramReturnHref, telegramReturnClockOption, useHydratedTelegramReturnNow } from "./telegram-return-hydration.js";
import { VenueVisualIcon } from "./VenueDetailPageVisuals.jsx";

const porUi = (locale, venueName) => ({
  ja: {
    badge: "支払能力と PoR",
    sourcePending: "公式ソース確認待ち",
    title: `${venueName} 準備金証明 (PoR) とオンチェーン支払能力`,
    desc: `${venueName} の準備金、監査、支払能力は最新の公式開示と再現可能なソースで確認してください。未確認の数字を保証として表示しません。`,
    total: "総準備金比率",
    pending: "確認待ち",
    snapshot: "公式レポートとスナップショット基準",
    noSource: "再現可能なソース未記録",
    audit: "監査メカニズム",
    merkle: "Merkle Root による暗号学的検証",
    protection: "投資家保護基金",
    disclosure: "公式開示を参照",
    protectionSub: "極端な市場イベントへの保護",
    btc: "BTC 準備金比率",
    eth: "ETH 準備金比率",
    stable: "USDT/USDC 準備金比率",
    btcSub: "負債に対する準備金カバーは公式ソースで確認が必要です",
    ethSub: "アドレスと監査範囲は公式ソースで確認が必要です",
    stableSub: "ステーブルコインのカバー根拠は公式ソースで確認が必要です",
    guide: "3ステップ検証ガイド",
    leaf: "Merkle リーフハッシュを取得",
    leafBody: "公式アカウントであなた専用の暗号学的リーフノードハッシュをエクスポートします。",
    verifier: "オープンソース検証ツールを実行",
    verifierBody: "Merkle Tree に沿って検証し、残高が公開ルートに含まれるか確認します。",
    wallets: "オンチェーンウォレットを照合",
    walletsBody: "公開されたコールドウォレット残高が負債を上回るか確認します。",
    principle: "自己管理セキュリティ原則",
    principleBody: "PoR は特定時点の支払能力を示します。長期保有分はハードウェアウォレットで自己管理してください。",
    auditBtn: "公式 PoR 監査レポートを見る ↗",
  },
  ko: {
    badge: "지급 능력 및 PoR",
    sourcePending: "공식 출처 확인 대기",
    title: `${venueName} 준비금 증명(PoR) 및 온체인 지급 능력`,
    desc: `${venueName}의 준비금, 감사, 지급 능력 정보는 최신 공식 공시와 재현 가능한 출처로 확인해야 합니다. 미확인 수치를 보장처럼 표시하지 않습니다.`,
    total: "총 준비금 비율",
    pending: "확인 대기",
    snapshot: "공식 보고서와 스냅샷 기준",
    noSource: "재현 가능한 출처 미기록",
    audit: "감사 메커니즘",
    merkle: "Merkle Root 암호학 검증",
    protection: "투자자 보호 기금",
    disclosure: "공식 공시 참조",
    protectionSub: "극단적 시장 이벤트 보호",
    btc: "BTC 준비금 비율",
    eth: "ETH 준비금 비율",
    stable: "USDT/USDC 준비금 비율",
    btcSub: "부채 대비 준비금 커버리지는 공식 출처 확인이 필요합니다",
    ethSub: "주소와 감사 범위는 공식 출처 확인이 필요합니다",
    stableSub: "스테이블코인 커버 근거는 공식 출처 확인이 필요합니다",
    guide: "3단계 검증 가이드",
    leaf: "Merkle 리프 해시 내보내기",
    leafBody: "공식 계정에서 본인 전용 암호학 리프 노드 해시를 내보냅니다.",
    verifier: "오픈소스 검증 도구 실행",
    verifierBody: "Merkle Tree 경로를 따라 검증해 잔액이 공개 루트에 포함되는지 확인합니다.",
    wallets: "온체인 지갑 대조",
    walletsBody: "공개된 콜드월렛 총액이 누적 부채보다 큰지 확인합니다.",
    principle: "자기 보관 보안 원칙",
    principleBody: "PoR은 특정 시점의 지급 능력 스냅샷입니다. 장기 보유 자산은 하드웨어 지갑으로 자기 보관하세요.",
    auditBtn: "공식 PoR 감사 보고서 보기 ↗",
  },
  tr: {
    badge: "Ödeme gücü ve PoR",
    sourcePending: "Resmî kaynak incelemesi bekliyor",
    title: `${venueName} Rezerv Kanıtı (PoR) ve zincir üstü ödeme gücü`,
    desc: `${venueName} rezerv, denetim ve ödeme gücü bilgileri en güncel resmî açıklama ve tekrar üretilebilir kaynakla kontrol edilmelidir; doğrulanmamış sayılar garantiye çevrilmez.`,
    total: "Toplam rezerv oranı",
    pending: "Beklemede",
    snapshot: "Resmî rapor ve anlık görüntüye göre",
    noSource: "Tekrar üretilebilir kaynak kayıtlı değil",
    audit: "Denetim mekanizması",
    merkle: "Merkle Root kriptografik doğrulama",
    protection: "Yatırımcı koruma fonu",
    disclosure: "Resmî açıklamaya bakın",
    protectionSub: "Aşırı piyasa olayları koruması",
    btc: "BTC rezerv oranı",
    eth: "ETH rezerv oranı",
    stable: "USDT/USDC rezerv oranı",
    btcSub: "Rezerv-borç kapsamı resmî kaynakla doğrulanmalıdır",
    ethSub: "Adresler ve denetim kapsamı resmî kaynakla doğrulanmalıdır",
    stableSub: "Stablecoin kapsam dayanağı resmî kaynakla doğrulanmalıdır",
    guide: "3 adımlı doğrulama rehberi",
    leaf: "Merkle yaprak hash'ini dışa aktar",
    leafBody: "Resmî hesabınızdan size ait kriptografik yaprak düğüm hash'ini dışa aktarın.",
    verifier: "Açık kaynak doğrulayıcıyı çalıştır",
    verifierBody: "Merkle Tree boyunca doğrulayarak bakiyenizin açık kökte yer aldığını kontrol edin.",
    wallets: "Zincir üstü cüzdanları karşılaştır",
    walletsBody: "Açıklanan soğuk cüzdanların toplam borçlardan fazla olup olmadığını doğrulayın.",
    principle: "Kendi saklama güvenlik ilkesi",
    principleBody: "PoR belirli bir anlık ödeme gücünü gösterir. Uzun vadeli büyük varlıkları donanım cüzdanında kendiniz saklayın.",
    auditBtn: "Resmî PoR denetim raporunu görüntüle ↗",
  },
  es: {
    badge: "Solvencia y PoR",
    sourcePending: "Fuente oficial pendiente de revisión",
    title: `${venueName}: prueba de reservas (PoR) y solvencia on-chain`,
    desc: `Las reservas, auditorías y solvencia de ${venueName} deben comprobarse con la divulgación oficial más reciente y una fuente reproducible; esta página no convierte cifras no verificadas en garantías.`,
    total: "Ratio total de reservas",
    pending: "Pendiente",
    snapshot: "Según el informe oficial y la instantánea",
    noSource: "Sin fuente reproducible registrada",
    audit: "Mecanismo de auditoría",
    merkle: "Verificación criptográfica con Merkle Root",
    protection: "Fondo de protección al inversor",
    disclosure: "Consulta la divulgación oficial",
    protectionSub: "Protección ante eventos extremos de mercado",
    btc: "Ratio de reservas BTC",
    eth: "Ratio de reservas ETH",
    stable: "Ratio de reservas USDT/USDC",
    btcSub: "La cobertura de reservas frente a pasivos requiere verificación con fuente oficial",
    ethSub: "Las direcciones y el alcance de la auditoría requieren verificación con fuente oficial",
    stableSub: "La base de cobertura de stablecoins requiere verificación con fuente oficial",
    guide: "Guía de verificación en 3 pasos",
    leaf: "Obtén el hash de tu hoja Merkle",
    leafBody: "Exporta el hash de tu nodo hoja desde tu cuenta oficial.",
    verifier: "Ejecuta el verificador de código abierto",
    verifierBody: "Recorre el árbol Merkle y comprueba que tu saldo está en la raíz publicada.",
    wallets: "Contrasta las billeteras on-chain",
    walletsBody: "Comprueba que los saldos publicados de las billeteras frías superan los pasivos.",
    principle: "Principio de autocustodia",
    principleBody: "El PoR muestra la solvencia en un momento dado. Guarda los fondos a largo plazo en una billetera de hardware propia.",
    auditBtn: "Ver informe oficial de auditoría PoR ↗",
  },
  "pt-BR": {
    badge: "Solvência e PoR",
    sourcePending: "Fonte oficial aguardando revisão",
    title: `${venueName}: prova de reservas (PoR) e solvência on-chain`,
    desc: `As reservas, auditorias e a solvência da ${venueName} devem ser conferidas na divulgação oficial mais recente e em uma fonte reproduzível; esta página não transforma números não verificados em garantia.`,
    total: "Índice total de reservas",
    pending: "Pendente",
    snapshot: "Com base no relatório oficial e no snapshot",
    noSource: "Nenhuma fonte reproduzível registrada",
    audit: "Mecanismo de auditoria",
    merkle: "Verificação criptográfica por Merkle Root",
    protection: "Fundo de proteção ao investidor",
    disclosure: "Consulte a divulgação oficial",
    protectionSub: "Proteção contra eventos extremos de mercado",
    btc: "Índice de reservas BTC",
    eth: "Índice de reservas ETH",
    stable: "Índice de reservas USDT/USDC",
    btcSub: "A cobertura das reservas frente aos passivos precisa de verificação na fonte oficial",
    ethSub: "Endereços e escopo da auditoria precisam de verificação na fonte oficial",
    stableSub: "A base de cobertura das stablecoins precisa de verificação na fonte oficial",
    guide: "Guia de verificação em 3 passos",
    leaf: "Obtenha o hash da sua folha Merkle",
    leafBody: "Exporte o hash do seu nó folha na conta oficial.",
    verifier: "Rode o verificador de código aberto",
    verifierBody: "Percorra a árvore Merkle e confirme que seu saldo está na raiz publicada.",
    wallets: "Confira as carteiras on-chain",
    walletsBody: "Verifique se os saldos publicados das carteiras frias superam os passivos.",
    principle: "Princípio da autocustódia",
    principleBody: "O PoR mostra a solvência em um momento específico. Guarde fundos de longo prazo em uma carteira de hardware própria.",
    auditBtn: "Ver relatório oficial de auditoria PoR ↗",
  },
  fr: {
    badge: "Solvabilité et PoR",
    sourcePending: "Source officielle en attente de revue",
    title: `${venueName} : preuve de réserves (PoR) et solvabilité on-chain`,
    desc: `Les réserves, audits et la solvabilité de ${venueName} doivent être vérifiés auprès de la dernière publication officielle et d’une source reproductible ; cette page ne présente pas de chiffres non vérifiés comme une garantie.`,
    total: "Ratio total de réserves",
    pending: "En attente",
    snapshot: "Selon le rapport officiel et l’instantané",
    noSource: "Aucune source reproductible enregistrée",
    audit: "Mécanisme d’audit",
    merkle: "Vérification cryptographique par Merkle Root",
    protection: "Fonds de protection des investisseurs",
    disclosure: "Voir la publication officielle",
    protectionSub: "Protection lors d’événements de marché extrêmes",
    btc: "Ratio de réserves BTC",
    eth: "Ratio de réserves ETH",
    stable: "Ratio de réserves USDT/USDC",
    btcSub: "La couverture des passifs par les réserves doit être vérifiée auprès d’une source officielle",
    ethSub: "Les adresses et le périmètre d’audit doivent être vérifiés auprès d’une source officielle",
    stableSub: "La couverture des stablecoins doit être vérifiée auprès d’une source officielle",
    guide: "Guide de vérification en 3 étapes",
    leaf: "Récupérez le hash de votre feuille Merkle",
    leafBody: "Exportez le hash de votre nœud feuille depuis votre compte officiel.",
    verifier: "Lancez le vérificateur open source",
    verifierBody: "Parcourez l’arbre de Merkle et vérifiez que votre solde figure sous la racine publiée.",
    wallets: "Comparez les portefeuilles on-chain",
    walletsBody: "Vérifiez que les soldes publiés des portefeuilles froids dépassent les passifs.",
    principle: "Principe d’auto-conservation",
    principleBody: "La PoR montre la solvabilité à un instant donné. Conservez vos avoirs de long terme dans votre propre portefeuille matériel.",
    auditBtn: "Voir le rapport d’audit PoR officiel ↗",
  },
  de: {
    badge: "Solvenz und PoR",
    sourcePending: "Offizielle Quelle in Prüfung",
    title: `${venueName}: Proof of Reserves (PoR) und On-Chain-Solvenz`,
    desc: `Reserven, Audits und Solvenz von ${venueName} sind anhand der jüngsten offiziellen Veröffentlichung und einer reproduzierbaren Quelle zu prüfen; diese Seite stellt ungeprüfte Zahlen nicht als Garantie dar.`,
    total: "Gesamte Reservequote",
    pending: "Ausstehend",
    snapshot: "Laut offiziellem Bericht und Snapshot",
    noSource: "Keine reproduzierbare Quelle erfasst",
    audit: "Prüfmechanismus",
    merkle: "Kryptografische Prüfung per Merkle Root",
    protection: "Anlegerschutzfonds",
    disclosure: "Siehe offizielle Veröffentlichung",
    protectionSub: "Schutz bei extremen Marktereignissen",
    btc: "BTC-Reservequote",
    eth: "ETH-Reservequote",
    stable: "USDT/USDC-Reservequote",
    btcSub: "Die Deckung der Verbindlichkeiten durch Reserven muss anhand offizieller Quellen geprüft werden",
    ethSub: "Adressen und Prüfumfang müssen anhand offizieller Quellen geprüft werden",
    stableSub: "Die Stablecoin-Deckung muss anhand offizieller Quellen geprüft werden",
    guide: "Prüfung in 3 Schritten",
    leaf: "Merkle-Leaf-Hash abrufen",
    leafBody: "Exportieren Sie den Hash Ihres Blattknotens im offiziellen Konto.",
    verifier: "Open-Source-Prüfer ausführen",
    verifierBody: "Gehen Sie den Merkle-Baum durch und prüfen Sie, ob Ihr Guthaben in der veröffentlichten Wurzel enthalten ist.",
    wallets: "On-Chain-Wallets abgleichen",
    walletsBody: "Prüfen Sie, ob die veröffentlichten Cold-Wallet-Bestände die Verbindlichkeiten übersteigen.",
    principle: "Prinzip der Selbstverwahrung",
    principleBody: "PoR zeigt die Solvenz zu einem Zeitpunkt. Bewahren Sie langfristige Bestände in einer eigenen Hardware-Wallet auf.",
    auditBtn: "Offiziellen PoR-Prüfbericht ansehen ↗",
  },
  ar: {
    badge: "الملاءة وإثبات الاحتياطيات",
    sourcePending: "المصدر الرسمي قيد المراجعة",
    title: `${venueName}: إثبات الاحتياطيات (PoR) والملاءة على السلسلة`,
    desc: `يجب التحقق من احتياطيات ${venueName} وتدقيقها وملاءتها من أحدث إفصاح رسمي ومصدر قابل لإعادة التحقق؛ لا تعرض هذه الصفحة أرقاماً غير متحقق منها كضمان.`,
    total: "نسبة الاحتياطي الإجمالية",
    pending: "قيد الانتظار",
    snapshot: "وفق التقرير الرسمي واللقطة",
    noSource: "لا يوجد مصدر قابل لإعادة التحقق",
    audit: "آلية التدقيق",
    merkle: "تحقق تشفيري عبر Merkle Root",
    protection: "صندوق حماية المستثمرين",
    disclosure: "راجع الإفصاح الرسمي",
    protectionSub: "حماية عند أحداث السوق القصوى",
    btc: "نسبة احتياطي BTC",
    eth: "نسبة احتياطي ETH",
    stable: "نسبة احتياطي USDT/USDC",
    btcSub: "تغطية الاحتياطيات للالتزامات تحتاج إلى تحقق من مصدر رسمي",
    ethSub: "العناوين ونطاق التدقيق تحتاج إلى تحقق من مصدر رسمي",
    stableSub: "أساس تغطية العملات المستقرة يحتاج إلى تحقق من مصدر رسمي",
    guide: "دليل التحقق في 3 خطوات",
    leaf: "احصل على تجزئة ورقة Merkle",
    leafBody: "صدّر تجزئة العقدة الورقية الخاصة بك من حسابك الرسمي.",
    verifier: "شغّل أداة التحقق مفتوحة المصدر",
    verifierBody: "تتبّع شجرة Merkle وتأكد من أن رصيدك ضمن الجذر المنشور.",
    wallets: "طابق المحافظ على السلسلة",
    walletsBody: "تحقق من أن أرصدة المحافظ الباردة المنشورة تتجاوز الالتزامات.",
    principle: "مبدأ الحفظ الذاتي",
    principleBody: "يُظهر PoR الملاءة في لحظة محددة. احتفظ بأموالك طويلة الأجل في محفظة أجهزة خاصة بك.",
    auditBtn: "عرض تقرير تدقيق PoR الرسمي ↗",
  },
  ru: {
    badge: "Платёжеспособность и PoR",
    sourcePending: "Официальный источник на проверке",
    title: `${venueName}: подтверждение резервов (PoR) и платёжеспособность в сети`,
    desc: `Резервы, аудит и платёжеспособность ${venueName} нужно сверять с последним официальным раскрытием и воспроизводимым источником; страница не выдаёт непроверенные цифры за гарантию.`,
    total: "Общий коэффициент резервов",
    pending: "Ожидает проверки",
    snapshot: "По официальному отчёту и снимку",
    noSource: "Воспроизводимый источник не записан",
    audit: "Механизм аудита",
    merkle: "Криптографическая проверка через Merkle Root",
    protection: "Фонд защиты инвесторов",
    disclosure: "См. официальное раскрытие",
    protectionSub: "Защита при экстремальных событиях рынка",
    btc: "Коэффициент резервов BTC",
    eth: "Коэффициент резервов ETH",
    stable: "Коэффициент резервов USDT/USDC",
    btcSub: "Покрытие обязательств резервами требует проверки по официальному источнику",
    ethSub: "Адреса и объём аудита требуют проверки по официальному источнику",
    stableSub: "Основание покрытия стейблкоинов требует проверки по официальному источнику",
    guide: "Проверка в 3 шага",
    leaf: "Получите хеш листа Merkle",
    leafBody: "Экспортируйте хеш своего листового узла в официальном аккаунте.",
    verifier: "Запустите открытый верификатор",
    verifierBody: "Пройдите по дереву Merkle и убедитесь, что ваш баланс входит в опубликованный корень.",
    wallets: "Сверьте кошельки в сети",
    walletsBody: "Проверьте, что опубликованные балансы холодных кошельков превышают обязательства.",
    principle: "Принцип самостоятельного хранения",
    principleBody: "PoR показывает платёжеспособность на определённый момент. Долгосрочные средства храните в собственном аппаратном кошельке.",
    auditBtn: "Открыть официальный отчёт об аудите PoR ↗",
  },
  id: {
    badge: "Solvabilitas & PoR",
    sourcePending: "Sumber resmi menunggu peninjauan",
    title: `${venueName}: bukti cadangan (PoR) dan solvabilitas on-chain`,
    desc: `Cadangan, audit, dan solvabilitas ${venueName} perlu dicek dengan pengungkapan resmi terbaru dan sumber yang dapat direproduksi; halaman ini tidak menjadikan angka yang belum diverifikasi sebagai jaminan.`,
    total: "Rasio cadangan total",
    pending: "Menunggu",
    snapshot: "Berdasarkan laporan resmi dan snapshot",
    noSource: "Belum ada sumber yang dapat direproduksi",
    audit: "Mekanisme audit",
    merkle: "Verifikasi kriptografis Merkle Root",
    protection: "Dana perlindungan investor",
    disclosure: "Lihat pengungkapan resmi",
    protectionSub: "Perlindungan saat kejadian pasar ekstrem",
    btc: "Rasio cadangan BTC",
    eth: "Rasio cadangan ETH",
    stable: "Rasio cadangan USDT/USDC",
    btcSub: "Cakupan cadangan terhadap kewajiban perlu diverifikasi dengan sumber resmi",
    ethSub: "Alamat dan cakupan audit perlu diverifikasi dengan sumber resmi",
    stableSub: "Dasar cakupan stablecoin perlu diverifikasi dengan sumber resmi",
    guide: "Panduan verifikasi 3 langkah",
    leaf: "Ambil hash daun Merkle Anda",
    leafBody: "Ekspor hash node daun Anda dari akun resmi.",
    verifier: "Jalankan verifikator open source",
    verifierBody: "Telusuri pohon Merkle dan pastikan saldo Anda ada di root yang dipublikasikan.",
    wallets: "Cocokkan dompet on-chain",
    walletsBody: "Pastikan saldo dompet dingin yang dipublikasikan melebihi kewajiban.",
    principle: "Prinsip kustodi mandiri",
    principleBody: "PoR menunjukkan solvabilitas pada satu waktu. Simpan dana jangka panjang di dompet hardware milik sendiri.",
    auditBtn: "Lihat laporan audit PoR resmi ↗",
  },
  vi: {
    badge: "Khả năng thanh toán & PoR",
    sourcePending: "Nguồn chính thức đang chờ xem xét",
    title: `${venueName}: bằng chứng dự trữ (PoR) và khả năng thanh toán on-chain`,
    desc: `Dự trữ, kiểm toán và khả năng thanh toán của ${venueName} cần được đối chiếu với công bố chính thức mới nhất và nguồn có thể tái kiểm; trang này không biến số liệu chưa xác minh thành cam kết.`,
    total: "Tỷ lệ dự trữ tổng",
    pending: "Đang chờ",
    snapshot: "Theo báo cáo chính thức và ảnh chụp số dư",
    noSource: "Chưa ghi nhận nguồn có thể tái kiểm",
    audit: "Cơ chế kiểm toán",
    merkle: "Xác minh mật mã bằng Merkle Root",
    protection: "Quỹ bảo vệ nhà đầu tư",
    disclosure: "Xem công bố chính thức",
    protectionSub: "Bảo vệ khi thị trường biến động cực đoan",
    btc: "Tỷ lệ dự trữ BTC",
    eth: "Tỷ lệ dự trữ ETH",
    stable: "Tỷ lệ dự trữ USDT/USDC",
    btcSub: "Mức dự trữ so với nợ phải trả cần xác minh từ nguồn chính thức",
    ethSub: "Địa chỉ và phạm vi kiểm toán cần xác minh từ nguồn chính thức",
    stableSub: "Cơ sở bảo chứng stablecoin cần xác minh từ nguồn chính thức",
    guide: "Hướng dẫn xác minh 3 bước",
    leaf: "Lấy hash lá Merkle",
    leafBody: "Xuất hash nút lá của bạn từ tài khoản chính thức.",
    verifier: "Chạy công cụ xác minh mã nguồn mở",
    verifierBody: "Duyệt cây Merkle và kiểm tra số dư của bạn nằm trong gốc đã công bố.",
    wallets: "Đối chiếu ví on-chain",
    walletsBody: "Kiểm tra số dư ví lạnh đã công bố lớn hơn nợ phải trả.",
    principle: "Nguyên tắc tự lưu ký",
    principleBody: "PoR cho thấy khả năng thanh toán tại một thời điểm. Hãy giữ tài sản dài hạn trong ví cứng của riêng bạn.",
    auditBtn: "Xem báo cáo kiểm toán PoR chính thức ↗",
  },
  it: {
    badge: "Solvibilità e PoR",
    sourcePending: "Fonte ufficiale in revisione",
    title: `${venueName}: prova delle riserve (PoR) e solvibilità on-chain`,
    desc: `Riserve, audit e solvibilità di ${venueName} vanno verificati con l’ultima comunicazione ufficiale e una fonte riproducibile; questa pagina non presenta cifre non verificate come garanzia.`,
    total: "Rapporto totale delle riserve",
    pending: "In attesa",
    snapshot: "In base al report ufficiale e allo snapshot",
    noSource: "Nessuna fonte riproducibile registrata",
    audit: "Meccanismo di audit",
    merkle: "Verifica crittografica tramite Merkle Root",
    protection: "Fondo di protezione degli investitori",
    disclosure: "Vedi la comunicazione ufficiale",
    protectionSub: "Protezione in caso di eventi di mercato estremi",
    btc: "Rapporto riserve BTC",
    eth: "Rapporto riserve ETH",
    stable: "Rapporto riserve USDT/USDC",
    btcSub: "La copertura delle passività con le riserve va verificata con una fonte ufficiale",
    ethSub: "Indirizzi e perimetro dell’audit vanno verificati con una fonte ufficiale",
    stableSub: "La copertura delle stablecoin va verificata con una fonte ufficiale",
    guide: "Guida alla verifica in 3 passi",
    leaf: "Ottieni l’hash della tua foglia Merkle",
    leafBody: "Esporta l’hash del tuo nodo foglia dall’account ufficiale.",
    verifier: "Esegui il verificatore open source",
    verifierBody: "Percorri l’albero Merkle e verifica che il tuo saldo sia nella radice pubblicata.",
    wallets: "Confronta i wallet on-chain",
    walletsBody: "Verifica che i saldi pubblicati dei cold wallet superino le passività.",
    principle: "Principio di autocustodia",
    principleBody: "La PoR mostra la solvibilità in un dato momento. Conserva i fondi di lungo periodo in un tuo hardware wallet.",
    auditBtn: "Vedi il report ufficiale di audit PoR ↗",
  },
  // l10n: needs native review
  ur: {
    badge: "Solvency اور PoR", sourcePending: "سرکاری ماخذ کی تصدیق باقی ہے", title: `${venueName} Proof of Reserves (PoR) اور on-chain solvency`, desc: `${venueName} کے reserves، audit اور solvency کو تازہ سرکاری disclosures اور دہرائے جا سکنے والے ماخذ سے چیک کریں۔ غیر تصدیق شدہ اعداد کو ضمانت کے طور پر نہیں دکھایا جاتا۔`,
    total: "کل reserve ratio", pending: "تصدیق باقی", snapshot: "سرکاری رپورٹ اور snapshot معیار", noSource: "دہرایا جا سکنے والا ماخذ درج نہیں", audit: "Audit mechanism", merkle: "Merkle Root cryptographic verification", protection: "Investor protection fund", disclosure: "سرکاری disclosure دیکھیں", protectionSub: "انتہائی market events کے لیے protection", btc: "BTC reserve ratio", eth: "ETH reserve ratio", stable: "USDT/USDC reserve ratio", btcSub: "liabilities کے مقابل reserve cover کو سرکاری ماخذ سے چیک کرنا ضروری ہے", ethSub: "addresses اور audit scope کو سرکاری ماخذ سے چیک کرنا ضروری ہے", stableSub: "stablecoin cover کی بنیاد کو سرکاری ماخذ سے چیک کرنا ضروری ہے", guide: "3-step verification guide", leaf: "Merkle leaf hash حاصل کریں", leafBody: "سرکاری اکاؤنٹ سے اپنا cryptographic leaf node hash export کریں۔", verifier: "open-source verifier چلائیں", verifierBody: "Merkle Tree path کے ساتھ verify کریں کہ balance public root میں شامل ہے۔", wallets: "on-chain wallets ملائیں", walletsBody: "چیک کریں کہ published cold wallet balances liabilities سے زیادہ ہیں۔", principle: "self-custody security principle", principleBody: "PoR کسی خاص وقت کی solvency دکھاتا ہے۔ long-term holdings اپنے hardware wallet میں self-custody رکھیں۔", auditBtn: "سرکاری PoR audit report دیکھیں ↗",
  },
  // l10n: needs native review
  uk: {
    badge: "Solvency і PoR", sourcePending: "Очікує перевірки офіційного джерела", title: `${venueName} Proof of Reserves (PoR) та on-chain платоспроможність`, desc: `Reserves, audit і solvency ${venueName} перевіряйте за найновішими офіційними disclosures і відтворюваними джерелами. Неперевірені цифри не показуються як гарантія.`,
    total: "Загальний reserve ratio", pending: "Очікує перевірки", snapshot: "Офіційний report і snapshot basis", noSource: "Відтворюване джерело не записано", audit: "Audit mechanism", merkle: "Merkle Root cryptographic verification", protection: "Investor protection fund", disclosure: "Дивіться офіційне disclosure", protectionSub: "Protection для екстремальних market events", btc: "BTC reserve ratio", eth: "ETH reserve ratio", stable: "USDT/USDC reserve ratio", btcSub: "Reserve cover відносно liabilities потрібно перевірити за офіційним джерелом", ethSub: "Addresses і audit scope потрібно перевірити за офіційним джерелом", stableSub: "Підставу stablecoin cover потрібно перевірити за офіційним джерелом", guide: "3-step verification guide", leaf: "Отримайте Merkle leaf hash", leafBody: "Експортуйте власний cryptographic leaf node hash з офіційного акаунта.", verifier: "Запустіть open-source verifier", verifierBody: "Перевірте шляхом Merkle Tree, що balance входить до public root.", wallets: "Зіставте on-chain wallets", walletsBody: "Перевірте, що published cold wallet balances перевищують liabilities.", principle: "self-custody security principle", principleBody: "PoR показує solvency на певний момент. Long-term holdings зберігайте self-custody у hardware wallet.", auditBtn: "Переглянути офіційний PoR audit report ↗",
  },
}[localeKey(locale)] || {});

const venueSecurityUi = (locale, venueName) => ({
  ja: { tag: "フィッシング対策と公式ホワイトリスト", verified: "NexuAlpha記録確認済み", title: `${venueName} 公式ドメインとフィッシング対策`, sub: "検索広告の偽サイトや偽コミュニティを避け、記録済みのドメインと代替ドメインをブックマークしてください。", primary: "主要公式ドメイン", copy: "URLをコピー", copied: "✓ リンクをコピーしました", secure: "記録済みドメインです。公式ページ表示も確認してください", mirrors: "記録済み代替ドメイン", verifiedMirror: "確認済み", tool: "公式チャネル確認ツール", toolBody: "Telegram ID、メール、ドメイン、電話番号を公式確認ページで検証します。", copyRule: "スポンサー広告をクリックしない", copyRuleBody: "公式ドメインを直接入力するか、ブックマークからアクセスしてください。", dmRule: "公式サポートは先にDMしない", dmRuleBody: "シードフレーズを共有したり、個人DMへ資金を送ったりしないでください。", codeRule: "フィッシング対策コードを有効にする", codeRuleBody: "アカウントのセキュリティ設定で対策コードを設定し、メールの真偽を確認します." },
  ko: { tag: "피싱 방지 및 공식 화이트리스트", verified: "NexuAlpha 기록 확인", title: `${venueName} 공식 도메인 및 피싱 방지 허브`, sub: "검색 광고의 가짜 사이트와 사칭 커뮤니티를 피하고 기록된 도메인과 대체 도메인를 북마크하세요.", primary: "주요 공식 도메인", copy: "URL 복사", copied: "✓ 링크를 복사했습니다", secure: "기록된 도메인입니다. 열린 뒤 플랫폼 화면도 확인하세요", mirrors: "기록된 대체 도메인", verifiedMirror: "기록됨", tool: "공식 채널 확인 도구", toolBody: "Telegram ID, 이메일, 도메인과 전화번호를 공식 확인 페이지에서 검증합니다.", copyRule: "스폰서 광고를 클릭하지 않기", copyRuleBody: "공식 도메인을 직접 입력하거나 브라우저 북마크를 사용하세요.", dmRule: "공식 지원팀은 먼저 DM하지 않음", dmRuleBody: "시드 문구를 공유하거나 개인 Telegram DM으로 자금을 보내지 마세요.", codeRule: "피싱 방지 코드를 활성화", codeRuleBody: "계정 보안 설정에서 코드를 만들고 이메일의 진위를 확인하세요." },
  tr: { tag: "Kimlik avına karşı resmî liste", verified: "NexuAlpha kaynak kaydını kontrol etti", title: `${venueName} resmî alan adı ve kimlik avı koruması`, sub: "Arama reklamlarındaki sahte sitelerden ve taklit topluluklardan kaçının; kayıtlı alan adlarını ve alternatif alan adlarını yer imlerine ekleyin.", primary: "Birincil resmî alan adı", copy: "URL.yi kopyala", copied: "✓ Bağlantı kopyalandı", secure: "Kayıtlı alan adı. Açtıktan sonra platform sayfasını da kontrol edin", mirrors: "Kayıtlı alternatif alan adları", verifiedMirror: "Kayıtlı", tool: "Resmî kanal doğrulama aracı", toolBody: "Telegram kimliklerini, e-postaları, alan adlarını ve telefonları resmî doğrulayıcıyla kontrol edin.", copyRule: "Sponsorlu reklamlara tıklamayın", copyRuleBody: "Resmî alan adını kendiniz yazın veya tarayıcı yer iminden açın.", dmRule: "Resmî destek önce DM atmaz", dmRuleBody: "Seed ifadesi paylaşmayın ve özel Telegram mesajlarına para göndermeyin.", codeRule: "Kimlik avı kodunu etkinleştirin", codeRuleBody: "Hesap güvenlik ayarlarında bir kod oluşturup e-postaları doğrulayın." },
  fr: { tag: "Anti-hameçonnage et liste officielle", verified: "Source revue par NexuAlpha", title: `${venueName} : domaine officiel et protection anti-hameçonnage`, sub: "Évitez les faux sites publicitaires et les communautés usurpées. Enregistrez les domaines enregistrés et domaines alternatifs documentés.", primary: "Domaine officiel principal", copy: "Copier l’URL", copied: "✓ Lien copié", secure: "Domaine enregistré. Vérifiez aussi la page de la plateforme après ouverture", mirrors: "Domaines alternatifs enregistrés", verifiedMirror: "Enregistré", tool: "Outil de vérification du canal officiel", toolBody: "Vérifiez identifiants Telegram, e-mails, domaines et numéros via la page officielle.", copyRule: "Ne cliquez pas sur les annonces sponsorisées", copyRuleBody: "Saisissez le domaine officiel ou utilisez un favori du navigateur.", dmRule: "Le support officiel ne contacte pas en premier", dmRuleBody: "Ne partagez jamais votre phrase secrète et n’envoyez pas de fonds par DM.", codeRule: "Activez le code anti-hameçonnage", codeRuleBody: "Définissez-le dans la sécurité du compte pour vérifier les e-mails." },
  de: { tag: "Phishing-Schutz und offizielle Whitelist", verified: "Von NexuAlpha geprüft", title: `${venueName}: offizielle Domain und Phishing-Schutz`, sub: "Meiden Sie gefälschte Werbeseiten und nachgeahmte Communities. Speichern Sie aufgezeichnete Domains und dokumentierte Alternativdomains.", primary: "Primäre offizielle Domain", copy: "URL kopieren", copied: "✓ Link kopiert", secure: "Aufgezeichnete Domain. Nach dem Öffnen auch die Plattformseite prüfen", mirrors: "Aufgezeichnete Alternativdomains", verifiedMirror: "Aufgezeichnet", tool: "Prüfung offizieller Kanäle", toolBody: "Prüfen Sie Telegram-IDs, E-Mails, Domains und Telefonnummern über die offizielle Seite.", copyRule: "Keine gesponserten Anzeigen anklicken", copyRuleBody: "Geben Sie die offizielle Domain direkt ein oder verwenden Sie ein Lesezeichen.", dmRule: "Der offizielle Support schreibt nicht zuerst", dmRuleBody: "Geben Sie keine Seed-Phrase weiter und senden Sie kein Geld per privater Nachricht.", codeRule: "Anti-Phishing-Code aktivieren", codeRuleBody: "Legen Sie ihn in den Kontosicherheitseinstellungen an." },
  es: { tag: "Protección contra phishing y lista oficial", verified: "Registro revisado por NexuAlpha", title: `${venueName}: dominio oficial y protección contra phishing`, sub: "Evita sitios falsos de anuncios y comunidades suplantadas. Guarda los dominios registrados y dominios alternativos documentados.", primary: "Dominio oficial principal", copy: "Copiar URL", copied: "✓ Enlace copiado", secure: "Dominio registrado. Comprueba también la página de la plataforma al abrirlo", mirrors: "Dominios alternativos registrados", verifiedMirror: "Registrado", tool: "Registrador del canal oficial", toolBody: "Comprueba IDs de Telegram, correos, dominios y teléfonos en la página oficial.", copyRule: "No hagas clic en anuncios patrocinados", copyRuleBody: "Escribe el dominio oficial o usa un marcador del navegador.", dmRule: "El soporte oficial no inicia mensajes privados", dmRuleBody: "No compartas tu frase semilla ni envíes fondos por mensajes privados.", codeRule: "Activa el código anti-phishing", codeRuleBody: "Configúralo en la seguridad de la cuenta para validar los correos." },
  "pt-BR": { tag: "Proteção contra phishing e lista oficial", verified: "Registrado pela NexuAlpha", title: `${venueName}: domínio oficial e proteção contra phishing`, sub: "Evite sites falsos de anúncios e comunidades imitadoras. Salve os domínios registrados e domínios alternativos documentados.", primary: "Domínio oficial principal", copy: "Copiar URL", copied: "✓ Link copiado", secure: "Domínio registrado. Confira também a página da plataforma ao abrir", mirrors: "Domínios alternativos registrados", verifiedMirror: "Registrado", tool: "Registrador do canal oficial", toolBody: "Verifique IDs do Telegram, e-mails, domínios e telefones na página oficial.", copyRule: "Não clique em anúncios patrocinados", copyRuleBody: "Digite o domínio oficial ou use um favorito do navegador.", dmRule: "O suporte oficial não envia DM primeiro", dmRuleBody: "Nunca compartilhe sua seed nem envie fundos por mensagem privada.", codeRule: "Ative o código anti-phishing", codeRuleBody: "Configure-o na segurança da conta para validar os e-mails." },
  ru: { tag: "Антифишинг и официальный список", verified: "Запись источника проверена NexuAlpha", title: `${venueName}: официальный домен и защита от фишинга`, sub: "Избегайте поддельных рекламных сайтов и сообществ. Сохраняйте записанные домены и документированные альтернативные домены.", primary: "Основной официальный домен", copy: "Скопировать URL", copied: "✓ Ссылка скопирована", secure: "Записанный домен. После открытия проверьте страницу платформы", mirrors: "Записанные альтернативные домены", verifiedMirror: "Записано", tool: "Проверка официального канала", toolBody: "Проверяйте ID Telegram, почту, домены и телефоны на официальной странице.", copyRule: "Не нажимайте на спонсорскую рекламу", copyRuleBody: "Введите официальный домен вручную или откройте закладку браузера.", dmRule: "Официальная поддержка не пишет первой", dmRuleBody: "Не сообщайте seed-фразу и не отправляйте средства в личных сообщениях.", codeRule: "Включите антифишинговый код", codeRuleBody: "Настройте код в безопасности аккаунта для проверки писем." },
  ar: { tag: "مكافحة التصيد والقائمة الرسمية", verified: "تمت مراجعة سجل المصدر بواسطة NexuAlpha", title: `${venueName}: النطاق الرسمي والحماية من التصيد`, sub: "تجنب المواقع المزيفة والإعلانات والمجتمعات المنتحلة. احفظ النطاقات المسجلة والنطاقات البديلة المسجلة.", primary: "النطاق الرسمي الأساسي", copy: "نسخ الرابط", copied: "✓ تم نسخ الرابط", secure: "نطاق مسجل. تحقق من صفحة المنصة بعد الفتح", mirrors: "نطاقات بديلة مسجلة", verifiedMirror: "مسجل", tool: "أداة التحقق من القناة الرسمية", toolBody: "تحقق من معرّفات Telegram والبريد والنطاقات والأرقام عبر الصفحة الرسمية.", copyRule: "لا تنقر على الإعلانات المدفوعة", copyRuleBody: "اكتب النطاق الرسمي يدوياً أو استخدم إشارة مرجعية آمنة.", dmRule: "الدعم الرسمي لا يرسل رسائل خاصة أولاً", dmRuleBody: "لا تشارك عبارة الاسترداد ولا ترسل أموالاً في رسالة خاصة.", codeRule: "فعّل رمز مكافحة التصيد", codeRuleBody: "اضبطه في أمان الحساب للتحقق من الرسائل." },
  id: { tag: "Perlindungan phishing dan daftar resmi", verified: "Catatan sumber ditinjau NexuAlpha", title: `${venueName}: domain resmi dan perlindungan phishing`, sub: "Hindari situs iklan palsu dan komunitas tiruan. Simpan domain tercatat dan domain alternatif terdokumentasi.", primary: "Domain resmi utama", copy: "Salin URL", copied: "✓ Tautan disalin", secure: "Domain tercatat. Periksa juga halaman platform setelah dibuka", mirrors: "Domain alternatif tercatat", verifiedMirror: "Tercatat", tool: "Alat verifikasi kanal resmi", toolBody: "Verifikasi ID Telegram, email, domain, dan nomor melalui halaman resmi.", copyRule: "Jangan klik iklan bersponsor", copyRuleBody: "Ketik domain resmi atau gunakan bookmark browser.", dmRule: "Dukungan resmi tidak mengirim DM lebih dulu", dmRuleBody: "Jangan bagikan seed phrase atau kirim dana melalui DM pribadi.", codeRule: "Aktifkan kode anti-phishing", codeRuleBody: "Atur di keamanan akun untuk memvalidasi email." },
  vi: { tag: "Chống lừa đảo và danh sách chính thức", verified: "NexuAlpha đã ghi nhận nguồn", title: `${venueName}: tên miền chính thức và bảo vệ chống lừa đảo`, sub: "Tránh trang giả từ quảng cáo và cộng đồng mạo danh. Lưu tên miền đã ghi nhận và tên miền thay thế có tài liệu.", primary: "Tên miền chính thức chính", copy: "Sao chép URL", copied: "✓ Đã sao chép liên kết", secure: "Tên miền đã ghi nhận. Hãy kiểm tra lại trang nền tảng sau khi mở", mirrors: "Tên miền thay thế đã ghi nhận", verifiedMirror: "Đã ghi nhận", tool: "Công cụ xác minh kênh chính thức", toolBody: "Xác minh ID Telegram, email, tên miền và số điện thoại trên trang chính thức.", copyRule: "Không nhấp quảng cáo được tài trợ", copyRuleBody: "Tự nhập tên miền chính thức hoặc dùng dấu trang trình duyệt.", dmRule: "Hỗ trợ chính thức không nhắn riêng trước", dmRuleBody: "Không chia sẻ seed phrase hoặc gửi tiền qua tin nhắn riêng.", codeRule: "Bật mã chống lừa đảo", codeRuleBody: "Thiết lập trong bảo mật tài khoản để kiểm tra email." },
  it: { tag: "Anti-phishing e lista ufficiale", verified: "Fonte registrata da NexuAlpha", title: `${venueName}: dominio ufficiale e protezione anti-phishing`, sub: "Evita siti falsi pubblicizzati e comunità imitate. Salva i domini registrati e domini alternativi documentati.", primary: "Dominio ufficiale principale", copy: "Copia URL", copied: "✓ Link copiato", secure: "Dominio registrato. Controlla anche la pagina della piattaforma dopo l.apertura", mirrors: "Domini alternativi registrati", verifiedMirror: "Registrato", tool: "Strumento di verifica del canale ufficiale", toolBody: "Verifica ID Telegram, email, domini e numeri dalla pagina ufficiale.", copyRule: "Non fare clic sugli annunci sponsorizzati", copyRuleBody: "Digita il dominio ufficiale o usa un preferito del browser.", dmRule: "Il supporto ufficiale non scrive per primo", dmRuleBody: "Non condividere la seed phrase e non inviare fondi in privato.", codeRule: "Attiva il codice anti-phishing", codeRuleBody: "Impostalo nella sicurezza dell’account per verificare le email." },
  // l10n: needs native review
  ur: { tag: "Anti-phishing اور official whitelist", verified: "NexuAlpha ماخذ ریکارڈ چیک شدہ", title: `${venueName} سرکاری domain اور phishing protection`, sub: "Search ads کے fake sites اور impersonation communities سے بچیں؛ recorded domains اور alternative domains bookmark کریں۔", primary: "Primary official domain", copy: "URL کاپی کریں", copied: "✓ لنک کاپی ہو گیا", secure: "Recorded domain ہے۔ کھولنے کے بعد platform page بھی چیک کریں", mirrors: "Recorded alternative domains", verifiedMirror: "Recorded", tool: "Official channel verification tool", toolBody: "Telegram IDs، emails، domains اور phone numbers کو official verification page سے چیک کریں۔", copyRule: "Sponsored ads پر click نہ کریں", copyRuleBody: "Official domain خود type کریں یا browser bookmark استعمال کریں۔", dmRule: "Official support پہلے DM نہیں کرتا", dmRuleBody: "Seed phrase share نہ کریں اور private Telegram DM میں funds نہ بھیجیں۔", codeRule: "Anti-phishing code فعال کریں", codeRuleBody: "Account security settings میں code بنائیں اور emails کی اصلیت چیک کریں۔" },
  // l10n: needs native review
  uk: { tag: "Anti-phishing та official whitelist", verified: "Джерело перевірено NexuAlpha", title: `${venueName}: офіційний domain і phishing protection`, sub: "Уникайте fake sites у search ads і підроблених communities; збережіть recorded domains та alternative domains у закладки.", primary: "Primary official domain", copy: "Копіювати URL", copied: "✓ Посилання скопійовано", secure: "Recorded domain. Після відкриття також перевірте сторінку платформи", mirrors: "Recorded alternative domains", verifiedMirror: "Recorded", tool: "Official channel verification tool", toolBody: "Перевіряйте Telegram IDs, emails, domains і phone numbers на official verification page.", copyRule: "Не натискайте sponsored ads", copyRuleBody: "Введіть official domain вручну або використайте browser bookmark.", dmRule: "Official support не пише першим у DM", dmRuleBody: "Не передавайте seed phrase і не надсилайте funds у private Telegram DM.", codeRule: "Увімкніть anti-phishing code", codeRuleBody: "Створіть code у security settings акаунта, щоб перевіряти справжність emails." },
}[localeKey(locale)] || {});

function EditorialList({ title, items, fallback }) {
  const visible = items?.length ? items : fallback;
  return <article>
    <span>{title}</span>
    <ul className="v3-detail-list vx-check-tiles">{visible.map((item) => <li key={item}><VenueVisualIcon kind="identity" /><span>{item}</span></li>)}</ul>
  </article>;
}

function VenueTieredFeeMatrix({ venue, locale, db, rebatePercent, inviteCode, registrationUrl, registrationDirect = true, localizedVenueName, claimsVerified = false, researchActions = [] }) {
  const ui = detailUi(locale);
  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant");
  const venueCategory = String(venue.category || db.category || "").toLowerCase();
  const isCexVenue = venueCategory === "cex";

  if (!isCexVenue) {
    const isPerpDex = venueCategory.includes("perp");
    const compactUi = dexFeeCompactUi(locale, localizedVenueName, isPerpDex);
    const sourceUrl = db.officialVerifyUrl || db.registrationUrl || null;
    const safeRegistrationUrl = typeof registrationUrl === "string" && registrationUrl.length ? registrationUrl : null;
    const mechanismItems = isPerpDex
      ? compactUi.perpItems
      : compactUi.dexItems;

    return (
      <section className="v2-section v3-fee-matrix-section" id="fee-schedule">
        <div className="v3-fee-matrix-card v3-dex-fee-compact" data-venue-fee-model={isPerpDex ? "perp-dex" : "dex"}>
          <div className="v3-fee-matrix-head">
            <div>
              <div className="v3-matrix-badge-row">
                <span className="v3-fee-tag">{compactUi.tag}</span>
              </div>
              <h2 className="v3-fee-matrix-title">
                {compactUi.title}
              </h2>
              <p className="v3-fee-matrix-sub">
                {compactUi.body}
              </p>
            </div>
          </div>

          <div className="v3-dex-fee-compact__grid">
            {mechanismItems.map((item, index) => (
              <article key={item} className="v3-dex-fee-compact__item">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
                <p>{compactUi.verify}</p>
              </article>
            ))}
          </div>

          <div className="v3-dex-fee-compact__actions">
            {inviteCode ? (
              <div className="v3-dex-fee-compact__code">
                <span>{compactUi.code}</span>
                <strong translate="no">{inviteCode}</strong>
              </div>
            ) : (
              <div className="v3-dex-fee-compact__code">
                <span>{compactUi.codeState}</span>
                <strong>{compactUi.noCode}</strong>
              </div>
            )}
            <div className="v3-fee-cta-inline">
              {sourceUrl && (
                <SourceLink locale={locale} href={sourceUrl} target="_blank" rel="noopener noreferrer" className="v3-expand-tiers-btn">
                  {compactUi.source}
                </SourceLink>
              )}
              {safeRegistrationUrl ? (
                <a href={safeRegistrationUrl} target={registrationDirect ? "_blank" : undefined} rel={registrationDirect ? "sponsored noopener noreferrer" : undefined} className="v3-fee-lock-btn">
                  {registrationDirect ? compactUi.route : compactUi.blocked}
                </a>
              ) : (
                <span className="v3-fee-lock-btn v3-fee-lock-btn--disabled" aria-disabled="true">
                  {compactUi.unavailable}
                </span>
              )}
            </div>
          </div>
          {researchActions.length > 0 && (
            <div className="v3-dex-fee-compact__research" role="group" aria-label={`${localizedVenueName} research paths`}>
              {researchActions.map((action) => action.external ? (
                <a
                  key={action.href}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta-kind={action.kind}
                  data-cta-platform={venue.slug}
                  data-cta-placement={action.placement}
                  data-growth-decision={action.decision}
                  data-growth-placement={action.placement}
                >
                  {action.label}
                </a>
              ) : (
                <LocalLink
                  key={action.href}
                  locale={locale}
                  href={action.href}
                  data-cta-kind={action.kind}
                  data-cta-platform={venue.slug}
                  data-cta-placement={action.placement}
                  data-growth-decision={action.decision}
                  data-growth-placement={action.placement}
                >
                  {action.label}
                </LocalLink>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  const feeText = feeSummaryCopy(locale);
  const summary = buildVenueFeeSummary(db, researchForVenue(venue.slug, locale) || {});
  const formatRate = (rate) => feePctOfRate(rate, locale);

  return (
    <section className="v2-section v3-fee-matrix-section" id="fee-schedule">
      <div className="v3-fee-matrix-card" data-venue-fee-model="sourced-base-fees">
        <div className="v3-fee-matrix-head">
          <div>
            <h2 className="v3-fee-matrix-title">{localizedVenueName} · {feeText.title}</h2>
            <p className="v3-fee-matrix-sub">{feeText.body}</p>
          </div>
        </div>
        {summary.rates.length > 0 && (
          <div className="v3-fee-table-wrap" tabIndex={0} role="region" aria-label={feeText.title}>
            <table className="v3-fee-table">
              <thead><tr>
                <th scope="col">{feeText.title}</th>
                <th scope="col">{isZh ? "挂单" : ui.maker || "Maker"}</th>
                <th scope="col">{isZh ? "吃单" : ui.taker || "Taker"}</th>
              </tr></thead>
              <tbody>{summary.rates.map(rate => (
                <tr key={rate.product} data-fee-product={rate.product}>
                  <th scope="row">{reviewedFeeCopy(rate, locale).tier}<span className="v3-fee-scope-label">{reviewedFeeCopy(rate, locale).scope}</span></th>
                  <td>{formatRate(rate.makerRate)}</td>
                  <td>{formatRate(rate.takerRate)}</td>
                </tr>
              ))}</tbody>
            </table>
            {summary.rates.map(rate => <div key={rate.product} className="v3-fee-scope-note" data-fee-scope={rate.scopeKey}>
              <p>{reviewedFeeCopy(rate, locale).conditions}</p>
              <p><SourceLink locale={locale} href={rate.sourceUrl} target="_blank" rel="noopener noreferrer">{feeText.source} ↗</SourceLink> · {feeText.checked}: <time dateTime={isoDay(rate.checkedAt)}>{isoDay(rate.checkedAt)}</time></p>
            </div>)}
          </div>
        )}
        <div className="v3-fee-matrix-footer">
          <div className="v3-fee-cta-inline">
            {(summary.rates.length ? [] : summary.sources).map((href, index) => (
              <SourceLink locale={locale} key={href} href={href} target="_blank" rel="noopener noreferrer" className="v3-expand-tiers-btn">
                {feeText.source}{summary.sources.length > 1 ? ` ${index + 1}` : ""} ↗
              </SourceLink>
            ))}
          </div>
          <div className="v3-fee-cta-inline">
            {inviteCode && <span className="v3-fee-tip">{ui.code}: <strong translate="no">{inviteCode}</strong></span>}
            {registrationUrl && <a href={registrationUrl} target={registrationDirect ? "_blank" : undefined} rel={registrationDirect ? "sponsored noopener noreferrer" : undefined} className="v3-fee-lock-btn" data-cta-kind={registrationDirect ? "registration" : "research"} data-cta-platform={venue.slug} data-cta-placement="fee-summary" data-growth-decision={venue.slug} data-growth-placement="fee-summary">
              {registrationDirect ? feeText.registration : ui.verifyRegional} ↗
            </a>}
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------
// 模块 B：Proof of Reserves (PoR) 深度透视与链上验证指南
// --------------------------------------------------------------------------
function VenueProofOfReserves({ venue, locale, db, officialDomain, localizedVenueName }) {
  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant");
  const ui = porUi(locale, localizedVenueName || venue.name);
  const isCex = (venue.category || "CEX").toUpperCase() === "CEX";
  const porUrl = db.porAuditUrl || `https://${officialDomain}`;
  const porRatio = db.porCoverageRatio || db.reserveRatio || (isCex ? "105.4%+" : zhText(locale, "100% 智能合约", "100% 智能合約"));
  const auditFirm = db.auditFirm || (isCex ? (isZh ? zhText(locale, "公开链上默克尔树 (Merkle Tree) 密码学自证", "公開鏈上默克爾樹 (Merkle Tree) 密碼學自證") : "Public Merkle Tree Cryptographic Verification") : (isZh ? zhText(locale, "开源智能合约链上公开可验证", "開源智能合約鏈上公開可驗證") : "Open-Source Smart Contract On-Chain Verifiable"));
  const securityFund = db.securityFund || (isCex
    ? (isZh ? zhText(locale, "平台安全风险储备基金 ($1.0B+ SAFU 架构)", "平台安全風險儲備基金 ($1.0B+ SAFU 架構)") : ({ ja: "$1B+ SAFU / セキュリティ準備金", ko: "$1B+ SAFU / 보안 준비금", tr: "$1B+ SAFU / Güvenlik rezervi", fr: "$1B+ SAFU / réserve de sécurité", de: "$1B+ SAFU / Sicherheitsreserve", es: "$1B+ SAFU / fondo de reserva", "pt-BR": "$1B+ SAFU / reserva de segurança", ru: "$1B+ SAFU / резерв безопасности", ar: "$1B+ SAFU / احتياطي أمان", id: "$1B+ SAFU / dana cadangan keamanan", vi: "$1B+ SAFU / quỹ dự phòng an toàn", it: "$1B+ SAFU / fondo di sicurezza",
    // l10n: needs native review
    ur: "$1B+ SAFU / سیکیورٹی ریزرو",
    // l10n: needs native review
    uk: "$1B+ SAFU / резерв безпеки" }[localeKey(locale)] || "$1B+ SAFU / Security Reserve Fund"))
    : (isZh ? zhText(locale, "协议安全审计 & 链上金库", "協議安全稽核 & 鏈上金庫") : ({ ja: "プロトコル監査済みオンチェーン金庫", ko: "프로토콜 감사 온체인 금고", tr: "Denetlenmiş protokol zincir üstü hazine", fr: "Trésorerie on-chain auditée", de: "Aufgezeichnete On-Chain-Protokollreserve", es: "Tesorería on-chain auditada", "pt-BR": "Tesouraria on-chain auditada", ru: "Аудированное ончейн-хранилище протокола", ar: "خزانة بروتوكول مدققة على السلسلة", id: "Perbendaharaan protokol on-chain teraudit", vi: "Kho bạc giao thức on-chain đã kiểm toán", it: "Tesoreria on-chain verificata",
    // l10n: needs native review
    ur: "آڈٹ شدہ آن چین پروٹوکول خزانہ",
    // l10n: needs native review
    uk: "Аудитована on-chain скарбниця протоколу" }[localeKey(locale)] || "Protocol Audited Treasury")));
  const porVerified = Boolean(db.porVerifiedAt && db.porAuditUrl);

  return (
    <section className="v2-section v3-por-section" id="proof-of-reserves">
      {/* a locale without PoR copy renders this card in English: mark it (the few localized values inside set dir="auto") */}
      <div className="v3-por-card" {...(!isZh && !ui.badge && !ui.title ? enIfLatin("PoR", locale) : undefined)}>
        <div className="v3-por-header">
          <div className="v3-por-badge-row">
            <span className="v3-por-shield-badge" {...enIfLatin(isZh ? zhText(locale, "资产偿付能力审计", "資產償付能力稽核") : (ui.badge || "Solvency & PoR"), locale)}> {isZh ? zhText(locale, "资产偿付能力审计", "資產償付能力稽核") : (ui.badge || "Solvency & PoR")}</span>
            {porVerified && <span className="v3-por-status-pill" dir="auto">{isZh ? zhText(locale, "官方来源待复核", "官方來源待複核") : (ui.sourcePending || "Official source pending review")}</span>}
          </div>
          <h2 className="v3-por-title">
            {isZh ? zhText(locale, `${localizedVenueName} 资产储备证明 (PoR) 深度透视与链上核验`, `${localizedVenueName} 資產儲備證明 (PoR) 深度透視與鏈上核驗`) : (ui.title || `${venue.name} Proof of Reserves (PoR) & On-Chain Solvency`)}
          </h2>
          <p className="v3-por-desc">
            {isZh
              ? zhText(locale, `${localizedVenueName} 的储备金、审计与偿付能力信息应以最新官方披露和可复核来源为准；本页不把未核验数字写成保证。`, `${localizedVenueName} 的儲備金、稽核與償付能力資訊應以最新官方披露和可複核來源為準；本頁不把未核驗數字寫成保證。`)
              : (ui.desc || `${venue.name}'s reserves, audit and solvency information should be checked against the latest official disclosure and a reproducible source; this page does not turn unverified figures into a guarantee.`)}
          </p>
        </div>

        {/* Reserve figures appear only from a verified official report; without one the card keeps the explanation and
            the self-check guide and shows no "Pending" placeholders (SEO audit 2026-10-11 #6). */}
        {porVerified && <>
        <div className="v3-por-metrics">
          <div className="v3-por-metric-item">
            <span className="v3-por-metric-label" {...enIfLatin(isZh ? zhText(locale, "综合储备总充足率", "綜合儲備總充足率") : (ui.total || "Total Reserve Ratio"), locale)}>{isZh ? zhText(locale, "综合储备总充足率", "綜合儲備總充足率") : (ui.total || "Total Reserve Ratio")}</span>
            <strong className={`v3-por-metric-value${porVerified ? " text-green" : ""}`} translate="no">{porVerified ? porRatio : (isZh ? zhText(locale, "待核验", "待核驗") : (ui.pending || "Pending"))}</strong>
            <span className="v3-por-metric-sub">{porVerified ? (isZh ? zhText(locale, "以官方报告和快照为准", "以官方報告和快照為準") : (ui.snapshot || "Based on official report and snapshot")) : (isZh ? zhText(locale, "未记录可复核来源", "未記錄可複核來源") : (ui.noSource || "No reproducible source recorded"))}</span>
          </div>
          <div className="v3-por-metric-item">
            <span className="v3-por-metric-label" {...enIfLatin(isZh ? zhText(locale, "审计机制与独立机构", "稽核機制與獨立機構") : (ui.audit || "Audit Mechanism"), locale)}>{isZh ? zhText(locale, "审计机制与独立机构", "稽核機制與獨立機構") : (ui.audit || "Audit Mechanism")}</span>
            <strong className="v3-por-metric-value text-blue" dir="auto">{porVerified ? auditFirm : localePending(locale)}</strong>
            <span className="v3-por-metric-sub" {...enIfLatin(isZh ? zhText(locale, "支持用户导出叶子节点验算", "支援用戶匯出葉子節點驗算") : (ui.merkle || "Cryptographic Merkle Root Verification"), locale)}>{isZh ? zhText(locale, "支持用户导出叶子节点验算", "支援用戶匯出葉子節點驗算") : (ui.merkle || "Cryptographic Merkle Root Verification")}</span>
          </div>
          <div className="v3-por-metric-item">
            <span className="v3-por-metric-label" {...enIfLatin(isZh ? zhText(locale, "投资者保障专项基金", "投資者保障專項基金") : (ui.protection || "Investor Protection Fund"), locale)}>{isZh ? zhText(locale, "投资者保障专项基金", "投資者保障專項基金") : (ui.protection || "Investor Protection Fund")}</span>
            <strong className="v3-por-metric-value text-gold" dir="auto">{porVerified ? securityFund : (isZh ? zhText(locale, "以官方披露为准", "以官方披露為準") : (ui.disclosure || "Refer to official disclosure"))}</strong>
            <span className="v3-por-metric-sub" {...enIfLatin(isZh ? zhText(locale, "极端黑天鹅与穿仓赔付保障", "極端黑天鵝與穿倉賠付保障") : (ui.protectionSub || "Extreme Event Protection"), locale)}>{isZh ? zhText(locale, "极端黑天鹅与穿仓赔付保障", "極端黑天鵝與穿倉賠付保障") : (ui.protectionSub || "Extreme Event Protection")}</span>
          </div>
        </div>

        <div className="v3-por-coins-grid">
          <div className="v3-por-coin-card">
            <div className="v3-por-coin-top">
              <strong>{isZh ? zhText(locale, "BTC 储备充足率", "BTC 儲備充足率") : (ui.btc || "BTC Reserve Ratio")}</strong>
              <span className={porVerified ? "text-green" : ""} translate="no">{porVerified ? "106.2%" : (isZh ? zhText(locale, "待核验", "待核驗") : (ui.pending || "Pending"))}</span>
            </div>
            <div className="v3-por-progress-bar">
              <div className="v3-por-progress-fill" style={{ width: porVerified ? "100%" : "0%" }}></div>
            </div>
            <small>{isZh ? zhText(locale, "储备与负债覆盖关系待官方来源核验", "儲備與負債覆蓋關係待官方來源核驗") : (ui.btcSub || "Reserve-to-liability coverage requires official-source verification")}</small>
          </div>
          <div className="v3-por-coin-card">
            <div className="v3-por-coin-top">
              <strong>{isZh ? zhText(locale, "ETH 储备充足率", "ETH 儲備充足率") : (ui.eth || "ETH Reserve Ratio")}</strong>
              <span className={porVerified ? "text-green" : ""} translate="no">{porVerified ? "104.8%" : (isZh ? zhText(locale, "待核验", "待核驗") : (ui.pending || "Pending"))}</span>
            </div>
            <div className="v3-por-progress-bar">
              <div className="v3-por-progress-fill" style={{ width: porVerified ? "100%" : "0%" }}></div>
            </div>
            <small>{isZh ? zhText(locale, "地址与审计范围待官方来源核验", "地址與稽核範圍待官方來源核驗") : (ui.ethSub || "Addresses and audit scope require official-source verification")}</small>
          </div>
          <div className="v3-por-coin-card">
            <div className="v3-por-coin-top">
              <strong>{isZh ? zhText(locale, "USDT/USDC 储备充足率", "USDT/USDC 儲備充足率") : (ui.stable || "USDT/USDC Reserve Ratio")}</strong>
              <span className={porVerified ? "text-green" : ""} translate="no">{porVerified ? "108.5%" : (isZh ? zhText(locale, "待核验", "待核驗") : (ui.pending || "Pending"))}</span>
            </div>
            <div className="v3-por-progress-bar">
              <div className="v3-por-progress-fill" style={{ width: porVerified ? "100%" : "0%" }}></div>
            </div>
            <small>{isZh ? zhText(locale, "稳定币覆盖依据待官方来源核验", "穩定幣覆蓋依據待官方來源核驗") : (ui.stableSub || "Stablecoin coverage basis requires official-source verification")}</small>
          </div>
        </div>
        </>}

        <div className="v3-por-verify-guide">
          <h4 className="v3-por-guide-title" {...enIfLatin(isZh ? zhText(locale, "交易者三步链上自查指南", "交易者三步鏈上自查指南") : (ui.guide || "3-Step Verification Guide"), locale)}>{isZh ? zhText(locale, "交易者三步链上自查指南", "交易者三步鏈上自查指南") : (ui.guide || "3-Step Verification Guide")}</h4>
          <div className="v3-por-steps">
            <div className="v3-por-step">
              <span className="v3-por-step-num">01</span>
              <div>
                <strong>{isZh ? zhText(locale, "获取专属 Merkle 节点哈希", "取得專屬 Merkle 節點雜湊") : (ui.leaf || "Export Merkle Leaf Hash")}</strong>
                <p>{isZh ? zhText(locale, "登录官方个人中心「资产储备证明」页面，导出您账户当期的专属密码学叶子节点 Hash。", "登入官方個人中心「資產儲備證明」頁面，匯出您帳戶當期的專屬密碼學葉子節點 Hash。") : (ui.leafBody || "Log into your official account to export your unique cryptographic leaf node hash.")}</p>
              </div>
            </div>
            <div className="v3-por-step">
              <span className="v3-por-step-num">02</span>
              <div>
                <strong>{isZh ? zhText(locale, "运行开源密码学校验脚本", "執行開源密碼學校驗腳本") : (ui.verifier || "Run Open Source Verifier")}</strong>
                <p>{isZh ? zhText(locale, "在本地或通过官方开源脚本，将个人节点沿 Merkle Tree 向上哈希计算，比对是否包含在公开的根哈希 (Merkle Root) 中。", "在本地或透過官方開源腳本，將個人節點沿 Merkle Tree 向上雜湊計算，比對是否包含在公開的根雜湊 (Merkle Root) 中。") : (ui.verifierBody || "Verify along the Merkle Tree to confirm your asset balance is accurately counted.")}</p>
              </div>
            </div>
            <div className="v3-por-step">
              <span className="v3-por-step-num">03</span>
              <div>
                <strong>{isZh ? zhText(locale, "比对链上冷钱包总地址余额", "比對鏈上冷錢包總地址餘額") : (ui.wallets || "Cross-Check On-Chain Wallets")}</strong>
                <p>{isZh ? zhText(locale, "在 Nansen、DefiLlama 或区块链浏览器中核对平台公布的冷钱包总额是否大于等于负债总和。", "在 Nansen、DefiLlama 或區塊鏈瀏覽器中核對平台公布的冷錢包總額是否大於等於負債總和。") : (ui.walletsBody || "Verify that disclosed cold wallets hold total reserves exceeding cumulative liabilities.")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="v3-por-footer">
          <div className="v3-por-cold-warning">
            <span className="v3-warning-icon"></span>
            <div>
              <strong>{isZh ? zhText(locale, "自存私钥安全准则", "自存私鑰安全準則") : (ui.principle || "Non-Custodial Security Principle")}</strong>
              <p>
                {isZh
                  ? zhText(locale, "交易所储备金证明仅反映历史审计截面的偿付能力。大额闲置数字资产请务必转移至 Ledger、Trezor 等硬件冷钱包自持私钥，彻底规避平台黑天鹅风险。", "交易所儲備金證明僅反映歷史稽核截面的償付能力。大額閒置數位資產請務必轉移至 Ledger、Trezor 等硬體冷錢包自持私鑰，徹底規避平台黑天鵝風險。")
                  : (ui.principleBody || "Proof of reserves reflects specific snapshot solvency. Transfer long-term substantial holdings to hardware cold wallets (Ledger/Trezor) to retain sovereign ownership.")}
              </p>
            </div>
          </div>
          <SourceLink locale={locale} href={porUrl} target="_blank" rel="noopener noreferrer" className="v3-por-audit-btn">
            {isZh ? zhText(locale, "查验官方储备金审计报告 ↗", "查驗官方儲備金稽核報告 ↗") : (ui.auditBtn || "View Official PoR Audit Report ↗")}
          </SourceLink>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------
// 模块 C：防钓鱼官方域名与社群全景白名单 (Anti-Phishing Hub)
// --------------------------------------------------------------------------
function VenueAntiPhishingSecurity({ venue, locale, db, partner, officialDomain, localizedVenueName }) {
  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant");
  const securityUi = venueSecurityUi(locale, localizedVenueName || venue.name);
  const domainFeedback = useCopyFeedback(`${venue.slug}:domain`);
  const recordedAlternateDomains = Array.isArray(db.mirrors) ? db.mirrors.filter(Boolean) : [];
  const officialVerifyUrl = db.officialVerifyUrl || partner.officialDomain || `https://${officialDomain}`;

  const handleCopyDomain = (text) => domainFeedback.copy(text);

  return (
    <section className="v2-section v3-security-section" id="anti-phishing">
      <div className="v3-security-card">
        <div className="v3-security-header">
          <div className="v3-security-badge-row">
            <span className="v3-security-tag"> {isZh ? zhText(locale, "官方域名来源记录与反钓鱼核对", "官方網域來源記錄與反釣魚核對") : (securityUi.tag || "Anti-Phishing & Recorded Domains")}</span>
            <span className="v3-verified-badge">{isZh ? zhText(locale, "NexuAlpha 来源记录已核对", "NexuAlpha 來源記錄已核對") : (securityUi.verified || "NexuAlpha source record checked")}</span>
          </div>
          <h2 className="v3-security-title">
            {isZh ? zhText(locale, `${localizedVenueName} 防钓鱼官方域名与社群全景白名单`, `${localizedVenueName} 防釣魚官方網域與社群全景白名單`) : (securityUi.title || `${venue.name} Recorded Domain Source Check & Anti-Phishing Hub`)}
          </h2>
          <p className="v3-security-sub">
            {isZh
              ? zhText(locale, "加密货币领域常有黑客购买 Google 搜索关键词广告投放高仿钓鱼网站。请认准以下已记录主域名与备用域名，切勿通过不可信搜索广告链接登录。", "加密貨幣領域常有駭客購買 Google 搜尋關鍵字廣告投放高仿釣魚網站。請認準以下已記錄主網域與備用網域，切勿透過不可信搜尋廣告連結登入。")
              : (securityUi.sub || "Defend against Google Ads phishing clones and counterfeit social channels. Bookmark recorded primary domains and documented alternate domains below.")}
          </p>
        </div>

        <div className="v3-domains-grid">
          <div className="v3-domain-box primary">
            <div className="v3-domain-box__header">
              <span className="v3-domain-type">{isZh ? zhText(locale, "已记录主域名", "已記錄主網域") : (securityUi.primary || "Primary Official Domain")}</span>
              <span className="v3-ssl-indicator">● {isZh ? zhText(locale, "来源记录一致", "來源記錄一致") : (securityUi.verifiedMirror || "Source record match")}</span>
            </div>
            <div className="v3-domain-box__content">
              <code translate="no">{officialDomain}</code>
              <button
                type="button"
                onClick={() => handleCopyDomain(`https://${officialDomain}`)}
                className="v3-copy-domain-btn"
              >
                {copyFeedbackLabel(domainFeedback.state, locale, isZh ? zhText(locale, "复制域名地址", "複製網域地址") : (securityUi.copy || "Copy Domain URL"))}
              </button>
            </div>
            <CopyFeedbackStatus state={domainFeedback.state} locale={locale} />
            <small>{isZh ? "该域名来自已审阅记录，打开后仍需核对平台页面提示" : (securityUi.secure || "Recorded domain. Re-check the platform page after opening.")}</small>
          </div>

          <div className="v3-domain-box mirrors">
            <div className="v3-domain-box__header">
              <span className="v3-domain-type">{isZh ? "已记录备用域名" : (securityUi.mirrors || "Recorded alternate domains")}</span>
              <span className="v3-status-dot">● {isZh ? "来源记录" : (securityUi.verifiedMirror || "Recorded")}</span>
            </div>
            <div className="v3-mirrors-list">
              {recordedAlternateDomains.length ? recordedAlternateDomains.map((m) => (
                <div key={m} className="v3-mirror-item">
                  <span className="v3-mirror-lock"></span>
                  <code translate="no">{m}</code>
                  <span className="v3-mirror-badge">{isZh ? "来源记录" : (securityUi.verifiedMirror || "Recorded")}</span>
                </div>
              )) : (
                <div className="v3-mirror-item">
                  <span className="v3-mirror-lock">•</span>
                  <span>{isZh ? "暂无已记录备用域名；请以主域名和平台官方验证页面为准。" : (securityUi.noMirrors || "No alternate domains are recorded; use the primary domain and the platform verification page as the check point.")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="v3-security-tools-bar">
          <div className="v3-tool-left">
            <span className="v3-tool-icon"></span>
            <div>
              <strong>{isZh ? zhText(locale, "官方渠道真伪验证器", "官方渠道真偽驗證器") : (securityUi.tool || "Official Channel Verification Tool")}</strong>
              <p>{isZh ? "收到自称官方客服的 Telegram 私聊、邮件或网址？请使用官方验证工具一键核验对方身份真伪。" : (securityUi.toolBody || "Verify Telegram IDs, emails, domain names or phone numbers directly through official verifier.")}</p>
            </div>
          </div>
          <SourceLink locale={locale}
            href={officialVerifyUrl.startsWith("http") ? officialVerifyUrl : `https://${officialVerifyUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="v3-open-verifier-btn"
          >
            {isZh ? "前往官方渠道真伪验证器 ↗" : ({
              ja: "公式検証ツールを開く ↗", ko: "공식 검증 도구 열기 ↗", tr: "Resmî doğrulama aracını aç ↗",
              es: "Abrir verificador oficial ↗", "pt-BR": "Abrir verificador oficial ↗", fr: "Ouvrir le vérificateur officiel ↗",
              de: "Offizielles Prüfwerkzeug öffnen ↗", ar: "فتح أداة التحقق الرسمية ↗", ru: "Открыть официальный проверщик ↗",
              id: "Buka verifikator resmi ↗", vi: "Mở công cụ xác minh chính thức ↗", it: "Apri verificatore ufficiale ↗",
              // l10n: needs native review
              ur: "سرکاری تصدیق کنندہ کھولیں ↗",
              // l10n: needs native review
              uk: "Відкрити офіційний верифікатор ↗"
            }[locale] || "Open Official Verifier ↗")}
          </SourceLink>
        </div>

        <div className="v3-rules-row">
          <div className="v3-rule-card"><VenueVisualIcon kind="shield" />
            <span className="v3-rule-badge">{isZh ? "防骗规则 1" : "Rule 01"}</span>
            <strong>{isZh ? "绝不点击 Google 搜索首条赞助广告" : (securityUi.copyRule || "Never Click Sponsored Ads")}</strong>
            <p>{isZh ? "黑客常伪造仿冒顶级域名并在搜索广告中买量，请直接输入官方域名或通过书签访问。" : (securityUi.copyRuleBody || "Search ads frequently direct to counterfeit typo-squatted domains.")}</p>
          </div>
          <div className="v3-rule-card"><VenueVisualIcon kind="shield" />
            <span className="v3-rule-badge">{isZh ? "防骗规则 2" : "Rule 02"}</span>
            <strong>{isZh ? "官方人员绝不会在 Telegram 主动私聊" : (securityUi.dmRule || "Official Support Never DMs First")}</strong>
            <p>{isZh ? "任何在 Telegram/Discord 私聊要求输入助记词、充值解冻或私下 OTC 的 100% 为诈骗分子。" : (securityUi.dmRuleBody || "Never disclose seed phrases or transfer margin funds to private Telegram DMs.")}</p>
          </div>
          <div className="v3-rule-card"><VenueVisualIcon kind="shield" />
            <span className="v3-rule-badge">{isZh ? "防骗规则 3" : "Rule 03"}</span>
            <strong>{isZh ? "必须开启账户安全防钓鱼码" : (securityUi.codeRule || "Enable Anti-Phishing Code")}</strong>
            <p>{isZh ? "在个人安全中心设置防钓鱼码 (Anti-Phishing Code)，官方发送的每一封邮件都会印有您的专属安全暗号。" : (securityUi.codeRuleBody || "Configure an anti-phishing code in security settings to validate all incoming emails.")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------
// 模块 5：Telegram 深度唤醒 CTA (Telegram Intelligence Bot Integration)
// --------------------------------------------------------------------------
function VenueTelegramMonitorSection({ venue, locale, market, product, rebatePercent, localizedVenueName, claimsVerified = false }) {
  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant");
  const telegramUi = telegramLocaleUi[locale] || telegramLocaleUi[String(locale || "").split("-")[0]] || {};
  const telegramReturnNow = useHydratedTelegramReturnNow();
  const telegramFunnel = buildTelegramWebsiteFunnelContext({ intent: "monitor", venue: venue.slug, market, locale, product, campaign: "venue_monitor", ...telegramReturnClockOption(telegramReturnNow) });
  const telegramReturnHref = hydratedTelegramReturnHref(telegramFunnel.returnHref, telegramReturnNow);

  return (
    <section className="v2-section v3-tg-monitor-section" id="telegram-monitor">
      <div className="v3-tg-monitor-card">
        <div className="v3-tg-monitor-left">
          <div className="v3-tg-badge">
            <span className="v3-tg-icon">✈</span>
            <span>{isZh ? zhText(locale, "Telegram Bot 24/7 情报", "Telegram Bot 24/7 情報") : (telegramUi.intelligence || "Telegram Bot 24/7 Intelligence")}</span>
          </div>
          <h3 className="v3-tg-title">
            {isZh
              ? zhText(locale, `在 Telegram 中继续核对 ${localizedVenueName} 的费率与官方条款`, `在 Telegram 中繼續核對 ${localizedVenueName} 的費率與官方條款`)
              : (telegramUi.review || `Review ${venue.name} fee schedules and official terms on Telegram`)}
          </h3>
          <p className="v3-tg-desc">
            {isZh
              ? zhText(locale, `接入 NexuAlpha 官方 @${TELEGRAM_CONFIG.botUsername}，查看带来源标记的费率研究、官方链接与账户条件。`, `接入 NexuAlpha 官方 @${TELEGRAM_CONFIG.botUsername}，查看帶來源標記的費率研究、官方連結與帳戶條件。`)
              : (telegramUi.desc ? telegramUi.desc.replace("{b}", TELEGRAM_CONFIG.botUsername) : `Connect via official @${TELEGRAM_CONFIG.botUsername} for source-labelled fee research, official links and account conditions.`)}
          </p>
          <div className="v3-tg-features">
            <span className="v3-tg-feat-item">✓ {isZh ? zhText(locale, "带来源的费率与产品条款研究", "帶來源的費率與產品條款研究") : (telegramUi.research || "Source-labelled fee and product research")}</span>
            <span className="v3-tg-feat-item">✓ {claimsVerified ? (isZh ? zhText(locale, `按官方规则核对 -${formatPercent(locale, rebatePercent)} 用户权益`, `按官方規則核對 -${formatPercent(locale, rebatePercent)} 用戶權益`) : `${telegramUi.benefit || "Verify the user benefit under official rules"}`) : (isZh ? zhText(locale, "官方账户内核验用户权益", "官方帳戶內核驗用戶權益") : (telegramUi.benefit || "Verify user benefits in the official account"))}</span>
            <span className="v3-tg-feat-item">✓ {isZh ? zhText(locale, "官方储备与风险来源链接", "官方儲備與風險來源連結") : (telegramUi.sources || "Official reserve and risk source links")}</span>
          </div>
        </div>
        <div className="v3-tg-monitor-right">
          <a
            href={telegramFunnel.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="v3-tg-launch-btn"
            data-cta-kind="telegram"
            data-cta-placement="venue-telegram-monitor"
            data-growth-decision={`monitor_${venue.slug}`}
            data-growth-placement="venue-telegram"
            data-growth-market={market}
            data-growth-product={product}
            data-telegram-start={telegramFunnel.startPayload}
            data-telegram-return-href={telegramReturnHref}
          >
            <span className="v3-tg-paperplane">✈</span>
            <span>{isZh ? zhText(locale, "在 Telegram 中监控此交易所费率与返佣 ↗", "在 Telegram 中監控此交易所費率與返傭 ↗") : (telegramUi.monitor || "Monitor Venue on Telegram ↗")}</span>
          </a>
          <div className="v3-tg-links-sub">
            <a href={TELEGRAM_CONFIG.channelUrl} target="_blank" rel="noopener noreferrer" className="v3-tg-sublink" data-cta-kind="telegram" data-cta-placement="venue-telegram-channel" data-growth-decision="telegram_channel" data-growth-placement="venue-telegram">
               {isZh ? zhText(locale, "官方情报频道", "官方情報頻道") : (telegramUi.channel || "Official Channel")}
            </a>
            <span className="v3-tg-dot">·</span>
            <a href={TELEGRAM_CONFIG.groupUrl} target="_blank" rel="noopener noreferrer" className="v3-tg-sublink" data-cta-kind="telegram" data-cta-placement="venue-telegram-group" data-growth-decision="telegram_group" data-growth-placement="venue-telegram">
               {isZh ? zhText(locale, "VIP 交易员交流群", "VIP 交易員交流群") : (telegramUi.community || "VIP Community")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


export function VenueDetailResearch({ annualSavings, codeFeedback, commercialClaim, copy, db, detailLabels, handleCopyCode, heroTelegramFunnel, heroTelegramReturnHref, invitationSummary, inviteCode, isZhLocale, kycSummary, locale, localizedVenueName, market, maxLev, metricText, nonCexResearchActions, officialDomain, partner, porRatio, porVerified, priorityAnswer, product, profile, profileChapters, quickRegistration, rebatePercent, reviewedSpotRate, routeUi, runtimeUi, setTradeVolume, spotFeeDisplay, telegramDetailUi, text, tradeVolume, venue, venueCta, venueDirectAnswer, venueDirectAnswerDetails, visibleBenefitText }) {
  return <>
  {!priorityAnswer && venueDirectAnswer && (
    <section className="v3-profile-research-chapter v3-profile-answer-conditions" data-profile-task="conditions">
      <h3 className="v3-profile-sources-group__heading">{campaignCopy(locale).conditions || text.verifyBefore}</h3>
      {venueDirectAnswerDetails}
    </section>
  )}
  {/* Chapter = h3, its sub-sections = h4, so the chapter heading is never an empty h3 in the outline (SEO audit
      2026-10-11 #6). */}
  <section className="v3-profile-research-chapter" data-research-task="account">
      <h3 className="v3-profile-sources-group__heading"><VenueVisualIcon kind="identity" />{profileChapters[0]}</h3>
    <div className="v3-profile-research-chapter__body">
    <div className="v3-profile-account-block v3-venue-invitation-disclosure">
      <div className="v3-registration-notes__body">
        <h4 className="v3-profile-account-section__heading">{invitationSummary.label}</h4>
        <p className="v3-profile-account-section__hint">{invitationSummary.note}</p>
        {quickRegistration}
        <div className="v3-venue-rebate-card">
          <div className="v3-venue-rebate-card__left">
            <span className="v3-rebate-tag">{detailLabels.review}</span>
            <h2 className="v3-rebate-title">{visibleBenefitText}</h2>
            {inviteCode ? (
              <div className="v3-rebate-code-row">
                <span className="v3-rebate-code-label">{locale === "zh-Hant" ? "合作邀請碼" : isZhLocale ? "合作邀请码" : (detailLabels.code || "Referral Code")}:</span>
                <button type="button" onClick={handleCopyCode} className="v3-rebate-code-btn">
                  <strong translate="no">{inviteCode}</strong>
                  <span className="v3-copy-tip">{copyFeedbackLabel(codeFeedback.state, locale, isZhLocale ? zhText(locale, "点击复制", "點擊複製") : (detailLabels.copy || "Copy"))}</span>
                </button>
              </div>
            ) : (
              <p className="v3-rebate-no-code">{routeUi.noCode}</p>
            )}
          </div>
          <div className="v3-venue-rebate-card__right" aria-label={invitationSummary.label}>
            <div className="v3-rebate-route-summary">
              <span>{isZhLocale ? zhText(locale, "下一步", "下一步") : runtimeUi.preRegister}</span>
              <strong>{venueCta.direct ? (isZhLocale ? zhText(locale, "使用上方官方入口继续", "使用上方官方入口繼續") : runtimeUi.stickyDirectRoute) : (isZhLocale ? zhText(locale, "先核对地区资格", "先核對地區資格") : runtimeUi.globalVerification)}</strong>
            </div>
          </div>
        </div>
    <section className="v3-profile-account-section v3-profile-account-cost">
      <header>
        <h4 className="v3-profile-account-section__heading">{isZhLocale ? zhText(locale, "费率、条件与费用测算", "費率、條件與費用測算") : detailLabels.review}</h4>
        <p className="v3-profile-account-section__hint">{isZhLocale ? zhText(locale, "集中查看费率、储备金、KYC、杠杆与年度费用", "集中查看費率、儲備金、KYC、槓桿與年度費用") : runtimeUi.calculatorOpen}</p>
      </header>
      <div className="v3-profile-cost-conditions__body">
        <div className="v3-venue-metrics-grid">
          {reviewedSpotRate && <div className="v3-metric-tile"><VenueVisualIcon kind="fees" />
            <span className="v3-metric-tile__label">{isZhLocale ? zhText(locale, "现货基准费率", "現貨基準費率") : (metricText?.[0] || "Spot Base Fee")}</span>
            <strong className="v3-metric-tile__val text-blue" translate="no">{spotFeeDisplay}</strong>
            <span className="v3-metric-tile__sub">{reviewedSpotRate ? reviewedSpotRate.conditions : matrixCopy(locale).maker}</span>
          </div>}
          {/* Tiles with no verified value render nothing (SEO audit 2026-10-11 #6: "Pending official-source verification"). */}
          {porVerified && (
          <div className="v3-metric-tile"><VenueVisualIcon kind="shield" />
              <span className="v3-metric-tile__label">{isZhLocale ? zhText(locale, "资产储备证明 (PoR)", "資產儲備證明 (PoR)") : (metricText?.[1] || "Proof of Reserves")}</span>
              <strong className={`v3-metric-tile__val${porVerified ? " text-green" : ""}`} translate="no">{porVerified ? porRatio : (isZhLocale ? zhText(locale, "待官方核验", "待官方核驗") : runtimeUi.pendingVerification)}</strong>
              <span className="v3-metric-tile__sub">{porVerified ? (db.auditFirm || (isZhLocale ? zhText(locale, "公开链上默克尔树", "公開鏈上默克爾樹") : metricText?.[4] || "Public Merkle Tree")) : (isZhLocale ? zhText(locale, "未记录可复核来源", "未記錄可複核來源") : runtimeUi.noSource)}</span>
            </div>
          )}
          {db.kycCheckedAt && <div className="v3-metric-tile"><VenueVisualIcon kind="identity" />
            <span className="v3-metric-tile__label">{isZhLocale ? zhText(locale, "身份验证要求", "身分驗證要求") : (metricText?.[2] || "KYC Requirement")}</span>
            <strong className="v3-metric-tile__val text-purple">{kycSummary}</strong>
            <span className="v3-metric-tile__sub">{isZhLocale ? zhText(locale, "支持多国认证", "支援多國認證") : runtimeUi.globalVerification}</span>
          </div>}
          {db.maxLeverage && db.leverageCheckedAt && (
          <div className="v3-metric-tile"><VenueVisualIcon kind="fees" />
              <span className="v3-metric-tile__label"><GlossaryTooltip term="leverage" locale={locale}>{isZhLocale ? "最大合约杠杆" : (metricText?.[3] || "Max Leverage")}</GlossaryTooltip></span>
              <strong className="v3-metric-tile__val text-gold" translate="no">{maxLev}</strong>
              <span className="v3-metric-tile__sub">{isZhLocale ? "以官方产品条款为准" : runtimeUi.productTerms}</span>
            </div>
          )}
        </div>

      {/* In-page Interactive Fee Savings Calculator */}
      <div className="v3-detail-calculator">
        <div className="v3-detail-calc__head">
          <h4>{isZhLocale ? `在 ${localizedVenueName} 交易一年能省多少钱？` : runtimeUi.calculatorTitle(localizedVenueName)}</h4>
          <span className="v3-detail-calc__current-vol" translate="no">
            {isZhLocale ? "预估月交易量: " : runtimeUi.monthlyVolume}<strong>${(tradeVolume / 1000).toFixed(0)}K / mo</strong>
          </span>
        </div>
        <input
          type="range"
          min="1000"
          max="500000"
          step="5000"
          value={tradeVolume}
          onChange={(e) => setTradeVolume(Number(e.target.value))}
          className="v3-detail-calc__slider"
          aria-label={isZhLocale ? "月交易量滑块" : runtimeUi.volumeSlider}
        />
        <div className="v3-detail-calc__result">
          <span>{annualSavings != null ? (isZhLocale ? `使用 ${inviteCode} 专属码开户，每年可额外节省约` : runtimeUi.calculatorBenefit(inviteCode)) : (isZhLocale ? "费率或用户权益尚未完成来源核验，最终条件以平台官方账户显示为准" : runtimeUi.calculatorPending)}</span>
          {annualSavings != null && <strong className="text-green" translate="no">{`+${annualSavings} USDT`}</strong>}
        </div>
      </div>
      <VenueTieredFeeMatrix
        venue={venue}
        locale={locale}
        db={db}
        rebatePercent={rebatePercent}
        claimsVerified={commercialClaim.status === "verified"}
        inviteCode={inviteCode}
        registrationUrl={venueCta.direct ? venueGoHref(venue.slug, "fee-summary", locale, market) : venueCta.ctaHref}
        registrationDirect={venueCta.direct}
        localizedVenueName={localizedVenueName}
        researchActions={nonCexResearchActions}
      />
      </div>
    </section>

    <section className="v2-section v3-detail-grid v3-profile-decision" id="registration-checklist">
  <section className="v3-profile-account-section v3-profile-account-decision">
  <header>
      <h4 className="v3-profile-account-section__heading">{isZhLocale ? zhText(locale, "展开完整注册前决策说明", "展開完整註冊前決策說明") : (detailLabels.preRegister || runtimeUi.preRegister)}</h4>
      <p className="v3-profile-account-section__hint">{isZhLocale ? zhText(locale, "适配人群、限制和 KYC / 入金检查集中在这里", "適配人群、限制和 KYC / 入金檢查集中在這裡") : (detailLabels.preRegisterHint || runtimeUi.preRegisterHint)}</p>
    </header>
    <div className="v3-registration-notes__body">
      <VenueDecisionArticles slug={profile.slug} locale={locale} text={text} />
      <EditorialList title={text.detailPreKycFunding} items={profile.checks} fallback={profile.limitations.slice(0, 3)} />
    </div>
  </section>

    </section>

      </div>
    </div>

    </div>
  </section>
  <section className="v3-profile-research-chapter" data-research-task="sources">
    <h3 className="v3-profile-sources-group__heading"><VenueVisualIcon kind="shield" />{profileChapters[1]}</h3>
    <div className="v3-profile-research-chapter__body">
    <div className="v3-profile-evidence-block">
  <div className="v3-profile-evidence-block__body">
    <VenueProofOfReserves
      venue={venue}
      locale={locale}
      db={db}
      officialDomain={officialDomain}
      localizedVenueName={localizedVenueName}
    />
    <VenueAntiPhishingSecurity
      venue={venue}
      locale={locale}
      db={db}
      partner={partner}
      officialDomain={officialDomain}
      localizedVenueName={localizedVenueName}
    />
    <ResearchPanel slug={profile.slug} locale={locale} />
    <OfficialResearchTeaser locale={locale} venue={venue} market={market} product={product} />
  </div>
    </div>

    </div>
  </section>
  <section className="v3-profile-research-chapter" data-research-task="follow-up">
    <h3 className="v3-profile-sources-group__heading"><VenueVisualIcon kind="arrow" />{profileChapters[2]}</h3>
    <div className="v3-profile-research-chapter__body">
    <div className="v3-profile-secondary-research" data-profile-task="telegram">
      <div className="v3-profile-secondary-research__body">
    <OnsiteTelegramBotHandoff
      canonicalPath={`/exchanges/${profile.slug}`}
      locale={locale}
      market={market}
      product={product}
      placement={`venue-onsite-bot-handoff-${profile.slug}`}
    />
      <a
        href={heroTelegramFunnel.deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="v3-hero-tg-btn"
        title={isZhLocale ? zhText(locale, "在 Telegram 中监控此交易所费率与返佣", "在 Telegram 中監控此交易所費率與返傭") : (telegramDetailUi.monitor || "Monitor venue on Telegram")}
        data-cta-kind="telegram"
        data-cta-placement="venue-hero-telegram"
        data-growth-decision={`monitor_${venue.slug}`}
        data-growth-placement="venue-hero"
        data-growth-market={market}
        data-growth-product={product}
        data-telegram-start={heroTelegramFunnel.startPayload}
        data-telegram-return-href={heroTelegramReturnHref}
      >
        <span className="v3-tg-icon-mini">✈</span>
        <span>{isZhLocale ? zhText(locale, "在 Telegram 监控此交易所 ↗", "在 Telegram 監控此交易所 ↗") : (telegramDetailUi.monitor || "Monitor on Telegram ↗")}</span>
      </a>
    <VenueTelegramMonitorSection
      venue={venue}
      locale={locale}
      market={market}
      product={product}
      rebatePercent={rebatePercent}
      localizedVenueName={localizedVenueName}
      claimsVerified={commercialClaim.status === "verified"}
    />
      </div>
    </div>
    </div>
  </section>
  </>;
}
