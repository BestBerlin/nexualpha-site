import { FACTBOOK_REGISTRY, FACTBOOK_SLUGS } from "./factbook-registry.js";
import { feeFact, discountFact, factsForVenue, feePair } from "./exchange-facts.js";
import { TOPIC_GUIDES, TOPIC_SLUGS } from "./topic-guides-data.js";

export const TOPIC_HUB_PATH = "/topics";
export const FACTBOOK_HUB_PATH = "/factbook";

// Factbook row facts and topic hub records in every UI locale (links-l10n lane 2026-10-11, scorecard M1). The fee
// figures, dates and tokens are data from exchange-facts.js; only the wording around them is localized. The topic
// records translate the English topic name, title and summary of topic-guides-data.js (the guides themselves stay in
// their reviewed language). Strings for ru, id, vi, ar, tr, ur and uk are marked for native review.
const FACTBOOK_ROW_COPY = {
  en: { spot: (f) => `spot ${f} (maker / taker)`, spotNo: "spot fees not yet checked", perp: (f) => `perpetual ${f}`, perpNo: "perpetual fees not yet checked", discount: (n, t) => `${n}% off spot fees paid in ${t}`, title: (n) => `${n} Factbook`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  "zh-Hans": { spot: (f) => `现货 ${f}（挂单 / 吃单）`, spotNo: "现货费率尚未核对", perp: (f) => `永续 ${f}`, perpNo: "永续费率尚未核对", discount: (n, t) => `用 ${t} 支付现货手续费可减 ${n}%`, title: (n) => `${n} 事实库`, row: (n, parts) => `${parts.join("；")}。` },
  "zh-Hant": { spot: (f) => `現貨 ${f}（掛單 / 吃單）`, spotNo: "現貨費率尚未核對", perp: (f) => `永續 ${f}`, perpNo: "永續費率尚未核對", discount: (n, t) => `用 ${t} 支付現貨手續費可減 ${n}%`, title: (n) => `${n} 事實庫`, row: (n, parts) => `${parts.join("；")}。` },
  es: { spot: (f) => `contado ${f} (maker / taker)`, spotNo: "comisiones de contado aún sin revisar", perp: (f) => `perpetuos ${f}`, perpNo: "comisiones de perpetuos aún sin revisar", discount: (n, t) => `${n}% de descuento en comisiones de contado pagadas en ${t}`, title: (n) => `Ficha de ${n}`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  "pt-BR": { spot: (f) => `à vista ${f} (maker / taker)`, spotNo: "taxas à vista ainda não verificadas", perp: (f) => `perpétuos ${f}`, perpNo: "taxas de perpétuos ainda não verificadas", discount: (n, t) => `${n}% de desconto nas taxas à vista pagas em ${t}`, title: (n) => `Ficha da ${n}`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  fr: { spot: (f) => `comptant ${f} (maker / taker)`, spotNo: "frais au comptant pas encore vérifiés", perp: (f) => `perpétuels ${f}`, perpNo: "frais des perpétuels pas encore vérifiés", discount: (n, t) => `${n} % de remise sur les frais au comptant payés en ${t}`, title: (n) => `Fiche ${n}`, row: (n, parts) => `${n} : ${parts.join(" ; ")}.` },
  de: { spot: (f) => `Spot ${f} (Maker / Taker)`, spotNo: "Spot-Gebühren noch nicht geprüft", perp: (f) => `Perpetuals ${f}`, perpNo: "Perpetual-Gebühren noch nicht geprüft", discount: (n, t) => `${n} % Rabatt auf Spot-Gebühren bei Zahlung in ${t}`, title: (n) => `${n}-Datenblatt`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  it: { spot: (f) => `a pronti ${f} (maker / taker)`, spotNo: "commissioni a pronti non ancora verificate", perp: (f) => `perpetui ${f}`, perpNo: "commissioni sui perpetui non ancora verificate", discount: (n, t) => `${n}% di sconto sulle commissioni a pronti pagate in ${t}`, title: (n) => `Scheda ${n}`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  ja: { spot: (f) => `現物 ${f}（メイカー / テイカー）`, spotNo: "現物手数料は未確認", perp: (f) => `無期限先物 ${f}`, perpNo: "無期限先物の手数料は未確認", discount: (n, t) => `${t} で現物手数料を支払うと ${n}% 割引`, title: (n) => `${n} ファクトブック`, row: (n, parts) => `${n}：${parts.join("、")}。` },
  ko: { spot: (f) => `현물 ${f}(메이커 / 테이커)`, spotNo: "현물 수수료 미확인", perp: (f) => `무기한 선물 ${f}`, perpNo: "무기한 선물 수수료 미확인", discount: (n, t) => `${t}(으)로 현물 수수료 결제 시 ${n}% 할인`, title: (n) => `${n} 팩트북`, row: (n, parts) => `${n}: ${parts.join(", ")}.` },
  // l10n: needs native review (ru)
  ru: { spot: (f) => `спот ${f} (мейкер / тейкер)`, spotNo: "комиссии спота ещё не проверены", perp: (f) => `бессрочные контракты ${f}`, perpNo: "комиссии бессрочных контрактов ещё не проверены", discount: (n, t) => `скидка ${n}% на комиссии спота при оплате в ${t}`, title: (n) => `Справка: ${n}`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  // l10n: needs native review (tr)
  tr: { spot: (f) => `spot ${f} (yapıcı / alıcı)`, spotNo: "spot ücretleri henüz kontrol edilmedi", perp: (f) => `sürekli vadeli ${f}`, perpNo: "sürekli vadeli ücretleri henüz kontrol edilmedi", discount: (n, t) => `${t} ile ödenen spot ücretlerinde %${n} indirim`, title: (n) => `${n} bilgi kartı`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  // l10n: needs native review (id)
  id: { spot: (f) => `spot ${f} (pembuat / pengambil)`, spotNo: "biaya spot belum diperiksa", perp: (f) => `kontrak perpetual ${f}`, perpNo: "biaya kontrak perpetual belum diperiksa", discount: (n, t) => `diskon ${n}% untuk biaya spot yang dibayar dengan ${t}`, title: (n) => `Lembar fakta ${n}`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  // l10n: needs native review (vi)
  vi: { spot: (f) => `giao ngay ${f} (maker / taker)`, spotNo: "phí giao ngay chưa được kiểm tra", perp: (f) => `hợp đồng vĩnh cửu ${f}`, perpNo: "phí hợp đồng vĩnh cửu chưa được kiểm tra", discount: (n, t) => `giảm ${n}% phí giao ngay khi trả bằng ${t}`, title: (n) => `Hồ sơ dữ kiện ${n}`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  // l10n: needs native review
  ur: { spot: (f) => `اسپاٹ ${f} (میکر / ٹیکر)`, spotNo: "اسپاٹ فیس ابھی چیک نہیں", perp: (f) => `دائمی معاہدے ${f}`, perpNo: "دائمی معاہدوں کی فیس ابھی چیک نہیں", discount: (n, t) => `${t} سے ادا کی گئی اسپاٹ فیس پر ${n}% رعایت`, title: (n) => `${n} فیکٹ بک`, row: (n, parts) => `${n}: ${parts.join("؛ ")}۔` },
  // l10n: needs native review
  uk: { spot: (f) => `спот ${f} (мейкер / тейкер)`, spotNo: "спотові комісії ще не перевірені", perp: (f) => `безстрокові контракти ${f}`, perpNo: "комісії безстрокових контрактів ще не перевірені", discount: (n, t) => `${n}% знижки на спотові комісії при оплаті в ${t}`, title: (n) => `Фактбук ${n}`, row: (n, parts) => `${n}: ${parts.join("; ")}.` },
  // l10n: needs native review
  ur: {
    "meme-coins": ["میم کوائنز اور آن چین چیکس", "میم کوائن پلیٹ فارمز کا موازنہ: کنٹریکٹ، لیکویڈیٹی، اجازتیں اور اخراج", "MEXC، Gate.io اور Raydium کو مصنوعات تک رسائی، ٹوکن کنٹریکٹس، لیکویڈیٹی راستوں، شائع شدہ لاگت، اجازت کے خطرے اور اخراجی شرائط کے لحاظ سے موازنہ کریں۔ مہمات، فیس اور اکاؤنٹ اہلیت موجودہ سرکاری صفحات پر چیک کریں۔"],
    derivatives: ["مشتقات اور دائمی معاہدے", "کرپٹو دائمی معاہدہ پلیٹ فارمز کا موازنہ: فیس، فنڈنگ اور لیکویڈیشن", "مشتقات کے چار راستے ایک فہرست میں موازنہ کریں: مرکزی ایکسچینجز کے فیوچر اکاؤنٹس، والیٹ سے جڑے Perp DEX، آپشنز اور دائمی معاہدوں کے خصوصی پلیٹ فارمز، اور GMX طرز کے پول راستے۔ انتخاب سے پہلے شائع شدہ فیس، فنڈنگ، مارجن موڈ، لیکویڈیشن قواعد، اوریکل، ضمانت کی نقل و حرکت، ریجن اور دستخطی خطرہ چیک کریں۔"],
    "compliant-exchanges": ["فیاٹ رسائی اور ضابطہ جاتی چیکس", "فیاٹ رسائی اور اکاؤنٹ شرائط: HashKey، Kraken اور OKX", "HashKey، Kraken اور OKX کو سروس ادارے، علاقائی اور مصنوعات شرائط، بینک اکاؤنٹ ملکیت، فیاٹ راستوں اور موجودہ سرکاری قواعد کے لحاظ سے موازنہ کریں۔ پلیٹ فارم رجسٹریشن کو بینک جائزے سے الگ چیک کریں۔"],
    "no-kyc": ["KYC کے بغیر اور نجی ٹریڈنگ", "KYC کے بغیر اور سیلف کسٹڈی ٹریڈنگ کا موازنہ (2026): Hyperliquid، dYdX اور MEXC", "سیلف کسٹڈی پروٹوکول Hyperliquid اور dYdX کو مرکزی پلیٹ فارم MEXC کے ساتھ موازنہ کریں۔ شناختی چیکس اور رسائی قواعد ریجن، مصنوعات اور اکاؤنٹ مرحلے کے لحاظ سے بدلتے ہیں؛ کوئی بھی پلیٹ فارم استعمال کرنے سے پہلے موجودہ شرائط تصدیق کریں۔"],
  },
  // l10n: needs native review
  uk: {
    "meme-coins": ["Мемкоїни й ончейн-перевірки", "Порівняння платформ мемкоїнів: контракт, ліквідність, дозволи й вихід", "Порівнюйте MEXC, Gate.io і Raydium за доступом до продукту, токен-контрактами, маршрутами ліквідності, опублікованими витратами, ризиком дозволів і умовами виходу. Кампанії, комісії та придатність акаунта потрібно перевіряти на чинних офіційних сторінках."],
    derivatives: ["Деривативи й безстрокові контракти", "Порівняння платформ криптобезстрокових контрактів: комісії, фінансування й ліквідація", "Порівнюйте чотири маршрути деривативів в одному списку: ф'ючерсні акаунти на централізованих біржах, Perp DEX із підключеним гаманцем, спеціалізовані платформи для опціонів і безстрокових контрактів, а також маршрути пулів у стилі GMX. Перед вибором перевірте опубліковані комісії, фінансування, режим маржі, правила ліквідації, оракул, рух застави, регіон і ризик підпису."],
    "compliant-exchanges": ["Фіатний доступ і регуляторні перевірки", "Фіатний доступ та умови акаунта: HashKey, Kraken і OKX", "Порівнюйте HashKey, Kraken і OKX за юридичною особою сервісу, регіональними та продуктовими умовами, власником банківського рахунку, фіатними маршрутами й чинними офіційними правилами. Реєстрацію на платформі перевіряйте окремо від банківського розгляду."],
    "no-kyc": ["Без KYC і приватна торгівля", "Порівняння торгівлі без KYC і з самостійним зберіганням (2026): Hyperliquid, dYdX і MEXC", "Порівнюйте протоколи самостійного зберігання Hyperliquid і dYdX із централізованою платформою MEXC. Перевірки особи й правила доступу залежать від регіону, продукту та етапу акаунта; перед використанням будь-якої платформи підтвердьте чинні умови."],
  },
  // l10n: needs native review (ar)
  ar: { spot: (f) => `الفوري ${f} (صانع / آخذ)`, spotNo: "رسوم التداول الفوري لم تُراجع بعد", perp: (f) => `العقود الدائمة ${f}`, perpNo: "رسوم العقود الدائمة لم تُراجع بعد", discount: (n, t) => `خصم ${n}% على رسوم التداول الفوري عند الدفع بـ ${t}`, title: (n) => `سجل حقائق ${n}`, row: (n, parts) => `${n}: ${parts.join("؛ ")}.` },
};

// [name, title, description] per topic slug.
const TOPIC_HUB_RECORDS = {
  es: {
    "meme-coins": ["Memecoins y controles on-chain", "Comparativa de plataformas de memecoins: contrato, liquidez, aprobaciones y salida", "Compara MEXC, Gate.io y Raydium por acceso al producto, contratos de token, rutas de liquidez, costes publicados, riesgo de aprobaciones y condiciones de salida. Campañas, comisiones y requisitos de cuenta deben verificarse en las páginas oficiales actuales."],
    derivatives: ["Derivados y contratos perpetuos", "Comparativa de plataformas de perpetuos cripto: comisiones, funding y liquidación", "Compara cuatro rutas de derivados en una sola lista: cuentas de futuros en exchanges centralizados, Perp DEX conectados a wallet, plataformas especializadas en opciones y perpetuos, y rutas de pool al estilo GMX. Revisa comisiones publicadas, funding, modo de margen, reglas de liquidación, oráculo, movimiento de colateral, región y riesgo de firma antes de elegir."],
    "compliant-exchanges": ["Acceso fiat y controles regulatorios", "Acceso fiat y condiciones de cuenta: HashKey, Kraken y OKX", "Compara HashKey, Kraken y OKX por entidad de servicio, condiciones regionales y de producto, titularidad de la cuenta bancaria, vías fiat y reglas oficiales vigentes. Revisa el registro en la plataforma por separado de la revisión bancaria."],
    "no-kyc": ["Sin KYC y trading privado", "Comparativa de trading sin KYC y en autocustodia (2026): Hyperliquid, dYdX y MEXC", "Compara los protocolos de autocustodia Hyperliquid y dYdX con la plataforma centralizada MEXC. Los controles de identidad y las reglas de acceso varían según región, producto y etapa de la cuenta; verifica las condiciones vigentes antes de usar cualquier plataforma."],
  },
  "pt-BR": {
    "meme-coins": ["Memecoins e verificações on-chain", "Comparação de plataformas de memecoins: contrato, liquidez, aprovações e saída", "Compare MEXC, Gate.io e Raydium por acesso ao produto, contratos de token, rotas de liquidez, custos publicados, risco de aprovações e condições de saída. Campanhas, taxas e elegibilidade da conta devem ser verificadas nas páginas oficiais atuais."],
    derivatives: ["Derivativos e contratos perpétuos", "Comparação de plataformas de perpétuos cripto: taxas, funding e liquidação", "Compare quatro rotas de derivativos em uma única lista: contas de futuros em exchanges centralizadas, Perp DEXs conectadas à carteira, plataformas especializadas em opções e perpétuos e rotas de pool no estilo GMX. Verifique taxas publicadas, funding, modo de margem, regras de liquidação, oráculo, movimentação de colateral, região e risco de assinatura antes de escolher."],
    "compliant-exchanges": ["Acesso fiat e verificações regulatórias", "Acesso fiat e condições de conta: HashKey, Kraken e OKX", "Compare HashKey, Kraken e OKX por entidade de serviço, condições regionais e de produto, titularidade da conta bancária, trilhos fiat e regras oficiais atuais. Verifique o cadastro na plataforma separadamente da análise bancária."],
    "no-kyc": ["Sem KYC e negociação privada", "Comparação de negociação sem KYC e com autocustódia (2026): Hyperliquid, dYdX e MEXC", "Compare os protocolos de autocustódia Hyperliquid e dYdX com a plataforma centralizada MEXC. Verificações de identidade e regras de acesso variam por região, produto e estágio da conta; confirme as condições atuais antes de usar qualquer plataforma."],
  },
  fr: {
    "meme-coins": ["Memecoins et contrôles on-chain", "Comparatif des plateformes de memecoins : contrat, liquidité, autorisations et sortie", "Comparez MEXC, Gate.io et Raydium selon l’accès au produit, les contrats de jeton, les routes de liquidité, les coûts publiés, le risque d’autorisation et les conditions de sortie. Campagnes, frais et éligibilité du compte se vérifient sur les pages officielles actuelles."],
    derivatives: ["Dérivés et contrats perpétuels", "Comparatif des plateformes de perpétuels crypto : frais, financement et liquidation", "Comparez quatre voies de dérivés dans une seule liste : comptes de contrats à terme sur plateformes centralisées, Perp DEX reliés à un portefeuille, plateformes spécialisées en options et perpétuels, et pools de type GMX. Vérifiez frais publiés, financement, mode de marge, règles de liquidation, oracle, mouvements de collatéral, région et risque de signature avant de choisir."],
    "compliant-exchanges": ["Accès fiat et contrôles réglementaires", "Accès fiat et conditions de compte : HashKey, Kraken et OKX", "Comparez HashKey, Kraken et OKX selon l’entité de service, les conditions régionales et produit, la titularité du compte bancaire, les rails fiat et les règles officielles en vigueur. Vérifiez l’inscription sur la plateforme séparément de l’examen bancaire."],
    "no-kyc": ["Sans KYC et trading privé", "Comparatif du trading sans KYC et en auto-garde (2026) : Hyperliquid, dYdX et MEXC", "Comparez les protocoles en auto-garde Hyperliquid et dYdX avec la plateforme centralisée MEXC. Les contrôles d’identité et les règles d’accès varient selon la région, le produit et l’étape du compte ; vérifiez les conditions actuelles avant d’utiliser une plateforme."],
  },
  de: {
    "meme-coins": ["Memecoins und On-Chain-Prüfungen", "Memecoin-Plattformen im Vergleich: Vertrag, Liquidität, Freigaben und Ausstieg", "Vergleichen Sie MEXC, Gate.io und Raydium nach Produktzugang, Token-Verträgen, Liquiditätswegen, veröffentlichten Kosten, Freigaberisiko und Ausstiegsbedingungen. Aktionen, Gebühren und Kontoberechtigung sind auf den aktuellen offiziellen Seiten zu prüfen."],
    derivatives: ["Derivate und Perpetual-Kontrakte", "Krypto-Perpetual-Plattformen im Vergleich: Gebühren, Funding und Liquidation", "Vergleichen Sie vier Derivatewege in einer Liste: Futures-Konten bei zentralen Börsen, wallet-verbundene Perp-DEXs, auf Optionen und Perpetuals spezialisierte Plattformen und Pool-Modelle wie GMX. Prüfen Sie veröffentlichte Gebühren, Funding, Margin-Modus, Liquidationsregeln, Orakel, Sicherheitenbewegung, Region und Signaturrisiko, bevor Sie wählen."],
    "compliant-exchanges": ["Fiat-Zugang und regulatorische Prüfungen", "Fiat-Zugang und Kontobedingungen: HashKey, Kraken und OKX", "Vergleichen Sie HashKey, Kraken und OKX nach Dienstanbieter, regionalen und Produktbedingungen, Kontoinhaberschaft der Bank, Fiat-Wegen und aktuellen offiziellen Regeln. Prüfen Sie die Plattformregistrierung getrennt von der Bankprüfung."],
    "no-kyc": ["Ohne KYC und privater Handel", "Handel ohne KYC und in Selbstverwahrung im Vergleich (2026): Hyperliquid, dYdX und MEXC", "Vergleichen Sie die Selbstverwahrungs-Protokolle Hyperliquid und dYdX mit der zentralen Plattform MEXC. Identitätsprüfungen und Zugangsregeln unterscheiden sich nach Region, Produkt und Kontostufe; prüfen Sie die aktuellen Bedingungen vor der Nutzung."],
  },
  it: {
    "meme-coins": ["Memecoin e controlli on-chain", "Confronto tra piattaforme di memecoin: contratto, liquidità, autorizzazioni e uscita", "Confronta MEXC, Gate.io e Raydium per accesso al prodotto, contratti dei token, percorsi di liquidità, costi pubblicati, rischio di autorizzazione e condizioni di uscita. Campagne, commissioni e idoneità del conto vanno verificate sulle pagine ufficiali attuali."],
    derivatives: ["Derivati e contratti perpetui", "Confronto tra piattaforme di perpetui crypto: commissioni, funding e liquidazione", "Confronta quattro percorsi sui derivati in un’unica lista: conti futures su exchange centralizzati, Perp DEX collegati al wallet, piattaforme specializzate in opzioni e perpetui e pool in stile GMX. Verifica commissioni pubblicate, funding, modalità di margine, regole di liquidazione, oracolo, movimenti del collaterale, regione e rischio di firma prima di scegliere."],
    "compliant-exchanges": ["Accesso fiat e controlli normativi", "Accesso fiat e condizioni del conto: HashKey, Kraken e OKX", "Confronta HashKey, Kraken e OKX per entità di servizio, condizioni regionali e di prodotto, titolarità del conto bancario, canali fiat e regole ufficiali in vigore. Verifica la registrazione sulla piattaforma separatamente dalla verifica bancaria."],
    "no-kyc": ["Senza KYC e trading privato", "Confronto tra trading senza KYC e in autocustodia (2026): Hyperliquid, dYdX e MEXC", "Confronta i protocolli in autocustodia Hyperliquid e dYdX con la piattaforma centralizzata MEXC. Controlli d’identità e regole di accesso variano per regione, prodotto e fase del conto; verifica le condizioni attuali prima di usare una piattaforma."],
  },
  ja: {
    "meme-coins": ["ミームコインとオンチェーン取引の確認", "ミームコイン取引プラットフォーム比較：コントラクト、流動性、承認、出口", "MEXC、Gate.io、Raydium を、商品へのアクセス、トークンコントラクト、流動性ルート、公表コスト、承認リスク、出金条件で比較します。キャンペーン、手数料、口座の利用条件は最新の公式ページで確認してください。"],
    derivatives: ["デリバティブと無期限先物", "暗号資産無期限先物プラットフォーム比較：手数料、資金調達率、清算", "中央集権型取引所の先物口座、ウォレット接続型 Perp DEX、オプション・無期限先物の専門プラットフォーム、GMX 型プールの4つのルートを1つのチェックリストで比較します。選ぶ前に、公表手数料、資金調達率、証拠金モード、清算ルール、オラクル、担保の移動、地域、署名リスクを確認してください。"],
    "compliant-exchanges": ["法定通貨アクセスと規制の確認", "法定通貨アクセスと口座条件：HashKey、Kraken、OKX", "HashKey、Kraken、OKX を、サービス提供主体、地域・商品条件、銀行口座の名義、法定通貨の入出金経路、最新の公式ルールで比較します。プラットフォームの登録と銀行の審査は分けて確認してください。"],
    "no-kyc": ["本人確認なし・プライベート取引", "本人確認なし・セルフカストディ取引の比較（2026）：Hyperliquid、dYdX、MEXC", "セルフカストディ型の Hyperliquid、dYdX と中央集権型の MEXC を比較します。本人確認とアクセスのルールは地域、商品、口座の段階で異なるため、利用前に最新の条件を確認してください。"],
  },
  ko: {
    "meme-coins": ["밈코인과 온체인 거래 점검", "밈코인 거래 플랫폼 비교: 컨트랙트, 유동성, 승인, 출금 경로", "MEXC, Gate.io, Raydium을 상품 접근, 토큰 컨트랙트, 유동성 경로, 공개 비용, 승인 위험, 출금 조건으로 비교합니다. 이벤트, 수수료, 계정 자격은 현재 공식 페이지에서 확인해야 합니다."],
    derivatives: ["파생상품과 무기한 선물", "암호화폐 무기한 선물 플랫폼 비교: 수수료, 펀딩비, 청산", "중앙화 거래소 선물 계정, 지갑 연결형 Perp DEX, 옵션·무기한 선물 전문 플랫폼, GMX형 풀 경로의 네 가지를 하나의 체크리스트로 비교합니다. 선택하기 전에 공개 수수료, 펀딩비, 증거금 모드, 청산 규칙, 오라클, 담보 이동, 지역, 서명 위험을 확인하세요."],
    "compliant-exchanges": ["법정화폐 접근과 규제 점검", "법정화폐 접근과 계정 조건: HashKey, Kraken, OKX", "HashKey, Kraken, OKX를 서비스 법인, 지역·상품 조건, 은행 계좌 명의, 법정화폐 입출금 경로, 현재 공식 규정으로 비교합니다. 플랫폼 가입과 은행 심사는 따로 확인하세요."],
    "no-kyc": ["KYC 없는 거래와 프라이빗 거래", "KYC 없는 셀프 커스터디 거래 비교(2026): Hyperliquid, dYdX, MEXC", "셀프 커스터디 프로토콜 Hyperliquid, dYdX와 중앙화 플랫폼 MEXC를 비교합니다. 신원 확인과 접근 규칙은 지역, 상품, 계정 단계에 따라 다르므로 이용 전에 현재 조건을 확인하세요."],
  },
  // l10n: needs native review (ru)
  ru: {
    "meme-coins": ["Мемкоины и ончейн-проверки", "Сравнение платформ для мемкоинов: контракт, ликвидность, разрешения и вывод", "Сравните MEXC, Gate.io и Raydium по доступу к продукту, контрактам токенов, маршрутам ликвидности, опубликованным издержкам, риску разрешений и условиям вывода. Акции, комиссии и требования к аккаунту проверяйте на актуальных официальных страницах."],
    derivatives: ["Деривативы и бессрочные контракты", "Сравнение платформ бессрочных контрактов: комиссии, фандинг и ликвидации", "Сравните четыре маршрута для деривативов в одном списке: фьючерсные аккаунты на централизованных биржах, Perp DEX с подключением кошелька, площадки для опционов и бессрочных контрактов и пулы в стиле GMX. Перед выбором проверьте опубликованные комиссии, фандинг, режим маржи, правила ликвидации, оракул, движение залога, регион и риск подписи."],
    "compliant-exchanges": ["Доступ к фиату и регуляторные проверки", "Доступ к фиату и условия аккаунта: HashKey, Kraken и OKX", "Сравните HashKey, Kraken и OKX по юрлицу, региональным и продуктовым условиям, владельцу банковского счёта, фиатным каналам и действующим официальным правилам. Регистрацию на площадке проверяйте отдельно от банковской проверки."],
    "no-kyc": ["Без KYC и приватная торговля", "Сравнение торговли без KYC и с самостоятельным хранением (2026): Hyperliquid, dYdX и MEXC", "Сравните протоколы самостоятельного хранения Hyperliquid и dYdX с централизованной платформой MEXC. Проверка личности и правила доступа зависят от региона, продукта и этапа аккаунта; проверьте актуальные условия перед использованием."],
  },
  // l10n: needs native review (tr)
  tr: {
    "meme-coins": ["Meme coin'ler ve zincir üstü kontroller", "Meme coin platformu karşılaştırması: sözleşme, likidite, onaylar ve çıkış", "MEXC, Gate.io ve Raydium'u ürün erişimi, token sözleşmeleri, likidite yolları, yayımlanan maliyetler, onay riski ve çıkış koşullarına göre karşılaştırın. Kampanyalar, ücretler ve hesap uygunluğu güncel resmî sayfalarda doğrulanmalıdır."],
    derivatives: ["Türevler ve sürekli vadeli sözleşmeler", "Kripto sürekli vadeli platform karşılaştırması: ücretler, fonlama ve likidasyon", "Dört türev yolunu tek bir listede karşılaştırın: merkezi borsalardaki vadeli hesaplar, cüzdana bağlı Perp DEX'ler, opsiyon ve sürekli vadeli uzman platformlar ve GMX tarzı havuzlar. Seçmeden önce yayımlanan ücretleri, fonlamayı, marjin modunu, likidasyon kurallarını, oracle yolunu, teminat hareketini, bölgeyi ve imza riskini kontrol edin."],
    "compliant-exchanges": ["Fiat erişimi ve düzenleyici kontroller", "Fiat erişimi ve hesap koşulları: HashKey, Kraken ve OKX", "HashKey, Kraken ve OKX'i hizmet veren kuruluş, bölgesel ve ürün koşulları, banka hesabı sahipliği, fiat kanalları ve güncel resmî kurallara göre karşılaştırın. Platform kaydını banka incelemesinden ayrı kontrol edin."],
    "no-kyc": ["KYC'siz ve gizli işlem", "KYC'siz ve öz saklamalı işlem karşılaştırması (2026): Hyperliquid, dYdX ve MEXC", "Öz saklamalı protokoller Hyperliquid ve dYdX'i merkezi platform MEXC ile karşılaştırın. Kimlik kontrolleri ve erişim kuralları bölgeye, ürüne ve hesap aşamasına göre değişir; herhangi bir platformu kullanmadan önce güncel koşulları doğrulayın."],
  },
  // l10n: needs native review (id)
  id: {
    "meme-coins": ["Meme coin dan pemeriksaan on-chain", "Perbandingan platform meme coin: kontrak, likuiditas, persetujuan, dan jalur keluar", "Bandingkan MEXC, Gate.io, dan Raydium berdasarkan akses produk, kontrak token, jalur likuiditas, biaya yang dipublikasikan, risiko persetujuan, dan syarat keluar. Kampanye, biaya, dan kelayakan akun harus diverifikasi di halaman resmi terkini."],
    derivatives: ["Derivatif dan kontrak perpetual", "Perbandingan platform perpetual kripto: biaya, funding, dan likuidasi", "Bandingkan empat jalur derivatif dalam satu daftar: akun futures di bursa terpusat, Perp DEX yang terhubung ke dompet, platform khusus opsi dan perpetual, serta pool bergaya GMX. Periksa biaya yang dipublikasikan, funding, mode margin, aturan likuidasi, oracle, perpindahan jaminan, wilayah, dan risiko tanda tangan sebelum memilih."],
    "compliant-exchanges": ["Akses fiat dan pemeriksaan regulasi", "Akses fiat dan syarat akun: HashKey, Kraken, dan OKX", "Bandingkan HashKey, Kraken, dan OKX berdasarkan entitas layanan, syarat wilayah dan produk, kepemilikan rekening bank, jalur fiat, dan aturan resmi yang berlaku. Periksa pendaftaran platform terpisah dari peninjauan bank."],
    "no-kyc": ["Tanpa KYC dan perdagangan privat", "Perbandingan perdagangan tanpa KYC dan swakelola (2026): Hyperliquid, dYdX, dan MEXC", "Bandingkan protokol swakelola Hyperliquid dan dYdX dengan platform terpusat MEXC. Pemeriksaan identitas dan aturan akses berbeda menurut wilayah, produk, dan tahap akun; verifikasi syarat terkini sebelum memakai platform apa pun."],
  },
  // l10n: needs native review (vi)
  vi: {
    "meme-coins": ["Meme coin và kiểm tra on-chain", "So sánh nền tảng meme coin: hợp đồng, thanh khoản, phê duyệt và lối thoát", "So sánh MEXC, Gate.io và Raydium theo quyền truy cập sản phẩm, hợp đồng token, tuyến thanh khoản, chi phí công bố, rủi ro phê duyệt và điều kiện rút. Chương trình, phí và điều kiện tài khoản phải được xác minh trên trang chính thức hiện hành."],
    derivatives: ["Phái sinh và hợp đồng vĩnh cửu", "So sánh nền tảng hợp đồng vĩnh cửu: phí, funding và thanh lý", "So sánh bốn lộ trình phái sinh trong một danh sách: tài khoản futures trên sàn tập trung, Perp DEX kết nối ví, nền tảng chuyên quyền chọn và hợp đồng vĩnh cửu, và pool kiểu GMX. Kiểm tra phí công bố, funding, chế độ ký quỹ, quy tắc thanh lý, oracle, di chuyển tài sản thế chấp, khu vực và rủi ro chữ ký trước khi chọn."],
    "compliant-exchanges": ["Truy cập fiat và kiểm tra pháp lý", "Truy cập fiat và điều kiện tài khoản: HashKey, Kraken và OKX", "So sánh HashKey, Kraken và OKX theo pháp nhân cung cấp dịch vụ, điều kiện khu vực và sản phẩm, chủ tài khoản ngân hàng, kênh fiat và quy định chính thức hiện hành. Kiểm tra việc đăng ký nền tảng tách biệt với thẩm định của ngân hàng."],
    "no-kyc": ["Không KYC và giao dịch riêng tư", "So sánh giao dịch không KYC và tự lưu ký (2026): Hyperliquid, dYdX và MEXC", "So sánh các giao thức tự lưu ký Hyperliquid và dYdX với nền tảng tập trung MEXC. Việc xác minh danh tính và quy tắc truy cập khác nhau theo khu vực, sản phẩm và giai đoạn tài khoản; hãy xác minh điều kiện hiện hành trước khi dùng bất kỳ nền tảng nào."],
  },
  // l10n: needs native review
  ur: {
    "meme-coins": ["میم کوائنز اور آن چین چیکس", "میم کوائن پلیٹ فارمز کا موازنہ: کنٹریکٹ، لیکویڈیٹی، اجازتیں اور اخراج", "MEXC، Gate.io اور Raydium کو مصنوعات تک رسائی، ٹوکن کنٹریکٹس، لیکویڈیٹی راستوں، شائع شدہ لاگت، اجازت کے خطرے اور اخراجی شرائط کے لحاظ سے موازنہ کریں۔ مہمات، فیس اور اکاؤنٹ اہلیت موجودہ سرکاری صفحات پر چیک کریں۔"],
    derivatives: ["مشتقات اور دائمی معاہدے", "کرپٹو دائمی معاہدہ پلیٹ فارمز کا موازنہ: فیس، فنڈنگ اور لیکویڈیشن", "مشتقات کے چار راستے ایک فہرست میں موازنہ کریں: مرکزی ایکسچینجز کے فیوچر اکاؤنٹس، والیٹ سے جڑے Perp DEX، آپشنز اور دائمی معاہدوں کے خصوصی پلیٹ فارمز، اور GMX طرز کے پول راستے۔ انتخاب سے پہلے شائع شدہ فیس، فنڈنگ، مارجن موڈ، لیکویڈیشن قواعد، اوریکل، ضمانت کی نقل و حرکت، ریجن اور دستخطی خطرہ چیک کریں۔"],
    "compliant-exchanges": ["فیاٹ رسائی اور ضابطہ جاتی چیکس", "فیاٹ رسائی اور اکاؤنٹ شرائط: HashKey، Kraken اور OKX", "HashKey، Kraken اور OKX کو سروس ادارے، علاقائی اور مصنوعات شرائط، بینک اکاؤنٹ ملکیت، فیاٹ راستوں اور موجودہ سرکاری قواعد کے لحاظ سے موازنہ کریں۔ پلیٹ فارم رجسٹریشن کو بینک جائزے سے الگ چیک کریں۔"],
    "no-kyc": ["KYC کے بغیر اور نجی ٹریڈنگ", "KYC کے بغیر اور سیلف کسٹڈی ٹریڈنگ کا موازنہ (2026): Hyperliquid، dYdX اور MEXC", "سیلف کسٹڈی پروٹوکول Hyperliquid اور dYdX کو مرکزی پلیٹ فارم MEXC کے ساتھ موازنہ کریں۔ شناختی چیکس اور رسائی قواعد ریجن، مصنوعات اور اکاؤنٹ مرحلے کے لحاظ سے بدلتے ہیں؛ کوئی بھی پلیٹ فارم استعمال کرنے سے پہلے موجودہ شرائط تصدیق کریں۔"],
  },
  // l10n: needs native review
  uk: {
    "meme-coins": ["Мемкоїни й ончейн-перевірки", "Порівняння платформ мемкоїнів: контракт, ліквідність, дозволи й вихід", "Порівнюйте MEXC, Gate.io і Raydium за доступом до продукту, токен-контрактами, маршрутами ліквідності, опублікованими витратами, ризиком дозволів і умовами виходу. Кампанії, комісії та придатність акаунта потрібно перевіряти на чинних офіційних сторінках."],
    derivatives: ["Деривативи й безстрокові контракти", "Порівняння платформ криптобезстрокових контрактів: комісії, фінансування й ліквідація", "Порівнюйте чотири маршрути деривативів в одному списку: ф'ючерсні акаунти на централізованих біржах, Perp DEX із підключеним гаманцем, спеціалізовані платформи для опціонів і безстрокових контрактів, а також маршрути пулів у стилі GMX. Перед вибором перевірте опубліковані комісії, фінансування, режим маржі, правила ліквідації, оракул, рух застави, регіон і ризик підпису."],
    "compliant-exchanges": ["Фіатний доступ і регуляторні перевірки", "Фіатний доступ та умови акаунта: HashKey, Kraken і OKX", "Порівнюйте HashKey, Kraken і OKX за юридичною особою сервісу, регіональними та продуктовими умовами, власником банківського рахунку, фіатними маршрутами й чинними офіційними правилами. Реєстрацію на платформі перевіряйте окремо від банківського розгляду."],
    "no-kyc": ["Без KYC і приватна торгівля", "Порівняння торгівлі без KYC і з самостійним зберіганням (2026): Hyperliquid, dYdX і MEXC", "Порівнюйте протоколи самостійного зберігання Hyperliquid і dYdX із централізованою платформою MEXC. Перевірки особи й правила доступу залежать від регіону, продукту та етапу акаунта; перед використанням будь-якої платформи підтвердьте чинні умови."],
  },
  // l10n: needs native review (ar)
  ar: {
    "meme-coins": ["عملات الميم وفحوص السلسلة", "مقارنة منصات عملات الميم: العقد والسيولة والموافقات ومسار الخروج", "قارن بين MEXC وGate.io وRaydium من حيث الوصول إلى المنتج وعقود الرموز ومسارات السيولة والتكاليف المنشورة ومخاطر الموافقات وشروط الخروج. يجب التحقق من الحملات والرسوم وأهلية الحساب في الصفحات الرسمية الحالية."],
    derivatives: ["المشتقات والعقود الدائمة", "مقارنة منصات العقود الدائمة للعملات الرقمية: الرسوم والتمويل والتصفية", "قارن أربعة مسارات للمشتقات في قائمة واحدة: حسابات العقود الآجلة في المنصات المركزية، ومنصات Perp DEX المتصلة بالمحفظة، والمنصات المتخصصة في الخيارات والعقود الدائمة، ومجمعات على طراز GMX. راجع الرسوم المنشورة والتمويل ونمط الهامش وقواعد التصفية والأوراكل وحركة الضمانات والمنطقة ومخاطر التوقيع قبل الاختيار."],
    "compliant-exchanges": ["الوصول إلى العملات الورقية والفحوص التنظيمية", "الوصول إلى العملات الورقية وشروط الحساب: HashKey وKraken وOKX", "قارن بين HashKey وKraken وOKX من حيث الكيان المقدم للخدمة والشروط الإقليمية وشروط المنتج وملكية الحساب البنكي وقنوات العملات الورقية والقواعد الرسمية الحالية. تحقق من التسجيل في المنصة بمعزل عن مراجعة البنك."],
    "no-kyc": ["تداول بدون KYC وتداول خاص", "مقارنة التداول بدون KYC وبالحفظ الذاتي (2026): Hyperliquid وdYdX وMEXC", "قارن بروتوكولي الحفظ الذاتي Hyperliquid وdYdX بالمنصة المركزية MEXC. تختلف فحوص الهوية وقواعد الوصول حسب المنطقة والمنتج ومرحلة الحساب؛ تحقق من الشروط الحالية قبل استخدام أي منصة."],
  },
};

const rowCopy = (locale) => FACTBOOK_ROW_COPY[locale] || FACTBOOK_ROW_COPY[String(locale).startsWith("zh") ? "zh-Hans" : "en"];

/** True when the hub shows its records (titles, descriptions) in the page language rather than English. */
export function hubRecordsLocalized(kind, locale = "en") {
  if (String(locale).startsWith("zh") || locale === "en") return true;
  return kind === "factbook" ? Boolean(FACTBOOK_ROW_COPY[locale]) : Boolean(TOPIC_HUB_RECORDS[locale]);
}

export function topicHubItems(locale = "en") {
  const isZh = String(locale).startsWith("zh");
  return TOPIC_SLUGS.map((slug) => {
    const topic = TOPIC_GUIDES[slug];
    const local = TOPIC_HUB_RECORDS[locale]?.[slug];
    return {
      slug,
      href: `/topics/${slug}`,
      title: local ? local[1] : isZh ? topic.metaTitleZh : topic.metaTitleEn,
      description: local ? local[2] : isZh ? topic.descZh : topic.descEn,
      name: local ? local[0] : isZh ? (locale === "zh-Hant" && topic.categoryZhHant ? topic.categoryZhHant : topic.categoryZh) : topic.categoryEn,
      updatedOn: /^\d{4}-\d{2}-\d{2}$/.test(String(topic.lastUpdated || "")) ? topic.lastUpdated : null,
      count: Array.isArray(topic.platforms) ? topic.platforms.length : 0,
    };
  });
}

// Each row says what its record actually holds, from exchange-facts.js (the one fee source): the checked
// spot / perpetual base fees, the token discount, and how many of the two fee fields are checked, with the date.
function factbookRowFacts(slug, name, isZh, locale = isZh ? "zh-Hans" : "en") {
  const spot = feeFact(slug, "spot");
  const perp = feeFact(slug, "perp");
  const checked = [spot, perp].filter((f) => f.state === "checked");
  const date = checked.map((f) => f.checkedOn).filter(Boolean).sort().at(-1) || null;
  const token = factsForVenue(slug)?.discount?.token || null;
  const spotOff = discountFact(slug, "spot");
  const fee = (f) => (f.state === "checked" ? feePair(f.maker, f.taker) : null);
  const copy = rowCopy(locale);
  const parts = [
    fee(spot) ? copy.spot(fee(spot)) : copy.spotNo,
    fee(perp) ? copy.perp(fee(perp)) : copy.perpNo,
  ];
  if (token && spotOff != null) parts.push(copy.discount(spotOff, token));
  return {
    checkedOn: date, checkedFields: checked.length,
    description: copy.row(name, parts),
    meta: isZh
      ? (date ? `费率核对 ${date} · ${checked.length}/2 个费率字段` : "费率尚未核对 · 0/2 个费率字段")
      : (date ? `Fees checked ${date} · ${checked.length}/2 fee fields` : "Fees not yet checked · 0/2 fee fields"),
  };
}

export function factbookHubItems(locale = "en") {
  const isZh = String(locale).startsWith("zh");
  return FACTBOOK_SLUGS.map((slug) => {
    const venue = FACTBOOK_REGISTRY[slug];
    const facts = factbookRowFacts(slug, venue.name, isZh, locale);
    return {
      slug,
      href: `/factbook/${slug}`,
      title: (FACTBOOK_ROW_COPY[locale] ? rowCopy(locale) : FACTBOOK_ROW_COPY.en).title(venue.name),
      description: facts.description,
      meta: facts.meta,
      checkedOn: facts.checkedOn,
      checkedFields: facts.checkedFields,
      category: venue.category,
      officialDomain: venue.officialDomain,
    };
  });
}

// Hub copy (editorial templates 2026-10-11): headings, intro and index labels exist in all 15 locales. Record titles
// and descriptions below the headings stay in their reviewed language (English, or Chinese for zh) and are marked so.
const HUB_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const FACTBOOK_HUB_COPY = {
  en: { title: "Source Review Factbook", description: "A platform-level collection of published source records, fee fields, account conditions, official domains and verification limits. Each detail page remains a dated research record.", itemLabel: "Factbook records", primaryCta: "Start with Binance source record", secondaryCta: "Browse platform directory", cardCta: "Open fact record" },
  "zh-Hans": { title: "来源审阅事实库", description: "按平台聚合公开来源、费率字段、账户条件、官方域名与核验边界。每个详情页仍需回到来源日期和官方流程确认。", itemLabel: "平台事实库", primaryCta: "先看 Binance 来源事实库", secondaryCta: "查看平台黄页", cardCta: "打开事实记录" },
  "zh-Hant": { title: "來源審閱事實庫", description: "按平台彙整公開來源、費率欄位、帳戶條件、官方網域與核驗邊界。每個詳情頁仍需回到來源日期和官方流程確認。", itemLabel: "平台事實庫", primaryCta: "先看 Binance 來源事實庫", secondaryCta: "查看平台黃頁", cardCta: "打開事實記錄" },
  es: { title: "Factbook de fuentes revisadas", description: "Registros por plataforma de fuentes publicadas, campos de comisiones, condiciones de cuenta, dominios oficiales y límites de verificación, cada uno con fecha.", itemLabel: "Registros del factbook", primaryCta: "Empezar por el registro de Binance", secondaryCta: "Ver el directorio de plataformas", cardCta: "Abrir registro" },
  "pt-BR": { title: "Factbook de fontes revisadas", description: "Registros por plataforma de fontes publicadas, campos de taxas, condições de conta, domínios oficiais e limites de verificação, cada um com data.", itemLabel: "Registros do factbook", primaryCta: "Começar pelo registro da Binance", secondaryCta: "Ver o diretório de plataformas", cardCta: "Abrir registro" },
  fr: { title: "Factbook des sources vérifiées", description: "Fiches par plateforme : sources publiées, champs de frais, conditions de compte, domaines officiels et limites de vérification, chacune datée.", itemLabel: "Fiches du factbook", primaryCta: "Commencer par la fiche Binance", secondaryCta: "Voir l’annuaire des plateformes", cardCta: "Ouvrir la fiche" },
  de: { title: "Factbook geprüfter Quellen", description: "Datensätze je Plattform: veröffentlichte Quellen, Gebührenfelder, Kontobedingungen, offizielle Domains und Prüfgrenzen, jeweils mit Datum.", itemLabel: "Factbook-Einträge", primaryCta: "Mit dem Binance-Eintrag beginnen", secondaryCta: "Plattformverzeichnis ansehen", cardCta: "Eintrag öffnen" },
  it: { title: "Factbook delle fonti verificate", description: "Schede per piattaforma: fonti pubblicate, campi commissioni, condizioni del conto, domini ufficiali e limiti di verifica, ognuna con data.", itemLabel: "Schede del factbook", primaryCta: "Inizia dalla scheda Binance", secondaryCta: "Vedi l’elenco delle piattaforme", cardCta: "Apri la scheda" },
  ja: { title: "出典確認ファクトブック", description: "公開ソース、手数料項目、口座条件、公式ドメイン、確認範囲をプラットフォーム別に日付付きで整理した記録集です。", itemLabel: "ファクトブック記録", primaryCta: "Binance の記録から見る", secondaryCta: "プラットフォーム一覧を見る", cardCta: "記録を開く" },
  ko: { title: "출처 검토 팩트북", description: "공개 출처, 수수료 항목, 계정 조건, 공식 도메인과 검증 범위를 플랫폼별로 날짜와 함께 정리한 기록입니다.", itemLabel: "팩트북 기록", primaryCta: "Binance 기록부터 보기", secondaryCta: "플랫폼 목록 보기", cardCta: "기록 열기" },
  ru: { title: "Справочник проверенных источников", description: "Записи по площадкам: опубликованные источники, поля комиссий, условия аккаунта, официальные домены и границы проверки, каждая с датой.", itemLabel: "Записи справочника", primaryCta: "Начать с записи Binance", secondaryCta: "Каталог площадок", cardCta: "Открыть запись" },
  tr: { title: "Kaynak İnceleme Bilgi Kitabı", description: "Platform bazında yayımlanmış kaynaklar, ücret alanları, hesap koşulları, resmi alan adları ve doğrulama sınırları; her kayıt tarihli.", itemLabel: "Bilgi kitabı kayıtları", primaryCta: "Binance kaydıyla başlayın", secondaryCta: "Platform dizinine göz atın", cardCta: "Kaydı aç" },
  id: { title: "Factbook Sumber Tertinjau", description: "Catatan per platform: sumber terbitan, kolom biaya, syarat akun, domain resmi dan batas verifikasi, masing-masing bertanggal.", itemLabel: "Catatan factbook", primaryCta: "Mulai dari catatan Binance", secondaryCta: "Lihat direktori platform", cardCta: "Buka catatan" },
  vi: { title: "Sổ dữ kiện nguồn đã rà soát", description: "Hồ sơ theo nền tảng: nguồn đã công bố, trường phí, điều kiện tài khoản, tên miền chính thức và giới hạn xác minh, mỗi hồ sơ có ngày.", itemLabel: "Hồ sơ dữ kiện", primaryCta: "Bắt đầu với hồ sơ Binance", secondaryCta: "Xem danh bạ nền tảng", cardCta: "Mở hồ sơ" },
  // l10n: needs native review
  ur: { title: "جائزہ شدہ ذرائع کی فیکٹ بک", description: "ہر پلیٹ فارم کے لیے شائع شدہ ذرائع، فیس کے خانے، اکاؤنٹ کی شرائط، سرکاری ڈومینز اور تصدیق کی حدیں تاریخ وار ریکارڈ کے ساتھ۔", itemLabel: "فیکٹ بک ریکارڈز", primaryCta: "Binance ریکارڈ سے شروع کریں", secondaryCta: "پلیٹ فارم ڈائریکٹری دیکھیں", cardCta: "ریکارڈ کھولیں" },
  // l10n: needs native review
  uk: { title: "Фактбук перевірених джерел", description: "Записи за платформами: опубліковані джерела, поля комісій, умови акаунта, офіційні домени й межі перевірки, кожен із датою.", itemLabel: "Записи фактбуку", primaryCta: "Почати із запису Binance", secondaryCta: "Переглянути каталог платформ", cardCta: "Відкрити запис" },
  ar: { title: "سجل الحقائق المراجَعة المصادر", description: "سجلات لكل منصة: المصادر المنشورة وحقول الرسوم وشروط الحساب والنطاقات الرسمية وحدود التحقق، وكل سجل مؤرخ.", itemLabel: "سجلات الحقائق", primaryCta: "ابدأ بسجل Binance", secondaryCta: "تصفح دليل المنصات", cardCta: "افتح السجل" },
};
const TOPIC_HUB_COPY = {
  en: { title: "Topic Research Hubs", description: "A collection of trading-topic research paths covering platform comparisons, fee checks, regional conditions, on-chain risks and source records.", itemLabel: "Topic guides", primaryCta: "Start with derivatives decision path", secondaryCta: "Open fee calculator", cardCta: "Open research path" },
  "zh-Hans": { title: "主题研究聚合页", description: "按交易主题聚合平台比较、费用核验、地区条件、链上风险与来源记录。先选主题，再进入详情核对具体平台。", itemLabel: "主题研究", primaryCta: "先看衍生品决策路径", secondaryCta: "查看费用计算器", cardCta: "打开研究路径" },
  "zh-Hant": { title: "主題研究彙整頁", description: "按交易主題彙整平台比較、費用核驗、地區條件、鏈上風險與來源記錄。先選主題，再進入詳情核對具體平台。", itemLabel: "主題研究", primaryCta: "先看衍生品決策路徑", secondaryCta: "查看費用計算器", cardCta: "打開研究路徑" },
  es: { title: "Guías de investigación por tema", description: "Rutas de investigación por tema de trading: comparativas de plataformas, comisiones, condiciones regionales, riesgos on-chain y registros de fuentes.", itemLabel: "Guías temáticas", primaryCta: "Empezar por derivados", secondaryCta: "Abrir la calculadora de comisiones", cardCta: "Abrir la guía" },
  "pt-BR": { title: "Guias de pesquisa por tema", description: "Rotas de pesquisa por tema de trading: comparações de plataformas, taxas, condições regionais, riscos on-chain e registros de fontes.", itemLabel: "Guias temáticos", primaryCta: "Começar por derivativos", secondaryCta: "Abrir a calculadora de taxas", cardCta: "Abrir o guia" },
  fr: { title: "Dossiers de recherche par thème", description: "Parcours de recherche par thème : comparaisons de plateformes, frais, conditions régionales, risques on-chain et sources.", itemLabel: "Dossiers thématiques", primaryCta: "Commencer par les dérivés", secondaryCta: "Ouvrir le calculateur de frais", cardCta: "Ouvrir le dossier" },
  de: { title: "Themen-Recherchen", description: "Recherchepfade nach Handelsthema: Plattformvergleiche, Gebührenprüfungen, regionale Bedingungen, On-Chain-Risiken und Quellen.", itemLabel: "Themenleitfäden", primaryCta: "Mit Derivaten beginnen", secondaryCta: "Gebührenrechner öffnen", cardCta: "Leitfaden öffnen" },
  it: { title: "Ricerche per tema", description: "Percorsi di ricerca per tema di trading: confronti tra piattaforme, commissioni, condizioni regionali, rischi on-chain e fonti.", itemLabel: "Guide tematiche", primaryCta: "Inizia dai derivati", secondaryCta: "Apri il calcolatore commissioni", cardCta: "Apri la guida" },
  ja: { title: "テーマ別リサーチ", description: "プラットフォーム比較、手数料確認、地域条件、オンチェーンのリスク、出典記録を取引テーマごとにまとめた調査ルートです。", itemLabel: "テーマガイド", primaryCta: "デリバティブから始める", secondaryCta: "手数料計算ツールを開く", cardCta: "ガイドを開く" },
  ko: { title: "주제별 리서치", description: "플랫폼 비교, 수수료 확인, 지역 조건, 온체인 위험과 출처 기록을 거래 주제별로 정리한 리서치 경로입니다.", itemLabel: "주제 가이드", primaryCta: "파생상품부터 보기", secondaryCta: "수수료 계산기 열기", cardCta: "가이드 열기" },
  ru: { title: "Исследования по темам", description: "Маршруты исследований по торговым темам: сравнения площадок, комиссии, региональные условия, ончейн-риски и источники.", itemLabel: "Тематические гиды", primaryCta: "Начать с деривативов", secondaryCta: "Открыть калькулятор комиссий", cardCta: "Открыть гид" },
  tr: { title: "Konu bazlı araştırmalar", description: "İşlem konularına göre araştırma yolları: platform karşılaştırmaları, ücret kontrolleri, bölgesel koşullar, zincir üstü riskler ve kaynaklar.", itemLabel: "Konu rehberleri", primaryCta: "Türevlerle başlayın", secondaryCta: "Ücret hesaplayıcısını aç", cardCta: "Rehberi aç" },
  id: { title: "Riset per topik", description: "Jalur riset per topik trading: perbandingan platform, pemeriksaan biaya, syarat regional, risiko on-chain dan catatan sumber.", itemLabel: "Panduan topik", primaryCta: "Mulai dari derivatif", secondaryCta: "Buka kalkulator biaya", cardCta: "Buka panduan" },
  vi: { title: "Nghiên cứu theo chủ đề", description: "Lộ trình nghiên cứu theo chủ đề giao dịch: so sánh nền tảng, kiểm tra phí, điều kiện khu vực, rủi ro on-chain và nguồn.", itemLabel: "Hướng dẫn chủ đề", primaryCta: "Bắt đầu với phái sinh", secondaryCta: "Mở công cụ tính phí", cardCta: "Mở hướng dẫn" },
  // l10n: needs native review
  ur: { title: "موضوعی تحقیقی مراکز", description: "ٹریڈنگ موضوعات کے تحقیقی راستے: پلیٹ فارم موازنہ، فیس کی جانچ، علاقائی شرائط، آن چین خطرات اور ذریعہ ریکارڈ۔", itemLabel: "موضوعی گائیڈز", primaryCta: "مشتقات کے فیصلہ راستے سے شروع کریں", secondaryCta: "فیس کیلکولیٹر کھولیں", cardCta: "تحقیقی راستہ کھولیں" },
  // l10n: needs native review
  uk: { title: "Тематичні дослідницькі хаби", description: "Дослідницькі маршрути за торговими темами: порівняння платформ, перевірка комісій, регіональні умови, ончейн-ризики й записи джерел.", itemLabel: "Тематичні гайди", primaryCta: "Почати з маршруту вибору деривативів", secondaryCta: "Відкрити калькулятор комісій", cardCta: "Відкрити дослідницький маршрут" },
  ar: { title: "أبحاث حسب الموضوع", description: "مسارات بحث حسب موضوع التداول: مقارنات المنصات وفحص الرسوم والشروط الإقليمية ومخاطر السلسلة وسجلات المصادر.", itemLabel: "أدلة المواضيع", primaryCta: "ابدأ بالمشتقات", secondaryCta: "افتح حاسبة الرسوم", cardCta: "افتح الدليل" },
};
// Index labels for the editorial hub layout (featured row, grouped sections, counts, review dates).
const HUB_INDEX_COPY = {
  en: { featured: "Featured", index: "Index", updated: "Updated", reviewed: "Fees checked", notChecked: "Fees not yet checked", fields: (n) => `${n}/2 fee fields`, platforms: (n) => `${n} platforms`, records: (n) => `${n} records`, groups: { CEX: ["Centralized exchanges", "Custodial accounts: fee schedules, KYC and official domains."], "Perp DEX": ["Perpetual DEXs", "Wallet-connected perpetuals: protocol fees, funding and settlement."], DEX: ["Spot DEXs", "Swap protocols: pool fees, routing and contract addresses."] } },
  "zh-Hans": { featured: "精选", index: "索引", updated: "更新于", reviewed: "费率核对", notChecked: "费率尚未核对", fields: (n) => `${n}/2 个费率字段`, platforms: (n) => `${n} 个平台`, records: (n) => `${n} 条记录`, groups: { CEX: ["中心化交易所", "托管账户：费率表、KYC 与官方域名。"], "Perp DEX": ["永续合约 DEX", "钱包直连永续：协议费、资金费率与结算。"], DEX: ["现货 DEX", "兑换协议：池子费率、路由与合约地址。"] } },
  "zh-Hant": { featured: "精選", index: "索引", updated: "更新於", reviewed: "費率核對", notChecked: "費率尚未核對", fields: (n) => `${n}/2 個費率欄位`, platforms: (n) => `${n} 個平台`, records: (n) => `${n} 筆記錄`, groups: { CEX: ["中心化交易所", "託管帳戶：費率表、KYC 與官方網域。"], "Perp DEX": ["永續合約 DEX", "錢包直連永續：協議費、資金費率與結算。"], DEX: ["現貨 DEX", "兌換協議：池子費率、路由與合約地址。"] } },
  es: { featured: "Destacado", index: "Índice", updated: "Actualizado", reviewed: "Comisiones revisadas", notChecked: "Comisiones aún sin revisar", fields: (n) => `${n}/2 campos de comisión`, platforms: (n) => `${n} plataformas`, records: (n) => `${n} registros`, groups: { CEX: ["Exchanges centralizados", "Cuentas custodiadas: comisiones, KYC y dominios oficiales."], "Perp DEX": ["DEX de perpetuos", "Perpetuos con wallet: comisiones del protocolo, funding y liquidación."], DEX: ["DEX spot", "Protocolos de swap: comisiones de pool, rutas y contratos."] } },
  "pt-BR": { featured: "Destaque", index: "Índice", updated: "Atualizado", reviewed: "Taxas conferidas", notChecked: "Taxas ainda não conferidas", fields: (n) => `${n}/2 campos de taxa`, platforms: (n) => `${n} plataformas`, records: (n) => `${n} registros`, groups: { CEX: ["Corretoras centralizadas", "Contas custodiadas: tabelas de taxas, KYC e domínios oficiais."], "Perp DEX": ["DEX de perpétuos", "Perpétuos via carteira: taxas do protocolo, funding e liquidação."], DEX: ["DEX spot", "Protocolos de swap: taxas de pool, rotas e contratos."] } },
  fr: { featured: "À la une", index: "Index", updated: "Mis à jour", reviewed: "Frais vérifiés", notChecked: "Frais pas encore vérifiés", fields: (n) => `${n}/2 champs de frais`, platforms: (n) => `${n} plateformes`, records: (n) => `${n} fiches`, groups: { CEX: ["Exchanges centralisés", "Comptes conservés : grilles de frais, KYC et domaines officiels."], "Perp DEX": ["DEX de perpétuels", "Perpétuels via wallet : frais du protocole, funding et règlement."], DEX: ["DEX spot", "Protocoles d’échange : frais de pool, routage et contrats."] } },
  de: { featured: "Empfohlen", index: "Verzeichnis", updated: "Aktualisiert", reviewed: "Gebühren geprüft", notChecked: "Gebühren noch nicht geprüft", fields: (n) => `${n}/2 Gebührenfelder`, platforms: (n) => `${n} Plattformen`, records: (n) => `${n} Einträge`, groups: { CEX: ["Zentrale Börsen", "Verwahrkonten: Gebührentabellen, KYC und offizielle Domains."], "Perp DEX": ["Perpetual-DEXs", "Perpetuals per Wallet: Protokollgebühren, Funding und Abwicklung."], DEX: ["Spot-DEXs", "Swap-Protokolle: Pool-Gebühren, Routing und Verträge."] } },
  it: { featured: "In evidenza", index: "Indice", updated: "Aggiornato", reviewed: "Commissioni verificate", notChecked: "Commissioni non ancora verificate", fields: (n) => `${n}/2 campi commissione`, platforms: (n) => `${n} piattaforme`, records: (n) => `${n} schede`, groups: { CEX: ["Exchange centralizzati", "Conti in custodia: tabelle commissioni, KYC e domini ufficiali."], "Perp DEX": ["DEX di perpetui", "Perpetui via wallet: commissioni del protocollo, funding e regolamento."], DEX: ["DEX spot", "Protocolli di swap: commissioni dei pool, routing e contratti."] } },
  ja: { featured: "注目", index: "索引", updated: "更新", reviewed: "手数料確認", notChecked: "手数料は未確認", fields: (n) => `手数料項目 ${n}/2`, platforms: (n) => `${n} プラットフォーム`, records: (n) => `${n} 件`, groups: { CEX: ["中央集権型取引所", "カストディ口座：手数料表、KYC、公式ドメイン。"], "Perp DEX": ["無期限先物 DEX", "ウォレット接続の無期限先物：プロトコル手数料、資金調達率、決済。"], DEX: ["現物 DEX", "スワッププロトコル：プール手数料、ルーティング、コントラクト。"] } },
  ko: { featured: "추천", index: "색인", updated: "업데이트", reviewed: "수수료 확인", notChecked: "수수료 미확인", fields: (n) => `수수료 항목 ${n}/2`, platforms: (n) => `플랫폼 ${n}곳`, records: (n) => `기록 ${n}건`, groups: { CEX: ["중앙화 거래소", "수탁 계정: 수수료표, KYC, 공식 도메인."], "Perp DEX": ["무기한 선물 DEX", "지갑 연결 무기한 선물: 프로토콜 수수료, 펀딩, 정산."], DEX: ["현물 DEX", "스왑 프로토콜: 풀 수수료, 라우팅, 컨트랙트."] } },
  ru: { featured: "Главное", index: "Указатель", updated: "Обновлено", reviewed: "Комиссии проверены", notChecked: "Комиссии ещё не проверены", fields: (n) => `полей комиссий: ${n}/2`, platforms: (n) => `площадок: ${n}`, records: (n) => `записей: ${n}`, groups: { CEX: ["Централизованные биржи", "Кастодиальные аккаунты: комиссии, KYC и официальные домены."], "Perp DEX": ["Perp DEX", "Бессрочные контракты через кошелёк: комиссии протокола, фандинг и расчёты."], DEX: ["Спотовые DEX", "Протоколы обмена: комиссии пулов, маршрутизация и контракты."] } },
  tr: { featured: "Öne çıkan", index: "Dizin", updated: "Güncellendi", reviewed: "Ücretler kontrol edildi", notChecked: "Ücretler henüz kontrol edilmedi", fields: (n) => `${n}/2 ücret alanı`, platforms: (n) => `${n} platform`, records: (n) => `${n} kayıt`, groups: { CEX: ["Merkezi borsalar", "Saklamalı hesaplar: ücret tabloları, KYC ve resmi alan adları."], "Perp DEX": ["Vadeli DEX'ler", "Cüzdanla vadeli işlemler: protokol ücretleri, fonlama ve takas."], DEX: ["Spot DEX'ler", "Takas protokolleri: havuz ücretleri, yönlendirme ve sözleşmeler."] } },
  id: { featured: "Unggulan", index: "Indeks", updated: "Diperbarui", reviewed: "Biaya diperiksa", notChecked: "Biaya belum diperiksa", fields: (n) => `${n}/2 kolom biaya`, platforms: (n) => `${n} platform`, records: (n) => `${n} catatan`, groups: { CEX: ["Bursa terpusat", "Akun kustodian: tabel biaya, KYC dan domain resmi."], "Perp DEX": ["DEX perpetual", "Perpetual lewat dompet: biaya protokol, funding dan penyelesaian."], DEX: ["DEX spot", "Protokol swap: biaya pool, rute dan kontrak."] } },
  vi: { featured: "Nổi bật", index: "Mục lục", updated: "Cập nhật", reviewed: "Đã kiểm tra phí", notChecked: "Chưa kiểm tra phí", fields: (n) => `${n}/2 trường phí`, platforms: (n) => `${n} nền tảng`, records: (n) => `${n} hồ sơ`, groups: { CEX: ["Sàn tập trung", "Tài khoản lưu ký: biểu phí, KYC và tên miền chính thức."], "Perp DEX": ["DEX hợp đồng vĩnh cửu", "Hợp đồng vĩnh cửu qua ví: phí giao thức, funding và thanh toán."], DEX: ["DEX giao ngay", "Giao thức hoán đổi: phí pool, định tuyến và hợp đồng."] } },
  // l10n: needs native review
  ur: { featured: "نمایاں", index: "اشاریہ", updated: "اپ ڈیٹ", reviewed: "فیس چیک شدہ", notChecked: "فیس ابھی چیک نہیں", fields: (n) => `${n}/2 فیس خانے`, platforms: (n) => `${n} پلیٹ فارمز`, records: (n) => `${n} ریکارڈز`, groups: { CEX: ["مرکزی ایکسچینجز", "کسٹڈی اکاؤنٹس: فیس جدول، KYC اور سرکاری ڈومینز۔"], "Perp DEX": ["دائمی DEX", "والیٹ سے جڑے دائمی معاہدے: پروٹوکول فیس، فنڈنگ اور سیٹلمنٹ۔"], DEX: ["اسپاٹ DEX", "سواپ پروٹوکول: پول فیس، روٹنگ اور کنٹریکٹس۔"] } },
  // l10n: needs native review
  uk: { featured: "Вибране", index: "Індекс", updated: "Оновлено", reviewed: "Комісії перевірено", notChecked: "Комісії ще не перевірені", fields: (n) => `${n}/2 полів комісій`, platforms: (n) => `${n} платформ`, records: (n) => `${n} записів`, groups: { CEX: ["Централізовані біржі", "Кастодіальні акаунти: таблиці комісій, KYC та офіційні домени."], "Perp DEX": ["DEX безстрокових контрактів", "Безстрокові контракти через гаманець: протокольні комісії, фінансування й розрахунки."], DEX: ["Спотові DEX", "Протоколи обміну: комісії пулів, маршрутизація й контракти."] } },
  ar: { featured: "مختارات", index: "الفهرس", updated: "تاريخ التحديث", reviewed: "تم فحص الرسوم", notChecked: "لم تُفحص الرسوم بعد", fields: (n) => `${n}/2 من حقول الرسوم`, platforms: (n) => `${n} منصات`, records: (n) => `${n} سجلًا`, groups: { CEX: ["البورصات المركزية", "حسابات الحفظ: جداول الرسوم والتحقق من الهوية والنطاقات الرسمية."], "Perp DEX": ["منصات العقود الدائمة اللامركزية", "عقود دائمة عبر المحفظة: رسوم البروتوكول والتمويل والتسوية."], DEX: ["منصات التبادل الفوري اللامركزية", "بروتوكولات المبادلة: رسوم المجمعات والتوجيه والعقود."] } },
};
export const COLLECTION_HUB_LOCALES = Object.freeze(HUB_LOCALES);
function hubLocale(locale) {
  const value = String(locale || "en");
  if (HUB_LOCALES.includes(value)) return value;
  if (/^zh-(hant|tw|hk)/i.test(value)) return "zh-Hant";
  if (value.startsWith("zh")) return "zh-Hans";
  if (/^pt/i.test(value)) return "pt-BR";
  const base = value.split("-")[0];
  return HUB_LOCALES.includes(base) ? base : "en";
}
export function collectionHubIndexCopy(locale = "en") {
  return HUB_INDEX_COPY[hubLocale(locale)];
}
export function collectionHubCopy(kind, locale = "en") {
  const code = hubLocale(locale);
  if (kind === "factbook") {
    return { eyebrow: "FACTBOOK COLLECTION", ...FACTBOOK_HUB_COPY[code], primaryHref: "/factbook/binance", secondaryHref: "/exchanges" };
  }
  return { eyebrow: "TOPIC COLLECTION", ...TOPIC_HUB_COPY[code], primaryHref: "/topics/derivatives", secondaryHref: "/rates" };
}
