// Venue detail helpers used by both the first screen (VenueDetailPage.jsx) and the lazily hydrated research hub
// (VenueDetailResearch.jsx): detail copy tables, the DEX fee dictionary, the clipboard feedback hook and the Telegram
// labels. Pinned to the route-v3-venue chunk (vite.config.mjs) so the research chunk never becomes a static dependency
// of the first screen.
import { useEffect, useRef, useState } from "react";
import { textLocaleKey } from "./v3-pages-shared.jsx";

const detailUiCoreByLocale = {
  "zh-Hans": { review: "核对费率、储备金、KYC 与杠杆", benefit: "用户手续费权益以当前平台合作条件为准", code: "合作邀请码", codeShort: "邀请码", copy: "复制", deeper: "打开深度核验资料", verifyRegional: "先核对地区资格" },
  "zh-Hant": { review: "核對費率、儲備金、KYC 與槓桿", benefit: "用戶手續費權益以目前平台合作條件為準", code: "合作邀請碼", codeShort: "邀請碼", copy: "複製", deeper: "打開深度核驗資料", verifyRegional: "先核對地區資格" },
  es: { review: "Revisar comisiones, reservas, KYC y apalancamiento", benefit: "El beneficio de comisión sigue las condiciones actuales del partner", code: "Código de referido", codeShort: "Código", copy: "Copiar", deeper: "Abrir material de verificación", verifyRegional: "Verifica elegibilidad regional primero" },
  "pt-BR": { review: "Ver taxas, reservas, KYC e alavancagem", benefit: "O benefício de taxa segue os termos atuais do parceiro", code: "Código de indicação", codeShort: "Código", copy: "Copiar", deeper: "Abrir material de verificação", verifyRegional: "Verificar elegibilidade regional primeiro" },
  fr: { review: "Vérifier les frais, réserves, KYC et levier", benefit: "L’avantage de frais suit les conditions partenaire en vigueur", code: "Code partenaire", codeShort: "Code", copy: "Copier", deeper: "Ouvrir les éléments de vérification", verifyRegional: "Vérifier d’abord l’éligibilité régionale" },
  de: { review: "Gebühren, Reserven, KYC und Hebel prüfen", benefit: "Der Gebührenvorteil folgt den aktuellen Partnerbedingungen", code: "Partnercode", codeShort: "Code", copy: "Kopieren", deeper: "Weitere Prüfunterlagen öffnen", verifyRegional: "Regionale Eignung zuerst prüfen" },
  ru: { review: "Проверить комиссии, резервы, KYC и плечо", benefit: "Пользовательское преимущество зависит от текущих партнёрских условий", code: "Партнёрский код", codeShort: "Код", copy: "Копировать", deeper: "Открыть материалы проверки", verifyRegional: "Сначала проверьте региональную доступность" },
  ja: { review: "手数料・準備金・KYC・レバレッジを確認", benefit: "ユーザー手数料特典は現在のパートナー条件に従います", code: "紹介コード", codeShort: "コード", copy: "コピー", deeper: "詳細な確認資料を開く", verifyRegional: "地域資格を先に確認" },
  ko: { review: "수수료·준비금·KYC·레버리지 확인", benefit: "사용자 수수료 혜택은 현재 파트너 조건을 따릅니다", code: "추천 코드", codeShort: "코드", copy: "복사", deeper: "상세 검증 자료 열기", verifyRegional: "지역 자격 먼저 확인" },
  ar: { review: "راجع الرسوم والاحتياطيات وKYC والرافعة", benefit: "تخضع ميزة الرسوم لشروط الشريك الحالية", code: "رمز الإحالة", codeShort: "رمز", copy: "نسخ", deeper: "فتح مواد التحقق التفصيلية", verifyRegional: "تحقق من أهلية المنطقة أولاً" },
  // l10n: needs native review
  ur: { review: "فیس، ذخائر، KYC اور لیوریج چیک کریں", benefit: "صارف فیس فائدہ موجودہ پارٹنر شرائط کے تابع ہے", code: "ریفرل کوڈ", codeShort: "کوڈ", copy: "کاپی", deeper: "مزید تصدیقی مواد کھولیں", verifyRegional: "پہلے علاقائی اہلیت چیک کریں" },
  // l10n: needs native review
  uk: { review: "Перевірити комісії, резерви, KYC і плече", benefit: "Перевага комісії користувача залежить від поточних партнерських умов", code: "Реферальний код", codeShort: "Код", copy: "Копіювати", deeper: "Відкрити глибші матеріали перевірки", verifyRegional: "Спершу перевірте регіональну доступність" },
  tr: { review: "Ücretleri, rezervleri, KYC ve kaldıracı incele", benefit: "Kullanıcı ücret avantajı mevcut partner koşullarına tabidir", code: "Referans kodu", codeShort: "Kod", copy: "Kopyala", deeper: "Derin doğrulama materyalini aç", verifyRegional: "Önce bölgesel uygunluğu doğrula" },
  id: { review: "Tinjau biaya, cadangan, KYC, dan leverage", benefit: "Manfaat biaya pengguna mengikuti ketentuan partner saat ini", code: "Kode referral", codeShort: "Kode", copy: "Salin", deeper: "Buka materi verifikasi mendalam", verifyRegional: "Periksa kelayakan wilayah terlebih dahulu" },
  vi: { review: "Xem phí, dự trữ, KYC và đòn bẩy", benefit: "Ưu đãi phí theo điều kiện đối tác hiện tại", code: "Mã giới thiệu", codeShort: "Mã", copy: "Sao chép", deeper: "Mở tài liệu xác minh sâu", verifyRegional: "Kiểm tra điều kiện khu vực trước" },
  it: { review: "Rivedi commissioni, riserve, KYC e leva", benefit: "Il vantaggio sulle commissioni segue i termini partner attuali", code: "Codice referral", codeShort: "Codice", copy: "Copia", deeper: "Apri materiale di verifica", verifyRegional: "Verifica prima l’idoneità regionale" },
};

const detailUi = (locale) => {
  const key = textLocaleKey(locale);
  const fallback = {
    review: "Review fees, reserves, KYC and leverage", benefit: "User fee benefit follows current partner terms", code: "Referral Code", copy: "Copy", deeper: "Open deeper verification material", verifyRegional: "Verify regional eligibility first",
  };
  const metricUi = {
    es: { review: "Revisar comisiones, reservas, KYC y apalancamiento", code: "Código de referido", copy: "Copiar", deeper: "Abrir material de verificación" },
    "pt-BR": { review: "Ver taxas, reservas, KYC e alavancagem", code: "Código de indicação", copy: "Copiar", deeper: "Abrir material de verificação" },
    fr: { review: "Vérifier les frais, réserves, KYC et levier", code: "Code partenaire", copy: "Copier", deeper: "Ouvrir les éléments de vérification" },
    de: { review: "Gebühren, Reserven, KYC und Hebel prüfen", code: "Partnercode", copy: "Kopieren", deeper: "Weitere Prüfunterlagen öffnen" },
    ru: { review: "Проверить комиссии, резервы, KYC и плечо", code: "Партнёрский код", copy: "Копировать", deeper: "Открыть материалы проверки" },
    ja: { review: "手数料・準備金・KYC・レバレッジを確認", code: "紹介コード", copy: "コピー", deeper: "詳細な確認資料を開く" },
    ko: { review: "수수료·준비금·KYC·레버리지 확인", code: "추천 코드", copy: "복사", deeper: "상세 검증 자료 열기" },
    tr: { review: "Ücretleri, rezervleri, KYC ve kaldıracı incele", code: "Referans kodu", copy: "Kopyala", deeper: "Derin doğrulama materyalini aç" },
  };
  const localized = ({
    ja: { review: "手数料・準備金・KYC・レバレッジを確認", benefit: "ユーザー手数料特典は現在のパートナー条件に従います", code: "紹介コード", codeShort: "コード", copy: "コピー", deeper: "詳細な確認資料を開く", preRegister: "登録前の判断メモを開く", preRegisterHint: "適合性、制限、KYC・入金確認をまとめています", fewer: "候補を少なく表示", more: "残り", moreAlt: "件の候補を表示", rates: "VIP0〜VIP9 段階料率とNexuAlpha純額料率", spot: "現物市場", futures: "先物・パーペチュアル", expand: "VIP0〜VIP9の詳細をすべて開く", collapse: "主要階層だけ表示", stack: "公式VIP取引量階層とAPIキーの優遇を併用できます", lock: "公式サイトで純額料率を確認", feeTag: "段階別手数料表", pending: "ユーザー特典は確認待ち", tier: "階層 / 30日取引量", retailVol: "< $100K（個人）", maker: "メイカー基準", taker: "テイカー基準", makerNet: (percent) => `メイカー純額 (-${percent}%)`, takerNet: (percent) => `テイカー純額 (-${percent}%)`, userNetPending: "ユーザー純額料率（確認待ち）", savings: "推定節約額", save: "節約", verifiedRebate: (code, percent) => `NexuAlpha コード ${code} を適用すると、公式VIP料率に加えて ${percent}% の純額還元を確認できます。`, unverifiedBenefit: "公式ルートと紹介コードは掲載していますが、固定のユーザー特典は各プラットフォーム条件の確認後にのみ表示します。", verifyRegional: "地域資格を先に確認" },
    ko: { review: "수수료·준비금·KYC·레버리지 확인", benefit: "사용자 수수료 혜택은 현재 파트너 조건을 따릅니다", code: "추천 코드", codeShort: "코드", copy: "복사", deeper: "상세 검증 자료 열기", preRegister: "가입 전 판단 메모 열기", preRegisterHint: "적합성, 제한, KYC·입금 확인을 한곳에서 봅니다", fewer: "후보 적게 보기", more: "남은", moreAlt: "개 후보 더 보기", rates: "VIP0~VIP9 등급 요율 및 NexuAlpha 순요율", spot: "현물 시장", futures: "선물·무기한", expand: "VIP0~VIP9 상세 모두 열기", collapse: "핵심 등급만 보기", stack: "공식 VIP 거래량 등급 및 API 키 혜택과 함께 적용됩니다", lock: "공식 사이트에서 순요율 확인", feeTag: "등급별 수수료표", pending: "사용자 혜택 확인 대기", tier: "등급 / 30일 거래량", retailVol: "< $100K (개인)", maker: "메이커 기준", taker: "테이커 기준", makerNet: (percent) => `메이커 순요율 (-${percent}%)`, takerNet: (percent) => `테이커 순요율 (-${percent}%)`, userNetPending: "사용자 순요율(확인 대기)", savings: "예상 절감액", save: "절감", verifiedRebate: (code, percent) => `NexuAlpha 코드 ${code} 적용 시 공식 VIP 요율에 ${percent}% 순혜택을 함께 확인할 수 있습니다.`, unverifiedBenefit: "공식 경로와 추천 코드는 표시하지만, 고정 사용자 혜택은 플랫폼 조건 확인 후에만 게시합니다.", verifyRegional: "지역 자격 먼저 확인" },
    tr: { review: "Ücretleri, rezervleri, KYC ve kaldıracı incele", benefit: "Kullanıcı ücret avantajı mevcut partner koşullarına tabidir", code: "Referans kodu", codeShort: "Kod", copy: "Kopyala", deeper: "Derin doğrulama materyalini aç", preRegister: "Kayıt öncesi karar notlarını aç", preRegisterHint: "Uygunluk, sınırlamalar ve KYC/yatırım kontrolleri burada", fewer: "Daha az aday göster", more: "Kalan", moreAlt: "aday daha göster", rates: "VIP0-VIP9 kademeli oranlar ve NexuAlpha net oranları", spot: "Spot piyasalar", futures: "Vadeli işlemler ve perpetual", expand: "VIP0-VIP9 ayrıntılarının tümünü aç", collapse: "Temel kademelere daralt", stack: "Resmî VIP hacim kademeleri ve yüksek frekanslı API anahtarlarıyla birlikte kullanılabilir", lock: "Resmî sitede net oranları kilitle", feeTag: "Kademeli ücret tablosu", pending: "Kullanıcı avantajı doğrulama bekliyor", tier: "Kademe / 30 günlük hacim", retailVol: "< $100K (bireysel)", maker: "Maker tabanı", taker: "Taker tabanı", makerNet: (percent) => `Maker net (-${percent}%)`, takerNet: (percent) => `Taker net (-${percent}%)`, userNetPending: "Kullanıcı net oranı (beklemede)", savings: "Tahmini tasarruf", save: "Tasarruf", verifiedRebate: (code, percent) => `NexuAlpha kodu ${code} ile resmî VIP oranlarına ek olarak ${percent}% net avantajı kontrol edebilirsiniz.`, unverifiedBenefit: "Resmî rota ve referans kodu listelenir; sabit kullanıcı avantajı yalnızca platform koşulları doğrulandıktan sonra yayımlanır.", verifyRegional: "Önce bölgesel uygunluğu doğrula" },
  }[key] || {});
  return { ...fallback, ...(detailUiCoreByLocale[key] || {}), ...(metricUi[key] || {}), ...localized };
};

const dexFeeCompactUiByLocale = {
  en: ["DEX mechanism", "Perp DEX mechanism", "uses on-chain checks instead of a CEX VIP table", "Costs come from pool fees, funding, slippage, gas, routing and liquidation; no forced VIP0-VIP9 table.", ["Wallet, chain and approval risk", "Pool fee, route, slippage and gas", "Official app, docs, domain and community"], ["Matching, funding, margin and liquidation", "Oracle, insurance fund and settlement", "Bridge, withdrawal wait and region"], "Verify on the official page and current on-chain state first.", "Referral Code", "No code required or unavailable", "Referral state", "Review official source ↗", "Continue official route ↗", "Verify regional eligibility first →", "Official route unavailable"],
  "zh-Hans": ["DEX 机制核验", "Perp DEX 机制核验", "不使用 CEX VIP 费率表，先核验链上机制", "成本来自池子费率、资金费率、滑点、Gas、路由与强平机制；不包装成 VIP0-VIP9。", ["钱包、网络、代币合约与授权风险", "池子费率、路由、滑点与 Gas", "官方 App、文档、域名与社群"], ["撮合、资金费率、保证金与强平", "预言机、保险基金与链上结算", "入金桥、提现等待与地区条件"], "注册或连接钱包前，以官方页面和链上状态核对。", "已记录邀请码", "无需邀请码或未记录邀请码", "邀请码状态", "打开官方来源核验 ↗", "继续官方路径 ↗", "先核对地区资格 →", "官方路径不可用"],
  "zh-Hant": ["DEX 機制核驗", "Perp DEX 機制核驗", "不使用 CEX VIP 費率表，先核驗鏈上機制", "成本來自池子費率、資金費率、滑點、Gas、路由與強平機制；不包裝成 VIP0-VIP9。", ["錢包、網路、代幣合約與授權風險", "池子費率、路由、滑點與 Gas", "官方 App、文件、網域與社群"], ["撮合、資金費率、保證金與強平", "預言機、保險基金與鏈上結算", "入金橋、提現等待與地區條件"], "註冊或連接錢包前，以官方頁面和鏈上狀態核對。", "已記錄邀請碼", "無需邀請碼或未記錄邀請碼", "邀請碼狀態", "打開官方來源核驗 ↗", "繼續官方路徑 ↗", "先核對地區資格 →", "官方路徑不可用"],
  es: ["Mecanismo DEX", "Mecanismo Perp DEX", "usa verificación on-chain, no tabla VIP de CEX", "Costes por pool, funding, slippage, gas, ruta y liquidación; sin tabla VIP0-VIP9 forzada.", ["Wallet, red, contrato y aprobación", "Pool, ruta, slippage y gas", "App oficial, docs, dominio y comunidad"], ["Matching, funding, margen y liquidación", "Oráculo, seguro y liquidación on-chain", "Bridge, retiro y región"], "Verifica la página oficial y el estado on-chain primero.", "Código de referido", "Sin código requerido o pendiente", "Estado del referido", "Revisar fuente oficial ↗", "Continuar ruta oficial ↗", "Verifica elegibilidad regional →", "Ruta oficial no disponible"],
  "pt-BR": ["Mecanismo DEX", "Mecanismo Perp DEX", "usa verificação on-chain, não tabela VIP de CEX", "Custos vêm de pool, funding, slippage, gas, rota e liquidação; sem tabela VIP0-VIP9 forçada.", ["Carteira, rede, contrato e aprovação", "Pool, rota, slippage e gas", "App oficial, docs, domínio e comunidade"], ["Matching, funding, margem e liquidação", "Oráculo, seguro e liquidação on-chain", "Bridge, saque e região"], "Confira a página oficial e o estado on-chain primeiro.", "Código de indicação", "Sem código exigido ou pendente", "Status do código", "Revisar fonte oficial ↗", "Continuar rota oficial ↗", "Verificar elegibilidade regional →", "Rota oficial indisponível"],
  fr: ["Mécanisme DEX", "Mécanisme Perp DEX", "utilise une vérification on-chain, pas une grille VIP CEX", "Coûts liés au pool, funding, slippage, gas, routage et liquidation; pas de grille VIP0-VIP9 forcée.", ["Wallet, réseau, contrat et autorisation", "Pool, route, slippage et gas", "App officielle, docs, domaine et communauté"], ["Matching, funding, marge et liquidation", "Oracle, assurance et règlement on-chain", "Bridge, retrait et région"], "Vérifiez d'abord la page officielle et l'état on-chain.", "Code partenaire", "Aucun code requis ou enregistré", "État du code", "Vérifier la source officielle ↗", "Continuer la route officielle ↗", "Vérifier l'éligibilité régionale →", "Route officielle indisponible"],
  de: ["DEX-Mechanik", "Perp-DEX-Mechanik", "nutzt On-Chain-Prüfung statt CEX-VIP-Tabelle", "Kosten durch Poolgebühr, Funding, Slippage, Gas, Routing und Liquidation; keine VIP0-VIP9-Tabelle.", ["Wallet, Netzwerk, Vertrag und Freigabe", "Pool, Route, Slippage und Gas", "Offizielle App, Doku, Domain und Community"], ["Matching, Funding, Margin und Liquidation", "Oracle, Versicherung und On-Chain-Abwicklung", "Bridge, Auszahlung und Region"], "Offizielle Seite und On-Chain-Status zuerst prüfen.", "Partnercode", "Kein Code nötig oder verzeichnet", "Code-Status", "Offizielle Quelle prüfen ↗", "Offizielle Route fortsetzen ↗", "Regionale Eignung prüfen →", "Offizielle Route nicht verfügbar"],
  ja: ["DEX 仕組み確認", "Perp DEX 仕組み確認", "は CEX の VIP 表ではなくオンチェーン条件で確認します", "費用はプール手数料、資金調達率、スリッページ、Gas、ルート、清算条件で決まり、VIP0〜VIP9 表にしません。", ["ウォレット、ネットワーク、契約、承認", "プール、ルート、スリッページ、Gas", "公式アプリ、文書、ドメイン、コミュニティ"], ["マッチング、資金調達率、証拠金、清算", "オラクル、保険基金、オンチェーン決済", "ブリッジ、出金待ち、地域条件"], "先に公式ページとオンチェーン状態を確認してください。", "紹介コード", "コード不要または記録なし", "紹介状態", "公式ソースを確認 ↗", "公式ルートへ進む ↗", "地域資格を先に確認 →", "公式ルートは利用できません"],
  ko: ["DEX 메커니즘", "Perp DEX 메커니즘", "는 CEX VIP 표가 아니라 온체인 조건으로 확인합니다", "비용은 풀 수수료, 펀딩, 슬리피지, 가스, 라우팅, 청산 조건에서 발생하며 VIP0~VIP9 표로 바꾸지 않습니다.", ["지갑, 네트워크, 계약, 승인", "풀, 경로, 슬리피지, 가스", "공식 앱, 문서, 도메인, 커뮤니티"], ["매칭, 펀딩, 증거금, 청산", "오라클, 보험 기금, 온체인 정산", "브리지, 출금 대기, 지역 자격"], "먼저 공식 페이지와 온체인 상태를 확인하세요.", "추천 코드", "코드 불필요 또는 기록 없음", "추천 상태", "공식 출처 확인 ↗", "공식 경로 계속 ↗", "지역 자격 먼저 확인 →", "공식 경로 사용 불가"],
  ar: ["آلية DEX", "آلية Perp DEX", "يستخدم فحصا على السلسلة بدلا من جدول VIP مركزي", "التكلفة من رسوم المجمع والتمويل والانزلاق والغاز والتوجيه والتصفية؛ بلا جدول VIP0-VIP9.", ["المحفظة والشبكة والعقد والموافقة", "المجمع والمسار والانزلاق والغاز", "التطبيق والوثائق والنطاق والمجتمع"], ["المطابقة والتمويل والهامش والتصفية", "الأوراكل والتأمين والتسوية", "الجسر والسحب والمنطقة"], "تحقق أولا من الصفحة الرسمية وحالة السلسلة.", "رمز الإحالة", "لا يلزم رمز أو لم يسجل", "حالة الإحالة", "راجع المصدر الرسمي ↗", "تابع المسار الرسمي ↗", "تحقق من أهلية المنطقة أولا →", "المسار الرسمي غير متاح"],
  // l10n: needs native review
  ur: ["DEX میکانزم", "Perp DEX میکانزم", "CEX VIP جدول کے بجائے آن چین چیک استعمال کرتا ہے", "لاگت pool fee، funding، slippage، gas، routing اور liquidation سے آتی ہے؛ VIP0-VIP9 جدول نہیں۔", ["Wallet، network، contract اور approval", "Pool، route، slippage اور gas", "Official app، docs، domain اور community"], ["Matching، funding، margin اور liquidation", "Oracle، insurance اور on-chain settlement", "Bridge، withdrawal اور region"], "پہلے سرکاری صفحہ اور آن چین حالت چیک کریں۔", "ریفرل کوڈ", "کوڈ ضروری نہیں یا کنفیگر نہیں", "ریفرل حالت", "سرکاری ذریعہ دیکھیں ↗", "سرکاری راستہ جاری رکھیں ↗", "پہلے علاقائی اہلیت چیک کریں →", "سرکاری راستہ دستیاب نہیں"],
  // l10n: needs native review
  uk: ["Механіка DEX", "Механіка Perp DEX", "використовує ончейн-перевірку замість VIP-таблиці CEX", "Витрати походять із pool fee, funding, slippage, gas, маршрутизації та ліквідації; без таблиці VIP0-VIP9.", ["Wallet, network, contract і approval", "Pool, route, slippage і gas", "Official app, docs, domain і community"], ["Matching, funding, margin і liquidation", "Oracle, insurance і on-chain settlement", "Bridge, withdrawal і region"], "Спершу перевірте офіційну сторінку й ончейн-статус.", "Реферальний код", "Код не потрібен або не налаштований", "Статус рефералу", "Переглянути офіційне джерело ↗", "Продовжити офіційний маршрут ↗", "Спершу перевірте регіональну доступність →", "Офіційний маршрут недоступний"],
  tr: ["DEX mekanizması", "Perp DEX mekanizması", "CEX VIP tablosu yerine zincir üstü kontrol kullanır", "Maliyet havuz ücreti, funding, slippage, gas, rota ve likidasyondan gelir; VIP0-VIP9 tablosuna zorlanmaz.", ["Cüzdan, ağ, sözleşme ve onay", "Havuz, rota, slippage ve gas", "Resmî uygulama, belge, alan ve topluluk"], ["Eşleşme, funding, marjin, likidasyon", "Oracle, sigorta ve zincir üstü uzlaşma", "Köprü, çekim ve bölge"], "Önce resmî sayfayı ve zincir üstü durumu kontrol edin.", "Referans kodu", "Kod gerekmiyor veya kayıtlı değil", "Referans durumu", "Resmî kaynağı incele ↗", "Resmî rotaya devam et ↗", "Önce bölgesel uygunluğu doğrula →", "Resmî rota kullanılamıyor"],
  ru: ["Механика DEX", "Механика Perp DEX", "использует ончейн-проверку вместо VIP-таблицы CEX", "Стоимость зависит от пула, funding, проскальзывания, газа, маршрута и ликвидации; без VIP0-VIP9.", ["Кошелек, сеть, контракт и разрешения", "Пул, маршрут, проскальзывание и газ", "Официальное приложение, документы, домен и сообщество"], ["Матчинг, funding, маржа и ликвидация", "Оракул, страховой фонд и расчет", "Мост, вывод и регион"], "Сначала проверьте официальный сайт и ончейн-статус.", "Партнёрский код", "Код не требуется или не записан", "Статус кода", "Проверить официальный источник ↗", "Продолжить официальный маршрут ↗", "Проверьте региональную доступность →", "Официальный маршрут недоступен"],
  id: ["Mekanisme DEX", "Mekanisme Perp DEX", "memakai pemeriksaan on-chain, bukan tabel VIP CEX", "Biaya berasal dari pool, funding, slippage, gas, routing, dan likuidasi; bukan tabel VIP0-VIP9.", ["Dompet, jaringan, kontrak, approval", "Pool, rute, slippage, gas", "App resmi, dokumen, domain, komunitas"], ["Matching, funding, margin, likuidasi", "Oracle, asuransi, penyelesaian on-chain", "Bridge, penarikan, wilayah"], "Periksa halaman resmi dan status on-chain dulu.", "Kode referral", "Tidak perlu kode atau belum tercatat", "Status referral", "Tinjau sumber resmi ↗", "Lanjutkan rute resmi ↗", "Periksa kelayakan wilayah →", "Rute resmi tidak tersedia"],
  vi: ["Cơ chế DEX", "Cơ chế Perp DEX", "dùng kiểm tra on-chain thay vì bảng VIP CEX", "Chi phí đến từ pool, funding, trượt giá, gas, định tuyến và thanh lý; không ép vào VIP0-VIP9.", ["Ví, mạng, hợp đồng, cấp quyền", "Pool, tuyến, trượt giá, gas", "Ứng dụng, tài liệu, miền, cộng đồng"], ["Khớp lệnh, funding, ký quỹ, thanh lý", "Oracle, bảo hiểm, thanh toán on-chain", "Bridge, rút tiền, khu vực"], "Kiểm tra trang chính thức và trạng thái on-chain trước.", "Mã giới thiệu", "Không cần mã hoặc chưa được ghi nhận", "Trạng thái giới thiệu", "Xem nguồn chính thức ↗", "Tiếp tục tuyến chính thức ↗", "Kiểm tra điều kiện khu vực →", "Tuyến chính thức không khả dụng"],
  it: ["Meccanismo DEX", "Meccanismo Perp DEX", "usa controllo on-chain, non tabella VIP CEX", "Costi da pool, funding, slippage, gas, routing e liquidazione; niente tabella VIP0-VIP9 forzata.", ["Wallet, rete, contratto, approvazione", "Pool, percorso, slippage, gas", "App ufficiale, documenti, dominio, community"], ["Matching, funding, margine, liquidazione", "Oracle, assicurazione, regolamento on-chain", "Bridge, prelievo e regione"], "Controlla prima pagina ufficiale e stato on-chain.", "Codice referral", "Codice non richiesto o non registrato", "Stato referral", "Verifica fonte ufficiale ↗", "Continua percorso ufficiale ↗", "Verifica idoneità regionale →", "Percorso ufficiale non disponibile"],
};

const dexFeeCompactUi = (locale, venueName, isPerpDex) => {
  const key = String(locale || "").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  const ui = dexFeeCompactUiByLocale[locale] || dexFeeCompactUiByLocale[key] || dexFeeCompactUiByLocale.en;
  return {
    tag: isPerpDex ? ui[1] : ui[0],
    title: `${venueName} ${ui[2]}`,
    body: ui[3],
    dexItems: ui[4],
    perpItems: ui[5],
    verify: ui[6],
    code: ui[7],
    noCode: ui[8],
    codeState: ui[9],
    source: ui[10],
    route: ui[11],
    blocked: ui[12],
    unavailable: ui[13],
  };
};

const clipboardFeedbackCopy = Object.freeze({"en": ["Copying…", "Copied", "Copy failed", "Copy the displayed value manually."], "zh-Hans": ["正在复制…", "已复制", "复制失败", "请手动复制页面显示的内容。"], "zh-Hant": ["正在複製…", "已複製", "複製失敗", "請手動複製頁面顯示的內容。"], "ja": ["コピー中…", "コピーしました", "コピーできませんでした", "表示された内容を手動でコピーしてください。"], "ko": ["복사 중…", "복사됨", "복사 실패", "표시된 내용을 직접 복사하세요."], "tr": ["Kopyalanıyor…", "Kopyalandı", "Kopyalanamadı", "Gösterilen değeri elle kopyalayın."], "es": ["Copiando…", "Copiado", "No se pudo copiar", "Copia manualmente el valor mostrado."], "pt-BR": ["Copiando…", "Copiado", "Falha ao copiar", "Copie manualmente o valor exibido."], "fr": ["Copie en cours…", "Copié", "Échec de la copie", "Copiez manuellement la valeur affichée."], "de": ["Wird kopiert…", "Kopiert", "Kopieren fehlgeschlagen", "Kopieren Sie den angezeigten Wert manuell."], "ru": ["Копирование…", "Скопировано", "Не удалось скопировать", "Скопируйте показанное значение вручную."], "ar": ["جارٍ النسخ…", "تم النسخ", "تعذر النسخ", "انسخ القيمة المعروضة يدوياً."],
// l10n: needs native review
"ur": ["کاپی ہو رہا ہے…", "کاپی ہو گیا", "کاپی ناکام", "دکھائی گئی قدر دستی کاپی کریں۔"],
// l10n: needs native review
"uk": ["Копіювання…", "Скопійовано", "Не вдалося скопіювати", "Скопіюйте показане значення вручну."], "id": ["Menyalin…", "Disalin", "Gagal menyalin", "Salin nilai yang ditampilkan secara manual."], "vi": ["Đang sao chép…", "Đã sao chép", "Không thể sao chép", "Sao chép giá trị hiển thị theo cách thủ công."], "it": ["Copia in corso…", "Copiato", "Copia non riuscita", "Copia manualmente il valore visualizzato."]});
function clipboardStatusText(state, locale) {
  const messages = clipboardFeedbackCopy[locale] || clipboardFeedbackCopy[String(locale || "").split("-")[0]] || clipboardFeedbackCopy.en;
  return state === "pending" ? messages[0] : state === "success" ? messages[1] : state === "error" ? messages[2] : "";
}
function copyFeedbackLabel(state, locale, idleLabel) {
  return state === "idle" ? idleLabel : clipboardStatusText(state, locale);
}
function useCopyFeedback(scope) {
  const [state, setState] = useState("idle");
  const active = useRef(true);
  const operation = useRef(0);
  const resetTimer = useRef(null);
  useEffect(() => {
    active.current = true;
    setState("idle");
    return () => {
      active.current = false;
      operation.current += 1;
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    };
  }, [scope]);
  const copy = async (text) => {
    if (!active.current) return;
    const attempt = ++operation.current;
    clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setState("pending");
    try {
      if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") throw new Error("CLIPBOARD_UNAVAILABLE");
      await navigator.clipboard.writeText(text);
      if (!active.current || operation.current !== attempt) return;
      setState("success");
      resetTimer.current = setTimeout(() => {
        resetTimer.current = null;
        if (active.current && operation.current === attempt) setState("idle");
      }, 2000);
    } catch {
      if (active.current && operation.current === attempt) setState("error");
    }
  };
  return { state, copy };
}
function CopyFeedbackStatus({ state, locale }) {
  const messages = clipboardFeedbackCopy[locale] || clipboardFeedbackCopy[String(locale || "").split("-")[0]] || clipboardFeedbackCopy.en;
  return <small className="v3-copy-feedback" role="status" aria-live="polite" aria-atomic="true">{state === "idle" ? "" : `${clipboardStatusText(state, locale)}${state === "error" ? `. ${messages[3]}` : ""}`}</small>;
}

const telegramLocaleUi = {
  ja: { intelligence: "Telegramボット 24時間インテリジェンス", review: "Telegramで手数料と公式条件を確認", research: "出典付きの手数料・商品リサーチ", benefit: "公式ルールでユーザー特典を確認", sources: "公式準備金・リスク情報", monitor: "Telegramでこの取引所を監視 ↗", channel: "公式情報チャンネル", community: "トレーダーコミュニティ", desc: "公式 @{b} を通じて、出典付きの手数料リサーチ、公式リンク、アカウント条件を確認できます。最新の条件はプラットフォームで必ずご確認ください。" },
  ko: { intelligence: "Telegram 봇 24시간 정보", review: "Telegram에서 수수료와 공식 조건 확인", research: "출처가 표시된 수수료·상품 리서치", benefit: "공식 규정에 따라 혜택 확인", sources: "공식 준비금·위험 출처", monitor: "Telegram에서 거래소 모니터링 ↗", channel: "공식 정보 채널", community: "트레이더 커뮤니티", desc: "공식 @{b}에서 출처가 표시된 수수료 리서치, 공식 링크, 계정 조건을 확인하세요. 최신 조건은 반드시 플랫폼에서 직접 확인해야 합니다." },
  tr: { intelligence: "Telegram Botu 7/24 bilgi", review: "Ücretleri ve resmî koşulları Telegram'da inceleyin", research: "Kaynaklı ücret ve ürün araştırması", benefit: "Kullanıcı avantajını resmî kurallarla doğrulayın", sources: "Resmî rezerv ve risk kaynakları", monitor: "Borsayı Telegram'da izle ↗", channel: "Resmî bilgi kanalı", community: "Trader topluluğu", desc: "Resmî @{b} üzerinden kaynaklı ücret araştırmasına, resmî bağlantılara ve hesap koşullarına ulaşın; güncel koşulları mutlaka platformda doğrulayın." },
  es: { intelligence: "Inteligencia 24/7 del bot de Telegram", review: "Revisa comisiones y condiciones oficiales en Telegram", research: "Investigación de tarifas y productos con fuentes", benefit: "Verifica el beneficio según las reglas oficiales", sources: "Fuentes oficiales de reservas y riesgos", monitor: "Monitorizar plataforma en Telegram ↗", channel: "Canal oficial de información", community: "Comunidad de traders", desc: "Conéctate con el @{b} oficial para ver investigación de comisiones con fuentes, enlaces oficiales y condiciones de cuenta; verifica las condiciones vigentes en la plataforma." },
  fr: { intelligence: "Veille Telegram 24/7", review: "Vérifiez les frais et conditions officielles sur Telegram", research: "Recherche des frais et produits avec sources", benefit: "Vérifiez l’avantage selon les règles officielles", sources: "Sources officielles sur les réserves et risques", monitor: "Surveiller la plateforme sur Telegram ↗", channel: "Canal officiel d’information", community: "Communauté de traders", desc: "Connectez-vous au @{b} officiel pour consulter une recherche sur les frais avec sources, des liens officiels et les conditions de compte ; vérifiez les conditions en vigueur sur la plateforme." },
  de: { intelligence: "Telegram-Bot mit 24/7-Informationen", review: "Gebühren und offizielle Bedingungen auf Telegram prüfen", research: "Quellenbasierte Gebühren- und Produktrecherche", benefit: "Vorteil nach offiziellen Regeln prüfen", sources: "Offizielle Quellen zu Reserven und Risiken", monitor: "Plattform auf Telegram überwachen ↗", channel: "Offizieller Informationskanal", community: "Trader-Community", desc: "Verbinden Sie sich mit dem offiziellen @{b} für quellenbasierte Gebührenrecherche, offizielle Links und Kontobedingungen; aktuelle Bedingungen bitte direkt bei der Plattform prüfen." },
  ru: { intelligence: "Информация Telegram-бота 24/7", review: "Проверьте комиссии и официальные условия в Telegram", research: "Исследование комиссий и продуктов с источниками", benefit: "Проверьте преимущество по официальным правилам", sources: "Официальные источники резервов и рисков", monitor: "Мониторить платформу в Telegram ↗", channel: "Официальный информационный канал", community: "Сообщество трейдеров", desc: "Подключитесь к официальному @{b}: исследование комиссий с источниками, официальные ссылки и условия аккаунта. Актуальные условия проверяйте на самой платформе." },
  "pt-BR": { intelligence: "Inteligência 24/7 do bot do Telegram", review: "Revise taxas e condições oficiais no Telegram", research: "Pesquisa de taxas e produtos com fontes", benefit: "Verifique o benefício conforme as regras oficiais", sources: "Fontes oficiais de reservas e riscos", monitor: "Monitorar a plataforma no Telegram ↗", channel: "Canal oficial de informações", community: "Comunidade de traders", desc: "Conecte-se ao @{b} oficial para ver pesquisa de taxas com fontes, links oficiais e condições da conta; confirme as condições atuais na plataforma." },
  id: { intelligence: "Intelijen bot Telegram 24/7", review: "Tinjau biaya dan ketentuan resmi di Telegram", research: "Riset biaya dan produk berlabel sumber", benefit: "Verifikasi manfaat sesuai aturan resmi", sources: "Sumber resmi cadangan dan risiko", monitor: "Pantau platform di Telegram ↗", channel: "Kanal informasi resmi", community: "Komunitas trader", desc: "Hubungkan ke @{b} resmi untuk riset biaya berlabel sumber, tautan resmi, dan ketentuan akun; pastikan ketentuan terbaru langsung di platform." },
  vi: { intelligence: "Bot Telegram thông tin 24/7", review: "Xem phí và điều kiện chính thức trên Telegram", research: "Nghiên cứu phí và sản phẩm có ghi nguồn", benefit: "Xác minh ưu đãi theo quy định chính thức", sources: "Nguồn chính thức về dự trữ và rủi ro", monitor: "Theo dõi nền tảng trên Telegram ↗", channel: "Kênh thông tin chính thức", community: "Cộng đồng trader", desc: "Kết nối với @{b} chính thức để xem nghiên cứu phí có ghi nguồn, liên kết chính thức và điều kiện tài khoản; hãy xác minh điều kiện hiện hành trên nền tảng." },
  it: { intelligence: "Bot Telegram con informazioni 24/7", review: "Verifica commissioni e condizioni ufficiali su Telegram", research: "Ricerca su commissioni e prodotti con fonti", benefit: "Verifica il vantaggio secondo le regole ufficiali", sources: "Fonti ufficiali su riserve e rischi", monitor: "Monitora la piattaforma su Telegram ↗", channel: "Canale informativo ufficiale", community: "Community di trader", desc: "Collegati al @{b} ufficiale per ricerche sulle commissioni con fonti, link ufficiali e condizioni dell’account; verifica le condizioni aggiornate sulla piattaforma." },
  ar: { intelligence: "بوت Telegram للمعلومات على مدار الساعة", review: "راجع الرسوم والشروط الرسمية على Telegram", research: "بحث في الرسوم والمنتجات مع المصادر", benefit: "تحقق من الميزة وفق القواعد الرسمية", sources: "مصادر رسمية للاحتياطيات والمخاطر", monitor: "راقب المنصة على Telegram ↗", channel: "قناة المعلومات الرسمية", community: "مجتمع المتداولين", desc: "اتصل بالبوت الرسمي @{b} للاطلاع على أبحاث الرسوم الموثّقة بالمصادر والروابط الرسمية وشروط الحساب، وتحقق من الشروط الحالية لدى المنصة." },
  // l10n: needs native review
  ur: { intelligence: "Telegram bot 24/7 معلومات", review: "Telegram پر فیس اور سرکاری شرائط دیکھیں", research: "ماخذ کے ساتھ فیس اور پروڈکٹ تحقیق", benefit: "صارف فائدہ سرکاری قواعد سے تصدیق کریں", sources: "ذخائر اور خطرات کے سرکاری ماخذ", monitor: "Telegram پر پلیٹ فارم مانیٹر کریں ↗", channel: "سرکاری معلومات چینل", community: "ٹریڈر کمیونٹی", desc: "سرکاری @{b} سے منسلک ہو کر ماخذ والی فیس تحقیق، سرکاری لنکس اور اکاؤنٹ شرائط دیکھیں؛ تازہ شرائط پلیٹ فارم پر لازماً تصدیق کریں۔" },
  // l10n: needs native review
  uk: { intelligence: "Telegram bot 24/7 інформація", review: "Перевірте комісії та офіційні умови в Telegram", research: "Дослідження комісій і продуктів із джерелами", benefit: "Перевірте перевагу за офіційними правилами", sources: "Офіційні джерела резервів і ризиків", monitor: "Моніторити платформу в Telegram ↗", channel: "Офіційний інформаційний канал", community: "Спільнота трейдерів", desc: "Підключіться до офіційного @{b}, щоб переглянути дослідження комісій із джерелами, офіційні посилання та умови акаунта; актуальні умови обов’язково перевіряйте на платформі." },
};


export { detailUiCoreByLocale, detailUi, dexFeeCompactUiByLocale, dexFeeCompactUi, clipboardFeedbackCopy, clipboardStatusText, copyFeedbackLabel, useCopyFeedback, CopyFeedbackStatus, telegramLocaleUi };
