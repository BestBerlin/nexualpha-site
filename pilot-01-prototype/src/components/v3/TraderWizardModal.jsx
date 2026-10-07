/**
 * TraderWizardModal — 30 秒“专属交易所智能匹配向导”
 * 3 个极简高转化问题定位用户画像，输出可解释的条件匹配结果，并支持一键带码直达。
 */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { BrandMark } from "../brand/BrandMark.jsx";
import { partnerRegistry } from "../../data/partner-registry.js";
import { regionalVenueCta } from "../../data/source-bound-cta.js";
import { contextualHref } from "../../data/contextual-href.js";
import { venueDatabase } from "../../data/venue-database.js";
import "./trader-wizard.css";

const wizardCopy = {
  "zh-Hans": {
    badge: "AI 选所向导",
    title: "30 秒测出最适合你的交易平台",
    subtitle: "根据您的地区、交易习惯与资产偏好，给出一个可核验的平台研究起点；费率、资格与安全条件仍需查看官方资料。",
    closeBtn: "关闭",
    prevBtn: "上一步",
    nextBtn: "下一步",
    restartBtn: "重新测试",
    finishBtn: "立即查看匹配结果",
    step1: {
      question: "1. 您的常驻地区 / 身份认证情况？",
      desc: "不同平台在不同国家/地区有严格的合规准入与 KYC 门槛",
      options: [
        { id: "cn", label: "中国大陆身份证 / 护照", desc: "需支持大陆证件合规认证，或免严格海外地址证明" },
        { id: "overseas", label: "海外身份 / 长期海外居住", desc: "拥有欧美、新加坡、中国香港等境外居留或合规身份" },
        { id: "nokyc", label: "注重隐私 / 偏好免 KYC", desc: "纯链上自托管，不提交个人护照/身份证，钱包直接交易" },
      ],
    },
    step2: {
      question: "2. 您最核心的交易类型与目标？",
      desc: "现货囤币、高杠杆永续合约与打新活动的手续费策略完全不同",
      options: [
        { id: "spot_earn", label: "现货囤币 / 长期定投 / 理财", desc: "最看重流动性深度、安全性、PoR 储备金证明与存币生息" },
        { id: "contract_fast", label: "高频短线 / 永续合约杠杆", desc: "最看重撮合速度、挂单零手续费或极低吃单费率、滑点控制" },
        { id: "onchain_dex", label: "链上土狗 / DEX 挖矿 / 新币打新", desc: "追求 Solana/Base/Arbitrum 极速链上撮合或平台 Launchpool" },
      ],
    },
    step3: {
      question: "3. 您的出入金与主要资产体量？",
      desc: "大额资金更看重顶级机构托管与赔付基金，小额更看重便捷通道",
      options: [
        { id: "retail", label: "常用微信/支付宝/银联 P2P 出入金", desc: "需要成熟的 C2C 法币买卖交易盾与商家信誉保障" },
        { id: "large", label: "10万+ USDT 机构/大体量资产", desc: "必须拥有数亿美元以上的投资者安全基金 (SAFU) 与每月公开审计" },
        { id: "crypto_only", label: "纯加密资产 / 钱包内部跨链", desc: "无需银行卡通道，自持 USDT/USDC/ETH 直接链上充提" },
      ],
    },
    result: {
      title: "为您智能匹配的最佳交易平台",
      matchScore: "匹配类型",
      reasonsTitle: "为什么适合您：",
      rebateTitle: "合作开户注册入口：",
      codeLabel: "专属合作码:",
      openBtn: "打开官方合作开户链接 ↗",
      reviewTerms: "先查看官方条件 ↗",
      routeReady: "合作入口已配置",
      benefitPending: "用户优惠以官方开户页显示为准",
      regionPending: "地区资格需在官方账户流程确认",
      viewDetail: "查看该交易所深度评测",
    }
  },
  "zh-Hant": {
    badge: "AI 選所嚮導",
    title: "30 秒測出最適合你的交易平台",
    subtitle: "根據您的地區、交易習慣與資產偏好，提供一個可核驗的平台研究起點；費率、資格與安全條件仍需查看官方資料。",
    closeBtn: "關閉",
    prevBtn: "上一步",
    nextBtn: "下一步",
    restartBtn: "重新測試",
    finishBtn: "立即查看匹配結果",
    step1: {
      question: "1. 您的常駐地區 / 身分認證情況？",
      desc: "不同平台在不同國家/地區有嚴格的合規准入與 KYC 門檻",
      options: [
        { id: "cn", label: "中國大陸身分證 / 護照", desc: "需支援大陸證件合規認證，或免嚴格海外地址證明" },
        { id: "overseas", label: "海外身分 / 長期海外居住", desc: "擁有歐美、新加坡、香港等境外居留或合規身分" },
        { id: "nokyc", label: "注重隱私 / 偏好免 KYC", desc: "純鏈上自託管，不提交個人護照/身分證，錢包直接交易" },
      ],
    },
    step2: {
      question: "2. 您最核心的交易類型與目標？",
      desc: "現貨囤幣、高槓桿永續合約與打新活動的手續費策略完全不同",
      options: [
        { id: "spot_earn", label: "現貨囤幣 / 長期定投 / 理財", desc: "最看重流動性深度、安全性、PoR 儲備金證明與存幣生息" },
        { id: "contract_fast", label: "高頻短線 / 永續合約槓桿", desc: "最看重撮合速度、掛單零手續費或極低吃單費率、滑點控制" },
        { id: "onchain_dex", label: "鏈上土狗 / DEX 挖礦 / 新幣打新", desc: "追求 Solana/Base/Arbitrum 極速鏈上撮合或平台 Launchpool" },
      ],
    },
    step3: {
      question: "3. 您的出入金與主要資產體量？",
      desc: "大額資金更看重頂級機構託管與賠付基金，小額更看重便捷管道",
      options: [
        { id: "retail", label: "常用 P2P / 銀行出入金", desc: "需要成熟的 C2C 法幣買賣交易盾與商家信譽保障" },
        { id: "large", label: "10萬+ USDT 機構/大體量資產", desc: "必須擁有數億美元以上的投資者安全基金 (SAFU) 與每月公開審計" },
        { id: "crypto_only", label: "純加密資產 / 錢包內部跨鏈", desc: "無需銀行卡管道，自持 USDT/USDC/ETH 直接鏈上充提" },
      ],
    },
    result: {
      title: "為您智慧匹配的最佳交易平台",
      matchScore: "匹配類型",
      reasonsTitle: "為什麼適合您：",
      rebateTitle: "合作開戶註冊入口：",
      codeLabel: "專屬合作碼:",
      openBtn: "打開官方合作註冊連結 ↗",
      reviewTerms: "先查看官方條件 ↗",
      routeReady: "合作入口已配置",
      benefitPending: "用戶優惠以官方開戶頁顯示為準",
      regionPending: "地區資格需在官方帳戶流程確認",
      viewDetail: "查看該交易所深度評測",
    }
  },
  en: {
    badge: "AI Matcher Wizard",
    title: "Find Your Best-Fit Exchange in 30 Seconds",
    subtitle: "A checkable research starting point based on your region, trading style, and liquidity preferences. Verify fees, eligibility, and security terms with official sources.",
    closeBtn: "Close",
    prevBtn: "Previous",
    nextBtn: "Next",
    restartBtn: "Start Over",
    finishBtn: "View Matching Results",
    step1: {
      question: "1. Your Primary Residency / Identity Document?",
      desc: "Venues enforce strict regional restrictions and KYC policies.",
      options: [
        { id: "cn", label: "Mainland China / Passport", desc: "Supports Chinese IDs or flexible verification" },
        { id: "overseas", label: "Global / Overseas Expat (EU/US/HK/SG)", desc: "Holding international passport, residency, or bank account" },
        { id: "nokyc", label: "Privacy Focus / No KYC", desc: "Pure non-custodial on-chain wallet trading" },
      ],
    },
    step2: {
      question: "2. Your Main Trading Activity & Strategy?",
      desc: "Fee tiers, execution latency, and launchpools differ significantly.",
      options: [
        { id: "spot_earn", label: "Spot Holding / DCA / Passive Yield", desc: "Prioritizes #1 liquidity depth, SAFU reserve fund, and PoR audits" },
        { id: "contract_fast", label: "High-Frequency / Derivatives & Perpetuals", desc: "Zero maker fees, ultra-low taker fees, tight order-book spreads" },
        { id: "onchain_dex", label: "DEX Meme Trading / Yield Farming / Launchpads", desc: "Solana/Base native DEX or active CEX launchpools" },
      ],
    },
    step3: {
      question: "3. Deposit Channel & Volume Scale?",
      desc: "Institutional safety funds matter for high net worth, P2P for retail.",
      options: [
        { id: "retail", label: "Fiat P2P / Bank Wire / Local Cards", desc: "Requires comprehensive retail C2C peer-to-peer escrows" },
        { id: "large", label: "High Volume ($100K+ USD)", desc: "Requires $1B+ SAFU protection fund and verifiable solvency" },
        { id: "crypto_only", label: "Crypto-Native / Stablecoin Rail", desc: "Pure on-chain USDT/USDC deposits without fiat rails" },
      ],
    },
    result: {
      title: "Your Top Recommended Exchange",
      matchScore: "Fit Type",
      reasonsTitle: "Why this platform fits you:",
      rebateTitle: "Partner Signup Route:",
      codeLabel: "Partner Referral Code:",
      openBtn: "Open Official Partner Route ↗",
      reviewTerms: "Review official terms first ↗",
      routeReady: "Partner route configured",
      benefitPending: "User benefit must be confirmed on the official signup page",
      regionPending: "Regional eligibility is confirmed in the official account flow",
      viewDetail: "Read In-Depth Profile",
    }
  },
};

const wizardLocaleUi = {
  ja: { badge:"AI取引所マッチャー", title:"30秒で検討候補を絞り込む", subtitle:"地域、取引スタイル、流動性の希望に基づく確認可能な調査の出発点です。手数料、利用資格、安全条件は公式情報で確認してください。", closeBtn:"閉じる", prevBtn:"戻る", nextBtn:"次へ", restartBtn:"もう一度", finishBtn:"結果を見る", steps:["居住地・本人確認","取引スタイル","入出金・資産規模"], result:["検討候補","適合タイプ","あなたに合う理由：","提携登録ルート：","提携コード：","公式提携ルートを開く ↗","公式条件を先に確認 ↗","提携ルート設定済み","公式登録ページで条件を確認してください","地域資格は公式アカウント手続きで確認してください","詳細プロフィールを見る"] },
  ko: { badge:"AI 거래소 매처", title:"30초 만에 맞는 거래소 찾기", subtitle:"지역, 거래 방식과 유동성 선호를 바탕으로 확인 가능한 조사 출발점을 제공합니다. 수수료, 이용 자격과 보안 조건은 공식 자료에서 확인하세요.", closeBtn:"닫기", prevBtn:"이전", nextBtn:"다음", restartBtn:"다시 시작", finishBtn:"추천 결과 보기", steps:["거주지·신원 확인","거래 방식","입출금·자산 규모"], result:["추천 거래소","조건 적합성","나에게 맞는 이유:","파트너 가입 경로:","파트너 추천 코드:","공식 파트너 경로 열기 ↗","공식 조건 먼저 확인 ↗","파트너 경로 설정됨","조건은 공식 가입 페이지에서 확인하세요","지역 자격은 공식 계정 절차에서 확인하세요","상세 프로필 보기"] },
  tr: { badge:"AI Borsa Eşleştirici", title:"Size en uygun borsayı 30 saniyede bulun", subtitle:"Bölgeniz, işlem tarzınız ve likidite tercihinize göre doğrulanabilir bir araştırma başlangıcı sunar. Ücretleri, uygunluğu ve güvenlik koşullarını resmi kaynaklardan kontrol edin.", closeBtn:"Kapat", prevBtn:"Geri", nextBtn:"İleri", restartBtn:"Baştan başla", finishBtn:"Sonuçları gör", steps:["İkamet ve kimlik","İşlem tarzı","Yatırma·çekme ve hacim"], result:["Önerilen borsa","Uygunluk türü","Size neden uygun:","Ortak kayıt rotası:","Ortak referans kodu:","Resmi ortak rotayı aç ↗","Önce resmi koşulları incele ↗","Ortak yönlendirme hazır","Koşullar resmi kayıt sayfasında doğrulanmalıdır","Bölgesel uygunluk resmi hesap akışında doğrulanır","Detaylı profili gör"] },
  es: { badge:"Asistente de comparación", title:"Encuentra tu plataforma ideal en 30 segundos", subtitle:"Un punto de partida verificable según tu región, estilo de trading y preferencias de liquidez. Confirma tarifas, elegibilidad y seguridad en fuentes oficiales.", closeBtn:"Cerrar", prevBtn:"Anterior", nextBtn:"Siguiente", restartBtn:"Empezar de nuevo", finishBtn:"Ver resultados", steps:["Residencia e identidad","Actividad de trading","Depósitos y volumen"], result:["Plataforma recomendada","Tipo de encaje","Por qué encaja:","Ruta de registro asociada:","Código de referido:","Abrir ruta oficial asociada ↗","Revisar condiciones oficiales ↗","Ruta asociada configurada","Confirma las condiciones en la página oficial","Confirma la elegibilidad regional en la cuenta oficial","Ver perfil completo"] },
  "pt-BR": { badge:"Comparador de plataformas", title:"Encontre sua plataforma ideal em 30 segundos", subtitle:"Um ponto de partida verificável conforme sua região, estilo de negociação e preferência de liquidez. Confirme taxas, elegibilidade e segurança em fontes oficiais.", closeBtn:"Fechar", prevBtn:"Anterior", nextBtn:"Próximo", restartBtn:"Recomeçar", finishBtn:"Ver resultado", steps:["Residência e identidade","Estilo de negociação","Depósito e volume"], result:["Plataforma recomendada","Tipo de ajuste","Por que combina:","Rota parceira de cadastro:","Código de indicação:","Abrir rota oficial parceira ↗","Ver condições oficiais ↗","Rota parceira configurada","Confirme as condições na página oficial","Confirme a elegibilidade regional na conta oficial","Ver perfil completo"] }
  ,fr: { badge:"Assistant de choix", title:"Trouvez votre plateforme idéale en 30 secondes", subtitle:"Un point de départ vérifiable selon votre région, votre style et vos besoins de liquidité. Vérifiez les frais, l’éligibilité et la sécurité auprès des sources officielles.", closeBtn:"Fermer", prevBtn:"Précédent", nextBtn:"Suivant", restartBtn:"Recommencer", finishBtn:"Voir les résultats", steps:["Résidence et identité","Style de trading","Dépôt et volume"], result:["Plateforme recommandée","Type d’adéquation","Pourquoi elle vous convient :","Parcours partenaire :","Code partenaire :","Ouvrir le parcours officiel partenaire ↗","Voir les conditions officielles ↗","Parcours partenaire configuré","Vérifiez les conditions sur la page officielle","Vérifiez l’éligibilité régionale dans le compte officiel","Voir le profil complet"] },
  de: { badge:"Plattform-Finder", title:"Finden Sie Ihre passende Plattform in 30 Sekunden", subtitle:"Ein überprüfbarer Ausgangspunkt nach Region, Handelsstil und Liquiditätsbedarf. Prüfen Sie Gebühren, Verfügbarkeit und Sicherheit in offiziellen Quellen.", closeBtn:"Schließen", prevBtn:"Zurück", nextBtn:"Weiter", restartBtn:"Neu starten", finishBtn:"Ergebnisse anzeigen", steps:["Wohnsitz und Identität","Handelsstil","Einzahlung und Volumen"], result:["Empfohlene Plattform","Passungstyp","Warum sie passt:","Partner-Registrierungsroute:","Partnercode:","Offizielle Partnerroute öffnen ↗","Offizielle Bedingungen prüfen ↗","Partnerroute eingerichtet","Bedingungen auf der offiziellen Seite prüfen","Regionale Eignung im offiziellen Konto prüfen","Vollständiges Profil ansehen"] },
  ru: { badge:"Помощник выбора биржи", title:"Найдите подходящую платформу за 30 секунд", subtitle:"Проверяемая отправная точка с учетом региона, стиля торговли и ликвидности. Уточните комиссии, доступность и безопасность в официальных источниках.", closeBtn:"Закрыть", prevBtn:"Назад", nextBtn:"Далее", restartBtn:"Начать заново", finishBtn:"Показать результат", steps:["Регион и личность","Стиль торговли","Пополнение и объём"], result:["Рекомендуемая платформа","Тип соответствия","Почему подходит:","Партнёрский маршрут регистрации:","Партнёрский код:","Открыть официальный партнёрский маршрут ↗","Сначала проверить условия ↗","Партнёрский маршрут настроен","Проверьте условия на официальной странице","Проверьте региональную доступность в аккаунте","Открыть профиль"] },
  ar: { badge:"مساعد اختيار المنصة", title:"اعثر على المنصة المناسبة خلال 30 ثانية", subtitle:"نقطة بحث قابلة للتحقق حسب منطقتك وأسلوب التداول والسيولة. تحقق من الرسوم والأهلية والأمان عبر المصادر الرسمية.", closeBtn:"إغلاق", prevBtn:"السابق", nextBtn:"التالي", restartBtn:"إعادة البدء", finishBtn:"عرض النتيجة", steps:["الإقامة والهوية","أسلوب التداول","الإيداع والحجم"], result:["المنصة المقترحة","نوع الملاءمة","لماذا تناسبك:","مسار تسجيل الشريك:","رمز الشريك:","فتح مسار الشريك الرسمي ↗","راجع الشروط الرسمية أولاً ↗","مسار الشريك جاهز","تحقق من الشروط في صفحة التسجيل الرسمية","تحقق من الأهلية الإقليمية في الحساب الرسمي","عرض الملف الكامل"] },
  id: { badge:"Pencari platform", title:"Temukan platform yang cocok dalam 30 detik", subtitle:"Titik awal riset yang dapat diperiksa berdasarkan wilayah, gaya trading, dan likuiditas. Verifikasi biaya, kelayakan, dan keamanan melalui sumber resmi.", closeBtn:"Tutup", prevBtn:"Sebelumnya", nextBtn:"Berikutnya", restartBtn:"Mulai lagi", finishBtn:"Lihat hasil", steps:["Domisili dan identitas","Gaya trading","Deposit dan volume"], result:["Platform rekomendasi","Jenis kecocokan","Mengapa cocok:","Rute pendaftaran mitra:","Kode mitra:","Buka rute mitra resmi ↗","Tinjau ketentuan resmi ↗","Rute mitra tersedia","Verifikasi ketentuan di halaman resmi","Verifikasi kelayakan wilayah di akun resmi","Lihat profil lengkap"] },
  vi: { badge:"Trình chọn sàn", title:"Tìm nền tảng phù hợp trong 30 giây", subtitle:"Điểm bắt đầu nghiên cứu có thể kiểm chứng theo khu vực, phong cách giao dịch và thanh khoản. Hãy xác minh phí, điều kiện và an toàn từ nguồn chính thức.", closeBtn:"Đóng", prevBtn:"Quay lại", nextBtn:"Tiếp theo", restartBtn:"Làm lại", finishBtn:"Xem kết quả", steps:["Nơi cư trú và danh tính","Phong cách giao dịch","Nạp tiền và quy mô"], result:["Nền tảng đề xuất","Loại phù hợp","Vì sao phù hợp:","Đường dẫn đăng ký đối tác:","Mã đối tác:","Mở đường dẫn đối tác chính thức ↗","Xem điều kiện chính thức ↗","Đã cấu hình đường dẫn đối tác","Xác minh điều kiện trên trang chính thức","Xác minh điều kiện khu vực trong tài khoản","Xem hồ sơ đầy đủ"] },
  it: { badge:"Assistente per la scelta", title:"Trova la piattaforma giusta in 30 secondi", subtitle:"Un punto di partenza verificabile in base ad area, stile di trading e liquidità. Verifica costi, idoneità e sicurezza nelle fonti ufficiali.", closeBtn:"Chiudi", prevBtn:"Indietro", nextBtn:"Avanti", restartBtn:"Ricomincia", finishBtn:"Vedi risultato", steps:["Residenza e identità","Stile di trading","Deposito e volume"], result:["Piattaforma consigliata","Tipo di idoneità","Perché è adatta:","Percorso partner di registrazione:","Codice partner:","Apri percorso partner ufficiale ↗","Controlla prima i termini ufficiali ↗","Percorso partner configurato","Verifica i termini sulla pagina ufficiale","Verifica l’idoneità regionale nell’account ufficiale","Vedi profilo completo"] }
};
const wizardOptionUi = {
  ja: [
    [["中国本土・パスポート", "中国の本人確認書類に対応"] ,["海外居住・海外身分", "国際パスポート、居住資格、銀行口座を保有"] ,["プライバシー重視・KYCなし", "本人確認なしのセルフカストディ取引"]],
    [["現物保有・積立・運用", "流動性、安全性、準備金証明を重視"] ,["短期・デリバティブ・無期限", "約定速度、低い手数料、滑りを重視"] ,["DEX・新規トークン・利回り", "Solana/Baseなどのオンチェーン取引"]],
    [["法定通貨・P2P・銀行", "地域の入出金とエスクローを重視"] ,["大口・10万USDT以上", "機関向け保護基金と支払能力を重視"] ,["暗号資産のみ・ステーブルコイン", "銀行を使わずオンチェーンで入出金"]],
  ],
  ko: [
    [["중국 본토·여권", "중국 신분증 및 유연한 인증 지원"] ,["해외 거주·해외 신원", "국제 여권, 거주권 또는 은행 계좌 보유"] ,["개인정보 중시·KYC 없음", "신원 제출 없는 셀프 커스터디 거래"]],
    [["현물 보유·적립·수익", "유동성, 안전성, 준비금 증명을 중시"] ,["단기·파생상품·무기한", "체결 속도와 낮은 수수료, 슬리피지 관리"] ,["DEX·신규 토큰·수익 농사", "Solana/Base 등 온체인 거래"]],
    [["법정화폐·P2P·은행", "지역 입출금과 에스크로를 중시"] ,["대규모·10만 USDT 이상", "기관 보호기금과 지급능력을 중시"] ,["암호자산만·스테이블코인", "은행 없이 온체인 입출금"]],
  ],
  tr: [
    [["Çin ana karası·pasaport", "Çin kimlikleri ve esnek doğrulama"] ,["Yurt dışı ikamet·kimlik", "Uluslararası pasaport, ikamet veya banka hesabı"] ,["Gizlilik·KYC yok", "Kimlik göndermeden saklama dışı işlem"]],
    [["Spot tutma·DCA·getiri", "Likidite, güvenlik ve rezerv kanıtı"] ,["Kısa vadeli·vadeli işlemler", "Hızlı emir, düşük ücret ve kayma kontrolü"] ,["DEX·yeni token·getiri", "Solana/Base gibi zincir üstü işlemler"]],
    [["Fiat·P2P·banka", "Yerel para yatırma ve emanet hizmeti"] ,["Büyük hacim·100 bin USDT+", "Kurumsal koruma fonu ve ödeme gücü"] ,["Yalnızca kripto·stablecoin", "Banka olmadan zincir üstü yatırma/çekme"]],
  ],
  es: [
    [["China continental·pasaporte", "Admite documentos chinos y verificación flexible"] ,["Residencia o identidad extranjera", "Pasaporte, residencia o cuenta bancaria internacional"] ,["Privacidad·sin KYC", "Operar con autocustodia sin entregar documentos"]],
    [["Spot·DCA·rendimiento", "Prioriza liquidez, seguridad y reservas"] ,["Corto plazo·perpetuos", "Velocidad, comisiones bajas y poco deslizamiento"] ,["DEX·tokens nuevos·yield", "Operativa on-chain en Solana/Base"]],
    [["Fiat·P2P·banco", "Ingresos y retiros locales con custodia"] ,["Gran volumen·más de 100.000 USDT", "Fondo de protección y solvencia institucional"] ,["Solo cripto·stablecoins", "Depósitos on-chain sin canales bancarios"]],
  ],
  "pt-BR": [
    [["China continental·passaporte", "Aceita documentos chineses e verificação flexível"] ,["Residência ou identidade no exterior", "Passaporte, residência ou conta bancária internacional"] ,["Privacidade·sem KYC", "Operação autocustodial sem enviar documentos"]],
    [["Spot·DCA·rendimento", "Prioriza liquidez, segurança e reservas"] ,["Curto prazo·perpétuos", "Velocidade, taxas baixas e pouco slippage"] ,["DEX·novos tokens·yield", "Operação on-chain em Solana/Base"]],
    [["Fiat·P2P·banco", "Depósitos e saques locais com escrow"] ,["Grande volume·mais de 100 mil USDT", "Fundo de proteção e solvência institucional"] ,["Somente cripto·stablecoins", "Depósitos on-chain sem canais bancários"]],
  ],
  fr: [
    [["Chine continentale·passeport", "Documents chinois et vérification flexible"], ["Résidence ou identité étrangère", "Passeport, résidence ou compte bancaire international"], ["Confidentialité·sans KYC", "Trading en auto-conservation sans justificatif"]],
    [["Spot·DCA·rendement", "Liquidité, sécurité et preuve de réserves"], ["Court terme·perpétuels", "Vitesse, frais réduits et faible glissement"], ["DEX·nouveaux tokens·yield", "Trading on-chain sur Solana/Base"]],
    [["Fiat·P2P·banque", "Dépôts et retraits locaux avec séquestre"], ["Gros volume·plus de 100 000 USDT", "Fonds de protection et solvabilité institutionnelle"], ["Crypto uniquement·stablecoins", "Dépôts on-chain sans circuit bancaire"]],
  ],
  de: [
    [["China·Pass", "Chinesische Dokumente und flexible Prüfung"], ["Ausland·internationale Identität", "Internationaler Pass, Aufenthalt oder Bankkonto"], ["Privatsphäre·ohne KYC", "Self-Custody ohne Dokumentenabgabe"]],
    [["Spot·DCA·Rendite", "Liquidität, Sicherheit und Reservenachweis"], ["Kurzfristig·Perpetuals", "Schnelle Ausführung, niedrige Gebühren, wenig Slippage"], ["DEX·neue Token·Yield", "On-Chain-Handel auf Solana/Base"]],
    [["Fiat·P2P·Bank", "Lokale Ein- und Auszahlungen mit Treuhand"], ["Großvolumen·über 100.000 USDT", "Schutzfonds und institutionelle Solvenz"], ["Nur Krypto·Stablecoins", "On-Chain-Einzahlungen ohne Bankkanal"]],
  ],
  ru: [
    [["Китай·паспорт", "Китайские документы и гибкая проверка"], ["Иностранная резиденция", "Международный паспорт, ВНЖ или банковский счёт"], ["Конфиденциальность·без KYC", "Торговля с самостоятельным хранением"]],
    [["Спот·DCA·доходность", "Ликвидность, безопасность и подтверждение резервов"], ["Краткосрочно·бессрочные контракты", "Скорость, низкие комиссии и контроль проскальзывания"], ["DEX·новые токены·yield", "Ончейн-торговля в Solana/Base"]],
    [["Фиат·P2P·банк", "Местные пополнения и выводы с эскроу"], ["Крупный объём·100 000 USDT+", "Фонд защиты и институциональная платёжеспособность"], ["Только крипто·стейблкоины", "Ончейн-ввод без банковских каналов"]],
  ],
  ar: [
    [["الصين·جواز سفر", "مستندات صينية وتحقق مرن"], ["إقامة أو هوية أجنبية", "جواز أو إقامة أو حساب بنكي دولي"], ["الخصوصية·بدون KYC", "تداول بحفظ ذاتي دون إرسال مستندات"]],
    [["فوري·استثمار دوري·عائد", "السيولة والأمان وإثبات الاحتياطيات"], ["قصير الأجل·عقود دائمة", "سرعة التنفيذ ورسوم منخفضة وانزلاق محدود"], ["DEX·رموز جديدة·عائد", "تداول على السلسلة في Solana/Base"]],
    [["فيات·P2P·بنك", "إيداع وسحب محلي مع ضمان"], ["حجم كبير·أكثر من 100 ألف USDT", "صندوق حماية وملاءة مؤسسية"], ["عملات رقمية فقط·عملات مستقرة", "إيداع على السلسلة دون قنوات بنكية"]],
  ],
  id: [
    [["China·paspor", "Dokumen Tiongkok dan verifikasi fleksibel"], ["Identitas atau domisili luar negeri", "Paspor, izin tinggal, atau rekening internasional"], ["Privasi·tanpa KYC", "Trading kustodi mandiri tanpa dokumen"]],
    [["Spot·DCA·imbal hasil", "Likuiditas, keamanan, dan bukti cadangan"], ["Jangka pendek·perpetual", "Kecepatan, biaya rendah, dan slippage kecil"], ["DEX·token baru·yield", "Trading on-chain di Solana/Base"]],
    [["Fiat·P2P·bank", "Setor tarik lokal dengan escrow"], ["Volume besar·lebih dari 100 ribu USDT", "Dana perlindungan dan solvabilitas institusi"], ["Kripto saja·stablecoin", "Setoran on-chain tanpa jalur bank"]],
  ],
  vi: [
    [["Trung Quốc·hộ chiếu", "Giấy tờ Trung Quốc và xác minh linh hoạt"], ["Cư trú hoặc danh tính quốc tế", "Hộ chiếu, cư trú hoặc tài khoản ngân hàng quốc tế"], ["Ưu tiên riêng tư·không KYC", "Giao dịch tự lưu ký không gửi giấy tờ"]],
    [["Spot·DCA·lợi suất", "Thanh khoản, an toàn và bằng chứng dự trữ"], ["Ngắn hạn·hợp đồng vĩnh viễn", "Tốc độ, phí thấp và kiểm soát trượt giá"], ["DEX·token mới·yield", "Giao dịch on-chain trên Solana/Base"]],
    [["Fiat·P2P·ngân hàng", "Nạp rút nội địa có ký quỹ"], ["Khối lượng lớn·trên 100.000 USDT", "Quỹ bảo vệ và khả năng thanh toán tổ chức"], ["Chỉ crypto·stablecoin", "Nạp on-chain không qua ngân hàng"]],
  ],
  it: [
    [["Cina·passaporto", "Documenti cinesi e verifica flessibile"], ["Residenza o identità estera", "Passaporto, residenza o conto bancario internazionale"], ["Privacy·senza KYC", "Trading in auto-custodia senza documenti"]],
    [["Spot·DCA·rendimento", "Liquidità, sicurezza e prova delle riserve"], ["Breve termine·perpetui", "Velocità, commissioni basse e poco slippage"], ["DEX·nuovi token·yield", "Trading on-chain su Solana/Base"]],
    [["Fiat·P2P·banca", "Depositi e prelievi locali con escrow"], ["Grandi volumi·oltre 100.000 USDT", "Fondo di protezione e solvibilità istituzionale"], ["Solo crypto·stablecoin", "Depositi on-chain senza canali bancari"]],
  ],
};

const wizardStepDescUi = {
  ja: [
    "取引所ごとに地域制限と本人確認条件が異なります。",
    "現物、デリバティブ、ローンチ企画では手数料と約定条件が異なります。",
    "大口資産では保護体制、小口利用では入出金の使いやすさが重要です。",
  ],
  ko: [
    "거래소마다 지역 제한과 본인 확인 조건이 다릅니다.",
    "현물, 파생상품, 런치 프로그램은 수수료와 체결 조건이 다릅니다.",
    "대규모 자산은 보호 체계, 소규모 이용은 입출금 편의성이 중요합니다.",
  ],
  tr: [
    "Her platformun bölgesel erişim ve kimlik doğrulama koşulları farklıdır.",
    "Spot, türev ve lansman programlarında ücretler ve işlem koşulları değişir.",
    "Büyük tutarlarda koruma yapısı, küçük tutarlarda para yatırma kolaylığı öne çıkar.",
  ],
  es: [
    "Cada plataforma aplica restricciones regionales y requisitos de identidad distintos.",
    "Spot, derivados y programas de lanzamiento tienen comisiones y ejecución diferentes.",
    "Para grandes importes importa la protección; para minoristas, la facilidad de depósito.",
  ],
  "pt-BR": [
    "Cada plataforma aplica restrições regionais e requisitos de identidade diferentes.",
    "Spot, derivativos e programas de lançamento têm taxas e execução diferentes.",
    "Para valores altos importa a proteção; no varejo, a facilidade de depósito e saque.",
  ],
  fr: [
    "Chaque plateforme applique ses propres restrictions régionales et règles d'identité.",
    "Le spot, les dérivés et les programmes de lancement ont des frais et conditions différents.",
    "Les gros montants exigent une protection solide; le détail privilégie la facilité de dépôt.",
  ],
  de: [
    "Jede Plattform hat eigene regionale Zugangs- und Identitätsanforderungen.",
    "Spot, Derivate und Launch-Programme unterscheiden sich bei Gebühren und Ausführung.",
    "Bei großen Beträgen zählt der Schutz, im Privatbereich einfache Ein- und Auszahlungen.",
  ],
  ru: [
    "У каждой платформы свои региональные ограничения и требования к идентификации.",
    "Спот, деривативы и программы запуска отличаются комиссиями и условиями исполнения.",
    "Для крупных сумм важна защита, для розницы — удобство пополнения и вывода.",
  ],
  ar: [
    "تختلف قيود المناطق ومتطلبات التحقق من الهوية بين منصة وأخرى.",
    "تختلف الرسوم وشروط التنفيذ بين التداول الفوري والمشتقات وبرامج الإطلاق.",
    "تحتاج المبالغ الكبيرة إلى حماية أقوى، بينما تهم سهولة الإيداع والسحب للمستخدم الفردي.",
  ],
  id: [
    "Setiap platform memiliki batas wilayah dan persyaratan identitas yang berbeda.",
    "Spot, derivatif, dan program peluncuran memiliki biaya serta eksekusi yang berbeda.",
    "Dana besar memerlukan perlindungan kuat; pengguna ritel mengutamakan kemudahan setor-tarik.",
  ],
  vi: [
    "Mỗi nền tảng có giới hạn khu vực và yêu cầu xác minh danh tính khác nhau.",
    "Giao dịch spot, phái sinh và chương trình ra mắt có phí và điều kiện khớp lệnh khác nhau.",
    "Khoản lớn cần cơ chế bảo vệ; người dùng nhỏ lẻ cần nạp rút thuận tiện.",
  ],
  it: [
    "Ogni piattaforma applica limiti regionali e requisiti di identità diversi.",
    "Spot, derivati e programmi di lancio hanno commissioni e condizioni di esecuzione diverse.",
    "Per grandi importi conta la protezione; per il retail la facilità di deposito e prelievo.",
  ],
};

function localizedWizard(locale) {
  const localeKey = String(locale || "en").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  const ui = wizardLocaleUi[locale] || wizardLocaleUi[localeKey]; if (!ui) return wizardCopy.en; const base = wizardCopy.en;
  const t = {...base, ...Object.fromEntries(["badge","title","subtitle","closeBtn","prevBtn","nextBtn","restartBtn","finishBtn"].map(k => [k, ui[k]]))};
  ["step1","step2","step3"].forEach((key, i) => {
    const translatedOptions = (wizardOptionUi[locale] || wizardOptionUi[localeKey])?.[i];
    const translatedDesc = (wizardStepDescUi[locale] || wizardStepDescUi[localeKey])?.[i];
    t[key] = {
      ...base[key],
      question: `${i + 1}. ${ui.steps[i]}`,
      ...(translatedDesc ? { desc: translatedDesc } : {}),
      ...(translatedOptions ? { options: translatedOptions.map(([label, desc], optionIndex) => ({ ...base[key].options[optionIndex], label, desc })) } : {}),
    };
  });
  const r = ui.result; t.result = {...base.result, title:r[0], matchScore:r[1], reasonsTitle:r[2], rebateTitle:r[3], codeLabel:r[4], openBtn:r[5], reviewTerms:r[6], routeReady:r[7], benefitPending:r[8], regionPending:r[9], viewDetail:r[10]}; return t;
}

const wizardStatusUi = {
  ja: { yes: "はい", pending: "確認待ち", noCode: "コード不要" },
  ko: { yes: "예", pending: "확인 대기", noCode: "코드 없음" },
  tr: { yes: "Evet", pending: "Kontrol bekliyor", noCode: "Kod gerekmiyor" },
  es: { yes: "Sí", pending: "Pendiente de revisión", noCode: "No requiere código" },
  "pt-BR": { yes: "Sim", pending: "Pendente de verificação", noCode: "Sem código" },
  fr: { yes: "Oui", pending: "À vérifier", noCode: "Aucun code requis" },
  de: { yes: "Ja", pending: "Prüfung ausstehend", noCode: "Kein Code erforderlich" },
  ru: { yes: "Да", pending: "Ожидает проверки", noCode: "Код не нужен" },
  ar: { yes: "نعم", pending: "بانتظار التحقق", noCode: "الرمز غير مطلوب" },
  id: { yes: "Ya", pending: "Menunggu verifikasi", noCode: "Tanpa kode" },
  vi: { yes: "Có", pending: "Đang chờ xác minh", noCode: "Không cần mã" },
  it: { yes: "Sì", pending: "Verifica in sospeso", noCode: "Nessun codice" },
};

function wizardStatus(locale) {
  const key = String(locale || "en").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  return wizardStatusUi[locale] || wizardStatusUi[key] || { yes: "Yes", pending: "Pending", noCode: "No code needed" };
}

function readCurrentQuery() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    market: params.get("market") || undefined,
    product: params.get("product") || undefined,
  };
}

function initialTradingChoice(product) {
  if (product === "spot") return "spot_earn";
  if (product === "perpetuals") return "contract_fast";
  return "contract_fast";
}

function initialResidencyChoice(market) {
  return String(market || "").trim().toUpperCase() === "CN" ? "cn" : "overseas";
}

function productFromWizardChoice(choice, fallback = "spot") {
  if (choice === "spot_earn") return "spot";
  if (choice === "contract_fast") return "perpetuals";
  if (choice === "onchain_dex") return "dex";
  return fallback || "spot";
}

function marketFromWizardChoice(choice, fallback) {
  if (choice === "cn") return "CN";
  if (choice === "nokyc") return "GLOBAL";
  return fallback || "GLOBAL";
}

function fitLabelForWizard({ ans1, ans2, ans3, isZh }) {
  if (ans1 === "nokyc") return isZh ? "自托管条件匹配" : "Self-custody fit";
  if (ans2 === "contract_fast") return isZh ? "合约条件匹配" : "Derivatives fit";
  if (ans3 === "large") return isZh ? "大额资金条件匹配" : "Large-account fit";
  return isZh ? "条件匹配" : "Conditional fit";
}

const wizardFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function TraderWizardModal({ isOpen, onClose, locale = "en", market, product }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const t = isHant ? wizardCopy["zh-Hant"] : isZh ? wizardCopy["zh-Hans"] : localizedWizard(locale);
  const status = isHant ? { yes: "是", pending: "待配置", noCode: "無需邀請碼" } : isZh ? { yes: "是", pending: "待配置", noCode: "无需邀请码" } : wizardStatus(locale);
  const queryContext = useMemo(() => readCurrentQuery(), []);
  const contextMarket = market || queryContext.market;
  const contextProduct = product || queryContext.product || "spot";
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const [step, setStep] = useState(1);
  const [ans1, setAns1] = useState(() => initialResidencyChoice(contextMarket));
  const [ans2, setAns2] = useState(() => initialTradingChoice(contextProduct));
  const [ans3, setAns3] = useState("retail");
  const derivedMarket = marketFromWizardChoice(ans1, contextMarket);
  const derivedProduct = productFromWizardChoice(ans2, contextProduct);
  const wizardContext = useMemo(() => ({
    locale,
    market: derivedMarket,
    product: derivedProduct,
    wizard_region: ans1,
    wizard_strategy: ans2,
    wizard_scale: ans3,
  }), [locale, derivedMarket, derivedProduct, ans1, ans2, ans3]);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = modalRef.current;
    let active = true;
    const initialFocusFrame = window.requestAnimationFrame(() => {
      if (active) modal?.querySelector(wizardFocusableSelector)?.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !modal) return;
      const focusable = Array.from(modal.querySelectorAll(wizardFocusableSelector))
        .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      active = false;
      window.cancelAnimationFrame(initialFocusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
      previousFocusRef.current = null;
    };
  }, [isOpen]);

  // 智能推荐打分决策树
  const matchResult = useMemo(() => {
    let topSlug = "binance";
    let fitLabel = fitLabelForWizard({ ans1, ans2, ans3, isZh });
    let reasons = [];

    if (ans1 === "nokyc") {
      if (ans2 === "contract_fast") {
        topSlug = "hyperliquid";
        reasons = [
          isZh ? "更适合自托管钱包与链上永续合约研究路径" : "Fits a self-custody wallet and on-chain perpetuals research path",
          isZh ? "先核对费用、资金费率、保证金与清算规则，再进入官方 App" : "Check fees, funding, margin and liquidation rules before opening the official app",
          isZh ? "入金、桥接与地区访问条件仍需在官方流程确认" : "Deposit, bridge and regional access conditions still need official confirmation",
        ];
      } else {
        topSlug = "drift";
        reasons = [
          isZh ? "更接近钱包直连、链上交易与 DEX 研究路径" : "Fits a wallet-connected, on-chain DEX research path",
          isZh ? "重点检查网络、资产、保证金与自托管风险" : "Prioritizes network, asset, margin and self-custody checks",
          isZh ? "是否可用、费用与钱包条件以官方页面为准" : "Availability, fees and wallet requirements remain official-page conditions",
        ];
      }
    } else if (ans1 === "cn") {
      if (ans2 === "contract_fast") {
        topSlug = "bitget";
        reasons = [
          isZh ? "当前答案更偏向合约、跟单与高频执行场景" : "Your answers point to derivatives, copy-trading and faster execution workflows",
          isZh ? "合作入口已配置，但地区资格与用户优惠仍以官方开户页为准" : "The partner route is configured; eligibility and user benefits are confirmed on the official signup page",
          isZh ? "继续前应核对 KYC、合约权限、费率与出入金条件" : "Check KYC, derivatives permissions, fee terms and funding conditions before continuing",
        ];
      } else if (ans2 === "onchain_dex") {
        topSlug = "okx";
        reasons = [
          isZh ? "当前答案更偏向 Web3 钱包、链上 DApp 与 CEX 账户联动" : "Your answers point to Web3 wallet, on-chain app and CEX-account workflows",
          isZh ? "先核对官方钱包路径、KYC、P2P 与网络费用" : "Check the official wallet route, KYC, P2P and network fees first",
          isZh ? "合作入口只负责进入官方流程，不替代官方条件确认" : "The partner route opens the official flow and does not replace official term checks",
        ];
      } else {
        topSlug = "binance";
        reasons = [
          isZh ? "当前答案更偏向现货、长期持有与主流流动性" : "Your answers point to spot trading, long-term holding and flagship liquidity",
          isZh ? "先核对官方开户、KYC、现货费率与资金通道" : "Check official signup, KYC, spot fees and funding rails first",
          isZh ? "邀请码可用于合作入口，用户权益以官方账户流程显示为准" : "The invite code belongs to the partner route; user terms are controlled by the official account flow",
        ];
      }
    } else {
      // overseas
      if (ans2 === "spot_earn" && ans3 === "large") {
        topSlug = "coinbase";
        reasons = [
          isZh ? "当前答案更偏向大额、合规法币通道与托管透明度" : "Your answers point to large-account, regulated fiat and custody-transparency needs",
          isZh ? "先核对所在地区、银行通道、KYC 与账户等级限制" : "Check your region, banking rails, KYC and account-tier limits first",
          isZh ? "后续动作应以官方账户审核结果为准" : "Next steps depend on the official account-review result",
        ];
      } else if (ans2 === "contract_fast") {
        topSlug = "bybit";
        reasons = [
          isZh ? "当前答案更偏向海外身份下的衍生品与活跃交易" : "Your answers point to derivatives and active trading under an overseas profile",
          isZh ? "先核对所在地区、合约权限、费率与风险提示" : "Check region, derivatives permissions, fee terms and risk notices first",
          isZh ? "合作入口已配置，具体优惠与资格以官方页为准" : "The partner route is configured; benefit and eligibility details remain official-page terms",
        ];
      } else {
        topSlug = "binance";
        reasons = [
          isZh ? "当前答案更偏向全球账户、现货与主流资产研究" : "Your answers point to global account access, spot trading and major-asset research",
          isZh ? "先核对地区、KYC、费率、Earn 与资产范围" : "Check region, KYC, fees, Earn products and asset coverage first",
          isZh ? "合作入口可进入官方流程，最终条款由官方页面决定" : "The partner route opens the official flow; final terms are set on the official page",
        ];
      }
    }

    const db = venueDatabase[topSlug] || {};
    const cta = regionalVenueCta(topSlug, locale, derivedMarket, derivedProduct);
    const inviteCode = cta.inviteCode;
    const directRoute = cta.direct;
    const regUrl = directRoute
      ? cta.registrationUrl
      : contextualHref(`/exchanges/${topSlug}#registration-path`, wizardContext);
    const perkText = cta.benefit;

    return {
      slug: topSlug,
      name: db.name || topSlug,
      category: db.category || "CEX",
      fitLabel,
      reasons,
      inviteCode,
      regUrl,
      perkText,
      directRoute,
      hasPartnerRoute: cta.hasPartnerRoute,
      benefitVerified: cta.benefitVerified,
      regionEligible: cta.regionEligible,
      claimStatus: cta.claim.status,
      ctaState: cta.ctaState,
    };
  }, [ans1, ans2, ans3, derivedMarket, derivedProduct, isZh, locale, wizardContext]);

  const localizedReasons = !isZh && locale !== "en"
    ? [
      t.step1.options.find((option) => option.id === ans1)?.desc,
      t.step2.options.find((option) => option.id === ans2)?.desc,
      t.step3.options.find((option) => option.id === ans3)?.desc,
    ].filter(Boolean)
    : matchResult.reasons;

  if (!isOpen) return null;

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div
        className="wizard-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="wizard-modal__close" onClick={onClose} aria-label={t.closeBtn}>
          ✕
        </button>

        <div className="wizard-modal__header">
          <div className="wizard-modal__pill">
            <span className="wizard-modal__pulse"></span>
            {t.badge}
          </div>
          <h2 className="wizard-modal__title" id="wizard-modal-title">{t.title}</h2>
          <p className="wizard-modal__subtitle">{t.subtitle}</p>

          {step <= 3 && (
            <div className="wizard-progress">
              <div className="wizard-progress__bar" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>
          )}
        </div>

        <div className="wizard-modal__body">
          {step === 1 && (
            <div className="wizard-step">
              <h3 className="wizard-step__q">{t.step1.question}</h3>
              <p className="wizard-step__d">{t.step1.desc}</p>
              <div className="wizard-options">
                {t.step1.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`wizard-opt ${ans1 === opt.id ? "wizard-opt--active" : ""}`}
                    aria-pressed={ans1 === opt.id}
                    onClick={() => setAns1(opt.id)}
                  >
                    <div className="wizard-opt__radio"></div>
                    <div>
                      <div className="wizard-opt__label">{opt.label}</div>
                      <div className="wizard-opt__desc">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <h3 className="wizard-step__q">{t.step2.question}</h3>
              <p className="wizard-step__d">{t.step2.desc}</p>
              <div className="wizard-options">
                {t.step2.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`wizard-opt ${ans2 === opt.id ? "wizard-opt--active" : ""}`}
                    aria-pressed={ans2 === opt.id}
                    onClick={() => setAns2(opt.id)}
                  >
                    <div className="wizard-opt__radio"></div>
                    <div>
                      <div className="wizard-opt__label">{opt.label}</div>
                      <div className="wizard-opt__desc">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <h3 className="wizard-step__q">{t.step3.question}</h3>
              <p className="wizard-step__d">{t.step3.desc}</p>
              <div className="wizard-options">
                {t.step3.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`wizard-opt ${ans3 === opt.id ? "wizard-opt--active" : ""}`}
                    aria-pressed={ans3 === opt.id}
                    onClick={() => setAns3(opt.id)}
                  >
                    <div className="wizard-opt__radio"></div>
                    <div>
                      <div className="wizard-opt__label">{opt.label}</div>
                      <div className="wizard-opt__desc">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-result">
              <div className="wizard-result__hero">
                <div className="wizard-result__score-badge">
                  {t.result.matchScore} <strong>{matchResult.fitLabel}</strong>
                </div>
                <div className="wizard-result__brand">
                  <div className="wizard-result__logo">
                    <BrandMark slug={matchResult.slug} />
                  </div>
                  <div>
                    <h3 className="wizard-result__name" translate="no" lang="en">{matchResult.name}</h3>
                    <span className="wizard-result__category">{matchResult.category}</span>
                  </div>
                </div>
              </div>

	              <div className="wizard-result__perk-box">
	                <div className="wizard-result__perk-title">{t.result.rebateTitle}</div>
	                <div className="wizard-result__perk-text">{matchResult.perkText || t.result.benefitPending}</div>
	                <div className="wizard-result__code-row">
	                  <span>{t.result.routeReady}</span>
	                  <strong>{matchResult.hasPartnerRoute ? status.yes : status.pending}</strong>
	                </div>
	                <div className="wizard-result__code-row">
	                  <span>{t.result.codeLabel}</span>
	                  <strong className="wizard-result__code" translate="no">{matchResult.inviteCode || status.noCode}</strong>
	                </div>
	                {!matchResult.benefitVerified && <div className="wizard-result__code-row">
	                  <span>{t.result.benefitPending}</span>
	                  <strong>{matchResult.claimStatus}</strong>
	                </div>}
	                {!matchResult.regionEligible && <div className="wizard-result__code-row">
	                  <span>{t.result.regionPending}</span>
	                  <strong>{matchResult.ctaState}</strong>
	                </div>}
	              </div>

              <div className="wizard-result__reasons">
                <div className="wizard-result__reasons-title">{t.result.reasonsTitle}</div>
                <ul>
                  {localizedReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="wizard-result__actions">
                <a
                  href={matchResult.regUrl}
                  target={matchResult.directRoute ? "_blank" : undefined}
                  rel={matchResult.directRoute ? "sponsored noopener noreferrer" : undefined}
                  className="wizard-result__cta"
                  data-cta-kind={matchResult.directRoute ? "registration" : "research"}
                  data-cta-platform={matchResult.slug}
                  data-cta-placement="wizard-result-primary"
                  data-cta-status={matchResult.claimStatus}
                  data-growth-decision={matchResult.slug}
                  data-growth-placement="wizard-result-primary"
                >
                  {matchResult.directRoute ? t.result.openBtn : t.result.reviewTerms}
                </a>
	                <a
	                  href={contextualHref(`/exchanges/${matchResult.slug}`, wizardContext)}
	                  className="wizard-result__secondary"
	                >
                  {t.result.viewDetail}
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-modal__footer">
          {step > 1 && step <= 3 && (
            <button type="button" className="wizard-btn wizard-btn--ghost" onClick={() => setStep(step - 1)}>
              {t.prevBtn}
            </button>
          )}

          {step < 3 && (
            <button type="button" className="wizard-btn wizard-btn--primary" onClick={() => setStep(step + 1)}>
              {t.nextBtn}
            </button>
          )}

          {step === 3 && (
            <button type="button" className="wizard-btn wizard-btn--primary" onClick={() => setStep(4)}>
              {t.finishBtn}
            </button>
          )}

          {step === 4 && (
            <button type="button" className="wizard-btn wizard-btn--ghost" onClick={() => setStep(1)}>
              {t.restartBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TraderWizardModal;
