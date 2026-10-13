// Quick profile answers use the existing checked factbook and partner feed; no live availability is inferred.
// Radar query overrides are retained only when the answer addresses that intent. Missing fee/app data is omitted.
import { APP_DOWNLOAD_SLUGS, appDownloadPath } from "./app-download-path.js";
import { feeDisplay, feeFact, primarySourceUrl } from "./exchange-facts.js";
import { isNeutralCtaLocale } from "./locale-policy.js";
import { isPartnerPromotableIn, partnerPromotionGate } from "./partner-geo-policy.js";
import { PARTNER_GEO_RESTRICTIONS } from "./partner-geo-restrictions.js";
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";
import { venueDatabase } from "./venue-database.js";

export const QUICK_ANSWER_EXCHANGE_SLUGS = Object.freeze(["okx", "binance", "bybit", "bitget", "kraken", "backpack"]);
export const QUICK_ANSWER_LOCALES = Object.freeze(["en", "zh-Hans", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "tr", "id", "zh-Hant", "ru", "ar", "ur", "uk", "vi"]);

const PARTNERS = Object.freeze(Object.fromEntries(REFERRAL_PARTNERS.map((partner) => [partner.slug, partner])));
const COUNTRY_NAMES = Object.freeze({ BR: "Brazil", ID: "Indonesia", JP: "Japan", KR: "South Korea", TR: "Turkey", US: "the United States", VN: "Vietnam", FR: "France", DE: "Germany", SG: "Singapore", RU: "Russia" });
// These select the country named by a language-level availability question; they never imply access.
const QUERY_COUNTRY = Object.freeze({ en: "US", "zh-Hans": "SG", es: "MX", "pt-BR": "BR", fr: "FR", de: "DE", it: "IT", ja: "JP", ko: "KR", tr: "TR", id: "ID", "zh-Hant": "TW", ru: "RU", ar: "EG", ur: "PK", uk: "UA", vi: "VN" });
const GENERIC_QUESTIONS = Object.freeze({
  fr: ["inscription", "frais", "dépôt", "vérification", "disponibilité", "application"],
  de: ["Registrierung", "Gebühren", "Einzahlung", "Verifizierung", "Verfügbarkeit", "App"],
  it: ["registrazione", "commissioni", "deposito", "verifica", "disponibilità", "app"],
  ja: ["登録", "手数料", "入金", "本人確認", "利用可能地域", "アプリ"],
  ko: ["가입", "수수료", "입금", "인증", "이용 가능 지역", "앱"],
  "zh-Hant": ["註冊", "手續費", "入金", "身分認證", "可用地區", "App"],
  ru: ["регистрация", "комиссии", "пополнение", "проверка личности", "доступность", "приложение"],
  ar: ["التسجيل", "الرسوم", "الإيداع", "التحقق", "التوفر", "التطبيق"],
  ur: ["رجسٹریشن", "فیس", "ڈپازٹ", "شناختی تصدیق", "دستیابی", "ایپ"],
  uk: ["реєстрація", "комісії", "депозит", "перевірка особи", "доступність", "застосунок"],
  vi: ["đăng ký", "phí", "nạp tiền", "xác minh danh tính", "khả dụng", "ứng dụng"],
});

const QUESTION = Object.freeze({
  en: {
    okx: ["okx how to register", "okx fees", "okx how to deposit", "okx how to verify", "is okx legal in us", "okx app"],
    binance: ["binance how to register", "binance fees", "binance p2p", "binance kyc", "is binance available in us", "binance app"],
    bybit: ["bybit register", "bybit fees", "bybit p2p", "is bybit kyc", "is bybit available in the us", "bybit app"],
    bitget: ["bitget how to register", "bitget fees", "bitget p2p", "bitget kyc", "is bitget available in the us", "bitget app"],
    kraken: ["kraken register", "kraken fees for selling crypto", "kraken how to deposit money", "kraken verification", "is kraken available in new york", "kraken app"],
    backpack: ["backpack register", "backpack fees", "backpack deposit", "backpack kyc", "backpack exchange availability", "backpack app"],
  },
  "zh-Hans": {
    okx: ["okx怎么注册", "okx手续费", "okx怎么充值", "okx身份认证", "okx可用地区", "okx app"],
    binance: ["比南车怎么注册", "比南侧 手续费", "币 安 入金 手续 费", "币安身份认证", "币安可用地区", "binance app"],
    bybit: ["bybit注册", "bybit手续费", "bybit充值", "bybit kyc", "bybit可用地区", "bybit下载"],
    bitget: ["bitget怎么注册", "bitget手续费", "bitget怎么充值", "bitget kyc", "bitget可用地区", "bitget 下载"],
    kraken: ["kraken怎么注册", "kraken手续费", "kraken怎么入金", "kraken身份认证", "kraken可用地区", "kraken app"],
    backpack: ["backpack怎么注册", "backpack手续费", "backpack怎么充值", "backpack kyc", "backpack可用地区", "backpack app"],
  },
  es: {
    okx: ["okx registro", "okx comisiones spot", "cómo depositar en okx", "okx verificación", "okx disponibilidad", "okx app"],
    binance: ["binance registro", "binance comisiones futuros", "binance p2p", "binance verificación", "binance disponibilidad", "binance app"],
    bybit: ["bybit registro", "bybit comisiones futuros", "bybit p2p", "bybit kyc", "bybit disponibilidad", "bybit app"],
    bitget: ["bitget registro", "bitget comisiones", "bitget p2p", "bitget kyc", "bitget disponibilidad", "bitget app"],
    kraken: ["kraken registro", "kraken comisiones bitcoin", "cómo depositar en kraken", "kraken verificación", "kraken funciona en mexico", "kraken app"],
    backpack: ["backpack registro", "backpack comisiones", "backpack depósito", "backpack kyc", "backpack disponibilidad", "backpack app"],
  },
  "pt-BR": {
    okx: ["okx cadastro", "okx taxas spot", "como depositar na okx", "okx verificação", "okx disponibilidade", "como usar o app okx"],
    binance: ["binance cadastro", "binance taxas bitcoin", "como usar binance p2p", "binance verificação", "binance disponibilidade", "binance app"],
    bybit: ["bybit cadastro", "bybit taxas futuros", "bybit depósito", "bybit kyc", "bybit disponibilidade", "bybit app"],
    bitget: ["bitget cadastro", "bitget taxas futuros", "bitget depósito", "bitget kyc", "bitget disponibilidade", "bitget app"],
    kraken: ["kraken cadastro", "kraken taxas", "kraken depósito", "kraken verificação", "kraken disponibilidade", "kraken app"],
    backpack: ["backpack cadastro", "backpack taxas", "backpack depósito", "backpack kyc", "backpack disponibilidade", "backpack app"],
  },
  tr: {
    okx: ["okx nasıl kayıt olunur", "okx komisyon oranları", "okx nasıl para yatırılır", "okx kimlik doğrulama güvenilir mi", "okx tr kullanılabilir mi", "okx global indir"],
    binance: ["binance nasıl kayıt olunur", "binance komisyon oranları", "binance nasıl para yatırılır", "binance güvenilir mi tc kimlik", "binance tr kullanılabilir mi", "binance uygulaması"],
    bybit: ["bybit nasıl üye olunur", "bybit komisyon oranları", "bybit p2p", "bybit kyc nasıl yapılır", "bybit tr kullanılabilir mi", "bybit uygulaması"],
    kraken: ["kraken kayıt", "kraken komisyon oranları", "kraken nasıl para yatırılır", "kraken kimlik doğrulama", "kraken tr kullanılabilir mi", "kraken app"],
    backpack: ["backpack kayıt", "backpack komisyon oranları", "backpack nasıl para yatırılır", "backpack kyc", "backpack tr kullanılabilir mi", "backpack app"],
  },
  id: {
    okx: ["cara daftar okx wallet", "biaya okx spot", "cara deposit okx", "verifikasi okx", "apakah okx resmi di indonesia", "okx app"],
    binance: ["cara daftar binance di indonesia", "binance biaya transaksi", "cara deposit binance", "verifikasi binance", "apakah binance resmi di indonesia", "binance apk"],
    bybit: ["cara daftar bybit indonesia", "biaya bybit", "cara deposit bybit", "verifikasi bybit", "bybit indonesia", "bybit apk"],
    bitget: ["cara daftar bitget exchange", "biaya bitget", "cara deposit bitget", "apakah bitget perlu kyc", "bitget indonesia", "bitget apk"],
    kraken: ["kraken daftar", "kraken fee", "cara deposit kraken", "verifikasi kraken", "kraken indonesia", "kraken app"],
    backpack: ["cara daftar backpack exchange", "biaya backpack", "cara deposit backpack", "backpack kyc", "backpack indonesia", "backpack app"],
  },
});

const COPY = Object.freeze({
  en: {
    title: "Quick answers",
    signup: ({ name, code }) => `Open ${name} from the profile registration path and enter code ${code} before creating the account. Check the official domain before you submit personal details.`,
    fees: ({ name, spot, perp, date }) => `${name} base maker / taker fees are ${spot} for spot and ${perp} for futures or perpetuals, checked ${date}. Account tier, pair, region and official-screen conditions can change the final fee.`,
    deposit: ({ name, channels }) => `${name} funding routes listed on the profile include ${channels}. Use the official account screen to confirm what is enabled for your verified account.`,
    kyc: ({ name, kyc }) => `${name} identity verification is listed as ${kyc}. The exact document set and limits must be checked on the official account screen.`,
    restricted: ({ name, country }) => `${name} is restricted by verified NexuAlpha partner-geo evidence for ${country}. Check the linked regional terms before using the service.`,
    app: ({ name }) => `${name} has a NexuAlpha app-download check with official iOS and Android store links. Use that page before installing or scanning any APK.`,
    official: ({ name, domain }) => `${name}'s recorded official domain is ${domain}. Verify the domain before login, KYC or deposits.`,
    officialQuestion: ({ name }) => `${name} official domain`,
    restrictedQuestion: ({ name, country }) => `${name} availability in ${country}`,
    levels: { mandatory: "mandatory", optional: "optional", none: "not required" },
  },
  "zh-Hans": {
    title: "快速答案",
    signup: ({ name, code }) => `从 ${name} 资料页的注册路径进入，并在创建账户前填写邀请码 ${code}。提交个人信息前先核对官方域名。`,
    fees: ({ name, spot, perp, date }) => `${name} 基础 maker / taker 费率为：现货 ${spot}，合约 ${perp}，核对日期 ${date}。账户等级、交易对、地区和官方页面条件都可能改变最终费率。`,
    deposit: ({ name, channels }) => `${name} 资料页列出的入金方式包括 ${channels}。实际可用方式以你的官方已验证账户页面为准。`,
    kyc: ({ name, kyc }) => `${name} 身份认证状态为${kyc}。具体证件和额度需在官方账户页面确认。`,
    restricted: ({ name, country }) => `已验证的 NexuAlpha 合作伙伴地区证据显示，${name} 在 ${country} 受限制。`,
    app: ({ name }) => `${name} 有 NexuAlpha App 下载核验页，列出官方 iOS 和 Android 商店链接。安装或扫描 APK 前先看该页。`,
    official: ({ name, domain }) => `${name} 记录的官方域名是 ${domain}。登录、KYC 或入金前先核对域名。`,
    officialQuestion: ({ name }) => `${name} 官方域名`,
    restrictedQuestion: ({ name, country }) => `${name} 在 ${country} 可用吗`,
    levels: { mandatory: "强制", optional: "可选", none: "不需要" },
  },
  es: {
    title: "Respuestas rápidas",
    signup: ({ name, code }) => `Abre ${name} desde la ruta de registro del perfil e introduce el código ${code} antes de crear la cuenta. Revisa el dominio oficial antes de enviar datos personales.`,
    fees: ({ name, spot, perp, date }) => `Las comisiones base maker / taker de ${name} son ${spot} en spot y ${perp} en futuros o perpetuos, verificadas el ${date}. Nivel de cuenta, par, región y pantalla oficial pueden cambiar la comisión final.`,
    deposit: ({ name, channels }) => `Las vías de depósito listadas para ${name} incluyen ${channels}. Confirma en la cuenta oficial qué opciones están habilitadas para tu cuenta verificada.`,
    kyc: ({ name, kyc }) => `La verificación de identidad de ${name} figura como ${kyc}. Documentos y límites exactos deben comprobarse en la cuenta oficial.`,
    restricted: ({ name, country }) => `La evidencia geográfica verificada de socios de NexuAlpha restringe ${name} para ${country}.`,
    app: ({ name }) => `${name} tiene una página NexuAlpha de descarga de app con enlaces oficiales de iOS y Android. Usa esa página antes de instalar o escanear un APK.`,
    official: ({ name, domain }) => `El dominio oficial registrado de ${name} es ${domain}. Verifica el dominio antes de iniciar sesión, hacer KYC o depositar.`,
    officialQuestion: ({ name }) => `dominio oficial de ${name}`,
    restrictedQuestion: ({ name, country }) => `${name} disponibilidad en ${country}`,
    levels: { mandatory: "obligatoria", optional: "opcional", none: "no requerida" },
  },
  "pt-BR": {
    title: "Respostas rápidas",
    signup: ({ name, code }) => `Abra ${name} pela rota de cadastro do perfil e insira o código ${code} antes de criar a conta. Confira o domínio oficial antes de enviar dados pessoais.`,
    fees: ({ name, spot, perp, date }) => `As taxas base maker / taker da ${name} são ${spot} no spot e ${perp} em futuros ou perpétuos, verificadas em ${date}. Nível da conta, par, região e tela oficial podem alterar a taxa final.`,
    deposit: ({ name, channels }) => `As rotas de depósito listadas para ${name} incluem ${channels}. Confirme na conta oficial quais opções estão ativas para sua conta verificada.`,
    kyc: ({ name, kyc }) => `A verificação de identidade da ${name} está listada como ${kyc}. Documentos e limites exatos devem ser checados na conta oficial.`,
    restricted: ({ name, country }) => `A evidência geo verificada de parceiros da NexuAlpha restringe ${name} para ${country}.`,
    app: ({ name }) => `${name} tem uma página NexuAlpha de download do app com links oficiais de iOS e Android. Use essa página antes de instalar ou escanear APK.`,
    official: ({ name, domain }) => `O domínio oficial registrado da ${name} é ${domain}. Verifique o domínio antes de login, KYC ou depósito.`,
    officialQuestion: ({ name }) => `domínio oficial da ${name}`,
    restrictedQuestion: ({ name, country }) => `${name} disponibilidade em ${country}`,
    levels: { mandatory: "obrigatória", optional: "opcional", none: "não exigida" },
  },
  fr: {
    title: "Réponses rapides",
    signup: ({ name, code }) => `Ouvrez ${name} depuis le parcours d’inscription du profil et saisissez le code ${code} avant de créer le compte. Vérifiez le domaine officiel avant d’envoyer vos données.`,
    fees: ({ name, spot, perp, date }) => `Les frais de base maker / taker de ${name} sont ${spot} en spot et ${perp} en futures ou perpétuels, vérifiés le ${date}. Le niveau de compte, la paire, la région et l’écran officiel peuvent modifier le coût final.`,
    deposit: ({ name, channels }) => `Les voies de dépôt listées pour ${name} incluent ${channels}. Confirmez dans le compte officiel les options actives pour votre compte vérifié.`,
    kyc: ({ name, kyc }) => `La vérification d’identité de ${name} est indiquée comme ${kyc}. Les documents et limites exacts doivent être vérifiés dans le compte officiel.`,
    restricted: ({ name, country }) => `Les données géographiques partenaires vérifiées de NexuAlpha restreignent ${name} pour ${country}.`,
    app: ({ name }) => `${name} dispose d’une page NexuAlpha de téléchargement d’application avec les liens officiels iOS et Android. Consultez-la avant toute installation ou APK.`,
    official: ({ name, domain }) => `Le domaine officiel enregistré de ${name} est ${domain}. Vérifiez-le avant connexion, KYC ou dépôt.`,
    officialQuestion: ({ name }) => `domaine officiel de ${name}`,
    restrictedQuestion: ({ name, country }) => `${name} disponibilité en ${country}`,
    levels: { mandatory: "obligatoire", optional: "facultative", none: "non requise" },
  },
  de: {
    title: "Schnelle Antworten",
    signup: ({ name, code }) => `Öffne ${name} über den Registrierungsweg im Profil und gib den Code ${code} vor der Kontoerstellung ein. Prüfe die offizielle Domain, bevor du persönliche Daten sendest.`,
    fees: ({ name, spot, perp, date }) => `Die Basisgebühren von ${name} für Maker / Taker betragen ${spot} im Spot-Handel und ${perp} für Futures oder Perpetuals, geprüft am ${date}. Konto-Level, Paar, Region und offizieller Bildschirm können die Endgebühr ändern.`,
    deposit: ({ name, channels }) => `Für ${name} sind im Profil diese Einzahlungswege gelistet: ${channels}. Prüfe im offiziellen Konto, was für dein verifiziertes Konto aktiv ist.`,
    kyc: ({ name, kyc }) => `Die Identitätsprüfung bei ${name} ist als ${kyc} gelistet. Exakte Dokumente und Limits stehen im offiziellen Konto.`,
    restricted: ({ name, country }) => `Verifizierte NexuAlpha-Partner-Geodaten schränken ${name} für ${country} ein.`,
    app: ({ name }) => `${name} hat eine NexuAlpha-App-Download-Prüfseite mit offiziellen iOS- und Android-Store-Links. Nutze sie vor Installation oder APK-Scan.`,
    official: ({ name, domain }) => `Die erfasste offizielle Domain von ${name} ist ${domain}. Prüfe sie vor Login, KYC oder Einzahlung.`,
    officialQuestion: ({ name }) => `${name} offizielle Domain`,
    restrictedQuestion: ({ name, country }) => `${name} Verfügbarkeit in ${country}`,
    levels: { mandatory: "verpflichtend", optional: "optional", none: "nicht erforderlich" },
  },
  it: {
    title: "Risposte rapide",
    signup: ({ name, code }) => `Apri ${name} dal percorso di registrazione del profilo e inserisci il codice ${code} prima di creare l’account. Controlla il dominio ufficiale prima di inviare dati personali.`,
    fees: ({ name, spot, perp, date }) => `Le commissioni base maker / taker di ${name} sono ${spot} su spot e ${perp} su futures o perpetual, verificate il ${date}. Livello account, coppia, regione e schermata ufficiale possono cambiare la commissione finale.`,
    deposit: ({ name, channels }) => `I canali di deposito indicati per ${name} includono ${channels}. Conferma nell’account ufficiale cosa è attivo per il tuo profilo verificato.`,
    kyc: ({ name, kyc }) => `La verifica identità di ${name} è indicata come ${kyc}. Documenti e limiti esatti vanno controllati nell’account ufficiale.`,
    restricted: ({ name, country }) => `Le evidenze geo partner verificate di NexuAlpha limitano ${name} per ${country}.`,
    app: ({ name }) => `${name} ha una pagina NexuAlpha per il download app con link ufficiali iOS e Android. Usala prima di installare o scansionare APK.`,
    official: ({ name, domain }) => `Il dominio ufficiale registrato di ${name} è ${domain}. Verificalo prima di login, KYC o deposito.`,
    officialQuestion: ({ name }) => `dominio ufficiale ${name}`,
    restrictedQuestion: ({ name, country }) => `${name} disponibilità in ${country}`,
    levels: { mandatory: "obbligatoria", optional: "opzionale", none: "non richiesta" },
  },
  ja: {
    title: "クイック回答",
    signup: ({ name, code }) => `${name} はプロフィールの登録ルートから開き、アカウント作成前にコード ${code} を入力します。個人情報を送る前に公式ドメインを確認してください。`,
    fees: ({ name, spot, perp, date }) => `${name} の基本 maker / taker 手数料は、現物が ${spot}、先物またはパーペチュアルが ${perp}、確認日は ${date} です。アカウント階層、銘柄、地域、公式画面の条件で最終手数料は変わります。`,
    deposit: ({ name, channels }) => `${name} のプロフィールにある入金経路は ${channels} です。認証済みアカウントで有効な方法は公式アカウント画面で確認してください。`,
    kyc: ({ name, kyc }) => `${name} の本人確認は ${kyc} と記録されています。必要書類と上限は公式アカウント画面で確認してください。`,
    restricted: ({ name, country }) => `NexuAlpha の検証済みパートナー地域証拠では、${name} は ${country} で制限されています。`,
    app: ({ name }) => `${name} には公式 iOS / Android ストアリンクを確認する NexuAlpha のアプリダウンロードページがあります。APK のインストール前に確認してください。`,
    official: ({ name, domain }) => `${name} の記録済み公式ドメインは ${domain} です。ログイン、KYC、入金前に確認してください。`,
    officialQuestion: ({ name }) => `${name} 公式ドメイン`,
    restrictedQuestion: ({ name, country }) => `${name} は ${country} で使えますか`,
    levels: { mandatory: "必須", optional: "任意", none: "不要" },
  },
  ko: {
    title: "빠른 답변",
    signup: ({ name, code }) => `${name} 프로필의 등록 경로에서 열고 계정 생성 전에 코드 ${code}를 입력합니다. 개인정보를 제출하기 전에 공식 도메인을 확인하세요.`,
    fees: ({ name, spot, perp, date }) => `${name} 기본 maker / taker 수수료는 현물 ${spot}, 선물 또는 무기한 ${perp}이며 확인일은 ${date}입니다. 계정 등급, 페어, 지역, 공식 화면 조건에 따라 최종 수수료가 달라질 수 있습니다.`,
    deposit: ({ name, channels }) => `${name} 프로필에 기록된 입금 경로는 ${channels}입니다. 인증된 계정에서 활성화된 옵션은 공식 계정 화면에서 확인하세요.`,
    kyc: ({ name, kyc }) => `${name} 본인 인증은 ${kyc}로 기록되어 있습니다. 정확한 서류와 한도는 공식 계정 화면에서 확인해야 합니다.`,
    restricted: ({ name, country }) => `NexuAlpha의 검증된 파트너 지역 증거에 따르면 ${name}은 ${country}에서 제한됩니다.`,
    app: ({ name }) => `${name}에는 공식 iOS 및 Android 스토어 링크를 확인하는 NexuAlpha 앱 다운로드 페이지가 있습니다. APK 설치 전에 해당 페이지를 확인하세요.`,
    official: ({ name, domain }) => `${name}의 기록된 공식 도메인은 ${domain}입니다. 로그인, KYC, 입금 전에 확인하세요.`,
    officialQuestion: ({ name }) => `${name} 공식 도메인`,
    restrictedQuestion: ({ name, country }) => `${name} ${country} 이용 가능 여부`,
    levels: { mandatory: "필수", optional: "선택", none: "불필요" },
  },
  tr: {
    title: "Hızlı cevaplar",
    signup: ({ name, code }) => `${name} profilindeki kayıt yolunu açın ve hesabı oluşturmadan önce ${code} kodunu girin. Kişisel bilgi göndermeden önce resmi alan adını kontrol edin.`,
    fees: ({ name, spot, perp, date }) => `${name} temel maker / taker komisyonu spot için ${spot}, futures veya perpetual için ${perp}; kontrol tarihi ${date}. Hesap seviyesi, parite, bölge ve resmi ekrandaki koşullar nihai ücreti değiştirebilir.`,
    deposit: ({ name, channels }) => `${name} profilinde listelenen para yatırma yolları ${channels}. Doğrulanmış hesabınızda hangi seçeneklerin açık olduğunu resmi hesap ekranından kontrol edin.`,
    kyc: ({ name, kyc }) => `${name} kimlik doğrulaması ${kyc} olarak listelenir. Kesin belge ve limitler resmi hesap ekranında kontrol edilmelidir.`,
    restricted: ({ name, country }) => `Doğrulanmış NexuAlpha partner bölge kanıtları ${name} için ${country} pazarını sınırlar.`,
    app: ({ name }) => `${name} için resmi iOS ve Android mağaza bağlantılarını gösteren NexuAlpha app indirme kontrol sayfası var. APK kurmadan önce bu sayfayı kullanın.`,
    official: ({ name, domain }) => `${name} için kayıtlı resmi alan adı ${domain}. Giriş, KYC veya para yatırma öncesinde doğrulayın.`,
    officialQuestion: ({ name }) => `${name} resmi alan adı`,
    restrictedQuestion: ({ name, country }) => `${name} ${country} kullanılabilir mi`,
    levels: { mandatory: "zorunlu", optional: "isteğe bağlı", none: "gerekli değil" },
  },
  id: {
    title: "Jawaban cepat",
    signup: ({ name, code }) => `Buka ${name} dari jalur pendaftaran profil dan masukkan kode ${code} sebelum akun dibuat. Periksa domain resmi sebelum mengirim data pribadi.`,
    fees: ({ name, spot, perp, date }) => `Biaya dasar maker / taker ${name} adalah ${spot} untuk spot dan ${perp} untuk futures atau perpetual, dicek pada ${date}. Level akun, pair, wilayah, dan layar resmi bisa mengubah biaya akhir.`,
    deposit: ({ name, channels }) => `Rute deposit yang tercatat untuk ${name} mencakup ${channels}. Konfirmasi opsi aktif untuk akun terverifikasi Anda di layar akun resmi.`,
    kyc: ({ name, kyc }) => `Verifikasi identitas ${name} tercatat sebagai ${kyc}. Dokumen dan limit tepat harus dicek di layar akun resmi.`,
    restricted: ({ name, country }) => `Bukti geo partner NexuAlpha yang terverifikasi membatasi ${name} untuk ${country}.`,
    app: ({ name }) => `${name} memiliki halaman cek download app NexuAlpha dengan tautan resmi iOS dan Android. Gunakan halaman itu sebelum memasang atau memindai APK.`,
    official: ({ name, domain }) => `Domain resmi ${name} yang tercatat adalah ${domain}. Verifikasi sebelum login, KYC, atau deposit.`,
    officialQuestion: ({ name }) => `domain resmi ${name}`,
    restrictedQuestion: ({ name, country }) => `ketersediaan ${name} di ${country}`,
    levels: { mandatory: "wajib", optional: "opsional", none: "tidak diperlukan" },
  },
});

const NEUTRAL_COPY = {
  "zh-Hant": {
    title: "快速解答", fees: ({name,spot,perp,date}) => `${name} 基礎 maker / taker 費率：現貨 ${spot}，合約 ${perp}；核對日期 ${date}。實際費率取決於帳戶等級、交易對及地區。`,
    deposit: ({name,channels}) => `${name} 列出的入金方式包括 ${channels}。請在官方帳戶確認可用方式。`,
    kyc: ({name,kyc}) => `${name} 的身分認證為${kyc}。所需文件及額度請查閱官方帳戶。`,
    restricted: ({name,country}) => `${name} 的已核對條款列出 ${country} 為受限制地區。`,
    app: ({name}) => `${name} 的 App 下載頁提供官方 iOS 和 Android 商店連結。`,
    official: ({name,domain}) => `${name} 的官方網域是 ${domain}。登入及入金前請核對網域。`, officialQuestion: ({name}) => `${name} 官方網域`, availabilityQuestion: ({name,country}) => `${name} 在 ${country} 可用嗎？`, levels:{mandatory:"必須完成",optional:"可選",none:"不需要"}
  },
  ru: {
    title:"Краткие ответы", fees:({name,spot,perp,date})=>`Базовые комиссии maker / taker ${name}: спот ${spot}, фьючерсы ${perp}; проверено ${date}. Итоговая комиссия зависит от уровня счёта, пары и региона.`,
    deposit:({name,channels})=>`Способы пополнения ${name}: ${channels}. Доступные варианты проверяйте в официальном аккаунте.`, kyc:({name,kyc})=>`Проверка личности в ${name}: ${kyc}. Документы и лимиты уточняйте в официальном аккаунте.`, restricted:({name,country})=>`В проверенных условиях ${name} регион ${country} указан как ограниченный.`, app:({name})=>`На странице приложения ${name} доступны официальные ссылки для iOS и Android.`, official:({name,domain})=>`Официальный домен ${name}: ${domain}. Проверьте его перед входом или пополнением.`, officialQuestion:({name})=>`${name} официальный домен`, availabilityQuestion:({name,country})=>`Доступна ли ${name} в ${country}?`, levels:{mandatory:"обязательна",optional:"необязательна",none:"не требуется"}
  },
  ar: {
    title:"إجابات سريعة", fees:({name,spot,perp,date})=>`رسوم maker / taker الأساسية في ${name}: الفوري ${spot} والعقود الآجلة ${perp}؛ تاريخ التحقق ${date}. تختلف الرسوم النهائية حسب مستوى الحساب والزوج والمنطقة.`,
    deposit:({name,channels})=>`طرق الإيداع المدرجة لدى ${name}: ${channels}. تحقق من الخيارات المتاحة في الحساب الرسمي.`, kyc:({name,kyc})=>`التحقق من الهوية لدى ${name}: ${kyc}. راجع المستندات والحدود في الحساب الرسمي.`, restricted:({name,country})=>`تدرج شروط ${name} التي تم التحقق منها ${country} ضمن المناطق المقيدة.`, app:({name})=>`توفر صفحة تطبيق ${name} روابط المتاجر الرسمية لنظامي iOS وAndroid.`, official:({name,domain})=>`النطاق الرسمي لـ ${name} هو ${domain}. تحقّق منه قبل الدخول أو الإيداع.`, officialQuestion:({name})=>`النطاق الرسمي لـ ${name}`, availabilityQuestion:({name,country})=>`هل ${name} متاحة في ${country}؟`, levels:{mandatory:"إلزامي",optional:"اختياري",none:"غير مطلوب"}
  },
  ur: {
    title:"مختصر جواب", fees:({name,spot,perp,date})=>`${name} کی بنیادی maker / taker فیس: اسپاٹ ${spot}، فیوچرز ${perp}؛ تصدیق کی تاریخ ${date}۔ حتمی فیس اکاؤنٹ کی سطح، جوڑی اور علاقے پر منحصر ہے۔`,
    deposit:({name,channels})=>`${name} میں درج ڈپازٹ کے طریقے: ${channels}۔ دستیاب طریقے سرکاری اکاؤنٹ میں دیکھیں۔`, kyc:({name,kyc})=>`${name} میں شناختی تصدیق ${kyc} ہے۔ دستاویزات اور حدود سرکاری اکاؤنٹ میں دیکھیں۔`, restricted:({name,country})=>`${name} کی تصدیق شدہ شرائط میں ${country} محدود علاقہ ہے۔`, app:({name})=>`${name} کے ایپ صفحے پر iOS اور Android کے سرکاری اسٹور لنکس ہیں۔`, official:({name,domain})=>`${name} کا سرکاری ڈومین ${domain} ہے۔ لاگ ان یا ڈپازٹ سے پہلے اسے چیک کریں۔`, officialQuestion:({name})=>`${name} کا سرکاری ڈومین`, availabilityQuestion:({name,country})=>`کیا ${name} ${country} میں دستیاب ہے؟`, levels:{mandatory:"لازمی",optional:"اختیاری",none:"غیر ضروری"}
  },
  uk: {
    title:"Короткі відповіді", fees:({name,spot,perp,date})=>`Базові комісії maker / taker ${name}: спот ${spot}, ф’ючерси ${perp}; перевірено ${date}. Остаточна комісія залежить від рівня рахунку, пари та регіону.`,
    deposit:({name,channels})=>`Способи поповнення ${name}: ${channels}. Перевірте доступні варіанти в офіційному акаунті.`, kyc:({name,kyc})=>`Перевірка особи в ${name}: ${kyc}. Документи й ліміти уточнюйте в офіційному акаунті.`, restricted:({name,country})=>`У перевірених умовах ${name} регіон ${country} зазначено як обмежений.`, app:({name})=>`Сторінка застосунку ${name} містить офіційні посилання для iOS і Android.`, official:({name,domain})=>`Офіційний домен ${name}: ${domain}. Перевірте його перед входом або поповненням.`, officialQuestion:({name})=>`${name} офіційний домен`, availabilityQuestion:({name,country})=>`Чи доступна ${name} у ${country}?`, levels:{mandatory:"обов’язкова",optional:"необов’язкова",none:"не потрібна"}
  },
  vi: {
    title:"Trả lời nhanh", fees:({name,spot,perp,date})=>`Phí maker / taker cơ bản của ${name}: giao ngay ${spot}, hợp đồng tương lai ${perp}; kiểm tra ngày ${date}. Phí cuối cùng phụ thuộc cấp tài khoản, cặp giao dịch và khu vực.`,
    deposit:({name,channels})=>`Các phương thức nạp tiền được liệt kê cho ${name}: ${channels}. Kiểm tra phương thức khả dụng trong tài khoản chính thức.`, kyc:({name,kyc})=>`Xác minh danh tính tại ${name}: ${kyc}. Kiểm tra giấy tờ và hạn mức trong tài khoản chính thức.`, restricted:({name,country})=>`Điều khoản đã kiểm tra của ${name} liệt kê ${country} là khu vực hạn chế.`, app:({name})=>`Trang ứng dụng ${name} cung cấp liên kết cửa hàng chính thức cho iOS và Android.`, official:({name,domain})=>`Tên miền chính thức của ${name} là ${domain}. Kiểm tra trước khi đăng nhập hoặc nạp tiền.`, officialQuestion:({name})=>`tên miền chính thức ${name}`, availabilityQuestion:({name,country})=>`${name} có khả dụng tại ${country} không?`, levels:{mandatory:"bắt buộc",optional:"tùy chọn",none:"không bắt buộc"}
  }
};
const CHANNEL_COPY = {
  en:["Credit Card","Bank Transfer","Bank Wire","Third-party gateways","Crypto Deposit","Select Bank Transfer"],
  "zh-Hans":["信用卡","银行转账","银行电汇","第三方支付渠道","加密资产充值","部分银行转账"], "zh-Hant":["信用卡","銀行轉帳","銀行電匯","第三方支付管道","加密資產入金","部分銀行轉帳"],
  es:["tarjeta de crédito","transferencia bancaria","transferencia bancaria","pasarelas de terceros","depósito de criptomonedas","transferencias bancarias seleccionadas"], "pt-BR":["cartão de crédito","transferência bancária","transferência bancária","provedores de pagamento","depósito de cripto","transferências bancárias selecionadas"],
  fr:["carte de crédit","virement bancaire","virement bancaire","prestataires tiers","dépôt crypto","certains virements bancaires"], de:["Kreditkarte","Banküberweisung","Banküberweisung","Drittanbieter","Krypto-Einzahlung","ausgewählte Banküberweisungen"], it:["carta di credito","bonifico bancario","bonifico bancario","fornitori terzi","deposito crypto","alcuni bonifici bancari"],
  ja:["クレジットカード","銀行振込","銀行送金","第三者決済サービス","暗号資産入金","一部の銀行振込"], ko:["신용카드","은행 송금","은행 송금","제삼자 결제 서비스","암호자산 입금","일부 은행 송금"], tr:["kredi kartı","banka havalesi","banka havalesi","üçüncü taraf sağlayıcılar","kripto yatırma","belirli banka havaleleri"], id:["kartu kredit","transfer bank","transfer bank","penyedia pihak ketiga","deposit kripto","transfer bank tertentu"],
  ru:["кредитная карта","банковский перевод","банковский перевод","сторонние сервисы","криптовалютный депозит","отдельные банковские переводы"], ar:["بطاقة ائتمان","تحويل بنكي","تحويل بنكي","مزودون خارجيون","إيداع العملات الرقمية","تحويلات بنكية محددة"], ur:["کریڈٹ کارڈ","بینک ٹرانسفر","بینک ٹرانسفر","تیسرے فریق کے فراہم کنندگان","کرپٹو ڈپازٹ","منتخب بینک ٹرانسفر"], uk:["кредитна картка","банківський переказ","банківський переказ","сторонні сервіси","криптовалютний депозит","окремі банківські перекази"], vi:["thẻ tín dụng","chuyển khoản ngân hàng","chuyển khoản ngân hàng","nhà cung cấp bên thứ ba","nạp tiền mã hóa","một số chuyển khoản ngân hàng"]
};
function channelNames(channels, locale) {
  const translated = CHANNEL_COPY[localeKey(locale)] || CHANNEL_COPY.en;
  return channels.map(channel => { const index = CHANNEL_COPY.en.indexOf(channel); return index < 0 ? channel : translated[index]; }).join(", ");
}

const copyFor = (locale) => NEUTRAL_COPY[localeKey(locale)] || COPY[localeKey(locale)] || COPY.en;

function localeKey(locale) {
  const raw = String(locale || "en");
  if (/^id([-_]|$)/i.test(raw)) return "id";
  if (/^pt[-_]br/i.test(raw)) return "pt-BR";
  if (/^zh[-_]hans/i.test(raw)) return "zh-Hans";
  if (/^zh[-_](hant|tw|hk)/i.test(raw)) return "zh-Hant";
  return COPY[raw] || NEUTRAL_COPY[raw] ? raw : raw.split(/[-_]/)[0];
}

function normalizeSlug(slug) {
  return String(slug || "").trim().toLowerCase();
}

function question(slug, locale, index) {
  const key = localeKey(locale);
  return QUESTION[key]?.[slug]?.[index] || (GENERIC_QUESTIONS[key] ? `${slug} ${GENERIC_QUESTIONS[key][index]}` : QUESTION.en[slug]?.[index]) || `${slug} quick answer`;
}

function sources(...values) {
  return [...new Set(values.flat().filter((value) => typeof value === "string" && value.startsWith("https://")))];
}

function makeItem(questionText, answer, href, sourceUrls = []) {
  return { question: questionText, answer, href, ...(sourceUrls.length ? { sources: sourceUrls } : {}) };
}

function profilePath(slug, hash) {
  return `/exchanges/${slug}${hash}`;
}

function localizedKyc(db, locale, copy) {
  const exact = db.kycSummary?.[locale] || db.kycSummary?.[localeKey(locale)];
  if (exact) return exact;
  if (localeKey(locale) === "en" && db.kycSummary?.en) return db.kycSummary.en;
  return copy.levels[db.kycLevel] || db.kycLevel || null;
}

function feeAnswer(slug, locale, copy, name) {
  const spot = feeFact(slug, "spot");
  const perp = feeFact(slug, "perp");
  if (spot.state !== "checked" || perp.state !== "checked") return null;
  const spotText = feeDisplay(slug, "spot", locale);
  const perpText = feeDisplay(slug, "perp", locale);
  const date = spot.checkedOn === perp.checkedOn ? spot.checkedOn : [spot.checkedOn, perp.checkedOn].filter(Boolean).join(" / ");
  if (!spotText || !perpText || !date) return null;
  return makeItem(question(slug, locale, 1), copy.fees({ name, spot: spotText, perp: perpText, date }), profilePath(slug, "#fee-schedule"), sources(primarySourceUrl(slug)));
}

function verifiedGeoRestriction(slug, context) {
  const gate = partnerPromotionGate(slug, { ...context, market: context.market || QUERY_COUNTRY[localeKey(context.locale)] });
  const country = gate?.country;
  if (!country) return null;
  const row = (PARTNER_GEO_RESTRICTIONS[slug] || []).find((entry) => entry.country === country && entry.verified);
  return row ? { country, source: row.source } : null;
}

export function quickAnswersForExchange(slug, locale = "en", market) {
  const key = normalizeSlug(slug);
  if (!QUICK_ANSWER_EXCHANGE_SLUGS.includes(key)) return null;
  const turkeyGate = partnerPromotionGate(key, { locale, market })?.country === "TR";
  if (key === "bitget" && (localeKey(locale) === "tr" || turkeyGate)) return null;

  const db = venueDatabase[key];
  if (!db) return null;

  const copy = copyFor(locale);
  const name = db.name || PARTNERS[key]?.name || key;
  const items = [];
  const signupAllowed = !isNeutralCtaLocale(locale) && isPartnerPromotableIn(key, { locale, market });

  if (signupAllowed && PARTNERS[key]?.inviteCode) {
    items.push(makeItem(question(key, locale, 0), copy.signup({ name, code: PARTNERS[key].inviteCode }), profilePath(key, "#registration-path"), sources(PARTNERS[key].registrationUrl)));
  }

  const fees = feeAnswer(key, locale, copy, name);
  if (fees) items.push(fees);

  if (Array.isArray(db.fiatChannels) && db.fiatChannels.length) {
    items.push(makeItem(question(key, locale, 2), copy.deposit({ name, channels: channelNames(db.fiatChannels, locale) }), profilePath(key, "#faq"), sources(db.officialVerifyUrl || (db.officialDomain ? `https://${db.officialDomain}` : null))));
  }

  const kyc = localizedKyc(db, locale, copy);
  if (kyc) {
    items.push(makeItem(question(key, locale, 3), copy.kyc({ name, kyc }), profilePath(key, "#faq"), sources(db.officialVerifyUrl || (db.officialDomain ? `https://${db.officialDomain}` : null))));
  }

  const restriction = verifiedGeoRestriction(key, { locale, market });
  if (restriction) {
    items.push(makeItem(copy.availabilityQuestion ? copy.availabilityQuestion({name,country:restriction.country}) : `${name} ${GENERIC_QUESTIONS[localeKey(locale)]?.[4] || (localeKey(locale) === "zh-Hans" ? "可用地区" : "availability")} (${restriction.country})`, copy.restricted({ name, country: COUNTRY_NAMES[restriction.country] || restriction.country }), profilePath(key, "#faq"), sources(restriction.source)));
  }

  if (APP_DOWNLOAD_SLUGS.includes(key)) {
    items.push(makeItem(question(key, locale, 5), copy.app({ name }), appDownloadPath(key), sources(db.officialVerifyUrl || (db.officialDomain ? `https://${db.officialDomain}` : null))));
  } else if (db.officialDomain) {
    items.push(makeItem(copy.officialQuestion({ name }), copy.official({ name, domain: db.officialDomain }), profilePath(key, "#faq"), sources(`https://${db.officialDomain}`)));
  }

  const seen = new Set();
  const deduped = [];
  for (const entry of items) {
    const id = `${entry.question}|${entry.answer}`;
    if (!entry.question || !entry.answer || !entry.href || seen.has(id)) continue;
    seen.add(id);
    deduped.push(entry);
    if (deduped.length === 6) break;
  }
  return deduped.length ? { title: copy.title, items: deduped } : null;
}

export function quickAnswerEntities(slug, locale = "en", market) {
  const block = quickAnswersForExchange(slug, locale, market);
  if (!block) return [];
  return block.items.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: entry.answer,
      ...(entry.sources?.length ? { citation: entry.sources } : {}),
    },
  }));
}
