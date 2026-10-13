import { formatSgt } from "./local-time.js";
import { localizedHref } from "./locale-routing.js";
import { publicCtaForVenue } from "./source-bound-cta.js";
import { RADAR_UI_COPY } from "./radar-ui-copy.js";

export { venueDisplayName } from "./radar-ui-copy.js";

export const LONG_SHORT_PATH = "/long-short";
export const WHALES_PATH = "/whales";
export const LONG_SHORT_API_PATH = "/api/long-short.json";
export const WHALES_API_PATH = "/api/whales.json";
export const RADAR_REFRESH_MS = 60 * 1000;
export const RADAR_SIGNUP_VENUES = Object.freeze(["binance", "okx", "bybit", "bitget"]);

const LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]);
export const RADAR_LOCALES = LOCALES;

const COPY = Object.freeze({
  en: {
    home: "Home",
    data: "Data",
    updated: "Updated",
    source: "Source",
    unavailableTitle: "Radar unavailable",
    unavailable: "The live cache has not produced usable rows yet. The page stays readable and will refresh when the next public snapshot arrives.",
    openData: "Open JSON",
    related: "Related data",
    viewVenue: "Check venue",
    verifyVenue: "Verify venue access",
    unknown: "unknown",
    longShortTitle: "Long/short radar",
    longShortLead: "A public-source snapshot of liquid USDT perpetual markets, ranked by account long/short ratio, top-trader ratio, open interest and 24h OI change.",
    longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios and venue open-interest endpoints.",
    longShortSummary: "Ratios show reported positioning pressure on each venue. Open interest is labelled by unit because venues publish contract, coin and USD views differently.",
    longShortExplainer: [
      "Account L/S compares long and short accounts; Binance top-trader position L/S compares position sizes. Coverage differs by venue, and the ratios do not predict price direction.",
      "Open interest is shown with its explicit venue unit and a 24h path. Compare rows within the same source context before treating a change as meaningful.",
    ],
    whalesTitle: "Whale transfer radar",
    whalesLead: "Live large transfers of BTC, ETH, USDT and USDC on public chains, with exchange wallets labelled from published address lists.",
    whalesSourceLine: "mempool.space Bitcoin mempool, PublicNode Ethereum RPC and exchanges' published proof-of-reserves wallet lists.",
    whalesSummary: "A transfer to an exchange is custody movement, not proof of a sale or owner intent. Direction labels describe the observed address path only.",
    whalesExplainer: [
      "Only addresses on an exchange's published wallet list get an exchange name; every other address is shown as an unlabelled wallet.",
      "Use direction as a review prompt: to exchange, from exchange and wallet-to-wallet are operational categories, not intent, wealth or execution claims.",
    ],
    columns: {
      rank: "#",
      symbol: "Symbol",
      venue: "Venue",
      accountRatio: "Account L/S",
      topTraderRatio: "Top trader L/S",
      oi: "Open interest",
      oiChange: "24h OI",
      spark: "24h path",
      asset: "Asset",
      amount: "Amount",
      from: "From",
      to: "To",
      direction: "Direction",
      time: "Time",
    },
    directions: { to_exchange: "to exchange", from_exchange: "from exchange", wallet_to_wallet: "wallet-to-wallet", unknown: "unknown" },
  },
  "zh-Hans": {
    home: "首页", data: "数据", updated: "更新", source: "来源", unavailableTitle: "雷达暂不可用", unavailable: "实时缓存还没有产出可用行。页面保持可读，并会在下一次公共快照到达后刷新。", openData: "打开 JSON", related: "相关数据", viewVenue: "查看平台", verifyVenue: "查看平台", unknown: "未标注钱包",
    longShortTitle: "多空比雷达", longShortLead: "按账户多空比、顶级交易员多空比、未平仓量和 24 小时 OI 变化观察头部永续市场。", longShortSourceLine: "币安合约数据、OKX Rubik 统计、Bybit 账户多空比及各平台未平仓量接口。", longShortSummary: "多空比反映各平台公布的仓位压力。未平仓量会明确标出单位，因为不同平台会发布张数、币本位或美元视图。", longShortExplainer: ["账户多空比比较多头与空头账户数；币安顶级交易员持仓多空比比较持仓规模。不同平台统计范围不同，比率不能证明价格方向。", "未平仓量带单位和 24 小时迷你走势，便于区分新建仓与滞后的比率。"],
    whalesTitle: "巨鲸转账雷达", whalesLead: "实时追踪 BTC、ETH、USDT、USDC 大额链上转账，并标出交易所钱包。", whalesSourceLine: "mempool.space 比特币内存池、PublicNode 以太坊 RPC，以及各交易所公布的储备金证明钱包地址列表。", whalesSummary: "转入交易所只是托管路径变化，不等于卖出。方向标签只描述可观察地址路径。", whalesExplainer: ["只有出现在交易所公开地址列表中的地址才会标注交易所名称，其余地址显示为“未标注钱包”。", "“转入交易所”“转出交易所”“钱包间转账”只描述资金路径，不代表买卖意图或成交。"],
  },
  "zh-Hant": {
    home: "首頁", data: "數據", updated: "更新", source: "來源", unavailableTitle: "雷達暫不可用", unavailable: "即時快取尚未產出可用資料列。頁面保持可讀，並會在下一次公共快照抵達後刷新。", openData: "開啟 JSON", related: "相關數據", viewVenue: "查看平台", verifyVenue: "查看平台", unknown: "未標註錢包",
    longShortTitle: "多空比雷達", longShortLead: "按帳戶多空比、頂級交易員多空比、未平倉量與 24 小時 OI 變化觀察頭部永續市場。", longShortSourceLine: "幣安合約數據、OKX Rubik 統計、Bybit 帳戶多空比及各平台未平倉量介面。", longShortSummary: "多空比反映各平台公布的倉位壓力。未平倉量會明確標出單位，因為不同平台會發布張數、幣本位或美元視圖。", longShortExplainer: ["帳戶多空比比較多頭與空頭帳戶數；幣安頂級交易員持倉多空比比較持倉規模。不同平台統計範圍不同，比率不能證明價格方向。", "未平倉量帶單位和 24 小時迷你走勢，便於區分新建倉與滯後比率。"],
    whalesTitle: "巨鯨轉帳雷達", whalesLead: "即時追蹤 BTC、ETH、USDT、USDC 大額鏈上轉帳，並標出交易所錢包。", whalesSourceLine: "mempool.space 比特幣記憶體池、PublicNode 以太坊 RPC，以及各交易所公布的儲備金證明錢包地址列表。", whalesSummary: "轉入交易所只是託管路徑變化，不等於賣出。方向標籤只描述可觀察地址路徑。", whalesExplainer: ["只有出現在交易所公開地址列表中的地址才會標註交易所名稱，其餘地址顯示為「未標註錢包」。", "「轉入交易所」「轉出交易所」「錢包間轉帳」只描述資金路徑，不代表買賣意圖或成交。"],
  },
  es: {
    home: "Inicio", data: "Datos", updated: "Actualizado", source: "Fuente", unavailableTitle: "Radar no disponible", unavailable: "La caché en vivo aún no generó filas utilizables. La página se mantiene legible y se actualizará con la próxima instantánea pública.", openData: "Abrir JSON", related: "Datos relacionados", viewVenue: "Revisar venue", verifyVenue: "Verificar acceso", unknown: "unknown",
    longShortTitle: "Radar long/short", longShortLead: "Mercados perpetuos principales por ratio long/short de cuentas, ratio de top traders, interés abierto y cambio OI de 24h.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios y endpoints de open interest.", longShortSummary: "Los ratios muestran la presión de posicionamiento de cada exchange. El interés abierto indica unidad explícita.", longShortExplainer: ["Los ratios comparan cuentas largas con cortas; una lectura alta puede mostrar exposición concurrida, no dirección de precio.", "La unidad de OI y la sparkline de 24h ayudan a separar acumulación nueva de una ratio atrasada."],
    whalesTitle: "Radar de transferencias whale", whalesLead: "Transferencias grandes de BTC, ETH, USDT y USDC desde fuentes públicas, con etiquetas de exchange solo cuando hay fuente.", whalesSourceLine: "Fuentes públicas BTC/EVM y listas mantenidas de etiquetas de exchange; lo desconocido queda unknown.", whalesSummary: "Una transferencia a un exchange no prueba una venta. La dirección describe la ruta observada.", whalesExplainer: ["El radar no adivina propietarios de wallets.", "Usa la dirección como señal de revisión, no como intención o ejecución."],
  },
  "pt-BR": {
    home: "Início", data: "Dados", updated: "Atualizado", source: "Fonte", unavailableTitle: "Radar indisponível", unavailable: "O cache ao vivo ainda não gerou linhas utilizáveis. A página continua legível e atualizará no próximo snapshot público.", openData: "Abrir JSON", related: "Dados relacionados", viewVenue: "Ver venue", verifyVenue: "Verificar acesso", unknown: "unknown",
    longShortTitle: "Radar long/short", longShortLead: "Principais perpétuos por razão long/short de contas, top traders, open interest e variação OI de 24h.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios e endpoints de open interest.", longShortSummary: "As razões mostram a pressão de posicionamento de cada corretora. O open interest mostra a unidade explicitamente.", longShortExplainer: ["Razões comparam contas long e short; leitura alta pode indicar exposição cheia, não direção de preço.", "Unidade de OI e sparkline de 24h separam acúmulo novo de ratio defasado."],
    whalesTitle: "Radar de transferências whale", whalesLead: "Grandes transferências BTC, ETH, USDT e USDC de fontes públicas, com labels de exchange só quando há fonte.", whalesSourceLine: "Fontes públicas BTC/EVM e listas mantidas de labels de exchange; desconhecidos ficam unknown.", whalesSummary: "Transferir para exchange não prova venda. A direção descreve apenas o caminho observado.", whalesExplainer: ["O radar não adivinha donos de carteiras.", "Use direção como alerta de risco, não como intenção ou execução."],
  },
  fr: {
    home: "Accueil", data: "Données", updated: "Mis à jour", source: "Source", unavailableTitle: "Radar indisponible", unavailable: "Le cache live n'a pas encore produit de lignes utilisables. La page reste lisible et se rafraîchira au prochain instantané public.", openData: "Ouvrir JSON", related: "Données liées", viewVenue: "Vérifier la plateforme", verifyVenue: "Vérifier l'accès", unknown: "unknown",
    longShortTitle: "Radar long/short", longShortLead: "Principaux perpétuels par ratio comptes long/short, top traders, open interest et variation OI 24h.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios et endpoints d'open interest.", longShortSummary: "Les ratios indiquent la pression de positionnement publiée par chaque plateforme. L'unité d'OI est explicite.", longShortExplainer: ["Les ratios comparent comptes longs et shorts; une valeur élevée peut signaler une exposition concentrée, pas une direction de prix.", "L'unité OI et la sparkline 24h distinguent accumulation récente et ratio retardé."],
    whalesTitle: "Radar des transferts whale", whalesLead: "Gros transferts BTC, ETH, USDT et USDC issus de sources publiques, avec labels d'exchange uniquement sourcés.", whalesSourceLine: "Sources publiques BTC/EVM et listes maintenues de labels d'exchange; l'inconnu reste unknown.", whalesSummary: "Un transfert vers un exchange ne prouve pas une vente. La direction décrit seulement le chemin observé.", whalesExplainer: ["Le radar ne devine jamais les propriétaires.", "La direction est un signal de vérification, pas une intention."],
  },
  de: {
    home: "Start", data: "Daten", updated: "Aktualisiert", source: "Quelle", unavailableTitle: "Radar nicht verfügbar", unavailable: "Der Live-Cache hat noch keine nutzbaren Zeilen erzeugt. Die Seite bleibt lesbar und aktualisiert sich mit dem nächsten öffentlichen Snapshot.", openData: "JSON öffnen", related: "Verwandte Daten", viewVenue: "Venue prüfen", verifyVenue: "Zugang prüfen", unknown: "unknown",
    longShortTitle: "Long/Short-Radar", longShortLead: "Top-Perpetual-Märkte nach Konto-Long/Short, Top-Trader-Ratio, Open Interest und 24h-OI-Veränderung.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios und Open-Interest-Endpunkte.", longShortSummary: "Ratios zeigen den gemeldeten Positionsdruck je Börse. Open Interest wird mit Einheit gekennzeichnet.", longShortExplainer: ["Ratios vergleichen Long- und Short-Konten; hohe Werte können dichte Exposition zeigen, aber keine Preisrichtung beweisen.", "OI-Einheit und 24h-Sparkline trennen frischen Aufbau von verzögerten Ratios."],
    whalesTitle: "Whale-Transfer-Radar", whalesLead: "Große BTC-, ETH-, USDT- und USDC-Transfers aus öffentlichen Quellen mit Exchange-Labels nur bei Quelle.", whalesSourceLine: "Öffentliche BTC/EVM-Quellen und gepflegte Exchange-Label-Listen; Unbekanntes bleibt unknown.", whalesSummary: "Transfer zur Exchange ist kein Verkaufsbeweis. Die Richtung beschreibt nur den beobachteten Pfad.", whalesExplainer: ["Der Radar errät keine Wallet-Besitzer.", "Richtung ist ein Prüfhinweis, keine Absicht."],
  },
  it: {
    home: "Home", data: "Dati", updated: "Aggiornato", source: "Fonte", unavailableTitle: "Radar non disponibile", unavailable: "La cache live non ha ancora prodotto righe utilizzabili. La pagina resta leggibile e si aggiornerà al prossimo snapshot pubblico.", openData: "Apri JSON", related: "Dati correlati", viewVenue: "Controlla venue", verifyVenue: "Verifica accesso", unknown: "unknown",
    longShortTitle: "Radar long/short", longShortLead: "Principali perpetui per ratio account long/short, top trader, open interest e variazione OI 24h.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios ed endpoint open interest.", longShortSummary: "I ratio mostrano la pressione di posizione riportata da ogni exchange. L'OI indica sempre l'unità.", longShortExplainer: ["I ratio confrontano account long e short; un valore alto può indicare esposizione affollata, non direzione.", "Unità OI e sparkline 24h separano accumulo fresco da ratio in ritardo."],
    whalesTitle: "Radar trasferimenti whale", whalesLead: "Grandi trasferimenti BTC, ETH, USDT e USDC da fonti pubbliche, con label exchange solo se supportate.", whalesSourceLine: "Fonti pubbliche BTC/EVM e liste label exchange mantenute; gli ignoti restano unknown.", whalesSummary: "Un trasferimento verso exchange non prova una vendita. La direzione descrive solo il percorso.", whalesExplainer: ["Il radar non indovina proprietari di wallet.", "La direzione è un segnale di verifica, non intenzione."],
  },
  ja: {
    home: "ホーム", data: "データ", updated: "更新", source: "ソース", unavailableTitle: "レーダーは利用できません", unavailable: "ライブキャッシュに利用可能な行がまだありません。次の公開スナップショットで更新されます。", openData: "JSONを開く", related: "関連データ", viewVenue: "取引所を確認", verifyVenue: "アクセス確認", unknown: "unknown",
    longShortTitle: "ロング/ショートレーダー", longShortLead: "主要パーペチュアルを口座L/S比、トップトレーダー比、建玉、24h OI変化で表示します。", longShortSourceLine: "Binance futures data、OKX Rubik stats、Bybit account ratios、各建玉エンドポイント。", longShortSummary: "比率は各取引所が公表するポジション圧力です。建玉は単位を明示します。", longShortExplainer: ["比率はロング口座とショート口座を比較します。高い値は混雑を示す場合がありますが価格方向の証明ではありません。", "OI単位と24hスパークラインで新規の積み上がりを見分けます。"],
    whalesTitle: "ホエール送金レーダー", whalesLead: "公開ソースから大口BTC/ETH/USDT/USDC送金を表示し、根拠がある場合のみ取引所ラベルを付けます。", whalesSourceLine: "公開BTC/EVMソースと管理された取引所ラベルリスト。不明はunknownのままです。", whalesSummary: "取引所への送金は売却の証明ではありません。方向は観測された経路のみです。", whalesExplainer: ["ウォレット所有者は推測しません。", "方向は確認の手掛かりであり、意図ではありません。"],
  },
  ko: {
    home: "홈", data: "데이터", updated: "업데이트", source: "출처", unavailableTitle: "레이더 사용 불가", unavailable: "라이브 캐시가 아직 사용 가능한 행을 만들지 않았습니다. 다음 공개 스냅샷에서 새로고침됩니다.", openData: "JSON 열기", related: "관련 데이터", viewVenue: "거래소 확인", verifyVenue: "접근 확인", unknown: "unknown",
    longShortTitle: "롱/숏 레이더", longShortLead: "주요 무기한 시장을 계정 롱/숏 비율, 상위 트레이더 비율, 미결제약정, 24h OI 변화로 정렬합니다.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios 및 OI 엔드포인트.", longShortSummary: "비율은 각 거래소가 공개한 포지션 압력입니다. OI 단위를 명시합니다.", longShortExplainer: ["비율은 롱 계정과 숏 계정을 비교합니다. 높은 값은 혼잡을 뜻할 수 있지만 가격 방향 증명은 아닙니다.", "OI 단위와 24h 스파크라인으로 신규 증가를 구분합니다."],
    whalesTitle: "웨일 전송 레이더", whalesLead: "공개 소스의 대형 BTC, ETH, USDT, USDC 전송을 표시하고 근거 있는 경우에만 거래소 라벨을 붙입니다.", whalesSourceLine: "공개 BTC/EVM 소스와 관리되는 거래소 라벨 목록. 미상은 unknown으로 둡니다.", whalesSummary: "거래소 입금은 매도 증거가 아닙니다. 방향은 관측된 주소 경로입니다.", whalesExplainer: ["지갑 소유자를 추측하지 않습니다.", "방향은 위험 점검 신호이지 의도나 체결이 아닙니다."],
  },
  ru: {
    home: "Главная", data: "Данные", updated: "Обновлено", source: "Источник", unavailableTitle: "Радар недоступен", unavailable: "Живой кеш еще не дал usable строк. Страница обновится при следующем публичном снимке.", openData: "Открыть JSON", related: "Связанные данные", viewVenue: "Проверить площадку", verifyVenue: "Проверить доступ", unknown: "unknown",
    longShortTitle: "Радар long/short", longShortLead: "Топ perpetual рынков по account long/short, top trader ratio, open interest и изменению OI за 24ч.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios и endpoints open interest.", longShortSummary: "Ratios показывают давление позиционирования по каждой бирже. OI показывает единицу.", longShortExplainer: ["Ratios сравнивают long и short аккаунты; высокий показатель не доказывает направление цены.", "Единица OI и 24ч sparkline помогают отделить новый рост от запаздывающего ratio."],
    whalesTitle: "Радар whale-переводов", whalesLead: "Крупные переводы BTC, ETH, USDT и USDC из публичных источников с exchange labels только при наличии источника.", whalesSourceLine: "Публичные BTC/EVM источники и поддерживаемые списки labels; unknown остается unknown.", whalesSummary: "Перевод на биржу не доказывает продажу. Direction описывает только наблюдаемый путь.", whalesExplainer: ["Радар не угадывает владельцев кошельков.", "Direction — сигнал проверки, не намерение."],
  },
  tr: {
    home: "Ana sayfa", data: "Veri", updated: "Güncellendi", source: "Kaynak", unavailableTitle: "Radar kullanılamıyor", unavailable: "Canlı önbellek henüz kullanılabilir satır üretmedi. Sonraki açık snapshot geldiğinde yenilenir.", openData: "JSON aç", related: "İlgili veri", viewVenue: "Borsayı kontrol et", verifyVenue: "Erişimi doğrula", unknown: "unknown",
    longShortTitle: "Long/short radarı", longShortLead: "Başlıca perpetual piyasalar: hesap long/short oranı, top trader oranı, açık pozisyon ve 24s OI değişimi.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios ve OI uçları.", longShortSummary: "Oranlar her borsanın bildirdiği pozisyon baskısını gösterir. OI birimi açık yazılır.", longShortExplainer: ["Oranlar long ve short hesapları karşılaştırır; yüksek değer fiyat yönünü kanıtlamaz.", "OI birimi ve 24s sparkline yeni birikimi ayırır."],
    whalesTitle: "Whale transfer radarı", whalesLead: "Açık kaynaklardan büyük BTC, ETH, USDT ve USDC transferleri; exchange etiketi yalnızca kaynaklıysa.", whalesSourceLine: "Açık BTC/EVM kaynakları ve korunan exchange label listeleri; bilinmeyen unknown kalır.", whalesSummary: "Exchange'e transfer satış kanıtı değildir. Yön yalnızca gözlenen yolu anlatır.", whalesExplainer: ["Radar cüzdan sahibi tahmin etmez.", "Yön bir kontrol sinyalidir, niyet değildir."],
  },
  id: {
    home: "Beranda", data: "Data", updated: "Diperbarui", source: "Sumber", unavailableTitle: "Radar tidak tersedia", unavailable: "Cache live belum menghasilkan baris yang bisa dipakai. Halaman akan diperbarui pada snapshot publik berikutnya.", openData: "Buka JSON", related: "Data terkait", viewVenue: "Cek venue", verifyVenue: "Verifikasi akses", unknown: "unknown",
    longShortTitle: "Radar long/short", longShortLead: "Pasar perpetual utama berdasarkan rasio akun long/short, top trader, open interest, dan perubahan OI 24 jam.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios dan endpoint OI.", longShortSummary: "Rasio menunjukkan tekanan posisi yang dilaporkan tiap bursa. Unit OI ditampilkan jelas.", longShortExplainer: ["Rasio membandingkan akun long dan short; angka tinggi tidak membuktikan arah harga.", "Unit OI dan sparkline 24 jam membantu melihat buildup baru."],
    whalesTitle: "Radar transfer whale", whalesLead: "Transfer besar BTC, ETH, USDT dan USDC dari sumber publik, dengan label exchange hanya jika bersumber.", whalesSourceLine: "Sumber BTC/EVM publik dan daftar label exchange; unknown tetap unknown.", whalesSummary: "Transfer ke exchange bukan bukti jual. Arah hanya jalur alamat yang terlihat.", whalesExplainer: ["Radar tidak menebak pemilik wallet.", "Arah adalah sinyal cek risiko, bukan niat."],
  },
  vi: {
    home: "Trang chủ", data: "Dữ liệu", updated: "Cập nhật", source: "Nguồn", unavailableTitle: "Radar chưa khả dụng", unavailable: "Cache trực tiếp chưa có dòng dùng được. Trang sẽ làm mới khi snapshot công khai tiếp theo đến.", openData: "Mở JSON", related: "Dữ liệu liên quan", viewVenue: "Kiểm tra sàn", verifyVenue: "Xác minh truy cập", unknown: "unknown",
    longShortTitle: "Radar long/short", longShortLead: "Thị trường perpetual hàng đầu theo tỷ lệ tài khoản long/short, top trader, OI và thay đổi OI 24h.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios và endpoint OI.", longShortSummary: "Tỷ lệ cho thấy áp lực vị thế do từng sàn công bố. OI ghi rõ đơn vị.", longShortExplainer: ["Tỷ lệ so sánh tài khoản long và short; số cao không chứng minh hướng giá.", "Đơn vị OI và sparkline 24h giúp nhận ra tích lũy mới."],
    whalesTitle: "Radar chuyển whale", whalesLead: "Chuyển khoản lớn BTC, ETH, USDT và USDC từ nguồn công khai, chỉ gắn nhãn sàn khi có nguồn.", whalesSourceLine: "Nguồn BTC/EVM công khai và danh sách nhãn sàn; unknown giữ unknown.", whalesSummary: "Chuyển vào sàn không chứng minh bán. Direction chỉ mô tả đường địa chỉ.", whalesExplainer: ["Radar không đoán chủ ví.", "Direction là tín hiệu kiểm tra rủi ro, không phải ý định."],
  },
  ar: {
    home: "الرئيسية", data: "البيانات", updated: "تحديث", source: "المصدر", unavailableTitle: "الرادار غير متاح", unavailable: "لم ينتج التخزين المؤقت المباشر صفوفا قابلة للاستخدام بعد. ستتحدث الصفحة عند وصول اللقطة العامة التالية.", openData: "فتح JSON", related: "بيانات ذات صلة", viewVenue: "تحقق من المنصة", verifyVenue: "تحقق من الوصول", unknown: "unknown",
    longShortTitle: "رادار long/short", longShortLead: "أسواق العقود الدائمة حسب نسبة الحسابات long/short ونسبة كبار المتداولين والفائدة المفتوحة وتغير OI خلال 24 ساعة.", longShortSourceLine: "Binance futures data وOKX Rubik stats وBybit account ratios ونقاط OI.", longShortSummary: "النسب تعكس ضغط التموضع كما تنشره كل منصة. وحدة OI تظهر بوضوح.", longShortExplainer: ["النسب تقارن حسابات long وshort؛ القراءة العالية لا تثبت اتجاه السعر.", "وحدة OI والخط المصغر 24 ساعة تساعد على تمييز البناء الجديد."],
    whalesTitle: "رادار تحويلات whale", whalesLead: "تحويلات كبيرة BTC وETH وUSDT وUSDC من مصادر عامة مع تسميات exchange عند وجود مصدر فقط.", whalesSourceLine: "مصادر BTC/EVM عامة وقوائم تسميات exchange؛ المجهول يبقى unknown.", whalesSummary: "التحويل إلى exchange ليس دليلا على البيع. الاتجاه يصف مسار العنوان المرصود فقط.", whalesExplainer: ["الرادار لا يخمن مالك المحفظة.", "الاتجاه إشارة تحقق، وليس نية أو تنفيذا."],
  },
  ur: {
    home: "ہوم", data: "ڈیٹا", updated: "اپ ڈیٹ", source: "ماخذ", unavailableTitle: "ریڈار دستیاب نہیں", unavailable: "لائیو کیش نے ابھی قابل استعمال قطاریں نہیں بنائیں۔ اگلے عوامی snapshot پر صفحہ تازہ ہو گا۔", openData: "JSON کھولیں", related: "متعلقہ ڈیٹا", viewVenue: "Venue چیک کریں", verifyVenue: "رسائی verify کریں", unknown: "unknown",
    longShortTitle: "Long/short radar", longShortLead: "اہم perpetual مارکیٹس account long/short ratio، top trader ratio، open interest اور 24h OI change کے ساتھ۔", longShortSourceLine: "Binance futures data، OKX Rubik stats، Bybit account ratios اور OI endpoints۔", longShortSummary: "Ratios ہر venue کا positioning pressure دکھاتے ہیں۔ OI unit صاف لکھی جاتی ہے۔", longShortExplainer: ["Ratios long اور short accounts کا موازنہ کرتے ہیں؛ high reading price direction ثابت نہیں کرتی۔", "OI unit اور 24h sparkline نئی build-up کو الگ دکھاتے ہیں۔"],
    whalesTitle: "Whale transfer radar", whalesLead: "Public sources سے BTC، ETH، USDT اور USDC کی بڑی transfers؛ exchange labels صرف source ہونے پر۔", whalesSourceLine: "Public BTC/EVM sources اور maintained exchange-label lists؛ unknown unknown رہتا ہے۔", whalesSummary: "Exchange کو transfer sale کا proof نہیں۔ Direction صرف observed address path ہے۔", whalesExplainer: ["Radar wallet owners guess نہیں کرتا۔", "Direction risk prompt ہے، intent نہیں۔"],
  },
  uk: {
    home: "Головна", data: "Дані", updated: "Оновлено", source: "Джерело", unavailableTitle: "Радар недоступний", unavailable: "Live cache ще не створив придатні рядки. Сторінка оновиться з наступним публічним snapshot.", openData: "Відкрити JSON", related: "Пов'язані дані", viewVenue: "Перевірити майданчик", verifyVenue: "Перевірити доступ", unknown: "unknown",
    longShortTitle: "Радар long/short", longShortLead: "Провідні perpetual ринки за account long/short, top trader ratio, open interest і зміною OI за 24 год.", longShortSourceLine: "Binance futures data, OKX Rubik stats, Bybit account ratios та OI endpoints.", longShortSummary: "Ratios показують тиск позицій за даними кожної біржі. OI має явну одиницю.", longShortExplainer: ["Ratios порівнюють long і short accounts; високий показник не доводить напрям ціни.", "Одиниця OI і 24h sparkline відділяють нове нарощування."],
    whalesTitle: "Радар whale-переказів", whalesLead: "Великі перекази BTC, ETH, USDT і USDC з публічних джерел, з exchange labels лише за наявності джерела.", whalesSourceLine: "Публічні BTC/EVM джерела та підтримувані label lists; unknown залишається unknown.", whalesSummary: "Переказ на exchange не доводить продаж. Direction описує лише спостережений шлях.", whalesExplainer: ["Радар не вгадує власників wallets.", "Direction є сигналом перевірки, не наміром."],
  },
});

const FALLBACK_COLUMNS = COPY.en.columns;
const FALLBACK_DIRECTIONS = COPY.en.directions;

export function radarCopy(locale = "en") {
  const key = COPY[locale] ? locale : String(locale || "").startsWith("zh") ? "zh-Hans" : "en";
  const local = COPY[key] || COPY.en;
  const ui = RADAR_UI_COPY[key] || RADAR_UI_COPY.en;
  return {
    ...COPY.en,
    ...RADAR_UI_COPY.en,
    ...local,
    ...ui,
    columns: { ...FALLBACK_COLUMNS, ...(local.columns || {}), ...(ui.columns || {}) },
    directions: { ...FALLBACK_DIRECTIONS, ...(local.directions || {}), ...(ui.directions || {}) },
    statuses: { ...RADAR_UI_COPY.en.statuses, ...(ui.statuses || {}) },
  };
}

export const numberOrNull = (value) => {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

export const isoOrNull = (value) => {
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

const firstNumber = (...values) => {
  for (const value of values) {
    const n = numberOrNull(value);
    if (n != null) return n;
  }
  return null;
};

const textOr = (value, fallback = "") => (typeof value === "string" && value.trim() ? value.trim() : fallback);

const sourceLabel = (source) => {
  if (typeof source === "string") return source.trim();
  if (!source || typeof source !== "object") return "";
  return textOr(source.name, textOr(source.label, textOr(source.url, "")));
};

export function safeHttpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function normalizeRadarEnvelope(input) {
  if (!input || typeof input !== "object") return { rows: [], updatedAt: null, status: "unavailable", sources: [] };
  const rows = Array.isArray(input.rows) ? input.rows : [];
  const sources = Array.isArray(input.sources) ? input.sources.map(sourceLabel).filter(Boolean) : [];
  return {
    rows,
    updatedAt: isoOrNull(input.updatedAt) || isoOrNull(input.generatedAt),
    status: textOr(input.status, rows.length ? "ok" : "unavailable"),
    sources,
    limitations: Array.isArray(input.limitations) ? input.limitations.filter(v => typeof v === "string") : [],
  };
}

export function normalizeLongShort(input) {
  const envelope = normalizeRadarEnvelope(input);
  const rows = envelope.rows.map((row, index) => {
    const accountRatio = firstNumber(row.accountLongShortRatio, row.accountRatio, row.accounts?.longShortRatio, row.longShortRatio);
    const topTraderRatio = firstNumber(row.topTraderLongShortRatio, row.topTraderRatio, row.topTraders?.longShortRatio);
    const openInterestUsd = firstNumber(row.openInterestUsd, row.oiUsd, row.openInterest?.usd);
    const openInterestValue = firstNumber(row.openInterest, row.openInterestContracts, row.oi, row.openInterest?.value);
    const openInterestChange24hPct = firstNumber(row.openInterestChange24hPct, row.oiChange24hPct, row.oiChange24h, row.openInterest?.change24hPct);
    const sparkline24h = (Array.isArray(row.sparkline24h) ? row.sparkline24h : Array.isArray(row.openInterest?.sparkline24h) ? row.openInterest.sparkline24h : [])
      .map(numberOrNull)
      .filter((value) => value != null);
    return {
      id: textOr(row.id, `${textOr(row.venue, "venue")}-${textOr(row.symbol, index)}`).toLowerCase(),
      symbol: textOr(row.symbol, textOr(row.instId, "—")).toUpperCase(),
      venue: textOr(row.venue, textOr(row.exchange, "—")),
      accountRatio,
      topTraderRatio,
      openInterestUsd,
      openInterestValue,
      openInterestUnit: textOr(row.openInterestUnit, textOr(row.oiUnit, openInterestUsd != null ? "USD" : "contracts")),
      openInterestChange24hPct,
      sparkline24h,
      updatedAt: isoOrNull(row.updatedAt) || envelope.updatedAt,
      source: sourceLabel(row.source),
    };
  }).filter((row) => row.symbol !== "—" && row.venue !== "—");
  return { ...envelope, rows };
}

export function normalizeWhales(input) {
  const envelope = normalizeRadarEnvelope(input);
  const rows = envelope.rows.map((row, index) => {
    const direction = textOr(row.direction, "unknown").replaceAll("-", "_");
    return {
      id: textOr(row.id, textOr(row.txHash, `whale-${index}`)),
      asset: textOr(row.asset, textOr(row.symbol, "—")).toUpperCase(),
      chain: textOr(row.chain, ""),
      amount: firstNumber(row.amount, row.value, row.tokenAmount),
      amountUsd: firstNumber(row.amountUsd, row.usd, row.valueUsd),
      fromLabel: textOr(row.fromLabel, textOr(row.from?.label, "unknown")),
      toLabel: textOr(row.toLabel, textOr(row.to?.label, "unknown")),
      fromLabelSource: safeHttpsUrl(row.from?.source),
      toLabelSource: safeHttpsUrl(row.to?.source),
      fromAddress: textOr(row.fromAddress, textOr(row.from?.address, "")),
      toAddress: textOr(row.toAddress, textOr(row.to?.address, "")),
      direction: ["to_exchange", "from_exchange", "wallet_to_wallet"].includes(direction) ? direction : "unknown",
      time: isoOrNull(row.time) || isoOrNull(row.at) || isoOrNull(row.timestamp),
      txHash: textOr(row.txHash, textOr(row.hash, "")),
      explorerUrl: safeHttpsUrl(textOr(row.explorerUrl, textOr(row.url, ""))),
      source: sourceLabel(row.source),
    };
  }).filter((row) => row.asset !== "—");
  return { ...envelope, rows };
}

export function extractInitialRadar(initial, kind) {
  if (!initial || typeof initial !== "object") return null;
  if (kind === "longShort") return initial.longShort || initial.longshort || initial.long_short || (Array.isArray(initial.rows) ? initial : null);
  if (kind === "whales") return initial.whales || (Array.isArray(initial.rows) ? initial : null);
  return null;
}

function sortableValue(value, key) {
  const n = numberOrNull(value);
  if (n != null && !["time", "updatedAt"].includes(key)) return n;
  if (typeof value === "string") {
    const t = Date.parse(value);
    if (Number.isFinite(t) && (/At$/.test(key) || key === "time" || value.includes("T"))) return t;
  }
  return value == null || value === "" ? null : String(value);
}

export function sortRows(rows, key, direction = "desc") {
  const dir = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = sortableValue(a[key], key), bv = sortableValue(b[key], key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

export function limitRowsBySymbols(rows, maxSymbols = 30) {
  const symbols = new Set();
  const limited = [];
  for (const row of rows) {
    const symbol = row.symbol || row.asset || row.id;
    if (!symbols.has(symbol) && symbols.size >= maxSymbols) continue;
    symbols.add(symbol);
    limited.push(row);
  }
  return limited;
}

export function formatRatio(value) {
  const n = numberOrNull(value);
  if (n == null) return "—";
  return `${n.toFixed(n >= 10 ? 1 : 2)}x`;
}

export function formatPct(value) {
  const n = numberOrNull(value);
  if (n == null) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(Math.abs(n) >= 10 ? 1 : 2)}%`;
}

export function formatUsd(value) {
  const n = numberOrNull(value);
  if (n == null) return "—";
  const abs = Math.abs(n);
  const scaled = abs >= 1e9 ? [abs / 1e9, "B"] : abs >= 1e6 ? [abs / 1e6, "M"] : abs >= 1e3 ? [abs / 1e3, "K"] : [abs, ""];
  const digits = scaled[0] >= 100 ? 0 : scaled[0] >= 10 ? 1 : 2;
  return `${n < 0 ? "−" : ""}$${scaled[0].toFixed(digits)}${scaled[1]}`;
}

export function formatAmount(value, asset = "") {
  const n = numberOrNull(value);
  if (n == null) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 10 ? 2 : 4;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: digits })}${asset ? ` ${asset}` : ""}`;
}

export function formatOpenInterest(row) {
  if (row.openInterestUsd != null) return `${formatUsd(row.openInterestUsd)} ${row.openInterestUnit || "USD"}`;
  if (row.openInterestValue == null) return "—";
  return `${formatAmount(row.openInterestValue)} ${row.openInterestUnit || "contracts"}`.trim();
}

export function formatUtc(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  // Site clock is Singapore Time (SGT); the name is kept for existing callers.
  return formatSgt(iso, "en", "stamp");
}

export function venueGoHref(slug, src, locale = "en", market) {
  const cta = publicCtaForVenue(slug, locale, market);
  if (!cta?.hasReferral || !cta.routeAvailable) return null;
  // /go is locale-neutral: keep src (and the display locale) in the query so the click is attributed.
  const params = new URLSearchParams({ src });
  if (locale && locale !== "en") params.set("locale", locale);
  return `/go/${encodeURIComponent(slug)}?${params.toString()}`;
}

