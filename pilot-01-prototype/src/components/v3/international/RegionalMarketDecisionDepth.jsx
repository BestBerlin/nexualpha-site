import { euMarketDecisionSummary } from "../../../data/eu-market-decision.js";
import { contextualHref } from "../../../data/contextual-href.js";
import { internationalSourcesFor, INTERNATIONAL_SOURCE_REVIEWED_AT } from "../../../data/international-source-registry.js";
import { regionalFundingRowsForMarket } from "../../../data/regional-funding-verification-matrix.js";
import { buildTelegramWebsiteFunnelContext } from "../../../data/telegram-config.js";
import { UK_MARKET_DECISION } from "../../../data/uk-market-decision.js";
import "./regional-market-decision-depth.css";

const MARKET_DEPTH_COPY = {
  US: {
    lang: "en",
    authority: "FinCEN, SEC, CFTC, NMLS/NYDFS and official U.S. platform guidance",
    eyebrow: "UNITED STATES ACCOUNT CHECK",
    title: "Separate USD funding, state support, identity and product scope before signup",
    directAnswer: "United States research should not treat one platform page as a universal account answer. Confirm the service entity, state availability, legal-name bank ownership, ACH, wire, debit-card and withdrawal holds inside the official account flow, then separate spot access from futures, margin or other derivatives products.",
    paymentLabel: "USD rails to verify",
    checksLabel: "Account checks",
    costLabel: "Fees, holds and product limits",
    sourceLabel: "Official research sources",
    unknownLabel: "Keep as unknown",
    nextAction: "Research handoff",
    nextActionText: "Keep market=US and product=spot while comparing public research pages. Use these routes before any external account action.",
    product: "spot",
    researchHandoff: [
      { label: "Open U.S. platform directory", href: "/exchanges", kind: "directory" },
      { label: "Compare Coinbase vs Kraken", href: "/compare/coinbase-vs-kraken", kind: "compare" },
      { label: "Review fee and funding calculator", href: "/rates", kind: "rates" },
      { label: "Send U.S. research context to Telegram", kind: "telegram" },
    ],
  },
  BR: {
    lang: "pt-BR",
    authority: "Banco Central do Brasil and official platform guidance",
    eyebrow: "CHECKLIST BRASIL ANTES DO CADASTRO",
    title: "Separe Pix, CPF, conta bancária, custos e produto antes de sair",
    directAnswer: "No Brasil, a decisão saudável começa antes do clique de cadastro: confirme Pix ou TED, CPF/CNPJ, titularidade bancária, limites, taxa, saque e produto dentro do fluxo oficial da conta. Uma fonte pública ajuda a pesquisar, mas não aprova a conta nem promete benefício.",
    paymentLabel: "Rotas de pagamento a confirmar",
    checksLabel: "Ordem de verificação",
    costLabel: "Custos e prazos",
    sourceLabel: "Fontes oficiais",
    unknownLabel: "Manter como unknown",
    nextAction: "Próxima ação",
    nextActionText: "Abra a comparação Brasil ou a calculadora BRL mantendo market=BR; só depois avance para o domínio oficial.",
  },
  ID: {
    lang: "id",
    authority: "OJK, Bappebti, dan panduan resmi platform Indonesia",
    eyebrow: "PEMERIKSAAN AKUN INDONESIA",
    title: "Pisahkan status badan usaha, KYC, jalur IDR, biaya, dan cakupan produk sebelum memilih",
    directAnswer: "Pengguna Indonesia perlu memulai dari konteks OJK dan Bappebti, lalu mencocokkan badan usaha serta domain resmi. Setelah itu, periksa KYC, domisili, level akun, VA bank, QRIS, wallet, deposit dan penarikan IDR, biaya, hold, waktu proses, serta cakupan spot atau futures di alur akun resmi.",
    paymentLabel: "Jalur IDR yang perlu diverifikasi",
    checksLabel: "Urutan pemeriksaan akun",
    costLabel: "Biaya, hold, dan waktu proses",
    sourceLabel: "Sumber resmi untuk riset",
    unknownLabel: "Tetap berstatus unknown",
    nextAction: "Langkah riset berikutnya",
    nextActionText: "Pertahankan market=ID dan product=spot saat membuka direktori, kalkulator biaya, atau perbandingan. Jika perlu melanjutkan di Telegram, bawa hanya konteks riset anonim dan kembali ke halaman Indonesia sebelum mengambil tindakan eksternal.",
    product: "spot",
    telegramVenue: "binance",
    returnRoute: "/id",
    researchHandoff: [
      { label: "Buka direktori platform Indonesia", href: "/exchanges", kind: "directory" },
      { label: "Periksa biaya dan jalur IDR", href: "/rates", kind: "rates" },
      { label: "Bandingkan Binance dan OKX", href: "/compare/binance-vs-okx", kind: "compare" },
      { label: "Bawa konteks riset Indonesia ke Telegram", kind: "telegram" },
    ],
  },
  JP: {
    lang: "ja",
    authority: "日本の金融庁と公式プラットフォーム資料",
    eyebrow: "日本アカウント確認",
    title: "登録前に、FSA登録、本人確認、JPY入金、商品範囲を分けて確認",
    directAnswer: "日本の利用者は、登録事業者リストだけで判断せず、本人確認、本人名義の銀行口座、JPY入出金、現物などの商品範囲を公式フローで確認してから口座ルートを選びます。",
    paymentLabel: "確認する入出金経路",
    checksLabel: "確認する順番",
    costLabel: "手数料と反映時間",
    sourceLabel: "公式ソース",
    unknownLabel: "未確定のまま残すこと",
    nextAction: "次の行動",
    nextActionText: "まずFSA登録とbitFlyerの公式案内を読み、次にNexuAlphaの候補比較へ進む。",
  },
  KR: {
    lang: "ko",
    authority: "한국 금융위원회, 금융정보분석원 및 공식 플랫폼 자료",
    eyebrow: "한국 계정 확인",
    title: "규제 맥락, 본인확인, KRW 실명계좌, 상품 범위를 따로 확인",
    directAnswer: "한국 이용자는 금융위원회와 금융정보분석원 맥락을 먼저 확인한 뒤, 공식 계정 화면에서 고객확인, 실명확인 계좌, 원화 입출금, 지원 상품을 각각 검증해야 합니다.",
    paymentLabel: "확인할 결제/입출금 경로",
    checksLabel: "확인 순서",
    costLabel: "수수료와 처리 시간",
    sourceLabel: "공식 출처",
    unknownLabel: "계속 미확정으로 둘 항목",
    nextAction: "다음 행동",
    nextActionText: "공식 규제 맥락과 업비트 안내를 확인한 뒤, KRW 계정 조건에 맞는 후보만 비교한다.",
  },
  SG: {
    lang: "en-SG",
    eyebrow: "SINGAPORE ACCOUNT CHECK",
    title: "Treat MAS context, identity, SGD rails and product scope as separate checks",
    directAnswer: "Singapore research should start with MAS Digital Payment Token service context, then verify identity, residence, service entity, SGD funding, PayNow or FAST visibility and product scope inside the official account flow.",
    paymentLabel: "Payment rails to confirm",
    checksLabel: "Decision checks",
    costLabel: "Fees and timing",
    sourceLabel: "Official sources",
    unknownLabel: "Keep pending",
    nextAction: "Next action",
    nextActionText: "Check MAS and platform source labels first, then compare only account-visible Singapore routes.",
  },
  HK: {
    lang: "zh-Hant",
    authority: "香港證監會（SFC）與平台官方帳戶／入金說明",
    eyebrow: "香港帳戶核對",
    title: "先分清 SFC 狀態、港幣入金、身分地址與產品範圍，再決定下一步",
    directAnswer: "香港用戶不應把平台名單、港幣入金教學或合作連結當成開戶結果。先核對 SFC 公開名單與平台官方資料，再在官方帳戶流程確認居住地、身分、地址證明、2FA、本人銀行帳戶、HKD 銀行轉帳、eDDA、鏈上轉帳、費用、hold 及目標產品是否對該帳戶可見。",
    paymentLabel: "先核對的入金路徑",
    checksLabel: "帳戶核對順序",
    costLabel: "費用、hold 與產品範圍",
    sourceLabel: "官方來源",
    unknownLabel: "保持 unknown 的項目",
    nextAction: "站內研究交接",
    nextActionText: "先保留 market=HK 與 product=spot，從站內黃頁、費率頁與比較頁整理問題；需要人工跟進時只把研究上下文帶到 Telegram，不直接新增交易所註冊入口。",
    product: "spot",
    telegramVenue: "hashkey",
    researchHandoff: [
      { label: "查看香港平台黃頁", href: "/exchanges", kind: "directory" },
      { label: "查看費率與入金檢查", href: "/rates", kind: "rates" },
      { label: "比較 Binance vs OKX 研究頁", href: "/compare/binance-vs-okx", kind: "compare" },
      { label: "把香港研究上下文帶到 Telegram", kind: "telegram" },
    ],
  },
  TR: {
    lang: "tr",
    authority: "Türkiye Sermaye Piyasası Kurulu (SPK) ve resmi platform kaynakları",
    eyebrow: "TÜRKİYE HESAP KONTROLÜ",
    title: "SPK listesi, tasfiye durumu, kimlik, TRY ve ürün kapsamını ayırın",
    directAnswer: "Türkiye araştırması SPK faaliyet ve tasfiye listeleriyle başlar; kullanıcı daha sonra resmi hesap akışında kimlik, yüz, yatırımcı profili, adres, TRY yatırma yolu ve ürün kapsamını ayrı ayrı doğrulamalıdır.",
    paymentLabel: "Doğrulanacak para yatırma yolu",
    checksLabel: "Kontrol sırası",
    costLabel: "Ücret ve işlem süresi",
    sourceLabel: "Resmi kaynaklar",
    unknownLabel: "Beklemede kalacak konular",
    nextAction: "Sonraki adım",
    nextActionText: "SPK durumunu ve Paribu resmi akışını kontrol ettikten sonra Türkiye adaylarını karşılaştırın.",
  },
};

const DEPTH_DISPLAY_COPY = {
  JP: {
    paymentRails: {
      "JPY deposit": "JPY 入金",
      "registered bank account in user's name": "本人名義の登録銀行口座",
      "crypto transfer route pending account confirmation": "口座確認が必要な暗号資産転送",
    },
    accountScreenChecks: {
      "Confirm the provider appears in the current FSA registered crypto-asset exchange provider context before comparing signup routes.": "登録ルートを比較する前に、現在の金融庁登録暗号資産交換業者の文脈で事業者を確認します。",
      "Check identity verification, registered personal information and a bank account in the user's own name before JPY funding.": "JPY 入金前に、本人確認、登録個人情報、本人名義の銀行口座を確認します。",
      "Verify JPY deposit visibility, crypto transfer availability and product scope inside the current official account flow.": "現在の公式アカウント手続きで、JPY 入金表示、暗号資産転送、商品範囲を確認します。",
    },
    feeOrTimingChecks: {
      "Read the official account or fee page for current JPY deposit, withdrawal, trading fee, reflection timing and rejection conditions.": "JPY 入金、出金、取引手数料、反映時間、拒否条件は、公式アカウントまたは手数料ページで確認します。",
      "Keep fees, account approval timing, supported products and benefit eligibility pending until shown by the official account flow.": "手数料、口座承認時間、対応商品、特典条件は、公式アカウント手続きに表示されるまで未確定のまま扱います。",
    },
    sources: {
      "Japan FSA registered crypto-asset exchange providers": "金融庁 登録暗号資産交換業者一覧",
      "bitFlyer Japan how to start": "bitFlyer Japan 開始手順",
      "bitFlyer Japan official FAQ": "bitFlyer Japan 公式FAQ",
    },
    roles: { "official-register": "公式登録情報", "official-platform-guidance": "公式プラットフォーム案内" },
    unknowns: {
      "Whether the specific user passes Japan identity, residence and registered-bank-account checks.": "特定ユーザーが日本の本人確認、居住地、登録銀行口座の確認を通過できるか。",
      "Whether JPY deposit or withdrawal, crypto transfer, timing, fees, product scope or benefits appear in the current official account flow.": "JPY 入出金、暗号資産転送、反映時間、手数料、商品範囲、特典が現在の公式アカウント手続きに表示されるか。",
    },
    cannotPromise: {
      "Does not prove registration approval, JPY funding availability, bank-account approval, crypto transfer availability, product access, fee outcome or benefit eligibility for a specific user.": "特定ユーザーの口座承認、JPY 入金可否、銀行口座承認、暗号資産転送、商品利用、手数料結果、特典条件を証明するものではありません。",
    },
  },
  KR: {
    paymentRails: {
      "KRW deposit and withdrawal": "KRW 입출금",
      "real-name bank account where shown": "표시되는 경우 실명 은행계좌",
      "crypto transfer route pending account confirmation": "계정 확인이 필요한 암호화폐 전송",
    },
    accountScreenChecks: {
      "Confirm the official FSC or KOFIU regulatory context before comparing a Korean account route.": "한국 계정 경로를 비교하기 전에 금융위원회 또는 금융정보분석원의 공식 규제 맥락을 확인합니다.",
      "Check signup, customer verification, real-name bank account, two-channel authentication and account level inside the official platform flow.": "공식 플랫폼 절차에서 가입, 고객확인, 실명 은행계좌, 2채널 인증, 계정 등급을 확인합니다.",
      "Verify KRW deposit or withdrawal, crypto transfer and intended product scope separately for the current account.": "현재 계정에서 KRW 입출금, 암호화폐 전송, 이용하려는 상품 범위를 각각 확인합니다.",
    },
    feeOrTimingChecks: {
      "Read the official account screen or platform support page for KRW amount limits, fees, processing time, rejection conditions and authentication requirements.": "KRW 금액 한도, 수수료, 처리 시간, 거절 조건, 인증 요건은 공식 계정 화면 또는 지원 페이지에서 확인합니다.",
      "Keep KRW funding availability, product scope, fees, timing and user benefits pending until the official account flow shows them.": "KRW 입출금 가능 여부, 상품 범위, 수수료, 처리 시간, 사용자 혜택은 공식 계정 절차에 표시될 때까지 미확정으로 둡니다.",
    },
    sources: {
      "FSC Korea Virtual Asset User Protection Act overview": "금융위원회 가상자산 이용자 보호법 개요",
      "Korea Financial Intelligence Unit virtual-asset business guidance": "금융정보분석원 가상자산사업자 안내",
      "Upbit Korea account registration and customer verification": "Upbit 회원가입 및 고객확인 안내",
      "Upbit Korea KRW deposit and withdrawal guidance": "Upbit 원화 입출금 안내",
    },
    roles: { "official-regulatory-reference": "공식 규제 참고자료", "official-platform-guidance": "공식 플랫폼 안내" },
    unknowns: {
      "Whether the specific user can complete customer verification, real-name bank-account checks or two-channel authentication.": "특정 사용자가 고객확인, 실명계좌 확인 또는 2채널 인증을 완료할 수 있는지.",
      "Whether KRW funding, crypto transfer, fees, timing, product scope or benefits appear in the current official account screen.": "KRW 입출금, 암호화폐 전송, 수수료, 처리 시간, 상품 범위 또는 혜택이 현재 공식 계정 화면에 표시되는지.",
    },
    cannotPromise: {
      "Does not prove account approval, KRW funding availability, real-name bank-account approval, crypto transfer availability, product access, fee outcome or benefit eligibility for a specific user.": "특정 사용자의 계정 승인, KRW 입출금 가능 여부, 실명계좌 승인, 암호화폐 전송, 상품 이용, 수수료 결과 또는 혜택 자격을 증명하지 않습니다.",
    },
  },
  TR: {
    paymentRails: {
      "TRY bank transfer": "TRY banka transferi",
      "matching bank account where shown": "gösterildiğinde eşleşen banka hesabı",
      "crypto transfer route pending account confirmation": "hesap onayı gereken kripto transfer rotası",
    },
    accountScreenChecks: {
      "Confirm the current SPK operation and liquidation lists before treating a Turkish platform route as available.": "Bir Türkiye platform rotasını kullanılabilir saymadan önce güncel SPK faaliyet ve tasfiye listelerini kontrol edin.",
      "Treat a name on the SPK liquidation list, including Bitget Teknoloji AŞ while it appears there, as a stop-and-review signal rather than a usable Türkiye funding route.": "SPK tasfiye listesinde görünen bir adı, Bitget Teknoloji AŞ dahil, kullanılabilir Türkiye fonlama rotası yerine durup inceleme sinyali olarak ele alın.",
      "Check identity, face, investor-profile, address and account-verification steps inside the official platform flow.": "Kimlik, yüz doğrulama, yatırımcı profili, adres ve hesap doğrulama adımlarını resmi platform akışında kontrol edin.",
      "Verify whether TRY deposit, crypto transfer and the intended product are visible for the current account before acting.": "İşlemden önce TRY yatırma, kripto transferi ve hedef ürünün mevcut hesapta görünüp görünmediğini doğrulayın.",
    },
    feeOrTimingChecks: {
      "Use the official account screen or platform support page for bank-transfer conditions, fees, limits, timing and rejected-payment conditions.": "Banka transferi koşulları, ücretler, limitler, süreler ve reddedilen ödeme koşulları için resmi hesap ekranını veya destek sayfasını kullanın.",
      "Keep TRY funding availability, product scope, fees, timing and user benefits pending until the official account flow shows them.": "TRY fonlama, ürün kapsamı, ücretler, süreler ve kullanıcı avantajları resmi hesap akışında görünene kadar beklemede kalır.",
    },
    sources: {
      "SPK crypto-asset service providers in operation": "SPK faaliyette bulunan kripto varlık hizmet sağlayıcıları",
      "SPK crypto-asset service providers in liquidation": "SPK tasfiye sürecindeki kripto varlık hizmet sağlayıcıları",
      "Paribu account verification guidance": "Paribu hesap doğrulama rehberi",
      "Paribu Turkish lira deposit guidance": "Paribu Türk lirası yatırma rehberi",
    },
    roles: { "official-register": "resmi kayıt", "official-platform-guidance": "resmi platform rehberi" },
    unknowns: {
      "Whether the specific user can pass identity, face, investor-profile, address or account-verification steps.": "Belirli kullanıcının kimlik, yüz, yatırımcı profili, adres veya hesap doğrulama adımlarını geçip geçemeyeceği.",
      "Whether TRY funding, bank-account matching, crypto transfer, fees, timing, product scope or benefits appear in the current official account screen.": "TRY fonlama, banka hesabı eşleşmesi, kripto transferi, ücretler, süreler, ürün kapsamı veya avantajların mevcut resmi hesap ekranında görünüp görünmediği.",
      "Whether a named provider has moved between the SPK operation list and liquidation list since this review.": "Bu incelemeden sonra ilgili sağlayıcının SPK faaliyet listesi ile tasfiye listesi arasında yer değiştirip değiştirmediği.",
    },
    cannotPromise: {
      "Does not prove account approval, TRY funding availability, bank-account approval, crypto transfer availability, product access, provider status, fee outcome or benefit eligibility for a specific user.": "Belirli kullanıcı için hesap onayı, TRY fonlama, banka hesabı onayı, kripto transferi, ürün erişimi, sağlayıcı durumu, ücret sonucu veya avantaj uygunluğunu kanıtlamaz.",
    },
  },
};

function depthDisplay(market, group, value) {
  return DEPTH_DISPLAY_COPY[market]?.[group]?.[value] || value;
}

function ResearchHandoffLinks({ copy, market, locale }) {
  if (!copy.researchHandoff?.length) return null;
  const product = copy.product || "spot";
  const telegramFunnel = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: copy.telegramVenue || "coinbase",
    market,
    locale,
    product,
    campaign: `${market.toLowerCase()}_decision_depth_research`,
    returnRoute: copy.returnRoute,
  });

  return (
    <div className="regional-decision-depth__handoff" role="group" aria-label={`${market} research handoff`}>
      {copy.researchHandoff.map((item) => {
        if (item.kind === "telegram") {
          return (
            <a
              key={item.kind}
              href={telegramFunnel.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              data-cta-kind="telegram"
              data-cta-placement="regional-decision-depth"
              data-growth-market={market}
              data-growth-product={product}
              data-telegram-start={telegramFunnel.startPayload}
              data-telegram-return-href={telegramFunnel.returnHref}
              data-telegram-market-context={market}
            >
              {item.label}
            </a>
          );
        }
        return (
          <a
            key={item.kind || item.href}
            href={contextualHref(item.href, { locale, market, product })}
            data-cta-kind="research"
            data-cta-placement={`regional-decision-depth-${item.kind || "handoff"}`}
            data-growth-market={market}
            data-growth-product={product}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}

function EuDecisionDepth() {
  const decision = euMarketDecisionSummary();
  return (
    <section className="regional-decision-depth v3-card" data-regional-decision-depth="EU" lang="en" aria-labelledby="regional-decision-depth-title-EU">
      <div className="regional-decision-depth__header">
        <h2 id="regional-decision-depth-title-EU">France and Germany are evidence signals, not eligibility shortcuts</h2>
        <p>{decision.boundary}</p>
        <small>Reviewed {decision.reviewedAt}</small>
      </div>
      <div className="regional-decision-depth__table-wrap">
        <table>
          <thead><tr><th>Member state</th><th>Service entity</th><th>SEPA / bank</th><th>Card</th><th>Product scope</th><th>Next action</th></tr></thead>
          <tbody>{decision.rows.map((row) => <tr key={row.id}>
            <th scope="row">{row.memberStateName}<small>{row.sourceStatus}</small></th>
            <td>{row.serviceAccountEntity}</td>
            <td>{row.sepaBank.signal}</td>
            <td>{row.card.signal}</td>
            <td>{row.productScope.signal}</td>
            <td><strong>{row.action.label}</strong><span>{row.action.detail}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function UkDecisionDepth() {
  return (
    <section className="regional-decision-depth v3-card" data-regional-decision-depth="UK" lang="en-GB" aria-labelledby="regional-decision-depth-title-UK">
      <div className="regional-decision-depth__header">
        <h2 id="regional-decision-depth-title-UK">Four checks before treating a UK account route as ready</h2>
        <p>{UK_MARKET_DECISION.boundary}</p>
        <small>Reviewed {UK_MARKET_DECISION.reviewedAt}</small>
      </div>
      <ol className="regional-decision-depth__steps">
        {UK_MARKET_DECISION.visibleChecklist.map((step) => <li key={step.id}>
          <details>
            <summary><span>{step.order}</span><strong>{step.title}</strong><small>{step.decisionQuestion}</small></summary>
            <ul>{step.checks.map((check) => <li key={check}>{check}</li>)}</ul>
          </details>
        </li>)}
      </ol>
    </section>
  );
}

function FundingDecisionDepth({ market }) {
  const copy = MARKET_DEPTH_COPY[market];
  const [funding] = regionalFundingRowsForMarket(market);
  const registry = internationalSourcesFor(market);
  if (!copy || !funding) return null;
  const sources = (registry.sources.length ? registry.sources : funding.officialSources).slice(0, 4);
  if (!sources.length) return null;
  const titleId = `regional-decision-depth-title-${market}`;
  return (
    <section className="regional-decision-depth v3-card" data-regional-decision-depth={market} lang={copy.lang} aria-labelledby={titleId}>
      <div className="regional-decision-depth__header">
        <h2 id={titleId}>{copy.title}</h2>
        <p>{copy.directAnswer}</p>
        <small>{copy.authority || registry.authority} · Reviewed {funding.reviewedAt || INTERNATIONAL_SOURCE_REVIEWED_AT}</small>
      </div>
      <details className="regional-decision-depth__evidence">
        <summary>
          <span>
            <strong>{copy.checksLabel}</strong>
            <small>{copy.paymentLabel || "Payment rails to confirm"} · {copy.sourceLabel} · {copy.unknownLabel}</small>
          </span>
          <b aria-hidden="true">＋</b>
        </summary>
        <div className="regional-decision-depth__grid">
          <article>
            <h3>{copy.paymentLabel || "Payment rails to confirm"}</h3>
            <ul>
              {funding.paymentRails.map((item) => <li key={item}>{depthDisplay(market, "paymentRails", item)}</li>)}
            </ul>
          </article>
          <article>
            <h3>{copy.checksLabel}</h3>
            <ol>
              {funding.accountScreenChecks.map((item) => <li key={item}>{depthDisplay(market, "accountScreenChecks", item)}</li>)}
            </ol>
          </article>
          <article>
            <h3>{copy.costLabel || "Fees and timing"}</h3>
            <ul>
              {funding.feeOrTimingChecks.map((item) => <li key={item}>{depthDisplay(market, "feeOrTimingChecks", item)}</li>)}
            </ul>
          </article>
          <article>
            <h3>{copy.sourceLabel}</h3>
            <ul>
              {sources.map((item) => <li key={item.label}><strong>{depthDisplay(market, "sources", item.label)}</strong><span>{depthDisplay(market, "roles", item.role)}</span></li>)}
            </ul>
          </article>
          <article>
            <h3>{copy.unknownLabel}</h3>
            <ul>
              {funding.unknowns.map((item) => <li key={item}>{depthDisplay(market, "unknowns", item)}</li>)}
            </ul>
          </article>
          <article>
            <h3>{copy.nextAction}</h3>
            <p>{copy.nextActionText}</p>
            <ResearchHandoffLinks copy={copy} market={market} locale={copy.lang || "en"} />
            <small>{depthDisplay(market, "cannotPromise", funding.cannotPromise)}</small>
          </article>
        </div>
      </details>
    </section>
  );
}

export function RegionalMarketDecisionDepth({ market }) {
  const normalized = String(market || "").toUpperCase();
  if (normalized === "EU") return <EuDecisionDepth />;
  if (normalized === "UK") return <UkDecisionDepth />;
  if (MARKET_DEPTH_COPY[normalized]) return <FundingDecisionDepth market={normalized} />;
  return null;
}

export default RegionalMarketDecisionDepth;
