import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];

const expected = {
  en: {
    stats: ['Token contract', 'Verify official or on-chain source first', 'Liquidity route', 'Separate CEX order books from DEX pools', 'Approval risk', 'Check approval, signature and revoke path', 'Exit conditions', 'Verify withdrawal, bridge, stablecoin and region terms'],
    pain: ['Listing notice, pair availability and account terms can diverge', 'MEV Sandwich Attacks & Slippage Bleed', 'Contract permissions, approvals and exit paths can be opaque'],
    pillars: ['Notice, pair and funding status', 'Orderbook Depth', 'Published cost and exit friction', 'Security Safeguards'],
    source: ['Platform / Type', 'Evidence status', 'Announcements to check', 'Published fee schedule', 'Applicable fee terms', 'Market and account checks', 'Profile and account route'],
  },
  'zh-Hans': {
    stats: ['合约地址', '先核对官方或链上来源', '流动性路径', '分开看 CEX 盘口与 DEX 池子', '授权风险', '核对授权、签名与撤销路径', '退出条件', '提现、桥、稳定币和地区条件需核验'],
    pain: ['上线公告、交易对与账户条件不一致', '链上抢跑 MEV 夹子与极端滑点磨损', '合约权限、授权和退出路径不透明'],
    pillars: ['公告、交易对与充值提现状态', '盘口挂单流动性深度', '公开费用、网络费与退出成本', '安全防御与合约筛查'],
    source: ['交易平台 / 定位', '证据状态', '待核对公告', '公开费率表', '适用费率条款', '市场与账户条件', '平台档案与开户路径'],
  },
  'zh-Hant': {
    stats: ['合約地址', '先核對官方或鏈上來源', '流動性路徑', '分開看 CEX 盤口與 DEX 池子', '授權風險', '核對授權、簽名與撤銷路徑', '退出條件', '提領、橋、穩定幣和地區條件需核驗'],
    pain: ['上線公告、交易對與帳戶條件不一致', '鏈上 MEV 夾子與極端滑點磨損', '合約權限、授權和退出路徑不透明'],
    pillars: ['公告、交易對與充值提領狀態', '盤口掛單流動性深度', '公開費用、網路費與退出成本', '安全防禦與合約篩查'],
    source: ['交易平台 / 定位', '證據狀態', '待核對公告', '公開費率表', '適用費率條款', '市場與帳戶條件', '平台檔案與開戶路徑'],
  },
  ja: {
    stats: ['トークンコントラクト', '公式またはオンチェーンの出典を先に確認', '流動性ルート', 'CEX の板と DEX のプールを分けて確認', '承認リスク', '承認、署名、revoke 経路を確認', '退出条件', '出金、ブリッジ、ステーブルコイン、地域条件を確認'],
    pain: ['上場告知、取引ペア、アカウント条件は一致しない場合があります', 'MEVサンドイッチと極端なスリッページ損耗', 'コントラクト権限、承認、退出経路が不透明な場合があります'],
    pillars: ['告知、ペア、入出金状態', '板の深さ', '公開コストと退出時の摩擦', 'セキュリティ確認項目'],
    source: ['プラットフォーム / 種別', '証拠の状態', '確認すべき告知', '公開手数料表', '適用される手数料条件', '市場とアカウント条件', 'プロフィールとアカウント経路'],
  },
  ko: {
    stats: ['토큰 컨트랙트', '공식 또는 온체인 출처를 먼저 확인', '유동성 경로', 'CEX 오더북과 DEX 풀을 분리해 확인', '승인 위험', '승인, 서명, revoke 경로 확인', '출구 조건', '출금, 브리지, 스테이블코인, 지역 조건 확인'],
    pain: ['상장 공지, 거래쌍, 계정 조건은 달라질 수 있음', 'MEV 샌드위치와 극단적 슬리피지 손실', '컨트랙트 권한, 승인, 출구 경로가 불투명할 수 있음'],
    pillars: ['공지, 거래쌍, 입출금 상태', '오더북 깊이', '공개 비용과 출구 마찰', '보안 점검 항목'],
    source: ['플랫폼 / 유형', '증거 상태', '확인할 공지', '공개 수수료표', '적용 수수료 조건', '시장 및 계정 조건', '프로필과 계정 경로'],
  },
  tr: {
    stats: ['Token kontratı', 'Önce resmi veya zincir üstü kaynağı doğrulayın', 'Likidite rotası', 'CEX emir defterlerini DEX havuzlarından ayırın', 'Onay riski', 'Onay, imza ve revoke yolunu kontrol edin', 'Çıkış koşulları', 'Çekim, köprü, stablecoin ve bölge koşullarını doğrulayın'],
    pain: ['Listeleme duyurusu, çift erişimi ve hesap koşulları ayrışabilir', 'MEV sandwich ve aşırı slippage aşınması', 'Kontrat izinleri, onaylar ve çıkış yolları opak olabilir'],
    pillars: ['Duyuru, çift ve fonlama durumu', 'Emir defteri derinliği', 'Yayınlanmış maliyet ve çıkış sürtünmesi', 'Güvenlik kontrol başlıkları'],
    source: ['Platform / tür', 'Kanıt durumu', 'Kontrol edilecek duyurular', 'Yayınlanmış ücret tablosu', 'Geçerli ücret koşulları', 'Piyasa ve hesap kontrolleri', 'Profil ve hesap rotası'],
  },
  es: {
    stats: ['Contrato del token', 'Verifica primero la fuente oficial u on-chain', 'Ruta de liquidez', 'Separa libros CEX de pools DEX', 'Riesgo de aprobación', 'Comprueba aprobación, firma y ruta de revoke', 'Condiciones de salida', 'Verifica retiro, puente, stablecoin y términos regionales'],
    pain: ['Aviso de listado, par y condiciones de cuenta pueden divergir', 'MEV sandwich y desgaste por slippage extremo', 'Permisos del contrato, aprobaciones y rutas de salida pueden ser opacos'],
    pillars: ['Aviso, par y estado de fondos', 'Profundidad del libro de órdenes', 'Coste publicado y fricción de salida', 'Controles de seguridad'],
    source: ['Plataforma / tipo', 'Estado de evidencia', 'Anuncios por verificar', 'Tabla de comisiones publicada', 'Condiciones de comisión aplicables', 'Controles de mercado y cuenta', 'Perfil y ruta de cuenta'],
  },
  'pt-BR': {
    stats: ['Contrato do token', 'Verifique primeiro a fonte oficial ou on-chain', 'Rota de liquidez', 'Separe livros CEX de pools DEX', 'Risco de aprovação', 'Confira aprovação, assinatura e rota de revoke', 'Condições de saída', 'Verifique saque, ponte, stablecoin e termos regionais'],
    pain: ['Aviso de listagem, par e condições da conta podem divergir', 'MEV sandwich e desgaste por slippage extremo', 'Permissões do contrato, aprovações e rotas de saída podem ser opacas'],
    pillars: ['Aviso, par e status de fundos', 'Profundidade do livro de ofertas', 'Custo publicado e fricção de saída', 'Controles de segurança'],
    source: ['Plataforma / tipo', 'Status da evidência', 'Anúncios a verificar', 'Tabela de taxas publicada', 'Termos de taxa aplicáveis', 'Checagens de mercado e conta', 'Perfil e rota de conta'],
  },
  fr: {
    stats: ['Contrat du token', 'Vérifiez d’abord la source officielle ou on-chain', 'Route de liquidité', 'Séparer carnets CEX et pools DEX', 'Risque d’approbation', 'Vérifier approbation, signature et révocation', 'Conditions de sortie', 'Vérifier retrait, bridge, stablecoin et conditions régionales'],
    pain: ['Annonce de listing, paire et conditions de compte peuvent diverger', 'MEV sandwich et usure par slippage extrême', 'Autorisations du contrat, approbations et chemins de sortie peuvent être opaques'],
    pillars: ['Annonce, paire et état des fonds', 'Profondeur du carnet d’ordres', 'Coût publié et friction de sortie', 'Contrôles de sécurité'],
    source: ['Plateforme / type', 'Statut des preuves', 'Annonces à vérifier', 'Barème publié', 'Conditions de frais applicables', 'Contrôles marché et compte', 'Profil et route de compte'],
  },
  de: {
    stats: ['Token-Contract', 'Zuerst offizielle oder On-chain-Quelle prüfen', 'Liquiditätsroute', 'CEX-Orderbücher und DEX-Pools getrennt prüfen', 'Freigaberisiko', 'Freigabe, Signatur und Revoke-Pfad prüfen', 'Ausstiegsbedingungen', 'Auszahlung, Bridge, Stablecoin und regionale Bedingungen prüfen'],
    pain: ['Listing-Mitteilung, Handelspaar und Kontobedingungen können abweichen', 'MEV-Sandwich und extreme Slippage-Verluste', 'Contract-Berechtigungen, Freigaben und Ausstiegspfade können undurchsichtig sein'],
    pillars: ['Mitteilung, Paar und Funding-Status', 'Orderbuch-Tiefe', 'Veröffentlichte Kosten und Ausstiegsreibung', 'Sicherheitsprüfungen'],
    source: ['Plattform / Typ', 'Nachweisstatus', 'Zu prüfende Mitteilungen', 'Veröffentlichte Gebührentabelle', 'Anwendbare Gebührenbedingungen', 'Markt- und Konto-Checks', 'Profil und Kontopfad'],
  },
  ru: {
    stats: ['Контракт токена', 'Сначала проверьте официальный или ончейн-источник', 'Маршрут ликвидности', 'Разделяйте стаканы CEX и пулы DEX', 'Риск разрешений', 'Проверьте разрешение, подпись и маршрут revoke', 'Условия выхода', 'Проверьте вывод, мост, стейблкоин и региональные условия'],
    pain: ['Объявление листинга, пара и условия аккаунта могут расходиться', 'MEV-сэндвич и потери от экстремального проскальзывания', 'Права контракта, разрешения и маршруты выхода могут быть непрозрачными'],
    pillars: ['Объявление, пара и статус пополнения', 'Глубина стакана', 'Опубликованные издержки и трение выхода', 'Проверки безопасности'],
    source: ['Платформа / тип', 'Статус доказательств', 'Объявления для проверки', 'Опубликованная таблица комиссий', 'Применимые условия комиссий', 'Проверки рынка и аккаунта', 'Профиль и маршрут аккаунта'],
  },
  ar: {
    stats: ['عقد الرمز', 'تحقق أولاً من المصدر الرسمي أو على السلسلة', 'مسار السيولة', 'افصل دفاتر CEX عن مجمعات DEX', 'مخاطر التفويض', 'افحص التفويض والتوقيع ومسار الإلغاء', 'شروط الخروج', 'تحقق من السحب والجسر والعملات المستقرة والشروط الإقليمية'],
    pain: ['قد تختلف حالة الإعلان والزوج وشروط الحساب', 'MEV والانزلاق يحتاجان إلى فحص مسار الصفقة', 'أذونات العقد والتفويض ومسار الخروج قد تكون غير واضحة'],
    pillars: ['الإعلان والزوج وحالة التمويل', 'عمق دفتر الأوامر وسيولة المجمع', 'التكلفة المنشورة واحتكاك الخروج', 'العقد والتفويض والتحذيرات'],
    source: ['المنصة / النوع', 'حالة الدليل', 'إعلانات يجب التحقق منها', 'جدول الرسوم المنشور', 'شروط الرسوم المطبقة', 'فحوص السوق والحساب', 'الملف ومسار الحساب'],
  },
  id: {
    stats: ['Kontrak token', 'Periksa dulu sumber resmi atau on-chain', 'Rute likuiditas', 'Pisahkan orderbook CEX dari pool DEX', 'Risiko persetujuan', 'Periksa persetujuan, tanda tangan, dan jalur revoke', 'Ketentuan keluar', 'Verifikasi penarikan, bridge, stablecoin, dan ketentuan wilayah'],
    pain: ['Pengumuman listing, pasangan, dan ketentuan akun dapat berbeda', 'MEV sandwich dan kerugian slippage ekstrem', 'Izin kontrak, persetujuan, dan jalur keluar dapat tidak transparan'],
    pillars: ['Pengumuman, pasangan, dan status dana', 'Kedalaman orderbook', 'Biaya terbit dan friksi keluar', 'Pemeriksaan keamanan'],
    source: ['Platform / tipe', 'Status bukti', 'Pengumuman untuk dicek', 'Jadwal biaya terbit', 'Ketentuan biaya yang berlaku', 'Cek pasar dan akun', 'Profil dan rute akun'],
  },
  vi: {
    stats: ['Hợp đồng token', 'Kiểm tra nguồn chính thức hoặc on-chain trước', 'Tuyến thanh khoản', 'Tách sổ lệnh CEX khỏi pool DEX', 'Rủi ro phê duyệt', 'Kiểm tra phê duyệt, chữ ký và đường revoke', 'Điều kiện thoát', 'Xác minh rút tiền, bridge, stablecoin và điều kiện khu vực'],
    pain: ['Thông báo niêm yết, cặp giao dịch và điều kiện tài khoản có thể khác nhau', 'MEV sandwich và hao mòn do slippage cực đoan', 'Quyền hợp đồng, phê duyệt và đường thoát có thể thiếu minh bạch'],
    pillars: ['Thông báo, cặp và trạng thái nạp/rút', 'Độ sâu sổ lệnh', 'Chi phí công bố và ma sát khi thoát', 'Kiểm tra bảo mật'],
    source: ['Nền tảng / loại', 'Trạng thái bằng chứng', 'Thông báo cần kiểm tra', 'Bảng phí công bố', 'Điều khoản phí áp dụng', 'Kiểm tra thị trường và tài khoản', 'Hồ sơ và lộ trình tài khoản'],
  },
  it: {
    stats: ['Contratto del token', 'Verifica prima la fonte ufficiale o on-chain', 'Percorso di liquidità', 'Separa order book CEX e pool DEX', 'Rischio di approvazione', 'Controlla approvazione, firma e percorso di revoke', 'Condizioni di uscita', 'Verifica prelievo, bridge, stablecoin e condizioni regionali'],
    pain: ['Avviso di listing, coppia e condizioni account possono divergere', 'MEV sandwich e usura da slippage estremo', 'Permessi del contratto, approvazioni e percorsi di uscita possono essere opachi'],
    pillars: ['Avviso, coppia e stato fondi', 'Profondità order book', 'Costo pubblicato e attrito di uscita', 'Controlli di sicurezza'],
    source: ['Piattaforma / tipo', 'Stato delle prove', 'Annunci da verificare', 'Tabella commissioni pubblicata', 'Condizioni commissioni applicabili', 'Controlli mercato e account', 'Profilo e percorso account'],
  },
};




const expectedNavCategory = {
  en: 'Meme coins and on-chain trade checks',
  'zh-Hans': 'Meme 币与链上交易检查',
  'zh-Hant': 'Meme 幣與鏈上交易檢查',
  ja: 'ミームコインとオンチェーン取引確認',
  ko: '밈 코인과 온체인 거래 확인',
  tr: 'Meme coin ve zincir üstü işlem kontrolleri',
  es: 'Meme coins y controles de trading on-chain',
  'pt-BR': 'Meme coins e checagens de trading on-chain',
  fr: 'Meme coins et contrôles de trading on-chain',
  de: 'Meme-Coins und On-chain-Handelsprüfungen',
  ru: 'Мемкоины и проверки ончейн-торговли',
  ar: 'عملات الميم وفحوصات التداول على السلسلة',
  id: 'Meme coin dan pemeriksaan trading on-chain',
  vi: 'Meme coin và kiểm tra giao dịch on-chain',
  it: 'Meme coin e controlli di trading on-chain',
};

const expectedUpdatedPrefix = {
  en: 'Content updated',
  'zh-Hans': '内容更新',
  'zh-Hant': '內容更新',
  ja: '最終更新',
  ko: '최종 업데이트',
  tr: 'Son güncelleme',
  es: 'Última actualización',
  'pt-BR': 'Última atualização',
  fr: 'Dernière mise à jour',
  de: 'Zuletzt aktualisiert',
  ru: 'Последнее обновление',
  ar: 'آخر تحديث',
  id: 'Pembaruan terakhir',
  vi: 'Cập nhật lần cuối',
  it: 'Ultimo aggiornamento',
};

const expectedSectionCopy = {
  en: ['Risks and conditions to check', 'Platform conditions to check side by side', 'Use official sources to check published fees, access rules, execution risks and withdrawal conditions. Unverified figures remain pending.', 'These checks do not ensure capital safety or recovery of funds.'],
  'zh-Hans': ['风险与使用条件核对', '平台条件核对表', '通过官方来源核对公开费率、准入规则、执行风险与提现条件；尚未核验的数值保持待核验。', '这些检查不保证本金安全，也不保证资金能够追回。'],
  'zh-Hant': ['風險與使用條件核對', '平台條件核對表', '透過官方來源核對公開費率、准入規則、執行風險與提領條件；尚未核驗的數值維持待核驗。', '這些檢查不保證本金安全，也不保證資金能夠追回。'],
  ja: ['確認すべきリスクと利用条件', '横並びで確認するプラットフォーム条件', '公式出典で公開手数料、アクセス条件、実行リスク、出金条件を確認します。未確認の数値は確認待ちです。', 'これらの確認は元本保全や資金回収を保証しません。'],
  ko: ['확인할 위험과 이용 조건', '나란히 확인할 플랫폼 조건', '공식 출처로 공개 수수료, 접근 규칙, 실행 위험과 출금 조건을 확인합니다. 미확인 수치는 대기 상태로 유지합니다.', '이 확인은 원금 안전이나 자금 회수를 보장하지 않습니다.'],
  tr: ['Kontrol edilecek riskler ve kullanım koşulları', 'Platform koşullarını yan yana kontrol edin', 'Resmî kaynaklardan yayınlanmış ücretleri, erişim kurallarını, yürütme risklerini ve çekim koşullarını kontrol edin. Doğrulanmamış değerler beklemede kalır.', 'Bu kontroller sermaye güvenliğini veya fon kurtarmayı garanti etmez.'],
  es: ['Riesgos y condiciones de uso por comprobar', 'Condiciones de plataforma para comparar en paralelo', 'Usa fuentes oficiales para comprobar comisiones publicadas, reglas de acceso, riesgos de ejecución y condiciones de retiro. Las cifras no verificadas permanecen pendientes.', 'Estas comprobaciones no garantizan seguridad del capital ni recuperación de fondos.'],
  'pt-BR': ['Riscos e condições de uso a verificar', 'Condições de plataforma para comparar lado a lado', 'Use fontes oficiais para verificar taxas publicadas, regras de acesso, riscos de execução e condições de saque. Valores não verificados permanecem pendentes.', 'Essas verificações não garantem segurança do capital nem recuperação de fundos.'],
  fr: ['Risques et conditions d’utilisation à vérifier', 'Conditions de plateforme à comparer côte à côte', 'Utilisez les sources officielles pour vérifier les frais publiés, les règles d’accès, les risques d’exécution et les conditions de retrait. Les chiffres non vérifiés restent en attente.', 'Ces contrôles ne garantissent ni sécurité du capital ni récupération des fonds.'],
  de: ['Zu prüfende Risiken und Nutzungsbedingungen', 'Plattformbedingungen im Seitenvergleich prüfen', 'Prüfen Sie veröffentlichte Gebühren, Zugangsregeln, Ausführungsrisiken und Auszahlungsbedingungen anhand offizieller Quellen. Nicht verifizierte Werte bleiben ausstehend.', 'Diese Prüfungen garantieren weder Kapitalsicherheit noch Rückholung von Geldern.'],
  ru: ['Риски и условия использования для проверки', 'Условия платформ для параллельной проверки', 'Проверяйте опубликованные комиссии, правила доступа, риски исполнения и условия вывода по официальным источникам. Непроверенные значения остаются в ожидании.', 'Эти проверки не гарантируют сохранность капитала или возврат средств.'],
  ar: ['فحوص المخاطر والشروط', 'شروط المنصة للمقارنة', 'تحقق من الرسوم المنشورة وقواعد الوصول ومخاطر التنفيذ وشروط السحب من المصادر الرسمية.', 'هذه الفحوص لا تضمن سلامة رأس المال أو استرداد الأموال.'],
  id: ['Risiko dan ketentuan penggunaan yang perlu diperiksa', 'Ketentuan platform untuk dibandingkan berdampingan', 'Gunakan sumber resmi untuk memeriksa biaya yang dipublikasikan, aturan akses, risiko eksekusi, dan ketentuan penarikan. Angka yang belum diverifikasi tetap pending.', 'Pemeriksaan ini tidak menjamin keamanan modal atau pemulihan dana.'],
  vi: ['Rủi ro và điều kiện sử dụng cần kiểm tra', 'Điều kiện nền tảng cần đối chiếu song song', 'Dùng nguồn chính thức để kiểm tra phí công bố, quy tắc truy cập, rủi ro khớp lệnh và điều kiện rút tiền. Số liệu chưa xác minh vẫn ở trạng thái chờ.', 'Các bước kiểm tra này không bảo đảm an toàn vốn hoặc thu hồi tiền.'],
  it: ['Rischi e condizioni d’uso da verificare', 'Condizioni delle piattaforme da confrontare affiancate', 'Usa fonti ufficiali per verificare commissioni pubblicate, regole di accesso, rischi di esecuzione e condizioni di prelievo. I valori non verificati restano in sospeso.', 'Questi controlli non garantiscono sicurezza del capitale né recupero dei fondi.'],
};

const expectedTelegram = {
  en: ['Open published fee, spread and exit-cost checks', 'Subscribe to reviewed-source pair and announcement alerts'],
  'zh-Hans': ['打开公开费用、价差和退出成本检查', '订阅已审阅来源的交易对和公告提醒'],
  'zh-Hant': ['開啟公開費用、價差和退出成本檢查', '訂閱已審閱來源的交易對與公告提醒'],
  ja: ['公開手数料、スプレッド、退出コストの確認を開く', 'レビュー済み出典のペアと告知アラートを確認'],
  ko: ['공개 수수료, 스프레드, 출구 비용 확인 열기', '검토된 출처의 거래쌍 및 공지 알림 확인'],
  tr: ['Yayınlanmış ücret, spread ve çıkış maliyeti kontrollerini aç', 'İncelenmiş kaynaklı parite ve duyuru uyarılarını takip et'],
  es: ['Abrir comprobaciones de comisiones publicadas, spread y coste de salida', 'Seguir alertas de pares y anuncios con fuentes revisadas'],
  'pt-BR': ['Abrir checagens de taxas publicadas, spread e custo de saída', 'Acompanhar alertas de pares e anúncios com fontes revisadas'],
  fr: ['Ouvrir les contrôles des frais publiés, du spread et du coût de sortie', 'Suivre les alertes de paires et d’annonces issues de sources révisées'],
  de: ['Prüfungen zu veröffentlichten Gebühren, Spread und Ausstiegskosten öffnen', 'Alerts zu Paaren und Ankündigungen aus geprüften Quellen verfolgen'],
  ru: ['Открыть проверки опубликованных комиссий, спреда и затрат выхода', 'Отслеживать пары и объявления из проверенных источников'],
  ar: ['فتح فحوص الرسوم المنشورة والفارق وتكلفة الخروج', 'متابعة تنبيهات الأزواج والإعلانات ذات المصادر المراجعة'],
  id: ['Buka pemeriksaan biaya terbit, spread, dan biaya keluar', 'Ikuti peringatan pasangan dan pengumuman dari sumber yang ditinjau'],
  vi: ['Mở kiểm tra phí công bố, spread và chi phí thoát', 'Theo dõi cảnh báo cặp giao dịch và thông báo từ nguồn đã rà soát'],
  it: ['Apri controlli su commissioni pubblicate, spread e costo di uscita', 'Segui avvisi su coppie e annunci da fonti revisionate'],
};

const englishLeak = /Token contract|Source check|Verify official or on-chain source first|Liquidity route|Pool\/orderbook|Separate CEX order books from DEX pools|Approval risk|Check approval, signature and revoke path|Exit conditions|Verify withdrawal, bridge, stablecoin and region terms|Listing notice, pair availability and account terms can diverge|MEV Sandwich Attacks & Slippage Bleed|Contract permissions, approvals and exit paths can be opaque|Notice, pair and funding status|Orderbook Depth|Published cost and exit friction|Security Safeguards|Check notices, pairs, networks, account conditions and regional limits before using the route|Start from token, pool, quote route, price impact, slippage settings and current network state|Check contract permissions, wallet approvals, liquidity state, stablecoin exits and bridge routes|Record published trading fees, network costs, bridge costs and stablecoin exit paths separately|Open published fee, spread and exit-cost checks|Subscribe to reviewed-source pair and announcement alerts/;

let rendered;
const dir = await mkdtemp(path.join(root, 'tests/.tmp-r129-meme-native-'));
try {
  const entry = path.join(dir, 'entry.mjs');
  const bundle = path.join(dir, 'bundle.cjs');
  await writeFile(entry, `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx'; const locales=${JSON.stringify(locales)}; const result={}; for (const locale of locales) result[locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug:'meme-coins',locale})); console.log(JSON.stringify(result));`);
  await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, loader: { '.css': 'empty' }, logLevel: 'silent' });
  rendered = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 }));
} finally {
  await rm(dir, { recursive: true, force: true });
}

function decode(html) {
  return html
    .replaceAll('&amp;', '&')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&rsquo;', '’')
    .replaceAll('&ndash;', '–');
}

for (const locale of locales) {
  test(`meme topic stats, pain points and evaluation pillars are native in SSR for ${locale}`, () => {
    const html = decode(rendered[locale]);
    for (const text of expected[locale].stats) assert.ok(html.includes(text), `${locale} stat text appears: ${text}`);
    for (const text of expected[locale].pain) assert.ok(html.includes(text), `${locale} pain text appears: ${text}`);
    for (const text of expected[locale].pillars) assert.ok(html.includes(text), `${locale} pillar text appears: ${text}`);
    for (const text of expected[locale].source) assert.ok(html.includes(text), `${locale} source-bound table text appears: ${text}`);
    assert.ok(html.includes(expectedNavCategory[locale]), `${locale} meme nav label is localized: ${expectedNavCategory[locale]}`);
    assert.ok(html.includes(`${expectedUpdatedPrefix[locale]}: 2026-09-28`), `${locale} date prefix is localized and defined`);
    assert.doesNotMatch(html, /undefined:\s*2026-09-28/, `${locale} date prefix must never render undefined`);
    if (locale !== 'en') assert.doesNotMatch(html, />Meme coins and on-chain trade checks<\/span>/, `${locale} meme nav label must not fall back to English`);
    for (const text of expectedSectionCopy[locale]) assert.ok(html.includes(text), `${locale} section title or source-bound lead appears: ${text}`);
    assert.doesNotMatch(html, /<h2 class="topic-section__title"><span>⚠️<\/span><span>(Kanıt durumu|Estado de evidencia|Status da evidência|Statut des preuves|Nachweisstatus|Статус доказательств|Status bukti|Trạng thái bằng chứng|Stato delle prove)<\/span><\/h2>/, `${locale} pain section title must describe risks, not evidence status`);
    assert.doesNotMatch(html, /<h2 class="topic-section__title"><span>⚖️<\/span><span>(Yayınlanmış ücret tablosu|Tabla de comisiones publicada|Tabela de taxas publicada|Barème publié|Veröffentlichte Gebührentabelle|Опубликованная таблица комиссий|Jadwal biaya terbit|Bảng phí công bố|Tabella commissioni pubblicata)<\/span><\/h2>/, `${locale} platform conditions section title must not collapse to fee schedule`);
    for (const text of expectedTelegram[locale]) assert.ok(html.includes(text), `${locale} Telegram command description appears: ${text}`);
    assert.ok(html.includes('/rates meme'), `${locale} keeps /rates meme command`);
    assert.ok(html.includes('/alert new_listings'), `${locale} keeps /alert new_listings command`);
    if (locale !== 'en') assert.doesNotMatch(html, englishLeak, `${locale} does not leak meme English fallback body fields`);
  });
}
