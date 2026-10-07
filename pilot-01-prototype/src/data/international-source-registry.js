// Official source register for the international research-preview layer.
// These links are discovery and verification aids, not legal or eligibility
// conclusions. The account, product and country outcome remains platform-side.

export const INTERNATIONAL_SOURCE_REVIEWED_AT = "2026-09-15";

const source = (label, url, role, note) => ({
  label,
  url,
  role,
  note,
  status: "source-linked",
  reviewedAt: INTERNATIONAL_SOURCE_REVIEWED_AT,
});

export const internationalSourceRegistry = {
  MX: {
    authority: "Banco de México, CNBV y centros oficiales de ayuda de las plataformas",
    sources: [
      source(
        "Banco de México SPEI information",
        "https://www.banxico.org.mx/servicios/spei_-informacion-banco-mex.html",
        "official-payment-system-reference",
        "Use Banxico to understand SPEI as an interbank payment system; this does not prove that a crypto platform or user account can use a specific MXN route.",
      ),
      source(
        "Binance MXN and SPEI deposit guidance",
        "https://www.binance.com/es-MX/support/faq/detail/c45b457e73a14580ab6be95f10bef5b5",
        "official-platform-guidance",
        "Use the current platform flow to check SPEI, identity and account requirements; this does not authorize a NexuAlpha CTA.",
      ),
      source(
        "Binance Mexico account guidance",
        "https://www.binance.com/es-MX/support/faq/detail/588ca3bd6b214a17bf1070a8189fb809",
        "official-platform-guidance",
        "The account step can vary by user state; confirm the current official flow before acting.",
      ),
      source(
        "CNBV fintech and virtual-asset framework",
        "https://www.gob.mx/cnbv/acciones-y-programas/sector-fintech",
        "official-regulatory-reference",
        "Use the Mexican regulator's framework to distinguish research context from platform-specific account or eligibility conclusions.",
      ),
    ],
  },
  TW: {
    authority: "Taiwan Financial Supervisory Commission (FSC) and official platform references",
    sources: [
      source(
        "Taiwan FSC Virtual Asset Service Act",
        "https://law.fsc.gov.tw/LawContent.aspx?id=GL004301",
        "official-legislation",
        "The Act was promulgated on 22 July 2026, but the FSC law page states that all or part of its provisions have not yet taken effect. Do not treat the future licensing framework as already fully effective or as proof that a platform or account is approved.",
      ),
      source(
        "Taiwan FSC anti-money-laundering registration rules for VASPs",
        "https://law.fsc.gov.tw/LawContent.aspx?id=GL004000",
        "official-regulatory-reference",
        "Use the effective AML registration rules to review the service category and registration context. AML registration is not a NexuAlpha endorsement and does not prove account, product or TWD-route availability.",
      ),
      source(
        "Taiwan FSC list of VASPs that completed AML registration",
        "https://www.fsc.gov.tw/userfiles/file/1141114%E5%AE%8C%E6%88%90%E6%B4%97%E9%8C%A2%E9%98%B2%E5%88%B6%E7%99%BB%E8%A8%98%E4%B9%8BVASP%E6%A5%AD%E8%80%85%E5%90%8D%E5%96%AE%28%E6%9B%B4%E6%8B%93%E8%8D%92%E8%B3%87%E6%9C%AC%E9%A1%8D.pdf",
        "official-register",
        "Check the FSC's current completed-registration list and the registered service categories. A listed entity still does not establish that a specific user, product, deposit or withdrawal route is available.",
      ),
      source(
        "MAX New Taiwan dollar deposit guidance",
        "https://support.maicoin.com/zh-TW/support/solutions/articles/32000026522-max-%E6%96%B0%E5%8F%B0%E5%B9%A3%E5%85%A5%E9%87%91%E6%95%99%E5%AD%B8",
        "official-platform-guidance",
        "Use the current verified-bank-account instructions and confirm the transfer comes from the user's verified personal bank account. This is a research source, not a residence, account or funding eligibility verdict.",
      ),
      source(
        "MAX Exchange registration and identity verification guide",
        "https://support.maicoin.com/zh-TW/support/solutions/articles/32000027069-%E8%A8%BB%E5%86%8A%E6%95%99%E5%AD%B8",
        "official-platform-guidance",
        "Use the current Traditional Chinese registration and identity-verification steps; account level and service access remain account-specific.",
      ),
      source(
        "MAX Exchange bank-account verification guide",
        "https://support.maicoin.com/zh-TW/support/solutions/articles/32000016129-%E5%A6%82%E4%BD%95%E9%A9%97%E8%AD%89%E9%8A%80%E8%A1%8A%E5%B8%B3%E8%99%9F-",
        "official-platform-guidance",
        "Use the current real-name bank-account verification instructions before treating TWD funding as available.",
      ),
    ],
  },
  ID: {
    authority: "OJK, Bappebti and official Indonesian platform references",
    sources: [
      source(
        "OJK and Bappebti transition announcement for crypto assets",
        "https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Bappebti-Kemendag-Alihkan-Tugas-Aset-Keuangan-Digital-termasuk-Aset-Kripto-serta-Derivatif-Keuangan-kepada-OJK-dan-BI.aspx",
        "official-regulatory-reference",
        "Use the OJK/Bappebti transition context to separate regulator oversight from platform-specific account, product and benefit outcomes.",
      ),
      source(
        "Bappebti prospective physical crypto-asset trader list",
        "https://bappebti.go.id/calon_pedagang_aset_kripto",
        "official-register",
        "Use the published trader-list context as a verification starting point; it does not establish that a specific user can open, fund or trade through an account.",
      ),
      source(
        "Tokocrypto IDR deposit guidance",
        "https://support.tokocrypto.com/hc/en-us/articles/31314362562829-Tokocrypto-Deposit-Guide",
        "official-platform-guidance",
        "Bank VA, wallet and QRIS availability must be checked in the current account flow.",
      ),
      source(
        "Tokocrypto referral-code guidance",
        "https://support.tokocrypto.com/hc/en-us/articles/19368690221069-Understanding-Referral-Codes-on-Tokocrypto",
        "official-platform-guidance",
        "A platform referral-code explanation is not proof that NexuAlpha has an active code or user benefit.",
      ),
    ],
  },
  VN: {
    authority: "Vietnam official-source package pending",
    sources: [],
  },
  HK: {
    authority: "Hong Kong SFC and official platform references",
    sources: [
      source(
        "SFC licensed virtual asset trading platforms",
        "https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms",
        "official-register",
        "Use the list to check a platform's published SFC status; it does not guarantee performance, creditworthiness, account approval, product access or suitability.",
      ),
      source(
        "SFC virtual asset platform requirements",
        "https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators",
        "official-guidance",
        "Read the regulator's scope and licensing context before treating a platform as available in Hong Kong.",
      ),
      source(
        "HashKey Exchange fiat currency deposit guidelines",
        "https://support.hashkey.com/hc/en-gb/articles/25794717042585-HashKey-Exchange-fiat-currency-deposit-guidelines-General",
        "official-platform-guidance",
        "Use the current official deposit page to verify supported currencies, bank processing, fees, account name requirements and refused-channel rules; availability remains account-specific.",
      ),
      source(
        "HashKey Exchange eDDA deposit guide",
        "https://support.hashkey.com/hc/en-gb/articles/48860678459801-Deposit-Guide-for-eDDA",
        "official-platform-guidance",
        "Use the current eDDA flow to verify HKD bank authorization, account-name match, ID details, minimum amounts and bank processing; this is not a general Hong Kong eligibility promise.",
      ),
      source(
        "OSL Hong Kong account opening and 2FA guide",
        "https://www.osl.com/hk-en/bits/article/osl-account-opening-and-2fa-setup-guide",
        "official-platform-guidance",
        "Use the current OSL onboarding, KYC and proof-of-address checklist as a platform-specific research source, not a market-wide eligibility claim.",
      ),
      source(
        "OSL Hong Kong account verification process",
        "https://www.osl.com/hk-en/support/article/kA0fv00000002BVCAY?channel=PPXtZS",
        "official-platform-guidance",
        "Review the current identity, address and bank-verification steps before treating an OSL route as suitable for a specific user.",
      ),
    ],
  },
  EU: {
    authority: "European Securities and Markets Authority (ESMA)",
    sources: [
      source(
        "ESMA databases and registers — Interim MiCA Register",
        "https://www.esma.europa.eu/et/node/200055",
        "official-register",
        "Check the provider, service scope and host Member State in the current register.",
      ),
      source(
        "ESMA MiCA register rules",
        "https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-109-register-crypto-asset-white",
        "official-rulebook",
        "The register is updated by competent-authority data; absence of a record is not a NexuAlpha eligibility verdict.",
      ),
      source("Coinbase EMEA payment-method verification", "https://help.coinbase.com/en-gb/coinbase/getting-started/add-a-payment-method/add-and-verify-pm-emea", "official-platform-guidance", "Use the current country-specific SEPA and payment-method table; availability and settlement remain account-specific."),
      source("Coinbase identity verification guidance", "https://help.coinbase.com/en-gb/coinbase/getting-started/getting-started-with-coinbase/id-doc-verification", "official-platform-guidance", "Use the official identity and domain-safety guidance before uploading documents or treating a route as available."),
    ],
  },
  UK: {
    authority: "UK Financial Conduct Authority (FCA)",
    sources: [
      source(
        "FCA cryptoasset registration guidance",
        "https://www.fca.org.uk/firms/cryptoassets/who-needs-register",
        "official-guidance",
        "Use the FCA guidance and its linked public register when checking a firm's UK status and marketing scope.",
      ),
      source(
        "FCA cryptoasset registration process",
        "https://www.fca.org.uk/firms/cryptoassets/how-apply-registration",
        "official-guidance",
        "The process page explains registration context; it does not establish that any exchange accepts a particular user.",
      ),
      source("Coinbase UK account creation and identity checks", "https://help.coinbase.com/en-gb/coinbase/getting-started/getting-started-with-coinbase/create-a-coinbase-account", "official-platform-guidance", "Use the current UK account, identity and appropriateness-assessment steps; this does not establish user eligibility."),
      source("Coinbase UK GBP funding guidance", "https://help.coinbase.com/en-gb/coinbase/trading-and-funding/depositing-or-withdrawing-fiat-money/funding-your-account-emea", "official-platform-guidance", "Use the current GBP funding and matching-bank-name instructions before treating a route as suitable."),
    ],
  },
  JP: {
    authority: "Japan Financial Services Agency and official platform guidance",
    sources: [
      source("Japan FSA registered crypto-asset exchange providers", "https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf", "official-register", "Use the current FSA list to identify registered providers; it does not establish account eligibility, product scope or suitability."),
      source("bitFlyer Japan how to start", "https://bitflyer.com/en-jp/s/how-to-start", "official-platform-guidance", "Review the current identity, account and JPY onboarding steps on the official platform; conditions remain account-specific."),
      source("bitFlyer Japan official FAQ", "https://bitflyer.com/en-jp/faq", "official-platform-guidance", "Use the FAQ to verify current account, funding and product details before following any external route."),
    ],
  },
  KR: {
    authority: "Korean Financial Services Commission and official platform guidance",
    sources: [
      source("FSC Korea Virtual Asset User Protection Act overview", "https://www.fsc.go.kr/eng/pr010101/81698", "official-regulatory-reference", "Use the FSC overview for regulatory context; it does not establish account eligibility or product availability for a specific user."),
      source("Korea Financial Intelligence Unit virtual-asset business guidance", "https://www.kofiu.go.kr/eng/legislation/legislation.do", "official-regulatory-reference", "Review the current official guidance and registered-business context before treating a service as available in Korea."),
      source("Upbit Korea account registration and customer verification", "https://support.upbit.com/hc/ko/articles/900006825383-%ED%9A%8C%EC%9B%90-%EA%B0%80%EC%9E%85%EC%9D%80-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%98%EB%82%98%EC%9A%94", "official-platform-guidance", "Use the current Korean-language signup and customer-verification steps; account approval and product access remain user-specific."),
      source("Upbit Korea KRW deposit and withdrawal guidance", "https://support.upbit.com/hc/ko/articles/900005596266-%EC%9B%90%ED%99%94-%EC%9E%85%EC%B6%9C%EA%B8%88-%EB%B0%A9%EB%B2%95-%EB%AA%A8%EB%B0%94%EC%9D%BC", "official-platform-guidance", "Use the current KRW funding instructions and linked real-name account checks; this is not a NexuAlpha eligibility or benefit claim."),
    ],
  },
  SG: {
    authority: "Monetary Authority of Singapore and official platform guidance",
    sources: [
      source(
        "MAS Financial Institutions Directory: Digital Payment Token Service",
        "https://eservices.mas.gov.sg/fid/institution?activity=Digital+Payment+Token+Service",
        "official-register",
        "Use the current MAS directory to identify licensed payment institutions with Digital Payment Token Service activity; a listing is not a NexuAlpha account or benefit verdict.",
      ),
      source(
        "MAS types of payment services: Digital Payment Token service",
        "https://www.mas.gov.sg/regulation/payments/licensing-for-payment-service-providers/types-of-payment-services",
        "official-regulatory-reference",
        "Use MAS service definitions to separate regulated activity context from platform-specific onboarding, funding and product access.",
      ),
      source(
        "Coinbase Singapore official account entry",
        "https://www.coinbase.com/en-sg",
        "official-platform-guidance",
        "Use the current Singapore platform flow to verify identity, account information, payment methods and supported assets before acting.",
      ),
      source(
        "Independent Reserve Singapore official SGD funding entry",
        "https://www.independentreserve.com/",
        "official-platform-guidance",
        "Use the official Singapore platform flow to verify identity and current SGD funding options such as PayNow or FAST; availability remains account-specific.",
      ),
    ],
  },
  TR: {
    authority: "Turkey Capital Markets Board (SPK) and official platform guidance",
    sources: [
      source(
        "SPK crypto-asset service providers in operation",
        "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi",
        "official-register",
        "Use the current SPK temporary list to check the published Turkish service-provider context; being listed is not an authorization verdict and does not establish account eligibility or product suitability.",
      ),
      source(
        "SPK crypto-asset service providers in liquidation",
        "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi",
        "official-register",
        "Check the current liquidation status before treating a Turkish platform name or route as available; Bitget Teknoloji AŞ currently appears in this context, and a register entry is not a NexuAlpha CTA authorization.",
      ),
      source(
        "Paribu account verification guidance",
        "https://www.paribu.com/destek/getting-started/account-verification",
        "official-platform-guidance",
        "Use the official Turkish account-verification steps and app requirements, including identity, face, investor-profile and address steps where shown; completion and access remain user-specific.",
      ),
      source(
        "Paribu Turkish lira deposit guidance",
        "https://www.paribu.com/destek/try-transactions/try-deposit",
        "official-platform-guidance",
        "Use the current TRY bank-transfer and matching-account instructions; this is a research source, not a guaranteed funding or trading route.",
      ),
    ],
  },
  US: {
    authority: "FinCEN, SEC, CFTC, NMLS/NYDFS and official U.S. platform guidance",
    sources: [
      source(
        "FinCEN Money Services Business registration",
        "https://www.fincen.gov/resources/money-services-business-msb-registration",
        "official-regulatory-reference",
        "Use FinCEN MSB registration as BSA context only; registration is not FinCEN approval, endorsement, account acceptance or product suitability.",
      ),
      source(
        "FinCEN virtual currency guidance",
        "https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering",
        "official-regulatory-reference",
        "Use the administrator, exchanger and user distinctions to frame MSB context; it does not decide a user's eligibility or exchange account state.",
      ),
      source(
        "SEC crypto assets and federal securities laws",
        "https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/crypto-assets-federal-securities-laws",
        "official-regulatory-reference",
        "Use SEC context to separate securities-law analysis from spot-account availability, funding access or venue endorsement.",
      ),
      source(
        "CFTC virtual currency trading risk advisory",
        "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html",
        "official-regulatory-reference",
        "Use CFTC context for commodity, futures and risk framing; this does not authorize a venue, product or promotion.",
      ),
      source(
        "NMLS Consumer Access",
        "https://www.nmlsconsumeraccess.org/",
        "official-register",
        "Use NMLS Consumer Access to research state money-transmitter records where available; state records do not replace account, product, USD rail or New York virtual-currency checks.",
      ),
      source(
        "NYDFS virtual currency business licensing",
        "https://www.dfs.ny.gov/virtual_currency_businesses",
        "official-register",
        "Use NYDFS BitLicense and charter context for New York boundaries; a license record is not a general U.S. eligibility, product or benefit promise.",
      ),
      source(
        "Coinbase USD funding guidance",
        "https://help.coinbase.com/en/exchange/trading-and-funding/funding-your-account-with-usd",
        "official-platform-guidance",
        "Use the current Coinbase account flow and funding page to verify USD rails, state support and account-specific limits.",
      ),
      source(
        "Kraken quick start for clients in the United States",
        "https://support.kraken.com/in/articles/quick-start-for-clients-in-the-united-states",
        "official-platform-guidance",
        "Use Kraken's current U.S. account, verification and funding flow before treating USD or crypto routes as available.",
      ),
      source(
        "Kraken ACH withdrawals",
        "https://support.kraken.com/hc/articles/4408922630676-ACH-withdrawals",
        "official-platform-guidance",
        "Use the official ACH requirements for eligible U.S. clients; eligibility, verification, bank-name match and New York exclusions remain account-specific.",
      ),
      source(
        "Binance.US account verification",
        "https://support.binance.us/en/articles/9842801-how-to-create-your-account-pass-identity-verification-basic-advanced",
        "official-platform-guidance",
        "Use the current Binance.US supported-state and verification guidance before treating an account route as available.",
      ),
      source(
        "Binance.US USD deposit and withdrawal help",
        "https://support.binance.us/en/collections/10384430-deposits-withdrawals",
        "official-platform-guidance",
        "Use the current Binance.US USD help collection to check ACH, wire, holds, unsupported states and account-specific USD availability.",
      ),
    ],
  },
  OTHER: {
    authority: "Market-specific authority not selected",
    sources: [],
  },
};

export function internationalSourcesFor(market) {
  return internationalSourceRegistry[String(market || "").toUpperCase()] || internationalSourceRegistry.OTHER;
}
