/**
 * OnChainLiquidityBoard — C1. 链上数据 × 交易所资金流仪表盘
 */
import React from "react";
import { BrandMark } from "../brand/BrandMark.jsx";
import { partnerRegistry } from "../../data/partner-registry.js";
import { venueDatabase } from "../../data/venue-database.js";
import "./on-chain-liquidity-board.css";

const SOURCE_REVIEWED_AT = "2026-09-15";
const sourceLabels = {
  officialPor: "Official proof-of-reserves page",
  explorer: "Public block explorer or protocol contract",
  docs: "Official protocol or venue documentation",
};

const copy = {
  "zh-Hans": {
    eyebrow: "链上指标与储备证明",
    title: "先核验链上资金流，再判断平台风险",
    subtitle: "本页只发布能追溯到官方储备证明、区块浏览器或协议文档的链上信息；当前候选包未接入可验证实时数据，因此不展示模拟净流量、储备率或安全结论。",
    answerTitle: "这个页面现在能帮你判断什么？",
    answer: "它把链上资金流问题拆成三步：先确认官方来源，再核对钱包、合约和网络，最后再看入金、提现、储备证明和产品风险。没有可验证数据时，页面只保留核验方法，不给出安全排名。",
    checksTitle: "打开钱包或入金前先核对",
    checks: ["官方域名、App 或协议文档是否一致", "网络、合约地址、资产符号和小数位是否一致", "入金、提现、桥、Gas、滑点和授权风险是否分开判断"],
    sourcesTitle: "接受的来源边界",
    sources: ["官方 PoR 或储备披露页面", "区块浏览器、合约地址或协议状态页", "平台或协议的官方帮助中心与文档"],
    boundary: "不证明账户资格、资产安全、实时流动性、收益、空投或手续费优惠。最终操作必须回到官方页面确认。",
    status: "数据状态：不可用。接入经过验证的官方或链上数据源后再发布。",
    colVenue: "交易所平台", colDeposit24h: "24h 充值量", colWithdrawal24h: "24h 提现量", colNetFlow: "24h 净资金流", colPorRatio: "储备金率 (PoR)", colStatus: "安全信号", colAction: "官方入金通道", cta: "前往官方页面 ↗",
  },
  "zh-Hant": {
    eyebrow: "鏈上指標與儲備證明",
    title: "先核驗鏈上資金流，再判斷平台風險",
    subtitle: "本頁只發布能追溯到官方儲備證明、區塊瀏覽器或協議文件的鏈上資訊；目前候選包未接入可驗證即時資料，因此不展示模擬淨流量、儲備率或安全結論。",
    answerTitle: "這個頁面現在能幫你判斷什麼？",
    answer: "它把鏈上資金流問題拆成三步：先確認官方來源，再核對錢包、合約和網路，最後再看入金、提現、儲備證明和產品風險。沒有可驗證資料時，頁面只保留核驗方法，不給出安全排名。",
    checksTitle: "打開錢包或入金前先核對",
    checks: ["官方網域、App 或協議文件是否一致", "網路、合約地址、資產符號和小數位是否一致", "入金、提現、橋、Gas、滑點和授權風險是否分開判斷"],
    sourcesTitle: "接受的來源邊界",
    sources: ["官方 PoR 或儲備披露頁面", "區塊瀏覽器、合約地址或協議狀態頁", "平台或協議的官方說明中心與文件"],
    boundary: "不證明帳戶資格、資產安全、即時流動性、收益、空投或手續費優惠。最終操作必須回到官方頁面確認。",
    status: "資料狀態：不可用。接入經過驗證的官方或鏈上資料源後再發布。",
    colVenue: "交易所平台", colDeposit24h: "24h 充值量", colWithdrawal24h: "24h 提現量", colNetFlow: "24h 淨資金流", colPorRatio: "儲備金率 (PoR)", colStatus: "安全信號", colAction: "官方入金通道", cta: "前往官方頁面 ↗",
  },
  en: {
    eyebrow: "ON-CHAIN METRICS & PROOF OF RESERVES",
    title: "Verify on-chain flows before treating a venue as safer",
    subtitle: "This page publishes only source-bound on-chain information that can be traced to official reserve disclosures, public explorers or protocol documentation. No verified live feed is currently connected, so simulated netflows, reserve ratios and safety conclusions stay hidden.",
    answerTitle: "What can this page answer now?",
    answer: "It turns on-chain venue research into a verification checklist: confirm the official source, match wallet, contract and network details, then review deposits, withdrawals, proof of reserves and product risk. Without verified data, the page keeps the method visible and withholds rankings.",
    checksTitle: "Check before funding or connecting a wallet",
    checks: ["Official domain, app or protocol documentation must match", "Network, contract address, asset symbol and decimals must match", "Deposit, withdrawal, bridge, gas, slippage and approval risks are separate checks"],
    sourcesTitle: "Accepted source boundary",
    sources: [sourceLabels.officialPor, sourceLabels.explorer, sourceLabels.docs],
    boundary: "This does not prove account eligibility, asset safety, live liquidity, yield, airdrops or fee benefits. Final action must be confirmed on the official page.",
    status: "Data status: unavailable. Publish this board only after a verified official or on-chain feed is connected.",
    colVenue: "Exchange", colDeposit24h: "24h Inflow", colWithdrawal24h: "24h Outflow", colNetFlow: "Net Flow", colPorRatio: "Reserve Ratio", colStatus: "Security Signal", colAction: "Official Gateway", cta: "Open official page ↗",
  },
  es: {
    eyebrow: "Métricas on-chain y prueba de reservas",
    title: "Verifica flujos on-chain antes de asumir menor riesgo",
    subtitle: "Esta página solo publica información on-chain que pueda vincularse a reservas oficiales, exploradores públicos o documentación del protocolo. Como no hay feed verificado conectado, se ocultan flujos simulados, ratios de reserva y conclusiones de seguridad.",
    answerTitle: "¿Qué responde esta página ahora?",
    answer: "Convierte la investigación on-chain en una lista de verificación: confirmar la fuente oficial, revisar wallet, contrato y red, y después separar depósitos, retiros, prueba de reservas y riesgo del producto. Sin datos verificables, no muestra ranking.",
    checksTitle: "Antes de fondear o conectar una wallet",
    checks: ["Dominio oficial, app o documentación deben coincidir", "Red, contrato, símbolo del activo y decimales deben coincidir", "Depósito, retiro, bridge, gas, slippage y aprobaciones son riesgos separados"],
    sourcesTitle: "Límite de fuentes aceptadas",
    sources: ["Página oficial de PoR o reservas", "Explorador público, contrato o estado del protocolo", "Centro de ayuda o documentación oficial"],
    boundary: "No prueba elegibilidad de cuenta, seguridad de fondos, liquidez en vivo, rendimiento, airdrops ni beneficios de comisiones. La acción final se confirma en la página oficial.",
    status: "Estado de datos: no disponible. Publicar solo después de conectar una fuente oficial u on-chain verificable.",
    colVenue: "Plataforma", colDeposit24h: "Entrada 24h", colWithdrawal24h: "Salida 24h", colNetFlow: "Flujo neto", colPorRatio: "Ratio de reservas", colStatus: "Señal de seguridad", colAction: "Ruta oficial", cta: "Abrir página oficial ↗",
  },
  "pt-BR": {
    eyebrow: "Métricas on-chain e prova de reservas",
    title: "Verifique fluxos on-chain antes de tratar uma plataforma como mais segura",
    subtitle: "Esta página só publica informação on-chain ligada a reservas oficiais, exploradores públicos ou documentação do protocolo. Sem feed verificado conectado, fluxos simulados, índices de reserva e conclusões de segurança ficam ocultos.",
    answerTitle: "O que esta página responde agora?",
    answer: "Ela transforma a análise on-chain em checklist: confirmar a fonte oficial, conferir wallet, contrato e rede, e depois separar depósito, saque, prova de reservas e risco do produto. Sem dados verificáveis, o método fica visível e o ranking fica fechado.",
    checksTitle: "Antes de depositar ou conectar uma wallet",
    checks: ["Domínio oficial, app ou documentação precisam coincidir", "Rede, contrato, símbolo do ativo e casas decimais precisam coincidir", "Depósito, saque, bridge, gas, slippage e aprovações são riscos separados"],
    sourcesTitle: "Limite de fontes aceitas",
    sources: ["Página oficial de PoR ou reservas", "Explorador público, contrato ou status do protocolo", "Central de ajuda ou documentação oficial"],
    boundary: "Não comprova elegibilidade de conta, segurança dos ativos, liquidez ao vivo, rendimento, airdrop ou benefício de taxa. A ação final deve ser confirmada na página oficial.",
    status: "Status dos dados: indisponível. Publicar somente após conectar uma fonte oficial ou on-chain verificável.",
    colVenue: "Plataforma", colDeposit24h: "Entrada 24h", colWithdrawal24h: "Saída 24h", colNetFlow: "Fluxo líquido", colPorRatio: "Índice de reservas", colStatus: "Sinal de segurança", colAction: "Rota oficial", cta: "Abrir página oficial ↗",
  },
  fr: {
    eyebrow: "Métriques on-chain et preuve de réserves",
    title: "Vérifier les flux on-chain avant de juger le risque",
    subtitle: "Cette page ne publie que des informations on-chain rattachées à des réserves officielles, des explorateurs publics ou une documentation de protocole. Aucun flux vérifié n’étant connecté, les flux simulés, ratios de réserve et conclusions de sécurité restent masqués.",
    answerTitle: "À quoi sert cette page maintenant ?",
    answer: "Elle transforme la recherche on-chain en contrôle pratique : confirmer la source officielle, vérifier wallet, contrat et réseau, puis séparer dépôts, retraits, preuve de réserves et risque produit. Sans données vérifiables, elle garde la méthode et masque tout classement.",
    checksTitle: "Avant de financer ou connecter un wallet",
    checks: ["Le domaine officiel, l’app ou la documentation doivent correspondre", "Le réseau, le contrat, le symbole et les décimales doivent correspondre", "Dépôt, retrait, bridge, gas, slippage et approvals se vérifient séparément"],
    sourcesTitle: "Limite des sources acceptées",
    sources: ["Page officielle PoR ou réserves", "Explorateur public, contrat ou état du protocole", "Aide ou documentation officielle"],
    boundary: "Ne prouve pas l’éligibilité du compte, la sécurité des actifs, la liquidité en direct, le rendement, les airdrops ou les avantages de frais. Confirmer l’action finale sur la page officielle.",
    status: "État des données : indisponible. Publication uniquement après connexion d’une source officielle ou on-chain vérifiable.",
    colVenue: "Plateforme", colDeposit24h: "Entrées 24h", colWithdrawal24h: "Sorties 24h", colNetFlow: "Flux net", colPorRatio: "Ratio réserves", colStatus: "Signal sécurité", colAction: "Route officielle", cta: "Ouvrir la page officielle ↗",
  },
  de: {
    eyebrow: "On-chain-Metriken und Reservenachweis",
    title: "On-chain-Flüsse prüfen, bevor eine Plattform sicherer wirkt",
    subtitle: "Diese Seite veröffentlicht nur On-chain-Informationen, die auf offizielle Reservenachweise, öffentliche Explorer oder Protokolldokumente zurückführbar sind. Ohne verifizierten Feed bleiben simulierte Flüsse, Reservequoten und Sicherheitsurteile verborgen.",
    answerTitle: "Was beantwortet diese Seite jetzt?",
    answer: "Sie macht On-chain-Recherche zu einer Prüfliste: offizielle Quelle bestätigen, Wallet, Vertrag und Netzwerk abgleichen und danach Einzahlungen, Auszahlungen, Reservenachweis und Produktrisiko getrennt prüfen. Ohne verifizierte Daten gibt es kein Ranking.",
    checksTitle: "Vor Einzahlung oder Wallet-Verbindung prüfen",
    checks: ["Offizielle Domain, App oder Dokumentation müssen übereinstimmen", "Netzwerk, Vertragsadresse, Asset-Symbol und Dezimalstellen müssen übereinstimmen", "Einzahlung, Auszahlung, Bridge, Gas, Slippage und Freigaben getrennt bewerten"],
    sourcesTitle: "Akzeptierte Quellen",
    sources: ["Offizielle PoR- oder Reservenseite", "Öffentlicher Explorer, Vertrag oder Protokollstatus", "Offizielle Hilfe oder Dokumentation"],
    boundary: "Belegt keine Kontoberechtigung, Asset-Sicherheit, Live-Liquidität, Rendite, Airdrops oder Gebührenvorteile. Die finale Aktion muss auf der offiziellen Seite bestätigt werden.",
    status: "Datenstatus: nicht verfügbar. Veröffentlichung erst nach Anschluss einer verifizierbaren offiziellen oder On-chain-Quelle.",
    colVenue: "Plattform", colDeposit24h: "24h Zufluss", colWithdrawal24h: "24h Abfluss", colNetFlow: "Nettofluss", colPorRatio: "Reservequote", colStatus: "Sicherheitssignal", colAction: "Offizieller Weg", cta: "Offizielle Seite öffnen ↗",
  },
  ja: {
    eyebrow: "オンチェーン指標と準備金証明",
    title: "資金フローを検証してからリスクを判断する",
    subtitle: "このページは、公式の準備金開示、公開ブロックエクスプローラー、またはプロトコル文書に結び付けられるオンチェーン情報だけを扱います。検証済みフィードが未接続のため、模擬フロー、準備率、安全判断は表示しません。",
    answerTitle: "このページで今確認できること",
    answer: "オンチェーン調査を、公式ソースの確認、ウォレット・コントラクト・ネットワークの照合、入出金・準備金証明・商品リスクの確認に分けます。検証可能なデータがない場合、方法だけを示し、順位付けは行いません。",
    checksTitle: "入金やウォレット接続前の確認",
    checks: ["公式ドメイン、アプリ、文書が一致しているか", "ネットワーク、コントラクト、資産記号、小数点が一致しているか", "入金、出金、ブリッジ、ガス、スリッページ、承認リスクを分けて見る"],
    sourcesTitle: "採用するソースの境界",
    sources: ["公式PoRまたは準備金開示ページ", "公開エクスプローラー、コントラクト、プロトコル状態ページ", "公式ヘルプセンターまたは文書"],
    boundary: "口座利用可否、資産安全性、リアルタイム流動性、利回り、エアドロップ、手数料特典を保証しません。最終操作は公式ページで確認してください。",
    status: "データ状態：利用できません。検証可能な公式またはオンチェーンデータ接続後に公開します。",
    colVenue: "取引所", colDeposit24h: "24時間入金", colWithdrawal24h: "24時間出金", colNetFlow: "純フロー", colPorRatio: "準備金比率", colStatus: "安全シグナル", colAction: "公式ルート", cta: "公式ページを開く ↗",
  },
  ko: {
    eyebrow: "온체인 지표 및 준비금 증명",
    title: "온체인 흐름을 확인한 뒤 플랫폼 위험을 판단하세요",
    subtitle: "이 페이지는 공식 준비금 공개, 공개 블록 익스플로러 또는 프로토콜 문서로 추적되는 온체인 정보만 게시합니다. 검증된 실시간 피드가 연결되지 않았으므로 시뮬레이션 흐름, 준비금 비율, 안전 결론은 숨깁니다.",
    answerTitle: "지금 이 페이지가 답하는 것",
    answer: "온체인 조사를 공식 출처 확인, 지갑·계약·네트워크 대조, 입출금·준비금 증명·상품 위험 검토로 나눕니다. 검증 가능한 데이터가 없으면 방법만 보여 주고 순위는 제공하지 않습니다.",
    checksTitle: "입금 또는 지갑 연결 전 확인",
    checks: ["공식 도메인, 앱 또는 문서가 일치하는지 확인", "네트워크, 계약 주소, 자산 심볼, 소수 자리가 일치하는지 확인", "입금, 출금, 브리지, 가스, 슬리피지, 승인 위험을 분리해서 확인"],
    sourcesTitle: "허용되는 출처 범위",
    sources: ["공식 PoR 또는 준비금 공개 페이지", "공개 익스플로러, 계약 주소 또는 프로토콜 상태 페이지", "공식 도움말 센터와 문서"],
    boundary: "계정 자격, 자산 안전성, 실시간 유동성, 수익, 에어드롭 또는 수수료 혜택을 증명하지 않습니다. 최종 조치는 공식 페이지에서 확인해야 합니다.",
    status: "데이터 상태: 사용할 수 없습니다. 검증된 공식 또는 온체인 데이터 연결 후 공개합니다.",
    colVenue: "거래소", colDeposit24h: "24시간 입금", colWithdrawal24h: "24시간 출금", colNetFlow: "순 흐름", colPorRatio: "준비금 비율", colStatus: "안전 신호", colAction: "공식 경로", cta: "공식 페이지 열기 ↗",
  },
  ar: {
    eyebrow: "مقاييس السلسلة وإثبات الاحتياطيات",
    title: "تحقق من تدفقات السلسلة قبل اعتبار المنصة أقل خطراً",
    subtitle: "تنشر هذه الصفحة معلومات على السلسلة فقط عندما يمكن ربطها بإفصاح رسمي عن الاحتياطيات أو مستكشف عام أو وثائق بروتوكول. لا يوجد حالياً مصدر مباشر موثوق، لذلك لا نعرض تدفقات أو نسب احتياطي أو أحكام أمان محاكاة.",
    answerTitle: "ماذا تجيب هذه الصفحة الآن؟",
    answer: "تحول البحث على السلسلة إلى قائمة تحقق: تأكيد المصدر الرسمي، مطابقة المحفظة والعقد والشبكة، ثم فصل الإيداع والسحب وإثبات الاحتياطيات ومخاطر المنتج. من دون بيانات قابلة للتحقق لا توجد رتبة أمان.",
    checksTitle: "قبل التمويل أو ربط المحفظة",
    checks: ["يجب أن يتطابق النطاق الرسمي أو التطبيق أو الوثائق", "يجب أن تتطابق الشبكة وعنوان العقد ورمز الأصل والأرقام العشرية", "الإيداع والسحب والجسر والغاز والانزلاق والموافقات مخاطر منفصلة"],
    sourcesTitle: "حدود المصادر المقبولة",
    sources: ["صفحة رسمية لإثبات الاحتياطيات أو الإفصاح عنها", "مستكشف عام أو عقد أو حالة بروتوكول", "مركز مساعدة أو وثائق رسمية"],
    boundary: "لا يثبت أهلية الحساب أو أمان الأصول أو السيولة الحية أو العائد أو الإيردروب أو مزايا الرسوم. يجب تأكيد الإجراء النهائي على الصفحة الرسمية.",
    status: "حالة البيانات: غير متاحة. سيتم النشر بعد ربط مصدر رسمي أو على السلسلة يمكن التحقق منه.",
    colVenue: "المنصة", colDeposit24h: "دخول 24 ساعة", colWithdrawal24h: "خروج 24 ساعة", colNetFlow: "الصافي", colPorRatio: "نسبة الاحتياطي", colStatus: "إشارة أمان", colAction: "المسار الرسمي", cta: "افتح الصفحة الرسمية ↗",
  },
  tr: {
    eyebrow: "Zincir üstü ölçümler ve rezerv kanıtı",
    title: "Bir platformu daha güvenli saymadan önce zincir üstü akışı doğrula",
    subtitle: "Bu sayfa yalnızca resmi rezerv açıklaması, herkese açık explorer veya protokol dokümanına bağlanabilen zincir üstü bilgileri yayımlar. Doğrulanmış canlı feed bağlı olmadığı için simüle akış, rezerv oranı ve güvenlik sonucu gösterilmez.",
    answerTitle: "Bu sayfa şu anda neyi yanıtlar?",
    answer: "Zincir üstü araştırmayı kontrol listesine çevirir: resmi kaynağı doğrula, cüzdanı, kontratı ve ağı eşleştir, sonra yatırma, çekme, rezerv kanıtı ve ürün riskini ayır. Veri doğrulanmadığında sıralama yapılmaz.",
    checksTitle: "Fonlama veya cüzdan bağlantısından önce",
    checks: ["Resmi domain, uygulama veya doküman eşleşmeli", "Ağ, kontrat adresi, varlık sembolü ve ondalıklar eşleşmeli", "Yatırma, çekme, bridge, gas, slippage ve onay riskleri ayrı kontrol edilmeli"],
    sourcesTitle: "Kabul edilen kaynak sınırı",
    sources: ["Resmi PoR veya rezerv açıklama sayfası", "Herkese açık explorer, kontrat veya protokol durum sayfası", "Resmi yardım merkezi veya dokümantasyon"],
    boundary: "Hesap uygunluğu, varlık güvenliği, canlı likidite, getiri, airdrop veya ücret avantajı kanıtlamaz. Son işlem resmi sayfada doğrulanmalıdır.",
    status: "Veri durumu: kullanılamıyor. Doğrulanmış resmî veya zincir üstü kaynak bağlandıktan sonra yayınlanır.",
    colVenue: "Borsa", colDeposit24h: "24s giriş", colWithdrawal24h: "24s çıkış", colNetFlow: "Net akış", colPorRatio: "Rezerv oranı", colStatus: "Güven sinyali", colAction: "Resmî yol", cta: "Resmî sayfayı aç ↗",
  },
  ru: {
    eyebrow: "Ончейн-метрики и Proof of Reserves",
    title: "Проверяйте ончейн-потоки до оценки риска платформы",
    subtitle: "Эта страница публикует только ончейн-информацию, связанную с официальными раскрытиями резервов, публичными обозревателями или документацией протокола. Проверенный live-feed не подключён, поэтому симуляции и выводы о безопасности скрыты.",
    answerTitle: "Что эта страница отвечает сейчас?",
    answer: "Она превращает ончейн-анализ в чек-лист: подтвердить официальный источник, сверить кошелёк, контракт и сеть, затем отдельно проверить ввод, вывод, резервы и риск продукта. Без проверяемых данных рейтинги не выводятся.",
    checksTitle: "Перед пополнением или подключением кошелька",
    checks: ["Официальный домен, приложение или документация должны совпадать", "Сеть, адрес контракта, тикер и decimals должны совпадать", "Пополнение, вывод, bridge, gas, slippage и approvals проверяются отдельно"],
    sourcesTitle: "Граница допустимых источников",
    sources: ["Официальная страница PoR или резервов", "Публичный обозреватель, контракт или статус протокола", "Официальная справка или документация"],
    boundary: "Не доказывает доступность аккаунта, безопасность активов, live-ликвидность, доходность, airdrop или скидки. Финальное действие подтверждается на официальной странице.",
    status: "Состояние данных: недоступно. Публикация начнётся после подключения проверяемого официального или ончейн-источника.",
    colVenue: "Платформа", colDeposit24h: "Приток 24ч", colWithdrawal24h: "Отток 24ч", colNetFlow: "Нетто-поток", colPorRatio: "Резервы", colStatus: "Сигнал", colAction: "Официальный путь", cta: "Открыть официальную страницу ↗",
  },
  id: {
    eyebrow: "Metrik on-chain dan proof of reserves",
    title: "Verifikasi arus on-chain sebelum menilai risiko platform",
    subtitle: "Halaman ini hanya menerbitkan informasi on-chain yang dapat ditautkan ke pengungkapan cadangan resmi, explorer publik, atau dokumentasi protokol. Karena feed terverifikasi belum terhubung, arus simulasi, rasio cadangan, dan kesimpulan keamanan disembunyikan.",
    answerTitle: "Apa yang bisa dijawab halaman ini sekarang?",
    answer: "Halaman ini mengubah riset on-chain menjadi checklist: konfirmasi sumber resmi, cocokkan wallet, kontrak, dan jaringan, lalu pisahkan cek deposit, penarikan, proof of reserves, dan risiko produk. Tanpa data terverifikasi, tidak ada ranking keamanan.",
    checksTitle: "Sebelum deposit atau menghubungkan wallet",
    checks: ["Domain resmi, aplikasi, atau dokumentasi harus cocok", "Jaringan, alamat kontrak, simbol aset, dan desimal harus cocok", "Deposit, penarikan, bridge, gas, slippage, dan approval adalah risiko terpisah"],
    sourcesTitle: "Batas sumber yang diterima",
    sources: ["Halaman resmi PoR atau cadangan", "Explorer publik, kontrak, atau status protokol", "Pusat bantuan atau dokumentasi resmi"],
    boundary: "Tidak membuktikan kelayakan akun, keamanan aset, likuiditas live, yield, airdrop, atau manfaat biaya. Aksi final harus dikonfirmasi di halaman resmi.",
    status: "Status data: tidak tersedia. Publikasikan setelah sumber resmi atau on-chain yang dapat diverifikasi terhubung.",
    colVenue: "Platform", colDeposit24h: "Masuk 24j", colWithdrawal24h: "Keluar 24j", colNetFlow: "Arus neto", colPorRatio: "Rasio cadangan", colStatus: "Sinyal aman", colAction: "Rute resmi", cta: "Buka halaman resmi ↗",
  },
  vi: {
    eyebrow: "Chỉ số on-chain và proof of reserves",
    title: "Xác minh dòng on-chain trước khi đánh giá rủi ro nền tảng",
    subtitle: "Trang này chỉ công bố thông tin on-chain gắn với công bố dự trữ chính thức, explorer công khai hoặc tài liệu giao thức. Chưa có feed xác minh nên không hiển thị dòng tiền mô phỏng, tỷ lệ dự trữ hay kết luận an toàn.",
    answerTitle: "Trang này hiện trả lời điều gì?",
    answer: "Trang biến nghiên cứu on-chain thành checklist: xác nhận nguồn chính thức, đối chiếu ví, hợp đồng và mạng, rồi tách riêng nạp, rút, proof of reserves và rủi ro sản phẩm. Khi thiếu dữ liệu xác minh, không có xếp hạng an toàn.",
    checksTitle: "Trước khi nạp tiền hoặc kết nối ví",
    checks: ["Tên miền, ứng dụng hoặc tài liệu chính thức phải khớp", "Mạng, địa chỉ hợp đồng, ký hiệu tài sản và số thập phân phải khớp", "Nạp, rút, bridge, gas, trượt giá và approval là các rủi ro riêng"],
    sourcesTitle: "Ranh giới nguồn được chấp nhận",
    sources: ["Trang PoR hoặc dự trữ chính thức", "Explorer công khai, hợp đồng hoặc trạng thái giao thức", "Trung tâm trợ giúp hoặc tài liệu chính thức"],
    boundary: "Không chứng minh điều kiện tài khoản, an toàn tài sản, thanh khoản trực tiếp, lợi suất, airdrop hay ưu đãi phí. Hành động cuối phải xác nhận trên trang chính thức.",
    status: "Trạng thái dữ liệu: chưa khả dụng. Chỉ công bố sau khi kết nối nguồn chính thức hoặc on-chain có thể xác minh.",
    colVenue: "Nền tảng", colDeposit24h: "Nạp 24h", colWithdrawal24h: "Rút 24h", colNetFlow: "Dòng ròng", colPorRatio: "Tỷ lệ dự trữ", colStatus: "Tín hiệu", colAction: "Đường chính thức", cta: "Mở trang chính thức ↗",
  },
  it: {
    eyebrow: "Metriche on-chain e proof of reserves",
    title: "Verifica i flussi on-chain prima di valutare il rischio",
    subtitle: "Questa pagina pubblica solo informazioni on-chain collegabili a riserve ufficiali, explorer pubblici o documentazione del protocollo. Non essendoci un feed verificato, flussi simulati, rapporti di riserva e conclusioni di sicurezza restano nascosti.",
    answerTitle: "Cosa risponde questa pagina ora?",
    answer: "Trasforma la ricerca on-chain in una checklist: confermare la fonte ufficiale, confrontare wallet, contratto e rete, poi separare depositi, prelievi, proof of reserves e rischio prodotto. Senza dati verificabili non mostra classifiche.",
    checksTitle: "Prima di finanziare o collegare un wallet",
    checks: ["Dominio ufficiale, app o documentazione devono coincidere", "Rete, indirizzo contratto, simbolo asset e decimali devono coincidere", "Deposito, prelievo, bridge, gas, slippage e approval sono rischi separati"],
    sourcesTitle: "Confine delle fonti accettate",
    sources: ["Pagina ufficiale PoR o riserve", "Explorer pubblico, contratto o stato del protocollo", "Centro assistenza o documentazione ufficiale"],
    boundary: "Non prova idoneità dell’account, sicurezza degli asset, liquidità live, rendimento, airdrop o vantaggi sulle commissioni. L’azione finale va confermata sulla pagina ufficiale.",
    status: "Stato dati: non disponibile. Pubblicare solo dopo aver collegato una fonte ufficiale o on-chain verificabile.",
    colVenue: "Piattaforma", colDeposit24h: "Afflusso 24h", colWithdrawal24h: "Deflusso 24h", colNetFlow: "Flusso netto", colPorRatio: "Rapporto riserve", colStatus: "Segnale", colAction: "Percorso ufficiale", cta: "Apri pagina ufficiale ↗",
  },
};

const unavailableCopy = {"en": "Live metrics are unavailable. Use the source checklist below.", "zh-Hans": "暂无已核验实时指标，可先按下列清单核对来源。", "zh-Hant": "暫無已核驗即時指標，可先按下列清單核對來源。", "ja": "確認済みのリアルタイム指標はありません。下のチェックリストで出典を確認してください。", "ko": "검증된 실시간 지표가 없습니다. 아래 목록으로 출처를 확인하세요.", "tr": "Doğrulanmış canlı metrikler yok. Aşağıdaki kaynak kontrol listesini kullanın.", "ar": "لا تتوفر مؤشرات مباشرة متحقق منها. استخدم قائمة مراجعة المصادر أدناه.", "es": "No hay métricas en vivo verificadas. Usa la lista de fuentes siguiente.", "pt-BR": "Não há métricas ao vivo verificadas. Use a lista de fontes abaixo.", "fr": "Aucune mesure en direct vérifiée. Utilisez la liste de sources ci-dessous.", "de": "Keine verifizierten Live-Messwerte. Prüfen Sie die Quellen anhand der Liste.", "ru": "Проверенных показателей в реальном времени нет. Используйте список проверки источников.", "id": "Metrik langsung terverifikasi belum tersedia. Gunakan daftar pemeriksaan sumber berikut.", "vi": "Chưa có chỉ số trực tiếp đã xác minh. Hãy kiểm tra nguồn theo danh sách bên dưới.", "it": "Non sono disponibili metriche live verificate. Usa la lista di controllo delle fonti."};
const LIQUIDITY_VENUES = [];

function resolveCopy(locale = "en") {
  const raw = String(locale || "en");
  const language = raw.split("-")[0];
  if (raw === "zh-TW") return copy["zh-Hant"];
  return copy[raw] || copy[language] || (raw.startsWith("zh") ? copy["zh-Hans"] : copy.en);
}

export function OnChainLiquidityBoard({ locale = "en", headingLevel = 2 }) {
  const t = resolveCopy(locale);
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className="onchain-board-section v2-shell" id="onchain-metrics" dir={locale === "ar" ? "rtl" : undefined} data-source-reviewed-at={SOURCE_REVIEWED_AT}>
      <header className="onchain-board__header">
        <div className="onchain-board__eyebrow">
          <span className="onchain-board__pulse"></span>
          {t.eyebrow}
        </div>
        <HeadingTag className="onchain-board__title">{t.title}</HeadingTag>
        <p className="onchain-board__availability" role="status">{unavailableCopy[locale === "zh-TW" ? "zh-Hant" : locale] || unavailableCopy[String(locale).split("-")[0]] || unavailableCopy.en}</p>
      </header>

      <div className="onchain-board__answer" data-onchain-localized-body={locale}>
        <article className="onchain-board__card onchain-board__checklist">
          <h2>{t.checksTitle}</h2>
          <ul>{t.checks.map((item) => <li key={item}><label><input type="checkbox" /><span>{item}</span></label></li>)}</ul>
        </article>
        <article className="onchain-board__card">
          <h2>{t.sourcesTitle}</h2>
          <ul>{t.sources.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>

      {LIQUIDITY_VENUES.length === 0 ? (
        <details className="onchain-board__method">
          <summary>{t.answerTitle}<span aria-hidden="true">＋</span></summary>
          <p className="onchain-board__subtitle">{t.subtitle}</p>
          <p>{t.answer}</p>
          <div className="onchain-board__empty">
            <p>{t.status}</p>
            <small>{t.boundary}</small>
          </div>
        </details>
      ) : <div className="onchain-board__table-wrapper" tabIndex={0}>
        <table className="onchain-board__table">
          <thead>
            <tr>
              <th>{t.colVenue}</th>
              <th>{t.colDeposit24h}</th>
              <th>{t.colWithdrawal24h}</th>
              <th>{t.colNetFlow}</th>
              <th>{t.colPorRatio}</th>
              <th>{t.colStatus}</th>
              <th className="text-right">{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {LIQUIDITY_VENUES.map((item) => {
              const db = venueDatabase[item.slug] || {};
              const partner = partnerRegistry[item.slug] || {};
              const regUrl = partner.registrationUrl || db.registrationUrl;

              return (
                <tr key={item.slug}>
                  <td className="font-semibold text-white">
                    <div className="onchain-board__cell-brand">
                      <BrandMark slug={item.slug} compact />
                      <span translate="no" lang="en">{db.name || item.slug}</span>
                    </div>
                  </td>
                  <td className="font-mono">{item.deposit}</td>
                  <td className="font-mono">{item.withdraw}</td>
                  <td className={`font-mono font-semibold ${item.isPositive ? "text-green" : "text-red"}`}>
                    {item.net}
                  </td>
                  <td className="font-mono">{item.por}</td>
                  <td>
                    <span className="onchain-board__signal-tag">
                      🟢 {item.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <a
                      href={regUrl}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      className="onchain-board__cta"
                    >
                      {t.cta}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </section>
  );
}

export default OnChainLiquidityBoard;
