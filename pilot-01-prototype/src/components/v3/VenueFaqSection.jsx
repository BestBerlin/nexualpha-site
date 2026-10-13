import { useState } from "react";
import { SourceLink } from "../shared/SourceLink.jsx";
import { SectionRule } from "../shared/DataRule.jsx";
import { venueKycLevel, venueKycSummary } from "../../data/venue-kyc-corrections.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { researchForVenue } from "../../data/exchange-research";
import { buildVenueFeeSummary } from "../../data/venue-fee-summary.js";
import { reviewedFeeCopy } from "../../data/reviewed-fee-copy.js";
import { feePctOfRate } from "../../data/exchange-facts.js";
import { matrixCopy } from "./exchange-matrix-copy.js";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { priorityVenueAnswerFor } from "../../data/priority-venue-answers.js";
import { partnerVenueFaqFor } from "../../data/partner-venue-faq.js";
import { venueFallbackFaqEntries } from "../../data/venue-faq-fallback.js";

const localeKey = (locale) => {
  const value = String(locale || "");
  if (value.toLowerCase() === "pt-br") return "pt-BR";
  return value.split("-")[0];
};

const localePending = (locale, zh = "待官方来源核验") => String(locale || "").startsWith("zh") ? zh : ({ ja: "公式ソース確認待ち", ko: "공식 출처 확인 대기", tr: "Resmi kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso", es: "Pendiente de verificación de la fuente", "pt-BR": "Aguardando verificação da fonte",
// l10n: needs native review
ur: "سرکاری ماخذ کی تصدیق باقی ہے",
// l10n: needs native review
uk: "Очікує перевірки офіційного джерела" }[localeKey(locale)] || "Pending official-source verification");

function publicVenueAccess(slug, locale = "en", market) {
  const publicCta = publicCtaForVenue(slug, locale, market);
  return {
    db: publicCta.db,
    partner: publicCta.partner,
    officialDomain: publicCta.officialDomain,
    inviteCode: publicCta.inviteCode,
    hasReferral: publicCta.hasReferral,
    rebatePercent: publicCta.rebatePercent,
    registrationUrl: publicCta.registrationUrl,
    benefitText: publicCta.benefit,
    commercialClaim: publicCta.commercialClaim,
  };
}

const venueFaqFeeCopyTable = {
  "zh-Hans": { pendingRate: "费率待官方来源核验" },
  "zh-Hant": { pendingRate: "費率待官方來源核驗" },
  en: { pendingRate: "Fee pending official-source verification" },
  es: { pendingRate: "Comisión pendiente de verificación oficial" },
  "pt-BR": { pendingRate: "Taxa pendente de verificação oficial" },
  fr: { pendingRate: "Frais en attente de source officielle" },
  de: { pendingRate: "Gebühr wartet auf offizielle Quellenprüfung" },
  ja: { pendingRate: "手数料は公式ソース確認待ち" },
  ko: { pendingRate: "수수료 공식 출처 확인 대기" },
  ar: { pendingRate: "الرسوم بانتظار مصدر رسمي" },
  tr: { pendingRate: "Ücret resmi kaynak doğrulaması bekliyor" },
  ru: { pendingRate: "Комиссия ожидает официального источника" },
  id: { pendingRate: "Biaya menunggu verifikasi sumber resmi" },
  vi: { pendingRate: "Phí chờ xác minh nguồn chính thức" },
  it: { pendingRate: "Commissione in attesa di fonte ufficiale" },
  // l10n: needs native review
  ur: { pendingRate: "فیس کے لیے سرکاری ماخذ کی تصدیق باقی ہے" },
  // l10n: needs native review
  uk: { pendingRate: "Комісія очікує перевірки офіційного джерела" },
};

const venueFaqFeeCopy = (locale) => venueFaqFeeCopyTable[locale] || venueFaqFeeCopyTable[localeKey(locale)] || (String(locale || "").startsWith("zh") ? venueFaqFeeCopyTable["zh-Hans"] : venueFaqFeeCopyTable.en);

const publishableFeeRate = (summary, product, locale = "en") => {
  const rate = summary.rates.find((item) => item.product === product);
  if (!rate) return null;
  const scope = reviewedFeeCopy(rate, locale);
  // One formatter (exchange-facts.js), maker first and labelled.
  const pair = `${feePctOfRate(rate.makerRate, locale)} / ${feePctOfRate(rate.takerRate, locale)} (${matrixCopy(locale).maker})`;
  return { ...rate, publishable: true, display: `${pair} · ${scope.tier} · ${scope.scope}`, conditions: scope.conditions };
};

function getVenueFaqs(venue, profile, locale, db, partner, market) {
  const isZh = locale.startsWith("zh");
  const zh = (hans, hant) => locale === "zh-Hant" ? hant : hans;
  const locName = getLocalizedVenueName(venue, locale) || profile.name;
  const name = locName || venue.name || profile.name;
  const feeCopy = venueFaqFeeCopy(locale);
  const feeSummary = buildVenueFeeSummary(db, researchForVenue(venue.slug, locale) || {});
  const spotRate = publishableFeeRate(feeSummary, "spot", locale);
  const futuresRate = publishableFeeRate(feeSummary, "futures", locale);
  const spotFee = spotRate?.display || feeCopy.pendingRate;
  const futuresFee = futuresRate?.display || feeCopy.pendingRate;
  const access = publicVenueAccess(venue.slug, locale, market);
  const benefitVerified = access.commercialClaim.status === "verified";
  const rebate = benefitVerified ? access.rebatePercent : null;
  const inviteCode = access.inviteCode;
  const porRatio = db.porVerifiedAt && db.porAuditUrl ? (db.porCoverageRatio || (db.proofOfReserves ? "100%+" : (isZh ? zh("智能合约透明托管", "智能合約透明託管") : "Smart Contract Custody"))) : localePending(locale);
  const porUrl = db.porAuditUrl;
  const securityFund = db.securityFund || (isZh ? zh("投资者风险保护基金", "投資者風險保護基金") : "Risk Protection Fund");
  const officialDomain = partner.officialDomain || db.officialDomain || null;
  // Sourced KYC corrections (venue-kyc-corrections.js) win over the hash-pinned registry values.
  const kycDb = { ...db, kycLevel: venueKycLevel(venue.slug, db), kycSummary: venueKycSummary(venue.slug, db) };
  const kycSummary = isZh
    ? (kycDb.kycSummary?.[locale] || kycDb.kycSummary?.["zh-Hans"] || (kycDb.kycLevel === "none" ? "完全免 KYC（仅邮箱注册）" : "基础实名认证（证件上传 + 人脸核验）"))
    : (kycDb.kycSummary?.[locale] || kycDb.kycSummary?.en || (kycDb.kycLevel === "none"
      ? ({ ja: "KYC不要（メールのみ）", ko: "KYC 불필요(이메일만)", tr: "KYC gerekmez (yalnızca e-posta)", fr: "KYC non requis (e-mail uniquement)", de: "Kein KYC erforderlich (nur E-Mail)", es: "No se requiere KYC (solo correo)", "pt-BR": "KYC não exigido (apenas e-mail)", ru: "KYC не требуется (только электронная почта)", ar: "لا يلزم التحقق (البريد الإلكتروني فقط)", id: "KYC tidak diperlukan (hanya email)", vi: "Không cần KYC (chỉ email)", it: "KYC non richiesto (solo email)",
      // l10n: needs native review
      ur: "KYC درکار نہیں (صرف ای میل)",
      // l10n: needs native review
      uk: "KYC не потрібен (лише електронна пошта)" }[localeKey(locale)] || "No KYC Required (Email Only)")
      : ({ ja: "標準本人確認", ko: "표준 신원 인증", tr: "Standart kimlik doğrulama", fr: "Vérification d’identité standard", de: "Standard-Identitätsprüfung", es: "Verificación de identidad estándar", "pt-BR": "Verificação de identidade padrão", ru: "Стандартная проверка личности", ar: "تحقق قياسي من الهوية", id: "Verifikasi identitas standar", vi: "Xác minh danh tính tiêu chuẩn", it: "Verifica dell’identità standard",
      // l10n: needs native review
      ur: "معیاری شناختی تصدیق",
      // l10n: needs native review
      uk: "Стандартна перевірка особи" }[localeKey(locale)] || "Standard Identity Verification")));

  // Historical FAQ copy contains operational and commercial assertions that
  // cannot be published without a dedicated, dated review record. The public
  // fallback uses direct recorded fields only, and shares its source with schema.
  if (!db.faqSourceReviewedAt) {
    return venueFallbackFaqEntries({
      venue: db,
      name,
      locale,
      officialDomain,
    }).map((entry) => ({ q: entry.question, a: <p>{entry.answer}</p> }));
  }

  if (isZh) {
    return [
      {
        q: zh(`${locName} 现货与合约手续费如何核对？用户权益在哪里确认？`, `${locName} 現貨與合約手續費如何核對？用戶權益在哪裡確認？`),
        a: (
          <>
            <p>
              <strong>{locName} 手續費應先固定交易類型、Maker/Taker 和帳戶等級。</strong>官方基準現貨為 <strong>{spotFee}</strong>，合約為 <strong>{futuresFee}</strong>{benefitVerified && rebate > 0 && inviteCode ? <>；透過 NexuAlpha 綁定專屬合作邀請碼 <span className="v3-faq-code-chip">{inviteCode}</span>，按平台已核驗條件顯示 <strong>{rebate}%</strong> 用戶手續費權益</> : <>；用戶權益與帳戶資格需在平台官方頁面內核驗</>}。
            </p>
            <div className="v3-faq-highlight-box">
              <strong>費用核對口徑：</strong>本站只展示面向用戶的公開費率、邀請碼與適用條件；不同平台的到帳、活動和帳戶限制以官方頁面為準。
            </div>
          </>
        ),
      },
      {
        q: zh(`${locName} 跑路与破产风险如何？如何自主验证 Merkle Tree 储备金证明 (Proof of Reserves)？`, `${locName} 跑路與破產風險如何？如何自主驗證 Merkle Tree 儲備金證明 (Proof of Reserves)？`),
        a: (
          <>
            <p>
              <strong>{locName} 的儲備金與償付能力應以目前官方披露為準；本頁記錄狀態為 <span style={{ color: "#32d583" }}>{porRatio}</span>。</strong>{db.porVerifiedAt && db.porAuditUrl ? `可透過官方報告和可複核快照檢查 ${securityFund} 等信息。` : "目前沒有記錄可複核的官方來源，不把儲備比例、保險或兌付能力寫成保證。"}
            </p>
            <div className="v3-faq-highlight-box">
              <strong>3 步自主驗資流程：</strong>
              <br />
              1. 登入 {locName} 官網進入「資產儲備證明 (PoR)」專區；
              <br />
              2. 取得屬於您帳戶當期快照的專屬匿名 Merkle 路徑雜湊（Leaf Hash）；
              <br />
              3. 使用開源雜湊驗證腳本與鏈上公示的 Merkle Root 根雜湊逐層比對，數學證明您的資金全額在庫。
            </div>
            {db.porAuditUrl && (
              <p>
                 <SourceLink locale={locale} market={market} href={porUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#53b1fd", textDecoration: "underline" }}>查看 {locName} 官方最新驗資報告與公開稽核公示 ↗</SourceLink>
              </p>
            )}
          </>
        ),
      },
      {
        q: `${locName} 中国大陆与海外华人用户是否需要强制实名认证 (KYC)？出入金如何防冻卡？`,
        a: (
          <>
            <p>
              <strong>{locName} 准入认证级别为：{kycSummary}</strong>。用户使用本人有效居民身份证、护照即可在 3~5 分钟内完成标准认证，开通全部现货、合约及法币出入金权限；C2C 防冻卡核心为“选 2000+ 成单/99.5% 好评神盾商户 + 专卡专用 + 严禁敏感转账备注”。
            </p>
            <div className="v3-faq-highlight-box">
              <strong>P2P 出入金防冻卡实战法则：</strong>
              <br />
              • <strong>商户筛选：</strong>C2C 买卖币时，只选择注册超 1 年、成单量超 2000 笔、好评率 99.5% 以上的“神盾/蓝盾”认证做市商；
              <br />
              • <strong>专卡专用：</strong>使用本人实名认证的一类银行卡或微信/支付宝账户，严禁替他人代付或代收；
              <br />
              • <strong>隔离沉淀：</strong>出金后资金切勿立即用于还信用卡或房贷，建议购买 3~7 天国债理财或货币基金进行二次隔离；
              <br />
              • <strong>严禁敏感词：</strong>银行转账附言中严禁出现任何“BTC、USDT、数字货币、开户”等违规词汇。
            </div>
          </>
        ),
      },
      {
        q: `遇到假冒 ${locName} 的钓鱼网站与李鬼客服怎么办？如何快速验证官方正规网址？`,
        a: (
          <>
            <p>
              <strong>{locName} 当前来源记录中的主域名为 <code>{officialDomain}</code>，官方客服绝不主动私信索要私钥或 2FA 验证码。</strong>快速验真核心步骤：认准官方主域名、开启邮箱专属防钓鱼码、通过 NexuAlpha 记录入口进行核对，坚决不点击搜索引擎置顶赞助广告与 TG 私聊假客服。
            </p>
            <div className="v3-faq-highlight-box">
              <strong>反钓鱼四大安全防线：</strong>
              <br />
              1. <strong>认准主域名：</strong>{locName} 官方正规主网址为 <code style={{ color: "#53b1fd" }}>{officialDomain}</code>，首次访问务必收藏书签；
              <br />
              2. <strong>防钓鱼码 (Anti-Phishing Code)：</strong>在平台【安全中心】立即设置 4~20 位的防钓鱼识别码，设置后平台发出的所有官方邮件均会携带此专属暗号；
              <br />
              3. <strong>官方验真通道：</strong>可通过官方提供的验真工具输入网址、TG账号、邮箱或电话进行真伪核实；
              <br />
              4. <strong>来源记录边界：</strong>NexuAlpha 黄页只展示已记录的官方域名或合作入口；打开后仍需核对浏览器地址栏和平台页面提示。
            </div>
          </>
        ),
      },
    ];
  }

  return [
    {
      q: ({
        ja: `${name} の現物・先物手数料はどこで確認できますか？`,
        ko: `${name} 현물·선물 수수료는 어디에서 확인하나요?`,
        tr: `${name} spot ve vadeli ücretleri nerede doğrulanır?`,
        es: `¿Dónde verificar las comisiones spot y futures de ${name}?`,
        "pt-BR": `Onde verificar as taxas spot e futuros da ${name}?`,
        fr: `Où vérifier les frais spot et futures de ${name} ?`,
        de: `Wo prüfe ich Spot- und Futures-Gebühren von ${name}?`,
        ru: `Где проверить спотовые и фьючерсные комиссии ${name}?`,
        ar: `أين أتحقق من رسوم التداول الفوري والعقود الآجلة في ${name}؟`,
        id: `Di mana memeriksa biaya spot dan futures ${name}?`,
        vi: `Xác minh phí giao ngay và hợp đồng tương lai của ${name} ở đâu?`,
        it: `Dove verificare le commissioni spot e futures di ${name}?`,
        // l10n: needs native review
        ur: `${name} کی spot اور futures فیس کہاں تصدیق کریں؟`,
        // l10n: needs native review
        uk: `Де перевірити спотові та ф’ючерсні комісії ${name}?`,
      }[localeKey(locale)] || `What are ${name}'s spot & futures fees? Where can I verify user fee benefits via NexuAlpha?`),
      a: (
        <>
          <p>
            <strong>Compare {name}'s fee by fixing market type, Maker/Taker side, and account tier first.</strong> Base spot is <strong>{spotFee}</strong> and futures is <strong>{futuresFee}</strong>{benefitVerified && rebate > 0 && inviteCode ? <>; partner code <span className="v3-faq-code-chip">{inviteCode}</span> follows verified <strong>{rebate}%</strong> user fee benefit terms</> : <>; user benefits and account eligibility must be verified on the official platform</>}.
          </p>
          <div className="v3-faq-highlight-box">
            <strong>Fee review scope:</strong> NexuAlpha shows public user-facing fees, invite codes, and conditions. Final account limits and benefit settlement follow each platform's official page.
          </div>
        </>
      ),
    },
    {
      q: `What is ${name}'s solvency & safety track record? How to verify its Merkle Tree Proof of Reserves?`,
      a: (
        <>
          <p>
            <strong>{name}'s reserve and solvency information requires verification against the latest official disclosure and a reproducible source</strong>; this page does not guarantee 1:1 backing or redemption during extreme markets.
          </p>
          <div className="v3-faq-highlight-box">
            <strong>3-Step Self-Verification:</strong>
            <br />
            1. Access the official "Proof of Reserves (PoR)" portal on {name}'s verified domain;
            <br />
            2. Retrieve your account's cryptographic Merkle Path and leaf hash from the monthly snapshot;
            <br />
            3. Run open-source verification scripts to validate inclusion against the audited on-chain Merkle Root.
          </div>
          {db.porAuditUrl && (
            <p>
               <SourceLink locale={locale} market={market} href={porUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#53b1fd", textDecoration: "underline" }}>View {name}'s Official Audited Reserves Report ↗</SourceLink>
            </p>
          )}
        </>
      ),
    },
    {
      q: `Is KYC verification mandatory on ${name}? How safe are fiat deposits and withdrawals?`,
      a: (
        <>
          <p>
            <strong>{name}'s verification requirement: {kycSummary}</strong>. Identity verification takes 3–5 minutes with a government-issued passport or national ID to unlock full trading limits and fiat gateways; prevent bank flags by using strict legal name matching and zero crypto memo notes.
          </p>
          <div className="v3-faq-highlight-box">
            <strong>Fiat Security & Anti-Fraud Rules:</strong>
            <br />
            • <strong>Merchant Vetting:</strong> Use reviewed P2P merchants with clear tenure, completed-order history, and completion-rate records;
            <br />
            • <strong>Strict Identity Matching:</strong> Ensure the bank account strictly matches your verified platform legal name;
            <br />
            • <strong>Zero Crypto Remarks:</strong> Never include crypto terms (BTC, USDT) in bank transfer descriptions.
          </div>
        </>
      ),
    },
    {
      q: `How to avoid fake ${name} phishing sites and verify official domains & Telegram groups?`,
      a: (
        <>
          <p>
            <strong>The authentic verified domain for {name} is <code>{officialDomain}</code>; official support never DMs users or asks for seed phrases/2FA.</strong> Protect yourself by bookmarking the official domain, configuring an Anti-Phishing email code, and routing through NexuAlpha verified links.
          </p>
          <div className="v3-faq-highlight-box">
            <strong>Anti-Phishing Protections:</strong>
            <br />
            1. <strong>Primary Domain:</strong> Verify you are on the authentic URL: <code style={{ color: "#53b1fd" }}>{officialDomain}</code>;
            <br />
            2. <strong>Anti-Phishing Code:</strong> Set a custom security phrase in platform settings displayed on all genuine emails;
            <br />
            3. <strong>Verification Hub:</strong> Use the official channel verifier to check unknown URLs, emails, or Telegram handles;
            <br />
            4. <strong>NexuAlpha Whitelist:</strong> All outbound links on NexuAlpha are cryptographically validated against official APIs.
          </div>
        </>
      ),
    },
  ];
}

export function VenueFaqSection({ venue, profile, locale, market, db = {}, partner = {} }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant";
  const priorityAnswer = priorityVenueAnswerFor(venue.slug, locale);
  const faqs = priorityAnswer ? priorityAnswer.faq.map(([q, answer, citations = []]) => ({
    q,
    a: <><p>{answer}</p><p className="v3-venue-direct-answer__links">{citations.map((href) => <SourceLink locale={locale} market={market} key={href} href={href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="venue-faq-source">{(() => { const label = priorityAnswer.sources.find(([, url]) => url === href)?.[0]; return label ? <span {...(/^[\x20-\x7e]+$/.test(label) ? { translate: "no", lang: "en" } : {})}>{label}</span> : (isZh ? "官方来源" : (locale === "es" ? "Fuente oficial" : "Official source")); })()} ↗</SourceLink>)}</p></>,
  })) : getVenueFaqs(venue, profile, locale, db, partner, market);
  // Localized partner FAQ (src/data/partner-venue-faq.js): the same entries feed the FAQPage schema.
  const partnerFaq = partnerVenueFaqFor(venue.slug, locale);
  const partnerAccess = partnerFaq ? publicVenueAccess(venue.slug, locale, market) : null;
  const partnerFaqEntries = (partnerFaq?.entries || []).filter((entry) => partnerAccess?.hasReferral || !entry.showsInviteCode);
  const partnerFaqItems = partnerFaqEntries.map((entry) => ({
    q: entry.question,
    a: <><p>{entry.answer}</p><p className="v3-venue-direct-answer__links">{entry.sources.map(([label, href]) => <SourceLink locale={locale} market={market} key={href} href={href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="venue-faq-source"><span {...(/^[\x20-\x7e]+$/.test(label) ? { translate: "no", lang: "en" } : {})}>{label}</span> ↗</SourceLink>)}</p></>,
  }));
  const hasPartnerFaqItems = partnerFaqItems.length > 0;
  const shownFaqs = !hasPartnerFaqItems ? faqs : partnerFaq.mode === "replace" ? partnerFaqItems : [...faqs, ...partnerFaqItems.filter((item) => !faqs.some((existing) => existing.q === item.q))];
  const usePriorityUi = Boolean(priorityAnswer || partnerFaq?.mode === "replace");
  const locName = getLocalizedVenueName(venue, locale) || profile.name;
  const priorityUiByLocale = {
    "en": { eyebrow: "Before you trade", title: `${locName} cost and access questions`, lead: "Read each answer with its supporting official sources.", more: "Show remaining questions", less: "Show fewer questions" },
    "zh-Hans": { eyebrow: "交易前常见问题", title: `${locName} 费用与使用条件问答`, lead: "按具体问题查看答案及对应官方来源。", more: "查看其余问题", less: "收起其余问题" },
    "zh-Hant": { eyebrow: "交易前常見問題", title: `${locName} 費用與使用條件問答`, lead: "按具體問題查看答案及對應官方來源。", more: "查看其餘問題", less: "收起其餘問題" },
    "ja": { eyebrow: "利用前のよくある質問", title: `${locName} の費用と利用条件に関する質問`, lead: "各回答と対応する公式情報を確認してください。", more: "残りの質問を表示", less: "質問を折りたたむ" },
    "ko": { eyebrow: "이용 전 자주 묻는 질문", title: `${locName} 비용 및 이용 조건 질문`, lead: "각 답변과 해당 공식 출처를 함께 확인하세요.", more: "나머지 질문 보기", less: "질문 접기" },
    "tr": { eyebrow: "Kullanmadan önce", title: `${locName}: maliyet ve erişim soruları`, lead: "Her yanıtı ilgili resmi kaynaklarla birlikte okuyun.", more: "Kalan soruları göster", less: "Daha az soru göster" },
    "ar": { eyebrow: "أسئلة قبل الاستخدام", title: `أسئلة حول تكاليف وشروط استخدام ${locName}`, lead: "اقرأ كل إجابة مع مصادرها الرسمية الداعمة.", more: "عرض الأسئلة المتبقية", less: "عرض أسئلة أقل" },
    "es": { eyebrow: "Antes de usar la plataforma", title: `Preguntas sobre costes y acceso a ${locName}`, lead: "Lee cada respuesta junto con sus fuentes oficiales.", more: "Mostrar las preguntas restantes", less: "Mostrar menos preguntas" },
    "pt-BR": { eyebrow: "Antes de usar a plataforma", title: `Perguntas sobre custos e acesso à ${locName}`, lead: "Leia cada resposta com as fontes oficiais correspondentes.", more: "Mostrar as perguntas restantes", less: "Mostrar menos perguntas" },
    "fr": { eyebrow: "Avant utilisation", title: `Questions sur les coûts et l’accès à ${locName}`, lead: "Consultez chaque réponse avec ses sources officielles.", more: "Afficher les questions restantes", less: "Afficher moins de questions" },
    "de": { eyebrow: "Vor der Nutzung", title: `Fragen zu Kosten und Zugang bei ${locName}`, lead: "Lesen Sie jede Antwort zusammen mit den zugehörigen offiziellen Quellen.", more: "Weitere Fragen anzeigen", less: "Weniger Fragen anzeigen" },
    "ru": { eyebrow: "Перед использованием", title: `Вопросы о расходах и условиях доступа к ${locName}`, lead: "Читайте каждый ответ вместе с соответствующими официальными источниками.", more: "Показать остальные вопросы", less: "Показать меньше вопросов" },
    "id": { eyebrow: "Sebelum menggunakan platform", title: `Pertanyaan biaya dan akses ${locName}`, lead: "Baca setiap jawaban beserta sumber resmi yang mendukungnya.", more: "Tampilkan pertanyaan lainnya", less: "Tampilkan lebih sedikit pertanyaan" },
    "vi": { eyebrow: "Trước khi sử dụng", title: `Câu hỏi về chi phí và điều kiện sử dụng ${locName}`, lead: "Đọc từng câu trả lời cùng nguồn chính thức tương ứng.", more: "Xem các câu hỏi còn lại", less: "Thu gọn câu hỏi" },
    "it": { eyebrow: "Prima dell’utilizzo", title: `Domande su costi e accesso a ${locName}`, lead: "Leggi ogni risposta insieme alle relative fonti ufficiali.", more: "Mostra le domande rimanenti", less: "Mostra meno domande" },
    // l10n: needs native review
    "ur": { eyebrow: "ٹریڈ سے پہلے", title: `${locName} لاگت اور رسائی کے سوالات`, lead: "ہر جواب کو اس کے معاون سرکاری ماخذ کے ساتھ پڑھیں۔", more: "باقی سوالات دکھائیں", less: "کم سوالات دکھائیں" },
    // l10n: needs native review
    "uk": { eyebrow: "Перед торгівлею", title: `Питання про вартість і доступ до ${locName}`, lead: "Читайте кожну відповідь разом з офіційними джерелами, що її підтверджують.", more: "Показати решту запитань", less: "Показати менше запитань" },
  };
  const priorityUi = priorityUiByLocale[locale === "zh-Hant" ? "zh-Hant" : isZh ? "zh-Hans" : localeKey(locale)] || priorityUiByLocale.en;
  const faqUi = {
    ja: { eyebrow: "高意向FAQと安全ガイド", title: `${locName} の手数料・準備金・安全性 FAQ`, lead: "手数料、準備金、KYC、セキュリティに関する重要な質問へ、出典に基づいて回答します。", more: "すべてのFAQを表示", less: "FAQを折りたたむ" },
    ko: { eyebrow: "핵심 FAQ 및 보안 가이드", title: `${locName} 수수료·준비금·보안 FAQ`, lead: "수수료, 준비금, KYC와 보안에 관한 핵심 질문에 출처를 바탕으로 답합니다.", more: "FAQ 전체 보기", less: "FAQ 접기" },
    tr: { eyebrow: "Yüksek niyetli SSS ve güvenlik rehberi", title: `${locName} ücret, rezerv ve güvenlik SSS`, lead: "Ücretler, rezerv kanıtı, KYC ve güvenlik hakkında kaynaklı yanıtlar.", more: "Tüm SSS'leri göster", less: "SSS'leri daralt" },
    es: { eyebrow: "Preguntas clave y guía de seguridad", title: `Preguntas sobre comisiones, reservas y seguridad de ${locName}`, lead: "Respuestas basadas en fuentes sobre comisiones, reservas, KYC y seguridad.", more: "Mostrar todas las preguntas", less: "Ocultar preguntas" },
    "pt-BR": { eyebrow: "FAQ de alta intenção e guia de segurança", title: `FAQ de taxas, reservas e segurança de ${locName}`, lead: "Respostas baseadas em fontes sobre taxas, reservas, KYC e segurança.", more: "Mostrar todas as perguntas", less: "Ocultar perguntas" },
    fr: { eyebrow: "FAQ prioritaire et guide de sécurité", title: `FAQ sur les frais, réserves et sécurité de ${locName}`, lead: "Réponses sourcées sur les frais, les réserves, le KYC et la sécurité.", more: "Afficher toutes les questions", less: "Réduire les questions" },
    de: { eyebrow: "Wichtige FAQ und Sicherheitsleitfaden", title: `FAQ zu Gebühren, Reserven und Sicherheit von ${locName}`, lead: "Quellenbasierte Antworten zu Gebühren, Reserven, KYC und Sicherheit.", more: "Alle Fragen anzeigen", less: "Fragen einklappen" },
    ru: { eyebrow: "Ключевые вопросы и безопасность", title: `FAQ о комиссиях, резервах и безопасности ${locName}`, lead: "Ответы с источниками о комиссиях, резервах, KYC и безопасности.", more: "Показать все вопросы", less: "Свернуть вопросы" },
    ar: { eyebrow: "أسئلة شائعة ودليل الأمان", title: `أسئلة رسوم واحتياطيات وأمان ${locName}`, lead: "إجابات مسجلة عن الرسوم والاحتياطيات وKYC والأمان.", more: "عرض كل الأسئلة", less: "طي الأسئلة" },
    id: { eyebrow: "FAQ penting dan panduan keamanan", title: `FAQ biaya, cadangan, dan keamanan ${locName}`, lead: "Jawaban berbasis sumber tentang biaya, cadangan, KYC, dan keamanan.", more: "Tampilkan semua pertanyaan", less: "Ciutkan pertanyaan" },
    vi: { eyebrow: "FAQ trọng tâm và hướng dẫn an toàn", title: `FAQ phí, dự trữ và an toàn của ${locName}`, lead: "Câu trả lời có nguồn về phí, dự trữ, KYC và bảo mật.", more: "Hiện tất cả câu hỏi", less: "Thu gọn câu hỏi" },
    it: { eyebrow: "FAQ ad alta intenzione e guida alla sicurezza", title: `FAQ su commissioni, riserve e sicurezza di ${locName}`, lead: "Risposte con fonti su commissioni, riserve, KYC e sicurezza.", more: "Mostra tutte le domande", less: "Riduci le domande" },
    // l10n: needs native review
    ur: { eyebrow: "اہم FAQ اور سکیورٹی گائیڈ", title: `${locName} فیس، reserves اور security FAQ`, lead: "فیس، reserves، KYC اور security پر ماخذ کے ساتھ جوابات۔", more: "تمام FAQ دکھائیں", less: "FAQ سمیٹیں" },
    // l10n: needs native review
    uk: { eyebrow: "Пріоритетні FAQ і гайд безпеки", title: `FAQ про комісії, reserves і security ${locName}`, lead: "Відповіді з джерелами про комісії, reserves, KYC і security.", more: "Показати всі FAQ", less: "Згорнути FAQ" },
  }[localeKey(locale)] || {};
  const nonPriorityUi = isZh ? priorityUi : faqUi;
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  return (
    <section className="v2-section v3-faq-section" id="faq">
      <SectionRule stamp={shownFaqs.length || null} />
      <div className="v3-faq-card">
        <div className="v3-faq-card__header">
          <h2 className="v3-faq-card__title">
            {usePriorityUi ? priorityUi.title : (nonPriorityUi.title || `${profile.name} Fees, Reserves Verification & FAQ`)}
          </h2>
          <p className="v3-faq-card__lead">
            {usePriorityUi ? priorityUi.lead : (nonPriorityUi.lead || "Direct, source-backed answers to critical questions regarding trading fees, Proof of Reserves, KYC, and security.")}
          </p>
        </div>

        <div className="v3-faq-list">
          {shownFaqs.map((faq, idx) => (
            <details key={faq.q} className="v3-faq-item" hidden={idx >= 2 && !showAllFaqs}>
              <summary className="v3-faq-summary">
                <div className="v3-faq-summary-left">
                  <span className="v3-faq-q-text">{faq.q}</span>
                </div>
                <span className="v3-faq-arrow" aria-hidden="true">＋</span>
              </summary>
              <div className="v3-faq-content">{faq.a}</div>
            </details>
          ))}
          {shownFaqs.length > 2 && (
            <button
              type="button"
              className="v3-faq-list__expand"
              aria-expanded={showAllFaqs}
              onClick={() => setShowAllFaqs((value) => !value)}
            >
              {showAllFaqs
                ? (usePriorityUi ? priorityUi.less : isHant ? "收起其餘問題" : isZh ? "收起其余问题" : (faqUi.less || "Show fewer questions"))
                : (usePriorityUi ? `${priorityUi.more} (${shownFaqs.length - 2})` : isHant ? `查看其餘 ${shownFaqs.length - 2} 個問題` : isZh ? `查看其余 ${shownFaqs.length - 2} 个问题` : `${faqUi.more || "Show more questions"} (${shownFaqs.length - 2})`)}
              <span aria-hidden="true">{showAllFaqs ? " ↑" : " ↓"}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
export default VenueFaqSection;
