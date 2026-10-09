import { nextDecisionBridgeCopy } from "../../data/next-decision-bridge.js";
import React, { useEffect, useRef, useState } from "react";
import { TOPIC_GUIDES, TOPIC_SLUGS } from "../../data/topic-guides-data.js";
import { neutralVenueCatalog } from "../../data/market-command.js";
import { publicCtaForTopicPlatform, publicCtaForVenue } from "../../data/source-bound-cta.js";
import { TOPIC_SOURCE_REVIEW_DATE, topicSourcesFor } from "../../data/topic-source-registry.js";
import { topicReviewedFaqRecords } from "../../data/topic-reviewed-faqs.js";
import { sanitizePublicText } from "../../data/public-copy-sanitizer.js";
import { getTelegramDeepLink } from "../../data/telegram-config.js";
import { localizedHref } from "../../data/locale-routing.js";
import { enIfLatin } from "../../utils/fallback-lang.js";
import { NextDecisionBridge } from "./NextDecisionBridge.jsx";
import { OnsiteTelegramBotHandoff } from "./OnsiteTelegramBotHandoff.jsx";
import { PERP_COST_FIELD_DICTIONARY, PERP_COST_FIELD_DICTIONARY_VERSION, PERP_COST_FIELD_SOURCES } from "../../data/perp-cost-field-dictionary.js";
import { TopDecisionBox } from "./TopDecisionBox.jsx";
import "./topic-guide.css";

const TOPIC_FAQ_SOURCE_COPY = {
  en: ['Source reviewed', 'Source updated'], 'zh-Hans': ['来源核对', '原文更新'], 'zh-Hant': ['來源核對', '原文更新'],
  ja: ['出典確認', '原文更新'], ko: ['출처 확인', '원문 업데이트'], tr: ['Kaynak incelendi', 'Kaynak güncellendi'],
  es: ['Fuente revisada', 'Fuente actualizada'], 'pt-BR': ['Fonte revisada', 'Fonte atualizada'],
  fr: ['Source vérifiée', 'Source mise à jour'], de: ['Quelle geprüft', 'Quelle aktualisiert'],
  ar: ['مراجعة المصدر', 'تحديث المصدر'], ru: ['Источник проверен', 'Источник обновлён'],
  id: ['Sumber ditinjau', 'Sumber diperbarui'], vi: ['Nguồn đã kiểm tra', 'Nguồn cập nhật'], it: ['Fonte verificata', 'Fonte aggiornata'],
};

function sanitizeTopicText(value) {
  if (typeof value !== "string") return value;
  return sanitizePublicText(value)
    .replace(/100x/gi, "high-volatility")
    .replace(/20%\s*(fee\s*)?rebate/gi, "user benefit pending verification")
    .replace(/最高\s*20%\s*手续费返还/g, "用户权益待核验")
    .replace(/返佣\s*20%/g, "用户权益待核验")
    .replace(/zero[- ]maker\s*fee/gi, "maker fee terms requiring verification")
    .replace(/zero[- ]fee/gi, "published fee terms")
    .replace(/零手续费/g, "费率条件待核验")
    .replace(/<\s*2\s*Hours?/gi, "published timing")
    .replace(/\b400ms\b/gi, "published timing")
    .replace(/2[-–]6 hour response/gi, "published timing evidence")
    .replace(/\$100M\+/g, "large-cap threshold claims")
    .replace(/5%\s*(?:to|~|-)\s*10%/gi, "material")
    .replace(/70%/g, "many")
    .replace(/within hours/gi, "within the platform's published timing")
    .replace(/平均在链上爆发数小时内上线交易/g, "上币时间需以官方公告核对")
    .replace(/最高返佣返还/g, "用户权益状态")
    .replace(/eliminates MEV entirely/gi, "changes execution and MEV exposure")
    .replace(/true ground-floor pricing/gi, "different execution conditions")
    .replace(/net rebate returns/gi, "any verified user benefit")
    .replace(/Max Fee Rebate/gi, "User Benefit Status")
    .replace(/#1\s*Recommended[^,]*/gi, "Research benchmark")
    .replace(/Richest Launch Ecosystem/gi, "Launch ecosystem context")
    .replace(/中心化首发之王|老牌山寨百宝箱|合约之王/g, "平台定位待核验")
    .replace(/全球流动性断层第一|全球最大(?:合约)?撮合引擎|全网收录币种最多|第一站|顶尖(?:免 KYC)?|首选/g, "平台定位待核验")
    .replace(/极速注册|极速认证/g, "注册条件待核验")
    .replace(/20%\s*(?:实时)?返现|实时返佣/g, "用户权益待核验");
}

function sanitizeTopicValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeTopicValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeTopicValue(item)]));
  return sanitizeTopicText(value);
}

const TRADITIONAL_CHINESE_DIRECT_ANSWERS = {
  derivatives: {
    eyebrow: "繁體中文直接答案",
    title: "先按帳戶模式分流，再比較費用與強平風險",
    body: "衍生品平台沒有單一最佳答案。CEX 帳戶、錢包永續、期權/永續專門平台與 GMX 資金池路線的成本來源、保證金、清算和簽名風險不同；先選路線，再核對官方費用與風險文件。",
  },
  "meme-coins": {
    eyebrow: "繁體中文直接答案",
    title: "先核對代幣合約、流動性與交易路徑",
    body: "Meme 幣平台沒有單一最佳答案。中心化平台要核對上架公告、地區資格、提領條件與公開費率；鏈上交易還要核對合約地址、流動性池、滑點、授權與 MEV 風險。頁內數值若沒有當前官方來源，均維持待核驗。",
  },
  "compliant-exchanges": {
    eyebrow: "繁體中文直接答案",
    title: "合規狀態必須按地區、實體與產品分開核對",
    body: "同一品牌在不同司法管轄區可能由不同實體提供服務，現貨、衍生品、法幣入金與託管資格也可能不同。請先確認居住地、簽約實體、可用產品、資產保管方式與官方監管登記，再考慮開戶。",
  },
  "no-kyc": {
    eyebrow: "繁體中文直接答案",
    title: "免 KYC 不等於永久免驗證，也不等於無限制使用",
    body: "錢包直連協議、中心化帳戶與永續平台的驗證條件不同，並且會受地區、產品、提領、風控與帳戶階段影響。請把身分要求、資產託管、地區限制與退出路徑分開核對。",
  },
};

const TOPIC_LOCALE_COPY = {
  "meme-coins": {
    ar: {
      category: "عملات الميم وفحوصات التداول على السلسلة",
      badge: "قائمة تحقق قائمة على المصادر لمنصات عملات الميم",
      title: "مقارنة منصات عملات الميم: فحص العقد والسيولة والخروج في MEXC وGate.io وRaydium",
      description: "قارن MEXC وGate.io وRaydium من خلال الوصول إلى المنتج، عقد الرمز، مسار السيولة، التكاليف المنشورة، مخاطر التفويض وشروط الخروج. يجب التحقق من الحملات والرسوم وأهلية الحساب في الصفحات الرسمية الحالية.",
      pills: ["فحص عقد الرمز والمجمع", "الرسوم المنشورة والفارق", "تفويض المحفظة وحدود MEV", "مسار الخروج والشروط الإقليمية"],
      painPoints: [
        ["", "1. قد تختلف حالة الإعلان والزوج وشروط الحساب", "قد يختلف الرمز بين الإعلان والإيداع وزوج التداول والسحب وحالة الحساب حسب المنطقة. تحقق من الإعلان الرسمي، الزوج، الشبكات، أهلية الحساب والقيود الإقليمية قبل استخدام دفتر أوامر أو مجمع."],
        ["", "2. MEV والانزلاق يحتاجان إلى فحص مسار الصفقة", "ابدأ بعنوان الرمز، عنوان المجمع، نتيجة التسعير، تأثير السعر، إعدادات الانزلاق وحالة الشبكة الحالية. المسارات الخاصة أو أدوات MEV إجراءات إضافية وليست ضمان تنفيذ."],
        ["", "3. أذونات العقد والتفويض ومسار الخروج قد تكون غير واضحة", "يجب أن يغطي فحص عملة الميم صلاحيات mint أو owner، قيود النقل، حالة السيولة، تفويض المحفظة، الخروج إلى stablecoin ومسار الجسر. إذا تعذر التحقق فلا تحوله إلى وعد أمان أو عائد."],
      ],
      evaluationPillars: [
        ["الإعلان والزوج وحالة التمويل", "راجع الإعلان الرسمي، زوج التداول، شبكة الإيداع، شبكة السحب وشروط الحساب الإقليمية كل على حدة."],
        ["عمق دفتر الأوامر وسيولة المجمع", "قارن عمق دفتر أوامر CEX، سيولة مجمع DEX، الفارق، تأثير السعر وجودة المسار مع إبقاء حالة السوق الحية غير المثبتة واضحة."],
        ["التكلفة المنشورة واحتكاك الخروج", "سجل رسوم التداول المنشورة وgas أو priority fee وشبكات السحب وتكلفة الجسر ومسارات stablecoin بشكل منفصل."],
        ["العقد والتفويض والتحذيرات", "افحص صلاحيات العقد، تفويضات المحفظة، تحذيرات الرمز، ضوابط المنصة، إفصاحات الاحتياطي ومسارات الخروج كمصادر لا كضمانات."],
      ],
      decisionTitle: "ابدأ بفحص العقد والسيولة قبل اختيار منصة عملات الميم",
      decisionBody: "افصل بين مسار CEX ومسار DEX. في CEX تحقق من الإعلان والزوج والحساب والمنطقة؛ وفي DEX تحقق من عنوان الرمز والمجمع والتفويض والسعر المتوقع ومسار الخروج.",
      pitfalls: [
        ["لا تعتمد على أمر سوق في سيولة رقيقة", "قبل التنفيذ راجع العمق والفارق وتأثير السعر ومسار فشل الصفقة. أوامر الحد أو التقسيم أدوات تنفيذ وليست ضماناً للسعر."],
        ["راجع حالة LP والإفصاحات لا وعود الأمان", "في DEX تحقق من عنوان الرمز والمجمع وحالة LP والصلاحيات. في CEX تحقق من شبكة السحب، stablecoin، حالة الحساب والمنطقة."],
        ["اعزل المحفظة وراجع التفويض", "استخدم محفظة معزولة، قلل التفويضات، احتفظ بمصدر العقد الرسمي، وراجع مسار revoke بعد التداول. لا توقع قبل التحقق من النطاق والعقد والمعلمات."],
      ],
      faqs: [
        ["ما أول شيء يجب فحصه عند اختيار منصة لعملة ميم؟", "ابدأ بعقد الرمز وزوج التداول والسيولة أو دفتر الأوامر وشبكات الإيداع والسحب، ثم تحقق من KYC والمنطقة وشروط الحساب في المنصة الرسمية الحالية."],
        ["كيف أقلل مخاطر MEV على Raydium أو DEX مشابه؟", "لا توجد نسبة انزلاق آمنة لكل المجمعات. تحقق من عنوان الرمز والمجمع، نتيجة التسعير، تأثير السعر، المسار وحالة الشبكة؛ المسارات الخاصة تساعد فقط عندما يمكن التحقق من سلوكها."],
        ["ما الذي يجب فحصه قبل الخروج من مركز عملة ميم؟", "راجع السيولة، تأثير السعر، عقد الرمز، حالة الشبكة، قواعد المنصة، شروط السحب، ومسار stablecoin أو الجسر. لا يوجد مسار يضمن موافقة بنك أو منصة."],
      ],
      telegramCommands: [["/rates meme", "فتح فحص الرسوم المنشورة والفارق وتكلفة الخروج"], ["/alert new_listings", "متابعة الأزواج والإعلانات ذات المصادر المراجعة"]],
    },
  },
  derivatives: {
    ja: {
      category: "デリバティブと無期限契約",
      badge: "出典確認付きの無期限契約プラットフォームガイド",
      title: "暗号資産無期限契約プラットフォーム比較：Binance、Bybit、Hyperliquid",
      description: "取引所の先物口座とウォレット接続型の無期限契約プロトコルを、公開手数料、資金調達率、証拠金、清算、オラクル、地域条件、本人確認条件で比較します。",
      pills: ["公開手数料表を確認", "資金調達率の仕組みを確認", "証拠金と清算ルールを確認", "地域と本人確認条件を確認"],
      searchAnswer: {
        eyebrow: "まず結論",
        title: "暗号資産の無期限契約プラットフォームを選ぶ手順",
        body: "最初にルートを分けてください。CEX の futures 口座、ウォレット接続型 Perp DEX、options/perps 専門プラットフォーム、または GMX 型のプール経路です。そのうえで、公開 maker/taker 手数料、funding の周期、証拠金モード、担保移動、oracle または mark price、清算ドキュメント、地域ごとの商品資格、公式口座またはウォレット接続フローを確認します。単一の広告料率ではなく、入る時、保有中、退出時、失敗時のコストをまとめて見ます。",
        bullets: [
          "Spot は資産交換、futures は満期があり、options は権利を価格化し、perpetuals は funding と証拠金でエクスポージャーを維持します。",
          "Funding は保有コストの仕組みであり、取引コスト全体の答えではありません。",
          "ウォレット経路では、担保、ブリッジ、署名、フロントエンド可用性の確認も必要です。",
          "口座資格、国・地域、レバレッジ、手数料階層は公式フローで確認してください。",
        ],
        sourceNote: "このページを基準チェックリストとして使い、登録またはウォレット接続の前に関連する比較ページやプラットフォームプロフィールを開いてください。",
      },
      painPoints: [
        ["", "1. レバレッジ倍率だけを見て実際のコストを見落とす", "無期限契約のコストは maker/taker 手数料だけではありません。資金調達率、スプレッド、スリッページ、清算価格、出金経路、口座階層を分けて確認します。"],
        ["", "2. ウォレット型 perps と取引所先物口座を混同する", "CEX 先物は本人確認、地域、口座階層、内部リスク管理に依存します。Perp DEX はネットワーク、担保、オラクル、ブリッジ、フロントエンド可用性を確認します。"],
        ["", "3. 資金調達率のキャリーを安全収益として扱う", "資金調達率は反転します。両建て手数料、送金、証拠金拘束、清算、プラットフォーム制限を悪い条件で試算してから建てます。"],
      ],
      evaluationPillars: [
        ["公開手数料と資金調達率の出典", "公式手数料表、資金調達率の説明、決済周期、口座階層を確認し、単一の宣伝料率を最終コストとして扱いません。"],
        ["証拠金、清算、オラクル経路", "証拠金モード、維持証拠金、清算手順、マーク価格、ADL を分けて確認します。オンチェーンでは担保とブリッジも確認します。"],
        ["口座、地域、商品資格", "登録前に居住地、本人確認、商品権限、入金経路、口座状態を公式フローで確認します。"],
        ["比較後の行動", "公開比較は候補を絞るためのものです。最終条件は公式口座またはウォレット接続画面で確認します。"],
      ],
      decisionTitle: "口座タイプを決めてから 2 つのプラットフォームを比較",
      decisionBody: "取引所口座なら Binance と OKX、デリバティブやコピー取引なら Bybit と Bitget、ウォレット接続なら Hyperliquid と dYdX を確認します。登録前に地域、本人確認、商品資格を確認してください。",
      pitfalls: [
        ["最大レバレッジは安全余力ではありません", "高い表示レバレッジよりも、必要証拠金、維持証拠金、強制清算、価格参照、ADL を先に確認します。"],
        ["資金調達率だけでプラットフォームを選ばない", "資金調達率、手数料、スプレッド、入出金、担保移動、地域条件を同じシナリオで比較します。"],
        ["ウォレット接続は清算リスクを消しません", "自己保管でも、担保、ブリッジ、オラクル、フロントエンド、清算ルールを確認する必要があります。"],
      ],
      faqs: [
        ["暗号資産の無期限契約プラットフォームとは何ですか？", "期限のない契約を取引する場です。CEX 先物口座とウォレット接続型プロトコルでは、確認するコスト、本人確認、担保、清算ルールが異なります。"],
        ["資金調達率だけで選んでよいですか？", "いいえ。maker/taker 手数料、資金調達周期、流動性、証拠金、清算、オラクル、出金経路、地域と本人確認条件も比較します。"],
        ["公開比較は自分の口座での利用可否を証明しますか？", "いいえ。公開比較は判断経路を整理するだけです。最終的な商品アクセス、KYC、地域、特典、手数料階層は公式フローで確認します。"],
      ],
      telegramCommands: [["/rates perps", "無期限契約の手数料と資金調達率の確認経路を開く"], ["/compare hyperliquid dydx", "ウォレット接続型 perps の比較を確認"]],
    },
    ko: {
      category: "파생상품 및 무기한 계약",
      badge: "출처 기반 무기한 계약 플랫폼 결정 가이드",
      title: "크립토 무기한 계약 플랫폼 비교: Binance, Bybit, Hyperliquid",
      description: "거래소 선물 계정과 지갑 연결형 무기한 계약 프로토콜을 공개 수수료, 펀딩, 마진, 청산, 오라클, 지역 접근성, 본인확인 조건으로 비교합니다.",
      pills: ["공개 수수료표 확인", "펀딩 방식 확인", "마진 및 청산 규칙 확인", "지역 및 신원 조건 확인"],
      searchAnswer: {
        eyebrow: "먼저 답변",
        title: "크립토 무기한 계약 플랫폼을 고르는 방법",
        body: "먼저 경로를 나누세요. CEX futures 계정, 지갑 연결형 Perp DEX, options/perps 전문 플랫폼, 또는 GMX식 풀 경로입니다. 그다음 공개 maker/taker 수수료, funding 주기, 마진 모드, 담보 이동, oracle 또는 mark price 경로, 청산 문서, 지역별 상품 자격, 공식 계정 또는 지갑 연결 플로우를 확인합니다. 하나의 광고 수수료가 아니라 진입, 보유, 종료, 실패 경로의 비용을 함께 봐야 합니다.",
        bullets: [
          "Spot은 자산 교환이고 futures는 만기가 있으며 options는 권리를 가격화하고 perpetuals는 funding과 마진으로 노출을 이어갑니다.",
          "Funding은 보유 비용 메커니즘이지 전체 거래 비용의 답이 아닙니다.",
          "지갑 경로는 담보, 브리지, 서명, 프런트엔드 가용성 확인을 추가로 요구합니다.",
          "계정 자격, 국가 이용 가능성, 레버리지와 수수료 등급은 공식 플로우에서 확인해야 합니다.",
        ],
        sourceNote: "이 페이지를 기준 체크리스트로 사용한 뒤 가입 또는 지갑 연결 전에 관련 비교 페이지나 플랫폼 프로필을 여세요.",
      },
      painPoints: [
        ["", "1. 레버리지 배율만 보고 실제 체결 비용을 놓침", "무기한 계약 비용은 maker/taker 수수료만이 아닙니다. 펀딩, 스프레드, 슬리피지, 청산가, 출금 경로, 계정 등급을 분리해 확인해야 합니다."],
        ["", "2. 지갑형 perp와 거래소 선물 계정을 혼동", "CEX 선물은 KYC, 지역, 계정 등급, 내부 리스크 통제에 의존합니다. Perp DEX는 네트워크, 담보, 오라클, 브리지, 프런트엔드 가용성을 확인합니다."],
        ["", "3. 펀딩 수익을 안전 수익으로 취급", "펀딩 방향은 바뀔 수 있습니다. 양쪽 수수료, 송금, 마진 점유, 청산, 플랫폼 제한을 나쁜 조건으로 계산해야 합니다."],
      ],
      evaluationPillars: [
        ["공개 수수료와 펀딩 출처", "공식 수수료표, 펀딩 문서, 정산 주기, 계정 등급 조건을 확인하고 하나의 광고 수수료를 최종 비용으로 보지 않습니다."],
        ["마진, 청산, 오라클 경로", "마진 모드, 유지증거금, 청산 흐름, 마크 가격, ADL을 분리해 확인합니다. 온체인 perp는 담보와 브리지도 확인합니다."],
        ["계정, 지역, 상품 자격", "가입 전에 거주지, 본인확인, 상품 권한, 입금 경로, 계정 상태를 공식 절차에서 확인합니다."],
        ["비교 후 다음 단계", "공개 비교는 후보를 좁히는 도구입니다. 최종 조건은 공식 계정 또는 지갑 연결 화면에서 확인합니다."],
      ],
      decisionTitle: "계정 유형을 정한 뒤 두 플랫폼을 비교하세요",
      decisionBody: "거래소 계정은 Binance와 OKX, 파생상품과 카피트레이딩은 Bybit과 Bitget, 지갑 연결은 Hyperliquid와 dYdX를 확인하세요. 가입 전 지역, 본인확인, 상품 자격을 확인해야 합니다.",
      pitfalls: [
        ["최대 레버리지는 안전 여유가 아닙니다", "표시 레버리지보다 필요 증거금, 유지증거금, 강제청산, 가격 기준, ADL을 먼저 확인하세요."],
        ["펀딩만으로 플랫폼을 고르지 마세요", "펀딩, 수수료, 스프레드, 입출금, 담보 이동, 지역 조건을 같은 시나리오로 비교하세요."],
        ["지갑 연결이 청산 위험을 없애지는 않습니다", "자기수탁이어도 담보, 브리지, 오라클, 프런트엔드, 청산 규칙을 확인해야 합니다."],
      ],
      faqs: [
        ["크립토 무기한 계약 플랫폼은 무엇인가요?", "만기가 없는 계약을 거래하는 경로입니다. CEX 선물 계정과 지갑 연결 프로토콜은 비용, 신원 확인, 담보, 청산 확인 순서가 다릅니다."],
        ["펀딩만 보고 선택해도 되나요?", "아니요. maker/taker 수수료, 펀딩 주기, 유동성, 마진, 청산, 오라클, 출금 경로, 지역과 KYC 조건을 함께 비교해야 합니다."],
        ["공개 비교가 내 계정의 거래 가능성을 보장하나요?", "아니요. 공개 비교는 판단 경로를 좁힙니다. 최종 상품 접근, KYC, 국가, 혜택, 수수료 등급은 공식 절차에서 확인해야 합니다."],
      ],
      telegramCommands: [["/rates perps", "무기한 계약 수수료와 펀딩 확인 경로 열기"], ["/compare hyperliquid dydx", "지갑 연결형 perp 비교 보기"]],
    },
    tr: {
      category: "Türevler ve perpetual sözleşmeler",
      badge: "Kaynak sınırlı perpetual platform karar rehberi",
      title: "Kripto perpetual platform karşılaştırması: Binance, Bybit ve Hyperliquid",
      description: "Borsa vadeli hesaplarını ve cüzdan bağlantılı perpetual protokollerini yayımlanmış ücret, funding, marjin, likidasyon, oracle, bölge ve kimlik koşullarına göre karşılaştırın.",
      pills: ["Yayımlanmış ücret tablosu", "Funding mekanizması", "Marjin ve likidasyon kuralları", "Bölge ve kimlik koşulları"],
      searchAnswer: {
        eyebrow: "Önce cevap",
        title: "Kripto perpetual platformu nasıl seçilir",
        body: "Önce rotayı ayırın: CEX futures hesabı, cüzdan bağlantılı Perp DEX, options/perps uzman platformu veya GMX tipi havuz rotası. Sonra yayımlanmış maker/taker ücretlerini, funding sıklığını, marjin modunu, teminat hareketini, oracle veya mark price rotasını, likidasyon belgelerini, bölgesel ürün uygunluğunu ve resmi hesap ya da cüzdan akışını karşılaştırın. Tek bir reklam ücretinden değil; giriş, elde tutma, çıkış ve hata yolu maliyetlerinin tamamından karar verin.",
        bullets: [
          "Spot varlık değişimidir; futures vadelidir; options bir hakkı fiyatlar; perpetuals funding ve marjinle pozisyonu sürdürür.",
          "Funding bir elde tutma maliyeti mekanizmasıdır; toplam işlem maliyeti cevabı değildir.",
          "Cüzdan rotalarında teminat, köprü, imza ve arayüz uygunluğu kontrolleri de gerekir.",
          "Hesap uygunluğu, ülke erişimi, kaldıraç ve ücret seviyesi resmi akışta doğrulanmalıdır.",
        ],
        sourceNote: "Bu sayfayı ana kontrol listesi olarak kullanın; kayıt veya cüzdan bağlantısından önce ilgili karşılaştırmayı ya da platform profilini açın.",
      },
      painPoints: [
        ["", "1. Kaldıraca bakıp gerçek işlem maliyetini kaçırmak", "Perpetual maliyet maker/taker ücretinden ibaret değildir. Funding, spread, kayma, likidasyon fiyatı, çekim yolu ve hesap seviyesi sonucu değiştirir."],
        ["", "2. Cüzdan perps ile borsa vadeli hesaplarını karıştırmak", "CEX vadeli hesapları KYC, bölge, hesap seviyesi ve iç risk kurallarına bağlıdır. Perp DEX tarafında ağ, teminat, oracle, köprü ve arayüz uygunluğu kontrol edilir."],
        ["", "3. Funding carry işlemini güvenli gelir sanmak", "Funding yönü dönebilir. Çift taraflı ücret, transfer, marjin kullanımı, likidasyon ve platform kısıtları en kötü senaryoyla hesaplanmalıdır."],
      ],
      evaluationPillars: [
        ["Yayımlanmış ücret ve funding kaynakları", "Resmi ücret tablosunu, funding belgelerini, uzlaşma zamanını ve hesap seviyesi koşullarını kontrol edin; tek bir reklam oranını nihai maliyet saymayın."],
        ["Marjin, likidasyon ve oracle rotası", "Marjin modu, sürdürme marjini, likidasyon akışı, mark fiyatı ve ADL ayrı kontrol edilir. On-chain perps için teminat ve köprü de incelenir."],
        ["Hesap, bölge ve ürün uygunluğu", "Kayıt öncesi ikamet, kimlik doğrulama, ürün izni, fonlama yolu ve hesap durumunu resmi akışta kontrol edin."],
        ["Karşılaştırma sonrası adım", "Kamuya açık karşılaştırma sadece seçenekleri daraltır. Son koşullar resmi hesap veya cüzdan akışında doğrulanır."],
      ],
      decisionTitle: "Önce hesap türünü seçin, sonra iki platformu karşılaştırın",
      decisionBody: "Borsa hesabı için Binance ve OKX; türevler ve copy trading için Bybit ve Bitget; cüzdan erişimi için Hyperliquid ve dYdX rotasını inceleyin. Kayıt öncesi bölge, kimlik ve ürün uygunluğunu kontrol edin.",
      pitfalls: [
        ["Maksimum kaldıraç güvenlik payı değildir", "Gösterilen kaldıraçtan önce gerekli marjin, sürdürme marjini, zorunlu likidasyon, fiyat kaynağı ve ADL kontrol edilir."],
        ["Platformu sadece funding ile seçmeyin", "Funding, ücret, spread, para yatırma/çekme, teminat hareketi ve bölgesel koşulları aynı senaryoda karşılaştırın."],
        ["Cüzdan bağlantısı likidasyon riskini kaldırmaz", "Self-custody olsa bile teminat, köprü, oracle, arayüz ve likidasyon kuralları kontrol edilmelidir."],
      ],
      faqs: [
        ["Kripto perpetual platformu nedir?", "Vadesi olmayan sözleşmelerin işlem gördüğü yoldur. CEX vadeli hesapları ile cüzdan bağlantılı protokollerde maliyet, kimlik, teminat ve likidasyon kontrolleri farklıdır."],
        ["Seçimi funding oranı belirlemeli mi?", "Hayır. Maker/taker ücretleri, funding sıklığı, likidite, marjin, likidasyon, oracle, çekim yolu, bölge ve kimlik koşulları birlikte değerlendirilmelidir."],
        ["Kamuya açık karşılaştırma hesabımda işlem yapabileceğimi kanıtlar mı?", "Hayır. Karşılaştırma karar yolunu daraltır. Ürün erişimi, KYC, ülke, avantaj ve ücret seviyesi resmi akışta doğrulanmalıdır."],
      ],
      telegramCommands: [["/rates perps", "Perpetual ücret ve funding kontrol yollarını aç"], ["/compare hyperliquid dydx", "Cüzdan bağlantılı perp karşılaştırmasını görüntüle"]],
    },
    es: {
      category: "Derivados y contratos perpetuos",
      badge: "Guía de decisión de perpetuos con fuentes",
      title: "Comparación de plataformas de perpetuos cripto: Binance, Bybit y Hyperliquid",
      description: "Compara cuentas de futuros en exchanges y protocolos de perpetuos conectados por wallet por comisiones publicadas, funding, margen, liquidación, oráculo, acceso regional e identidad.",
      pills: ["Tabla de comisiones publicada", "Mecanismo de funding", "Reglas de margen y liquidación", "Condiciones de región e identidad"],
      painPoints: [
        ["", "1. Mirar solo el apalancamiento y perder el coste real", "El coste de un perpetuo no se limita a maker/taker. Funding, spread, deslizamiento, precio de liquidación, retiros y nivel de cuenta cambian el resultado."],
        ["", "2. Mezclar perps con wallet y futuros de exchange", "Las cuentas CEX dependen de KYC, región, nivel y controles internos. Los Perp DEX requieren revisar red, colateral, oráculo, puente y disponibilidad del frontend."],
        ["", "3. Tratar el funding carry como ingreso seguro", "El funding puede invertirse. Las comisiones de ambos lados, transferencias, margen, liquidación y límites de plataforma deben modelarse en escenarios adversos."],
      ],
      evaluationPillars: [
        ["Fuentes de comisiones y funding", "Revisa tabla oficial, documentación de funding, cadencia de liquidación y nivel de cuenta; no conviertas una tarifa promocional en coste final."],
        ["Margen, liquidación y oráculo", "Separa modo de margen, margen de mantenimiento, flujo de liquidación, precio de marca y ADL. En perps on-chain revisa colateral y puente."],
        ["Cuenta, región y producto", "Antes de registrarte confirma residencia, identidad, permisos de producto, ruta de depósito y estado de cuenta en el flujo oficial."],
        ["Siguiente paso tras comparar", "La comparación pública reduce opciones. Las condiciones finales se verifican en la cuenta oficial o en la conexión de wallet."],
      ],
      decisionTitle: "Elige el tipo de cuenta y luego compara dos plataformas",
      decisionBody: "Para cuentas de exchange, compara Binance y OKX. Para derivados y copy trading, compara Bybit y Bitget. Para acceso por wallet, revisa Hyperliquid y dYdX. Verifica región, identidad y producto antes de abrir cuenta.",
      pitfalls: [
        ["El apalancamiento máximo no es margen de seguridad", "Revisa margen inicial, mantenimiento, liquidación forzosa, fuente de precio y ADL antes de fijarte en el número de apalancamiento."],
        ["No elijas solo por funding", "Compara funding, comisiones, spread, depósitos, retiros, movimiento de colateral y condiciones regionales en el mismo escenario."],
        ["Conectar una wallet no elimina la liquidación", "Incluso con autocustodia hay que revisar colateral, puente, oráculo, frontend y reglas de liquidación."],
      ],
      faqs: [
        ["¿Qué es una plataforma de perpetuos cripto?", "Es una ruta para operar contratos sin vencimiento fijo. Las cuentas CEX y los protocolos con wallet tienen controles distintos de coste, identidad, colateral y liquidación."],
        ["¿Debe decidir el funding la elección?", "No. Compara comisiones maker/taker, cadencia de funding, liquidez, margen, liquidación, oráculo, retiros, región e identidad."],
        ["¿Una comparación pública prueba que mi cuenta puede operar?", "No. Solo ordena la decisión. El acceso final, KYC, país, beneficios y nivel de comisiones se confirman en el flujo oficial."],
      ],
      telegramCommands: [["/rates perps", "Abrir rutas de revisión de comisiones y funding"], ["/compare hyperliquid dydx", "Ver comparación de perps con wallet"]],
    },
    "pt-BR": {
      category: "Derivativos e contratos perpétuos",
      badge: "Guia de decisão de perpétuos com fontes",
      title: "Comparação de plataformas de perpétuos cripto: Binance, Bybit e Hyperliquid",
      description: "Compare contas de futuros em corretoras e protocolos de perpétuos conectados por carteira por taxas publicadas, funding, margem, liquidação, oráculo, região e identidade.",
      pills: ["Tabela de taxas publicada", "Mecanismo de funding", "Regras de margem e liquidação", "Condições de região e identidade"],
      painPoints: [
        ["", "1. Olhar só a alavancagem e perder o custo real", "O custo de perpétuos não é apenas maker/taker. Funding, spread, slippage, preço de liquidação, saques e nível de conta mudam o resultado."],
        ["", "2. Misturar perps com carteira e futuros de corretora", "Contas CEX dependem de KYC, região, nível e controles internos. Perp DEX exige revisar rede, colateral, oráculo, ponte e disponibilidade do frontend."],
        ["", "3. Tratar funding carry como renda segura", "O funding pode virar. Taxas dos dois lados, transferências, margem, liquidação e limites da plataforma precisam ser simulados em cenário adverso."],
      ],
      evaluationPillars: [
        ["Fontes de taxas e funding", "Verifique tabela oficial, documentação de funding, cadência de liquidação e nível da conta; não trate uma taxa promocional como custo final."],
        ["Margem, liquidação e oráculo", "Separe modo de margem, margem de manutenção, fluxo de liquidação, preço de marca e ADL. Em perps on-chain revise colateral e ponte."],
        ["Conta, região e produto", "Antes de se cadastrar, confirme residência, identidade, permissão de produto, rota de depósito e status da conta no fluxo oficial."],
        ["Próximo passo depois da comparação", "A comparação pública reduz opções. As condições finais são verificadas na conta oficial ou na conexão da carteira."],
      ],
      decisionTitle: "Escolha o tipo de conta e depois compare duas plataformas",
      decisionBody: "Para contas de corretora, compare Binance e OKX. Para derivativos e copy trading, compare Bybit e Bitget. Para acesso por carteira, revise Hyperliquid e dYdX. Verifique região, identidade e produto antes de abrir conta.",
      pitfalls: [
        ["Alavancagem máxima não é margem de segurança", "Revise margem inicial, manutenção, liquidação forçada, fonte de preço e ADL antes de olhar o número de alavancagem."],
        ["Não escolha só pelo funding", "Compare funding, taxas, spread, depósitos, saques, movimento de colateral e condições regionais no mesmo cenário."],
        ["Conectar carteira não elimina liquidação", "Mesmo com autocustódia, revise colateral, ponte, oráculo, frontend e regras de liquidação."],
      ],
      faqs: [
        ["O que é uma plataforma de perpétuos cripto?", "É uma rota para negociar contratos sem vencimento fixo. Contas CEX e protocolos com carteira têm verificações diferentes de custo, identidade, colateral e liquidação."],
        ["O funding deve decidir a escolha?", "Não. Compare taxas maker/taker, cadência de funding, liquidez, margem, liquidação, oráculo, saques, região e identidade."],
        ["Uma comparação pública prova que minha conta pode operar?", "Não. Ela organiza a decisão. Acesso final, KYC, país, benefícios e nível de taxas são confirmados no fluxo oficial."],
      ],
      telegramCommands: [["/rates perps", "Abrir rotas de revisão de taxas e funding"], ["/compare hyperliquid dydx", "Ver comparação de perps com carteira"]],
    },
    ar: {
      category: "المشتقات والعقود الدائمة",
      badge: "دليل قرار للعقود الدائمة قائم على المصادر",
      title: "مقارنة منصات العقود الدائمة: Binance وBybit وHyperliquid",
      description: "قارن حسابات العقود في المنصات المركزية وبروتوكولات العقود الدائمة المتصلة بالمحفظة حسب الرسوم المنشورة والتمويل والهامش والتصفية وoracle والمنطقة والهوية.",
      pills: ["جدول رسوم منشور", "آلية التمويل", "قواعد الهامش والتصفية", "شروط المنطقة والهوية"],
      searchAnswer: {
        eyebrow: "الإجابة أولاً",
        title: "كيف تختار منصة عقود دائمة للعملات الرقمية",
        body: "ابدأ بفصل المسار: حساب futures في CEX، أو Perp DEX متصل بالمحفظة، أو منصة متخصصة في الخيارات والعقود، أو مسار GMX عبر المجمعات. بعد ذلك قارن الرسوم المنشورة، وتواتر التمويل، ونمط الهامش، وحركة الضمان، ومسار oracle أو mark price، ووثائق التصفية، وأهلية المنتج حسب المنطقة، والمسار الرسمي للحساب أو المحفظة.",
        bullets: [
          "Spot يعني تبادل أصل؛ futures لها تاريخ انتهاء؛ options تسعر حقاً؛ perpetuals تدير التعرض عبر التمويل والهامش.",
          "التمويل آلية تكلفة احتفاظ، وليس إجابة كاملة عن تكلفة التداول.",
          "الأهلية، البلد، الرافعة ومستوى الرسوم يجب التحقق منها داخل المسار الرسمي.",
        ],
        sourceNote: "استخدم هذه الصفحة كقائمة تحقق، ثم افتح المقارنة أو ملف المنصة قبل التسجيل أو ربط المحفظة.",
      },
      painPoints: [
        ["", "1. النظر إلى الرافعة فقط وإهمال تكلفة التنفيذ", "تكلفة العقود الدائمة ليست رسوم maker/taker فقط. التمويل والفارق والانزلاق وسعر التصفية ومسار السحب ومستوى الحساب كلها تغير النتيجة."],
        ["", "2. خلط عقود المحفظة مع حساب futures في CEX", "حسابات CEX تعتمد على KYC والمنطقة ومستوى الحساب وضوابط المخاطر الداخلية. مسارات Perp DEX تحتاج مراجعة الشبكة والضمان وoracle والجسر وتوفر الواجهة."],
        ["", "3. اعتبار التمويل دخلاً آمناً", "اتجاه التمويل قد ينعكس. يجب نمذجة رسوم الطرفين والتحويل واستخدام الهامش والتصفية وحدود المنصة في سيناريو سلبي."],
      ],
      evaluationPillars: [
        ["مصادر الرسوم والتمويل", "راجع جدول الرسوم الرسمي ووثائق التمويل ودورة التسوية وشروط مستوى الحساب؛ لا تجعل رقماً ترويجياً واحداً تكلفة نهائية."],
        ["الهامش والتصفية وoracle", "افصل بين نمط الهامش وهامش الصيانة ومسار التصفية وmark price وADL. في المسارات on-chain راجع الضمان والجسر أيضاً."],
        ["الحساب والمنطقة والمنتج", "قبل التسجيل أكد الإقامة والهوية وصلاحيات المنتج ومسار الإيداع وحالة الحساب داخل التدفق الرسمي."],
        ["الخطوة التالية بعد المقارنة", "المقارنة العامة تضيق الخيارات فقط. الشروط النهائية تتحقق في الحساب الرسمي أو شاشة ربط المحفظة."],
      ],
      decisionTitle: "اختر نوع الحساب ثم قارن منصتين",
      decisionBody: "لحسابات المنصات، قارن Binance وOKX. للمشتقات وcopy trading، قارن Bybit وBitget. للوصول عبر المحفظة، راجع Hyperliquid وdYdX. تحقق من المنطقة والهوية والمنتج قبل فتح الحساب.",
      pitfalls: [
        ["الرافعة القصوى ليست هامش أمان", "راجع الهامش الابتدائي والصيانة والتصفية القسرية ومصدر السعر وADL قبل التركيز على رقم الرافعة."],
        ["لا تختر المنصة من التمويل وحده", "قارن التمويل والرسوم والفارق والإيداع والسحب وحركة الضمان والشروط الإقليمية في السيناريو نفسه."],
        ["ربط المحفظة لا يلغي خطر التصفية", "حتى مع الحفظ الذاتي يجب مراجعة الضمان والجسر وoracle والواجهة وقواعد التصفية."],
      ],
      faqs: [
        ["ما منصة العقود الدائمة للعملات الرقمية؟", "هي مسار لتداول عقود بلا تاريخ انتهاء ثابت. تختلف حسابات CEX وبروتوكولات المحفظة في فحوص التكلفة والهوية والضمان والتصفية."],
        ["هل يجب أن يقرر التمويل اختيار المنصة؟", "لا. قارن رسوم maker/taker، وتواتر التمويل، والسيولة، والهامش، والتصفية، وoracle، والسحب، والمنطقة، وشروط الهوية معاً."],
        ["هل تثبت المقارنة العامة أن حسابي يستطيع التداول؟", "لا. المقارنة ترتب القرار فقط. الوصول النهائي للمنتج وKYC والبلد والمزايا ومستوى الرسوم يتحقق في المسار الرسمي."],
      ],
      telegramCommands: [["/rates perps", "فتح مسارات مراجعة الرسوم والتمويل"], ["/compare hyperliquid dydx", "عرض مقارنة العقود الدائمة عبر المحفظة"]],
    },
  },
  "compliant-exchanges": {
    ja: {
      category: "法定通貨アクセスと規制確認",
      badge: "地域別の口座資格チェック",
      title: "法定通貨アクセスと口座資格：HashKey、Kraken、OKX",
      description: "地域資格、本人確認、同名銀行、法定通貨入出金経路、公式ルールの出典を確認してから、取引所口座を比較します。",
      pills: ["地域資格を確認", "本人確認条件を確認", "同名銀行ルートを確認", "公式ルール出典を確認"],
      painPoints: [
        ["", "1. ブランド名だけで規制対象サービスと判断する", "同じブランドでも地域、法人、商品で条件が分かれます。登録前に契約主体、居住地、商品範囲を確認します。"],
        ["", "2. 法定通貨入出金を同じ条件と見なす", "銀行名義、カード、送金、ステーブルコイン経路は地域と口座状態で変わります。手数料と着金時間も別に確認します。"],
        ["", "3. 公開比較を公式資格確認の代わりにする", "NexuAlpha はチェックリストを示しますが、最終的な利用資格は公式口座画面と最新規約で確認します。"],
      ],
      evaluationPillars: [
        ["規制登録と法人", "監督機関登録、提供法人、商品範囲を地域別に確認します。"],
        ["本人確認と居住地", "KYC、住所証明、口座名義、利用国を分けて確認します。"],
        ["法定通貨ルート", "同名銀行、カード、送金、通貨、入出金制限を公式条件で確認します。"],
        ["比較後の確認", "比較ページは候補を整理するもので、口座開設や入金可否の保証ではありません。"],
      ],
      pitfalls: [["ライセンスは全商品を意味しません", "現物、デリバティブ、法定通貨、カストディは同じ資格で提供されるとは限りません。"], ["銀行経路はアカウントごとに変わります", "同名銀行、通貨、入出金上限、処理時間は公式画面で確認します。"], ["地域条件は頻繁に更新されます", "登録前だけでなく入金前、取引前、出金前にも条件を再確認します。"]],
      faqs: [["合規取引所とは何を確認するページですか？", "規制登録、法人、本人確認、法定通貨経路、地域条件を分けて確認するページです。"], ["HashKey、Kraken、OKX は同じ条件ですか？", "いいえ。地域、商品、口座状態、銀行経路が異なるため、公式条件で個別に確認します。"], ["この比較は口座開設可能性を保証しますか？", "いいえ。最終判断は公式口座フロー、規約、現在の地域条件で確認します。"]],
      telegramCommands: [["/verify fiat", "法定通貨入出金と本人確認条件を確認"], ["/sources compliance", "規制と公式出典を開く"]],
    },
    ko: {
      category: "법정화폐 접근 및 규제 확인",
      badge: "지역별 계정 자격 체크리스트",
      title: "법정화폐 접근성과 계정 자격: HashKey, Kraken, OKX",
      description: "지역 자격, 본인확인, 동일 명의 은행, 법정화폐 입출금 경로와 공식 규칙 출처를 확인한 뒤 거래소 계정을 비교합니다.",
      pills: ["지역 자격 확인", "본인확인 조건 확인", "동일 명의 은행 확인", "공식 규칙 출처 확인"],
      painPoints: [["", "1. 브랜드명만 보고 규제 서비스를 판단", "같은 브랜드도 지역, 법인, 상품에 따라 조건이 다릅니다. 가입 전 계약 법인, 거주지, 상품 범위를 확인해야 합니다."], ["", "2. 모든 법정화폐 입출금이 같은 조건이라고 가정", "은행 명의, 카드, 송금, 스테이블코인 경로는 지역과 계정 상태에 따라 달라집니다."], ["", "3. 공개 비교를 공식 자격 확인으로 대체", "NexuAlpha는 체크리스트를 제공하지만 최종 자격은 공식 계정 화면과 최신 약관에서 확인해야 합니다."]],
      evaluationPillars: [["규제 등록과 법인", "감독기관 등록, 제공 법인, 상품 범위를 지역별로 확인합니다."], ["본인확인과 거주지", "KYC, 주소 증명, 계정 명의, 이용 국가를 분리해 확인합니다."], ["법정화폐 경로", "동일 명의 은행, 카드, 송금, 통화, 입출금 제한을 공식 조건으로 확인합니다."], ["비교 후 확인", "비교는 후보 정리용이며 계정 개설이나 입금 가능성을 보장하지 않습니다."]],
      pitfalls: [["라이선스가 모든 상품을 뜻하지는 않습니다", "현물, 파생상품, 법정화폐, 수탁 서비스는 같은 자격으로 제공되지 않을 수 있습니다."], ["은행 경로는 계정마다 달라질 수 있습니다", "동일 명의 은행, 통화, 한도, 처리 시간은 공식 화면에서 확인하세요."], ["지역 조건은 업데이트됩니다", "가입 전뿐 아니라 입금, 거래, 출금 전에도 조건을 다시 확인하세요."]],
      faqs: [["이 페이지는 무엇을 확인하나요?", "규제 등록, 법인, 본인확인, 법정화폐 경로, 지역 조건을 분리해 확인합니다."], ["HashKey, Kraken, OKX 조건이 같나요?", "아니요. 지역, 상품, 계정 상태, 은행 경로가 다르므로 공식 조건으로 개별 확인해야 합니다."], ["이 비교가 계정 개설 가능성을 보장하나요?", "아니요. 최종 판단은 공식 가입 흐름과 현재 지역 조건에서 확인해야 합니다."]],
      telegramCommands: [["/verify fiat", "법정화폐 입출금과 본인확인 조건 확인"], ["/sources compliance", "규제 및 공식 출처 열기"]],
    },
    tr: {
      category: "Fiat erişimi ve düzenleme kontrolü",
      badge: "Bölgesel hesap uygunluğu kontrol listesi",
      title: "Fiat erişimi ve hesap uygunluğu: HashKey, Kraken ve OKX",
      description: "Borsa hesabını karşılaştırmadan önce bölgesel uygunluk, kimlik, aynı isimli banka, fiat yatırma-çekme yolu ve resmi kural kaynaklarını kontrol edin.",
      pills: ["Bölgesel uygunluk", "Kimlik koşulları", "Aynı isimli banka", "Resmi kural kaynakları"],
      painPoints: [["", "1. Sadece marka adına bakarak düzenlenmiş hizmet varsaymak", "Aynı marka farklı bölgede farklı tüzel kişi ve ürün kapsamıyla çalışabilir. Kayıttan önce tarafı, ikameti ve ürünleri kontrol edin."], ["", "2. Tüm fiat yollarını aynı koşul sanmak", "Banka adı, kart, havale ve stablecoin rotası bölgeye ve hesap durumuna göre değişir."], ["", "3. Kamuya açık karşılaştırmayı resmi uygunluk kontrolü yerine koymak", "NexuAlpha kontrol listesi sunar; son uygunluk resmi hesap ekranı ve güncel şartlarda doğrulanır."]],
      evaluationPillars: [["Düzenleme kaydı ve tüzel kişi", "Denetleyici kayıt, hizmet veren tüzel kişi ve ürün kapsamını bölge bazında kontrol edin."], ["Kimlik ve ikamet", "KYC, adres kanıtı, hesap adı ve ülke koşullarını ayrı okuyun."], ["Fiat rotası", "Aynı isimli banka, kart, havale, para birimi ve limitleri resmi koşullardan doğrulayın."], ["Karşılaştırma sonrası", "Karşılaştırma seçenekleri daraltır; hesap açma veya yatırma garantisi değildir."]],
      pitfalls: [["Lisans tüm ürünleri kapsamaz", "Spot, türev, fiat ve saklama hizmetleri aynı izinle sunulmayabilir."], ["Banka yolu hesaba göre değişir", "Aynı isimli banka, para birimi, limit ve süre resmi ekranda kontrol edilir."], ["Bölgesel koşullar güncellenir", "Kayıt, yatırma, işlem ve çekim öncesi koşulları tekrar doğrulayın."]],
      faqs: [["Bu sayfa neyi kontrol eder?", "Düzenleme kaydı, tüzel kişi, kimlik, fiat rotası ve bölgesel koşulları ayırır."], ["HashKey, Kraken ve OKX aynı koşullara mı sahip?", "Hayır. Bölge, ürün, hesap durumu ve banka rotaları farklı olabilir."], ["Bu karşılaştırma hesap açabileceğimi garanti eder mi?", "Hayır. Son karar resmi hesap akışı ve güncel bölge koşullarında doğrulanır."]],
      telegramCommands: [["/verify fiat", "Fiat ve kimlik koşullarını kontrol et"], ["/sources compliance", "Düzenleme ve resmi kaynakları aç"]],
    },
    es: {
      category: "Acceso fiat y verificación regulatoria",
      badge: "Checklist de elegibilidad por región",
      title: "Acceso fiat y elegibilidad de cuenta: HashKey, Kraken y OKX",
      description: "Compara cuentas de exchange tras revisar elegibilidad regional, identidad, banco a tu nombre, rutas fiat y fuentes oficiales de reglas.",
      pills: ["Elegibilidad regional", "Identidad y KYC", "Banco a tu nombre", "Fuentes oficiales"],
      painPoints: [["", "1. Suponer regulación solo por la marca", "Una misma marca puede operar con otra entidad, región y producto. Antes de registrarte revisa entidad, residencia y alcance de producto."], ["", "2. Tratar todas las rutas fiat igual", "Banco, tarjeta, transferencia y stablecoins cambian según región y estado de cuenta."], ["", "3. Usar una comparación pública como verificación oficial", "NexuAlpha ofrece el checklist; la elegibilidad final se confirma en la cuenta oficial y términos actuales."]],
      evaluationPillars: [["Registro y entidad", "Revisa registro del regulador, entidad proveedora y alcance de producto por región."], ["Identidad y residencia", "Separa KYC, prueba de domicilio, nombre de cuenta y país de uso."], ["Ruta fiat", "Confirma banco a tu nombre, tarjeta, transferencia, divisa y límites en las condiciones oficiales."], ["Después de comparar", "La comparación ordena opciones; no garantiza apertura de cuenta ni depósitos."]],
      pitfalls: [["Una licencia no cubre todos los productos", "Spot, derivados, fiat y custodia pueden tener permisos distintos."], ["La ruta bancaria cambia por cuenta", "Nombre bancario, moneda, límites y tiempos se verifican en la pantalla oficial."], ["Las condiciones regionales cambian", "Revisa antes de registro, depósito, operación y retiro."]],
      faqs: [["¿Qué revisa esta página?", "Registro, entidad, identidad, rutas fiat y condiciones regionales por separado."], ["¿HashKey, Kraken y OKX tienen las mismas condiciones?", "No. Región, producto, estado de cuenta y ruta bancaria pueden diferir."], ["¿La comparación garantiza que puedo abrir cuenta?", "No. La decisión final se confirma en el flujo oficial y las condiciones vigentes."]],
      telegramCommands: [["/verify fiat", "Revisar rutas fiat e identidad"], ["/sources compliance", "Abrir fuentes oficiales y regulatorias"]],
    },
    "pt-BR": {
      category: "Acesso fiat e verificação regulatória",
      badge: "Checklist de elegibilidade por região",
      title: "Acesso fiat e elegibilidade de conta: HashKey, Kraken e OKX",
      description: "Compare contas de corretora depois de revisar elegibilidade regional, identidade, banco em seu nome, rotas fiat e fontes oficiais de regras.",
      pills: ["Elegibilidade regional", "Identidade e KYC", "Banco em seu nome", "Fontes oficiais"],
      painPoints: [["", "1. Presumir regulação apenas pela marca", "A mesma marca pode operar por outra entidade, região e produto. Antes de se cadastrar, revise entidade, residência e escopo do produto."], ["", "2. Tratar todas as rotas fiat como iguais", "Banco, cartão, transferência e stablecoins mudam conforme região e status da conta."], ["", "3. Usar comparação pública como verificação oficial", "A NexuAlpha oferece o checklist; a elegibilidade final é confirmada na conta oficial e nos termos atuais."]],
      evaluationPillars: [["Registro e entidade", "Verifique registro do regulador, entidade prestadora e escopo de produto por região."], ["Identidade e residência", "Separe KYC, comprovante de endereço, titularidade da conta e país de uso."], ["Rota fiat", "Confirme banco em seu nome, cartão, transferência, moeda e limites nas condições oficiais."], ["Depois de comparar", "A comparação organiza opções; não garante abertura de conta nem depósitos."]],
      pitfalls: [["Uma licença não cobre todos os produtos", "Spot, derivativos, fiat e custódia podem ter permissões diferentes."], ["A rota bancária muda por conta", "Titularidade, moeda, limites e prazos são verificados na tela oficial."], ["Condições regionais mudam", "Revise antes de cadastro, depósito, operação e saque."]],
      faqs: [["O que esta página revisa?", "Registro, entidade, identidade, rotas fiat e condições regionais separadamente."], ["HashKey, Kraken e OKX têm as mesmas condições?", "Não. Região, produto, status da conta e rota bancária podem diferir."], ["A comparação garante que posso abrir conta?", "Não. A decisão final é confirmada no fluxo oficial e nas condições vigentes."]],
      telegramCommands: [["/verify fiat", "Revisar rotas fiat e identidade"], ["/sources compliance", "Abrir fontes oficiais e regulatórias"]],
    },
  },
  "no-kyc": {
    ja: {
      category: "本人確認なしアクセス",
      badge: "アクセス条件の境界チェック",
      title: "No-KYC 暗号資産アクセス比較：Hyperliquid、dYdX、MEXC",
      description: "ウォレット接続、CEX 口座、出金、地域制限、制裁チェック、フロントエンド、清算リスクを分けて確認します。",
      pills: ["ウォレット接続を確認", "後日の本人確認リスクを確認", "出金制限を確認", "地域制限を確認"],
      painPoints: [["", "1. No-KYC を永久保証として読む", "No-KYC は現在のアクセス条件です。地域、出金、商品、リスク管理により後から本人確認が求められることがあります。"], ["", "2. フロントエンド、コントラクト、ブリッジを混同", "ウォレット接続できても、フロントエンド、制裁リスト、ブリッジ、流動性が利用を制限する場合があります。"], ["", "3. 出金と清算を確認しない", "CEX 口座と perp プロトコルでは、出金制限、担保、清算、地域ルールを別々に確認します。"]],
      evaluationPillars: [["アクセス方式", "ウォレット接続、メール登録、CEX 口座、perp 口座を分けて整理します。"], ["地域と制裁チェック", "国、IP、居住地、制裁スクリーニング、フロントエンド制限を確認します。"], ["資産保管と出金", "自己保管、CEX 残高、担保、ブリッジ、出金上限を確認します。"], ["後日の本人確認", "No-KYC 表示でも、リスク管理や出金時に本人確認が必要になる場合があります。"]],
      noKycTitle: "自己保管プロトコル、CEX アクセス、perp リスクを分ける",
      noKycBody: "No-KYC 条件は地域、商品、出金、口座段階で変わります。まず Hyperliquid と dYdX を比較し、各サービスのプロフィールと MEXC の口座条件を確認してください。",
      newsBody: "Hyperliquid の最新ニュースや告知を探している場合、このページはアクセス境界の説明です。ニュースハブ、Hyperliquid 記事、プロフィールを開いて公式出典を確認してください。",
      pitfalls: [["ウォレット接続は本人確認リスクをゼロにしません", "フロントエンド、ブリッジ、制裁チェック、出金条件が利用を制限することがあります。"], ["CEX の低摩擦登録は永続条件ではありません", "商品、地域、出金、リスク管理で追加確認が必要になる場合があります。"], ["No-KYC と匿名性は同義ではありません", "オンチェーン履歴、IP、フロントエンド、出金経路は別のリスクを持ちます。"]],
      faqs: [["No-KYC プラットフォームは何を確認すべきですか？", "アクセス方法、地域、出金、制裁チェック、フロントエンド、後日の本人確認、清算リスクを分けて確認します。"], ["ウォレット接続なら本人確認は不要ですか？", "必ずしもそうではありません。フロントエンド、地域、ブリッジ、制裁チェックが制限をかける場合があります。"], ["CEX を No-KYC と見なしてよいですか？", "慎重に扱います。低摩擦登録は地域、商品、限度、出金時の本人確認で変わる可能性があります。"]],
      telegramCommands: [["/compare hyperliquid dydx", "No-KYC perp 経路を比較"], ["/check withdrawal", "出金と本人確認条件を確認"]],
    },
    ko: {
      category: "No-KYC 접근",
      badge: "접근 조건 경계 확인",
      title: "No-KYC 암호화폐 접근 비교: Hyperliquid, dYdX, MEXC",
      description: "지갑 연결, 계정 가입, 본인확인 가능성, 출금, 지역 제한과 리스크 경계를 Hyperliquid, dYdX, MEXC 기준으로 비교합니다.",
      pills: ["지갑 연결 확인", "추후 본인확인 위험 확인", "출금 제한 확인", "지역 제한 확인"],
      painPoints: [["", "1. No-KYC를 영구 보장으로 해석", "No-KYC는 현재 접근 조건입니다. 지역, 출금, 상품, 리스크 통제에 따라 나중에 본인확인이 요구될 수 있습니다."], ["", "2. 프런트엔드, 컨트랙트, 브리지를 혼동", "지갑 연결이 가능해도 프런트엔드, 제재 목록, 브리지, 유동성이 이용을 제한할 수 있습니다."], ["", "3. 출금과 청산을 확인하지 않음", "CEX 계정과 perp 프로토콜은 출금 제한, 담보, 청산, 지역 규칙을 별도로 확인해야 합니다."]],
      evaluationPillars: [["접근 방식", "지갑 연결, 이메일 가입, CEX 계정, perp 계정을 분리합니다."], ["지역과 제재 확인", "국가, IP, 거주지, 제재 스크리닝, 프런트엔드 제한을 확인합니다."], ["보관과 출금", "자기수탁, CEX 잔액, 담보, 브리지, 출금 한도를 확인합니다."], ["추후 본인확인", "No-KYC 표시가 있어도 리스크 관리나 출금 시 본인확인이 필요할 수 있습니다."]],
      noKycTitle: "자기수탁 프로토콜, CEX 접근, perp 위험을 먼저 나누세요",
      noKycBody: "No-KYC 조건은 지역, 상품, 출금, 계정 단계에 따라 달라집니다. 먼저 Hyperliquid와 dYdX를 비교하고 각 플랫폼 프로필과 MEXC 계정 조건을 확인하세요.",
      newsBody: "Hyperliquid 최신 뉴스나 공지를 찾는 경우, 이 페이지는 접근 경계 안내입니다. 뉴스 허브, Hyperliquid 기사 또는 프로필을 열고 공식 출처를 확인하세요.",
      pitfalls: [["지갑 연결이 본인확인 위험을 없애지 않습니다", "프런트엔드, 브리지, 제재 확인, 출금 조건이 이용을 제한할 수 있습니다."], ["CEX의 간편 가입은 영구 조건이 아닙니다", "상품, 지역, 한도, 출금 시 본인확인이 달라질 수 있습니다."], ["No-KYC와 익명성은 다릅니다", "온체인 기록, IP, 프런트엔드, 출금 경로는 별도 위험입니다."]],
      faqs: [["No-KYC 플랫폼에서 무엇을 확인해야 하나요?", "접근 방식, 지역, 출금, 제재 확인, 프런트엔드, 추후 본인확인, 청산 위험을 분리해 확인합니다."], ["지갑 연결이면 KYC가 전혀 없나요?", "그렇지 않을 수 있습니다. 프런트엔드, 지역, 브리지, 제재 확인이 제한을 만들 수 있습니다."], ["CEX를 No-KYC로 봐도 되나요?", "주의가 필요합니다. 간편 가입은 지역, 상품, 한도, 출금 단계에서 달라질 수 있습니다."]],
      telegramCommands: [["/compare hyperliquid dydx", "No-KYC perp 경로 비교"], ["/check withdrawal", "출금 및 본인확인 조건 확인"]],
    },
    tr: {
      category: "No-KYC erişim",
      badge: "Erişim koşulu sınırı kontrolü",
      title: "No-KYC kripto erişim karşılaştırması: Hyperliquid, dYdX, MEXC",
      description: "Cüzdan bağlantısı, hesap kaydı, kimlik kontrolü olasılığı, çekim, bölgesel sınırlamalar ve risk sınırlarını Hyperliquid, dYdX ve MEXC üzerinden karşılaştırın.",
      pills: ["Cüzdan bağlantısı", "Sonradan kimlik riski", "Çekim sınırları", "Bölgesel sınırlar"],
      painPoints: [["", "1. No-KYC ifadesini kalıcı garanti sanmak", "No-KYC mevcut erişim koşuludur. Bölge, çekim, ürün ve risk kontrolleri daha sonra kimlik isteyebilir."], ["", "2. Arayüz, kontrat ve köprüyü karıştırmak", "Cüzdan bağlanabilse bile arayüz, yaptırım listesi, köprü veya likidite erişimi sınırlayabilir."], ["", "3. Çekim ve likidasyonu kontrol etmemek", "CEX hesabı ve perp protokolünde çekim sınırı, teminat, likidasyon ve bölge kuralları ayrı okunur."]],
      evaluationPillars: [["Erişim yöntemi", "Cüzdan bağlantısı, e-posta kaydı, CEX hesabı ve perp hesabını ayırın."], ["Bölge ve yaptırım kontrolü", "Ülke, IP, ikamet, yaptırım taraması ve arayüz sınırlarını kontrol edin."], ["Saklama ve çekim", "Self-custody, CEX bakiyesi, teminat, köprü ve çekim limitlerini kontrol edin."], ["Sonradan kimlik", "No-KYC görünse bile risk kontrolü veya çekim sırasında kimlik gerekebilir."]],
      noKycTitle: "Önce self-custody protokolünü, CEX erişimini ve perp riskini ayırın",
      noKycBody: "No-KYC koşulları bölge, ürün, çekim ve hesap aşamasına göre değişebilir. Önce Hyperliquid ile dYdX'i karşılaştırın, sonra her platform profilini ve MEXC hesap koşullarını kontrol edin.",
      newsBody: "Hyperliquid son haberleri veya duyurularını arıyorsanız bu sayfa yalnızca erişim sınırını açıklar. Haber merkezi, Hyperliquid yazısı veya profilinden resmi kaynakları doğrulayın.",
      pitfalls: [["Cüzdan bağlantısı kimlik riskini sıfırlamaz", "Arayüz, köprü, yaptırım kontrolü ve çekim koşulları erişimi sınırlayabilir."], ["CEX'te kolay kayıt kalıcı koşul değildir", "Ürün, bölge, limit ve çekim aşamasında kimlik koşulu değişebilir."], ["No-KYC anonimlik demek değildir", "On-chain geçmiş, IP, arayüz ve çekim yolu ayrı riskler taşır."]],
      faqs: [["No-KYC platformunda ne kontrol edilmeli?", "Erişim yöntemi, bölge, çekim, yaptırım kontrolü, arayüz, sonradan kimlik ve likidasyon riski ayrılmalıdır."], ["Cüzdan bağlantısı KYC yok demek mi?", "Her zaman değil. Arayüz, bölge, köprü ve yaptırım kontrolleri sınırlama getirebilir."], ["CEX'i No-KYC sayabilir miyim?", "Dikkatli olun. Kolay kayıt bölge, ürün, limit ve çekimde değişebilir."]],
      telegramCommands: [["/compare hyperliquid dydx", "No-KYC perp rotasını karşılaştır"], ["/check withdrawal", "Çekim ve kimlik koşullarını kontrol et"]],
    },
    es: {
      category: "Acceso no-KYC",
      badge: "Control de límites de acceso",
      title: "Acceso cripto no-KYC: Hyperliquid, dYdX y MEXC",
      description: "Separa conexión por wallet, cuentas CEX, retiros, límites regionales, controles de sanciones, frontend y riesgo de liquidación.",
      pills: ["Conexión por wallet", "Riesgo de KYC posterior", "Límites de retiro", "Límites regionales"],
      painPoints: [["", "1. Leer no-KYC como promesa permanente", "No-KYC describe una condición actual de acceso. Región, retiros, producto y controles de riesgo pueden exigir identidad más adelante."], ["", "2. Mezclar frontend, contrato y puente", "Aunque conectes wallet, el frontend, listas de sanciones, puente o liquidez pueden limitar el uso."], ["", "3. Ignorar retiros y liquidación", "En CEX y protocolos perp hay que revisar retiros, colateral, liquidación y reglas regionales por separado."]],
      evaluationPillars: [["Método de acceso", "Separa wallet, registro por email, cuenta CEX y cuenta perp."], ["Región y sanciones", "Revisa país, IP, residencia, screening de sanciones y límites del frontend."], ["Custodia y retiros", "Comprueba autocustodia, saldo CEX, colateral, puente y límites de retiro."], ["KYC posterior", "Incluso con no-KYC visible, el control de riesgo o el retiro pueden pedir identidad."]],
      noKycTitle: "Separa protocolos autocustodiados, acceso CEX y riesgo perp",
      noKycBody: "Las condiciones no-KYC cambian por región, producto, retiro y etapa de cuenta. Empieza con Hyperliquid vs dYdX y luego revisa cada perfil y las condiciones de MEXC.",
      newsBody: "Si buscas noticias o anuncios de Hyperliquid, esta página solo explica límites de acceso. Abre noticias, el artículo de Hyperliquid o su perfil y verifica fuentes oficiales.",
      pitfalls: [["Conectar wallet no elimina el riesgo de identidad", "Frontend, puente, sanciones y retiro pueden limitar el acceso."], ["El registro ligero en CEX no es permanente", "Producto, región, límites y retiros pueden cambiar el requisito de identidad."], ["No-KYC no significa anonimato", "Historial on-chain, IP, frontend y ruta de retiro tienen riesgos propios."]],
      faqs: [["¿Qué debo revisar en una plataforma no-KYC?", "Método de acceso, región, retiros, sanciones, frontend, KYC posterior y liquidación."], ["¿Con wallet nunca hay KYC?", "No necesariamente. Frontend, región, puente o sanciones pueden limitar el acceso."], ["¿Una CEX puede tratarse como no-KYC?", "Con cautela. El acceso ligero puede cambiar por región, producto, límite o retiro."]],
      telegramCommands: [["/compare hyperliquid dydx", "Comparar rutas perp no-KYC"], ["/check withdrawal", "Revisar retiros e identidad"]],
    },
    "pt-BR": {
      category: "Acesso no-KYC",
      badge: "Controle de limites de acesso",
      title: "Acesso cripto no-KYC: Hyperliquid, dYdX e MEXC",
      description: "Separe conexão por carteira, contas CEX, saques, limites regionais, controles de sanções, frontend e risco de liquidação.",
      pills: ["Conexão por carteira", "Risco de KYC posterior", "Limites de saque", "Limites regionais"],
      painPoints: [["", "1. Ler no-KYC como promessa permanente", "No-KYC descreve uma condição atual de acesso. Região, saques, produto e controles de risco podem exigir identidade depois."], ["", "2. Misturar frontend, contrato e ponte", "Mesmo conectando carteira, frontend, listas de sanções, ponte ou liquidez podem limitar o uso."], ["", "3. Ignorar saques e liquidação", "Em CEX e protocolos perp, saques, colateral, liquidação e regras regionais devem ser revisados separadamente."]],
      evaluationPillars: [["Método de acesso", "Separe carteira, cadastro por e-mail, conta CEX e conta perp."], ["Região e sanções", "Revise país, IP, residência, triagem de sanções e limites do frontend."], ["Custódia e saques", "Confira autocustódia, saldo CEX, colateral, ponte e limites de saque."], ["KYC posterior", "Mesmo com no-KYC visível, controle de risco ou saque podem pedir identidade."]],
      noKycTitle: "Separe protocolos autocustodiados, acesso CEX e risco perp",
      noKycBody: "Condições no-KYC mudam por região, produto, saque e etapa da conta. Comece por Hyperliquid vs dYdX e depois revise cada perfil e as condições da MEXC.",
      newsBody: "Se você busca notícias ou anúncios da Hyperliquid, esta página explica apenas limites de acesso. Abra notícias, o artigo da Hyperliquid ou seu perfil e verifique fontes oficiais.",
      pitfalls: [["Conectar carteira não elimina risco de identidade", "Frontend, ponte, sanções e saque podem limitar o acesso."], ["Cadastro leve em CEX não é permanente", "Produto, região, limites e saques podem mudar a exigência de identidade."], ["No-KYC não significa anonimato", "Histórico on-chain, IP, frontend e rota de saque têm riscos próprios."]],
      faqs: [["O que revisar em uma plataforma no-KYC?", "Método de acesso, região, saques, sanções, frontend, KYC posterior e liquidação."], ["Com carteira nunca há KYC?", "Não necessariamente. Frontend, região, ponte ou sanções podem limitar o acesso."], ["Uma CEX pode ser tratada como no-KYC?", "Com cautela. O acesso leve pode mudar por região, produto, limite ou saque."]],
      telegramCommands: [["/compare hyperliquid dydx", "Comparar rotas perp no-KYC"], ["/check withdrawal", "Revisar saques e identidade"]],
    },
  },
};


const MEME_TOPIC_AUX_COPY = {
  en: {
    badge: "Source-bound meme coin platform checklist",
    summary: "Review topic scope and verification boundaries",
    pills: ["Token and pool verification", "Published fee and spread checks", "Wallet approval and MEV boundaries", "Exit path and regional terms"],
  },
  "zh-Hans": {
    badge: "来源约束的 Meme 币平台检查清单",
    summary: "查看专题范围与核验边界",
    pills: ["合约地址与池子核验", "公开费率与价差检查", "钱包授权与 MEV 边界", "退出路径与地区条件"],
  },
  "zh-Hant": {
    badge: "來源約束的 Meme 幣平台檢查清單",
    summary: "檢視專題範圍與核驗邊界",
    pills: ["合約地址與池子核驗", "公開費率與價差檢查", "錢包授權與 MEV 邊界", "退出路徑與地區條件"],
  },
  ja: {
    badge: "出典に基づくミームコインプラットフォームチェックリスト",
    summary: "トピック範囲と確認境界を確認",
    pills: ["トークンとプールを確認", "公開手数料とスプレッドを確認", "ウォレット承認とMEV境界を確認", "出口経路と地域条件を確認"],
  },
  ko: {
    badge: "출처 기반 밈코인 플랫폼 체크리스트",
    summary: "주제 범위와 검증 경계 확인",
    pills: ["토큰과 풀 검증", "공개 수수료와 스프레드 확인", "지갑 승인과 MEV 경계", "출구 경로와 지역 조건"],
  },
  tr: {
    badge: "Kaynak sınırlı meme coin platform kontrol listesi",
    summary: "Konu kapsamını ve doğrulama sınırlarını incele",
    pills: ["Token ve havuz doğrulaması", "Yayınlanmış ücret ve spread kontrolü", "Cüzdan onayı ve MEV sınırları", "Çıkış yolu ve bölgesel koşullar"],
  },
  es: {
    badge: "Checklist de plataformas meme coin basado en fuentes",
    summary: "Revisar alcance del tema y límites de verificación",
    pills: ["Verificación de token y pool", "Comisiones publicadas y spread", "Aprobación de wallet y límites MEV", "Ruta de salida y condiciones regionales"],
  },
  "pt-BR": {
    badge: "Checklist de plataformas meme coin com fontes",
    summary: "Revisar escopo do tema e limites de verificação",
    pills: ["Verificação de token e pool", "Taxas publicadas e spread", "Aprovação da carteira e limites de MEV", "Rota de saída e termos regionais"],
  },
  fr: {
    badge: "Checklist de plateformes meme coin fondée sur les sources",
    summary: "Vérifier le périmètre du sujet et les limites de vérification",
    pills: ["Vérification du token et du pool", "Frais publiés et spread", "Approbation du wallet et limites MEV", "Chemin de sortie et conditions régionales"],
  },
  de: {
    badge: "Quellengebundene Meme-Coin-Plattform-Checkliste",
    summary: "Themenumfang und Prüfgrenzen ansehen",
    pills: ["Token- und Pool-Prüfung", "Veröffentlichte Gebühren und Spread", "Wallet-Freigabe und MEV-Grenzen", "Ausstiegspfad und regionale Bedingungen"],
  },
  ru: {
    badge: "Чеклист платформ meme coin с привязкой к источникам",
    summary: "Проверить рамки темы и границы проверки",
    pills: ["Проверка токена и пула", "Опубликованные комиссии и спред", "Разрешение кошелька и границы MEV", "Маршрут выхода и региональные условия"],
  },
  ar: {
    badge: "قائمة تحقق قائمة على المصادر لمنصات عملات الميم",
    summary: "راجع نطاق الموضوع وحدود التحقق",
    pills: ["فحص عقد الرمز والمجمع", "الرسوم المنشورة والفارق", "تفويض المحفظة وحدود MEV", "مسار الخروج والشروط الإقليمية"],
  },
  id: {
    badge: "Checklist platform meme coin berbasis sumber",
    summary: "Tinjau cakupan topik dan batas verifikasi",
    pills: ["Verifikasi token dan pool", "Biaya yang dipublikasikan dan spread", "Persetujuan wallet dan batas MEV", "Jalur keluar dan ketentuan wilayah"],
  },
  vi: {
    badge: "Checklist nền tảng meme coin dựa trên nguồn",
    summary: "Xem phạm vi chủ đề và ranh giới xác minh",
    pills: ["Xác minh token và pool", "Phí công bố và spread", "Phê duyệt ví và ranh giới MEV", "Lộ trình thoát và điều kiện khu vực"],
  },
  it: {
    badge: "Checklist piattaforme meme coin basata su fonti",
    summary: "Rivedi ambito del tema e limiti di verifica",
    pills: ["Verifica token e pool", "Commissioni pubblicate e spread", "Approvazione wallet e limiti MEV", "Percorso di uscita e condizioni regionali"],
  },
};

const MEME_TOPIC_NATIVE_COPY = Object.freeze({
  "en": {
    "quickStats": [
      {
        "labelEn": "Token contract",
        "descEn": "Verify official or on-chain source first",
        "labelZh": "Token contract",
        "descZh": "Verify official or on-chain source first"
      },
      {
        "labelEn": "Liquidity route",
        "descEn": "Separate CEX order books from DEX pools",
        "labelZh": "Liquidity route",
        "descZh": "Separate CEX order books from DEX pools"
      },
      {
        "labelEn": "Approval risk",
        "descEn": "Check approval, signature and revoke path",
        "labelZh": "Approval risk",
        "descZh": "Check approval, signature and revoke path"
      },
      {
        "labelEn": "Exit conditions",
        "descEn": "Verify withdrawal, bridge, stablecoin and region terms",
        "labelZh": "Exit conditions",
        "descZh": "Verify withdrawal, bridge, stablecoin and region terms"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Listing notice, pair availability and account terms can diverge",
        "descEn": "Check official notices, trading pairs, funding networks, account eligibility and regional limits before using an order book or pool.",
        "titleZh": "1. Listing notice, pair availability and account terms can diverge",
        "descZh": "Check official notices, trading pairs, funding networks, account eligibility and regional limits before using an order book or pool."
      },
      {
        "icon": "",
        "titleEn": "2. MEV Sandwich Attacks & Slippage Bleed",
        "descEn": "On-chain trading starts with token address, pool address, quote route, price impact, slippage settings and current network state.",
        "titleZh": "2. MEV Sandwich Attacks & Slippage Bleed",
        "descZh": "On-chain trading starts with token address, pool address, quote route, price impact, slippage settings and current network state."
      },
      {
        "icon": "",
        "titleEn": "3. Contract permissions, approvals and exit paths can be opaque",
        "descEn": "Review mint or owner permissions, transfer limits, liquidity state, wallet approvals, stablecoin exits and bridge routes before treating a token as usable.",
        "titleZh": "3. Contract permissions, approvals and exit paths can be opaque",
        "descZh": "Review mint or owner permissions, transfer limits, liquidity state, wallet approvals, stablecoin exits and bridge routes before treating a token as usable."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Notice, pair and funding status",
        "descEn": "Review official notice, spot pair, deposit network, withdrawal network and regional account terms separately.",
        "titleZh": "Notice, pair and funding status",
        "descZh": "Review official notice, spot pair, deposit network, withdrawal network and regional account terms separately."
      },
      {
        "titleEn": "Orderbook Depth",
        "descEn": "Compare CEX order-book depth, DEX pool liquidity, spread, price impact and route quality while preserving unknown live-market states.",
        "titleZh": "Orderbook Depth",
        "descZh": "Compare CEX order-book depth, DEX pool liquidity, spread, price impact and route quality while preserving unknown live-market states."
      },
      {
        "titleEn": "Published cost and exit friction",
        "descEn": "Record published trading fees, gas or priority fees, withdrawal networks, bridge costs and stablecoin exit routes separately.",
        "titleZh": "Published cost and exit friction",
        "descZh": "Record published trading fees, gas or priority fees, withdrawal networks, bridge costs and stablecoin exit routes separately."
      },
      {
        "titleEn": "Security Safeguards",
        "descEn": "Check contract permissions, wallet approvals, token warnings, venue risk controls, reserve disclosures and exit routes as source descriptions, not guarantees.",
        "titleZh": "Security Safeguards",
        "descZh": "Check contract permissions, wallet approvals, token warnings, venue risk controls, reserve disclosures and exit routes as source descriptions, not guarantees."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Evidence status",
      "speedDepth": "Announcements to check",
      "baseRates": "Published fee schedule",
      "netFee": "Applicable fee terms",
      "slippageKyc": "Market and account checks",
      "action": "Profile and account route",
      "painTitle": "Risks and conditions to check",
      "painLead": "Check execution costs, account restrictions, contract permissions and exit conditions separately before choosing a route.",
      "securityTitle": "Platform conditions to check side by side",
      "securityLead": "Use official sources to check published fees, access rules, execution risks and withdrawal conditions. Unverified figures remain pending.",
      "pitfallLead": "Check custody, permissions and exit conditions before proceeding. These checks do not ensure capital safety or recovery of funds.",
      "platformType": "Platform / Type"
    }
  },
  "zh-Hans": {
    "quickStats": [
      {
        "labelEn": "合约地址",
        "descEn": "先核对官方或链上来源",
        "labelZh": "合约地址",
        "descZh": "先核对官方或链上来源"
      },
      {
        "labelEn": "流动性路径",
        "descEn": "分开看 CEX 盘口与 DEX 池子",
        "labelZh": "流动性路径",
        "descZh": "分开看 CEX 盘口与 DEX 池子"
      },
      {
        "labelEn": "授权风险",
        "descEn": "核对授权、签名与撤销路径",
        "labelZh": "授权风险",
        "descZh": "核对授权、签名与撤销路径"
      },
      {
        "labelEn": "退出条件",
        "descEn": "提现、桥、稳定币和地区条件需核验",
        "labelZh": "退出条件",
        "descZh": "提现、桥、稳定币和地区条件需核验"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. 上线公告、交易对与账户条件不一致",
        "descEn": "同一代币在公告、充值、交易对、提现和地区账户中的状态可能不同，进入订单簿或资金池前先逐项核对。",
        "titleZh": "1. 上线公告、交易对与账户条件不一致",
        "descZh": "同一代币在公告、充值、交易对、提现和地区账户中的状态可能不同，进入订单簿或资金池前先逐项核对。"
      },
      {
        "icon": "",
        "titleEn": "2. 链上抢跑 MEV 夹子与极端滑点磨损",
        "descEn": "链上交易要先检查代币地址、池子地址、报价路由、价格影响、滑点设置和当前网络状态。",
        "titleZh": "2. 链上抢跑 MEV 夹子与极端滑点磨损",
        "descZh": "链上交易要先检查代币地址、池子地址、报价路由、价格影响、滑点设置和当前网络状态。"
      },
      {
        "icon": "",
        "titleEn": "3. 合约权限、授权和退出路径不透明",
        "descEn": "检查 mint 或 owner 权限、转账限制、流动性状态、钱包授权、稳定币退出和跨链桥路径。",
        "titleZh": "3. 合约权限、授权和退出路径不透明",
        "descZh": "检查 mint 或 owner 权限、转账限制、流动性状态、钱包授权、稳定币退出和跨链桥路径。"
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "公告、交易对与充值提现状态",
        "descEn": "把官方公告、现货交易对、充值网络、提现网络和地区账户条件分开核对。",
        "titleZh": "公告、交易对与充值提现状态",
        "descZh": "把官方公告、现货交易对、充值网络、提现网络和地区账户条件分开核对。"
      },
      {
        "titleEn": "盘口挂单流动性深度",
        "descEn": "比较 CEX 订单簿深度、DEX 池子流动性、价差、价格影响和路由质量，并保留无法实时证明的市场状态。",
        "titleZh": "盘口挂单流动性深度",
        "descZh": "比较 CEX 订单簿深度、DEX 池子流动性、价差、价格影响和路由质量，并保留无法实时证明的市场状态。"
      },
      {
        "titleEn": "公开费用、网络费与退出成本",
        "descEn": "分开记录公开交易费、链上 gas 或 priority fee、提现网络成本、桥成本和稳定币退出路径。",
        "titleZh": "公开费用、网络费与退出成本",
        "descZh": "分开记录公开交易费、链上 gas 或 priority fee、提现网络成本、桥成本和稳定币退出路径。"
      },
      {
        "titleEn": "安全防御与合约筛查",
        "descEn": "检查合约权限、钱包授权、代币风险提示、平台风控、储备披露和退出路径；不写成偿付保证。",
        "titleZh": "安全防御与合约筛查",
        "descZh": "检查合约权限、钱包授权、代币风险提示、平台风控、储备披露和退出路径；不写成偿付保证。"
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "证据状态",
      "speedDepth": "待核对公告",
      "baseRates": "公开费率表",
      "netFee": "适用费率条款",
      "slippageKyc": "市场与账户条件",
      "action": "平台档案与开户路径",
      "painTitle": "风险与使用条件核对",
      "painLead": "选择交易路径前，分别核对执行成本、账户限制、合约权限与退出条件。",
      "securityTitle": "平台条件核对表",
      "securityLead": "通过官方来源核对公开费率、准入规则、执行风险与提现条件；尚未核验的数值保持待核验。",
      "pitfallLead": "继续操作前核对托管、授权与退出条件。这些检查不保证本金安全，也不保证资金能够追回。",
      "platformType": "交易平台 / 定位"
    }
  },
  "zh-Hant": {
    "quickStats": [
      {
        "labelEn": "合約地址",
        "descEn": "先核對官方或鏈上來源",
        "labelZh": "合約地址",
        "descZh": "先核對官方或鏈上來源"
      },
      {
        "labelEn": "流動性路徑",
        "descEn": "分開看 CEX 盤口與 DEX 池子",
        "labelZh": "流動性路徑",
        "descZh": "分開看 CEX 盤口與 DEX 池子"
      },
      {
        "labelEn": "授權風險",
        "descEn": "核對授權、簽名與撤銷路徑",
        "labelZh": "授權風險",
        "descZh": "核對授權、簽名與撤銷路徑"
      },
      {
        "labelEn": "退出條件",
        "descEn": "提領、橋、穩定幣和地區條件需核驗",
        "labelZh": "退出條件",
        "descZh": "提領、橋、穩定幣和地區條件需核驗"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. 上線公告、交易對與帳戶條件不一致",
        "descEn": "同一代幣在公告、充值、交易對、提領和地區帳戶中的狀態可能不同，進入盤口或資金池前先逐項核對。",
        "titleZh": "1. 上線公告、交易對與帳戶條件不一致",
        "descZh": "同一代幣在公告、充值、交易對、提領和地區帳戶中的狀態可能不同，進入盤口或資金池前先逐項核對。"
      },
      {
        "icon": "",
        "titleEn": "2. 鏈上 MEV 夾子與極端滑點磨損",
        "descEn": "鏈上交易要先檢查代幣地址、池子地址、報價路由、價格影響、滑點設定和目前網路狀態。",
        "titleZh": "2. 鏈上 MEV 夾子與極端滑點磨損",
        "descZh": "鏈上交易要先檢查代幣地址、池子地址、報價路由、價格影響、滑點設定和目前網路狀態。"
      },
      {
        "icon": "",
        "titleEn": "3. 合約權限、授權和退出路徑不透明",
        "descEn": "檢查 mint 或 owner 權限、轉帳限制、流動性狀態、錢包授權、穩定幣退出和跨鏈橋路徑。",
        "titleZh": "3. 合約權限、授權和退出路徑不透明",
        "descZh": "檢查 mint 或 owner 權限、轉帳限制、流動性狀態、錢包授權、穩定幣退出和跨鏈橋路徑。"
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "公告、交易對與充值提領狀態",
        "descEn": "把官方公告、現貨交易對、充值網路、提領網路和地區帳戶條件分開核對。",
        "titleZh": "公告、交易對與充值提領狀態",
        "descZh": "把官方公告、現貨交易對、充值網路、提領網路和地區帳戶條件分開核對。"
      },
      {
        "titleEn": "盤口掛單流動性深度",
        "descEn": "比較 CEX 訂單簿深度、DEX 池子流動性、價差、價格影響和路由品質，並保留無法即時證明的市場狀態。",
        "titleZh": "盤口掛單流動性深度",
        "descZh": "比較 CEX 訂單簿深度、DEX 池子流動性、價差、價格影響和路由品質，並保留無法即時證明的市場狀態。"
      },
      {
        "titleEn": "公開費用、網路費與退出成本",
        "descEn": "分開記錄公開交易費、鏈上 gas 或 priority fee、提領網路成本、橋成本和穩定幣退出路徑。",
        "titleZh": "公開費用、網路費與退出成本",
        "descZh": "分開記錄公開交易費、鏈上 gas 或 priority fee、提領網路成本、橋成本和穩定幣退出路徑。"
      },
      {
        "titleEn": "安全防禦與合約篩查",
        "descEn": "檢查合約權限、錢包授權、代幣風險提示、平台風控、儲備揭露和退出路徑；不寫成償付保證。",
        "titleZh": "安全防禦與合約篩查",
        "descZh": "檢查合約權限、錢包授權、代幣風險提示、平台風控、儲備揭露和退出路徑；不寫成償付保證。"
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "證據狀態",
      "speedDepth": "待核對公告",
      "baseRates": "公開費率表",
      "netFee": "適用費率條款",
      "slippageKyc": "市場與帳戶條件",
      "action": "平台檔案與開戶路徑",
      "painTitle": "風險與使用條件核對",
      "painLead": "選擇交易路徑前，分別核對執行成本、帳戶限制、合約權限與退出條件。",
      "securityTitle": "平台條件核對表",
      "securityLead": "透過官方來源核對公開費率、准入規則、執行風險與提領條件；尚未核驗的數值維持待核驗。",
      "pitfallLead": "繼續操作前核對託管、授權與退出條件。這些檢查不保證本金安全，也不保證資金能夠追回。",
      "platformType": "交易平台 / 定位"
    }
  },
  "ja": {
    "quickStats": [
      {
        "labelEn": "トークンコントラクト",
        "descEn": "公式またはオンチェーンの出典を先に確認",
        "labelZh": "トークンコントラクト",
        "descZh": "公式またはオンチェーンの出典を先に確認"
      },
      {
        "labelEn": "流動性ルート",
        "descEn": "CEX の板と DEX のプールを分けて確認",
        "labelZh": "流動性ルート",
        "descZh": "CEX の板と DEX のプールを分けて確認"
      },
      {
        "labelEn": "承認リスク",
        "descEn": "承認、署名、revoke 経路を確認",
        "labelZh": "承認リスク",
        "descZh": "承認、署名、revoke 経路を確認"
      },
      {
        "labelEn": "退出条件",
        "descEn": "出金、ブリッジ、ステーブルコイン、地域条件を確認",
        "labelZh": "退出条件",
        "descZh": "出金、ブリッジ、ステーブルコイン、地域条件を確認"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. 上場告知、取引ペア、アカウント条件は一致しない場合があります",
        "descEn": "告知、入金、取引ペア、出金、地域アカウント条件を分けて確認してから板やプールを使います。",
        "titleZh": "1. 上場告知、取引ペア、アカウント条件は一致しない場合があります",
        "descZh": "告知、入金、取引ペア、出金、地域アカウント条件を分けて確認してから板やプールを使います。"
      },
      {
        "icon": "",
        "titleEn": "2. MEVサンドイッチと極端なスリッページ損耗",
        "descEn": "オンチェーン取引では、トークンアドレス、プール、見積もり経路、価格影響、スリッページ、ネットワーク状態を確認します。",
        "titleZh": "2. MEVサンドイッチと極端なスリッページ損耗",
        "descZh": "オンチェーン取引では、トークンアドレス、プール、見積もり経路、価格影響、スリッページ、ネットワーク状態を確認します。"
      },
      {
        "icon": "",
        "titleEn": "3. コントラクト権限、承認、退出経路が不透明な場合があります",
        "descEn": "mint/owner 権限、転送制限、流動性状態、ウォレット承認、ステーブルコイン退出、ブリッジ経路を確認します。",
        "titleZh": "3. コントラクト権限、承認、退出経路が不透明な場合があります",
        "descZh": "mint/owner 権限、転送制限、流動性状態、ウォレット承認、ステーブルコイン退出、ブリッジ経路を確認します。"
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "告知、ペア、入出金状態",
        "descEn": "公式告知、現物ペア、入金ネットワーク、出金ネットワーク、地域条件を分けて確認します。",
        "titleZh": "告知、ペア、入出金状態",
        "descZh": "公式告知、現物ペア、入金ネットワーク、出金ネットワーク、地域条件を分けて確認します。"
      },
      {
        "titleEn": "板の深さ",
        "descEn": "CEX の板、DEX プール流動性、スプレッド、価格影響、経路品質を分けて見ます。",
        "titleZh": "板の深さ",
        "descZh": "CEX の板、DEX プール流動性、スプレッド、価格影響、経路品質を分けて見ます。"
      },
      {
        "titleEn": "公開コストと退出時の摩擦",
        "descEn": "公開取引手数料、gas、priority fee、出金ネットワーク、ブリッジ、ステーブルコイン退出を分けて記録します。",
        "titleZh": "公開コストと退出時の摩擦",
        "descZh": "公開取引手数料、gas、priority fee、出金ネットワーク、ブリッジ、ステーブルコイン退出を分けて記録します。"
      },
      {
        "titleEn": "セキュリティ確認項目",
        "descEn": "コントラクト権限、ウォレット承認、トークン警告、リスク管理、準備金開示、退出経路を出典ベースで確認します。",
        "titleZh": "セキュリティ確認項目",
        "descZh": "コントラクト権限、ウォレット承認、トークン警告、リスク管理、準備金開示、退出経路を出典ベースで確認します。"
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "証拠の状態",
      "speedDepth": "確認すべき告知",
      "baseRates": "公開手数料表",
      "netFee": "適用される手数料条件",
      "slippageKyc": "市場とアカウント条件",
      "action": "プロフィールとアカウント経路",
      "painTitle": "確認すべきリスクと利用条件",
      "painLead": "経路を選ぶ前に、実行コスト、アカウント制限、コントラクト権限、退出条件を分けて確認します。",
      "securityTitle": "横並びで確認するプラットフォーム条件",
      "securityLead": "公式出典で公開手数料、アクセス条件、実行リスク、出金条件を確認します。未確認の数値は確認待ちです。",
      "pitfallLead": "続行前にカストディ、権限、退出条件を確認します。これらの確認は元本保全や資金回収を保証しません。",
      "platformType": "プラットフォーム / 種別"
    }
  },
  "ko": {
    "quickStats": [
      {
        "labelEn": "토큰 컨트랙트",
        "descEn": "공식 또는 온체인 출처를 먼저 확인",
        "labelZh": "토큰 컨트랙트",
        "descZh": "공식 또는 온체인 출처를 먼저 확인"
      },
      {
        "labelEn": "유동성 경로",
        "descEn": "CEX 오더북과 DEX 풀을 분리해 확인",
        "labelZh": "유동성 경로",
        "descZh": "CEX 오더북과 DEX 풀을 분리해 확인"
      },
      {
        "labelEn": "승인 위험",
        "descEn": "승인, 서명, revoke 경로 확인",
        "labelZh": "승인 위험",
        "descZh": "승인, 서명, revoke 경로 확인"
      },
      {
        "labelEn": "출구 조건",
        "descEn": "출금, 브리지, 스테이블코인, 지역 조건 확인",
        "labelZh": "출구 조건",
        "descZh": "출금, 브리지, 스테이블코인, 지역 조건 확인"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. 상장 공지, 거래쌍, 계정 조건은 달라질 수 있음",
        "descEn": "공지, 입금, 거래쌍, 출금, 지역 계정 상태를 분리해 확인한 뒤 오더북이나 풀을 사용합니다.",
        "titleZh": "1. 상장 공지, 거래쌍, 계정 조건은 달라질 수 있음",
        "descZh": "공지, 입금, 거래쌍, 출금, 지역 계정 상태를 분리해 확인한 뒤 오더북이나 풀을 사용합니다."
      },
      {
        "icon": "",
        "titleEn": "2. MEV 샌드위치와 극단적 슬리피지 손실",
        "descEn": "온체인 거래는 토큰 주소, 풀 주소, 견적 경로, 가격 영향, 슬리피지 설정, 네트워크 상태 확인에서 시작합니다.",
        "titleZh": "2. MEV 샌드위치와 극단적 슬리피지 손실",
        "descZh": "온체인 거래는 토큰 주소, 풀 주소, 견적 경로, 가격 영향, 슬리피지 설정, 네트워크 상태 확인에서 시작합니다."
      },
      {
        "icon": "",
        "titleEn": "3. 컨트랙트 권한, 승인, 출구 경로가 불투명할 수 있음",
        "descEn": "mint/owner 권한, 전송 제한, 유동성 상태, 지갑 승인, 스테이블코인 출구와 브리지 경로를 확인합니다.",
        "titleZh": "3. 컨트랙트 권한, 승인, 출구 경로가 불투명할 수 있음",
        "descZh": "mint/owner 권한, 전송 제한, 유동성 상태, 지갑 승인, 스테이블코인 출구와 브리지 경로를 확인합니다."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "공지, 거래쌍, 입출금 상태",
        "descEn": "공식 공지, 현물 거래쌍, 입금 네트워크, 출금 네트워크, 지역 계정 조건을 따로 확인합니다.",
        "titleZh": "공지, 거래쌍, 입출금 상태",
        "descZh": "공식 공지, 현물 거래쌍, 입금 네트워크, 출금 네트워크, 지역 계정 조건을 따로 확인합니다."
      },
      {
        "titleEn": "오더북 깊이",
        "descEn": "CEX 오더북 깊이, DEX 풀 유동성, 스프레드, 가격 영향과 경로 품질을 구분합니다.",
        "titleZh": "오더북 깊이",
        "descZh": "CEX 오더북 깊이, DEX 풀 유동성, 스프레드, 가격 영향과 경로 품질을 구분합니다."
      },
      {
        "titleEn": "공개 비용과 출구 마찰",
        "descEn": "공개 거래 수수료, gas 또는 priority fee, 출금 네트워크, 브리지 비용과 스테이블코인 출구를 따로 기록합니다.",
        "titleZh": "공개 비용과 출구 마찰",
        "descZh": "공개 거래 수수료, gas 또는 priority fee, 출금 네트워크, 브리지 비용과 스테이블코인 출구를 따로 기록합니다."
      },
      {
        "titleEn": "보안 점검 항목",
        "descEn": "컨트랙트 권한, 지갑 승인, 토큰 경고, 플랫폼 리스크 관리, 준비금 공시와 출구 경로를 출처 기준으로 확인합니다.",
        "titleZh": "보안 점검 항목",
        "descZh": "컨트랙트 권한, 지갑 승인, 토큰 경고, 플랫폼 리스크 관리, 준비금 공시와 출구 경로를 출처 기준으로 확인합니다."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "증거 상태",
      "speedDepth": "확인할 공지",
      "baseRates": "공개 수수료표",
      "netFee": "적용 수수료 조건",
      "slippageKyc": "시장 및 계정 조건",
      "action": "프로필과 계정 경로",
      "painTitle": "확인할 위험과 이용 조건",
      "painLead": "경로를 선택하기 전에 실행 비용, 계정 제한, 컨트랙트 권한과 출구 조건을 분리해 확인합니다.",
      "securityTitle": "나란히 확인할 플랫폼 조건",
      "securityLead": "공식 출처로 공개 수수료, 접근 규칙, 실행 위험과 출금 조건을 확인합니다. 미확인 수치는 대기 상태로 유지합니다.",
      "pitfallLead": "진행 전 수탁, 권한과 출구 조건을 확인합니다. 이 확인은 원금 안전이나 자금 회수를 보장하지 않습니다.",
      "platformType": "플랫폼 / 유형"
    }
  },
  "tr": {
    "quickStats": [
      {
        "labelEn": "Token kontratı",
        "descEn": "Önce resmi veya zincir üstü kaynağı doğrulayın",
        "labelZh": "Token kontratı",
        "descZh": "Önce resmi veya zincir üstü kaynağı doğrulayın"
      },
      {
        "labelEn": "Likidite rotası",
        "descEn": "CEX emir defterlerini DEX havuzlarından ayırın",
        "labelZh": "Likidite rotası",
        "descZh": "CEX emir defterlerini DEX havuzlarından ayırın"
      },
      {
        "labelEn": "Onay riski",
        "descEn": "Onay, imza ve revoke yolunu kontrol edin",
        "labelZh": "Onay riski",
        "descZh": "Onay, imza ve revoke yolunu kontrol edin"
      },
      {
        "labelEn": "Çıkış koşulları",
        "descEn": "Çekim, köprü, stablecoin ve bölge koşullarını doğrulayın",
        "labelZh": "Çıkış koşulları",
        "descZh": "Çekim, köprü, stablecoin ve bölge koşullarını doğrulayın"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Listeleme duyurusu, çift erişimi ve hesap koşulları ayrışabilir",
        "descEn": "Resmî duyuru, çift, ağ, hesap ve bölge koşullarını ayrı kontrol edin.",
        "titleZh": "1. Listeleme duyurusu, çift erişimi ve hesap koşulları ayrışabilir",
        "descZh": "Resmî duyuru, çift, ağ, hesap ve bölge koşullarını ayrı kontrol edin."
      },
      {
        "icon": "",
        "titleEn": "MEV sandwich ve aşırı slippage aşınması",
        "descEn": "Token, havuz, fiyat rotası, fiyat etkisi, kayma ayarı ve ağ durumundan başlayın.",
        "titleZh": "MEV sandwich ve aşırı slippage aşınması",
        "descZh": "Token, havuz, fiyat rotası, fiyat etkisi, kayma ayarı ve ağ durumundan başlayın."
      },
      {
        "icon": "",
        "titleEn": "3. Kontrat izinleri, onaylar ve çıkış yolları opak olabilir",
        "descEn": "Kontrat izinleri, cüzdan onayları, likidite durumu, stablecoin çıkışı ve köprü rotalarını kontrol edin.",
        "titleZh": "3. Kontrat izinleri, onaylar ve çıkış yolları opak olabilir",
        "descZh": "Kontrat izinleri, cüzdan onayları, likidite durumu, stablecoin çıkışı ve köprü rotalarını kontrol edin."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Duyuru, çift ve fonlama durumu",
        "descEn": "Resmî duyuru, spot çift, yatırma ağı, çekim ağı ve bölgesel hesap koşullarını ayrı inceleyin.",
        "titleZh": "Duyuru, çift ve fonlama durumu",
        "descZh": "Resmî duyuru, spot çift, yatırma ağı, çekim ağı ve bölgesel hesap koşullarını ayrı inceleyin."
      },
      {
        "titleEn": "Emir defteri derinliği",
        "descEn": "CEX emir defteri, DEX havuz likiditesi, spread, fiyat etkisi ve rota kalitesini karşılaştırın.",
        "titleZh": "Emir defteri derinliği",
        "descZh": "CEX emir defteri, DEX havuz likiditesi, spread, fiyat etkisi ve rota kalitesini karşılaştırın."
      },
      {
        "titleEn": "Yayınlanmış maliyet ve çıkış sürtünmesi",
        "descEn": "Yayınlanmış işlem ücretleri, ağ maliyetleri, köprü maliyetleri ve stablecoin çıkış yollarını ayrı kaydedin.",
        "titleZh": "Yayınlanmış maliyet ve çıkış sürtünmesi",
        "descZh": "Yayınlanmış işlem ücretleri, ağ maliyetleri, köprü maliyetleri ve stablecoin çıkış yollarını ayrı kaydedin."
      },
      {
        "titleEn": "Güvenlik kontrol başlıkları",
        "descEn": "İzinler, cüzdan onayları, token uyarıları, risk kontrolleri, açıklamalar ve çıkışları kaynak açıklaması olarak kontrol edin.",
        "titleZh": "Güvenlik kontrol başlıkları",
        "descZh": "İzinler, cüzdan onayları, token uyarıları, risk kontrolleri, açıklamalar ve çıkışları kaynak açıklaması olarak kontrol edin."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Kanıt durumu",
      "speedDepth": "Kontrol edilecek duyurular",
      "baseRates": "Yayınlanmış ücret tablosu",
      "netFee": "Geçerli ücret koşulları",
      "slippageKyc": "Piyasa ve hesap kontrolleri",
      "action": "Profil ve hesap rotası",
      "painTitle": "Kontrol edilecek riskler ve kullanım koşulları",
      "painLead": "Önce resmi veya zincir üstü kaynağı doğrulayın",
      "securityTitle": "Platform koşullarını yan yana kontrol edin",
      "securityLead": "Resmî kaynaklardan yayınlanmış ücretleri, erişim kurallarını, yürütme risklerini ve çekim koşullarını kontrol edin. Doğrulanmamış değerler beklemede kalır.",
      "pitfallLead": "Devam etmeden önce saklama, izinler ve çıkış koşullarını kontrol edin. Bu kontroller sermaye güvenliğini veya fon kurtarmayı garanti etmez.",
      "platformType": "Platform / tür"
    }
  },
  "es": {
    "quickStats": [
      {
        "labelEn": "Contrato del token",
        "descEn": "Verifica primero la fuente oficial u on-chain",
        "labelZh": "Contrato del token",
        "descZh": "Verifica primero la fuente oficial u on-chain"
      },
      {
        "labelEn": "Ruta de liquidez",
        "descEn": "Separa libros CEX de pools DEX",
        "labelZh": "Ruta de liquidez",
        "descZh": "Separa libros CEX de pools DEX"
      },
      {
        "labelEn": "Riesgo de aprobación",
        "descEn": "Comprueba aprobación, firma y ruta de revoke",
        "labelZh": "Riesgo de aprobación",
        "descZh": "Comprueba aprobación, firma y ruta de revoke"
      },
      {
        "labelEn": "Condiciones de salida",
        "descEn": "Verifica retiro, puente, stablecoin y términos regionales",
        "labelZh": "Condiciones de salida",
        "descZh": "Verifica retiro, puente, stablecoin y términos regionales"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Aviso de listado, par y condiciones de cuenta pueden divergir",
        "descEn": "Revisa avisos, pares, redes, condiciones de cuenta y límites regionales antes de usar la ruta.",
        "titleZh": "1. Aviso de listado, par y condiciones de cuenta pueden divergir",
        "descZh": "Revisa avisos, pares, redes, condiciones de cuenta y límites regionales antes de usar la ruta."
      },
      {
        "icon": "",
        "titleEn": "MEV sandwich y desgaste por slippage extremo",
        "descEn": "Empieza por token, pool, ruta de cotización, impacto de precio, slippage y estado de red.",
        "titleZh": "MEV sandwich y desgaste por slippage extremo",
        "descZh": "Empieza por token, pool, ruta de cotización, impacto de precio, slippage y estado de red."
      },
      {
        "icon": "",
        "titleEn": "3. Permisos del contrato, aprobaciones y rutas de salida pueden ser opacos",
        "descEn": "Comprueba permisos del contrato, aprobaciones de wallet, liquidez, salida a stablecoin y puentes.",
        "titleZh": "3. Permisos del contrato, aprobaciones y rutas de salida pueden ser opacos",
        "descZh": "Comprueba permisos del contrato, aprobaciones de wallet, liquidez, salida a stablecoin y puentes."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Aviso, par y estado de fondos",
        "descEn": "Revisa por separado aviso oficial, par spot, red de depósito, red de retiro y condiciones regionales de cuenta.",
        "titleZh": "Aviso, par y estado de fondos",
        "descZh": "Revisa por separado aviso oficial, par spot, red de depósito, red de retiro y condiciones regionales de cuenta."
      },
      {
        "titleEn": "Profundidad del libro de órdenes",
        "descEn": "Compara libros CEX, liquidez de pools DEX, spread, impacto de precio y calidad de ruta.",
        "titleZh": "Profundidad del libro de órdenes",
        "descZh": "Compara libros CEX, liquidez de pools DEX, spread, impacto de precio y calidad de ruta."
      },
      {
        "titleEn": "Coste publicado y fricción de salida",
        "descEn": "Registra por separado comisiones publicadas, costes de red, puentes y rutas de salida a stablecoin.",
        "titleZh": "Coste publicado y fricción de salida",
        "descZh": "Registra por separado comisiones publicadas, costes de red, puentes y rutas de salida a stablecoin."
      },
      {
        "titleEn": "Controles de seguridad",
        "descEn": "Comprueba permisos, aprobaciones de wallet, alertas del token, controles de riesgo, divulgaciones y salidas como descripciones con fuente.",
        "titleZh": "Controles de seguridad",
        "descZh": "Comprueba permisos, aprobaciones de wallet, alertas del token, controles de riesgo, divulgaciones y salidas como descripciones con fuente."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Estado de evidencia",
      "speedDepth": "Anuncios por verificar",
      "baseRates": "Tabla de comisiones publicada",
      "netFee": "Condiciones de comisión aplicables",
      "slippageKyc": "Controles de mercado y cuenta",
      "action": "Perfil y ruta de cuenta",
      "painTitle": "Riesgos y condiciones de uso por comprobar",
      "painLead": "Verifica primero la fuente oficial u on-chain",
      "securityTitle": "Condiciones de plataforma para comparar en paralelo",
      "securityLead": "Usa fuentes oficiales para comprobar comisiones publicadas, reglas de acceso, riesgos de ejecución y condiciones de retiro. Las cifras no verificadas permanecen pendientes.",
      "pitfallLead": "Comprueba custodia, permisos y condiciones de salida antes de continuar. Estas comprobaciones no garantizan seguridad del capital ni recuperación de fondos.",
      "platformType": "Plataforma / tipo"
    }
  },
  "pt-BR": {
    "quickStats": [
      {
        "labelEn": "Contrato do token",
        "descEn": "Verifique primeiro a fonte oficial ou on-chain",
        "labelZh": "Contrato do token",
        "descZh": "Verifique primeiro a fonte oficial ou on-chain"
      },
      {
        "labelEn": "Rota de liquidez",
        "descEn": "Separe livros CEX de pools DEX",
        "labelZh": "Rota de liquidez",
        "descZh": "Separe livros CEX de pools DEX"
      },
      {
        "labelEn": "Risco de aprovação",
        "descEn": "Confira aprovação, assinatura e rota de revoke",
        "labelZh": "Risco de aprovação",
        "descZh": "Confira aprovação, assinatura e rota de revoke"
      },
      {
        "labelEn": "Condições de saída",
        "descEn": "Verifique saque, ponte, stablecoin e termos regionais",
        "labelZh": "Condições de saída",
        "descZh": "Verifique saque, ponte, stablecoin e termos regionais"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Aviso de listagem, par e condições da conta podem divergir",
        "descEn": "Verifique anúncios, pares, redes, condições da conta e limites regionais antes de usar a rota.",
        "titleZh": "1. Aviso de listagem, par e condições da conta podem divergir",
        "descZh": "Verifique anúncios, pares, redes, condições da conta e limites regionais antes de usar a rota."
      },
      {
        "icon": "",
        "titleEn": "MEV sandwich e desgaste por slippage extremo",
        "descEn": "Comece por token, pool, rota de cotação, impacto de preço, slippage e estado da rede.",
        "titleZh": "MEV sandwich e desgaste por slippage extremo",
        "descZh": "Comece por token, pool, rota de cotação, impacto de preço, slippage e estado da rede."
      },
      {
        "icon": "",
        "titleEn": "3. Permissões do contrato, aprovações e rotas de saída podem ser opacas",
        "descEn": "Confira permissões do contrato, aprovações da carteira, liquidez, saída para stablecoin e pontes.",
        "titleZh": "3. Permissões do contrato, aprovações e rotas de saída podem ser opacas",
        "descZh": "Confira permissões do contrato, aprovações da carteira, liquidez, saída para stablecoin e pontes."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Aviso, par e status de fundos",
        "descEn": "Revise separadamente anúncio oficial, par spot, rede de depósito, rede de saque e condições regionais da conta.",
        "titleZh": "Aviso, par e status de fundos",
        "descZh": "Revise separadamente anúncio oficial, par spot, rede de depósito, rede de saque e condições regionais da conta."
      },
      {
        "titleEn": "Profundidade do livro de ofertas",
        "descEn": "Compare livros CEX, liquidez de pools DEX, spread, impacto de preço e qualidade da rota.",
        "titleZh": "Profundidade do livro de ofertas",
        "descZh": "Compare livros CEX, liquidez de pools DEX, spread, impacto de preço e qualidade da rota."
      },
      {
        "titleEn": "Custo publicado e fricção de saída",
        "descEn": "Registre separadamente taxas publicadas, custos de rede, custos de ponte e rotas de saída para stablecoin.",
        "titleZh": "Custo publicado e fricção de saída",
        "descZh": "Registre separadamente taxas publicadas, custos de rede, custos de ponte e rotas de saída para stablecoin."
      },
      {
        "titleEn": "Controles de segurança",
        "descEn": "Confira permissões, aprovações da carteira, alertas do token, controles de risco, divulgações e saídas como descrições com fonte.",
        "titleZh": "Controles de segurança",
        "descZh": "Confira permissões, aprovações da carteira, alertas do token, controles de risco, divulgações e saídas como descrições com fonte."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Status da evidência",
      "speedDepth": "Anúncios a verificar",
      "baseRates": "Tabela de taxas publicada",
      "netFee": "Termos de taxa aplicáveis",
      "slippageKyc": "Checagens de mercado e conta",
      "action": "Perfil e rota de conta",
      "painTitle": "Riscos e condições de uso a verificar",
      "painLead": "Verifique primeiro a fonte oficial ou on-chain",
      "securityTitle": "Condições de plataforma para comparar lado a lado",
      "securityLead": "Use fontes oficiais para verificar taxas publicadas, regras de acesso, riscos de execução e condições de saque. Valores não verificados permanecem pendentes.",
      "pitfallLead": "Confira custódia, permissões e condições de saída antes de prosseguir. Essas verificações não garantem segurança do capital nem recuperação de fundos.",
      "platformType": "Plataforma / tipo"
    }
  },
  "fr": {
    "quickStats": [
      {
        "labelEn": "Contrat du token",
        "descEn": "Vérifiez d’abord la source officielle ou on-chain",
        "labelZh": "Contrat du token",
        "descZh": "Vérifiez d’abord la source officielle ou on-chain"
      },
      {
        "labelEn": "Route de liquidité",
        "descEn": "Séparer carnets CEX et pools DEX",
        "labelZh": "Route de liquidité",
        "descZh": "Séparer carnets CEX et pools DEX"
      },
      {
        "labelEn": "Risque d’approbation",
        "descEn": "Vérifier approbation, signature et révocation",
        "labelZh": "Risque d’approbation",
        "descZh": "Vérifier approbation, signature et révocation"
      },
      {
        "labelEn": "Conditions de sortie",
        "descEn": "Vérifier retrait, bridge, stablecoin et conditions régionales",
        "labelZh": "Conditions de sortie",
        "descZh": "Vérifier retrait, bridge, stablecoin et conditions régionales"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Annonce de listing, paire et conditions de compte peuvent diverger",
        "descEn": "Vérifiez annonces, paires, réseaux, conditions de compte et limites régionales avant d’utiliser la route.",
        "titleZh": "1. Annonce de listing, paire et conditions de compte peuvent diverger",
        "descZh": "Vérifiez annonces, paires, réseaux, conditions de compte et limites régionales avant d’utiliser la route."
      },
      {
        "icon": "",
        "titleEn": "MEV sandwich et usure par slippage extrême",
        "descEn": "Commencez par token, pool, route de cotation, impact de prix, slippage et état du réseau.",
        "titleZh": "MEV sandwich et usure par slippage extrême",
        "descZh": "Commencez par token, pool, route de cotation, impact de prix, slippage et état du réseau."
      },
      {
        "icon": "",
        "titleEn": "3. Autorisations du contrat, approbations et chemins de sortie peuvent être opaques",
        "descEn": "Vérifiez autorisations du contrat, approbations wallet, liquidité, sortie stablecoin et bridges.",
        "titleZh": "3. Autorisations du contrat, approbations et chemins de sortie peuvent être opaques",
        "descZh": "Vérifiez autorisations du contrat, approbations wallet, liquidité, sortie stablecoin et bridges."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Annonce, paire et état des fonds",
        "descEn": "Vérifiez séparément annonce officielle, paire spot, réseau de dépôt, réseau de retrait et conditions régionales du compte.",
        "titleZh": "Annonce, paire et état des fonds",
        "descZh": "Vérifiez séparément annonce officielle, paire spot, réseau de dépôt, réseau de retrait et conditions régionales du compte."
      },
      {
        "titleEn": "Profondeur du carnet d’ordres",
        "descEn": "Comparez carnets CEX, liquidité des pools DEX, spread, impact de prix et qualité de route.",
        "titleZh": "Profondeur du carnet d’ordres",
        "descZh": "Comparez carnets CEX, liquidité des pools DEX, spread, impact de prix et qualité de route."
      },
      {
        "titleEn": "Coût publié et friction de sortie",
        "descEn": "Consignez séparément frais publiés, coûts réseau, coûts de bridge et sorties en stablecoin.",
        "titleZh": "Coût publié et friction de sortie",
        "descZh": "Consignez séparément frais publiés, coûts réseau, coûts de bridge et sorties en stablecoin."
      },
      {
        "titleEn": "Contrôles de sécurité",
        "descEn": "Vérifiez permissions, approbations wallet, alertes token, contrôles de risque, disclosures et sorties comme descriptions sourcées.",
        "titleZh": "Contrôles de sécurité",
        "descZh": "Vérifiez permissions, approbations wallet, alertes token, contrôles de risque, disclosures et sorties comme descriptions sourcées."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Statut des preuves",
      "speedDepth": "Annonces à vérifier",
      "baseRates": "Barème publié",
      "netFee": "Conditions de frais applicables",
      "slippageKyc": "Contrôles marché et compte",
      "action": "Profil et route de compte",
      "painTitle": "Risques et conditions d’utilisation à vérifier",
      "painLead": "Vérifiez d’abord la source officielle ou on-chain",
      "securityTitle": "Conditions de plateforme à comparer côte à côte",
      "securityLead": "Utilisez les sources officielles pour vérifier les frais publiés, les règles d’accès, les risques d’exécution et les conditions de retrait. Les chiffres non vérifiés restent en attente.",
      "pitfallLead": "Vérifiez garde, autorisations et conditions de sortie avant de continuer. Ces contrôles ne garantissent ni sécurité du capital ni récupération des fonds.",
      "platformType": "Plateforme / type"
    }
  },
  "de": {
    "quickStats": [
      {
        "labelEn": "Token-Contract",
        "descEn": "Zuerst offizielle oder On-chain-Quelle prüfen",
        "labelZh": "Token-Contract",
        "descZh": "Zuerst offizielle oder On-chain-Quelle prüfen"
      },
      {
        "labelEn": "Liquiditätsroute",
        "descEn": "CEX-Orderbücher und DEX-Pools getrennt prüfen",
        "labelZh": "Liquiditätsroute",
        "descZh": "CEX-Orderbücher und DEX-Pools getrennt prüfen"
      },
      {
        "labelEn": "Freigaberisiko",
        "descEn": "Freigabe, Signatur und Revoke-Pfad prüfen",
        "labelZh": "Freigaberisiko",
        "descZh": "Freigabe, Signatur und Revoke-Pfad prüfen"
      },
      {
        "labelEn": "Ausstiegsbedingungen",
        "descEn": "Auszahlung, Bridge, Stablecoin und regionale Bedingungen prüfen",
        "labelZh": "Ausstiegsbedingungen",
        "descZh": "Auszahlung, Bridge, Stablecoin und regionale Bedingungen prüfen"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Listing-Mitteilung, Handelspaar und Kontobedingungen können abweichen",
        "descEn": "Prüfen Sie Mitteilungen, Paare, Netzwerke, Kontobedingungen und regionale Grenzen vor Nutzung der Route.",
        "titleZh": "1. Listing-Mitteilung, Handelspaar und Kontobedingungen können abweichen",
        "descZh": "Prüfen Sie Mitteilungen, Paare, Netzwerke, Kontobedingungen und regionale Grenzen vor Nutzung der Route."
      },
      {
        "icon": "",
        "titleEn": "MEV-Sandwich und extreme Slippage-Verluste",
        "descEn": "Beginnen Sie mit Token, Pool, Quote-Route, Preiseffekt, Slippage und Netzwerkstatus.",
        "titleZh": "MEV-Sandwich und extreme Slippage-Verluste",
        "descZh": "Beginnen Sie mit Token, Pool, Quote-Route, Preiseffekt, Slippage und Netzwerkstatus."
      },
      {
        "icon": "",
        "titleEn": "3. Contract-Berechtigungen, Freigaben und Ausstiegspfade können undurchsichtig sein",
        "descEn": "Prüfen Sie Contract-Rechte, Wallet-Freigaben, Liquidität, Stablecoin-Ausstieg und Bridges.",
        "titleZh": "3. Contract-Berechtigungen, Freigaben und Ausstiegspfade können undurchsichtig sein",
        "descZh": "Prüfen Sie Contract-Rechte, Wallet-Freigaben, Liquidität, Stablecoin-Ausstieg und Bridges."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Mitteilung, Paar und Funding-Status",
        "descEn": "Prüfen Sie offizielle Mitteilung, Spot-Paar, Einzahlungsnetz, Auszahlungsnetz und regionale Kontobedingungen getrennt.",
        "titleZh": "Mitteilung, Paar und Funding-Status",
        "descZh": "Prüfen Sie offizielle Mitteilung, Spot-Paar, Einzahlungsnetz, Auszahlungsnetz und regionale Kontobedingungen getrennt."
      },
      {
        "titleEn": "Orderbuch-Tiefe",
        "descEn": "Vergleichen Sie CEX-Orderbücher, DEX-Pool-Liquidität, Spread, Preiseffekt und Routenqualität.",
        "titleZh": "Orderbuch-Tiefe",
        "descZh": "Vergleichen Sie CEX-Orderbücher, DEX-Pool-Liquidität, Spread, Preiseffekt und Routenqualität."
      },
      {
        "titleEn": "Veröffentlichte Kosten und Ausstiegsreibung",
        "descEn": "Erfassen Sie veröffentlichte Handelsgebühren, Netzwerkkosten, Bridge-Kosten und Stablecoin-Ausstiege getrennt.",
        "titleZh": "Veröffentlichte Kosten und Ausstiegsreibung",
        "descZh": "Erfassen Sie veröffentlichte Handelsgebühren, Netzwerkkosten, Bridge-Kosten und Stablecoin-Ausstiege getrennt."
      },
      {
        "titleEn": "Sicherheitsprüfungen",
        "descEn": "Prüfen Sie Rechte, Wallet-Freigaben, Token-Warnungen, Risikokontrollen, Offenlegungen und Ausstiege als quellenbasierte Beschreibungen.",
        "titleZh": "Sicherheitsprüfungen",
        "descZh": "Prüfen Sie Rechte, Wallet-Freigaben, Token-Warnungen, Risikokontrollen, Offenlegungen und Ausstiege als quellenbasierte Beschreibungen."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Nachweisstatus",
      "speedDepth": "Zu prüfende Mitteilungen",
      "baseRates": "Veröffentlichte Gebührentabelle",
      "netFee": "Anwendbare Gebührenbedingungen",
      "slippageKyc": "Markt- und Konto-Checks",
      "action": "Profil und Kontopfad",
      "painTitle": "Zu prüfende Risiken und Nutzungsbedingungen",
      "painLead": "Zuerst offizielle oder On-chain-Quelle prüfen",
      "securityTitle": "Plattformbedingungen im Seitenvergleich prüfen",
      "securityLead": "Prüfen Sie veröffentlichte Gebühren, Zugangsregeln, Ausführungsrisiken und Auszahlungsbedingungen anhand offizieller Quellen. Nicht verifizierte Werte bleiben ausstehend.",
      "pitfallLead": "Prüfen Sie Verwahrung, Berechtigungen und Ausstiegsbedingungen, bevor Sie fortfahren. Diese Prüfungen garantieren weder Kapitalsicherheit noch Rückholung von Geldern.",
      "platformType": "Plattform / Typ"
    }
  },
  "ru": {
    "quickStats": [
      {
        "labelEn": "Контракт токена",
        "descEn": "Сначала проверьте официальный или ончейн-источник",
        "labelZh": "Контракт токена",
        "descZh": "Сначала проверьте официальный или ончейн-источник"
      },
      {
        "labelEn": "Маршрут ликвидности",
        "descEn": "Разделяйте стаканы CEX и пулы DEX",
        "labelZh": "Маршрут ликвидности",
        "descZh": "Разделяйте стаканы CEX и пулы DEX"
      },
      {
        "labelEn": "Риск разрешений",
        "descEn": "Проверьте разрешение, подпись и маршрут revoke",
        "labelZh": "Риск разрешений",
        "descZh": "Проверьте разрешение, подпись и маршрут revoke"
      },
      {
        "labelEn": "Условия выхода",
        "descEn": "Проверьте вывод, мост, стейблкоин и региональные условия",
        "labelZh": "Условия выхода",
        "descZh": "Проверьте вывод, мост, стейблкоин и региональные условия"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Объявление листинга, пара и условия аккаунта могут расходиться",
        "descEn": "Проверьте объявления, пары, сети, условия аккаунта и региональные ограничения до использования маршрута.",
        "titleZh": "1. Объявление листинга, пара и условия аккаунта могут расходиться",
        "descZh": "Проверьте объявления, пары, сети, условия аккаунта и региональные ограничения до использования маршрута."
      },
      {
        "icon": "",
        "titleEn": "MEV-сэндвич и потери от экстремального проскальзывания",
        "descEn": "Начните с токена, пула, маршрута котировки, влияния на цену, проскальзывания и состояния сети.",
        "titleZh": "MEV-сэндвич и потери от экстремального проскальзывания",
        "descZh": "Начните с токена, пула, маршрута котировки, влияния на цену, проскальзывания и состояния сети."
      },
      {
        "icon": "",
        "titleEn": "3. Права контракта, разрешения и маршруты выхода могут быть непрозрачными",
        "descEn": "Проверьте права контракта, разрешения кошелька, ликвидность, выход в стейблкоин и мосты.",
        "titleZh": "3. Права контракта, разрешения и маршруты выхода могут быть непрозрачными",
        "descZh": "Проверьте права контракта, разрешения кошелька, ликвидность, выход в стейблкоин и мосты."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Объявление, пара и статус пополнения",
        "descEn": "Отдельно проверьте официальное объявление, спот-пару, сеть ввода, сеть вывода и региональные условия аккаунта.",
        "titleZh": "Объявление, пара и статус пополнения",
        "descZh": "Отдельно проверьте официальное объявление, спот-пару, сеть ввода, сеть вывода и региональные условия аккаунта."
      },
      {
        "titleEn": "Глубина стакана",
        "descEn": "Сравните стаканы CEX, ликвидность пулов DEX, спред, влияние на цену и качество маршрута.",
        "titleZh": "Глубина стакана",
        "descZh": "Сравните стаканы CEX, ликвидность пулов DEX, спред, влияние на цену и качество маршрута."
      },
      {
        "titleEn": "Опубликованные издержки и трение выхода",
        "descEn": "Отдельно фиксируйте опубликованные комиссии, сетевые расходы, стоимость мостов и выходы в стейблкоин.",
        "titleZh": "Опубликованные издержки и трение выхода",
        "descZh": "Отдельно фиксируйте опубликованные комиссии, сетевые расходы, стоимость мостов и выходы в стейблкоин."
      },
      {
        "titleEn": "Проверки безопасности",
        "descEn": "Проверяйте права, разрешения кошелька, предупреждения токена, риск-контроли, раскрытия и выходы как описания с источниками.",
        "titleZh": "Проверки безопасности",
        "descZh": "Проверяйте права, разрешения кошелька, предупреждения токена, риск-контроли, раскрытия и выходы как описания с источниками."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Статус доказательств",
      "speedDepth": "Объявления для проверки",
      "baseRates": "Опубликованная таблица комиссий",
      "netFee": "Применимые условия комиссий",
      "slippageKyc": "Проверки рынка и аккаунта",
      "action": "Профиль и маршрут аккаунта",
      "painTitle": "Риски и условия использования для проверки",
      "painLead": "Сначала проверьте официальный или ончейн-источник",
      "securityTitle": "Условия платформ для параллельной проверки",
      "securityLead": "Проверяйте опубликованные комиссии, правила доступа, риски исполнения и условия вывода по официальным источникам. Непроверенные значения остаются в ожидании.",
      "pitfallLead": "Перед продолжением проверьте хранение, разрешения и условия выхода. Эти проверки не гарантируют сохранность капитала или возврат средств.",
      "platformType": "Платформа / тип"
    }
  },
  "ar": {
    "quickStats": [
      {
        "labelEn": "عقد الرمز",
        "descEn": "تحقق أولاً من المصدر الرسمي أو على السلسلة",
        "labelZh": "عقد الرمز",
        "descZh": "تحقق أولاً من المصدر الرسمي أو على السلسلة"
      },
      {
        "labelEn": "مسار السيولة",
        "descEn": "افصل دفاتر CEX عن مجمعات DEX",
        "labelZh": "مسار السيولة",
        "descZh": "افصل دفاتر CEX عن مجمعات DEX"
      },
      {
        "labelEn": "مخاطر التفويض",
        "descEn": "افحص التفويض والتوقيع ومسار الإلغاء",
        "labelZh": "مخاطر التفويض",
        "descZh": "افحص التفويض والتوقيع ومسار الإلغاء"
      },
      {
        "labelEn": "شروط الخروج",
        "descEn": "تحقق من السحب والجسر والعملات المستقرة والشروط الإقليمية",
        "labelZh": "شروط الخروج",
        "descZh": "تحقق من السحب والجسر والعملات المستقرة والشروط الإقليمية"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "قد تختلف حالة الإعلان والزوج وشروط الحساب",
        "descEn": "تحقق من الإعلانات والأزواج والشبكات وشروط الحساب قبل استخدام المسار.",
        "titleZh": "قد تختلف حالة الإعلان والزوج وشروط الحساب",
        "descZh": "تحقق من الإعلانات والأزواج والشبكات وشروط الحساب قبل استخدام المسار."
      },
      {
        "icon": "",
        "titleEn": "MEV والانزلاق يحتاجان إلى فحص مسار الصفقة",
        "descEn": "ابدأ بعنوان الرمز والمجمع ومسار التسعير وتأثير السعر وإعدادات الانزلاق وحالة الشبكة الحالية.",
        "titleZh": "MEV والانزلاق يحتاجان إلى فحص مسار الصفقة",
        "descZh": "ابدأ بعنوان الرمز والمجمع ومسار التسعير وتأثير السعر وإعدادات الانزلاق وحالة الشبكة الحالية."
      },
      {
        "icon": "",
        "titleEn": "أذونات العقد والتفويض ومسار الخروج قد تكون غير واضحة",
        "descEn": "افحص أذونات العقد وتفويضات المحفظة وحالة السيولة ومسار الخروج إلى العملات المستقرة والجسور.",
        "titleZh": "أذونات العقد والتفويض ومسار الخروج قد تكون غير واضحة",
        "descZh": "افحص أذونات العقد وتفويضات المحفظة وحالة السيولة ومسار الخروج إلى العملات المستقرة والجسور."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "الإعلان والزوج وحالة التمويل",
        "descEn": "راجع الإعلان الرسمي وزوج التداول وشبكة الإيداع وشبكة السحب وشروط الحساب الإقليمية كل على حدة.",
        "titleZh": "الإعلان والزوج وحالة التمويل",
        "descZh": "راجع الإعلان الرسمي وزوج التداول وشبكة الإيداع وشبكة السحب وشروط الحساب الإقليمية كل على حدة."
      },
      {
        "titleEn": "عمق دفتر الأوامر وسيولة المجمع",
        "descEn": "قارن دفاتر أوامر CEX وسيولة مجمعات DEX والفارق وتأثير السعر وجودة المسار.",
        "titleZh": "عمق دفتر الأوامر وسيولة المجمع",
        "descZh": "قارن دفاتر أوامر CEX وسيولة مجمعات DEX والفارق وتأثير السعر وجودة المسار."
      },
      {
        "titleEn": "التكلفة المنشورة واحتكاك الخروج",
        "descEn": "سجل رسوم التداول المنشورة وتكاليف الشبكة وتكاليف الجسور ومسارات الخروج إلى العملات المستقرة بشكل منفصل.",
        "titleZh": "التكلفة المنشورة واحتكاك الخروج",
        "descZh": "سجل رسوم التداول المنشورة وتكاليف الشبكة وتكاليف الجسور ومسارات الخروج إلى العملات المستقرة بشكل منفصل."
      },
      {
        "titleEn": "العقد والتفويض والتحذيرات",
        "descEn": "افحص الأذونات وتفويضات المحفظة وتحذيرات الرمز وضوابط المخاطر والإفصاحات ومسارات الخروج كوصف قائم على المصادر.",
        "titleZh": "العقد والتفويض والتحذيرات",
        "descZh": "افحص الأذونات وتفويضات المحفظة وتحذيرات الرمز وضوابط المخاطر والإفصاحات ومسارات الخروج كوصف قائم على المصادر."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "حالة الدليل",
      "speedDepth": "إعلانات يجب التحقق منها",
      "baseRates": "جدول الرسوم المنشور",
      "netFee": "شروط الرسوم المطبقة",
      "slippageKyc": "فحوص السوق والحساب",
      "action": "الملف ومسار الحساب",
      "painTitle": "فحوص المخاطر والشروط",
      "painLead": "تحقق من التكاليف والقيود والأذونات وشروط الخروج قبل اختيار المسار.",
      "securityTitle": "شروط المنصة للمقارنة",
      "securityLead": "تحقق من الرسوم المنشورة وقواعد الوصول ومخاطر التنفيذ وشروط السحب من المصادر الرسمية.",
      "pitfallLead": "تحقق من الحفظ والأذونات وشروط الخروج قبل المتابعة. هذه الفحوص لا تضمن سلامة رأس المال أو استرداد الأموال.",
      "platformType": "المنصة / النوع"
    }
  },
  "id": {
    "quickStats": [
      {
        "labelEn": "Kontrak token",
        "descEn": "Periksa dulu sumber resmi atau on-chain",
        "labelZh": "Kontrak token",
        "descZh": "Periksa dulu sumber resmi atau on-chain"
      },
      {
        "labelEn": "Rute likuiditas",
        "descEn": "Pisahkan orderbook CEX dari pool DEX",
        "labelZh": "Rute likuiditas",
        "descZh": "Pisahkan orderbook CEX dari pool DEX"
      },
      {
        "labelEn": "Risiko persetujuan",
        "descEn": "Periksa persetujuan, tanda tangan, dan jalur revoke",
        "labelZh": "Risiko persetujuan",
        "descZh": "Periksa persetujuan, tanda tangan, dan jalur revoke"
      },
      {
        "labelEn": "Ketentuan keluar",
        "descEn": "Verifikasi penarikan, bridge, stablecoin, dan ketentuan wilayah",
        "labelZh": "Ketentuan keluar",
        "descZh": "Verifikasi penarikan, bridge, stablecoin, dan ketentuan wilayah"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Pengumuman listing, pasangan, dan ketentuan akun dapat berbeda",
        "descEn": "Periksa pengumuman, pasangan, jaringan, ketentuan akun, dan batas wilayah sebelum memakai rute.",
        "titleZh": "1. Pengumuman listing, pasangan, dan ketentuan akun dapat berbeda",
        "descZh": "Periksa pengumuman, pasangan, jaringan, ketentuan akun, dan batas wilayah sebelum memakai rute."
      },
      {
        "icon": "",
        "titleEn": "MEV sandwich dan kerugian slippage ekstrem",
        "descEn": "Mulai dari token, pool, rute kuotasi, dampak harga, slippage, dan status jaringan.",
        "titleZh": "MEV sandwich dan kerugian slippage ekstrem",
        "descZh": "Mulai dari token, pool, rute kuotasi, dampak harga, slippage, dan status jaringan."
      },
      {
        "icon": "",
        "titleEn": "3. Izin kontrak, persetujuan, dan jalur keluar dapat tidak transparan",
        "descEn": "Periksa izin kontrak, persetujuan wallet, likuiditas, jalur stablecoin, dan bridge.",
        "titleZh": "3. Izin kontrak, persetujuan, dan jalur keluar dapat tidak transparan",
        "descZh": "Periksa izin kontrak, persetujuan wallet, likuiditas, jalur stablecoin, dan bridge."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Pengumuman, pasangan, dan status dana",
        "descEn": "Periksa terpisah pengumuman resmi, pasangan spot, jaringan deposit, jaringan penarikan, dan ketentuan akun wilayah.",
        "titleZh": "Pengumuman, pasangan, dan status dana",
        "descZh": "Periksa terpisah pengumuman resmi, pasangan spot, jaringan deposit, jaringan penarikan, dan ketentuan akun wilayah."
      },
      {
        "titleEn": "Kedalaman orderbook",
        "descEn": "Bandingkan orderbook CEX, likuiditas pool DEX, spread, dampak harga, dan kualitas rute.",
        "titleZh": "Kedalaman orderbook",
        "descZh": "Bandingkan orderbook CEX, likuiditas pool DEX, spread, dampak harga, dan kualitas rute."
      },
      {
        "titleEn": "Biaya terbit dan friksi keluar",
        "descEn": "Catat terpisah biaya trading terbit, biaya jaringan, biaya bridge, dan jalur keluar stablecoin.",
        "titleZh": "Biaya terbit dan friksi keluar",
        "descZh": "Catat terpisah biaya trading terbit, biaya jaringan, biaya bridge, dan jalur keluar stablecoin."
      },
      {
        "titleEn": "Pemeriksaan keamanan",
        "descEn": "Periksa izin, persetujuan wallet, peringatan token, kontrol risiko, pengungkapan, dan exit sebagai deskripsi bersumber.",
        "titleZh": "Pemeriksaan keamanan",
        "descZh": "Periksa izin, persetujuan wallet, peringatan token, kontrol risiko, pengungkapan, dan exit sebagai deskripsi bersumber."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Status bukti",
      "speedDepth": "Pengumuman untuk dicek",
      "baseRates": "Jadwal biaya terbit",
      "netFee": "Ketentuan biaya yang berlaku",
      "slippageKyc": "Cek pasar dan akun",
      "action": "Profil dan rute akun",
      "painTitle": "Risiko dan ketentuan penggunaan yang perlu diperiksa",
      "painLead": "Periksa dulu sumber resmi atau on-chain",
      "securityTitle": "Ketentuan platform untuk dibandingkan berdampingan",
      "securityLead": "Gunakan sumber resmi untuk memeriksa biaya yang dipublikasikan, aturan akses, risiko eksekusi, dan ketentuan penarikan. Angka yang belum diverifikasi tetap pending.",
      "pitfallLead": "Periksa kustodi, izin, dan ketentuan keluar sebelum melanjutkan. Pemeriksaan ini tidak menjamin keamanan modal atau pemulihan dana.",
      "platformType": "Platform / tipe"
    }
  },
  "vi": {
    "quickStats": [
      {
        "labelEn": "Hợp đồng token",
        "descEn": "Kiểm tra nguồn chính thức hoặc on-chain trước",
        "labelZh": "Hợp đồng token",
        "descZh": "Kiểm tra nguồn chính thức hoặc on-chain trước"
      },
      {
        "labelEn": "Tuyến thanh khoản",
        "descEn": "Tách sổ lệnh CEX khỏi pool DEX",
        "labelZh": "Tuyến thanh khoản",
        "descZh": "Tách sổ lệnh CEX khỏi pool DEX"
      },
      {
        "labelEn": "Rủi ro phê duyệt",
        "descEn": "Kiểm tra phê duyệt, chữ ký và đường revoke",
        "labelZh": "Rủi ro phê duyệt",
        "descZh": "Kiểm tra phê duyệt, chữ ký và đường revoke"
      },
      {
        "labelEn": "Điều kiện thoát",
        "descEn": "Xác minh rút tiền, bridge, stablecoin và điều kiện khu vực",
        "labelZh": "Điều kiện thoát",
        "descZh": "Xác minh rút tiền, bridge, stablecoin và điều kiện khu vực"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Thông báo niêm yết, cặp giao dịch và điều kiện tài khoản có thể khác nhau",
        "descEn": "Kiểm tra thông báo, cặp, mạng, điều kiện tài khoản và giới hạn khu vực trước khi dùng tuyến.",
        "titleZh": "1. Thông báo niêm yết, cặp giao dịch và điều kiện tài khoản có thể khác nhau",
        "descZh": "Kiểm tra thông báo, cặp, mạng, điều kiện tài khoản và giới hạn khu vực trước khi dùng tuyến."
      },
      {
        "icon": "",
        "titleEn": "MEV sandwich và hao mòn do slippage cực đoan",
        "descEn": "Bắt đầu từ token, pool, tuyến báo giá, tác động giá, slippage và trạng thái mạng.",
        "titleZh": "MEV sandwich và hao mòn do slippage cực đoan",
        "descZh": "Bắt đầu từ token, pool, tuyến báo giá, tác động giá, slippage và trạng thái mạng."
      },
      {
        "icon": "",
        "titleEn": "3. Quyền hợp đồng, phê duyệt và đường thoát có thể thiếu minh bạch",
        "descEn": "Kiểm tra quyền hợp đồng, phê duyệt ví, thanh khoản, lối ra stablecoin và bridge.",
        "titleZh": "3. Quyền hợp đồng, phê duyệt và đường thoát có thể thiếu minh bạch",
        "descZh": "Kiểm tra quyền hợp đồng, phê duyệt ví, thanh khoản, lối ra stablecoin và bridge."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Thông báo, cặp và trạng thái nạp/rút",
        "descEn": "Kiểm tra riêng thông báo chính thức, cặp spot, mạng nạp, mạng rút và điều kiện tài khoản theo khu vực.",
        "titleZh": "Thông báo, cặp và trạng thái nạp/rút",
        "descZh": "Kiểm tra riêng thông báo chính thức, cặp spot, mạng nạp, mạng rút và điều kiện tài khoản theo khu vực."
      },
      {
        "titleEn": "Độ sâu sổ lệnh",
        "descEn": "So sánh sổ lệnh CEX, thanh khoản pool DEX, spread, tác động giá và chất lượng tuyến.",
        "titleZh": "Độ sâu sổ lệnh",
        "descZh": "So sánh sổ lệnh CEX, thanh khoản pool DEX, spread, tác động giá và chất lượng tuyến."
      },
      {
        "titleEn": "Chi phí công bố và ma sát khi thoát",
        "descEn": "Ghi riêng phí giao dịch công bố, chi phí mạng, chi phí bridge và đường thoát stablecoin.",
        "titleZh": "Chi phí công bố và ma sát khi thoát",
        "descZh": "Ghi riêng phí giao dịch công bố, chi phí mạng, chi phí bridge và đường thoát stablecoin."
      },
      {
        "titleEn": "Kiểm tra bảo mật",
        "descEn": "Kiểm tra quyền, phê duyệt ví, cảnh báo token, kiểm soát rủi ro, công bố và đường thoát như mô tả có nguồn.",
        "titleZh": "Kiểm tra bảo mật",
        "descZh": "Kiểm tra quyền, phê duyệt ví, cảnh báo token, kiểm soát rủi ro, công bố và đường thoát như mô tả có nguồn."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Trạng thái bằng chứng",
      "speedDepth": "Thông báo cần kiểm tra",
      "baseRates": "Bảng phí công bố",
      "netFee": "Điều khoản phí áp dụng",
      "slippageKyc": "Kiểm tra thị trường và tài khoản",
      "action": "Hồ sơ và lộ trình tài khoản",
      "painTitle": "Rủi ro và điều kiện sử dụng cần kiểm tra",
      "painLead": "Kiểm tra nguồn chính thức hoặc on-chain trước",
      "securityTitle": "Điều kiện nền tảng cần đối chiếu song song",
      "securityLead": "Dùng nguồn chính thức để kiểm tra phí công bố, quy tắc truy cập, rủi ro khớp lệnh và điều kiện rút tiền. Số liệu chưa xác minh vẫn ở trạng thái chờ.",
      "pitfallLead": "Kiểm tra lưu ký, quyền và điều kiện thoát trước khi tiếp tục. Các bước kiểm tra này không bảo đảm an toàn vốn hoặc thu hồi tiền.",
      "platformType": "Nền tảng / loại"
    }
  },
  "it": {
    "quickStats": [
      {
        "labelEn": "Contratto del token",
        "descEn": "Verifica prima la fonte ufficiale o on-chain",
        "labelZh": "Contratto del token",
        "descZh": "Verifica prima la fonte ufficiale o on-chain"
      },
      {
        "labelEn": "Percorso di liquidità",
        "descEn": "Separa order book CEX e pool DEX",
        "labelZh": "Percorso di liquidità",
        "descZh": "Separa order book CEX e pool DEX"
      },
      {
        "labelEn": "Rischio di approvazione",
        "descEn": "Controlla approvazione, firma e percorso di revoke",
        "labelZh": "Rischio di approvazione",
        "descZh": "Controlla approvazione, firma e percorso di revoke"
      },
      {
        "labelEn": "Condizioni di uscita",
        "descEn": "Verifica prelievo, bridge, stablecoin e condizioni regionali",
        "labelZh": "Condizioni di uscita",
        "descZh": "Verifica prelievo, bridge, stablecoin e condizioni regionali"
      }
    ],
    "painPoints": [
      {
        "icon": "",
        "titleEn": "1. Avviso di listing, coppia e condizioni account possono divergere",
        "descEn": "Controlla annunci, coppie, reti, condizioni account e limiti regionali prima di usare il percorso.",
        "titleZh": "1. Avviso di listing, coppia e condizioni account possono divergere",
        "descZh": "Controlla annunci, coppie, reti, condizioni account e limiti regionali prima di usare il percorso."
      },
      {
        "icon": "",
        "titleEn": "MEV sandwich e usura da slippage estremo",
        "descEn": "Parti da token, pool, route di quotazione, impatto prezzo, slippage e stato della rete.",
        "titleZh": "MEV sandwich e usura da slippage estremo",
        "descZh": "Parti da token, pool, route di quotazione, impatto prezzo, slippage e stato della rete."
      },
      {
        "icon": "",
        "titleEn": "3. Permessi del contratto, approvazioni e percorsi di uscita possono essere opachi",
        "descEn": "Controlla permessi del contratto, approvazioni wallet, liquidità, uscita stablecoin e bridge.",
        "titleZh": "3. Permessi del contratto, approvazioni e percorsi di uscita possono essere opachi",
        "descZh": "Controlla permessi del contratto, approvazioni wallet, liquidità, uscita stablecoin e bridge."
      }
    ],
    "evaluationPillars": [
      {
        "titleEn": "Avviso, coppia e stato fondi",
        "descEn": "Verifica separatamente avviso ufficiale, coppia spot, rete deposito, rete prelievo e condizioni account regionali.",
        "titleZh": "Avviso, coppia e stato fondi",
        "descZh": "Verifica separatamente avviso ufficiale, coppia spot, rete deposito, rete prelievo e condizioni account regionali."
      },
      {
        "titleEn": "Profondità order book",
        "descEn": "Confronta order book CEX, liquidità pool DEX, spread, impatto prezzo e qualità della route.",
        "titleZh": "Profondità order book",
        "descZh": "Confronta order book CEX, liquidità pool DEX, spread, impatto prezzo e qualità della route."
      },
      {
        "titleEn": "Costo pubblicato e attrito di uscita",
        "descEn": "Registra separatamente commissioni pubblicate, costi rete, costi bridge e percorsi di uscita stablecoin.",
        "titleZh": "Costo pubblicato e attrito di uscita",
        "descZh": "Registra separatamente commissioni pubblicate, costi rete, costi bridge e percorsi di uscita stablecoin."
      },
      {
        "titleEn": "Controlli di sicurezza",
        "descEn": "Controlla permessi, approvazioni wallet, avvisi token, controlli rischio, disclosure e uscite come descrizioni con fonte.",
        "titleZh": "Controlli di sicurezza",
        "descZh": "Controlla permessi, approvazioni wallet, avvisi token, controlli rischio, disclosure e uscite come descrizioni con fonte."
      }
    ],
    "sourceBoundUi": {
      "scoreLabel": "Stato delle prove",
      "speedDepth": "Annunci da verificare",
      "baseRates": "Tabella commissioni pubblicata",
      "netFee": "Condizioni commissioni applicabili",
      "slippageKyc": "Controlli mercato e account",
      "action": "Profilo e percorso account",
      "painTitle": "Rischi e condizioni d’uso da verificare",
      "painLead": "Verifica prima la fonte ufficiale o on-chain",
      "securityTitle": "Condizioni delle piattaforme da confrontare affiancate",
      "securityLead": "Usa fonti ufficiali per verificare commissioni pubblicate, regole di accesso, rischi di esecuzione e condizioni di prelievo. I valori non verificati restano in sospeso.",
      "pitfallLead": "Controlla custodia, permessi e condizioni di uscita prima di procedere. Questi controlli non garantiscono sicurezza del capitale né recupero dei fondi.",
      "platformType": "Piattaforma / tipo"
    }
  }
});


const MEME_TOPIC_TELEGRAM_COPY = Object.freeze({
  en: [
    { cmd: "/rates meme", descEn: "Open published fee, spread and exit-cost checks", descZh: "Open published fee, spread and exit-cost checks" },
    { cmd: "/alert new_listings", descEn: "Subscribe to reviewed-source pair and announcement alerts", descZh: "Subscribe to reviewed-source pair and announcement alerts" },
  ],
  "zh-Hans": [
    { cmd: "/rates meme", descEn: "打开公开费用、价差和退出成本检查", descZh: "打开公开费用、价差和退出成本检查" },
    { cmd: "/alert new_listings", descEn: "订阅已审阅来源的交易对和公告提醒", descZh: "订阅已审阅来源的交易对和公告提醒" },
  ],
  "zh-Hant": [
    { cmd: "/rates meme", descEn: "開啟公開費用、價差和退出成本檢查", descZh: "開啟公開費用、價差和退出成本檢查" },
    { cmd: "/alert new_listings", descEn: "訂閱已審閱來源的交易對與公告提醒", descZh: "訂閱已審閱來源的交易對與公告提醒" },
  ],
  ja: [
    { cmd: "/rates meme", descEn: "公開手数料、スプレッド、退出コストの確認を開く", descZh: "公開手数料、スプレッド、退出コストの確認を開く" },
    { cmd: "/alert new_listings", descEn: "レビュー済み出典のペアと告知アラートを確認", descZh: "レビュー済み出典のペアと告知アラートを確認" },
  ],
  ko: [
    { cmd: "/rates meme", descEn: "공개 수수료, 스프레드, 출구 비용 확인 열기", descZh: "공개 수수료, 스프레드, 출구 비용 확인 열기" },
    { cmd: "/alert new_listings", descEn: "검토된 출처의 거래쌍 및 공지 알림 확인", descZh: "검토된 출처의 거래쌍 및 공지 알림 확인" },
  ],
  tr: [
    { cmd: "/rates meme", descEn: "Yayınlanmış ücret, spread ve çıkış maliyeti kontrollerini aç", descZh: "Yayınlanmış ücret, spread ve çıkış maliyeti kontrollerini aç" },
    { cmd: "/alert new_listings", descEn: "İncelenmiş kaynaklı parite ve duyuru uyarılarını takip et", descZh: "İncelenmiş kaynaklı parite ve duyuru uyarılarını takip et" },
  ],
  es: [
    { cmd: "/rates meme", descEn: "Abrir comprobaciones de comisiones publicadas, spread y coste de salida", descZh: "Abrir comprobaciones de comisiones publicadas, spread y coste de salida" },
    { cmd: "/alert new_listings", descEn: "Seguir alertas de pares y anuncios con fuentes revisadas", descZh: "Seguir alertas de pares y anuncios con fuentes revisadas" },
  ],
  "pt-BR": [
    { cmd: "/rates meme", descEn: "Abrir checagens de taxas publicadas, spread e custo de saída", descZh: "Abrir checagens de taxas publicadas, spread e custo de saída" },
    { cmd: "/alert new_listings", descEn: "Acompanhar alertas de pares e anúncios com fontes revisadas", descZh: "Acompanhar alertas de pares e anúncios com fontes revisadas" },
  ],
  fr: [
    { cmd: "/rates meme", descEn: "Ouvrir les contrôles des frais publiés, du spread et du coût de sortie", descZh: "Ouvrir les contrôles des frais publiés, du spread et du coût de sortie" },
    { cmd: "/alert new_listings", descEn: "Suivre les alertes de paires et d’annonces issues de sources révisées", descZh: "Suivre les alertes de paires et d’annonces issues de sources révisées" },
  ],
  de: [
    { cmd: "/rates meme", descEn: "Prüfungen zu veröffentlichten Gebühren, Spread und Ausstiegskosten öffnen", descZh: "Prüfungen zu veröffentlichten Gebühren, Spread und Ausstiegskosten öffnen" },
    { cmd: "/alert new_listings", descEn: "Alerts zu Paaren und Ankündigungen aus geprüften Quellen verfolgen", descZh: "Alerts zu Paaren und Ankündigungen aus geprüften Quellen verfolgen" },
  ],
  ru: [
    { cmd: "/rates meme", descEn: "Открыть проверки опубликованных комиссий, спреда и затрат выхода", descZh: "Открыть проверки опубликованных комиссий, спреда и затрат выхода" },
    { cmd: "/alert new_listings", descEn: "Отслеживать пары и объявления из проверенных источников", descZh: "Отслеживать пары и объявления из проверенных источников" },
  ],
  ar: [
    { cmd: "/rates meme", descEn: "فتح فحوص الرسوم المنشورة والفارق وتكلفة الخروج", descZh: "فتح فحوص الرسوم المنشورة والفارق وتكلفة الخروج" },
    { cmd: "/alert new_listings", descEn: "متابعة تنبيهات الأزواج والإعلانات ذات المصادر المراجعة", descZh: "متابعة تنبيهات الأزواج والإعلانات ذات المصادر المراجعة" },
  ],
  id: [
    { cmd: "/rates meme", descEn: "Buka pemeriksaan biaya terbit, spread, dan biaya keluar", descZh: "Buka pemeriksaan biaya terbit, spread, dan biaya keluar" },
    { cmd: "/alert new_listings", descEn: "Ikuti peringatan pasangan dan pengumuman dari sumber yang ditinjau", descZh: "Ikuti peringatan pasangan dan pengumuman dari sumber yang ditinjau" },
  ],
  vi: [
    { cmd: "/rates meme", descEn: "Mở kiểm tra phí công bố, spread và chi phí thoát", descZh: "Mở kiểm tra phí công bố, spread và chi phí thoát" },
    { cmd: "/alert new_listings", descEn: "Theo dõi cảnh báo cặp giao dịch và thông báo từ nguồn đã rà soát", descZh: "Theo dõi cảnh báo cặp giao dịch và thông báo từ nguồn đã rà soát" },
  ],
  it: [
    { cmd: "/rates meme", descEn: "Apri controlli su commissioni pubblicate, spread e costo di uscita", descZh: "Apri controlli su commissioni pubblicate, spread e costo di uscita" },
    { cmd: "/alert new_listings", descEn: "Segui avvisi su coppie e annunci da fonti revisionate", descZh: "Segui avvisi su coppie e annunci da fonti revisionate" },
  ],
});


const MEME_TOPIC_CATEGORY_COPY = Object.freeze({
  en: "Meme coins and on-chain trade checks",
  "zh-Hans": "Meme 币与链上交易检查",
  "zh-Hant": "Meme 幣與鏈上交易檢查",
  ja: "ミームコインとオンチェーン取引確認",
  ko: "밈 코인과 온체인 거래 확인",
  tr: "Meme coin ve zincir üstü işlem kontrolleri",
  es: "Meme coins y controles de trading on-chain",
  "pt-BR": "Meme coins e checagens de trading on-chain",
  fr: "Meme coins et contrôles de trading on-chain",
  de: "Meme-Coins und On-chain-Handelsprüfungen",
  ru: "Мемкоины и проверки ончейн-торговли",
  ar: "عملات الميم وفحوصات التداول على السلسلة",
  id: "Meme coin dan pemeriksaan trading on-chain",
  vi: "Meme coin và kiểm tra giao dịch on-chain",
  it: "Meme coin e controlli di trading on-chain",
});

function topicNativeCategory(slug, locale) {
  if (slug !== "meme-coins") return null;
  const normalized = topicLocaleKey(locale);
  return MEME_TOPIC_CATEGORY_COPY[normalized] || MEME_TOPIC_CATEGORY_COPY[String(locale || "").split("-")[0]] || MEME_TOPIC_CATEGORY_COPY.en;
}

function topicNativeContentCopy(slug, locale) {
  if (slug !== "meme-coins") return null;
  const normalized = topicLocaleKey(locale);
  const copy = MEME_TOPIC_NATIVE_COPY[normalized] || MEME_TOPIC_NATIVE_COPY[String(locale || "").split("-")[0]] || MEME_TOPIC_NATIVE_COPY.en;
  const telegramCommands = MEME_TOPIC_TELEGRAM_COPY[normalized] || MEME_TOPIC_TELEGRAM_COPY[String(locale || "").split("-")[0]] || MEME_TOPIC_TELEGRAM_COPY.en;
  return { ...copy, telegramCommands };
}

function topicAuxiliaryCopy(slug, locale) {
  if (slug !== "meme-coins") return null;
  const normalized = topicLocaleKey(locale);
  return MEME_TOPIC_AUX_COPY[normalized] || MEME_TOPIC_AUX_COPY[String(locale || "").split("-")[0]] || MEME_TOPIC_AUX_COPY.en;
}

function topicLocaleCopy(slug, locale) {
  return TOPIC_LOCALE_COPY[slug]?.[locale] || TOPIC_LOCALE_COPY[slug]?.[String(locale || "").split("-")[0]] || null;
}


const TOPIC_NAV_SHORT_COPY = Object.freeze({
  en: { "meme-coins": "Meme coins", derivatives: "Derivatives", "compliant-exchanges": "Fiat access", "no-kyc": "No KYC" },
  "zh-Hans": { "meme-coins": "Meme 币", derivatives: "合约", "compliant-exchanges": "法币通道", "no-kyc": "免 KYC" },
  "zh-Hant": { "meme-coins": "Meme 幣", derivatives: "合約", "compliant-exchanges": "法幣通道", "no-kyc": "免 KYC" },
  ja: { "meme-coins": "ミーム", derivatives: "デリバ", "compliant-exchanges": "法定通貨", "no-kyc": "KYCなし" },
  ko: { "meme-coins": "밈 코인", derivatives: "파생상품", "compliant-exchanges": "법정화폐", "no-kyc": "KYC 없음" },
  tr: { "meme-coins": "Meme", derivatives: "Türev", "compliant-exchanges": "Fiat", "no-kyc": "KYC yok" },
  es: { "meme-coins": "Meme", derivatives: "Deriv.", "compliant-exchanges": "Fiat", "no-kyc": "Sin KYC" },
  "pt-BR": { "meme-coins": "Meme", derivatives: "Deriv.", "compliant-exchanges": "Fiat", "no-kyc": "Sem KYC" },
  fr: { "meme-coins": "Meme", derivatives: "Dériv.", "compliant-exchanges": "Fiat", "no-kyc": "Sans KYC" },
  de: { "meme-coins": "Meme", derivatives: "Deriv.", "compliant-exchanges": "Fiat", "no-kyc": "Ohne KYC" },
  ru: { "meme-coins": "Мемы", derivatives: "Дерив.", "compliant-exchanges": "Фиат", "no-kyc": "Без KYC" },
  ar: { "meme-coins": "ميم", derivatives: "مشتقات", "compliant-exchanges": "فيات", "no-kyc": "بلا KYC" },
  id: { "meme-coins": "Meme", derivatives: "Deriv.", "compliant-exchanges": "Fiat", "no-kyc": "Tanpa KYC" },
  vi: { "meme-coins": "Meme", derivatives: "Phái sinh", "compliant-exchanges": "Fiat", "no-kyc": "Không KYC" },
  it: { "meme-coins": "Meme", derivatives: "Deriv.", "compliant-exchanges": "Fiat", "no-kyc": "No KYC" },
});


const TOPIC_NAV_FULL_COPY = Object.freeze({
  en: { "meme-coins": "Meme coins and on-chain trade checks", derivatives: "Derivatives and perpetual contracts", "compliant-exchanges": "Fiat access and regulatory checks", "no-kyc": "No-KYC and private trading" },
  "zh-Hans": { "meme-coins": "Meme 币与链上交易检查", derivatives: "衍生品与永续合约", "compliant-exchanges": "法币通道与合规检查", "no-kyc": "免 KYC 与隐私交易" },
  "zh-Hant": { "meme-coins": "Meme 幣與鏈上交易檢查", derivatives: "衍生品與永續合約", "compliant-exchanges": "法幣通道與合規檢查", "no-kyc": "免 KYC 與隱私交易" },
  ja: { "meme-coins": "ミームコインとオンチェーン取引確認", derivatives: "デリバティブと無期限先物", "compliant-exchanges": "法定通貨アクセスと規制確認", "no-kyc": "KYCなしアクセスとプライベート取引" },
  ko: { "meme-coins": "밈 코인과 온체인 거래 확인", derivatives: "파생상품과 무기한 계약", "compliant-exchanges": "법정화폐 접근과 규제 확인", "no-kyc": "KYC 없는 접근과 프라이빗 거래" },
  tr: { "meme-coins": "Meme coin ve zincir üstü işlem kontrolleri", derivatives: "Türev ürünler ve sürekli sözleşmeler", "compliant-exchanges": "Fiat erişimi ve düzenleyici kontroller", "no-kyc": "KYC yok ve özel işlem" },
  es: { "meme-coins": "Meme coins y controles de trading on-chain", derivatives: "Derivados y contratos perpetuos", "compliant-exchanges": "Acceso fiat y controles regulatorios", "no-kyc": "Sin KYC y trading privado" },
  "pt-BR": { "meme-coins": "Meme coins e checagens de trading on-chain", derivatives: "Derivativos e contratos perpétuos", "compliant-exchanges": "Acesso fiat e verificações regulatórias", "no-kyc": "Sem KYC e trading privado" },
  fr: { "meme-coins": "Meme coins et contrôles de trading on-chain", derivatives: "Dérivés et contrats perpétuels", "compliant-exchanges": "Accès fiat et contrôles réglementaires", "no-kyc": "Sans KYC et trading privé" },
  de: { "meme-coins": "Meme-Coins und On-chain-Handelsprüfungen", derivatives: "Derivate und Perpetual-Kontrakte", "compliant-exchanges": "Fiat-Zugang und regulatorische Prüfungen", "no-kyc": "Ohne KYC und privater Handel" },
  ru: { "meme-coins": "Мемкоины и проверки ончейн-торговли", derivatives: "Деривативы и бессрочные контракты", "compliant-exchanges": "Фиатный доступ и регуляторные проверки", "no-kyc": "Без KYC и приватная торговля" },
  ar: { "meme-coins": "عملات الميم وفحوصات التداول على السلسلة", derivatives: "المشتقات والعقود الدائمة", "compliant-exchanges": "الوصول إلى العملات الورقية والفحوص التنظيمية", "no-kyc": "بلا KYC وتداول خاص" },
  id: { "meme-coins": "Meme coin dan pemeriksaan trading on-chain", derivatives: "Derivatif dan kontrak perpetual", "compliant-exchanges": "Akses fiat dan pemeriksaan regulasi", "no-kyc": "Tanpa KYC dan trading privat" },
  vi: { "meme-coins": "Meme coin và kiểm tra giao dịch on-chain", derivatives: "Phái sinh và hợp đồng perpetual", "compliant-exchanges": "Truy cập fiat và kiểm tra quy định", "no-kyc": "Không KYC và giao dịch riêng tư" },
  it: { "meme-coins": "Meme coin e controlli di trading on-chain", derivatives: "Derivati e contratti perpetual", "compliant-exchanges": "Accesso fiat e controlli regolamentari", "no-kyc": "No KYC e trading privato" },
});

function topicNavShortLabel(slug, locale) {
  const normalized = topicLocaleKey(locale);
  return TOPIC_NAV_SHORT_COPY[normalized]?.[slug] || TOPIC_NAV_SHORT_COPY[String(locale || "").split("-")[0]]?.[slug] || TOPIC_NAV_SHORT_COPY.en[slug] || slug;
}


function topicNavFullLabel(slug, locale) {
  const normalized = topicLocaleKey(locale);
  return TOPIC_NAV_FULL_COPY[normalized]?.[slug] || TOPIC_NAV_FULL_COPY[String(locale || "").split("-")[0]]?.[slug] || TOPIC_NAV_FULL_COPY.en[slug] || slug;
}

function topicSummaryFor(slug, locale, fallback) {
  const override = topicLocaleCopy(slug, locale);
  const nativeCategory = topicNativeCategory(slug, locale);
  const baseLocale = topicLocaleKey(locale);
  const jaFallback = baseLocale === "ja" ? {
    "meme-coins": {
      category: "ミームコインとオンチェーン取引確認",
      title: "ミームコイン向け暗号資産プラットフォームガイド",
      description: "ミームコインを扱う取引所と分散型プラットフォームを、公式条件、手数料、地域要件、出典とともに比較します。",
    },
    "compliant-exchanges": {
      category: "法定通貨アクセスと規制確認",
      title: "規制対応取引所の確認：HashKey、Kraken、OKX",
      description: "法定通貨入金、本人確認、登録情報、商品範囲を公式ソースで分けて確認します。",
    },
    "no-kyc": {
      category: "本人確認なしアクセス",
      title: "本人確認なし暗号資産アクセス比較：Hyperliquid、dYdX、MEXC",
      description: "ウォレット接続、CEX口座、出金、地域制限、制裁チェック、フロントエンド、清算リスクを分けて確認します。",
    },
  }[slug] : null;
  return {
    category: override?.category || nativeCategory || jaFallback?.category || fallback.categoryEn,
    title: override?.title || jaFallback?.title || fallback.titleEn,
    description: override?.description || jaFallback?.description || fallback.descEn,
  };
}

const PERP_DICTIONARY_COPY = {
  en: { title: "Perp DEX cost-field dictionary", subtitle: (version) => `Version ${version}. A reusable schema for comparing venue mechanics. It does not publish live rates or choose a venue for the reader.`, usageTitle: "How to use this dictionary", usageBody: "Use the 8 fields to record a Perp DEX route's fees, funding, collateral, margin, oracle and liquidation rules, then continue to the Hyperliquid vs dYdX comparison or venue profiles. It is a field checklist, not a live-rate feed, venue ranking or registration path.", findingTitle: "Citation-ready finding · 2026-09-15", findingBody: "The Wave48 dataset records all 24 required venue-field entries as source-backed known across Hyperliquid, dYdX, GMX and Aevo. The finding is that Perp DEX cost review still needs the full fee, funding, collateral, margin, oracle and liquidation stack, not a single static fee or live funding quote.", downloads: "Downloads and sources", openFields: "Open the 8 fields and comparison rules", openSources: "View all official definition sources" },
  "zh-Hans": { title: "Perp DEX 成本字段字典", subtitle: (version) => `版本 ${version}。这是一套用于统一比较平台的记录标准，不提供实时费率，也不替用户选择平台。`, usageTitle: "如何使用这份字典？", usageBody: "先用 8 个字段逐项记录 Perp DEX 路线的费用、资金费率、保证金、预言机和强平规则，再继续阅读 Hyperliquid vs dYdX 对比或平台档案。它是字段核对表，不是实时费率、平台排名或开户链接。", findingTitle: "可引用发现 · 2026-09-15", findingBody: "Wave48 数据集显示，在 Hyperliquid、dYdX、GMX 与 Aevo 四个 Perp DEX 样本中，24 个必填平台字段均有官方来源记录为 known；但每个平台仍需要同时核对费用、资金费率、抵押品、保证金、预言机与强平规则，不能只看一个静态费率或实时 funding 数字。", downloads: "下载与来源", openFields: "展开 8 个成本字段与比较规则", openSources: "查看全部官方定义来源" },
  "zh-Hant": { title: "Perp DEX 成本欄位字典", subtitle: (version) => `版本 ${version}。這是一套用於統一比較平台的記錄標準，不提供即時費率，也不替使用者選擇平台。`, usageTitle: "如何使用這份字典？", usageBody: "先用 8 個欄位逐項記錄 Perp DEX 路線的費用、資金費率、保證金、預言機和強平規則，再繼續閱讀 Hyperliquid vs dYdX 對比或平台檔案。它是欄位核對表，不是即時費率、平台排名或開戶連結。", findingTitle: "可引用發現 · 2026-09-15", findingBody: "Wave48 資料集顯示，在 Hyperliquid、dYdX、GMX 與 Aevo 四個 Perp DEX 樣本中，24 個必填平台欄位均有官方來源記錄為 known；但每個平台仍需要同時核對費用、資金費率、抵押品、保證金、預言機與強平規則，不能只看一個靜態費率或即時 funding 數字。", downloads: "下載與來源", openFields: "展開 8 個成本欄位與比較規則", openSources: "檢視全部官方定義來源" },
  ja: { title: "Perp DEXコスト項目辞書", subtitle: (version) => `バージョン ${version}。取引所メカニズムを比較するための共通記録形式です。ライブ料率を出したり、読者の代わりに取引先を選んだりしません。`, usageTitle: "この辞書の使い方", usageBody: "8項目でPerp DEXルートの手数料、資金調達料、担保、証拠金、オラクル、清算ルールを記録し、Hyperliquid vs dYdX比較または取引所プロフィールへ進みます。これは項目チェックリストであり、ライブ料率、ランキング、登録経路ではありません。", findingTitle: "引用可能な所見 · 2026-09-15", findingBody: "Wave48データセットでは、Hyperliquid、dYdX、GMX、Aevoの4つのPerp DEXサンプルで24個の必須項目が公式ソース付きknownとして記録されています。ただし各プラットフォームでは、単一の静的手数料やライブfunding数値ではなく、手数料、funding、担保、証拠金、オラクル、清算スタック全体を確認する必要があります。", downloads: "ダウンロードと出典", openFields: "8項目と比較ルールを開く", openSources: "公式定義ソースをすべて表示" },
  ko: { title: "Perp DEX 비용 필드 사전", subtitle: (version) => `버전 ${version}. 거래소 메커니즘을 비교하기 위한 공통 기록 형식입니다. 실시간 수수료를 게시하거나 독자를 대신해 플랫폼을 선택하지 않습니다.`, usageTitle: "이 사전 사용법", usageBody: "8개 필드로 Perp DEX 경로의 수수료, 펀딩, 담보, 마진, 오라클, 청산 규칙을 기록한 뒤 Hyperliquid vs dYdX 비교 또는 플랫폼 프로필로 이동합니다. 이는 필드 체크리스트이며 실시간 수수료, 순위, 가입 경로가 아닙니다.", findingTitle: "인용 가능한 발견 · 2026-09-15", findingBody: "Wave48 데이터셋은 Hyperliquid, dYdX, GMX, Aevo 4개 Perp DEX 샘플의 24개 필수 필드를 공식 출처 기반 known으로 기록합니다. 하지만 각 플랫폼은 단일 정적 수수료나 실시간 funding 숫자가 아니라 수수료, funding, 담보, 마진, 오라클, 청산 스택 전체를 확인해야 합니다.", downloads: "다운로드 및 출처", openFields: "8개 필드와 비교 규칙 열기", openSources: "전체 공식 정의 출처 보기" },
  tr: { title: "Perp DEX maliyet alanları sözlüğü", subtitle: (version) => `Sürüm ${version}. Platform mekaniklerini karşılaştırmak için ortak kayıt şemasıdır; canlı oran yayınlamaz ve okuyucu adına platform seçmez.`, usageTitle: "Bu sözlük nasıl kullanılır", usageBody: "8 alanla Perp DEX rotasının ücret, fonlama, teminat, marjin, oracle ve likidasyon kurallarını kaydedin; ardından Hyperliquid vs dYdX karşılaştırmasına veya platform profillerine geçin. Bu canlı oran, sıralama veya kayıt yolu değil, alan kontrol listesidir.", findingTitle: "Atıf yapılabilir bulgu · 2026-09-15", findingBody: "Wave48 veri seti Hyperliquid, dYdX, GMX ve Aevo örneklerinde 24 zorunlu alanın resmi kaynaklı known olduğunu kaydeder. Yine de her platformda tek bir statik ücret ya da canlı funding sayısı değil; ücret, funding, teminat, marjin, oracle ve likidasyon bütünlüğü kontrol edilmelidir.", downloads: "İndirmeler ve kaynaklar", openFields: "8 alanı ve karşılaştırma kurallarını aç", openSources: "Tüm resmi tanım kaynaklarını görüntüle" },
  es: { title: "Diccionario de campos de coste Perp DEX", subtitle: (version) => `Versión ${version}. Es un esquema reutilizable para comparar mecánicas de plataformas; no publica tasas en vivo ni elige una plataforma por el lector.`, usageTitle: "Cómo usar este diccionario", usageBody: "Usa los 8 campos para registrar comisiones, funding, colateral, margen, oráculo y liquidación de una ruta Perp DEX; luego abre Hyperliquid vs dYdX o los perfiles. Es una lista de campos, no un feed de tasas, ranking ni ruta de registro.", findingTitle: "Hallazgo citable · 2026-09-15", findingBody: "El conjunto Wave48 registra los 24 campos obligatorios como known con fuente oficial en Hyperliquid, dYdX, GMX y Aevo. Aun así, cada plataforma requiere revisar todo el stack de comisiones, funding, colateral, margen, oráculo y liquidación, no una sola tasa estática o funding en vivo.", downloads: "Descargas y fuentes", openFields: "Abrir los 8 campos y reglas", openSources: "Ver todas las fuentes oficiales" },
  "pt-BR": { title: "Dicionário de campos de custo Perp DEX", subtitle: (version) => `Versão ${version}. Um esquema reutilizável para comparar mecânicas de plataformas; não publica taxas ao vivo nem escolhe plataforma pelo leitor.`, usageTitle: "Como usar este dicionário", usageBody: "Use os 8 campos para registrar taxas, funding, colateral, margem, oráculo e liquidação de uma rota Perp DEX; depois abra Hyperliquid vs dYdX ou os perfis. É uma lista de campos, não feed de taxas, ranking ou rota de cadastro.", findingTitle: "Achado citável · 2026-09-15", findingBody: "O conjunto Wave48 registra os 24 campos obrigatórios como known com fonte oficial em Hyperliquid, dYdX, GMX e Aevo. Ainda assim, cada plataforma exige revisar todo o stack de taxas, funding, colateral, margem, oráculo e liquidação, não uma taxa estática ou funding ao vivo.", downloads: "Downloads e fontes", openFields: "Abrir os 8 campos e regras", openSources: "Ver todas as fontes oficiais" },
  fr: { title: "Dictionnaire des champs de coût Perp DEX", subtitle: (version) => `Version ${version}. Un schéma réutilisable pour comparer les mécaniques des plateformes; il ne publie pas de taux en direct et ne choisit pas de plateforme pour le lecteur.`, usageTitle: "Comment utiliser ce dictionnaire", usageBody: "Utilisez les 8 champs pour consigner frais, funding, collatéral, marge, oracle et liquidation d’une route Perp DEX, puis ouvrez Hyperliquid vs dYdX ou les profils. C’est une grille de champs, pas un flux de taux, un classement ni un chemin d’inscription.", findingTitle: "Constat citable · 2026-09-15", findingBody: "Le jeu Wave48 enregistre les 24 champs obligatoires comme known avec source officielle pour Hyperliquid, dYdX, GMX et Aevo. Mais chaque plateforme nécessite toujours la vérification complète des frais, funding, collatéral, marge, oracle et liquidation, pas un seul taux statique ou funding en direct.", downloads: "Téléchargements et sources", openFields: "Ouvrir les 8 champs et règles", openSources: "Voir toutes les sources officielles" },
  de: { title: "Perp-DEX-Kostenfeld-Wörterbuch", subtitle: (version) => `Version ${version}. Ein wiederverwendbares Schema zum Vergleich von Plattformmechaniken; es veröffentlicht keine Live-Raten und wählt keine Plattform für den Leser.`, usageTitle: "So nutzen Sie dieses Wörterbuch", usageBody: "Nutzen Sie die 8 Felder, um Gebühren, Funding, Sicherheiten, Margin, Oracle und Liquidation einer Perp-DEX-Route zu erfassen; danach Hyperliquid vs dYdX oder Profile öffnen. Es ist eine Feld-Checkliste, kein Live-Feed, Ranking oder Registrierungsweg.", findingTitle: "Zitierfähige Erkenntnis · 2026-09-15", findingBody: "Der Wave48-Datensatz markiert alle 24 Pflichtfelder für Hyperliquid, dYdX, GMX und Aevo als offiziell belegtes known. Trotzdem braucht jede Plattform die vollständige Prüfung von Gebühren, Funding, Sicherheiten, Margin, Oracle und Liquidation, nicht nur eine statische Gebühr oder Live-Funding-Zahl.", downloads: "Downloads und Quellen", openFields: "8 Felder und Regeln öffnen", openSources: "Alle offiziellen Quellen anzeigen" },
  ru: { title: "Словарь полей затрат Perp DEX", subtitle: (version) => `Версия ${version}. Повторно используемая схема для сравнения механик площадок; она не публикует live-ставки и не выбирает площадку за читателя.`, usageTitle: "Как пользоваться словарём", usageBody: "Используйте 8 полей для записи комиссий, фандинга, залога, маржи, оракула и ликвидации по маршруту Perp DEX, затем откройте Hyperliquid vs dYdX или профили. Это чеклист полей, не live-feed, рейтинг или маршрут регистрации.", findingTitle: "Цитируемый вывод · 2026-09-15", findingBody: "Набор Wave48 фиксирует 24 обязательных поля как known с официальными источниками для Hyperliquid, dYdX, GMX и Aevo. Но для каждой платформы всё равно нужно проверять весь стек комиссий, фандинга, залога, маржи, оракула и ликвидации, а не одну статичную ставку или live funding.", downloads: "Загрузки и источники", openFields: "Открыть 8 полей и правила", openSources: "Показать все официальные источники" },
  ar: { title: "قاموس حقول تكلفة Perp DEX", subtitle: (version) => `الإصدار ${version}. مخطط قابل لإعادة الاستخدام لمقارنة آليات المنصات؛ لا ينشر أسعاراً مباشرة ولا يختار منصة نيابة عن القارئ.`, usageTitle: "كيفية استخدام هذا القاموس", usageBody: "استخدم 8 حقول لتسجيل رسوم مسار Perp DEX والتمويل والضمان والهامش وoracle والتصفية، ثم افتح مقارنة Hyperliquid vs dYdX أو ملفات المنصات. إنه جدول تحقق، وليس تغذية أسعار أو تصنيفاً أو مسار تسجيل.", findingTitle: "نتيجة قابلة للاقتباس · 2026-09-15", findingBody: "يسجل Wave48 جميع الحقول الإلزامية الـ24 كمعلومة known ذات مصدر رسمي عبر Hyperliquid وdYdX وGMX وAevo. ومع ذلك يحتاج كل مسار إلى فحص كامل للرسوم والتمويل والضمان والهامش وoracle والتصفية، لا رقماً ثابتاً أو funding مباشراً واحداً.", downloads: "التنزيلات والمصادر", openFields: "افتح الحقول الثمانية وقواعد المقارنة", openSources: "عرض كل مصادر التعريف الرسمية" },
  id: { title: "Kamus field biaya Perp DEX", subtitle: (version) => `Versi ${version}. Skema pakai ulang untuk membandingkan mekanik platform; tidak menerbitkan tarif live atau memilih platform untuk pembaca.`, usageTitle: "Cara memakai kamus ini", usageBody: "Gunakan 8 field untuk mencatat biaya, funding, kolateral, margin, oracle, dan likuidasi rute Perp DEX, lalu buka Hyperliquid vs dYdX atau profil venue. Ini checklist field, bukan feed tarif, peringkat, atau jalur registrasi.", findingTitle: "Temuan siap kutip · 2026-09-15", findingBody: "Dataset Wave48 mencatat 24 field wajib sebagai known berbasis sumber resmi pada Hyperliquid, dYdX, GMX, dan Aevo. Namun tiap platform tetap perlu memeriksa stack biaya, funding, kolateral, margin, oracle, dan likuidasi lengkap, bukan satu angka fee statis atau funding live.", downloads: "Unduhan dan sumber", openFields: "Buka 8 field dan aturan", openSources: "Lihat semua sumber definisi resmi" },
  vi: { title: "Từ điển trường chi phí Perp DEX", subtitle: (version) => `Phiên bản ${version}. Lược đồ dùng lại để so sánh cơ chế nền tảng; không công bố phí trực tiếp và không chọn nền tảng thay người đọc.`, usageTitle: "Cách dùng từ điển này", usageBody: "Dùng 8 trường để ghi phí, funding, tài sản thế chấp, ký quỹ, oracle và thanh lý của tuyến Perp DEX, rồi mở Hyperliquid vs dYdX hoặc hồ sơ nền tảng. Đây là checklist trường, không phải feed phí, xếp hạng hay đường đăng ký.", findingTitle: "Phát hiện có thể trích dẫn · 2026-09-15", findingBody: "Bộ dữ liệu Wave48 ghi nhận 24 trường bắt buộc là known có nguồn chính thức trên Hyperliquid, dYdX, GMX và Aevo. Tuy nhiên mỗi nền tảng vẫn cần kiểm tra toàn bộ phí, funding, tài sản thế chấp, ký quỹ, oracle và thanh lý, không chỉ một phí tĩnh hoặc số funding trực tiếp.", downloads: "Tải xuống và nguồn", openFields: "Mở 8 trường và quy tắc", openSources: "Xem mọi nguồn định nghĩa chính thức" },
  it: { title: "Dizionario campi costo Perp DEX", subtitle: (version) => `Versione ${version}. Schema riutilizzabile per confrontare meccaniche di piattaforme; non pubblica tariffe live né sceglie una piattaforma per il lettore.`, usageTitle: "Come usare questo dizionario", usageBody: "Usa gli 8 campi per registrare fee, funding, collaterale, margine, oracle e liquidazione di un percorso Perp DEX; poi apri Hyperliquid vs dYdX o i profili. È una checklist di campi, non feed live, ranking o percorso di registrazione.", findingTitle: "Risultato citabile · 2026-09-15", findingBody: "Il dataset Wave48 registra tutti i 24 campi obbligatori come known con fonte ufficiale su Hyperliquid, dYdX, GMX e Aevo. Ogni piattaforma richiede comunque il controllo completo di fee, funding, collaterale, margine, oracle e liquidazione, non una sola fee statica o funding live.", downloads: "Download e fonti", openFields: "Apri gli 8 campi e regole", openSources: "Vedi tutte le fonti ufficiali" },
};

function topicLocaleKey(locale) {
  if (locale === "pt-BR") return "pt-BR";
  if (locale === "zh-Hant" || locale === "zh-TW" || locale === "zh-HK") return "zh-Hant";
  if (String(locale || "").startsWith("zh")) return "zh-Hans";
  return String(locale || "en").split("-")[0] || "en";
}

function localizedRouteHref(href, context) {
  const [path, hash] = String(href || "").split("#");
  return `${localizedHref(path || "/", context)}${hash ? `#${hash}` : ""}`;
}

function traditionalizePerpDictionaryText(value) {
  if (typeof value !== "string") return value;
  return traditionalizeTopicText(value
    .replace(/成本字段/g, "成本欄位")
    .replace(/手续费/g, "手續費")
    .replace(/资金/g, "資金")
    .replace(/订单/g, "訂單")
    .replace(/费用/g, "費用")
    .replace(/返还/g, "返還")
    .replace(/记录/g, "記錄")
    .replace(/账户/g, "帳戶")
    .replace(/等级/g, "等級")
    .replace(/产品/g, "產品")
    .replace(/范围/g, "範圍")
    .replace(/宣传/g, "宣傳")
    .replace(/基础/g, "基礎")
    .replace(/平台/g, "平台")
    .replace(/比较/g, "比較")
    .replace(/资金费率/g, "資金費率")
    .replace(/保证金/g, "保證金")
    .replace(/预言机/g, "預言機")
    .replace(/强平/g, "強平")
    .replace(/规则/g, "規則")
    .replace(/比较/g, "比較")
    .replace(/抵押/g, "抵押")
    .replace(/账户/g, "帳戶")
    .replace(/数值/g, "數值")
    .replace(/记录/g, "記錄"));
}

function traditionalizeTopicText(value) {
  if (Array.isArray(value)) return value.map(traditionalizeTopicText);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, traditionalizeTopicText(item)]));
  if (typeof value !== "string") return value;
  return value
    .replace(/专题/g, "專題")
    .replace(/展开/g, "展開")
    .replace(/导航/g, "導覽")
    .replace(/新闻/g, "新聞")
    .replace(/发布/g, "發布")
    .replace(/页面/g, "頁面")
    .replace(/解释/g, "解釋")
    .replace(/打开/g, "開啟")
    .replace(/来自/g, "來自")
    .replace(/时间/g, "時間")
    .replace(/链/g, "鏈")
    .replace(/细分/g, "細分")
    .replace(/赛道/g, "賽道")
    .replace(/量化/g, "量化")
    .replace(/更新/g, "更新")
    .replace(/最后/g, "最後")
    .replace(/来源/g, "來源")
    .replace(/审阅/g, "審閱")
    .replace(/核验/g, "核驗")
    .replace(/基础/g, "基礎")
    .replace(/资料/g, "資料")
    .replace(/官方/g, "官方")
    .replace(/入口/g, "入口")
    .replace(/商业/g, "商業")
    .replace(/权益/g, "權益")
    .replace(/实时/g, "即時")
    .replace(/条件/g, "條件")
    .replace(/逐项/g, "逐項")
    .replace(/登记/g, "登記")
    .replace(/状态/g, "狀態")
    .replace(/未记录/g, "未記錄")
    .replace(/待/g, "待")
    .replace(/高频/g, "高頻")
    .replace(/痛点/g, "痛點")
    .replace(/评测/g, "評測")
    .replace(/维度/g, "維度")
    .replace(/传统/g, "傳統")
    .replace(/经验/g, "經驗")
    .replace(/信息差/g, "資訊差")
    .replace(/信息/g, "資訊")
    .replace(/冻卡/g, "凍卡")
    .replace(/暗收/g, "暗收")
    .replace(/手续费/g, "手續費")
    .replace(/恶意/g, "惡意")
    .replace(/合约/g, "合約")
    .replace(/重创/g, "重創")
    .replace(/精选/g, "精選")
    .replace(/核心/g, "核心")
    .replace(/横向/g, "橫向")
    .replace(/对决/g, "對決")
    .replace(/基于/g, "基於")
    .replace(/结合/g, "結合")
    .replace(/实盘/g, "實盤")
    .replace(/挂单/g, "掛單")
    .replace(/有效/g, "有效")
    .replace(/费率/g, "費率")
    .replace(/提币/g, "提幣")
    .replace(/门槛/g, "門檻")
    .replace(/直接/g, "直接")
    .replace(/比拼/g, "比拼")
    .replace(/交易平台/g, "交易平台")
    .replace(/定位/g, "定位")
    .replace(/综合分/g, "綜合分")
    .replace(/时效/g, "時效")
    .replace(/撮合/g, "撮合")
    .replace(/深度/g, "深度")
    .replace(/基准/g, "基準")
    .replace(/净/g, "淨")
    .replace(/滑点/g, "滑點")
    .replace(/入金/g, "入金")
    .replace(/访问/g, "訪問")
    .replace(/产品/g, "產品")
    .replace(/阶段/g, "階段")
    .replace(/提现/g, "提現")
    .replace(/资产/g, "資產")
    .replace(/规则/g, "規則")
    .replace(/确认/g, "確認")
    .replace(/限制/g, "限制")
    .replace(/特权/g, "特權")
    .replace(/开户/g, "開戶")
    .replace(/研究/g, "研究")
    .replace(/需/g, "需")
    .replace(/公告/g, "公告")
    .replace(/市场/g, "市場")
    .replace(/地区/g, "地區")
    .replace(/直达/g, "直達")
    .replace(/邀请码/g, "邀請碼")
    .replace(/实战/g, "實戰")
    .replace(/避坑/g, "避坑")
    .replace(/资金/g, "資金")
    .replace(/安全/g, "安全")
    .replace(/防范/g, "防範")
    .replace(/指南/g, "指南")
    .replace(/机构/g, "機構")
    .replace(/专家/g, "專家")
    .replace(/血泪/g, "血淚")
    .replace(/教训/g, "教訓")
    .replace(/总结/g, "總結")
    .replace(/守护/g, "守護")
    .replace(/本金/g, "本金")
    .replace(/万无一失/g, "萬無一失")
    .replace(/问答/g, "問答")
    .replace(/拒绝/g, "拒絕")
    .replace(/模棱两可/g, "模稜兩可")
    .replace(/营销/g, "行銷")
    .replace(/套话/g, "套話")
    .replace(/移动端/g, "行動端")
    .replace(/机器人/g, "機器人")
    .replace(/发送/g, "傳送")
    .replace(/指令/g, "指令")
    .replace(/活动/g, "活動")
    .replace(/核对/g, "核對")
    .replace(/唤醒/g, "喚醒")
    .replace(/电报/g, "Telegram")
    .replace(/探索/g, "探索")
    .replace(/更多/g, "更多")
    .replace(/不同/g, "不同")
    .replace(/场景/g, "場景")
    .replace(/最优/g, "最優")
    .replace(/全面/g, "全面")
    .replace(/消除/g, "消除")
    .replace(/合规/g, "合規")
    .replace(/盲区/g, "盲區")
    .replace(/查看/g, "檢視")
    .replace(/白皮书/g, "白皮書")
    .replace(/平台/g, "平台")
    .replace(/加密/g, "加密")
    .replace(/永续/g, "永續")
    .replace(/账户/g, "帳戶")
    .replace(/钱包/g, "錢包")
    .replace(/期权/g, "期權")
    .replace(/路线/g, "路線")
    .replace(/中心化/g, "中心化")
    .replace(/费用/g, "費用")
    .replace(/保证金/g, "保證金")
    .replace(/强平/g, "強平")
    .replace(/预言机/g, "預言機")
    .replace(/签名/g, "簽名")
    .replace(/选择/g, "選擇")
    .replace(/比较/g, "比較")
    .replace(/字段/g, "欄位")
    .replace(/用户/g, "使用者")
    .replace(/现在/g, "現在")
    .replace(/与/g, "與")
    .replace(/无/g, "無")
    .replace(/隐私/g, "隱私")
    .replace(/实名/g, "實名")
    .replace(/评/g, "評")
    .replace(/选型/g, "選型")
    .replace(/底牌/g, "底牌")
    .replace(/围绕/g, "圍繞")
    .replace(/自托管/g, "自託管")
    .replace(/变化/g, "變化")
    .replace(/为准/g, "為準")
    .replace(/优先/g, "優先")
    .replace(/连接/g, "連接")
    .replace(/直连/g, "直連")
    .replace(/私钥/g, "私鑰")
    .replace(/控制/g, "控制")
    .replace(/风控/g, "風控")
    .replace(/百倍/g, "百倍")
    .replace(/土狗/g, "土狗")
    .replace(/打新/g, "打新")
    .replace(/权威/g, "權威")
    .replace(/深度/g, "深度")
    .replace(/评测/g, "評測")
    .replace(/现货/g, "現貨")
    .replace(/秒级/g, "秒級")
    .replace(/交互/g, "互動")
    .replace(/揭秘/g, "揭祕")
    .replace(/防范/g, "防範")
    .replace(/锁仓/g, "鎖倉")
    .replace(/出金/g, "出金");
}

function zhCopy(isHant, hans, hant) {
  return isHant ? (hant || traditionalizeTopicText(hans)) : hans;
}

// A display label only; platform identity and commercial data remain canonical.
function topicPlatformDisplayName(platform, isHant, isZh) {
  if (isHant && platform?.slug === "okx") return "OKX（歐易）";
  if (isZh) return platform?.name;
  return neutralVenueCatalog.find((venue) => venue.slug === platform?.slug)?.name || platform?.name;
}

function topicZhField(topic, field, isHant) {
  const hantField = `${field}ZhHant`;
  const hansField = `${field}Zh`;
  return isHant ? (topic[hantField] || traditionalizeTopicText(topic[hansField])) : topic[hansField];
}

const DERIVATIVES_ROUTE_UI_COPY = {
  en: { primary: "Primary next step", details: "Open checks and research links", checks: "Checks", links: "More research", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Cost calculator", hyperliquid_news_article: "Research brief", hyperliquid_profile: "Hyperliquid profile", perp_cost_dictionary: "Cost-field dictionary", deribit_profile: "Deribit profile", tokenized_stocks_vs_perps: "Options vs perps context", gmx_profile: "GMX profile", uniswap_wallet_checks: "Uniswap wallet checks", no_kyc_boundary: "Wallet access boundary" } },
  "zh-Hans": { primary: "主要下一步", details: "展开检查项与研究链接", checks: "检查项", links: "更多研究", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "成本计算器", hyperliquid_news_article: "研究简报", hyperliquid_profile: "Hyperliquid 档案", perp_cost_dictionary: "成本字段字典", deribit_profile: "Deribit 档案", tokenized_stocks_vs_perps: "期权与永续背景", gmx_profile: "GMX 档案", uniswap_wallet_checks: "Uniswap 钱包检查", no_kyc_boundary: "钱包访问边界" } },
  "zh-Hant": { primary: "主要下一步", details: "展開檢查項與研究連結", checks: "檢查項", links: "更多研究", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "成本計算器", hyperliquid_news_article: "研究簡報", hyperliquid_profile: "Hyperliquid 檔案", perp_cost_dictionary: "成本欄位字典", deribit_profile: "Deribit 檔案", tokenized_stocks_vs_perps: "期權與永續背景", gmx_profile: "GMX 檔案", uniswap_wallet_checks: "Uniswap 錢包檢查", no_kyc_boundary: "錢包訪問邊界" } },
  ja: { primary: "主な次の手順", details: "チェック項目と研究リンクを開く", checks: "チェック項目", links: "追加リサーチ", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "コスト計算", hyperliquid_news_article: "研究メモ", hyperliquid_profile: "Hyperliquidプロフィール", perp_cost_dictionary: "コスト項目辞書", deribit_profile: "Deribitプロフィール", tokenized_stocks_vs_perps: "オプションと無期限の背景", gmx_profile: "GMXプロフィール", uniswap_wallet_checks: "Uniswapウォレット確認", no_kyc_boundary: "ウォレットアクセス境界" } },
  ko: { primary: "주요 다음 단계", details: "체크와 연구 링크 열기", checks: "체크", links: "추가 연구", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "비용 계산기", hyperliquid_news_article: "연구 브리프", hyperliquid_profile: "Hyperliquid 프로필", perp_cost_dictionary: "비용 필드 사전", deribit_profile: "Deribit 프로필", tokenized_stocks_vs_perps: "옵션과 퍼프 배경", gmx_profile: "GMX 프로필", uniswap_wallet_checks: "Uniswap 지갑 확인", no_kyc_boundary: "지갑 접근 경계" } },
  tr: { primary: "Ana sonraki adım", details: "Kontrolleri ve araştırma linklerini aç", checks: "Kontroller", links: "Ek araştırma", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Maliyet hesaplayıcı", hyperliquid_news_article: "Araştırma özeti", hyperliquid_profile: "Hyperliquid profili", perp_cost_dictionary: "Maliyet alanları sözlüğü", deribit_profile: "Deribit profili", tokenized_stocks_vs_perps: "Opsiyon ve perp bağlamı", gmx_profile: "GMX profili", uniswap_wallet_checks: "Uniswap cüzdan kontrolleri", no_kyc_boundary: "Cüzdan erişim sınırı" } },
  es: { primary: "Siguiente paso principal", details: "Abrir controles y enlaces", checks: "Controles", links: "Más investigación", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Calculadora de coste", hyperliquid_news_article: "Resumen de investigación", hyperliquid_profile: "Perfil de Hyperliquid", perp_cost_dictionary: "Diccionario de costes", deribit_profile: "Perfil de Deribit", tokenized_stocks_vs_perps: "Contexto opciones vs perps", gmx_profile: "Perfil de GMX", uniswap_wallet_checks: "Controles wallet Uniswap", no_kyc_boundary: "Límite de acceso wallet" } },
  "pt-BR": { primary: "Próximo passo principal", details: "Abrir checagens e links", checks: "Checagens", links: "Mais pesquisa", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Calculadora de custo", hyperliquid_news_article: "Resumo de pesquisa", hyperliquid_profile: "Perfil Hyperliquid", perp_cost_dictionary: "Dicionário de custos", deribit_profile: "Perfil Deribit", tokenized_stocks_vs_perps: "Contexto opções vs perps", gmx_profile: "Perfil GMX", uniswap_wallet_checks: "Checagens de carteira Uniswap", no_kyc_boundary: "Limite de acesso por carteira" } },
  fr: { primary: "Étape principale", details: "Ouvrir contrôles et liens", checks: "Contrôles", links: "Plus de recherche", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Calculateur de coût", hyperliquid_news_article: "Note de recherche", hyperliquid_profile: "Profil Hyperliquid", perp_cost_dictionary: "Dictionnaire des coûts", deribit_profile: "Profil Deribit", tokenized_stocks_vs_perps: "Contexte options vs perps", gmx_profile: "Profil GMX", uniswap_wallet_checks: "Contrôles wallet Uniswap", no_kyc_boundary: "Limite d’accès wallet" } },
  de: { primary: "Wichtigster nächster Schritt", details: "Checks und Links öffnen", checks: "Checks", links: "Weitere Recherche", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Kostenrechner", hyperliquid_news_article: "Research-Brief", hyperliquid_profile: "Hyperliquid-Profil", perp_cost_dictionary: "Kostenfeld-Wörterbuch", deribit_profile: "Deribit-Profil", tokenized_stocks_vs_perps: "Optionen-vs-Perps-Kontext", gmx_profile: "GMX-Profil", uniswap_wallet_checks: "Uniswap-Wallet-Checks", no_kyc_boundary: "Wallet-Zugangsgrenze" } },
  ru: { primary: "Главный следующий шаг", details: "Открыть проверки и ссылки", checks: "Проверки", links: "Ещё исследования", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Калькулятор затрат", hyperliquid_news_article: "Исследовательская заметка", hyperliquid_profile: "Профиль Hyperliquid", perp_cost_dictionary: "Словарь затрат", deribit_profile: "Профиль Deribit", tokenized_stocks_vs_perps: "Контекст options vs perps", gmx_profile: "Профиль GMX", uniswap_wallet_checks: "Проверки кошелька Uniswap", no_kyc_boundary: "Граница доступа кошелька" } },
  ar: { primary: "الخطوة التالية الأساسية", details: "افتح الفحوص والروابط", checks: "الفحوص", links: "بحث إضافي", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "حاسبة التكلفة", hyperliquid_news_article: "ملخص بحث", hyperliquid_profile: "ملف Hyperliquid", perp_cost_dictionary: "قاموس حقول التكلفة", deribit_profile: "ملف Deribit", tokenized_stocks_vs_perps: "سياق الخيارات والعقود الدائمة", gmx_profile: "ملف GMX", uniswap_wallet_checks: "فحوص محفظة Uniswap", no_kyc_boundary: "حدود وصول المحفظة" } },
  id: { primary: "Langkah utama berikutnya", details: "Buka cek dan tautan", checks: "Cek", links: "Riset lain", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Kalkulator biaya", hyperliquid_news_article: "Ringkasan riset", hyperliquid_profile: "Profil Hyperliquid", perp_cost_dictionary: "Kamus field biaya", deribit_profile: "Profil Deribit", tokenized_stocks_vs_perps: "Konteks options vs perps", gmx_profile: "Profil GMX", uniswap_wallet_checks: "Cek wallet Uniswap", no_kyc_boundary: "Batas akses wallet" } },
  vi: { primary: "Bước chính tiếp theo", details: "Mở kiểm tra và liên kết", checks: "Kiểm tra", links: "Nghiên cứu thêm", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Máy tính chi phí", hyperliquid_news_article: "Tóm tắt nghiên cứu", hyperliquid_profile: "Hồ sơ Hyperliquid", perp_cost_dictionary: "Từ điển trường chi phí", deribit_profile: "Hồ sơ Deribit", tokenized_stocks_vs_perps: "Bối cảnh options vs perps", gmx_profile: "Hồ sơ GMX", uniswap_wallet_checks: "Kiểm tra ví Uniswap", no_kyc_boundary: "Ranh giới truy cập ví" } },
  it: { primary: "Passo principale", details: "Apri controlli e link", checks: "Controlli", links: "Altra ricerca", labels: { binance_vs_okx: "Binance vs OKX", bybit_vs_bitget: "Bybit vs Bitget", hyperliquid_vs_dydx: "Hyperliquid vs dYdX", rates: "Calcolatore costi", hyperliquid_news_article: "Sintesi ricerca", hyperliquid_profile: "Profilo Hyperliquid", perp_cost_dictionary: "Dizionario costi", deribit_profile: "Profilo Deribit", tokenized_stocks_vs_perps: "Contesto options vs perps", gmx_profile: "Profilo GMX", uniswap_wallet_checks: "Controlli wallet Uniswap", no_kyc_boundary: "Limite accesso wallet" } },
};



const DERIVATIVES_QUICK_STAT_COPY = Object.freeze({
  en: {
    "Fee source": ["Fee source", "Check product, tier and order-type terms"],
    Funding: ["Funding", "Cadence and calculation differ by venue"],
    Liquidation: ["Liquidation", "Separate margin, oracle and maintenance rules"],
    "Next step": ["Next step", "Use pair comparisons before signup"],
  },
  "zh-Hans": { "Fee source": ["费用入口", "按产品、账户层级与订单类型核对"], Funding: ["资金费率", "周期、计算方式与极端行情会变化"], Liquidation: ["清算规则", "保证金、预言机与维护保证金分开看"], "Next step": ["下一步", "用双平台对比页缩小选择范围"] },
  "zh-Hant": { "Fee source": ["費用入口", "按產品、帳戶層級與訂單類型核對"], Funding: ["資金費率", "週期、計算方式與極端行情會變化"], Liquidation: ["清算規則", "保證金、預言機與維持保證金分開看"], "Next step": ["下一步", "用雙平台對比頁縮小選擇範圍"] },
  ja: { "Fee source": ["手数料ソース", "商品、口座階層、注文タイプ別に確認"], Funding: ["資金調達率", "周期と計算方法は取引所ごとに異なります"], Liquidation: ["清算ルール", "証拠金、オラクル、維持証拠金を分けて確認"], "Next step": ["次のステップ", "登録前にペア比較で候補を絞る"] },
  ko: { "Fee source": ["수수료 출처", "상품, 계정 등급, 주문 유형별 조건 확인"], Funding: ["펀딩", "주기와 계산 방식은 플랫폼마다 다릅니다"], Liquidation: ["청산 규칙", "마진, 오라클, 유지증거금을 분리해 확인"], "Next step": ["다음 단계", "가입 전 페어 비교로 후보를 좁히기"] },
  tr: { "Fee source": ["Ücret kaynağı", "Ürün, hesap seviyesi ve emir türü koşullarını kontrol edin"], Funding: ["Fonlama", "Periyot ve hesaplama platforma göre değişir"], Liquidation: ["Likidasyon", "Marjin, oracle ve sürdürme koşullarını ayrı inceleyin"], "Next step": ["Sonraki adım", "Kayıttan önce ikili karşılaştırmayla seçenekleri daraltın"] },
  es: { "Fee source": ["Fuente de comisiones", "Revisa producto, nivel de cuenta y tipo de orden"], Funding: ["Financiación", "Frecuencia y cálculo cambian por plataforma"], Liquidation: ["Liquidación", "Separa margen, oráculo y mantenimiento"], "Next step": ["Siguiente paso", "Usa comparaciones por pares antes de registrarte"] },
  "pt-BR": { "Fee source": ["Fonte de taxas", "Confira produto, nível da conta e tipo de ordem"], Funding: ["Financiamento", "Periodicidade e cálculo variam por plataforma"], Liquidation: ["Liquidação", "Separe margem, oráculo e manutenção"], "Next step": ["Próximo passo", "Use comparações por par antes do cadastro"] },
  fr: { "Fee source": ["Source des frais", "Vérifier produit, niveau de compte et type d’ordre"], Funding: ["Financement", "Cadence et calcul varient selon la plateforme"], Liquidation: ["Liquidation", "Séparer marge, oracle et maintenance"], "Next step": ["Étape suivante", "Comparer par paire avant l’inscription"] },
  de: { "Fee source": ["Gebührenquelle", "Produkt, Kontostufe und Ordertyp prüfen"], Funding: ["Finanzierungsrate", "Takt und Berechnung unterscheiden sich je Plattform"], Liquidation: ["Liquidation", "Margin, Oracle und Maintenance getrennt prüfen"], "Next step": ["Nächster Schritt", "Vor Registrierung Paarvergleiche nutzen"] },
  ru: { "Fee source": ["Источник комиссий", "Проверьте продукт, уровень аккаунта и тип ордера"], Funding: ["Фандинг", "Периодичность и расчёт отличаются по площадкам"], Liquidation: ["Ликвидация", "Разделяйте маржу, оракул и maintenance rules"], "Next step": ["Следующий шаг", "Сузьте выбор через парные сравнения до регистрации"] },
  ar: { "Fee source": ["مصدر الرسوم", "تحقق من المنتج ومستوى الحساب ونوع الأمر"], Funding: ["التمويل", "الدورة وطريقة الحساب تختلفان حسب المنصة"], Liquidation: ["التصفية", "افصل بين الهامش وoracle ومتطلبات الصيانة"], "Next step": ["الخطوة التالية", "استخدم المقارنات الثنائية قبل التسجيل"] },
  id: { "Fee source": ["Sumber biaya", "Periksa produk, tingkat akun, dan tipe order"], Funding: ["Pendanaan", "Jadwal dan perhitungan berbeda per platform"], Liquidation: ["Likuidasi", "Pisahkan margin, oracle, dan aturan maintenance"], "Next step": ["Langkah berikutnya", "Gunakan perbandingan pasangan sebelum daftar"] },
  vi: { "Fee source": ["Nguồn phí", "Kiểm tra sản phẩm, cấp tài khoản và loại lệnh"], Funding: ["Phí tài trợ", "Chu kỳ và cách tính khác nhau theo nền tảng"], Liquidation: ["Thanh lý", "Tách riêng ký quỹ, oracle và yêu cầu duy trì"], "Next step": ["Bước tiếp theo", "So sánh từng cặp trước khi đăng ký"] },
  it: { "Fee source": ["Fonte commissioni", "Verifica prodotto, livello account e tipo ordine"], Funding: ["Finanziamento", "Cadenza e calcolo variano per piattaforma"], Liquidation: ["Liquidazione", "Separa margine, oracle e requisiti di mantenimento"], "Next step": ["Passo successivo", "Usa confronti a coppie prima della registrazione"] },
});

function localizedQuickStat(stat, topicSlug, localeKey, isZh, isTraditionalZh) {
  if (topicSlug !== "derivatives") return stat;
  const copy = DERIVATIVES_QUICK_STAT_COPY[localeKey] || DERIVATIVES_QUICK_STAT_COPY.en;
  const [label, desc] = copy[stat.labelEn] || [];
  if (!label || !desc) return stat;
  if (isTraditionalZh || isZh) return { ...stat, labelZh: label, descZh: desc };
  return { ...stat, labelEn: label, descEn: desc };
}

const PERP_FIELD_LABEL_COPY = Object.freeze({
  en: ["Trading fee", "Funding payment", "Spread and slippage", "Collateral and settlement asset", "Margin model", "Oracle, index and mark price", "Liquidation and backstop", "Transfer and network cost"],
  "zh-Hans": ["交易费率", "资金费率", "价差与滑点", "抵押品与结算资产", "保证金模式", "预言机、指数与标记价格", "强平与兜底机制", "转账与网络成本"],
  "zh-Hant": ["交易費率", "資金費率", "價差與滑點", "抵押品與結算資產", "保證金模式", "預言機、指數與標記價格", "強平與兜底機制", "轉帳與網路成本"],
  ja: ["取引手数料", "資金調達支払い", "スプレッドとスリッページ", "担保と決済資産", "証拠金モデル", "オラクル・指数・マーク価格", "清算とバックストップ", "送金とネットワークコスト"],
  ko: ["거래 수수료", "펀딩 지급", "스프레드와 슬리피지", "담보와 결제 자산", "마진 모델", "오라클·지수·마크 가격", "청산과 백스톱", "이체와 네트워크 비용"],
  tr: ["İşlem ücreti", "Funding ödemesi", "Spread ve kayma", "Teminat ve uzlaşma varlığı", "Marjin modeli", "Oracle, endeks ve mark fiyatı", "Likidasyon ve backstop", "Transfer ve ağ maliyeti"],
  es: ["Comisión de trading", "Pago de funding", "Spread y deslizamiento", "Colateral y activo de liquidación", "Modelo de margen", "Oráculo, índice y precio mark", "Liquidación y respaldo", "Coste de transferencia y red"],
  "pt-BR": ["Taxa de trading", "Pagamento de funding", "Spread e slippage", "Colateral e ativo de liquidação", "Modelo de margem", "Oráculo, índice e preço mark", "Liquidação e backstop", "Custo de transferência e rede"],
  fr: ["Frais de trading", "Paiement de funding", "Spread et slippage", "Collatéral et actif de règlement", "Modèle de marge", "Oracle, indice et prix mark", "Liquidation et filet de sécurité", "Coût de transfert et réseau"],
  de: ["Handelsgebühr", "Funding-Zahlung", "Spread und Slippage", "Sicherheit und Abrechnungswert", "Margin-Modell", "Oracle, Index und Mark-Preis", "Liquidation und Backstop", "Transfer- und Netzwerkkosten"],
  ru: ["Торговая комиссия", "Платёж funding", "Спред и проскальзывание", "Залог и расчётный актив", "Модель маржи", "Оракул, индекс и mark price", "Ликвидация и backstop", "Перевод и сетевые расходы"],
  ar: ["رسوم التداول", "دفعة التمويل", "الفارق والانزلاق", "الضمان وأصل التسوية", "نموذج الهامش", "Oracle والمؤشر وسعر mark", "التصفية وآلية الدعم", "تكلفة التحويل والشبكة"],
  id: ["Biaya trading", "Pembayaran funding", "Spread dan slippage", "Kolateral dan aset penyelesaian", "Model margin", "Oracle, indeks, dan mark price", "Likuidasi dan backstop", "Biaya transfer dan jaringan"],
  vi: ["Phí giao dịch", "Khoản funding", "Spread và trượt giá", "Tài sản thế chấp và thanh toán", "Mô hình ký quỹ", "Oracle, chỉ số và giá mark", "Thanh lý và backstop", "Chi phí chuyển và mạng"],
  it: ["Commissione di trading", "Pagamento funding", "Spread e slippage", "Collaterale e asset di regolamento", "Modello di margine", "Oracle, indice e prezzo mark", "Liquidazione e backstop", "Costo di trasferimento e rete"],
});

const PERP_FIELD_BODY_COPY = Object.freeze({
  ja: { definition: (label) => `${label}を公式ソース付きで記録します。これはライブ料率や推奨順位ではありません。`, rule: "同じ口座条件、同じルート、同じ確認時点で比較します。" },
  ko: { definition: (label) => `${label} 조건을 공식 출처 기준으로 기록합니다. 실시간 수치나 추천 순위가 아닙니다.`, rule: "같은 계정 조건, 같은 경로, 같은 확인 시점으로 비교합니다." },
  tr: { definition: (label) => `${label} koşulunu resmi kaynakla kaydedin. Bu canlı oran veya platform önerisi değildir.`, rule: "Aynı hesap koşulu, rota ve inceleme zamanı ile karşılaştırın." },
  es: { definition: (label) => `Registra ${label} con fuente oficial. No es una tasa en vivo ni una recomendación de plataforma.`, rule: "Compara con la misma cuenta, ruta y fecha de revisión." },
  "pt-BR": { definition: (label) => `Registre ${label} com fonte oficial. Não é taxa ao vivo nem recomendação de plataforma.`, rule: "Compare com a mesma conta, rota e data de revisão." },
  fr: { definition: (label) => `Consignez ${label} avec une source officielle. Ce n’est ni un taux en direct ni une recommandation de plateforme.`, rule: "Comparez avec le même compte, la même route et la même date de vérification." },
  de: { definition: (label) => `${label} mit offizieller Quelle erfassen. Dies ist keine Live-Rate und keine Plattformempfehlung.`, rule: "Mit gleichem Konto, gleicher Route und gleichem Prüfzeitpunkt vergleichen." },
  ru: { definition: (label) => `Фиксируйте «${label}» по официальному источнику. Это не live-ставка и не рекомендация площадки.`, rule: "Сравнивайте при одинаковом аккаунте, маршруте и дате проверки." },
  ar: { definition: (label) => `سجّل ${label} وفق مصدر رسمي. هذا ليس سعراً مباشراً ولا توصية بمنصة.`, rule: "قارن بالشروط نفسها للحساب والمسار وتاريخ المراجعة." },
  id: { definition: (label) => `Catat ${label} dengan sumber resmi. Ini bukan tarif live atau rekomendasi platform.`, rule: "Bandingkan dengan akun, rute, dan waktu tinjauan yang sama." },
  vi: { definition: (label) => `Ghi ${label} theo nguồn chính thức. Đây không phải phí trực tiếp hay khuyến nghị nền tảng.`, rule: "So sánh với cùng điều kiện tài khoản, tuyến và thời điểm rà soát." },
  it: { definition: (label) => `Registra ${label} con fonte ufficiale. Non è una tariffa live né una raccomandazione di piattaforma.`, rule: "Confronta con stesso account, stesso percorso e stessa data di verifica." },
});

function perpFieldDisplay(field, index, localeKey, isZh, isTraditionalZh) {
  if (isTraditionalZh) {
    return {
      label: traditionalizePerpDictionaryText(field.labelZh),
      definition: traditionalizePerpDictionaryText(field.definitionZh),
      comparisonRule: traditionalizePerpDictionaryText(field.comparisonRuleZh),
    };
  }
  if (isZh) return { label: field.labelZh, definition: field.definitionZh, comparisonRule: field.comparisonRuleZh };
  const labels = PERP_FIELD_LABEL_COPY[localeKey] || PERP_FIELD_LABEL_COPY.en;
  const label = labels[index] || field.labelEn;
  const bodyCopy = PERP_FIELD_BODY_COPY[localeKey];
  return {
    label,
    definition: bodyCopy ? bodyCopy.definition(label) : field.definitionEn,
    comparisonRule: bodyCopy ? bodyCopy.rule : field.comparisonRuleEn,
  };
}

function derivativesRouteUi(localeKey) {
  return DERIVATIVES_ROUTE_UI_COPY[localeKey] || DERIVATIVES_ROUTE_UI_COPY.en;
}

function derivativesLinkLabel(link, uiCopy) {
  return uiCopy.labels?.[link.labelKey] || uiCopy.labels?.[link.decision] || link.label || link.decision || "Research path";
}


const DERIVATIVES_ROUTE_TASK_COPY = {
  en: { chooser: "Choose route to inspect", selected: "Selected route", evidence: "Next evidence", costDictionary: "Cost-field dictionary", routeLabels: { "cex-account": "CEX", "wallet-perp-dex": "Wallet DEX", "specialist-options-perps": "Options", "gmx-pool-route": "GMX" } },
  "zh-Hans": { chooser: "选择要核对的路线", selected: "已选路线", evidence: "下一步证据", costDictionary: "成本字段词典", routeLabels: { "cex-account": "CEX账户", "wallet-perp-dex": "钱包DEX", "specialist-options-perps": "期权", "gmx-pool-route": "GMX" } },
  "zh-Hant": { chooser: "選擇要核對的路線", selected: "已選路線", evidence: "下一步證據", costDictionary: "成本欄位詞典", routeLabels: { "cex-account": "CEX帳戶", "wallet-perp-dex": "錢包DEX", "specialist-options-perps": "期權", "gmx-pool-route": "GMX" } },
  ja: { chooser: "確認するルートを選択", selected: "選択中のルート", evidence: "次の確認材料", costDictionary: "コスト項目辞書", routeLabels: { "cex-account": "CEX口座", "wallet-perp-dex": "ウォレットDEX", "specialist-options-perps": "オプション", "gmx-pool-route": "GMX" } },
  ko: { chooser: "검토할 경로 선택", selected: "선택한 경로", evidence: "다음 확인 자료", costDictionary: "비용 항목 사전", routeLabels: { "cex-account": "CEX 계정", "wallet-perp-dex": "지갑 DEX", "specialist-options-perps": "옵션", "gmx-pool-route": "GMX" } },
  tr: { chooser: "İncelenecek rotayı seç", selected: "Seçili rota", evidence: "Sonraki kanıt", costDictionary: "Maliyet alanı sözlüğü", routeLabels: { "cex-account": "CEX hesabı", "wallet-perp-dex": "Cüzdan DEX", "specialist-options-perps": "Opsiyon", "gmx-pool-route": "GMX" } },
  ar: { chooser: "اختر المسار للمراجعة", selected: "المسار المحدد", evidence: "الدليل التالي", costDictionary: "قاموس حقول التكلفة", routeLabels: { "cex-account": "حساب CEX", "wallet-perp-dex": "DEX محفظة", "specialist-options-perps": "خيارات", "gmx-pool-route": "GMX" } },
  es: { chooser: "Elige ruta a revisar", selected: "Ruta seleccionada", evidence: "Siguiente evidencia", costDictionary: "Diccionario de costes", routeLabels: { "cex-account": "Cuenta CEX", "wallet-perp-dex": "DEX wallet", "specialist-options-perps": "Opciones", "gmx-pool-route": "GMX" } },
  "pt-BR": { chooser: "Escolha a rota para revisar", selected: "Rota selecionada", evidence: "Próxima evidência", costDictionary: "Dicionário de custos", routeLabels: { "cex-account": "Conta CEX", "wallet-perp-dex": "DEX carteira", "specialist-options-perps": "Opções", "gmx-pool-route": "GMX" } },
  fr: { chooser: "Choisir le parcours à vérifier", selected: "Parcours sélectionné", evidence: "Preuve suivante", costDictionary: "Dictionnaire des coûts", routeLabels: { "cex-account": "Compte CEX", "wallet-perp-dex": "DEX wallet", "specialist-options-perps": "Options", "gmx-pool-route": "GMX" } },
  de: { chooser: "Route zur Prüfung wählen", selected: "Gewählte Route", evidence: "Nächster Nachweis", costDictionary: "Kostenfeld-Lexikon", routeLabels: { "cex-account": "CEX-Konto", "wallet-perp-dex": "Wallet-DEX", "specialist-options-perps": "Optionen", "gmx-pool-route": "GMX" } },
  ru: { chooser: "Выберите маршрут для проверки", selected: "Выбранный маршрут", evidence: "Следующее подтверждение", costDictionary: "Словарь полей затрат", routeLabels: { "cex-account": "Аккаунт CEX", "wallet-perp-dex": "DEX-кошелёк", "specialist-options-perps": "Опционы", "gmx-pool-route": "GMX" } },
  id: { chooser: "Pilih rute untuk ditinjau", selected: "Rute terpilih", evidence: "Bukti berikutnya", costDictionary: "Kamus biaya", routeLabels: { "cex-account": "Akun CEX", "wallet-perp-dex": "DEX dompet", "specialist-options-perps": "Opsi", "gmx-pool-route": "GMX" } },
  vi: { chooser: "Chọn tuyến để kiểm tra", selected: "Tuyến đã chọn", evidence: "Bằng chứng tiếp theo", costDictionary: "Từ điển chi phí", routeLabels: { "cex-account": "Tài khoản CEX", "wallet-perp-dex": "DEX ví", "specialist-options-perps": "Quyền chọn", "gmx-pool-route": "GMX" } },
  it: { chooser: "Scegli il percorso da verificare", selected: "Percorso selezionato", evidence: "Prossima prova", costDictionary: "Dizionario dei costi", routeLabels: { "cex-account": "Conto CEX", "wallet-perp-dex": "DEX wallet", "specialist-options-perps": "Opzioni", "gmx-pool-route": "GMX" } },
};

function derivativesTaskUi(localeKey) {
  return DERIVATIVES_ROUTE_TASK_COPY[localeKey] || DERIVATIVES_ROUTE_TASK_COPY.en;
}

function derivativesRouteShortLabel(routeId, localeKey) {
  const copy = derivativesTaskUi(localeKey);
  return copy.routeLabels?.[routeId] || DERIVATIVES_ROUTE_TASK_COPY.en.routeLabels[routeId] || routeId;
}

function localizedTopicRows(rows, fallbackRows, locale, isZh, mapFallback) {
  if (rows) return rows.map(([first, second, third]) => third ? { icon: first, titleEn: second, descEn: third } : { titleEn: first, descEn: second });
  return fallbackRows.map(mapFallback(isZh));
}

// Shared topic template copy. The source dataset is English-first, so these
// labels keep the high-intent headings and status cells in the selected locale
// even when a topic-specific article has no translated editorial draft yet.
function topicStaticUi(locale) {
  return {
  ja: { category: "トピックガイド", updated: "最終更新", sourceTitle: "出典登録と確認状況", sourceLead: "プラットフォーム情報は公式ソースにリンクしています。特典、ランキング、現在の条件は項目ごとに確認が必要です。確認日", sourceBacked: "出典付きコンテキスト", pending: "出典確認待ち", painTitle: "トレーダーの課題と評価基準", painLead: "定量的な選別がないと、スリッページ、KYC保留、偽コントラクトによる損失が生じます。", securityTitle: "比較対象プラットフォームの定量比較", securityLead: "確認済みの板の厚み、実効手数料、利用条件を同じ基準で比較します。", action: "行動と特典", pitfallTitle: "実践的な安全ガイド", faqTitle: "トピックのよくある質問", faqLead: "曖昧なマーケティング表現を避け、取引判断に直結する回答を示します。", telegramTitle: "Telegramソース確認コマンド", telegramBody: "Telegramボットで手数料、活動、公式ソースの確認ルートを開きます。", telegramButton: "Telegramボットを起動", matrixTitle: "他のトピックを探す", matrixLead: "取引シナリオに合ったプラットフォーム比較を確認します。", calculate: "取引コストを計算", topicFaq: "トピックFAQ" },
  ko: { category: "주제 가이드", updated: "최종 업데이트", sourceTitle: "출처 등록 및 검토 상태", sourceLead: "플랫폼 정보는 공식 출처로 연결됩니다. 혜택, 순위와 현재 조건은 항목별 확인이 필요합니다. 검토일", sourceBacked: "출처 기반 정보", pending: "출처 확인 대기", painTitle: "트레이더 문제와 평가 기준", painLead: "정량적 선별이 없으면 슬리피지, KYC 보류와 가짜 컨트랙트로 손실이 생길 수 있습니다.", securityTitle: "벤치마크 플랫폼 정량 비교", securityLead: "확인된 호가 깊이, 실효 수수료와 접근 조건을 같은 기준으로 비교합니다.", action: "행동 및 혜택", pitfallTitle: "실전 보안 가이드", faqTitle: "주제 FAQ", faqLead: "모호한 마케팅 문구 대신 거래 결정에 필요한 답을 제시합니다.", telegramTitle: "Telegram 출처 확인 명령", telegramBody: "Telegram 봇에서 수수료, 활동과 공식 출처 확인 경로를 엽니다.", telegramButton: "Telegram 봇 실행", matrixTitle: "다른 주제 탐색", matrixLead: "거래 시나리오에 맞는 플랫폼 비교를 확인하세요.", calculate: "거래 비용 계산", topicFaq: "주제 FAQ" },
  tr: { category: "Konu rehberi", updated: "Son güncelleme", sourceTitle: "Kaynak kaydı ve inceleme durumu", sourceLead: "Platform bağlamı resmî kaynaklara bağlanır. Avantajlar, sıralamalar ve güncel koşullar madde bazında doğrulanmalıdır. İnceleme", sourceBacked: "Kaynağa dayalı bağlam", pending: "Kaynak doğrulaması bekliyor", painTitle: "Yatırımcı sorunları ve değerlendirme ölçütleri", painLead: "Nitelikli tarama olmadan kayma, KYC bekletmeleri ve sahte sözleşmeler gizli kayıplara yol açabilir.", securityTitle: "Karşılaştırılan platformların nicel görünümü", securityLead: "Doğrulanmış defter derinliği, net ücretler ve erişim koşullarını aynı ölçütle karşılaştırırız.", action: "Eylem ve avantaj", pitfallTitle: "Uygulamalı güvenlik rehberi", faqTitle: "Konu SSS", faqLead: "Belirsiz pazarlama ifadeleri yerine işlem kararını destekleyen yanıtlar sunarız.", telegramTitle: "Telegram kaynak doğrulama komutları", telegramBody: "Telegram botuyla ücret, aktivite ve resmî kaynak inceleme yollarını açın.", telegramButton: "Telegram botunu başlat", matrixTitle: "Diğer konuları keşfedin", matrixLead: "İşlem senaryonuza uygun platform karşılaştırmalarına bakın.", calculate: "İşlem maliyetini hesapla", topicFaq: "Konu SSS" },
  es: { category: "Guía temática", updated: "Última actualización", sourceTitle: "Fuentes y estado de revisión", sourceLead: "El contexto de cada plataforma enlaza a fuentes oficiales. Los beneficios, rankings y condiciones actuales se verifican por elemento. Revisado", sourceBacked: "Contexto con fuentes", pending: "Pendiente de revisión de la fuente", painTitle: "Problemas del trader y criterios de evaluación", painLead: "Sin un filtro cuantitativo pueden aparecer pérdidas ocultas por deslizamiento, bloqueos de KYC y contratos falsos.", securityTitle: "Comparación cuantitativa de plataformas", securityLead: "Comparamos profundidad, comisiones efectivas y condiciones de acceso con el mismo criterio.", action: "Acción y beneficios", pitfallTitle: "Guía práctica de seguridad", faqTitle: "Preguntas frecuentes del tema", faqLead: "Respuestas claras para apoyar decisiones de trading sin frases de marketing ambiguas.", telegramTitle: "Comandos de revisión en Telegram", telegramBody: "Abre rutas para revisar comisiones, actividad y fuentes oficiales con el bot.", telegramButton: "Activar bot de Telegram", matrixTitle: "Explorar otros temas", matrixLead: "Consulta comparativas adaptadas a tu escenario de trading.", calculate: "Calcular costes de trading", topicFaq: "Preguntas del tema" },
  "pt-BR": { category: "Guia temático", updated: "Última atualização", sourceTitle: "Fontes e status da revisão", sourceLead: "O contexto de cada plataforma aponta para fontes oficiais. Benefícios, rankings e condições atuais exigem verificação por item. Revisado", sourceBacked: "Contexto com fonte", pending: "Aguardando revisão da fonte", painTitle: "Problemas do trader e critérios de avaliação", painLead: "Sem triagem quantitativa, slippage, bloqueios de KYC e contratos falsos podem causar perdas ocultas.", securityTitle: "Comparação quantitativa de plataformas", securityLead: "Comparamos profundidade, taxas efetivas e condições de acesso pelo mesmo critério.", action: "Ação e benefícios", pitfallTitle: "Guia prático de segurança", faqTitle: "FAQ do tema", faqLead: "Respostas claras para apoiar decisões de trading sem marketing ambíguo.", telegramTitle: "Comandos de revisão no Telegram", telegramBody: "Abra caminhos para taxas, atividades e fontes oficiais com o bot.", telegramButton: "Ativar bot do Telegram", matrixTitle: "Explorar outros temas", matrixLead: "Veja comparações alinhadas ao seu cenário de trading.", calculate: "Calcular custos de trading", topicFaq: "Perguntas do tema" },
  fr: { category: "Guide thématique", updated: "Dernière mise à jour", sourceTitle: "Sources et statut de vérification", sourceLead: "Le contexte de chaque plateforme renvoie aux sources officielles. Avantages, classements et conditions actuelles sont vérifiés élément par élément. Vérifié", sourceBacked: "Contexte sourcé", pending: "Vérification de la source en attente", painTitle: "Problèmes des traders et critères d’évaluation", painLead: "Sans sélection quantitative, le slippage, les blocages KYC et les faux contrats peuvent créer des pertes cachées.", securityTitle: "Comparaison quantitative des plateformes", securityLead: "Nous comparons profondeur, frais effectifs et conditions d’accès selon le même référentiel.", action: "Action et avantages", pitfallTitle: "Guide pratique de sécurité", faqTitle: "FAQ du sujet", faqLead: "Des réponses claires pour décider sans slogans marketing ambigus.", telegramTitle: "Commandes de vérification Telegram", telegramBody: "Ouvrez avec le bot les chemins de vérification des frais, activités et sources officielles.", telegramButton: "Activer le bot Telegram", matrixTitle: "Explorer d’autres sujets", matrixLead: "Consultez des comparaisons adaptées à votre scénario de trading.", calculate: "Calculer les coûts de trading", topicFaq: "Questions du sujet" },
  de: { category: "Themenleitfaden", updated: "Zuletzt aktualisiert", sourceTitle: "Quellen und Prüfstatus", sourceLead: "Der Plattformkontext verweist auf offizielle Quellen. Vorteile, Ranglisten und aktuelle Bedingungen werden einzeln geprüft. Geprüft", sourceBacked: "Quellenbasierter Kontext", pending: "Quellenprüfung ausstehend", painTitle: "Trader-Probleme und Bewertungskriterien", painLead: "Ohne quantitative Auswahl können Slippage, KYC-Sperren und falsche Verträge versteckte Verluste verursachen.", securityTitle: "Quantitativer Plattformvergleich", securityLead: "Wir vergleichen Tiefe, effektive Gebühren und Zugangsbedingungen nach demselben Maßstab.", action: "Aktion und Vorteile", pitfallTitle: "Praktischer Sicherheitsleitfaden", faqTitle: "Themen-FAQ", faqLead: "Klare Antworten für Handelsentscheidungen ohne unklare Marketingaussagen.", telegramTitle: "Telegram-Befehle zur Quellenprüfung", telegramBody: "Öffnen Sie mit dem Bot Prüfpfade für Gebühren, Aktivitäten und offizielle Quellen.", telegramButton: "Telegram-Bot aktivieren", matrixTitle: "Weitere Themen entdecken", matrixLead: "Sehen Sie Vergleiche für Ihr konkretes Handelsszenario.", calculate: "Handelskosten berechnen", topicFaq: "Themenfragen" },
  ru: { category: "Тематический справочник", updated: "Последнее обновление", sourceTitle: "Источники и статус проверки", sourceLead: "Контекст платформы связан с официальными источниками. Преимущества, рейтинги и текущие условия проверяются отдельно. Проверено", sourceBacked: "Контекст с источниками", pending: "Ожидает проверки источника", painTitle: "Проблемы трейдеров и критерии оценки", painLead: "Без количественного отбора проскальзывание, блокировки KYC и поддельные контракты создают скрытые потери.", securityTitle: "Количественное сравнение платформ", securityLead: "Сравниваем глубину, эффективные комиссии и условия доступа по единому критерию.", action: "Действие и преимущества", pitfallTitle: "Практическое руководство по безопасности", faqTitle: "FAQ по теме", faqLead: "Чёткие ответы для торговых решений без неоднозначного маркетинга.", telegramTitle: "Команды проверки источников в Telegram", telegramBody: "Откройте через бота пути проверки комиссий, активностей и официальных источников.", telegramButton: "Запустить Telegram-бота", matrixTitle: "Другие темы", matrixLead: "Изучите сравнения для вашего торгового сценария.", calculate: "Рассчитать торговые расходы", topicFaq: "Вопросы темы" },
  ar: { category: "دليل الموضوعات", updated: "آخر تحديث", sourceTitle: "المصادر وحالة المراجعة", sourceLead: "يرتبط سياق المنصة بالمصادر الرسمية. يجب التحقق من المزايا والتصنيفات والشروط الحالية لكل عنصر. تمت المراجعة", sourceBacked: "سياق موثق", pending: "بانتظار مراجعة المصدر", painTitle: "مشكلات المتداول ومعايير التقييم", painLead: "من دون فرز كمي قد يسبب الانزلاق وحظر KYC والعقود المزيفة خسائر خفية.", securityTitle: "مقارنة كمية للمنصات", securityLead: "نقارن العمق والرسوم الفعلية وشروط الوصول بالمعيار نفسه.", action: "الإجراء والمزايا", pitfallTitle: "دليل أمان عملي", faqTitle: "الأسئلة الشائعة للموضوع", faqLead: "إجابات واضحة لدعم قرار التداول بعيداً عن التسويق الملتبس.", telegramTitle: "أوامر مراجعة المصادر عبر Telegram", telegramBody: "افتح مسارات مراجعة الرسوم والأنشطة والمصادر الرسمية عبر الروبوت.", telegramButton: "تشغيل روبوت Telegram", matrixTitle: "استكشف موضوعات أخرى", matrixLead: "اطلع على مقارنات تناسب سيناريو التداول الخاص بك.", calculate: "احسب تكاليف التداول", topicFaq: "أسئلة الموضوع" },
  id: { category: "Panduan topik", updated: "Pembaruan terakhir", sourceTitle: "Sumber dan status tinjauan", sourceLead: "Konteks platform terhubung ke sumber resmi. Manfaat, peringkat, dan kondisi saat ini diverifikasi per item. Ditinjau", sourceBacked: "Konteks berbasis sumber", pending: "Menunggu tinjauan sumber", painTitle: "Masalah trader dan kriteria evaluasi", painLead: "Tanpa penyaringan kuantitatif, slippage, penahanan KYC, dan kontrak palsu dapat menimbulkan kerugian tersembunyi.", securityTitle: "Perbandingan kuantitatif platform", securityLead: "Kami membandingkan kedalaman, biaya efektif, dan ketentuan akses dengan kriteria yang sama.", action: "Tindakan dan manfaat", pitfallTitle: "Panduan keamanan praktis", faqTitle: "FAQ topik", faqLead: "Jawaban jelas untuk keputusan trading tanpa bahasa pemasaran yang ambigu.", telegramTitle: "Perintah tinjauan sumber Telegram", telegramBody: "Buka jalur tinjauan biaya, aktivitas, dan sumber resmi lewat bot.", telegramButton: "Aktifkan bot Telegram", matrixTitle: "Jelajahi topik lain", matrixLead: "Lihat perbandingan yang sesuai dengan skenario trading Anda.", calculate: "Hitung biaya trading", topicFaq: "Pertanyaan topik" },
  vi: { category: "Hướng dẫn chủ đề", updated: "Cập nhật lần cuối", sourceTitle: "Nguồn và trạng thái rà soát", sourceLead: "Thông tin nền tảng liên kết với nguồn chính thức. Ưu đãi, xếp hạng và điều kiện hiện tại cần được kiểm tra từng mục. Đã rà soát", sourceBacked: "Thông tin có nguồn", pending: "Đang chờ rà soát nguồn", painTitle: "Vấn đề của trader và tiêu chí đánh giá", painLead: "Nếu không sàng lọc định lượng, trượt giá, treo KYC và hợp đồng giả có thể gây thiệt hại ẩn.", securityTitle: "So sánh định lượng các nền tảng", securityLead: "So sánh độ sâu, phí thực và điều kiện truy cập theo cùng một tiêu chí.", action: "Hành động và ưu đãi", pitfallTitle: "Hướng dẫn an toàn thực tế", faqTitle: "FAQ chủ đề", faqLead: "Câu trả lời rõ ràng để hỗ trợ quyết định giao dịch, tránh thông điệp tiếp thị mơ hồ.", telegramTitle: "Lệnh rà soát nguồn trên Telegram", telegramBody: "Mở đường dẫn rà soát phí, hoạt động và nguồn chính thức bằng bot.", telegramButton: "Bật bot Telegram", matrixTitle: "Khám phá chủ đề khác", matrixLead: "Xem so sánh phù hợp với kịch bản giao dịch của bạn.", calculate: "Tính chi phí giao dịch", topicFaq: "Câu hỏi chủ đề" },
  it: { category: "Guida tematica", updated: "Ultimo aggiornamento", sourceTitle: "Fonti e stato della revisione", sourceLead: "Il contesto della piattaforma rimanda a fonti ufficiali. Vantaggi, classifiche e condizioni attuali richiedono una verifica per elemento. Verificato", sourceBacked: "Contesto con fonti", pending: "Verifica della fonte in sospeso", painTitle: "Problemi dei trader e criteri di valutazione", painLead: "Senza selezione quantitativa, slippage, blocchi KYC e contratti falsi possono causare perdite nascoste.", securityTitle: "Confronto quantitativo delle piattaforme", securityLead: "Confrontiamo profondità, costi effettivi e condizioni di accesso con lo stesso criterio.", action: "Azione e vantaggi", pitfallTitle: "Guida pratica alla sicurezza", faqTitle: "FAQ sul tema", faqLead: "Risposte chiare per decidere senza messaggi di marketing ambigui.", telegramTitle: "Comandi di verifica fonti su Telegram", telegramBody: "Apri con il bot i percorsi per verificare commissioni, attività e fonti ufficiali.", telegramButton: "Attiva bot Telegram", matrixTitle: "Esplora altri temi", matrixLead: "Consulta confronti adatti al tuo scenario di trading.", calculate: "Calcola i costi di trading", topicFaq: "Domande sul tema" },
  }[String(locale || "").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "").split("-")[0]] || {};
}

function localizedPitfallLead(locale) {
  const language = String(locale || "").toLowerCase() === "pt-br"
    ? "pt-BR"
    : String(locale || "").split("-")[0];
  return {
    ja: "実務で得た運用上の教訓を整理し、取引資金を守るための確認事項を示します。",
    ko: "실전에서 얻은 운영 교훈을 정리해 거래 자금을 지키기 위한 확인 항목을 제시합니다.",
    tr: "Gerçek kullanım deneyimlerinden çıkarılan operasyonel derslerle işlem sermayesini korumaya yönelik kontrolleri özetler.",
    es: "Resume lecciones operativas reales y controles prácticos para proteger el capital de trading.",
    "pt-BR": "Resume lições operacionais reais e verificações práticas para proteger o capital de trading.",
    fr: "Résume les leçons opérationnelles tirées de cas réels et les contrôles pratiques pour protéger le capital de trading.",
    de: "Fasst praktische Betriebserfahrungen und Prüfungen zum Schutz des Handelskapitals zusammen.",
    ru: "Собирает практические операционные уроки и проверки для защиты торгового капитала.",
    ar: "يلخص دروساً تشغيلية عملية ونقاط تحقق تساعد على حماية رأس مال التداول.",
    id: "Merangkum pelajaran operasional nyata dan pemeriksaan praktis untuk melindungi modal trading.",
    vi: "Tóm tắt các bài học vận hành thực tế và bước kiểm tra để bảo vệ vốn giao dịch.",
    it: "Riassume lezioni operative reali e controlli pratici per proteggere il capitale di trading.",
  }[language] || "Hard-learned operational lessons and practical checks for protecting trading capital.";
}

function topicRouteCopy(locale, slug) {
  const language = String(locale || "").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "").split("-")[0];
  const shared = {
    ja: { calculateCosts: "取引コストを計算" },
    ko: { calculateCosts: "거래 비용 계산" },
    tr: { calculateCosts: "İşlem maliyetini hesapla" },
    es: { calculateCosts: "Calcular costes de trading" },
    "pt-BR": { calculateCosts: "Calcular custos de trading" },
    fr: { calculateCosts: "Calculer les coûts de trading" },
    de: { calculateCosts: "Handelskosten berechnen" },
    ru: { calculateCosts: "Рассчитать торговые расходы" },
    ar: { calculateCosts: "حساب تكاليف التداول" },
    id: { calculateCosts: "Hitung biaya trading" },
    vi: { calculateCosts: "Tính chi phí giao dịch" },
    it: { calculateCosts: "Calcola i costi di trading" },
  }[language] || {};
  const noKyc = {
    en: {
      label: "No-KYC decision paths",
      title: "Decide whether the route is wallet access, CEX account access or perp platform risk",
      body: "No-KYC is not one single promise. First separate wallet-connected protocols from centralized account flows, then use Hyperliquid vs dYdX for perpetual mechanics and open each venue profile for withdrawal, region and source checks.",
    },
    ko: {
      label: "No-KYC 관련 리서치",
      title: "지갑 연결형 프로토콜, CEX 계정, 무기한 계약 비교를 먼저 나누세요",
      body: "No-KYC 조건은 지역, 상품, 출금, 계정 단계에 따라 달라집니다. 먼저 Hyperliquid와 dYdX를 비교하고, 각 플랫폼 프로필과 MEXC 계정 조건을 따로 확인하세요.",
    },
    tr: {
      label: "No-KYC ilgili araştırma",
      title: "Önce cüzdan erişimi, CEX hesabı ve perp karşılaştırmasını ayırın",
      body: "No-KYC koşulları bölge, ürün, çekim ve hesap aşamasına göre değişebilir. Önce Hyperliquid ile dYdX'i karşılaştırın, sonra her platform profilini ve MEXC hesap koşullarını ayrı kontrol edin.",
    },
  }[language];
  return slug === "no-kyc" ? { ...shared, noKyc } : shared;
}

function TopicDisclosure({ title, children, className = "", desktopDefaultOpen = true }) {
  // Keep the SSR and first client render collapsed. The full body remains in
  // HTML for search and accessibility, while desktop hydration can reopen it.
  const detailsRef = useRef(null);
  const initializedRef = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Adopt a summary opened before hydration. Viewport defaults apply once;
    // later breakpoint changes must not overwrite the reader's own choice.
    if (initializedRef.current) return;
    initializedRef.current = true;
    const viewportWidth = window.visualViewport?.width || document.documentElement?.clientWidth || window.innerWidth;
    const initialOpen = Boolean(detailsRef.current?.open) || (desktopDefaultOpen && viewportWidth > 640);
    setOpen(initialOpen);
  }, []);

  return (
    <details ref={detailsRef} className={`topic-disclosure ${className}`.trim()} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{title}<span aria-hidden="true">{open ? "−" : "+"}</span></summary>
      <div className="topic-disclosure__body">{children}</div>
    </details>
  );
}

export function TopicGuidePage({ slug = "meme-coins", locale = "en", market, product, venues = [] }) {
  const localeKey = topicLocaleKey(locale);
  const isHant = localeKey === "zh-Hant";
  const isHans = localeKey === "zh-Hans";
  const isZh = isHans || isHant;
  const staticUi = topicStaticUi(locale);
  const topicCta = {
    ja: "完全なベンチマークを読む →", ko: "전체 벤치마크 보기 →", tr: "Tam karşılaştırmayı oku →",
    es: "Leer el benchmark completo →", "pt-BR": "Ler o benchmark completo →", fr: "Lire le benchmark complet →",
    de: "Vollständigen Benchmark lesen →", ru: "Открыть полный обзор →", ar: "اقرأ المقارنة الكاملة ←",
    id: "Baca benchmark lengkap →", vi: "Đọc benchmark đầy đủ →", it: "Leggi il benchmark completo →",
  }[String(locale || "").split("-")[0] === "pt" ? "pt-BR" : String(locale || "").split("-")[0]] || "Read Full Benchmark →";
  const telegramTopicCta = {
    ja: "Telegramボットを起動",
    ko: "Telegram 봇 열기",
    tr: "Telegram botunu aç",
    es: "Abrir bot de Telegram",
    "pt-BR": "Abrir bot do Telegram",
    fr: "Ouvrir le bot Telegram",
    de: "Telegram-Bot öffnen",
    ru: "Открыть Telegram-бота",
    ar: "فتح بوت Telegram",
    id: "Buka bot Telegram",
    vi: "Mở bot Telegram",
    it: "Apri il bot Telegram",
  }[locale === "pt-BR" ? "pt-BR" : String(locale || "").split("-")[0]] || "Launch Telegram Bot";
  const topicUi = {
    ja: { nav: "トピックガイド", updated: "最終更新", pending: "確認待ち", verifyBenefits: "ユーザー向け条件は公式出典の確認が必要です", verifyExecution: "実行条件は公式出典の確認が必要です", decision: "サービスのプロフィールを確認してから登録", start: "ここから開始", decisionBody: "公式ドメイン、地域条件、商品範囲、出典日を確認してください。", sourceOpen: "出典登録と確認状況を開く", painOpen: "トレーダーの課題と評価軸", securityOpen: "安全確認ガイド", faqOpen: "トピックFAQ", moreOpen: "他のトピックを見る" },
    ko: { nav: "주제 가이드", updated: "최종 업데이트", pending: "확인 대기", verifyBenefits: "사용자 혜택은 공식 출처 확인이 필요합니다", verifyExecution: "실행 조건은 공식 출처 확인이 필요합니다", decision: "가입 전 플랫폼 프로필 확인", start: "여기서 시작", decisionBody: "공식 도메인, 지역 자격, 상품 범위와 출처 날짜를 확인하세요.", sourceOpen: "출처 등록 및 검토 상태 열기", painOpen: "트레이더의 문제와 평가 기준", securityOpen: "보안 확인 가이드", faqOpen: "주제 FAQ", moreOpen: "다른 주제 보기" },
    tr: { nav: "Konu rehberi", updated: "Son güncelleme", pending: "Beklemede", verifyBenefits: "Kullanıcı koşulları resmi kaynak doğrulaması gerektirir", verifyExecution: "İşlem koşulları resmi kaynak doğrulaması gerektirir", decision: "Kayıttan önce platform profilini inceleyin", start: "BURADAN BAŞLAYIN", decisionBody: "Resmi alan adını, bölgesel uygunluğu, ürün kapsamını ve kaynak tarihini kontrol edin.", sourceOpen: "Kaynak kaydı ve inceleme durumunu aç", painOpen: "Yatırımcı sorunları ve değerlendirme ölçütleri", securityOpen: "Güvenlik kontrol rehberi", faqOpen: "Konu SSS", moreOpen: "Diğer konuları keşfedin" },
  }[locale] || ({
    fr: { nav:"Guide thématique", updated:"Dernière mise à jour", pending:"Vérification en attente", verifyBenefits:"Les conditions utilisateur doivent être vérifiées auprès de la source officielle", verifyExecution:"Les conditions d’exécution doivent être vérifiées auprès de la source officielle", decision:"Consultez le profil avant l’inscription", start:"COMMENCER", decisionBody:"Vérifiez le domaine officiel, l’éligibilité régionale, les produits et la date de la source.", sourceOpen:"Ouvrir les sources et le statut de vérification" },
    de: { nav:"Themenleitfaden", updated:"Zuletzt aktualisiert", pending:"Prüfung ausstehend", verifyBenefits:"Nutzerbedingungen müssen anhand offizieller Quellen geprüft werden", verifyExecution:"Ausführungsbedingungen müssen anhand offizieller Quellen geprüft werden", decision:"Profil vor der Registrierung prüfen", start:"HIER STARTEN", decisionBody:"Offizielle Domain, regionale Eignung, Produkte und Quellenstand prüfen.", sourceOpen:"Quellen und Prüfstatus öffnen" },
    ru: { nav:"Тематический справочник", updated:"Последнее обновление", pending:"Ожидает проверки", verifyBenefits:"Условия для пользователей нужно проверить по официальному источнику", verifyExecution:"Условия исполнения нужно проверить по официальному источнику", decision:"Проверьте профиль перед регистрацией", start:"НАЧАТЬ", decisionBody:"Проверьте официальный домен, регион, продукты и дату источника.", sourceOpen:"Открыть источники и статус проверки" },
    ar: { nav:"دليل الموضوعات", updated:"آخر تحديث", pending:"بانتظار التحقق", verifyBenefits:"يجب التحقق من شروط المستخدم من المصدر الرسمي", verifyExecution:"يجب التحقق من شروط التنفيذ من المصدر الرسمي", decision:"راجع الملف قبل التسجيل", start:"ابدأ من هنا", decisionBody:"تحقق من النطاق الرسمي والأهلية الإقليمية والمنتجات وتاريخ المصدر.", sourceOpen:"فتح المصادر وحالة المراجعة" },
    id: { nav:"Panduan topik", updated:"Pembaruan terakhir", pending:"Menunggu verifikasi", verifyBenefits:"Ketentuan pengguna harus diverifikasi dari sumber resmi", verifyExecution:"Ketentuan eksekusi harus diverifikasi dari sumber resmi", decision:"Tinjau profil sebelum mendaftar", start:"MULAI DI SINI", decisionBody:"Periksa domain resmi, kelayakan wilayah, produk, dan tanggal sumber.", sourceOpen:"Buka sumber dan status tinjauan" },
    vi: { nav:"Hướng dẫn chủ đề", updated:"Cập nhật lần cuối", pending:"Đang chờ xác minh", verifyBenefits:"Điều kiện người dùng cần được xác minh từ nguồn chính thức", verifyExecution:"Điều kiện thực thi cần được xác minh từ nguồn chính thức", decision:"Xem hồ sơ trước khi đăng ký", start:"BẮT ĐẦU TẠI ĐÂY", decisionBody:"Kiểm tra tên miền chính thức, khu vực, sản phẩm và ngày nguồn.", sourceOpen:"Mở nguồn và trạng thái rà soát" },
    it: { nav:"Guida tematica", updated:"Ultimo aggiornamento", pending:"Verifica in sospeso", verifyBenefits:"Le condizioni utente richiedono verifica su fonte ufficiale", verifyExecution:"Le condizioni di esecuzione richiedono verifica su fonte ufficiale", decision:"Controlla il profilo prima di registrarti", start:"INIZIA QUI", decisionBody:"Verifica dominio ufficiale, idoneità regionale, prodotti e data della fonte.", sourceOpen:"Apri fonti e stato della revisione" }
  }[String(locale || "").split("-")[0]] || ({ ja: { nav: "トピックガイド", updated: "最終更新", pending: "確認待ち", verifyBenefits: "ユーザー向け条件は公式出典の確認が必要です", verifyExecution: "実行条件は公式出典の確認が必要です", decision: "サービスのプロフィールを確認してから登録", start: "ここから開始", decisionBody: "公式ドメイン、地域条件、商品範囲、出典日を確認してください。", sourceOpen: "出典登録と確認状況を開く" }, ko: { nav: "주제 가이드", updated: "최종 업데이트", pending: "확인 대기", verifyBenefits: "사용자 혜택은 공식 출처 확인이 필요합니다", verifyExecution: "실행 조건은 공식 출처 확인이 필요합니다", decision: "가입 전 플랫폼 프로필 확인", start: "여기서 시작", decisionBody: "공식 도메인, 지역 자격, 상품 범위와 출처 날짜를 확인하세요.", sourceOpen: "출처 등록 및 검토 상태 열기" }, tr: { nav: "Konu rehberi", updated: "Son güncelleme", pending: "Beklemede", verifyBenefits: "Kullanıcı koşulları resmi kaynak doğrulaması gerektirir", verifyExecution: "İşlem koşulları resmi kaynak doğrulaması gerektirir", decision: "Kayıttan önce platform profilini inceleyin", start: "BURADAN BAŞLAYIN", decisionBody: "Resmi alan adını, bölgesel uygunluğu, ürün kapsamını ve kaynak tarihini kontrol edin.", sourceOpen: "Kaynak kaydı ve inceleme durumunu aç" } }[String(locale || "").split("-")[0]] || null));
  const topicUiResolved = { ...(topicUi || {}) };
  const sectionLabels = {
    ar: ["فتح سجل المصادر وحالة المراجعة", "مشكلات المتداولين ومعايير التقييم", "دليل التحقق من الأمان", "الأسئلة الشائعة حول الموضوع", "استكشف موضوعات أخرى"],
    "pt-BR": ["Abrir fontes e status da revisão", "Dores dos traders e critérios de avaliação", "Guia de segurança", "Perguntas frequentes do tema", "Explore outros temas"],
    es: ["Abrir fuentes y estado de revisión", "Problemas de los traders y criterios de evaluación", "Guía de seguridad", "Preguntas frecuentes del tema", "Explorar otros temas"],
    fr: ["Ouvrir les sources et le statut de vérification", "Problèmes des traders et critères d’évaluation", "Guide de sécurité", "FAQ du sujet", "Découvrir d’autres sujets"],
    de: ["Quellen und Prüfstatus öffnen", "Probleme von Tradern und Bewertungskriterien", "Sicherheitsleitfaden", "Themen-FAQ", "Weitere Themen entdecken"],
    ru: ["Открыть источники и статус проверки", "Проблемы трейдеров и критерии оценки", "Руководство по безопасности", "FAQ по теме", "Другие темы"],
    id: ["Buka sumber dan status tinjauan", "Masalah trader dan kriteria evaluasi", "Panduan keamanan", "FAQ topik", "Jelajahi topik lain"],
    vi: ["Mở nguồn và trạng thái rà soát", "Vấn đề trader và tiêu chí đánh giá", "Hướng dẫn an toàn", "FAQ chủ đề", "Khám phá chủ đề khác"],
    it: ["Apri fonti e stato della revisione", "Problemi dei trader e criteri di valutazione", "Guida alla sicurezza", "FAQ sul tema", "Scopri altri temi"]
  }[locale];
  if (sectionLabels) { ["sourceOpen", "painOpen", "securityOpen", "faqOpen", "moreOpen"].forEach((key, index) => { if (!topicUiResolved[key]) topicUiResolved[key] = sectionLabels[index]; }); }
  const pendingLabels = { ar: "بانتظار التحقق", "pt-BR": "Aguardando verificação", es: "Pendiente de verificación", fr: "Vérification en attente", de: "Prüfung ausstehend", ru: "Ожидает проверки", id: "Menunggu verifikasi", vi: "Đang chờ xác minh", it: "Verifica in sospeso" };
  if (pendingLabels[locale]) topicUiResolved.pending = pendingLabels[locale];
  const tableLabels = {
    ja: { platformType: "プラットフォーム / 種別", scoreLabel: "評価状態", speedDepth: "時期 / 流動性", baseRates: "公式基準手数料", netFee: "確認後の実効手数料", slippageKyc: "スリッページとKYC", researchAction: "確認アクション", researchContext: "調査コンテキスト", verifyAnnouncements: "公式発表を確認", officialSchedule: "公式スケジュールを確認", officialFeeTerms: "公式手数料条件を確認", verifyMarket: "現在の市場条件を確認", regionalKyc: "地域とKYC条件を確認" },
    ko: { researchContext: "연구 맥락", verifyAnnouncements: "공식 발표 확인", officialSchedule: "공식 일정 확인", officialFeeTerms: "공식 수수료 조건 확인", verifyMarket: "현재 시장 조건 확인", regionalKyc: "지역 및 KYC 조건 확인" },
    tr: { researchContext: "Araştırma bağlamı", verifyAnnouncements: "Resmî duyuruları doğrulayın", officialSchedule: "Resmî takvimi doğrulayın", officialFeeTerms: "Resmî ücret koşullarını doğrulayın", verifyMarket: "Güncel piyasa koşullarını doğrulayın", regionalKyc: "Bölgesel ve KYC koşullarını doğrulayın" },
    id: { researchContext: "Konteks penelitian", verifyAnnouncements: "Periksa pengumuman resmi", officialSchedule: "Periksa jadwal resmi", officialFeeTerms: "Periksa ketentuan biaya resmi", verifyMarket: "Periksa kondisi pasar saat ini", regionalKyc: "Periksa ketentuan wilayah dan KYC" },
    vi: { researchContext: "Bối cảnh nghiên cứu", verifyAnnouncements: "Kiểm tra thông báo chính thức", officialSchedule: "Kiểm tra lịch chính thức", officialFeeTerms: "Kiểm tra điều khoản phí chính thức", verifyMarket: "Kiểm tra điều kiện thị trường hiện tại", regionalKyc: "Kiểm tra điều kiện khu vực và KYC" },
    it: { researchContext: "Contesto della ricerca", verifyAnnouncements: "Verifica gli annunci ufficiali", officialSchedule: "Verifica il programma ufficiale", officialFeeTerms: "Verifica le condizioni ufficiali delle commissioni", verifyMarket: "Verifica le condizioni attuali del mercato", regionalKyc: "Verifica le condizioni regionali e KYC" },
    ar: { researchContext: "سياق بحثي", verifyAnnouncements: "تحقق من الإعلانات الرسمية", officialSchedule: "تحقق من الجدول الرسمي", officialFeeTerms: "تحقق من شروط الرسوم الرسمية", verifyMarket: "تحقق من حالة السوق الحالية", regionalKyc: "تحقق من شروط المنطقة وKYC" },
    "pt-BR": { researchContext: "Contexto de pesquisa", verifyAnnouncements: "Verifique os anúncios oficiais", officialSchedule: "Verifique a tabela oficial", officialFeeTerms: "Verifique os termos oficiais", verifyMarket: "Verifique as condições atuais do mercado", regionalKyc: "Verifique os termos regionais e KYC" },
    es: { researchContext: "Contexto de investigación", verifyAnnouncements: "Verifica los anuncios oficiales", officialSchedule: "Verifica el cuadro oficial", officialFeeTerms: "Verifica las condiciones oficiales", verifyMarket: "Verifica las condiciones actuales del mercado", regionalKyc: "Verifica las condiciones regionales y KYC" },
    fr: { researchContext: "Contexte de recherche", verifyAnnouncements: "Vérifier les annonces officielles", officialSchedule: "Vérifier le barème officiel", officialFeeTerms: "Vérifier les conditions officielles", verifyMarket: "Vérifier les conditions actuelles du marché", regionalKyc: "Vérifier les conditions régionales et KYC" },
    de: { researchContext: "Recherchekontext", verifyAnnouncements: "Offizielle Ankündigungen prüfen", officialSchedule: "Offizielle Tabelle prüfen", officialFeeTerms: "Offizielle Bedingungen prüfen", verifyMarket: "Aktuelle Marktbedingungen prüfen", regionalKyc: "Regionale und KYC-Bedingungen prüfen" },
    ru: { researchContext: "Контекст исследования", verifyAnnouncements: "Проверьте официальные объявления", officialSchedule: "Проверьте официальную таблицу", officialFeeTerms: "Проверьте официальные условия", verifyMarket: "Проверьте текущие условия рынка", regionalKyc: "Проверьте региональные условия и KYC" }
  }[locale];
  if (tableLabels) Object.assign(topicUiResolved, tableLabels);
  const verificationLabels = {
    ja: { verifyBenefits: "ユーザー向け条件は公式出典の確認が必要です", verifyExecution: "実行条件は公式出典の確認が必要です" },
    ko: { verifyBenefits: "사용자 혜택은 공식 출처 확인이 필요합니다", verifyExecution: "실행 조건은 공식 출처 확인이 필요합니다" },
    tr: { verifyBenefits: "Kullanıcı koşulları resmi kaynak doğrulaması gerektirir", verifyExecution: "İşlem koşulları resmi kaynak doğrulaması gerektirir" },
    "pt-BR": { start: "COMECE AQUI", decision: "Confira o perfil da plataforma antes de abrir uma conta", decisionBody: "Confira o domínio oficial, a elegibilidade regional, os produtos e as datas das fontes antes de prosseguir.", verifyBenefits: "As condições para o usuário exigem verificação na fonte oficial", verifyExecution: "As condições de execução exigem verificação na fonte oficial" },
    es: { start: "EMPIEZA AQUÍ", decision: "Revisa el perfil de la plataforma antes de abrir una cuenta", decisionBody: "Revisa el dominio oficial, la elegibilidad regional, los productos y las fechas de las fuentes antes de continuar.", verifyBenefits: "Las condiciones para el usuario requieren verificar la fuente oficial", verifyExecution: "Las condiciones de ejecución requieren verificar la fuente oficial" },
    fr: { verifyBenefits: "Les conditions utilisateur doivent être vérifiées auprès de la source officielle", verifyExecution: "Les conditions d’exécution doivent être vérifiées auprès de la source officielle" },
    de: { verifyBenefits: "Nutzerbedingungen müssen anhand offizieller Quellen geprüft werden", verifyExecution: "Ausführungsbedingungen müssen anhand offizieller Quellen geprüft werden" },
    ru: { verifyBenefits: "Условия для пользователей нужно проверить по официальному источнику", verifyExecution: "Условия исполнения нужно проверить по официальному источнику" },
    ar: { verifyBenefits: "يجب التحقق من شروط المستخدم من المصدر الرسمي", verifyExecution: "يجب التحقق من شروط التنفيذ من المصدر الرسمي" },
    id: { verifyBenefits: "Ketentuan pengguna harus diverifikasi dari sumber resmi", verifyExecution: "Ketentuan eksekusi harus diverifikasi dari sumber resmi" },
    vi: { verifyBenefits: "Điều kiện người dùng cần được xác minh từ nguồn chính thức", verifyExecution: "Điều kiện thực thi cần được xác minh từ nguồn chính thức" },
    it: { verifyBenefits: "Le condizioni utente richiedono verifica su fonte ufficiale", verifyExecution: "Le condizioni di esecuzione richiedono verifica su fonte ufficiale" },
  }[locale];
  if (verificationLabels) Object.assign(topicUiResolved, verificationLabels);
  if (!topicUiResolved.updated) topicUiResolved.updated = staticUi.updated || (isZh ? zhCopy(isHant, "最后更新", "最後更新") : "Last Updated");
  const topic = sanitizeTopicValue(TOPIC_GUIDES[slug] || TOPIC_GUIDES["meme-coins"]);
  const topicNativeCopy = topicNativeContentCopy(topic.slug, locale);
  const topicCopy = !isZh ? topicLocaleCopy(topic.slug, locale) : null;
  const routeCopy = topicRouteCopy(locale, topic.slug);
  const isTraditionalZh = isHant;
  const derivativesDecisionRoutes = Array.isArray(topic.decisionRoutes) ? topic.decisionRoutes : [];
  const dictionaryCopy = PERP_DICTIONARY_COPY[localeKey] || PERP_DICTIONARY_COPY.en;
  const derivativesRouteCopy = derivativesRouteUi(localeKey);
  const derivativesTaskCopy = derivativesTaskUi(localeKey);
  const [selectedDerivativeRouteId, setSelectedDerivativeRouteId] = useState(null);
  const derivativeRouteDetailsRef = useRef({});
  const selectDerivativeRoute = (routeId) => {
    setSelectedDerivativeRouteId(routeId);
    const detail = derivativeRouteDetailsRef.current[routeId];
    if (detail) detail.open = true;
  };
  const additionalLocalizedTopicTitles = {
    "meme-coins": {
      en: "Meme coin platform comparison (2026): MEXC vs Gate.io vs Raydium",
      fr: "Comparatif des plateformes pour meme coins : MEXC, Gate.io et Raydium",
      de: "Vergleich von Krypto-Plattformen für Meme-Coins: MEXC, Gate.io und Raydium",
      es: "Comparativa de plataformas para meme coins: MEXC, Gate.io y Raydium",
      "pt-BR": "Comparação de plataformas para meme coins: MEXC, Gate.io e Raydium",
      ru: "Сравнение платформ для мемкоинов: MEXC, Gate.io и Raydium",
      ar: "مقارنة منصات عملات الميم: MEXC وGate.io وRaydium",
      id: "Perbandingan platform meme coin: MEXC, Gate.io, dan Raydium",
      vi: "So sánh nền tảng meme coin: MEXC, Gate.io và Raydium",
      it: "Confronto tra piattaforme per meme coin: MEXC, Gate.io e Raydium",
    },
    derivatives: {
      en: "Crypto perpetual platform comparison: Binance, Bybit and Hyperliquid",
      fr: "Comparatif des plateformes crypto perpétuelles : Binance, Bybit et Hyperliquid",
      de: "Vergleich von Krypto-Perpetual-Plattformen: Binance, Bybit und Hyperliquid",
      es: "Comparativa de plataformas perpetuas cripto: Binance, Bybit y Hyperliquid",
      "pt-BR": "Comparação de plataformas perpétuas cripto: Binance, Bybit e Hyperliquid",
      ru: "Сравнение крипто-перпетуалов: Binance, Bybit и Hyperliquid",
      ar: "مقارنة منصات العقود الدائمة: Binance وBybit وHyperliquid",
      id: "Perbandingan platform perpetual kripto: Binance, Bybit, dan Hyperliquid",
      vi: "So sánh nền tảng perpetual crypto: Binance, Bybit và Hyperliquid",
      it: "Confronto tra piattaforme perpetual crypto: Binance, Bybit e Hyperliquid",
    },
    "compliant-exchanges": {
      en: "Regulated crypto exchange comparison for fiat access: HashKey, Kraken and OKX",
      fr: "Accès fiat et éligibilité des comptes : HashKey, Kraken et OKX",
      de: "Regulierte Krypto-Börsen für Fiat-Zugang: HashKey, Kraken und OKX",
      es: "Acceso fiat y elegibilidad de cuenta: HashKey, Kraken y OKX",
      "pt-BR": "Acesso fiat e elegibilidade de conta: HashKey, Kraken e OKX",
      ru: "Фиатный доступ и условия аккаунта: HashKey, Kraken и OKX",
      ar: "الوصول إلى العملات التقليدية وأهلية الحساب: HashKey وKraken وOKX",
      id: "Akses fiat dan kelayakan akun: HashKey, Kraken, dan OKX",
      vi: "Truy cập fiat và điều kiện tài khoản: HashKey, Kraken và OKX",
      it: "Accesso fiat e idoneità dell’account: HashKey, Kraken e OKX",
    },
    "no-kyc": {
      en: "Crypto access without KYC: Hyperliquid, dYdX and MEXC",
      fr: "Accès crypto sans KYC : Hyperliquid, dYdX et MEXC",
      de: "Krypto-Zugang ohne KYC: Hyperliquid, dYdX und MEXC",
      es: "Acceso cripto sin KYC: Hyperliquid, dYdX y MEXC",
      "pt-BR": "Acesso cripto no-KYC: Hyperliquid, dYdX e MEXC",
      ru: "Крипто-доступ без KYC: Hyperliquid, dYdX и MEXC",
      ar: "الوصول إلى العملات الرقمية دون KYC: Hyperliquid وdYdX وMEXC",
      id: "Akses kripto tanpa KYC: Hyperliquid, dYdX, dan MEXC",
      vi: "Truy cập crypto không KYC: Hyperliquid, dYdX và MEXC",
      it: "Accesso crypto senza KYC: Hyperliquid, dYdX e MEXC",
    },
  }[topic.slug]?.[locale];
  const localizedTopicTitle = ({
    "meme-coins": {
      ja: "ミームコイン向け暗号資産プラットフォームガイド",
      ko: "밈 코인 거래를 위한 암호화폐 플랫폼 가이드",
      tr: "Meme coin işlemleri için kripto platform rehberi",
      ar: "دليل منصات العملات المشفرة لعملات الميم",
      "pt-BR": "Guia de plataformas cripto para meme coins",
      es: "Guía de plataformas cripto para meme coins",
      fr: "Guide des plateformes crypto pour les meme coins",
      de: "Leitfaden für Krypto-Plattformen bei Meme-Coins",
      ru: "Гид по криптоплатформам для мемкоинов",
      id: "Panduan platform kripto untuk meme coin",
      vi: "Hướng dẫn nền tảng crypto cho meme coin",
      it: "Guida alle piattaforme crypto per meme coin",
    },
    "no-kyc": {
      ko: "No-KYC 암호화폐 접근 비교: Hyperliquid, dYdX, MEXC",
      tr: "No-KYC kripto erişim karşılaştırması: Hyperliquid, dYdX, MEXC",
    },
  }[topic.slug] || {})[locale];
  const localizedTopicDescription = ({
    "meme-coins": {
      ja: "ミームコインを扱う取引所と分散型プラットフォームを、公式条件、手数料、地域要件、出典とともに比較します。",
      ko: "공식 조건, 수수료, 지역 요건과 출처를 기준으로 밈 코인 거래소와 탈중앙화 플랫폼을 비교합니다.",
      tr: "Meme coin platformlarını resmi koşullar, ücretler, bölgesel uygunluk ve kaynaklarla karşılaştırın.",
      ar: "قارن منصات تداول عملات الميم وفق الشروط الرسمية والرسوم والأهلية الإقليمية والمصادر.",
      "pt-BR": "Compare plataformas para meme coins usando termos oficiais, taxas, elegibilidade regional e fontes.",
      es: "Compara plataformas para meme coins con condiciones oficiales, comisiones, elegibilidad regional y fuentes.",
      fr: "Comparez les plateformes de meme coins selon les conditions officielles, les frais, l’éligibilité régionale et les sources.",
      de: "Vergleichen Sie Plattformen für Meme-Coins anhand offizieller Bedingungen, Gebühren, regionaler Eignung und Quellen.",
      ru: "Сравнивайте платформы для мемкоинов по официальным условиям, комиссиям, региональной доступности и источникам.",
      id: "Bandingkan platform meme coin berdasarkan ketentuan resmi, biaya, kelayakan wilayah, dan sumber.",
      vi: "So sánh các nền tảng meme coin theo điều kiện chính thức, phí, khu vực hỗ trợ và nguồn.",
      it: "Confronta le piattaforme per meme coin usando condizioni ufficiali, commissioni, idoneità regionale e fonti.",
    },
    "no-kyc": {
      ko: "지갑 연결, 계정 가입, 본인확인 가능성, 출금, 지역 제한과 리스크 경계를 Hyperliquid, dYdX, MEXC 기준으로 비교합니다.",
      tr: "Cüzdan bağlantısı, hesap kaydı, kimlik kontrolü olasılığı, çekim, bölgesel sınırlamalar ve risk sınırlarını Hyperliquid, dYdX ve MEXC üzerinden karşılaştırın.",
    },
  }[topic.slug] || {})[locale];
  const localizedPainPoints = topicNativeCopy?.painPoints || topicCopy?.painPoints?.map(([icon, title, desc]) => ({ icon, titleEn: title, descEn: desc })) || topic.painPoints;
  const localizedEvaluationPillars = topicNativeCopy?.evaluationPillars || topicCopy?.evaluationPillars?.map(([title, desc]) => ({ titleEn: title, descEn: desc })) || topic.evaluationPillars;
  const localizedPitfalls = topicCopy?.pitfalls?.map(([title, desc]) => ({ titleEn: title, descEn: desc })) || topic.pitfalls;
  const sharedSourceFaq = topic.slug === "compliant-exchanges" && ["en", "zh-Hans", "zh-Hant"].includes(locale);
  // These source-linked checks do not provide live orderbook audits or guarantees.
  const compliantUi = sharedSourceFaq ? ({
    en: {
      painTitle: "Checks before choosing a fiat route", painLead: "Review the service entity, bank requirements and account records separately before choosing a route.",
      securityTitle: "Platform conditions to check side by side", securityLead: "Use official sources and the account flow to check fees, access and funding requirements. Unverified figures remain pending.",
      scoreLabel: "Evidence status", speedDepth: "Announcements", netFee: "Applicable fee terms", slippageKyc: "Market and account checks", action: "Profile and account route",
      pitfallLead: "Review payment details and applicable protection terms. These checks do not guarantee bank acceptance or recovery of funds.",
      matrixLead: "Explore related guides to compare platform requirements and the questions to verify before proceeding.", updated: "Content updated",
    },
    "zh-Hans": {
      painTitle: "选择法币通道前需要核对什么", painLead: "选择通道前，分别核对服务主体、银行要求与账户记录。",
      securityTitle: "平台条件核对表", securityLead: "通过官方来源和账户流程核对费率、地区资格与入金要求；尚未核验的数值保持待核验。",
      scoreLabel: "证据状态", speedDepth: "官方公告", netFee: "适用费率条款", slippageKyc: "市场与账户条件", action: "平台档案与开户路径",
      pitfallLead: "核对付款资料与适用保障条款。这些检查不保证银行接受，也不保证资金能够追回。",
      matrixLead: "查看相关专题，比较平台要求以及继续操作前需要核对的问题。", updated: "内容更新",
    },
    "zh-Hant": {
      painTitle: "選擇法幣通道前需要核對什麼", painLead: "選擇通道前，分別核對服務主體、銀行要求與帳戶紀錄。",
      securityTitle: "平台條件核對表", securityLead: "透過官方來源和帳戶流程核對費率、地區資格與入金要求；尚未核驗的數值保持待核驗。",
      scoreLabel: "證據狀態", speedDepth: "官方公告", netFee: "適用費率條款", slippageKyc: "市場與帳戶條件", action: "平台檔案與開戶路徑",
      pitfallLead: "核對付款資料與適用保障條款。這些檢查不保證銀行接受，也不保證資金能夠追回。",
      matrixLead: "查看相關專題，比較平台要求以及繼續操作前需要核對的問題。", updated: "內容更新",
    },
  }[locale]) : null;
  const sharedTruthTopicUi = ["meme-coins", "derivatives", "no-kyc"].includes(topic.slug) && ["en", "zh-Hans", "zh-Hant"].includes(locale) ? ({
    en: {
      painTitle: "Risks and conditions to check",
      painLead: "Check execution costs, account restrictions, contract permissions and exit conditions separately before choosing a route.",
      securityTitle: "Platform conditions to check side by side",
      securityLead: "Use official sources to check published fees, access rules, execution risks and withdrawal conditions. Unverified figures remain pending.",
      scoreLabel: "Evidence status",
      speedDepth: "Announcements to check",
      baseRates: "Published fee schedule",
      netFee: "Applicable fee terms",
      slippageKyc: "Market and account checks",
      action: "Profile and account route",
      pitfallLead: "Check custody, permissions and exit conditions before proceeding. These checks do not ensure capital safety or recovery of funds.",
      matrixTitle: "Explore related topic guides",
      matrixLead: "Compare platform requirements and the questions to verify before proceeding.",
      topicCardAction: "Open topic guide",
      updated: "Content updated",
    },
    "zh-Hans": {
      painTitle: "风险与使用条件核对",
      painLead: "选择交易路径前，分别核对执行成本、账户限制、合约权限与退出条件。",
      securityTitle: "平台条件核对表",
      securityLead: "通过官方来源核对公开费率、准入规则、执行风险与提现条件；尚未核验的数值保持待核验。",
      scoreLabel: "证据状态",
      speedDepth: "待核对公告",
      baseRates: "公开费率表",
      netFee: "适用费率条款",
      slippageKyc: "市场与账户条件",
      action: "平台档案与开户路径",
      pitfallLead: "继续操作前核对托管、授权与退出条件。这些检查不保证本金安全，也不保证资金能够追回。",
      matrixTitle: "查看相关专题指南",
      matrixLead: "比较平台要求以及继续操作前需要核对的问题。",
      topicCardAction: "查看专题指南",
      updated: "内容更新",
    },
    "zh-Hant": {
      painTitle: "風險與使用條件核對",
      painLead: "選擇交易路徑前，分別核對執行成本、帳戶限制、合約權限與退出條件。",
      securityTitle: "平台條件核對表",
      securityLead: "透過官方來源核對公開費率、准入規則、執行風險與提領條件；尚未核驗的數值維持待核驗。",
      scoreLabel: "證據狀態",
      speedDepth: "待核對公告",
      baseRates: "公開費率表",
      netFee: "適用費率條款",
      slippageKyc: "市場與帳戶條件",
      action: "平台檔案與開戶路徑",
      pitfallLead: "繼續操作前核對託管、授權與退出條件。這些檢查不保證本金安全，也不保證資金能夠追回。",
      matrixTitle: "檢視相關專題指南",
      matrixLead: "比較平台要求以及繼續操作前需要核對的問題。",
      topicCardAction: "檢視專題指南",
      updated: "內容更新",
    },
  }[locale]) : null;
  const sourceBoundUi = compliantUi || (topicNativeCopy?.sourceBoundUi ? { ...topicUiResolved, ...sharedTruthTopicUi, ...topicNativeCopy.sourceBoundUi } : sharedTruthTopicUi);
  const reviewedFaqs = topicReviewedFaqRecords(topic.slug, locale);
  const localizedFaqs = reviewedFaqs.length ? reviewedFaqs : (sharedSourceFaq ? TOPIC_GUIDES[topic.slug].faqs : (topicCopy?.faqs?.map(([q, a]) => ({ qEn: q, aEn: a })) || topic.faqs));
  const localizedTelegramCommands = topicNativeCopy?.telegramCommands || topicCopy?.telegramCommands?.map(([cmd, desc]) => ({ cmd, descEn: desc, descZh: desc })) || topic.telegramCommands;
  const publicPlatforms = topic.platforms.map((platform) => {
    const projected = publicCtaForTopicPlatform(platform, locale);
    const publicCta = publicCtaForVenue(platform.slug, locale);
    return {
      ...projected,
      affiliateUrl: publicCta.registrationUrl,
      hasReferral: publicCta.hasReferral,
      hasPartnerRoute: publicCta.hasPartnerRoute,
      inviteCode: publicCta.inviteCode,
      rebate: publicCta.rebatePercent,
      benefit: publicCta.benefit,
      claimStatus: publicCta.claim.status,
    };
  });
  const topicOffersVerified = publicPlatforms.some((platform) => platform.claimStatus === "verified");
  const topicFactsVerified = false;
  const topicAuxCopy = topicAuxiliaryCopy(topic.slug, locale);
  const rawPills = topicAuxCopy?.pills || (isZh ? topicZhField(topic, "pills", isHant) : (topicCopy?.pills || topic.pillsEn));
  const topicPills = rawPills.map((pill) => {
    if (/返佣|返佣|rebate|bonus|礼包|禮包|迎新/i.test(pill)) return topicUiResolved?.verifyBenefits || (isZh ? zhCopy(isHant, "用户权益待官方来源核验") : "User benefits require official-source verification");
    if (/<\s*2\s*h|0\.00%|anti[- ]?mev|防\s*MEV/i.test(pill)) return topicUiResolved?.verifyExecution || (isZh ? zhCopy(isHant, "执行条件待官方来源核验") : "Execution conditions require official-source verification");
    return pill;
  });
  const topicQuickStats = topic.quickStats.map((stat, index) => {
    const localizedStat = topicNativeCopy?.quickStats?.[index] ? { ...stat, ...topicNativeCopy.quickStats[index] } : localizedQuickStat(stat, topic.slug, localeKey, isZh, isTraditionalZh);
    if (topicFactsVerified || topicOffersVerified && /fee|费率|返佣|rebate|net/i.test(`${stat.labelEn} ${stat.labelZh} ${stat.value} ${stat.descEn}`)) return localizedStat;
    return {
      ...localizedStat,
      value: topicUiResolved?.pending || (isZh ? zhCopy(isHant, "待核验") : (topicUiResolved.pending || "Pending")),
      descZh: localizedStat.descZh || zhCopy(isHant, "需核对官方来源与当前账户条件"),
      descEn: localizedStat.descEn || ({ ja: "公式ソースと現在のアカウント条件を確認してください", ko: "공식 출처와 현재 계정 조건을 확인하세요", tr: "Resmi kaynakları ve güncel hesap koşullarını doğrulayın", "pt-BR": "Verifique as fontes oficiais e as condições atuais da conta", es: "Verifica las fuentes oficiales y las condiciones actuales de la cuenta", fr: "Vérifiez les sources officielles et les conditions actuelles du compte", de: "Offizielle Quellen und aktuelle Kontobedingungen prüfen", ru: "Проверьте официальные источники и текущие условия аккаунта", ar: "تحقق من المصادر الرسمية وشروط الحساب الحالية", id: "Periksa sumber resmi dan ketentuan akun saat ini", vi: "Kiểm tra nguồn chính thức và điều kiện tài khoản hiện tại", it: "Verifica le fonti ufficiali e le condizioni attuali dell'account" }[locale] || "Verify official sources and current account terms"),
    };
  });
  const topicSources = topicSourcesFor(topic.slug);
  const telegramHref = getTelegramDeepLink({ action: "topic_review", project: topic.slug, market, locale, product });
  const topicCanonicalPath = `/topics/${topic.slug}`;
  const traditionalDirectAnswer = isHant ? TRADITIONAL_CHINESE_DIRECT_ANSWERS[topic.slug] : null;
  const otherSlugs = TOPIC_SLUGS.filter((s) => s !== topic.slug);
  const profileHref = (platformSlug) => neutralVenueCatalog.some((venue) => venue.slug === platformSlug)
    ? localizedHref(`/exchanges/${platformSlug}`, { locale, market, product })
    : localizedHref(`/factbook/${platformSlug}`, { locale, market, product });

  const formatHref = (targetSlug) => {
    return localizedHref(`/topics/${targetSlug}`, { locale });
  };
  const topicBadge = topicAuxCopy?.badge || (isZh ? (isHant ? (topic.badgeZhHant || traditionalizeTopicText(topic.badge)) : topic.badge) : (topicCopy?.badge || topic.badgeEn));
  const topicCategory = isZh ? topicZhField(topic, "category", isHant) : (topicCopy?.category || staticUi.category || topic.categoryEn);
  const topicTitle = isZh ? topicZhField(topic, "title", isHant) : (topicCopy?.title || localizedTopicTitle || additionalLocalizedTopicTitles || topic.titleEn);
  const topicDescription = isZh ? topicZhField(topic, "desc", isHant) : (topicCopy?.description || localizedTopicDescription || topic.descEn);
  const localizedSearchAnswer = topicCopy?.searchAnswer
    ? {
      eyebrow: topicCopy.searchAnswer.eyebrow,
      title: topicCopy.searchAnswer.title,
      body: topicCopy.searchAnswer.body,
      bullets: topicCopy.searchAnswer.bullets || [],
      sourceNote: topicCopy.searchAnswer.sourceNote,
    }
    : topic.searchAnswer && localeKey === "en"
      ? {
        eyebrow: topic.searchAnswer.eyebrowEn,
        title: topic.searchAnswer.titleEn,
        body: topic.searchAnswer.bodyEn,
        bullets: topic.searchAnswer.bulletsEn || [],
        sourceNote: topic.searchAnswer.sourceNoteEn,
      }
      : null;
  const reviewedTopicSource = topicSources
    .flatMap((record) => record.status === "source-backed-research" ? record.sources : [])
    .find((source) => /^https?:\/\//i.test(source?.url || ""));
  const topicDecisionAnswer = traditionalDirectAnswer || localizedSearchAnswer || {
    eyebrow: topicUiResolved?.start || (isZh ? zhCopy(isHant, "先做一件事") : "START HERE"),
    title: topicUiResolved?.decision || (isZh ? zhCopy(isHant, "先核对平台档案，再决定是否开户") : "Review the venue profile before opening an account"),
    body: topicUiResolved?.decisionBody || (isZh ? zhCopy(isHant, "先看官方域名、地区资格、产品范围与来源日期；只有已核验的商业入口才会直达合作方。") : "Check the official domain, regional eligibility, product scope and source dates first. Only verified commercial routes go directly to a partner."),
  };
  const topicTopActions = publicPlatforms.slice(0, 2).map((platform) => ({
    label: topicPlatformDisplayName(platform, isHant, isZh),
    href: profileHref(platform.slug),
    kind: "research",
  }));
  const topicBridgeCompareSlugs = publicPlatforms.slice(0, 2).map((platform) => platform.slug);
  const topicSourceAction = reviewedTopicSource
    ? {
      label: reviewedTopicSource.title || reviewedTopicSource.host || (isZh ? "打开官方来源" : "Open official source"),
      href: reviewedTopicSource.url,
      kind: "source",
    }
    : null;
  const derivativesDecisionHeading = {
    en: "Choose the derivative route first",
    "zh-Hans": "先按账户模式选择衍生品路线",
    "zh-Hant": "先按帳戶模式選擇衍生品路線",
    ja: "先にデリバティブルートを選ぶ",
    ko: "먼저 파생상품 경로를 선택하세요",
    tr: "Önce türev rotasını seçin",
    es: "Elige primero la ruta de derivados",
    "pt-BR": "Escolha primeiro a rota de derivativos",
    fr: "Choisissez d’abord la route dérivés",
    de: "Wählen Sie zuerst die Derivate-Route",
    ru: "Сначала выберите маршрут деривативов",
    ar: "اختر مسار المشتقات أولاً",
    id: "Pilih rute derivatif lebih dulu",
    vi: "Chọn tuyến phái sinh trước",
    it: "Scegli prima il percorso derivati",
  }[localeKey] || "Choose the derivative route first";
  const derivativesDecisionBody = {
    en: "The right next step depends on account model: exchange account, wallet-connected perp, specialist options venue, or pool-based GMX route.",
    "zh-Hans": "下一步不先看宣传费率，而是先看账户模式：交易所账户、钱包永续、期权专门平台，或 GMX 资金池路线。",
    "zh-Hant": "下一步不先看宣傳費率，而是先看帳戶模式：交易所帳戶、錢包永續、期權專門平台，或 GMX 資金池路線。",
    ja: "次の一手は宣伝手数料ではなく、口座型、ウォレット型、専門プラットフォーム、GMXプール型のどれかで決まります。",
    ko: "다음 단계는 광고 수수료가 아니라 거래소 계정, 지갑 퍼프, 전문 옵션 플랫폼, GMX 풀 경로 중 무엇인지로 결정됩니다.",
    tr: "Sonraki adım reklam ücretinden değil; borsa hesabı, cüzdan perpi, uzman opsiyon platformu veya GMX havuz rotasından belirlenir.",
    es: "El siguiente paso depende del modelo: cuenta CEX, perp con wallet, venue especialista de opciones o ruta GMX por pools.",
    "pt-BR": "O próximo passo depende do modelo: conta CEX, perp com carteira, venue especialista em opções ou rota GMX por pools.",
    fr: "La suite dépend du modèle : compte CEX, perp via wallet, plateforme options spécialiste ou route GMX par pools.",
    de: "Der nächste Schritt hängt vom Modell ab: CEX-Konto, Wallet-Perp, Optionsspezialist oder GMX-Pool-Route.",
    ru: "Следующий шаг зависит от модели: CEX-аккаунт, perp через кошелёк, специализированная площадка опционов или маршрут GMX через пулы.",
    ar: "تعتمد الخطوة التالية على النموذج: حساب CEX أو Perp عبر المحفظة أو منصة خيارات متخصصة أو مسار GMX عبر المجمعات.",
    id: "Langkah berikutnya bergantung pada model: akun CEX, perp dengan wallet, venue options spesialis, atau rute pool GMX.",
    vi: "Bước tiếp theo phụ thuộc vào mô hình: tài khoản CEX, perp qua ví, nền tảng options chuyên biệt hoặc tuyến pool GMX.",
    it: "Il passo successivo dipende dal modello: account CEX, perp via wallet, venue options specialistica o percorso GMX su pool.",
  }[localeKey] || "The right next step depends on account model: exchange account, wallet-connected perp, specialist options venue, or pool-based GMX route.";

  return (
    <main className="v6 topic-guide-page v2-page">
      <div className="topic-guide-page__inner v2-shell">
        {/* 顶部全赛道导航条 (Topic Matrix Switcher) */}
        <nav className="topic-nav-strip topic-nav-strip--tracks" aria-label={topicUiResolved?.nav || (isZh ? zhCopy(isHant, "细分赛道专题导航") : "Topic Track Navigation")}>
          {TOPIC_SLUGS.map((trackSlug) => {
            const track = TOPIC_GUIDES[trackSlug];
            const trackFullLabel = sanitizeTopicText(topicNavFullLabel(trackSlug, locale));
            const trackShortLabel = sanitizeTopicText(topicNavShortLabel(trackSlug, locale));
            const isActive = trackSlug === topic.slug;
            return (
              <a
                key={trackSlug}
                href={formatHref(trackSlug)}
                className={`topic-nav-btn ${isActive ? "active" : ""}`}
                aria-label={`${trackShortLabel}: ${trackFullLabel}`}
              >
                <span aria-hidden="true">{trackSlug === "meme-coins" ? "" : trackSlug === "derivatives" ? "" : trackSlug === "compliant-exchanges" ? "" : ""}</span>
                <span className="topic-nav-label topic-nav-label--full">{trackFullLabel}</span>
                <span className="topic-nav-label topic-nav-label--short">{trackShortLabel}</span>
              </a>
            );
          })}
        </nav>

        {/* 头部 Hero 区域 */}
        <div className="topic-header">
          <div className="topic-header__badge-row">
            <span className="topic-header__badge" {...enIfLatin(topicBadge, locale)}>{topicBadge}</span>
            <span className="topic-header__date">{sourceBoundUi ? `${sourceBoundUi.updated}: ${topic.lastUpdated}` : topicUi ? `${topicUi.updated}: ${topic.lastUpdated}` : staticUi.updated ? `${staticUi.updated}: ${topic.lastUpdated}` : isZh ? `${zhCopy(isHant, "最后量化更新")}：${topic.lastUpdated}` : `Last Updated: ${topic.lastUpdated}`}</span>
          </div>
          <h1 className="topic-header__title">{topicTitle}</h1>
          <p className="topic-header__subtitle" {...enIfLatin(topicDescription, locale)}>{topicDescription}</p>

          <details className="topic-header__context">
            <summary>{topicAuxCopy?.summary || topicUiResolved?.sourceOpen || (isZh ? zhCopy(isHant, "展开来源登记与审阅状态") : "Open source register and review status")}<span aria-hidden="true">+</span></summary>
            <div className="topic-header__context-body">
              <span className="topic-header__category">{topicCategory}</span>
              <div className="topic-header__pills">
                {topicPills.map((pill, index) => (
                  <span key={index} className="topic-header__pill" {...enIfLatin(pill, locale)}>
                    ✓ {pill}
                  </span>
                ))}
              </div>
            </div>
          </details>
        </div>

        <TopDecisionBox
          className="topic-decision-rail topic-top-decision"
          eyebrow={topicDecisionAnswer.eyebrow}
          title={topicDecisionAnswer.title}
          answer={topicDecisionAnswer.body}
          actions={topicTopActions}
          sourceAction={topicSourceAction}
          ctaPlacement="topic-top-decision"
          growthDecision={topic.slug}
          growthMarket={market}
          growthProduct={product}
          withContext={(href) => href}
          aeoDirectAnswer={topic.slug === "derivatives" && Boolean(localizedSearchAnswer || traditionalDirectAnswer)}
        />

        <TopicDisclosure title={topicUiResolved?.sourceOpen || (isZh ? zhCopy(isHant, "展开来源登记与审阅状态") : "Open source register and review status")} className="topic-section-disclosure topic-source-register-disclosure">
        <section className="topic-section topic-source-register" aria-label={isZh ? zhCopy(isHant, "专题来源登记") : "Topic source register"}>
          <div className="topic-section__header">
            <h2 className="topic-section__title">{isZh ? zhCopy(isHant, "来源登记与审阅状态") : (topicUiResolved.sourceOpen || "Sources and review status")}</h2>
            <p className="topic-section__subtitle">
              {isZh
                ? `${zhCopy(isHant, "平台基础资料来自官方来源入口；商业权益、排名和实时条件仍需逐项核验。审阅时间")}：${TOPIC_SOURCE_REVIEW_DATE}`
                : `${staticUi.sourceLead || "Platform context is linked to official source hubs. Commercial benefits, rankings, and live conditions remain item-level pending. Reviewed"}: ${TOPIC_SOURCE_REVIEW_DATE}`}
            </p>
          </div>
          <div className="topic-source-register__grid">
            {topicSources.map((record) => (
              <article className="topic-source-register__item" key={record.slug}>
                <strong translate="no" lang={isHant && record.slug === "okx" ? "zh-Hant" : "en"}>{topicPlatformDisplayName(record, isHant, isZh)}</strong>
                <span>{record.status === "source-backed-research" ? (isZh ? zhCopy(isHant, "基础研究有来源") : (staticUi.sourceBacked || "Source-backed context")) : (isZh ? zhCopy(isHant, "待来源核验") : (staticUi.pending || "Pending source review"))}</span>
                <small>{record.checkedAt || (isZh ? zhCopy(isHant, "未记录审阅时间") : "No review timestamp")}</small>
                <div {...enIfLatin(record.sources.map((source) => source.title).join(" "), locale)}>
                  {record.sources.slice(0, 3).map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
        </TopicDisclosure>

        {topic.slug === "derivatives" && <section className="topic-section" role="region" aria-label={derivativesDecisionHeading}>
          <h2 className="topic-section__title">{derivativesDecisionHeading}</h2>
          <p className="topic-section__subtitle">{derivativesDecisionBody}</p>
          <div className="topic-derivatives-route-picker" role="group" aria-label={derivativesTaskCopy.chooser}>
            {derivativesDecisionRoutes.map((route) => {
              const routeText = route.copy?.[localeKey] || route.copy?.en;
              const shortLabel = derivativesRouteShortLabel(route.id, localeKey);
              const isSelected = selectedDerivativeRouteId === route.id;
              return <button key={route.id} type="button" className="topic-derivatives-route-choice" data-derivatives-route-choice={route.id} aria-pressed={isSelected} aria-label={`${shortLabel}: ${routeText.title}`} onClick={() => selectDerivativeRoute(route.id)}>{shortLabel}</button>;
            })}
          </div>
          <div className="topic-derivatives-routes" data-testid="derivatives-decision-routes">
            {derivativesDecisionRoutes.map((route) => {
              const routeText = route.copy?.[localeKey] || route.copy?.en;
              const primaryLink = route.links[0];
              const isSelected = selectedDerivativeRouteId === route.id;
              return (
                <article key={route.id} className={`topic-derivatives-route-card${isSelected ? " is-selected" : ""}`} data-derivatives-route-id={route.id} data-derivatives-route-state={isSelected ? "selected" : (selectedDerivativeRouteId ? "available" : "unselected")}>
                  <details className="topic-derivatives-route-detail" open={isSelected || undefined} ref={(node) => {
                    if (node) derivativeRouteDetailsRef.current[route.id] = node;
                    else delete derivativeRouteDetailsRef.current[route.id];
                  }} onToggle={(event) => {
                    if (event.currentTarget.open) setSelectedDerivativeRouteId(route.id);
                    else if (selectedDerivativeRouteId === route.id) setSelectedDerivativeRouteId(null);
                  }}>
                    <summary>{routeText.title}{isSelected && <span className="topic-derivatives-route-selected">{derivativesTaskCopy.selected}</span>}</summary>
                    <p>{routeText.body}</p>
                    <strong>{derivativesRouteCopy.checks}</strong>
                    <ul>
                      {routeText.checks.map((check) => <li key={check}>{check}</li>)}
                    </ul>
                    <div className="topic-derivatives-evidence-next">
                      <span>{derivativesTaskCopy.evidence}</span>
                      <a href={localizedRouteHref("/topics/derivatives#perp-cost-field-dictionary", { locale, market, product })} data-cta-kind="research" data-cta-placement="topic-derivatives-route-evidence" data-growth-decision="perp_cost_dictionary" data-growth-placement="topic-derivatives-route-evidence" data-growth-market={market} data-growth-product={product}>{derivativesTaskCopy.costDictionary} →</a>
                    </div>
                    {route.links.length > 1 && <nav className="topic-nav-strip topic-nav-strip--intent" aria-label={`${routeText.title} ${derivativesRouteCopy.links}`}>
                      {route.links.slice(1).map((link) => (
                        <a key={`${route.id}-${link.href}`} className="topic-nav-btn" href={localizedRouteHref(link.href, { locale, market, product })} data-cta-kind="research" data-cta-placement="topic-derivatives-route-more" data-growth-decision={link.decision} data-growth-placement="topic-derivatives-route-more" data-growth-market={market} data-growth-product={product}>{derivativesLinkLabel(link, derivativesRouteCopy)} →</a>
                      ))}
                    </nav>}
                  </details>
                  {primaryLink && <a className="topic-nav-btn topic-derivatives-route-primary" href={localizedRouteHref(primaryLink.href, { locale, market, product })} data-cta-kind="research" data-cta-placement="topic-derivatives-route-primary" data-growth-decision={primaryLink.decision} data-growth-placement="topic-derivatives-route-primary" data-growth-market={market} data-growth-product={product}>{derivativesLinkLabel(primaryLink, derivativesRouteCopy)} →</a>}
                </article>
              );
            })}
          </div>
        </section>}

        {topic.slug === "derivatives" && <section id="perp-cost-field-dictionary" className="topic-section" aria-labelledby="perp-cost-field-dictionary-title">
          <div className="topic-section__header">
            <h2 id="perp-cost-field-dictionary-title" className="topic-section__title">{dictionaryCopy.title}</h2>
            <p className="topic-section__subtitle">{dictionaryCopy.subtitle(PERP_COST_FIELD_DICTIONARY_VERSION)}</p>
          </div>
          <div className="topic-direct-answer">
            <strong>{dictionaryCopy.usageTitle}</strong>
            <p>{dictionaryCopy.usageBody}</p>
          </div>
          <div className="topic-direct-answer">
            <strong>{dictionaryCopy.findingTitle}</strong>
            <p>{dictionaryCopy.findingBody}</p>
          </div>
          <nav className="topic-nav-strip" aria-label={dictionaryCopy.downloads}>
            <a className="topic-nav-btn" href="/research/perp-dex-cost-field-dictionary.csv">CSV ↓</a>
            <a className="topic-nav-btn" href="/research/perp-dex-cost-field-dictionary.json">JSON ↓</a>
            <a className="topic-nav-btn" href="/research/wave48-perp-dex-cost-citations.csv">Wave48 CSV ↓</a>
            <a className="topic-nav-btn" href="/research/wave48-perp-dex-cost-citations.json">Wave48 JSON ↓</a>
            {PERP_COST_FIELD_SOURCES.slice(0, 4).map((source) => <a key={source.url} className="topic-nav-btn" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}
          </nav>
          <details className="topic-source-detail">
            <summary>{dictionaryCopy.openFields}</summary>
            <div className="topic-eval-grid topic-cost-dictionary__grid">
              {PERP_COST_FIELD_DICTIONARY.map((field, index) => {
              const { label, definition, comparisonRule } = perpFieldDisplay(field, index, localeKey, isZh, isTraditionalZh);
                return (
                  <article key={field.id} className="topic-eval-card">
                    <h3>{label}</h3>
                    <p>{definition}</p>
                    <small>{comparisonRule}</small>
                  </article>
                );
              })}
            </div>
          </details>
          <details className="topic-source-detail">
            <summary>{dictionaryCopy.openSources}</summary>
            <div className="topic-source-detail__links">
              {PERP_COST_FIELD_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}
            </div>
          </details>
        </section>}

        {topic.slug === "no-kyc" && <section className="topic-section" role="region" aria-label={isZh ? zhCopy(isHant, "免实名相关研究入口") : (routeCopy.noKyc?.label || "No-KYC related research")} {...enIfLatin(isZh ? "" : (topicCopy?.noKycTitle || routeCopy.noKyc?.title || "English"), locale)}>
          <h2 className="topic-section__title">{isZh ? zhCopy(isHant, "先区分自托管协议、中心化平台和永续对比") : (topicCopy?.noKycTitle || routeCopy.noKyc?.title || "Separate self-custody protocols, CEX access and perp comparisons")}</h2>
          <p className="topic-section__subtitle">{isZh ? zhCopy(isHant, "免实名条件会随地区、产品和账户阶段变化。先看 Hyperliquid 与 dYdX 的对比，再分别核对平台档案和 MEXC 的账户条件。") : (topicCopy?.noKycBody || routeCopy.noKyc?.body || "No-KYC conditions can change by region, product and account stage. Start with the Hyperliquid vs dYdX comparison, then verify each venue profile and MEXC account requirements.")}</p>
          <div className="topic-intent-redirect" data-gsc-query-intent="hyperliquid-latest-news">
            <span className="topic-intent-redirect__eyebrow">{isZh ? zhCopy(isHant, "新闻/公告意图") : "News intent"}</span>
            <p>{isZh ? zhCopy(isHant, "如果你在找 Hyperliquid 最新消息或公告，这个 No-KYC 页面只解释准入边界；请先打开新闻中心、已发布的 Hyperliquid 文章或平台档案，再核对官方来源。") : (topicCopy?.newsBody || "If you are looking for Hyperliquid latest news or announcements, this No-KYC page is only the access-boundary guide. Start with the news hub, the published Hyperliquid article, or the Hyperliquid profile, then verify official sources.")}</p>
            <nav className="topic-nav-strip topic-nav-strip--intent" aria-label={isZh ? zhCopy(isHant, "Hyperliquid 新闻意图入口") : "Hyperliquid news-intent paths"}>
              {[
                [isZh ? zhCopy(isHant, "打开新闻中心") : "Open Market News", "/news", "hyperliquid_news_hub"],
                [isZh ? zhCopy(isHant, "阅读 Hyperliquid vs dYdX 文章") : "Read Hyperliquid vs dYdX article", "/news/hyperliquid-vs-dydx", "hyperliquid_news_article"],
                [isZh ? zhCopy(isHant, "查看 Hyperliquid 档案") : "Review Hyperliquid profile", "/exchanges/hyperliquid", "hyperliquid_profile"],
              ].map(([label, href, decision]) => (
                <a key={href} className="topic-nav-btn" href={localizedHref(href, { locale, market, product })} data-cta-kind="research" data-cta-placement="topic-no-kyc-news-intent" data-growth-decision={decision} data-growth-placement="topic-no-kyc-news-intent" data-growth-market={market} data-growth-product={product}>{label} →</a>
              ))}
            </nav>
          </div>
          <nav className="topic-nav-strip" aria-label={isZh ? zhCopy(isHant, "相关免实名研究") : (routeCopy.noKyc?.label || "Related no-KYC research")}>
            {[
              ["Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx", "hyperliquid_vs_dydx"],
              ["Hyperliquid", "/exchanges/hyperliquid", "hyperliquid"],
              ["dYdX", "/exchanges/dydx", "dydx"],
              ["MEXC", "/exchanges/mexc", "mexc"],
            ].map(([label, href, decision]) => (
              <a key={href} className="topic-nav-btn" href={localizedHref(href, { locale, market, product })} data-cta-kind="research" data-cta-placement="topic-no-kyc" data-growth-decision={decision} data-growth-placement="topic-no-kyc" data-growth-market={market} data-growth-product={product}>{label} →</a>
            ))}
          </nav>
        </section>}

        {/* 4 核心量化指标卡片 */}
        <div className="topic-quick-stats">
          {topicQuickStats.map((stat, index) => (
            <div key={index} className="topic-stat-card" {...enIfLatin(isZh ? "" : stat.labelEn, locale)}>
              <div className="topic-stat-card__label">{isZh ? zhCopy(isHant, stat.labelZh, stat.labelZhHant) : stat.labelEn}</div>
              <div className="topic-stat-card__value">{stat.value}</div>
              <div className="topic-stat-card__desc">{isZh ? zhCopy(isHant, stat.descZh, stat.descZhHant) : stat.descEn}</div>
            </div>
          ))}
        </div>

        {/* 赛道核心痛点剖析 */}
        <TopicDisclosure title={topicUiResolved?.painOpen || (isZh ? zhCopy(isHant, "展开交易者痛点与评测维度") : "Open trader pain points and evaluation criteria")} className="topic-section-disclosure">
        <section className="topic-section">
          <div className="topic-section__header">
          <h2 className="topic-section__title">
              <span></span>
              <span {...enIfLatin(sourceBoundUi?.painTitle || (isZh ? zhCopy(isHant, "交易者高频痛点剖析与资金暗亏漏洞") : (staticUi.painTitle || "Trader Pain Points & Capital Bleed Vulnerabilities")), locale)}>{sourceBoundUi?.painTitle || (isZh ? zhCopy(isHant, "交易者高频痛点剖析与资金暗亏漏洞") : (staticUi.painTitle || "Trader Pain Points & Capital Bleed Vulnerabilities"))}</span>
            </h2>
            <p className="topic-section__subtitle">
              {sourceBoundUi?.painLead || (isZh
                ? zhCopy(isHant, "传统交易者在缺乏量化选型经验时，常因信息差在滑点、冻卡、暗收手续费与恶意合约中遭受重创。")
                : (staticUi.painLead || "Without rigorous quantitative screening, traders suffer hidden losses from slippage, KYC freezes, and malicious smart contracts."))}
            </p>
          </div>

          <div className="topic-pain-points">
            {localizedPainPoints.map((item, index) => (
              <article key={index} className="topic-pain-card" {...enIfLatin(isZh ? "" : item.titleEn, locale)}>
                <div className="topic-pain-card__icon">{item.icon}</div>
                <h3 className="topic-pain-card__title">{isZh ? zhCopy(isHant, item.titleZh, item.titleZhHant) : item.titleEn}</h3>
                <p className="topic-pain-card__desc">{isZh ? zhCopy(isHant, item.descZh, item.descZhHant) : item.descEn}</p>
              </article>
            ))}
          </div>

          {/* 评测维度 4 柱 */}
          <div className="topic-eval-grid">
            {localizedEvaluationPillars.map((pillar, index) => (
              <div key={index} className="topic-eval-card" {...enIfLatin(isZh ? "" : pillar.titleEn, locale)}>
                <h4>{isZh ? zhCopy(isHant, pillar.titleZh, pillar.titleZhHant) : pillar.titleEn}</h4>
                <p>{isZh ? zhCopy(isHant, pillar.descZh, pillar.descZhHant) : pillar.descEn}</p>
              </div>
            ))}
          </div>
        </section>
        </TopicDisclosure>

        {/* 平台横向对决打分表 (Showdown Table) */}
        <TopicDisclosure title={topicUiResolved?.securityOpen || (isZh ? zhCopy(isHant, "展开避坑与资金安全指南") : "Open the security playbook")} className="topic-section-disclosure">
        <section className="topic-section">
          <div className="topic-section__header">
            <h2 className="topic-section__title">
              <span></span>
              <span {...enIfLatin(sourceBoundUi?.securityTitle || (isZh ? zhCopy(isHant, "精选平台核心量化横向对决表") : (staticUi.securityTitle || "Benchmarked Venues Head-to-Head Showdown")), locale)}>{sourceBoundUi?.securityTitle || (isZh ? zhCopy(isHant, "精选平台核心量化横向对决表") : (staticUi.securityTitle || "Benchmarked Venues Head-to-Head Showdown"))}</span>
            </h2>
            <p className="topic-section__subtitle">
              {sourceBoundUi?.securityLead || (isZh
                ? zhCopy(isHant, "基于 NexuAlpha 统一量化引擎，结合实盘挂单深度、净有效费率与提币门槛的直接比拼。")
                : (staticUi.securityLead || "Audited side-by-side comparison across verified orderbook depth, net effective fees, and accessibility."))}
            </p>
          </div>

          <div className="topic-showdown-wrap">
            <table className="topic-showdown-table">
              <thead>
                <tr>
                  <th {...enIfLatin(sourceBoundUi?.platformType || (isZh ? zhCopy(isHant, "交易平台 / 定位") : (topicUiResolved.platformType || "Platform / Type")), locale)}>{sourceBoundUi?.platformType || (isZh ? zhCopy(isHant, "交易平台 / 定位") : (topicUiResolved.platformType || "Platform / Type"))}</th>
                  <th {...enIfLatin(sourceBoundUi?.scoreLabel || (isZh ? zhCopy(isHant, "量化综合分") : (topicUiResolved.scoreLabel || "Score")), locale)}>{sourceBoundUi?.scoreLabel || (isZh ? zhCopy(isHant, "量化综合分") : (topicUiResolved.scoreLabel || "Score"))}</th>
                  <th {...enIfLatin(sourceBoundUi?.speedDepth || (isZh ? zhCopy(isHant, "时效 / 撮合深度") : (topicUiResolved.speedDepth || "Speed / Depth")), locale)}>{sourceBoundUi?.speedDepth || (isZh ? zhCopy(isHant, "时效 / 撮合深度") : (topicUiResolved.speedDepth || "Speed / Depth"))}</th>
                  <th {...enIfLatin(sourceBoundUi?.baseRates || (isZh ? zhCopy(isHant, "官方基准费率") : (topicUiResolved.baseRates || "Base Rates")), locale)}>{sourceBoundUi?.baseRates || (isZh ? zhCopy(isHant, "官方基准费率") : (topicUiResolved.baseRates || "Base Rates"))}</th>
                  <th {...enIfLatin(sourceBoundUi?.netFee || (isZh ? zhCopy(isHant, "NexuAlpha 净费率") : (topicUiResolved.netFee || "Net Effective Fee")), locale)}>{sourceBoundUi?.netFee || (isZh ? zhCopy(isHant, "NexuAlpha 净费率") : (topicUiResolved.netFee || "Net Effective Fee"))}</th>
                  <th {...enIfLatin(sourceBoundUi?.slippageKyc || (isZh ? zhCopy(isHant, "滑点与入金门槛") : (topicUiResolved.slippageKyc || "Slippage & KYC")), locale)}>{sourceBoundUi?.slippageKyc || (isZh ? zhCopy(isHant, "滑点与入金门槛") : (topicUiResolved.slippageKyc || "Slippage & KYC"))}</th>
                  <th style={{ textAlign: "center" }} {...enIfLatin(sourceBoundUi?.action || (isZh ? zhCopy(isHant, "专属特权与开户") : (topicUiResolved.researchAction || staticUi.action || "Action & Rebate")), locale)}>{sourceBoundUi?.action || (isZh ? zhCopy(isHant, "专属特权与开户") : (topicUiResolved.researchAction || staticUi.action || "Action & Rebate"))}</th>
                </tr>
              </thead>
              <tbody>
                {publicPlatforms.map((p, idx) => {
                  const usePartnerRoute = p.hasPartnerRoute && p.claimStatus === "verified";
                  return (
                  <tr key={idx}>
                    <td>
                      <div className="topic-platform-cell">
                        <span className="topic-platform-name">{topicPlatformDisplayName(p, isHant, isZh)}</span>
                        <span className="topic-platform-type">{sanitizeTopicText(isZh ? zhCopy(isHant, p.category, p.categoryZhHant) : (p.categoryEn || p.category))}</span>
                        <span className="topic-badge-pill">{topicFactsVerified ? (isZh ? zhCopy(isHant, p.badgeZh, p.badgeZhHant) : p.badgeEn) : (isZh ? zhCopy(isHant, "研究定位") : (topicUiResolved.researchContext || "Research context"))}</span>
                      </div>
                    </td>
                    <td>
                      <span className="topic-score-cell">{topicFactsVerified ? p.score : (isZh ? zhCopy(isHant, "待核验") : (topicUiResolved.pending || "Pending"))}</span>
                      {topicFactsVerified && <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}> / 10</span>}
                    </td>
                    <td>{topicFactsVerified ? zhCopy(isHant, p.listingSpeed, p.listingSpeedZhHant) : (isZh ? zhCopy(isHant, "需核对官方公告") : (topicUiResolved.verifyAnnouncements || "Verify official announcements"))}</td>
                    <td style={{ fontFamily: "var(--font-mono, monospace)" }}>{topicFactsVerified ? p.spotFee : (isZh ? zhCopy(isHant, "官方费率待核验") : (topicUiResolved.officialSchedule || "Official schedule to verify"))}</td>
                    <td>
                      <div className="topic-net-fee">{topicFactsVerified ? zhCopy(isHant, p.netFee, p.netFeeZhHant) : (isZh ? zhCopy(isHant, "官方费率待核验") : (topicUiResolved.officialFeeTerms || "Official fee terms to verify"))}</div>
                      {topicFactsVerified && p.rebate > 0 && (
                        <div className="topic-rebate-tag">
                          {isZh ? `${zhCopy(isHant, "已核验")} ${p.rebate}% ${zhCopy(isHant, "终身返佣")}` : `Verified ${p.rebate}% Lifetime Rebate`}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{topicFactsVerified ? zhCopy(isHant, p.slippage, p.slippageZhHant) : (isZh ? zhCopy(isHant, "需按市场状态核验") : (topicUiResolved.verifyMarket || "Verify current market conditions"))}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>{topicFactsVerified ? zhCopy(isHant, p.barrier, p.barrierZhHant) : (isZh ? zhCopy(isHant, "地区与 KYC 条件待核验") : (topicUiResolved.regionalKyc || "Regional and KYC terms to verify"))}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <a
                        href={usePartnerRoute ? p.affiliateUrl : profileHref(p.slug)}
                        target={usePartnerRoute ? "_blank" : undefined}
                        rel={usePartnerRoute ? (p.hasReferral ? "sponsored noopener noreferrer" : "noopener noreferrer") : undefined}
                        className="topic-cta-btn"
                        data-cta-kind={usePartnerRoute ? "registration" : "research"}
                        data-cta-platform={p.slug}
                        data-cta-placement="topic-showdown"
                        data-cta-status={p.claimStatus}
                        data-growth-decision={p.slug}
                        data-growth-placement="topic-showdown"
                      >
                        <span>{usePartnerRoute ? (isZh ? zhCopy(isHant, "直达官方开户") : ({ ja: "公式口座開設へ", ko: "공식 가입 페이지 열기", tr: "Resmi hesap açma sayfası", ru: "Открыть официальный аккаунт", ar: "فتح الحساب الرسمي", id: "Buka akun resmi", vi: "Mở tài khoản chính thức", "pt-BR": "Abrir conta oficial", es: "Abrir cuenta oficial", fr: "Ouvrir le compte officiel", de: "Offizielles Konto öffnen", it: "Apri il conto ufficiale" }[locale] || "Open official account")) : (isZh ? zhCopy(isHant, "先核对平台档案", "先核對平台檔案") : ({ ja: "サービスプロフィールを確認", ko: "플랫폼 프로필 확인", tr: "Platform profilini incele", ru: "Открыть профиль площадки", ar: "مراجعة ملف المنصة", id: "Tinjau profil platform", vi: "Xem hồ sơ nền tảng", "pt-BR": "Revisar perfil da plataforma", es: "Revisar perfil de la plataforma", fr: "Vérifier le profil de la plateforme", de: "Plattformprofil prüfen", it: "Controlla il profilo della piattaforma" }[locale] || "Review venue profile"))}</span>
                        <span>→</span>
                      </a>
                      {usePartnerRoute && p.inviteCode && p.inviteCode !== "N/A" && (
                        <div style={{ fontSize: "0.6875rem", color: "#94a3b8", marginTop: "4px" }}>
                          {isZh ? `${zhCopy(isHant, "邀请码")}: ${p.inviteCode}` : `Code: ${p.inviteCode}`}
                        </div>
                      )}
                      {p.bonus && (
                        <div style={{ fontSize: "0.6875rem", color: "#f59e0b", marginTop: "2px" }}>
                          {isZh ? zhCopy(isHant, p.bonus, p.bonusZhHant) : p.bonus}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 真实避坑与资金安全防范 */}
        <section className="topic-section">
          <div className="topic-section__header">
            <h2 className="topic-section__title">
              <span></span>
              <span {...enIfLatin(isZh ? zhCopy(isHant, "实战避坑与资金安全防范指南") : (staticUi.pitfallTitle || "Real-World Pitfalls & Security Playbook"), locale)}>{isZh ? zhCopy(isHant, "实战避坑与资金安全防范指南") : (staticUi.pitfallTitle || "Real-World Pitfalls & Security Playbook")}</span>
            </h2>
            <p className="topic-section__subtitle">
              {sourceBoundUi?.pitfallLead || (isZh
                ? zhCopy(isHant, "来自量化交易员与机构安全专家的血泪教训总结，守护本金万无一失。")
                : localizedPitfallLead(locale))}
            </p>
          </div>

          <div className="topic-pitfalls-grid">
            {localizedPitfalls.map((pitfall, index) => (
              <article key={index} className="topic-pitfall-card" {...enIfLatin(isZh ? "" : pitfall.titleEn, locale)}>
                <h3>{isZh ? zhCopy(isHant, pitfall.titleZh, pitfall.titleZhHant) : pitfall.titleEn}</h3>
                <p>{isZh ? zhCopy(isHant, pitfall.descZh, pitfall.descZhHant) : pitfall.descEn}</p>
              </article>
            ))}
          </div>
        </section>
        </TopicDisclosure>

        {/* 赛道专属 Zero-Click FAQ */}
        <TopicDisclosure title={topicUiResolved?.faqOpen || (isZh ? zhCopy(isHant, "展开专题核心问答") : "Open the topic FAQ")} className="topic-section-disclosure">
        <section className="topic-section">
          <div className="topic-section__header">
            <h2 className="topic-section__title">
              <span></span>
              <span {...enIfLatin(isZh ? zhCopy(isHant, "细分赛道核心问答 (Zero-Click FAQ)") : (staticUi.faqTitle || "Niche Track Direct FAQ"), locale)}>{isZh ? zhCopy(isHant, "细分赛道核心问答 (Zero-Click FAQ)") : (staticUi.faqTitle || "Niche Track Direct FAQ")}</span>
            </h2>
            <p className="topic-section__subtitle">
              {isZh
                ? zhCopy(isHant, "直达最关键交易决策，拒绝模棱两可与营销套话。", "直達最關鍵交易決策，拒絕模稜兩可與行銷套話。")
                : (staticUi.faqLead || "Actionable answers designed for zero ambiguity and immediate trading clarity.")}
            </p>
          </div>

          <div className="topic-faq-list">
            {localizedFaqs.map((faq, index) => (
              <div key={faq.id || index} className="topic-faq-item" {...enIfLatin(faq.question ?? (isZh ? "" : faq.qEn), locale)}>
                <h3 className="topic-faq-q">
                  <span>Q{index + 1}:</span>
                  <span>{faq.question ?? (isZh ? zhCopy(isHant, faq.qZh, faq.qHant) : faq.qEn)}</span>
                </h3>
                <p className="topic-faq-a">{faq.answer ?? (isZh ? zhCopy(isHant, faq.aZh, faq.aHant) : faq.aEn)}</p>
                {faq.sources?.map(source => (
                  <p className="topic-faq-a" key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>
                    {' · '}{(TOPIC_FAQ_SOURCE_COPY[locale] || TOPIC_FAQ_SOURCE_COPY.en)[0]}{' '}
                    <time dateTime={source.reviewedAt}>{source.reviewedAt}</time>
                    {source.updatedAt && <>{' · '}{(TOPIC_FAQ_SOURCE_COPY[locale] || TOPIC_FAQ_SOURCE_COPY.en)[1]}{' '}<time dateTime={source.updatedAt}>{source.updatedAt}</time></>}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>
        </TopicDisclosure>

        <NextDecisionBridge
          className="topic-next-decision-bridge"
          locale={locale}
          market={market}
          product={product}
          profileSlug={publicPlatforms[0]?.slug}
          profileLabel={topicPlatformDisplayName(publicPlatforms[0], isHant, isZh)}
          compareSlugs={topicBridgeCompareSlugs}
          placement="topic-next-decision-bridge"
          decision={topic.slug}
        />

        <TopicDisclosure title={nextDecisionBridgeCopy(locale).telegram} className="topic-telegram-disclosure" desktopDefaultOpen={false}>
        <OnsiteTelegramBotHandoff
          canonicalPath={topicCanonicalPath}
          locale={locale}
          market={market}
          product={product}
          returnRoute={topicCanonicalPath}
          placement={`topic-onsite-bot-handoff-${topic.slug}`}
        />

        {/* Telegram 来源核验终端 */}
        <div className="topic-tg-box">
          <div className="topic-tg-content">
            <h3>{isZh ? ` ${zhCopy(isHant, "Telegram 来源核验指令")}` : (staticUi.telegramTitle || " Telegram Source Commands")}</h3>
            <p>
              {isZh
                ? zhCopy(isHant, "在移动端向 NexuAlpha 机器人发送指令，打开费率、活动和官方来源核对入口。")
                : (staticUi.telegramBody || "Use the NexuAlpha bot to open fee, activity and official-source review paths on mobile.")}
            </p>
            <div className="topic-tg-commands">
              {localizedTelegramCommands.map((tg, index) => (
                <div key={index} className="topic-tg-cmd-row" {...enIfLatin(isZh ? "" : tg.descEn, locale)}>
                  <span className="topic-tg-code">{tg.cmd}</span>
                  <span className="topic-tg-cmd-desc">{!topicOffersVerified && /返佣|rebate/i.test(`${tg.descZh} ${tg.descEn}`)
                    ? (isZh ? zhCopy(isHant, "查看官方费率与用户条件") : "Check official fees and user terms")
                    : (isZh ? zhCopy(isHant, tg.descZh, tg.descZhHant) : tg.descEn)}</span>
                </div>
              ))}
            </div>
          </div>
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="topic-tg-btn"
            data-cta-kind="telegram"
            data-cta-placement="topic-telegram-source-review"
            data-growth-decision="telegram_topic_review"
            data-growth-placement="topic-telegram"
            data-growth-market={market}
            data-growth-product={product}
          >
            <span>{isZh ? zhCopy(isHant, "唤醒电报机器人") : (staticUi.telegramButton || telegramTopicCta)}</span>
            <span>↗</span>
          </a>
        </div>

        </TopicDisclosure>

        {/* 底部全赛道矩阵快速导航 (Topic Matrix Switcher) */}
        <TopicDisclosure title={topicUiResolved?.moreOpen || (isZh ? zhCopy(isHant, "展开更多赛道专题") : "Explore more topic tracks")} className="topic-section-disclosure topic-matrix-disclosure">
        <section className="topic-section">
          <div className="topic-section__header">
            <h2 className="topic-section__title">
              <span></span>
              <span {...enIfLatin(sharedTruthTopicUi?.matrixTitle || (isZh ? zhCopy(isHant, "探索更多高频交易细分赛道专题") : (staticUi.matrixTitle || "Explore More Quantitative Topic Tracks")), locale)}>{sharedTruthTopicUi?.matrixTitle || (isZh ? zhCopy(isHant, "探索更多高频交易细分赛道专题") : (staticUi.matrixTitle || "Explore More Quantitative Topic Tracks"))}</span>
            </h2>
            <p className="topic-section__subtitle">
              {sourceBoundUi?.matrixLead || (isZh
                ? zhCopy(isHant, "深度横评不同交易场景下的最优解，全面消除手续费暗亏与合规盲区。")
                : (staticUi.matrixLead || "Discover specialized exchange benchmarks tailored to your exact trading strategy."))}
            </p>
          </div>

          <div className="topic-matrix-grid">
            {otherSlugs.map((otherSlug) => {
              const other = sanitizeTopicValue(TOPIC_GUIDES[otherSlug]);
              const otherSummary = topicSummaryFor(otherSlug, locale, other);
              return (
                <a key={otherSlug} href={formatHref(otherSlug)} className="topic-matrix-card" {...enIfLatin(isZh ? "" : otherSummary.title, locale)}>
                  <div className="topic-matrix-card__tag">{isZh ? topicZhField(other, "category", isHant) : otherSummary.category}</div>
                  <h3 className="topic-matrix-card__title">{isZh ? topicZhField(other, "title", isHant) : otherSummary.title}</h3>
                  <p className="topic-matrix-card__desc">{isZh ? topicZhField(other, "desc", isHant) : otherSummary.description}</p>
                  <span className="topic-matrix-card__arrow">
                    {sharedTruthTopicUi?.topicCardAction ? `${sharedTruthTopicUi.topicCardAction} →` : isHant ? "檢視專題指南 →" : isZh ? `${zhCopy(isHant, "查看量化选型白皮书")} →` : topicCta}
                  </span>
                </a>
              );
            })}
          </div>
        </section>
        </TopicDisclosure>
      </div>
    </main>
  );
}
