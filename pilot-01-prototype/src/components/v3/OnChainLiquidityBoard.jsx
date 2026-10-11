/**
 * /onchain — on-chain liquidity and proof-of-reserves verification guide (audit NX-05, 2026-10-11).
 * The page used to call itself a "board"; it never had a verified live feed. It now teaches how to read an exchange's
 * proof-of-reserves report, links the official report pages recorded in venue-database.js (via onchain-guide.js), and
 * says plainly that no live metrics are published here and that a reserve report is not a solvency guarantee.
 * Rendered on /onchain (H1) and inside the home research drawer (H2).
 */
import React from "react";
import { ONCHAIN_GUIDE_LINKS_CHECKED_AT, onchainGuideReserveSources } from "../../data/onchain-guide.js";
import { localizedPath } from "../../data/locale-routing.js";
import "./on-chain-liquidity-board.css";

const SOURCE_REVIEWED_AT = "2026-09-15";
const sourceLabels = {
  officialPor: "Official proof-of-reserves page",
  explorer: "Public block explorer or protocol contract",
  docs: "Official protocol or venue documentation",
};

const copy = {
  "zh-Hans": {
    eyebrow: "核验指南",
    title: "链上流动性与储备证明：如何核验一家交易所",
    subtitle: "本页只发布能追溯到官方储备证明、区块浏览器或协议文档的链上信息；目前没有接入经核验的实时数据，因此不展示模拟净流量、储备率或安全结论。",
    answerTitle: "这个页面现在能帮你判断什么？",
    answer: "它把链上资金流问题拆成三步：先确认官方来源，再核对钱包、合约和网络，最后再看入金、提现、储备证明和产品风险。没有可验证数据时，页面只保留核验方法，不给出安全排名。",
    checksTitle: "打开钱包或入金前先核对",
    checks: ["官方域名、App 或协议文档是否一致", "网络、合约地址、资产符号和小数位是否一致", "入金、提现、桥、Gas、滑点和授权风险是否分开判断"],
    sourcesTitle: "接受的来源边界",
    sources: ["官方 PoR 或储备披露页面", "区块浏览器、合约地址或协议状态页", "平台或协议的官方帮助中心与文档"],
    boundary: "不证明账户资格、资产安全、实时流动性、收益、空投或手续费优惠。最终操作必须回到官方页面确认。",
    status: "本页不发布实时指标：不展示储备率、资金净流向或安全排名。请按下列步骤阅读官方报告并自行验证。",
    intro: "储备证明（PoR）是交易所自己发布、带日期的报告，说明其声称为用户余额持有的资产。入金或在平台留存资金前，请从官方域名打开并亲自阅读。",
    stepsTitle: "如何阅读储备证明报告",
    steps: ["从交易所官方域名打开报告（见下方链接），记下快照日期。", "确认覆盖了哪些资产，以及是否同时列出用户负债，而不仅是钱包余额。", "用交易所提供的默克尔树或零知识证明工具，验证你自己的余额是否被包含。", "查看报告由谁出具或鉴证、范围如何；平台自行发布的报告证据力较弱。", "留意平台自身代币的占比：主要依靠自家代币堆高的储备率，对提现能力说明有限。"],
    venuesTitle: "官方储备证明页面",
    venuesNote: "链接取自 NexuAlpha 的平台资料，于 {date} 打开核对。报告日期、覆盖范围和方法会变化，请以交易所页面上的日期为准。",
    linkLabel: "官方报告",
    boundaryTitle: "储备报告不能证明什么",
    guarantee: "储备证明只是某一时点的快照，不是对全部负债的审计；它不是偿付能力或资金安全保证，也不是存款保险。即使报告良好，交易所仍可能暂停提现或倒闭。",
    cta: "前往官方页面 ↗",
  },
  "zh-Hant": {
    eyebrow: "核驗指南",
    title: "鏈上流動性與儲備證明：如何核驗一家交易所",
    subtitle: "本頁只發布能追溯到官方儲備證明、區塊瀏覽器或協議文件的鏈上資訊；目前沒有接入經核驗的即時資料，因此不展示模擬淨流量、儲備率或安全結論。",
    answerTitle: "這個頁面現在能幫你判斷什麼？",
    answer: "它把鏈上資金流問題拆成三步：先確認官方來源，再核對錢包、合約和網路，最後再看入金、提現、儲備證明和產品風險。沒有可驗證資料時，頁面只保留核驗方法，不給出安全排名。",
    checksTitle: "打開錢包或入金前先核對",
    checks: ["官方網域、App 或協議文件是否一致", "網路、合約地址、資產符號和小數位是否一致", "入金、提現、橋、Gas、滑點和授權風險是否分開判斷"],
    sourcesTitle: "接受的來源邊界",
    sources: ["官方 PoR 或儲備披露頁面", "區塊瀏覽器、合約地址或協議狀態頁", "平台或協議的官方說明中心與文件"],
    boundary: "不證明帳戶資格、資產安全、即時流動性、收益、空投或手續費優惠。最終操作必須回到官方頁面確認。",
    status: "本頁不發布即時指標：不展示儲備率、資金淨流向或安全排名。請按下列步驟閱讀官方報告並自行驗證。",
    intro: "儲備證明（PoR）是交易所自行發布、附日期的報告，說明其聲稱為用戶餘額持有的資產。入金或在平台留存資金前，請從官方網域開啟並親自閱讀。",
    stepsTitle: "如何閱讀儲備證明報告",
    steps: ["從交易所官方網域開啟報告（見下方連結），記下快照日期。", "確認涵蓋哪些資產，以及是否同時列出用戶負債，而不僅是錢包餘額。", "用交易所提供的默克爾樹或零知識證明工具，驗證你自己的餘額是否被納入。", "查看報告由誰出具或鑑證、範圍如何；平台自行發布的報告證據力較弱。", "留意平台自身代幣的占比：主要靠自家代幣撐高的儲備率，對提現能力說明有限。"],
    venuesTitle: "官方儲備證明頁面",
    venuesNote: "連結取自 NexuAlpha 的平台資料，於 {date} 開啟核對。報告日期、涵蓋範圍和方法會變化，請以交易所頁面上的日期為準。",
    linkLabel: "官方報告",
    boundaryTitle: "儲備報告不能證明什麼",
    guarantee: "儲備證明只是某一時點的快照，不是對全部負債的審計；它不是償付能力或資金安全保證，也不是存款保險。即使報告良好，交易所仍可能暫停提現或倒閉。",
    cta: "前往官方頁面 ↗",
  },
  en: {
    eyebrow: "Verification guide",
    title: "On-chain liquidity and proof of reserves: how to verify an exchange",
    subtitle: "This page publishes only source-bound on-chain information that can be traced to official reserve disclosures, public explorers or protocol documentation. No verified live feed is currently connected, so simulated netflows, reserve ratios and safety conclusions stay hidden.",
    answerTitle: "What can this page answer now?",
    answer: "It turns on-chain venue research into a verification checklist: confirm the official source, match wallet, contract and network details, then review deposits, withdrawals, proof of reserves and product risk. Without verified data, the page keeps the method visible and withholds rankings.",
    checksTitle: "Check before funding or connecting a wallet",
    checks: ["Official domain, app or protocol documentation must match", "Network, contract address, asset symbol and decimals must match", "Deposit, withdrawal, bridge, gas, slippage and approval risks are separate checks"],
    sourcesTitle: "Accepted source boundary",
    sources: [sourceLabels.officialPor, sourceLabels.explorer, sourceLabels.docs],
    boundary: "This does not prove account eligibility, asset safety, live liquidity, yield, airdrops or fee benefits. Final action must be confirmed on the official page.",
    status: "Live metrics are not published here. NexuAlpha shows no reserve ratios, net flows or safety rankings on this page; use the steps and the official reports below.",
    intro: "Proof of reserves (PoR) is the exchange's own dated report of the assets it says it holds against customer balances. Read it yourself, from the official domain, before you deposit or keep funds on a platform.",
    stepsTitle: "How to read a proof-of-reserves report",
    steps: ["Open the report from the exchange's official domain (links below) and note the snapshot date.", "Check which assets are covered and whether customer liabilities are included, not only wallet balances.", "Verify your own balance with the exchange's Merkle-tree or zero-knowledge inclusion check.", "See who produced or attested the report and what scope they state; a self-published report is weaker evidence.", "Look at the share held in the exchange's own token: a high ratio built on its own token says less about withdrawals."],
    venuesTitle: "Official proof-of-reserves pages",
    venuesNote: "Links come from NexuAlpha's venue records and were opened on {date}. Report dates, coverage and methods change; read the date on the exchange's page.",
    linkLabel: "Official report",
    boundaryTitle: "What a reserve report does not prove",
    guarantee: "A proof-of-reserves report is a snapshot, not an audit of all liabilities. It is not a solvency or safety guarantee and not deposit insurance; an exchange can still pause withdrawals or fail after a good report.",
    cta: "Open official page ↗",
  },
  es: {
    eyebrow: "Guía de verificación",
    title: "Liquidez on-chain y prueba de reservas: cómo verificar un exchange",
    subtitle: "Esta página solo publica información on-chain que pueda vincularse a reservas oficiales, exploradores públicos o documentación del protocolo. Como no hay feed verificado conectado, se ocultan flujos simulados, ratios de reserva y conclusiones de seguridad.",
    answerTitle: "¿Qué responde esta página ahora?",
    answer: "Convierte la investigación on-chain en una lista de verificación: confirmar la fuente oficial, revisar wallet, contrato y red, y después separar depósitos, retiros, prueba de reservas y riesgo del producto. Sin datos verificables, no muestra ranking.",
    checksTitle: "Antes de fondear o conectar una wallet",
    checks: ["Dominio oficial, app o documentación deben coincidir", "Red, contrato, símbolo del activo y decimales deben coincidir", "Depósito, retiro, bridge, gas, slippage y aprobaciones son riesgos separados"],
    sourcesTitle: "Límite de fuentes aceptadas",
    sources: ["Página oficial de PoR o reservas", "Explorador público, contrato o estado del protocolo", "Centro de ayuda o documentación oficial"],
    boundary: "No prueba elegibilidad de cuenta, seguridad de fondos, liquidez en vivo, rendimiento, airdrops ni beneficios de comisiones. La acción final se confirma en la página oficial.",
    status: "Aquí no se publican métricas en vivo: no mostramos ratios de reservas, flujos netos ni rankings de seguridad. Usa los pasos y los informes oficiales de abajo.",
    intro: "La prueba de reservas (PoR) es el informe fechado que publica el propio exchange sobre los activos que dice mantener frente a los saldos de sus clientes. Léelo tú mismo, desde el dominio oficial, antes de depositar o mantener fondos.",
    stepsTitle: "Cómo leer un informe de prueba de reservas",
    steps: ["Abre el informe desde el dominio oficial del exchange (enlaces abajo) y anota la fecha de la instantánea.", "Comprueba qué activos cubre y si incluye los pasivos con clientes, no solo los saldos de las wallets.", "Verifica tu propio saldo con la herramienta de árbol de Merkle o prueba de conocimiento cero del exchange.", "Mira quién elaboró o certificó el informe y qué alcance declara; un informe autopublicado es una prueba más débil.", "Revisa el peso del token propio del exchange: un ratio alto basado en su propio token dice menos sobre los retiros."],
    venuesTitle: "Páginas oficiales de prueba de reservas",
    venuesNote: "Enlaces tomados de los registros de plataformas de NexuAlpha y abiertos el {date}. Las fechas, la cobertura y los métodos cambian; consulta la fecha en la página del exchange.",
    linkLabel: "Informe oficial",
    boundaryTitle: "Lo que un informe de reservas no prueba",
    guarantee: "Una prueba de reservas es una instantánea, no una auditoría de todos los pasivos. No es una garantía de solvencia ni de seguridad ni un seguro de depósitos; un exchange puede pausar retiros o quebrar después de un buen informe.",
    cta: "Abrir página oficial ↗",
  },
  "pt-BR": {
    eyebrow: "Guia de verificação",
    title: "Liquidez on-chain e prova de reservas: como verificar uma exchange",
    subtitle: "Esta página só publica informação on-chain ligada a reservas oficiais, exploradores públicos ou documentação do protocolo. Sem feed verificado conectado, fluxos simulados, índices de reserva e conclusões de segurança ficam ocultos.",
    answerTitle: "O que esta página responde agora?",
    answer: "Ela transforma a análise on-chain em checklist: confirmar a fonte oficial, conferir wallet, contrato e rede, e depois separar depósito, saque, prova de reservas e risco do produto. Sem dados verificáveis, o método fica visível e o ranking fica fechado.",
    checksTitle: "Antes de depositar ou conectar uma wallet",
    checks: ["Domínio oficial, app ou documentação precisam coincidir", "Rede, contrato, símbolo do ativo e casas decimais precisam coincidir", "Depósito, saque, bridge, gas, slippage e aprovações são riscos separados"],
    sourcesTitle: "Limite de fontes aceitas",
    sources: ["Página oficial de PoR ou reservas", "Explorador público, contrato ou status do protocolo", "Central de ajuda ou documentação oficial"],
    boundary: "Não comprova elegibilidade de conta, segurança dos ativos, liquidez ao vivo, rendimento, airdrop ou benefício de taxa. A ação final deve ser confirmada na página oficial.",
    status: "Nenhuma métrica ao vivo é publicada aqui: não mostramos índices de reserva, fluxos líquidos nem rankings de segurança. Use os passos e os relatórios oficiais abaixo.",
    intro: "A prova de reservas (PoR) é o relatório datado que a própria exchange publica sobre os ativos que diz manter contra os saldos dos clientes. Leia você mesmo, a partir do domínio oficial, antes de depositar ou manter fundos.",
    stepsTitle: "Como ler um relatório de prova de reservas",
    steps: ["Abra o relatório pelo domínio oficial da exchange (links abaixo) e anote a data do snapshot.", "Confira quais ativos estão cobertos e se os passivos com clientes entram na conta, não só os saldos das carteiras.", "Verifique o seu próprio saldo com a ferramenta de árvore de Merkle ou prova de conhecimento zero da exchange.", "Veja quem elaborou ou atestou o relatório e qual escopo declara; um relatório autopublicado é uma evidência mais fraca.", "Observe a fatia do token próprio da exchange: um índice alto baseado no próprio token diz menos sobre saques."],
    venuesTitle: "Páginas oficiais de prova de reservas",
    venuesNote: "Links extraídos dos registros de plataformas da NexuAlpha e abertos em {date}. Datas, cobertura e métodos mudam; confira a data na página da exchange.",
    linkLabel: "Relatório oficial",
    boundaryTitle: "O que um relatório de reservas não comprova",
    guarantee: "Uma prova de reservas é um retrato pontual, não uma auditoria de todos os passivos. Não é garantia de solvência nem de segurança, nem seguro de depósitos; uma exchange ainda pode suspender saques ou quebrar depois de um bom relatório.",
    cta: "Abrir página oficial ↗",
  },
  fr: {
    eyebrow: "Guide de vérification",
    title: "Liquidité on-chain et preuve de réserves : comment vérifier une plateforme",
    subtitle: "Cette page ne publie que des informations on-chain rattachées à des réserves officielles, des explorateurs publics ou une documentation de protocole. Aucun flux vérifié n’étant connecté, les flux simulés, ratios de réserve et conclusions de sécurité restent masqués.",
    answerTitle: "À quoi sert cette page maintenant ?",
    answer: "Elle transforme la recherche on-chain en contrôle pratique : confirmer la source officielle, vérifier wallet, contrat et réseau, puis séparer dépôts, retraits, preuve de réserves et risque produit. Sans données vérifiables, elle garde la méthode et masque tout classement.",
    checksTitle: "Avant de financer ou connecter un wallet",
    checks: ["Le domaine officiel, l’app ou la documentation doivent correspondre", "Le réseau, le contrat, le symbole et les décimales doivent correspondre", "Dépôt, retrait, bridge, gas, slippage et approvals se vérifient séparément"],
    sourcesTitle: "Limite des sources acceptées",
    sources: ["Page officielle PoR ou réserves", "Explorateur public, contrat ou état du protocole", "Aide ou documentation officielle"],
    boundary: "Ne prouve pas l’éligibilité du compte, la sécurité des actifs, la liquidité en direct, le rendement, les airdrops ou les avantages de frais. Confirmer l’action finale sur la page officielle.",
    status: "Aucune mesure en direct n’est publiée ici : ni ratio de réserves, ni flux nets, ni classement de sécurité. Suivez les étapes et les rapports officiels ci-dessous.",
    intro: "La preuve de réserves (PoR) est le rapport daté que la plateforme publie elle-même sur les actifs qu’elle dit détenir face aux soldes de ses clients. Lisez-le vous-même, depuis le domaine officiel, avant de déposer ou de laisser des fonds.",
    stepsTitle: "Comment lire un rapport de preuve de réserves",
    steps: ["Ouvrez le rapport depuis le domaine officiel de la plateforme (liens ci-dessous) et notez la date de l’instantané.", "Vérifiez quels actifs sont couverts et si les passifs envers les clients sont inclus, pas seulement les soldes des wallets.", "Vérifiez votre propre solde avec l’outil d’arbre de Merkle ou de preuve à divulgation nulle de la plateforme.", "Regardez qui a établi ou attesté le rapport et quel périmètre il indique ; un rapport auto-publié est une preuve plus faible.", "Observez la part du jeton propre à la plateforme : un ratio élevé fondé sur ce jeton en dit moins sur les retraits."],
    venuesTitle: "Pages officielles de preuve de réserves",
    venuesNote: "Liens issus des fiches plateformes de NexuAlpha, ouverts le {date}. Dates, périmètre et méthodes changent ; lisez la date sur la page de la plateforme.",
    linkLabel: "Rapport officiel",
    boundaryTitle: "Ce qu’un rapport de réserves ne prouve pas",
    guarantee: "Une preuve de réserves est un instantané, pas un audit de tous les passifs. Ce n’est ni une garantie de solvabilité ou de sécurité, ni une assurance des dépôts ; une plateforme peut suspendre les retraits ou faire faillite après un bon rapport.",
    cta: "Ouvrir la page officielle ↗",
  },
  de: {
    eyebrow: "Prüfanleitung",
    title: "On-Chain-Liquidität und Proof of Reserves: So prüfen Sie eine Börse",
    subtitle: "Diese Seite veröffentlicht nur On-chain-Informationen, die auf offizielle Reservenachweise, öffentliche Explorer oder Protokolldokumente zurückführbar sind. Ohne verifizierten Feed bleiben simulierte Flüsse, Reservequoten und Sicherheitsurteile verborgen.",
    answerTitle: "Was beantwortet diese Seite jetzt?",
    answer: "Sie macht On-chain-Recherche zu einer Prüfliste: offizielle Quelle bestätigen, Wallet, Vertrag und Netzwerk abgleichen und danach Einzahlungen, Auszahlungen, Reservenachweis und Produktrisiko getrennt prüfen. Ohne verifizierte Daten gibt es kein Ranking.",
    checksTitle: "Vor Einzahlung oder Wallet-Verbindung prüfen",
    checks: ["Offizielle Domain, App oder Dokumentation müssen übereinstimmen", "Netzwerk, Vertragsadresse, Asset-Symbol und Dezimalstellen müssen übereinstimmen", "Einzahlung, Auszahlung, Bridge, Gas, Slippage und Freigaben getrennt bewerten"],
    sourcesTitle: "Akzeptierte Quellen",
    sources: ["Offizielle PoR- oder Reservenseite", "Öffentlicher Explorer, Vertrag oder Protokollstatus", "Offizielle Hilfe oder Dokumentation"],
    boundary: "Belegt keine Kontoberechtigung, Asset-Sicherheit, Live-Liquidität, Rendite, Airdrops oder Gebührenvorteile. Die finale Aktion muss auf der offiziellen Seite bestätigt werden.",
    status: "Hier werden keine Live-Messwerte veröffentlicht: keine Reservequoten, Nettoflüsse oder Sicherheitsrankings. Nutzen Sie die Schritte und die offiziellen Berichte unten.",
    intro: "Proof of Reserves (PoR) ist der datierte Bericht, den die Börse selbst über die Vermögenswerte veröffentlicht, die sie nach eigener Aussage für Kundenguthaben hält. Lesen Sie ihn selbst auf der offiziellen Domain, bevor Sie einzahlen oder Guthaben dort lassen.",
    stepsTitle: "So lesen Sie einen Proof-of-Reserves-Bericht",
    steps: ["Öffnen Sie den Bericht über die offizielle Domain der Börse (Links unten) und notieren Sie das Stichtagsdatum.", "Prüfen Sie, welche Vermögenswerte abgedeckt sind und ob Kundenverbindlichkeiten enthalten sind, nicht nur Wallet-Bestände.", "Prüfen Sie Ihr eigenes Guthaben mit dem Merkle-Tree- oder Zero-Knowledge-Nachweis der Börse.", "Sehen Sie nach, wer den Bericht erstellt oder bestätigt hat und welchen Umfang er nennt; ein selbst veröffentlichter Bericht ist ein schwächerer Beleg.", "Achten Sie auf den Anteil des börseneigenen Tokens: Eine hohe Quote auf Basis des eigenen Tokens sagt weniger über Auszahlungen aus."],
    venuesTitle: "Offizielle Proof-of-Reserves-Seiten",
    venuesNote: "Links aus den Plattformdaten von NexuAlpha, geöffnet am {date}. Berichtsdaten, Umfang und Methoden ändern sich; maßgeblich ist das Datum auf der Seite der Börse.",
    linkLabel: "Offizieller Bericht",
    boundaryTitle: "Was ein Reservebericht nicht beweist",
    guarantee: "Ein Proof of Reserves ist eine Momentaufnahme, keine Prüfung aller Verbindlichkeiten. Er ist keine Garantie für Solvenz oder Sicherheit und keine Einlagensicherung; eine Börse kann auch nach einem guten Bericht Auszahlungen stoppen oder ausfallen.",
    cta: "Offizielle Seite öffnen ↗",
  },
  ja: {
    eyebrow: "確認ガイド",
    title: "オンチェーン流動性と準備金証明：取引所の確認方法",
    subtitle: "このページは、公式の準備金開示、公開ブロックエクスプローラー、またはプロトコル文書に結び付けられるオンチェーン情報だけを扱います。検証済みフィードが未接続のため、模擬フロー、準備率、安全判断は表示しません。",
    answerTitle: "このページで今確認できること",
    answer: "オンチェーン調査を、公式ソースの確認、ウォレット・コントラクト・ネットワークの照合、入出金・準備金証明・商品リスクの確認に分けます。検証可能なデータがない場合、方法だけを示し、順位付けは行いません。",
    checksTitle: "入金やウォレット接続前の確認",
    checks: ["公式ドメイン、アプリ、文書が一致しているか", "ネットワーク、コントラクト、資産記号、小数点が一致しているか", "入金、出金、ブリッジ、ガス、スリッページ、承認リスクを分けて見る"],
    sourcesTitle: "採用するソースの境界",
    sources: ["公式PoRまたは準備金開示ページ", "公開エクスプローラー、コントラクト、プロトコル状態ページ", "公式ヘルプセンターまたは文書"],
    boundary: "口座利用可否、資産安全性、リアルタイム流動性、利回り、エアドロップ、手数料特典を保証しません。最終操作は公式ページで確認してください。",
    status: "このページはリアルタイム指標を公開していません。準備金比率、純流入出、安全ランキングは表示しません。以下の手順と公式レポートで検証してください。",
    intro: "準備金証明（PoR）は、取引所が顧客残高に対して保有すると説明する資産について、自ら公表する日付付きの報告です。入金や資産の預け入れの前に、公式ドメインから自分で確認してください。",
    stepsTitle: "準備金証明レポートの読み方",
    steps: ["取引所の公式ドメインからレポートを開き（下のリンク）、スナップショットの日付を確認します。", "対象資産と、ウォレット残高だけでなく顧客負債が含まれているかを確認します。", "取引所のマークルツリーまたはゼロ知識証明ツールで、自分の残高が含まれているか検証します。", "誰が作成・証明したか、その範囲を確認します。取引所が自ら公表しただけの報告は根拠として弱めです。", "自社トークンの比率を確認します。自社トークンで高く見える比率は、出金能力をあまり示しません。"],
    venuesTitle: "公式の準備金証明ページ",
    venuesNote: "リンクは NexuAlpha のプラットフォーム記録から取得し、{date} に開いて確認しました。報告日・対象範囲・方法は変わるため、取引所ページの日付を確認してください。",
    linkLabel: "公式レポート",
    boundaryTitle: "準備金報告で証明できないこと",
    guarantee: "準備金証明はある時点のスナップショットで、すべての負債の監査ではありません。支払能力や安全の保証でも預金保険でもなく、良好な報告の後でも出金停止や破綻は起こり得ます。",
    cta: "公式ページを開く ↗",
  },
  ko: {
    eyebrow: "확인 가이드",
    title: "온체인 유동성과 준비금 증명: 거래소를 확인하는 방법",
    subtitle: "이 페이지는 공식 준비금 공개, 공개 블록 익스플로러 또는 프로토콜 문서로 추적되는 온체인 정보만 게시합니다. 검증된 실시간 피드가 연결되지 않았으므로 시뮬레이션 흐름, 준비금 비율, 안전 결론은 숨깁니다.",
    answerTitle: "지금 이 페이지가 답하는 것",
    answer: "온체인 조사를 공식 출처 확인, 지갑·계약·네트워크 대조, 입출금·준비금 증명·상품 위험 검토로 나눕니다. 검증 가능한 데이터가 없으면 방법만 보여 주고 순위는 제공하지 않습니다.",
    checksTitle: "입금 또는 지갑 연결 전 확인",
    checks: ["공식 도메인, 앱 또는 문서가 일치하는지 확인", "네트워크, 계약 주소, 자산 심볼, 소수 자리가 일치하는지 확인", "입금, 출금, 브리지, 가스, 슬리피지, 승인 위험을 분리해서 확인"],
    sourcesTitle: "허용되는 출처 범위",
    sources: ["공식 PoR 또는 준비금 공개 페이지", "공개 익스플로러, 계약 주소 또는 프로토콜 상태 페이지", "공식 도움말 센터와 문서"],
    boundary: "계정 자격, 자산 안전성, 실시간 유동성, 수익, 에어드롭 또는 수수료 혜택을 증명하지 않습니다. 최종 조치는 공식 페이지에서 확인해야 합니다.",
    status: "이 페이지는 실시간 지표를 게시하지 않습니다. 준비금 비율, 순유입·유출, 안전 순위를 표시하지 않으니 아래 단계와 공식 보고서로 검증하세요.",
    intro: "준비금 증명(PoR)은 거래소가 고객 잔액에 대해 보유한다고 밝히는 자산을 스스로 공개하는 날짜가 있는 보고서입니다. 입금하거나 자산을 맡기기 전에 공식 도메인에서 직접 읽어 보세요.",
    stepsTitle: "준비금 증명 보고서 읽는 법",
    steps: ["거래소 공식 도메인에서 보고서를 열고(아래 링크) 스냅샷 날짜를 기록합니다.", "어떤 자산이 포함되는지, 지갑 잔액뿐 아니라 고객 부채도 함께 표시되는지 확인합니다.", "거래소의 머클 트리 또는 영지식 증명 도구로 내 잔액이 포함되었는지 검증합니다.", "누가 보고서를 작성하거나 증명했는지, 범위가 무엇인지 확인합니다. 거래소가 자체 게시한 보고서는 근거가 약합니다.", "거래소 자체 토큰 비중을 확인합니다. 자체 토큰으로 높아진 비율은 출금 능력을 잘 보여 주지 못합니다."],
    venuesTitle: "공식 준비금 증명 페이지",
    venuesNote: "링크는 NexuAlpha 플랫폼 기록에서 가져왔으며 {date}에 열어 확인했습니다. 보고 날짜, 범위와 방법은 바뀌므로 거래소 페이지의 날짜를 확인하세요.",
    linkLabel: "공식 보고서",
    boundaryTitle: "준비금 보고서가 증명하지 않는 것",
    guarantee: "준비금 증명은 특정 시점의 스냅샷이며 모든 부채에 대한 감사가 아닙니다. 지급 능력이나 안전의 보장도, 예금 보험도 아니며 좋은 보고서 이후에도 출금 중단이나 파산이 일어날 수 있습니다.",
    cta: "공식 페이지 열기 ↗",
  },
  ar: {
    eyebrow: "دليل التحقق",
    title: "السيولة على السلسلة وإثبات الاحتياطيات: كيف تتحقق من منصة تداول",
    subtitle: "تنشر هذه الصفحة معلومات على السلسلة فقط عندما يمكن ربطها بإفصاح رسمي عن الاحتياطيات أو مستكشف عام أو وثائق بروتوكول. لا يوجد حالياً مصدر مباشر موثوق، لذلك لا نعرض تدفقات أو نسب احتياطي أو أحكام أمان محاكاة.",
    answerTitle: "ماذا تجيب هذه الصفحة الآن؟",
    answer: "تحول البحث على السلسلة إلى قائمة تحقق: تأكيد المصدر الرسمي، مطابقة المحفظة والعقد والشبكة، ثم فصل الإيداع والسحب وإثبات الاحتياطيات ومخاطر المنتج. من دون بيانات قابلة للتحقق لا توجد رتبة أمان.",
    checksTitle: "قبل التمويل أو ربط المحفظة",
    checks: ["يجب أن يتطابق النطاق الرسمي أو التطبيق أو الوثائق", "يجب أن تتطابق الشبكة وعنوان العقد ورمز الأصل والأرقام العشرية", "الإيداع والسحب والجسر والغاز والانزلاق والموافقات مخاطر منفصلة"],
    sourcesTitle: "حدود المصادر المقبولة",
    sources: ["صفحة رسمية لإثبات الاحتياطيات أو الإفصاح عنها", "مستكشف عام أو عقد أو حالة بروتوكول", "مركز مساعدة أو وثائق رسمية"],
    boundary: "لا يثبت أهلية الحساب أو أمان الأصول أو السيولة الحية أو العائد أو الإيردروب أو مزايا الرسوم. يجب تأكيد الإجراء النهائي على الصفحة الرسمية.",
    status: "لا تُنشر هنا أي مؤشرات مباشرة: لا نسب احتياطي ولا صافي تدفقات ولا تصنيفات أمان. استخدم الخطوات والتقارير الرسمية أدناه.",
    intro: "إثبات الاحتياطيات (PoR) تقرير مؤرخ تنشره المنصة نفسها عن الأصول التي تقول إنها تحتفظ بها مقابل أرصدة العملاء. اقرأه بنفسك من النطاق الرسمي قبل الإيداع أو إبقاء أموالك على المنصة.",
    stepsTitle: "كيف تقرأ تقرير إثبات الاحتياطيات",
    steps: ["افتح التقرير من النطاق الرسمي للمنصة (الروابط أدناه) وسجّل تاريخ اللقطة.", "تحقق من الأصول المشمولة ومن إدراج التزامات العملاء، لا أرصدة المحافظ فقط.", "تحقق من رصيدك بأداة شجرة ميركل أو إثبات المعرفة الصفرية لدى المنصة.", "انظر من أعد التقرير أو صادق عليه وما النطاق المعلن؛ التقرير المنشور ذاتيًا دليل أضعف.", "راقب حصة رمز المنصة الخاص: النسبة المرتفعة القائمة على رمزها الخاص تقول القليل عن السحب."],
    venuesTitle: "صفحات إثبات الاحتياطيات الرسمية",
    venuesNote: "الروابط مأخوذة من سجلات المنصات لدى NexuAlpha وفُتحت في {date}. تتغير التواريخ والنطاق والأساليب؛ اعتمد التاريخ الظاهر في صفحة المنصة.",
    linkLabel: "التقرير الرسمي",
    boundaryTitle: "ما لا يثبته تقرير الاحتياطيات",
    guarantee: "إثبات الاحتياطيات لقطة في لحظة معينة وليس تدقيقًا لجميع الالتزامات. ليس ضمانًا للملاءة أو الأمان ولا تأمينًا على الودائع؛ قد توقف المنصة السحب أو تنهار حتى بعد تقرير جيد.",
    cta: "افتح الصفحة الرسمية ↗",
  },
  tr: {
    eyebrow: "Doğrulama rehberi",
    title: "Zincir üstü likidite ve rezerv kanıtı: Bir borsa nasıl doğrulanır",
    subtitle: "Bu sayfa yalnızca resmi rezerv açıklaması, herkese açık explorer veya protokol dokümanına bağlanabilen zincir üstü bilgileri yayımlar. Doğrulanmış canlı feed bağlı olmadığı için simüle akış, rezerv oranı ve güvenlik sonucu gösterilmez.",
    answerTitle: "Bu sayfa şu anda neyi yanıtlar?",
    answer: "Zincir üstü araştırmayı kontrol listesine çevirir: resmi kaynağı doğrula, cüzdanı, kontratı ve ağı eşleştir, sonra yatırma, çekme, rezerv kanıtı ve ürün riskini ayır. Veri doğrulanmadığında sıralama yapılmaz.",
    checksTitle: "Fonlama veya cüzdan bağlantısından önce",
    checks: ["Resmi domain, uygulama veya doküman eşleşmeli", "Ağ, kontrat adresi, varlık sembolü ve ondalıklar eşleşmeli", "Yatırma, çekme, bridge, gas, slippage ve onay riskleri ayrı kontrol edilmeli"],
    sourcesTitle: "Kabul edilen kaynak sınırı",
    sources: ["Resmi PoR veya rezerv açıklama sayfası", "Herkese açık explorer, kontrat veya protokol durum sayfası", "Resmi yardım merkezi veya dokümantasyon"],
    boundary: "Hesap uygunluğu, varlık güvenliği, canlı likidite, getiri, airdrop veya ücret avantajı kanıtlamaz. Son işlem resmi sayfada doğrulanmalıdır.",
    status: "Burada canlı metrik yayımlanmaz: rezerv oranı, net akış veya güvenlik sıralaması gösterilmez. Aşağıdaki adımları ve resmî raporları kullanın.",
    intro: "Rezerv kanıtı (PoR), borsanın müşteri bakiyelerine karşı tuttuğunu söylediği varlıklar hakkında kendi yayımladığı tarihli rapordur. Para yatırmadan veya fon tutmadan önce resmî alan adından kendiniz okuyun.",
    stepsTitle: "Rezerv kanıtı raporu nasıl okunur",
    steps: ["Raporu borsanın resmî alan adından açın (aşağıdaki bağlantılar) ve anlık görüntü tarihini not edin.", "Hangi varlıkların kapsandığını ve yalnızca cüzdan bakiyelerinin değil müşteri yükümlülüklerinin de dahil olup olmadığını kontrol edin.", "Kendi bakiyenizi borsanın Merkle ağacı veya sıfır bilgi kanıtı aracıyla doğrulayın.", "Raporu kimin hazırladığına veya onayladığına ve kapsamına bakın; borsanın kendi yayımladığı rapor daha zayıf bir kanıttır.", "Borsanın kendi tokeninin payına bakın: kendi tokeniyle yükselen bir oran çekimler hakkında daha az şey söyler."],
    venuesTitle: "Resmî rezerv kanıtı sayfaları",
    venuesNote: "Bağlantılar NexuAlpha platform kayıtlarından alındı ve {date} tarihinde açıldı. Rapor tarihleri, kapsam ve yöntemler değişir; borsa sayfasındaki tarihi esas alın.",
    linkLabel: "Resmî rapor",
    boundaryTitle: "Rezerv raporunun kanıtlamadıkları",
    guarantee: "Rezerv kanıtı bir anlık görüntüdür, tüm yükümlülüklerin denetimi değildir. Ödeme gücü veya güvenlik garantisi ya da mevduat sigortası değildir; iyi bir rapordan sonra bile borsa çekimleri durdurabilir veya batabilir.",
    cta: "Resmî sayfayı aç ↗",
  },
  ru: {
    eyebrow: "Руководство по проверке",
    title: "Ончейн-ликвидность и proof of reserves: как проверить биржу",
    subtitle: "Эта страница публикует только ончейн-информацию, связанную с официальными раскрытиями резервов, публичными обозревателями или документацией протокола. Проверенный live-feed не подключён, поэтому симуляции и выводы о безопасности скрыты.",
    answerTitle: "Что эта страница отвечает сейчас?",
    answer: "Она превращает ончейн-анализ в чек-лист: подтвердить официальный источник, сверить кошелёк, контракт и сеть, затем отдельно проверить ввод, вывод, резервы и риск продукта. Без проверяемых данных рейтинги не выводятся.",
    checksTitle: "Перед пополнением или подключением кошелька",
    checks: ["Официальный домен, приложение или документация должны совпадать", "Сеть, адрес контракта, тикер и decimals должны совпадать", "Пополнение, вывод, bridge, gas, slippage и approvals проверяются отдельно"],
    sourcesTitle: "Граница допустимых источников",
    sources: ["Официальная страница PoR или резервов", "Публичный обозреватель, контракт или статус протокола", "Официальная справка или документация"],
    boundary: "Не доказывает доступность аккаунта, безопасность активов, live-ликвидность, доходность, airdrop или скидки. Финальное действие подтверждается на официальной странице.",
    status: "Здесь не публикуются показатели в реальном времени: нет коэффициентов резервов, чистых потоков и рейтингов безопасности. Используйте шаги и официальные отчёты ниже.",
    intro: "Proof of reserves (PoR) — датированный отчёт самой биржи об активах, которые она, по её словам, держит под балансы клиентов. Прочитайте его сами на официальном домене, прежде чем вносить или хранить средства.",
    stepsTitle: "Как читать отчёт proof of reserves",
    steps: ["Откройте отчёт на официальном домене биржи (ссылки ниже) и запишите дату снимка.", "Проверьте, какие активы охвачены и включены ли обязательства перед клиентами, а не только балансы кошельков.", "Проверьте свой баланс через инструмент дерева Меркла или доказательства с нулевым разглашением на бирже.", "Посмотрите, кто составил или подтвердил отчёт и каков заявленный охват; отчёт, опубликованный самой биржей, — более слабое доказательство.", "Обратите внимание на долю собственного токена биржи: высокий коэффициент за счёт своего токена мало говорит о выводе средств."],
    venuesTitle: "Официальные страницы proof of reserves",
    venuesNote: "Ссылки взяты из карточек платформ NexuAlpha и открыты {date}. Даты, охват и методы меняются; ориентируйтесь на дату на странице биржи.",
    linkLabel: "Официальный отчёт",
    boundaryTitle: "Что отчёт о резервах не доказывает",
    guarantee: "Proof of reserves — это снимок на дату, а не аудит всех обязательств. Это не гарантия платёжеспособности или безопасности и не страхование вкладов; биржа может приостановить вывод или обанкротиться даже после хорошего отчёта.",
    cta: "Открыть официальную страницу ↗",
  },
  id: {
    eyebrow: "Panduan verifikasi",
    title: "Likuiditas on-chain dan proof of reserves: cara memverifikasi exchange",
    subtitle: "Halaman ini hanya menerbitkan informasi on-chain yang dapat ditautkan ke pengungkapan cadangan resmi, explorer publik, atau dokumentasi protokol. Karena feed terverifikasi belum terhubung, arus simulasi, rasio cadangan, dan kesimpulan keamanan disembunyikan.",
    answerTitle: "Apa yang bisa dijawab halaman ini sekarang?",
    answer: "Halaman ini mengubah riset on-chain menjadi checklist: konfirmasi sumber resmi, cocokkan wallet, kontrak, dan jaringan, lalu pisahkan cek deposit, penarikan, proof of reserves, dan risiko produk. Tanpa data terverifikasi, tidak ada ranking keamanan.",
    checksTitle: "Sebelum deposit atau menghubungkan wallet",
    checks: ["Domain resmi, aplikasi, atau dokumentasi harus cocok", "Jaringan, alamat kontrak, simbol aset, dan desimal harus cocok", "Deposit, penarikan, bridge, gas, slippage, dan approval adalah risiko terpisah"],
    sourcesTitle: "Batas sumber yang diterima",
    sources: ["Halaman resmi PoR atau cadangan", "Explorer publik, kontrak, atau status protokol", "Pusat bantuan atau dokumentasi resmi"],
    boundary: "Tidak membuktikan kelayakan akun, keamanan aset, likuiditas live, yield, airdrop, atau manfaat biaya. Aksi final harus dikonfirmasi di halaman resmi.",
    status: "Metrik langsung tidak dipublikasikan di sini: tidak ada rasio cadangan, arus bersih, atau peringkat keamanan. Gunakan langkah dan laporan resmi di bawah.",
    intro: "Proof of reserves (PoR) adalah laporan bertanggal yang diterbitkan exchange sendiri tentang aset yang dikatakannya disimpan untuk saldo nasabah. Baca sendiri dari domain resmi sebelum menyetor atau menyimpan dana.",
    stepsTitle: "Cara membaca laporan proof of reserves",
    steps: ["Buka laporan dari domain resmi exchange (tautan di bawah) dan catat tanggal snapshot.", "Periksa aset apa saja yang dicakup dan apakah kewajiban kepada nasabah ikut dicantumkan, bukan hanya saldo wallet.", "Verifikasi saldo Anda sendiri dengan alat Merkle tree atau zero-knowledge proof milik exchange.", "Lihat siapa yang menyusun atau mengatestasi laporan dan cakupannya; laporan yang diterbitkan sendiri adalah bukti yang lebih lemah.", "Perhatikan porsi token milik exchange: rasio tinggi yang bertumpu pada token sendiri sedikit menjelaskan kemampuan penarikan."],
    venuesTitle: "Halaman proof of reserves resmi",
    venuesNote: "Tautan diambil dari catatan platform NexuAlpha dan dibuka pada {date}. Tanggal, cakupan, dan metode berubah; pegang tanggal di halaman exchange.",
    linkLabel: "Laporan resmi",
    boundaryTitle: "Yang tidak dibuktikan laporan cadangan",
    guarantee: "Proof of reserves adalah potret pada satu waktu, bukan audit atas semua kewajiban. Ini bukan jaminan solvabilitas atau keamanan dan bukan asuransi simpanan; exchange tetap bisa menghentikan penarikan atau bangkrut setelah laporan yang baik.",
    cta: "Buka halaman resmi ↗",
  },
  vi: {
    eyebrow: "Hướng dẫn kiểm tra",
    title: "Thanh khoản on-chain và bằng chứng dự trữ: cách kiểm tra một sàn",
    subtitle: "Trang này chỉ công bố thông tin on-chain gắn với công bố dự trữ chính thức, explorer công khai hoặc tài liệu giao thức. Chưa có feed xác minh nên không hiển thị dòng tiền mô phỏng, tỷ lệ dự trữ hay kết luận an toàn.",
    answerTitle: "Trang này hiện trả lời điều gì?",
    answer: "Trang biến nghiên cứu on-chain thành checklist: xác nhận nguồn chính thức, đối chiếu ví, hợp đồng và mạng, rồi tách riêng nạp, rút, proof of reserves và rủi ro sản phẩm. Khi thiếu dữ liệu xác minh, không có xếp hạng an toàn.",
    checksTitle: "Trước khi nạp tiền hoặc kết nối ví",
    checks: ["Tên miền, ứng dụng hoặc tài liệu chính thức phải khớp", "Mạng, địa chỉ hợp đồng, ký hiệu tài sản và số thập phân phải khớp", "Nạp, rút, bridge, gas, trượt giá và approval là các rủi ro riêng"],
    sourcesTitle: "Ranh giới nguồn được chấp nhận",
    sources: ["Trang PoR hoặc dự trữ chính thức", "Explorer công khai, hợp đồng hoặc trạng thái giao thức", "Trung tâm trợ giúp hoặc tài liệu chính thức"],
    boundary: "Không chứng minh điều kiện tài khoản, an toàn tài sản, thanh khoản trực tiếp, lợi suất, airdrop hay ưu đãi phí. Hành động cuối phải xác nhận trên trang chính thức.",
    status: "Trang này không công bố chỉ số trực tiếp: không có tỷ lệ dự trữ, dòng tiền ròng hay xếp hạng an toàn. Hãy dùng các bước và báo cáo chính thức bên dưới.",
    intro: "Bằng chứng dự trữ (PoR) là báo cáo có ngày do chính sàn công bố về tài sản mà sàn cho biết đang giữ tương ứng với số dư của khách hàng. Hãy tự đọc từ tên miền chính thức trước khi nạp hoặc giữ tiền trên sàn.",
    stepsTitle: "Cách đọc báo cáo bằng chứng dự trữ",
    steps: ["Mở báo cáo từ tên miền chính thức của sàn (liên kết bên dưới) và ghi lại ngày chụp dữ liệu.", "Kiểm tra tài sản nào được bao gồm và nghĩa vụ với khách hàng có được liệt kê hay không, chứ không chỉ số dư ví.", "Xác minh số dư của chính bạn bằng công cụ cây Merkle hoặc bằng chứng không tiết lộ của sàn.", "Xem ai lập hoặc chứng thực báo cáo và phạm vi nêu ra; báo cáo do sàn tự công bố là bằng chứng yếu hơn.", "Chú ý tỷ trọng token riêng của sàn: tỷ lệ cao nhờ token của chính sàn nói ít về khả năng rút tiền."],
    venuesTitle: "Trang bằng chứng dự trữ chính thức",
    venuesNote: "Liên kết lấy từ hồ sơ nền tảng của NexuAlpha và được mở vào {date}. Ngày báo cáo, phạm vi và phương pháp thay đổi; hãy xem ngày trên trang của sàn.",
    linkLabel: "Báo cáo chính thức",
    boundaryTitle: "Điều báo cáo dự trữ không chứng minh",
    guarantee: "Bằng chứng dự trữ là ảnh chụp tại một thời điểm, không phải kiểm toán mọi nghĩa vụ. Đây không phải bảo đảm khả năng thanh toán hay an toàn, cũng không phải bảo hiểm tiền gửi; sàn vẫn có thể tạm dừng rút tiền hoặc sụp đổ sau một báo cáo tốt.",
    cta: "Mở trang chính thức ↗",
  },
  it: {
    eyebrow: "Guida alla verifica",
    title: "Liquidità on-chain e proof of reserves: come verificare un exchange",
    subtitle: "Questa pagina pubblica solo informazioni on-chain collegabili a riserve ufficiali, explorer pubblici o documentazione del protocollo. Non essendoci un feed verificato, flussi simulati, rapporti di riserva e conclusioni di sicurezza restano nascosti.",
    answerTitle: "Cosa risponde questa pagina ora?",
    answer: "Trasforma la ricerca on-chain in una checklist: confermare la fonte ufficiale, confrontare wallet, contratto e rete, poi separare depositi, prelievi, proof of reserves e rischio prodotto. Senza dati verificabili non mostra classifiche.",
    checksTitle: "Prima di finanziare o collegare un wallet",
    checks: ["Dominio ufficiale, app o documentazione devono coincidere", "Rete, indirizzo contratto, simbolo asset e decimali devono coincidere", "Deposito, prelievo, bridge, gas, slippage e approval sono rischi separati"],
    sourcesTitle: "Confine delle fonti accettate",
    sources: ["Pagina ufficiale PoR o riserve", "Explorer pubblico, contratto o stato del protocollo", "Centro assistenza o documentazione ufficiale"],
    boundary: "Non prova idoneità dell’account, sicurezza degli asset, liquidità live, rendimento, airdrop o vantaggi sulle commissioni. L’azione finale va confermata sulla pagina ufficiale.",
    status: "Qui non vengono pubblicate metriche live: nessun rapporto di riserva, flusso netto o classifica di sicurezza. Usa i passaggi e i report ufficiali qui sotto.",
    intro: "La proof of reserves (PoR) è il report datato che l’exchange pubblica sugli asset che dichiara di detenere a fronte dei saldi dei clienti. Leggilo tu stesso, dal dominio ufficiale, prima di depositare o lasciare fondi.",
    stepsTitle: "Come leggere un report proof of reserves",
    steps: ["Apri il report dal dominio ufficiale dell’exchange (link qui sotto) e annota la data dello snapshot.", "Controlla quali asset sono coperti e se sono incluse le passività verso i clienti, non solo i saldi dei wallet.", "Verifica il tuo saldo con lo strumento Merkle tree o a conoscenza zero dell’exchange.", "Guarda chi ha redatto o attestato il report e quale perimetro dichiara; un report autopubblicato è una prova più debole.", "Osserva la quota del token proprietario: un rapporto alto basato sul proprio token dice meno sui prelievi."],
    venuesTitle: "Pagine ufficiali proof of reserves",
    venuesNote: "Link presi dalle schede piattaforma di NexuAlpha e aperti il {date}. Date, perimetro e metodi cambiano; fai fede alla data sulla pagina dell’exchange.",
    linkLabel: "Report ufficiale",
    boundaryTitle: "Cosa non dimostra un report sulle riserve",
    guarantee: "Una proof of reserves è un’istantanea, non una revisione di tutte le passività. Non è una garanzia di solvibilità o sicurezza né un’assicurazione dei depositi; un exchange può sospendere i prelievi o fallire anche dopo un buon report.",
    cta: "Apri pagina ufficiale ↗",
  },
};

// l10n: needs native review
copy.ur = {
  ...copy.en,
  eyebrow: "تصدیقی رہنما",
  title: "آن چین لیکویڈیٹی اور ذخائر کا ثبوت: ایکسچینج کی تصدیق کیسے کریں",
  subtitle: "یہ صفحہ صرف وہ آن چین معلومات شائع کرتا ہے جو سرکاری ذخائر کے افشا، عوامی ایکسپلورر یا پروٹوکول دستاویزات سے ملائی جا سکیں۔ تصدیق شدہ براہ راست فیڈ منسلک نہیں، اس لیے فرضی بہاؤ، ذخائر کے تناسب اور حفاظتی نتائج چھپے ہیں۔",
  answerTitle: "یہ صفحہ ابھی کیا جواب دیتا ہے؟",
  answer: "یہ آن چین تحقیق کو چیک لسٹ میں بدلتا ہے: سرکاری ماخذ کی تصدیق کریں، والیٹ، معاہدہ اور نیٹ ورک کی تفصیلات ملائیں، پھر ڈپازٹ، ودڈرال، ذخائر کے ثبوت اور مصنوعات کے خطرے کا جائزہ لیں۔ تصدیق شدہ ڈیٹا کے بغیر درجہ بندی نہیں دکھائی جاتی۔",
  checksTitle: "فنڈز ڈالنے یا والیٹ جوڑنے سے پہلے",
  checks: ["سرکاری ڈومین، ایپ یا دستاویزات آپس میں ملنی چاہییں", "نیٹ ورک، معاہدے کا پتہ، اثاثے کی علامت اور اعشاریے ملنے چاہییں", "ڈپازٹ، ودڈرال، برج، گیس، سلپیج اور منظوری الگ الگ خطرات ہیں"],
  sourcesTitle: "قبول شدہ ماخذ کی حد",
  sources: ["سرکاری PoR یا ذخائر کے افشا کا صفحہ", "عوامی ایکسپلورر، معاہدہ یا پروٹوکول اسٹیٹس صفحہ", "سرکاری مدد مرکز یا دستاویزات"],
  boundary: "یہ اکاؤنٹ اہلیت، اثاثوں کی حفاظت، براہ راست لیکویڈیٹی، پیداوار، ایئرڈراپ یا فیس فوائد ثابت نہیں کرتا۔ آخری عمل سرکاری صفحے پر تصدیق کریں۔",
  status: "یہاں براہ راست پیمائشیں شائع نہیں ہوتیں: ذخائر کا تناسب، خالص بہاؤ یا حفاظتی درجہ بندی نہیں دکھائی جاتی۔ نیچے درج مراحل اور سرکاری رپورٹس استعمال کریں۔",
  venuesTitle: "ذخائر کے ثبوت کے سرکاری صفحات",
  venuesNote: "لنکس NexuAlpha پلیٹ فارم ریکارڈز سے لیے گئے اور {date} کو کھولے گئے تھے۔ رپورٹ کی تاریخیں، دائرہ اور طریقے بدل سکتے ہیں؛ ایکسچینج کے صفحے پر درج تاریخ کو بنیاد بنائیں۔",
  linkLabel: "سرکاری رپورٹ",
  cta: "سرکاری صفحہ کھولیں ↗",
};
// l10n: needs native review
copy.uk = {
  ...copy.en,
  eyebrow: "Посібник з перевірки",
  title: "Ончейн-ліквідність і Proof of Reserves: як перевірити біржу",
  subtitle: "Ця сторінка публікує ончейн-інформацію лише тоді, коли її можна простежити до офіційного розкриття резервів, публічного оглядача або документації протоколу. Перевірений живий фід не підключено, тому симульовані потоки, коефіцієнти резервів і висновки про безпеку приховані.",
  answerTitle: "На що ця сторінка відповідає зараз?",
  answer: "Вона перетворює ончейн-дослідження на чекліст: підтвердити офіційне джерело, звірити гаманець, контракт і мережу, а потім окремо переглянути депозити, виведення, підтвердження резервів і ризик продукту. Без перевірених даних рейтинг не показується.",
  checksTitle: "Перед поповненням або підключенням гаманця",
  checks: ["Офіційний домен, застосунок або документація мають збігатися", "Мережа, адреса контракту, символ активу й десяткові знаки мають збігатися", "Депозит, виведення, міст, gas, slippage і дозволи — це окремі ризики"],
  sourcesTitle: "Межа прийнятих джерел",
  sources: ["Офіційна сторінка PoR або розкриття резервів", "Публічний оглядач, контракт або сторінка статусу протоколу", "Офіційний довідковий центр або документація"],
  boundary: "Не підтверджує відповідність акаунта, безпеку активів, живу ліквідність, дохідність, airdrop чи переваги комісій. Остаточну дію потрібно підтвердити на офіційній сторінці.",
  status: "Тут не публікуються живі метрики: немає коефіцієнта резервів, чистих потоків або рейтингу безпеки. Використовуйте наведені нижче кроки й офіційні звіти.",
  venuesTitle: "Офіційні сторінки Proof of Reserves",
  venuesNote: "Посилання взято з записів платформ NexuAlpha і відкрито {date}. Дати звітів, периметр і методи змінюються; орієнтуйтеся на дату на сторінці біржі.",
  linkLabel: "Офіційний звіт",
  cta: "Відкрити офіційну сторінку ↗",
};

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
  const SectionTag = headingLevel === 1 ? "h2" : "h3";
  const reserveSources = onchainGuideReserveSources();
  const checkedAt = new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-Hant" : locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${ONCHAIN_GUIDE_LINKS_CHECKED_AT}T00:00:00Z`));

  return (
    <section className="onchain-board-section v2-shell" id="onchain-metrics" dir={["ar", "ur"].includes(String(locale || "").split("-")[0]) ? "rtl" : undefined} data-source-reviewed-at={SOURCE_REVIEWED_AT} data-onchain-guide="verification">
      <header className="onchain-board__header">
        <div className="onchain-board__eyebrow">{t.eyebrow}</div>
        <HeadingTag className="onchain-board__title">{t.title}</HeadingTag>
        <p className="onchain-board__intro">{t.intro}</p>
        {/* No verified live feed is connected (LIQUIDITY_VENUES is empty): say so plainly instead of an empty board. */}
        <p className="onchain-board__availability" role="status" data-live-metrics="not-published">{t.status}</p>
      </header>

      <div className="onchain-board__answer" data-onchain-localized-body={locale}>
        <article className="onchain-board__card onchain-board__steps">
          <SectionTag>{t.stepsTitle}</SectionTag>
          <ol>{t.steps.map((item) => <li key={item}>{item}</li>)}</ol>
        </article>
        <article className="onchain-board__card onchain-board__checklist">
          <SectionTag>{t.checksTitle}</SectionTag>
          <ul>{t.checks.map((item) => <li key={item}><label><input type="checkbox" /><span>{item}</span></label></li>)}</ul>
        </article>
        <article className="onchain-board__card">
          <SectionTag>{t.sourcesTitle}</SectionTag>
          <ul>{t.sources.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>

      {LIQUIDITY_VENUES.length === 0 && reserveSources.length > 0 && (
        <section className="onchain-board__reserves" aria-labelledby="onchain-reserve-pages">
          <SectionTag id="onchain-reserve-pages">{t.venuesTitle}</SectionTag>
          <ul className="onchain-board__reserve-list">
            {reserveSources.map((source) => (
              <li key={source.slug}>
                <span translate="no" lang="en">{source.name}</span>
                <a href={source.url} target="_blank" rel="noopener noreferrer" data-por-venue={source.slug}>{t.linkLabel}<span aria-hidden="true"> ↗</span></a>
                <a className="onchain-board__profile-link" href={localizedPath(`/exchanges/${source.slug}`, locale)} aria-label={`${source.name}: NexuAlpha`}>NexuAlpha</a>
              </li>
            ))}
          </ul>
          <p className="onchain-board__note">{t.venuesNote.replace("{date}", checkedAt)}</p>
        </section>
      )}

      <aside className="onchain-board__guarantee" aria-labelledby="onchain-guarantee-title">
        <SectionTag id="onchain-guarantee-title">{t.boundaryTitle}</SectionTag>
        <p>{t.guarantee}</p>
        <p className="onchain-board__note">{t.boundary}</p>
      </aside>

      <details className="onchain-board__method">
        <summary>{t.answerTitle}<span aria-hidden="true">＋</span></summary>
        <p className="onchain-board__subtitle">{t.subtitle}</p>
        <p>{t.answer}</p>
      </details>
    </section>
  );
}

export default OnChainLiquidityBoard;
