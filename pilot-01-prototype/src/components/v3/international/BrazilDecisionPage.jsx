import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { partnerRegistry } from "../../../data/partner-registry.js";
import { publicCtaForVenue } from "../../../data/source-bound-cta.js";
import { regionalVenueCta } from "../../../data/source-bound-cta.js";
import { BRAZIL_DECISION_CHAIN, BRAZIL_EVIDENCE_CHAIN, BRAZIL_SOURCES, BRAZIL_VENUES, getBrazilPage } from "../../../data/brazil-market.js";
import { trackGrowthDecision as trackGrowthDecisionEvent } from "../../../data/cta-analytics.js";
import { buildTelegramWebsiteFunnelContext } from "../../../data/telegram-config.js";
import { OnsiteTelegramBotHandoff } from "../OnsiteTelegramBotHandoff.jsx";
import { BrandMark } from "../../brand/BrandMark.jsx";
import { brazilControlsCopyExtra } from "../../../data/brazil-controls-copy.js";
import {
  costEstimate,
  browserSessionStorage,
  decisionStateFromUrl,
  defaultDecisionState,
  hasDecisionStateSearch,
  loadDecisionState,
  normalizeDecisionState,
  saveDecisionState,
  writeDecisionStateToUrl,
} from "../../../data/decision-state.js";
import "./brazil-decision-page.css";

const regionOptions = [
  ["BR", "Brasil"],
  ["ID", "Indonesia"],
  ["TW", "Taiwan"],
  ["HK", "Hong Kong"],
  ["OTHER", "Outra região"],
];

const productOptions = [
  ["spot", "Comprar cripto no spot"],
  ["perpetuals", "Preciso de derivativos"],
  ["unknown", "Ainda estou decidindo"],
];

const BRAZIL_PAGE_LOCALE = "pt-BR";

const controlsCopy = {
  "pt-BR": {
    label: "Decisor rápido",
    region: "Residência principal",
    product: "Uso pretendido",
    platform: "Plataforma",
    platformEmpty: "Ainda não escolhi",
    amount: "Valor de referência",
    spotFee: "Taxa spot assumida, bps",
    depositPercent: "Custo de entrada assumido, %",
    depositFixed: "Custo fixo assumido, BRL",
    costTitle: "Custo estimado pela sua hipótese",
    costNote: "10 bps = 0,10%. Entrada manual. Não é cotação, não inclui spread, slippage, impostos ou mudança de tabela.",
    brOnly: "Condições de cadastro spot apresentadas para residentes no Brasil.",
    nonBr: "Este guia local é voltado a residentes no Brasil. Para outra região, use o diretório global.",
    spotOnly: "Esta rota local cobre spot e entrada BRL/Pix. Derivativos exigem verificação separada no diretório global.",
    openGlobal: "Abrir diretório global",
    compare: "Comparar estas opções",
    register: "Abrir cadastro oficial",
    source: "Fontes oficiais verificadas nesta página",
    share: "Copiar link desta decisão",
    copied: "Link copiado.",
    copyFailed: "Não consegui copiar. O link da barra de endereço já foi atualizado.",
    officialCheck: "Confira domínio, KYC, moeda de depósito e elegibilidade antes de inserir dados.",
    newAccount: "Conta e benefício",
    facts: "Condições que mudam a decisão",
    readPath: "Ler o caminho local",
    readEvidence: "Ler critérios completos",
    readCriteria: "Ver KYC, conta e custos",
    nextTitle: "Recomendado agora",
    nextCheck: "Pix/BRL: conferir CPF, titularidade, limite e taxa",
    nextCompare: "Comparar no site",
    entry: "Brasil: decidir antes de cadastrar",
  },
  en: {
    label: "Quick Decision",
    region: "Residence",
    product: "Use Case",
    platform: "Platform",
    platformEmpty: "Not Chosen Yet",
    amount: "Reference Amount",
    spotFee: "Assumed Spot Fee, bps",
    depositPercent: "Assumed Deposit Cost, %",
    depositFixed: "Assumed Fixed Cost, BRL",
    costTitle: "Estimated Cost From Your Assumption",
    costNote: "10 bps = 0.10%. Manual input. Not a quote, current fee table, spread, slippage, tax, or full trade cost.",
    brOnly: "Spot signup conditions are shown for Brazil residents.",
    nonBr: "This local guide is for Brazil residents. Use the global directory for other regions.",
    spotOnly: "This local route covers spot and BRL/Pix entry. Derivatives need a separate global-directory check.",
    openGlobal: "Open Global Directory",
    compare: "Compare These Options",
    register: "Open Official Registration",
    source: "Official Sources Checked On This Page",
    share: "Copy This Decision Link",
    copied: "Link copied.",
    copyFailed: "Copy failed. The address bar link has been updated.",
    officialCheck: "Check domain, KYC, deposit currency, and eligibility before entering data.",
    newAccount: "Account & Benefit",
    facts: "Conditions That Change The Decision",
    readPath: "Read Local Path",
    readEvidence: "Read Full Decision Criteria",
    readCriteria: "View KYC, account, and cost details",
    nextTitle: "Recommended Next",
    nextCheck: "Pix/BRL: check CPF, ownership, limit, and fee",
    nextCompare: "Compare On Site",
    entry: "Brazil: decide before sign-up",
  },
  "zh-Hans": {
    label: "快速决策",
    region: "主要居住地",
    product: "使用目的",
    platform: "平台",
    platformEmpty: "还没选定",
    amount: "参考金额",
    spotFee: "假设现货费率，bps",
    depositPercent: "假设入金成本，%",
    depositFixed: "假设固定成本，BRL",
    costTitle: "按你的假设估算成本",
    costNote: "10 bps = 0.10%。手动输入，不是报价、实时费率表，也不包含点差、滑点、税务或完整交易成本。",
    brOnly: "面向巴西居民展示现货开户条件。",
    nonBr: "当前指南面向巴西居民，其他地区请查看全球目录。",
    spotOnly: "本地页覆盖现货和 BRL/Pix 入金，衍生品需要进入全球目录单独核对。",
    openGlobal: "打开全球目录",
    compare: "比较这些选项",
    register: "打开官方注册",
    source: "本页核对的官方来源",
    share: "复制当前决策链接",
    copied: "链接已复制。",
    copyFailed: "复制失败，地址栏链接已更新。",
    officialCheck: "填写信息前，请核对主域名、KYC、入金币种和资格条件。",
    newAccount: "账户与权益",
    facts: "会改变选择的条件",
    readPath: "阅读本地路径",
    readEvidence: "阅读完整决策依据",
    readCriteria: "查看 KYC、账户与费用条件",
    nextTitle: "推荐下一步",
    nextCheck: "Pix/BRL：核对 CPF、账户归属、限额和费用",
    nextCompare: "站内比较",
    entry: "巴西：开户前先决策",
  },
  "zh-Hant": {
    label: "快速決策",
    region: "主要居住地",
    product: "使用目的",
    platform: "平台",
    platformEmpty: "還沒選定",
    amount: "參考金額",
    spotFee: "假設現貨費率，bps",
    depositPercent: "假設入金成本，%",
    depositFixed: "假設固定成本，BRL",
    costTitle: "按你的假設估算成本",
    costNote: "10 bps = 0.10%。手動輸入，不是報價、即時費率表，也不包含點差、滑點、稅務或完整交易成本。",
    brOnly: "面向巴西居民展示現貨開戶條件。",
    nonBr: "目前指南面向巴西居民，其他地區請查看全球目錄。",
    spotOnly: "本地頁覆蓋現貨和 BRL/Pix 入金，衍生品需要進入全球目錄單獨核對。",
    openGlobal: "打開全球目錄",
    compare: "比較這些選項",
    register: "打開官方註冊",
    source: "本頁核對的官方來源",
    share: "複製目前決策連結",
    copied: "連結已複製。",
    copyFailed: "複製失敗，網址列連結已更新。",
    officialCheck: "填寫資訊前，請核對主網域、KYC、入金幣種和資格條件。",
    newAccount: "帳戶與權益",
    facts: "會改變選擇的條件",
    readPath: "閱讀本地路徑",
    readEvidence: "閱讀完整決策依據",
    nextTitle: "推薦下一步",
    nextCheck: "Pix/BRL：核對 CPF、帳戶歸屬、限額和費用",
    nextCompare: "站內比較",
    entry: "巴西：開戶前先決策",
  },
};

const COST_AT = { "pt-BR": "custo com", pt: "custo com", en: "cost at", "zh-Hans": "成本按", "zh-Hant": "成本按" };
const costAtCopy = (locale) => COST_AT[locale] || COST_AT[String(locale || "").split("-")[0]] || COST_AT.en;

export function copyFor(locale) {
  if (locale === "zh-Hans" || locale === "zh-Hant" || locale === "pt-BR") return controlsCopy[locale];
  const localized = {
    ja: { label: "クイック判断", region: "居住地", product: "用途", platform: "プラットフォーム", platformEmpty: "未選択", amount: "参考金額", spotFee: "想定現物手数料（bps）", depositPercent: "想定入金コスト（%）", depositFixed: "想定固定費（BRL）", costTitle: "入力条件による推定コスト", openGlobal: "グローバル一覧を開く", compare: "候補を比較", register: "公式登録を開く", source: "このページで確認した公式ソース", share: "判断リンクをコピー", officialCheck: "入力前にドメイン、KYC、入金通貨、対象条件を確認してください", newAccount: "アカウントと特典", facts: "判断を変える条件", readPath: "地域別の判断経路", readEvidence: "判断基準をすべて読む", readCriteria: "KYC・アカウント・費用を確認" },
    ko: { label: "빠른 결정", region: "거주지", product: "사용 목적", platform: "플랫폼", platformEmpty: "아직 선택하지 않음", amount: "참고 금액", spotFee: "가정 현물 수수료(bps)", depositPercent: "가정 입금 비용(%)", depositFixed: "가정 고정 비용(BRL)", costTitle: "입력 조건으로 계산한 예상 비용", openGlobal: "글로벌 목록 열기", compare: "옵션 비교", register: "공식 가입 열기", source: "이 페이지에서 확인한 공식 출처", share: "결정 링크 복사", officialCheck: "입력 전에 도메인, KYC, 입금 통화와 자격을 확인하세요", newAccount: "계정 및 혜택", facts: "결정을 바꾸는 조건", readPath: "지역 경로 읽기", readEvidence: "전체 결정 기준 보기", readCriteria: "KYC·계정·비용 확인" },
    tr: { label: "Hızlı karar", region: "İkamet", product: "Kullanım amacı", platform: "Platform", platformEmpty: "Henüz seçilmedi", amount: "Referans tutar", spotFee: "Varsayılan spot ücret (bps)", depositPercent: "Varsayılan yatırma maliyeti (%)", depositFixed: "Varsayılan sabit maliyet (BRL)", costTitle: "Girdi varsayımınıza göre tahmini maliyet", openGlobal: "Global dizini aç", compare: "Seçenekleri karşılaştır", register: "Resmî kaydı aç", source: "Bu sayfada kontrol edilen resmî kaynaklar", share: "Karar bağlantısını kopyala", officialCheck: "Bilgi girmeden önce alan adını, KYC'yi, yatırma para birimini ve uygunluğu doğrulayın", newAccount: "Hesap ve avantaj", facts: "Kararı değiştiren koşullar", readPath: "Yerel yolu oku", readEvidence: "Tüm karar ölçütlerini oku", readCriteria: "KYC, hesap ve maliyet ayrıntıları" },
  }[String(locale || "").split("-")[0]];
  const lang = String(locale || "").split("-")[0];
  const extra = brazilControlsCopyExtra[lang];
  if (localized || extra) return { ...controlsCopy.en, ...(localized || {}), ...(extra || {}) };
  return controlsCopy.en;
}

function formatCurrency(locale, value) {
  return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "en", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function sourceMap(sources) {
  return new Map((sources || []).map((source) => [source.id, source]));
}

function partnerForVenue(venue) {
  return partnerRegistry[venue.slug] || null;
}

function venueBenefit(partner, locale) {
  if (!partner) return "";
  return partner.benefit?.[locale] || partner.benefit?.["pt-BR"] || partner.benefit?.en || "";
}

function selectVenues(venues, platform) {
  const sourceBacked = (venues || []).filter((venue) => venue.access === "source-backed");
  if (platform) {
    const chosen = sourceBacked.find((venue) => venue.slug === platform);
    return chosen ? [chosen] : sourceBacked.slice(0, 3);
  }
  return sourceBacked.slice(0, 3);
}

function isBrazilShortlistPlatform(venues, platform) {
  if (!platform) return false;
  return (venues || []).some((venue) => venue.slug === platform && venue.access === "source-backed" && venue.product === "spot");
}

function currentLocation(initialUrl) {
  if (typeof window !== "undefined") return new URL(window.location.href);
  return new URL(initialUrl || "/br", "https://nexualpha.com");
}

function initialState(initialUrl) {
  return decisionStateFromUrl(initialUrl || (typeof window !== "undefined" ? window.location.href : "/br"));
}

function TextList({ value }) {
  if (Array.isArray(value)) return <ul>{value.map((item) => <li key={item}>{item}</li>)}</ul>;
  return <p>{value}</p>;
}

function normalizeAnswerTable(table) {
  if (!table) return null;
  if (Array.isArray(table)) {
    const rows = table
      .map((row) => [String(row?.item || "").trim(), String(row?.check || "").trim()])
      .filter((row) => row.some(Boolean));
    if (!rows.length) return null;
    return {
      headers: [
        { key: "item", label: "Item a conferir" },
        { key: "check", label: "Como verificar" },
      ],
      rows,
    };
  }
  const rawHeaders = table.headers || table.columns || [];
  const rows = table.rows || [];
  const headers = rawHeaders.map((header) => ({
    key: typeof header === "string" ? header : header.key || header.label,
    label: typeof header === "string" ? header : header.label || header.key,
  })).filter((header) => header.key && header.label);
  if (!headers.length || !rows.length) return null;
  return {
    headers,
    rows: rows.map((row) => Array.isArray(row) ? row : headers.map((header) => row?.[header.key] || row?.[header.label] || "")),
  };
}

function BrazilAeoAnswers({ answers = [], sources }) {
  if (!Array.isArray(answers) || answers.length === 0) return null;

  return (
    <section className="br-aeo-answers" aria-label="Perguntas respondidas">
      {answers.map((item) => {
        const table = normalizeAnswerTable(item.table);
        const answerSources = (item.sourceIds || []).map((id) => sources.get(id)).filter(Boolean);
        return (
          <details className="br-aeo-answer" key={item.id || item.question}>
            <summary>{item.question}</summary>
            <div className="br-aeo-answer__body">
              {item.answer ? <p>{item.answer}</p> : null}
              {item.steps?.length ? (
                <ol>
                  {item.steps.slice(0, 5).map((step) => <li key={step}>{step}</li>)}
                </ol>
              ) : null}
              {table ? (
                <table className="br-aeo-table">
                  <thead>
                    <tr>{table.headers.map((header) => <th key={header.key}>{header.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, index) => (
                      <tr key={`${item.id || item.question}-${index}`}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${table.headers[cellIndex].key}-${cellIndex}`} data-label={table.headers[cellIndex].label}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {answerSources.length ? (
                <ul className="br-aeo-sources" aria-label="Fontes desta resposta">
                  {answerSources.map((source) => (
                    <li key={source.id}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" {...(source.titleLang ? { lang: source.titleLang, translate: "no" } : {})}>{source.title}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>
        );
      })}
    </section>
  );
}

function resolveBrazilNextStep(step, state, pageLocale) {
  if (!step || typeof step !== "object") return null;
  if (step.href === "telegram:fees") {
    const funnel = buildTelegramWebsiteFunnelContext({
      intent: "fees",
      venue: state.platform || "all",
      market: "BR",
      locale: pageLocale,
      product: "spot",
      amount: state.amount,
      campaign: "br_pix_brl_fee_return",
    });
    return { ...step, href: funnel.deepLink, target: "_blank", telegramStart: funnel.startPayload, telegramReturnHref: funnel.returnHref };
  }
  if (step.href === "telegram:compare") {
    const funnel = buildTelegramWebsiteFunnelContext({
      intent: "compare",
      pair: "binance-vs-okx",
      market: "BR",
      locale: pageLocale,
      product: "spot",
      campaign: "br_pix_brl_compare_return",
    });
    return { ...step, href: funnel.deepLink, target: "_blank", telegramStart: funnel.startPayload, telegramReturnHref: funnel.returnHref };
  }
  if (typeof step.href === "string" && step.href.startsWith("/br")) {
    return { ...step, href: withBrazilState(step.href, state, pageLocale) };
  }
  return step.href ? step : null;
}

function BrazilNextSteps({ steps = [], state, pageLocale, onDecision }) {
  const resolved = steps.map((step) => resolveBrazilNextStep(step, state, pageLocale)).filter(Boolean);
  if (!resolved.length) return null;
  return (
    <nav className="br-next-steps v2-shell" aria-label="Próximos passos Brasil">
      <b>Próximos passos</b>
      <div>
        {resolved.map((step) => (
          <a
            key={`${step.kind}-${step.label}`}
            href={step.href}
            target={step.target}
            rel={step.target === "_blank" ? "noopener noreferrer" : undefined}
            data-cta-kind={step.kind === "telegram" ? "telegram" : "internal"}
            data-cta-placement={`brazil-next-step-${step.kind}`}
            data-growth-decision={`br_next_${step.kind}`}
            data-growth-placement={`brazil-next-step-${step.kind}`}
            data-growth-market="BR"
            data-growth-product="spot"
            data-telegram-start={step.telegramStart}
            data-telegram-return-href={step.telegramReturnHref}
            onClick={() => onDecision?.(`br_next_${step.kind}`, { placement: `brazil-next-step-${step.kind}` })}
          >
            {step.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function stateSearch(state, platform = state.platform) {
  const params = new URLSearchParams();
  params.set("locale", BRAZIL_PAGE_LOCALE);
  params.set("market", state.region);
  params.set("product", state.product);
  if (platform) params.set("platform", platform);
  params.set("amount", String(state.amount));
  params.set("spot_fee_bps", String(state.spotFeeBps));
  params.set("deposit_fee_pct", String(state.depositFeePercent));
  params.set("deposit_fixed_brl", String(state.depositFixedBrl));
  if (state.accountStage) params.set("account_stage", state.accountStage);
  if (state.funding) params.set("funding", state.funding);
  applyBrazilAttribution(params, state);
  return params.toString();
}

function applyBrazilAttribution(params, state) {
  for (const [key, value] of [
    ["utm_source", state.source],
    ["utm_medium", state.medium],
    ["utm_campaign", state.campaign],
  ]) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
}

function withBrazilPassport(href, state, pageLocale = BRAZIL_PAGE_LOCALE) {
  if (!href || typeof href !== "string" || !href.startsWith("/")) return href;
  const [pathAndSearch, rawHash = ""] = href.split("#");
  const target = new URL(pathAndSearch, "https://nexualpha.com");
  target.searchParams.set("locale", pageLocale);
  target.searchParams.set("market", state.region);
  target.searchParams.set("product", state.product);
  if (state.accountStage) target.searchParams.set("account_stage", state.accountStage);
  if (state.funding) target.searchParams.set("funding", state.funding);
  applyBrazilAttribution(target.searchParams, state);
  return `${target.pathname}${target.search}${rawHash ? `#${rawHash}` : ""}`;
}

function withBrazilState(href, state, pageLocale = BRAZIL_PAGE_LOCALE, platform = state.platform) {
  if (!href || typeof href !== "string" || !href.startsWith("/br")) return href;
  const [pathAndSearch, rawHash = ""] = href.split("#");
  const [path, rawSearch = ""] = pathAndSearch.split("?");
  const params = new URLSearchParams(rawSearch);
  params.set("locale", pageLocale);
  params.set("market", state.region);
  params.set("product", state.product);
  if (platform) params.set("platform", platform);
  else params.delete("platform");
  params.set("amount", String(state.amount));
  params.set("spot_fee_bps", String(state.spotFeeBps));
  params.set("deposit_fee_pct", String(state.depositFeePercent));
  params.set("deposit_fixed_brl", String(state.depositFixedBrl));
  if (state.accountStage) params.set("account_stage", state.accountStage);
  else params.delete("account_stage");
  if (state.funding) params.set("funding", state.funding);
  else params.delete("funding");
  applyBrazilAttribution(params, state);
  const search = params.toString();
  return `${path}${search ? `?${search}` : ""}${rawHash ? `#${rawHash}` : ""}`;
}

function BrazilDecisionChain({ page, state, pageLocale, onDecision }) {
  const items = BRAZIL_DECISION_CHAIN.map((item) => ({
    ...item,
    page: getBrazilPage(item.path),
  })).filter((item) => item.page);
  const currentIndex = Math.max(0, items.findIndex((item) => item.path === page.path));
  const previous = currentIndex > 0 ? items[currentIndex - 1] : null;
  const next = currentIndex < items.length - 1 ? items[currentIndex + 1] : null;
  const telegram = resolveBrazilNextStep({ label: "Continuar no Telegram", href: "telegram:compare", kind: "telegram" }, state, pageLocale);
  const platformReturnHref = `#br-shortlist-title`;
  const primaryHref = next ? withBrazilState(next.path, state, pageLocale) : platformReturnHref;
  const primaryLabel = next ? `Próximo: ${next.label}` : "Voltar à escolha de plataforma";
  const primaryDecision = next ? `br_chain_${next.path.replaceAll("/", "_")}` : "br_chain_platform_return";

  return (
    <nav className="br-chain v2-shell" aria-label="Trilha de decisão Brasil">
      {/* no eyebrow and no restated page title: the stepper's current step (aria-current) says where the reader is */}
      <ol className="br-chain__crumbs">
        {items.map((item, index) => (
          <li key={item.path} aria-current={index === currentIndex ? "step" : undefined}>
            <a
              href={withBrazilState(item.path, state, pageLocale)}
              onClick={() => onDecision?.("br_chain_jump", { placement: "brazil-decision-chain", platform: state.platform || "" })}
            >
              <span>{index + 1}</span>
              {item.shortLabel}
            </a>
          </li>
        ))}
      </ol>
      <div className="br-chain__actions">
        {previous ? (
          <a href={withBrazilState(previous.path, state, pageLocale)} onClick={() => onDecision?.("br_chain_previous", { placement: "brazil-decision-chain" })}>
            Voltar: {previous.shortLabel}
          </a>
        ) : null}
        <a className="br-chain__primary" href={primaryHref} onClick={() => onDecision?.(primaryDecision, { placement: "brazil-decision-chain" })}>
          {primaryLabel}
        </a>
        {telegram ? (
          <a
            href={telegram.href}
            target={telegram.target}
            rel="noopener noreferrer"
            data-cta-kind="telegram"
            data-cta-placement="brazil-decision-chain"
            data-telegram-start={telegram.telegramStart}
            data-telegram-return-href={telegram.telegramReturnHref}
            onClick={() => onDecision?.("br_chain_telegram", { placement: "brazil-decision-chain" })}
          >
            {telegram.label}
          </a>
        ) : null}
      </div>
      <div className="br-chain__evidence" aria-label="Entradas de evidência Brasil">
        <span>Critérios de apoio</span>
        {BRAZIL_EVIDENCE_CHAIN.map((item) => (
          <a
            key={item.path}
            href={withBrazilState(item.path, state, pageLocale)}
            onClick={() => onDecision?.("br_evidence_jump", { placement: "brazil-evidence-chain" })}
          >
            {item.shortLabel}
          </a>
        ))}
      </div>
    </nav>
  );
}

function BrazilDecisionPath({ state, selectedVenues, mainRegistrationUrl, mainResearchUrl, globalDirectoryUrl, canRegister, onDecision, asDisclosure = false }) {
  const selectedVenue = selectedVenues.find((venue) => venue.slug === state.platform);
  const firstVenue = selectedVenues[0];
  const shortlistNames = selectedVenues.map((venue) => venue.name).join(" ou ");
  const decisionSearch = stateSearch(state, selectedVenue?.slug || firstVenue?.slug || "");
  const pixHref = `/br/pix?${decisionSearch}`;
  const eligibilityHref = `/br/kyc-cpf?${decisionSearch}`;
  const finalHref = !state.platform
    ? "#br-shortlist-title"
    : canRegister
      ? mainRegistrationUrl
      : (state.region === "BR" && state.product === "spot" ? mainResearchUrl : globalDirectoryUrl);
  const ctaHref = finalHref;
  const finalIsExternal = /^https:\/\//i.test(finalHref || "");
  const finalKind = canRegister ? "registration" : state.platform ? "research" : "internal-shortlist";
  const finalLabel = !state.platform
    ? "Escolher plataforma do shortlist"
    : "Continuar cadastro ou pesquisa";
  const finalText = !state.platform
    ? "Escolha Binance ou OKX no shortlist antes de sair da NexuAlpha."
    : canRegister
      ? "Abrir cadastro oficial"
      : "Ver regras da conta primeiro";
  const status = state.platform
    ? selectedVenue
      ? `Shortlist selecionado: ${selectedVenue.name}`
      : `Shortlist sugerido: ${shortlistNames || "Binance ou OKX"}`
    : `Shortlist sugerido: ${shortlistNames || "Binance ou OKX"}`;

  const pathSteps = (
      <ol>
        <li>
          <a href={pixHref} rel="nofollow" data-growth-decision="br_verify_pix" data-growth-placement="brazil-first-viewport-path" onClick={() => onDecision?.("br_verify_pix", { placement: "brazil-first-viewport-path" })}>
            <i className="br-node" aria-hidden="true" />
            <b>1. Verificar Pix/BRL</b>
            <span>Depósito, saque, CPF, titularidade, limite e taxa.</span>
          </a>
        </li>
        <li>
          <a href={eligibilityHref} rel="nofollow" data-growth-decision="br_verify_eligibility" data-growth-placement="brazil-first-viewport-path" onClick={() => onDecision?.("br_verify_eligibility", { placement: "brazil-first-viewport-path" })}>
            <i className="br-node" aria-hidden="true" />
            <b>2. Verificar CPF e elegibilidade</b>
            <span>KYC, produto spot, residência e benefício exibido na conta.</span>
          </a>
        </li>
        <li>
          <a
            href={ctaHref}
            target={finalIsExternal ? "_blank" : undefined}
            rel={finalIsExternal ? "sponsored noopener noreferrer" : undefined}
            data-cta-kind={finalKind === "registration" ? "registration" : finalKind === "research" ? "research" : "internal"}
            data-cta-platform={finalKind === "registration" ? selectedVenue?.slug : undefined}
            data-cta-placement="brazil-first-viewport-register"
            data-growth-decision={finalKind === "registration" ? selectedVenue?.slug : "br_shortlist_after_checks"}
            data-growth-placement="brazil-first-viewport-path"
            onClick={() => onDecision?.(finalKind === "registration" ? "br_register_after_checks" : "br_shortlist_after_checks", { placement: "brazil-first-viewport-path" })}
          >
            <i className="br-node" aria-hidden="true" />
            <b>3. {finalLabel}</b>
            <span>{finalText}</span>
          </a>
        </li>
      </ol>
  );

  if (asDisclosure) {
    return (
      <details className="br-decision-path br-decision-path--disclosure" aria-label="Caminho rápido antes do cadastro">
        <summary>{status}</summary>
        {pathSteps}
      </details>
    );
  }

  return (
    <div className="br-decision-path" aria-label="Caminho rápido antes do cadastro" data-chosen={state.platform ? "true" : undefined}>
      <p>{status}</p>
      {pathSteps}
    </div>
  );
}

function earlyNextStepItems({ venues, state, pageLocale }) {
  return selectVenues(venues, state.platform).slice(0, 2).map((venue) => {
    const publicCta = publicCtaForVenue(venue.slug, pageLocale, state.region);
    const regionalCta = regionalVenueCta(venue.slug, pageLocale, state.region, state.product);
    const canRegister = state.region === "BR"
      && state.product === "spot"
      && publicCta.hasReferral
      && regionalCta.direct
      && regionalCta.hasReferral
      && /^https:\/\//i.test(regionalCta.ctaHref || "");
    return {
      venue,
      publicCta,
      regionalCta,
      canRegister,
      primaryHref: canRegister ? regionalCta.ctaHref : withBrazilPassport(`/exchanges/${venue.slug}#registration-path`, state, pageLocale),
      compareHref: withBrazilState("/br/comparar", state, pageLocale, venue.slug),
    };
  });
}

function BrazilEarlyNextStep({ venues, state, pageLocale, copy, onDecision }) {
  const items = earlyNextStepItems({ venues, state, pageLocale });
  if (!items.length) return null;
  const pixHref = withBrazilState("/br/pix", state, pageLocale, items[0]?.venue.slug || state.platform);

  return (
    <section className="br-early-next-step" aria-labelledby="br-early-next-step-title" data-testid="brazil-early-next-step">
      <div className="br-early-next-step__head">
        <b id="br-early-next-step-title">{copy.nextTitle}</b>
        <a
          href={pixHref}
          data-cta-kind="internal"
          data-cta-placement="brazil-early-next-step-pix"
          data-growth-decision="br_early_pix_check"
          data-growth-placement="brazil-early-next-step"
          data-growth-market={state.region}
          data-growth-product={state.product}
          onClick={() => onDecision?.("br_early_pix_check", { placement: "brazil-early-next-step" })}
        >
          {copy.nextCheck}
        </a>
      </div>
      <div className="br-early-next-step__items">
        {items.map(({ venue, publicCta, regionalCta, canRegister, primaryHref, compareHref }) => {
          const primaryKind = canRegister ? "registration" : "research";
          return (
            <article className="br-early-next-step__item" key={venue.slug} data-testid={`brazil-early-next-step-${venue.slug}`}>
              <span translate="no" lang="en">{venue.name}</span>
              <div>
                <a
                  className="br-early-next-step__primary"
                  href={primaryHref}
                  target={canRegister ? "_blank" : undefined}
                  rel={canRegister ? "sponsored noopener noreferrer" : undefined}
                  data-cta-kind={primaryKind}
                  data-cta-status={publicCta.claim.status}
                  data-cta-platform={canRegister ? venue.slug : undefined}
                  data-cta-placement={`brazil-early-next-step-${venue.slug}`}
                  data-growth-decision={canRegister ? venue.slug : "br_early_research"}
                  data-growth-placement="brazil-early-next-step"
                  data-growth-market={state.region}
                  data-growth-product={state.product}
                  onClick={() => onDecision?.(canRegister ? "br_early_register" : "br_early_research", { platform: venue.slug, placement: "brazil-early-next-step" })}
                >
                  {canRegister ? copy.register : copy.officialCheck}
                </a>
                <a
                  href={compareHref}
                  data-cta-kind="internal"
                  data-cta-placement={`brazil-early-next-step-compare-${venue.slug}`}
                  data-growth-decision="br_early_compare"
                  data-growth-placement="brazil-early-next-step"
                  data-growth-market={state.region}
                  data-growth-product={state.product}
                  data-growth-platform={venue.slug}
                  data-regional-cta-state={regionalCta.ctaState}
                  onClick={() => onDecision?.("br_early_compare", { platform: venue.slug, placement: "brazil-early-next-step" })}
                >
                  {copy.nextCompare}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function BrazilEntryLink({ locale = "en" }) {
  const copy = copyFor(locale);
  const localRouteLabel = {
    ja: "ブラジル：登録前に確認",
    ko: "브라질: 가입 전 결정",
    tr: "Brezilya: kayıt öncesi karar",
    es: "Brasil: decide antes de registrarte",
    fr: "Brésil : décider avant l’inscription",
    de: "Brasilien: vor der Registrierung entscheiden",
    ru: "Бразилия: решение до регистрации",
    id: "Brasil: putuskan sebelum mendaftar",
    vi: "Brazil: quyết định trước khi đăng ký",
    it: "Brasile: decidi prima della registrazione",
    ar: "البرازيل: قرر قبل التسجيل",
  }[String(locale || "").split("-")[0]];
  return (
    <a className="br-entry-link" href="/br" data-testid="brazil-entry-link">
      <span>{localRouteLabel || copy.entry}</span>
      <small>{{
        // l10n: needs native review
        ur: "BRL، Pix، اسپاٹ پلیٹ فارمز کی مختصر فہرست",
        // l10n: needs native review
        uk: "BRL, Pix, короткий список спотових платформ",
        "zh-Hans": "BRL、Pix、现货候选清单",
        "zh-Hant": "BRL、Pix、現貨候選清單",
        ja: "BRL・Pix・現物取引の候補",
        ko: "BRL·Pix·현물 후보",
        tr: "BRL, Pix, spot kısa listesi",
        es: "BRL, Pix y selección de spot",
        "pt-BR": "BRL, Pix e lista curta de spot",
        fr: "BRL, Pix, sélection spot",
        de: "BRL, Pix, Spot-Auswahl",
        ru: "BRL, Pix, подборка спот-платформ",
        ar: "BRL وPix وقائمة مختصرة للسبوت",
        id: "BRL, Pix, daftar pendek spot",
        vi: "BRL, Pix, danh sách spot rút gọn",
        it: "BRL, Pix, selezione spot",
      }[locale] || "BRL, Pix, spot shortlist"}</small>
    </a>
  );
}

export function BrazilDecisionPage({ pathname = "/br", initialUrl, locale = "pt-BR", trackGrowthDecision = trackGrowthDecisionEvent }) {
  const requestedLocale = locale;
  const pageLocale = BRAZIL_PAGE_LOCALE;
  const copy = copyFor(pageLocale);
  const page = getBrazilPage?.(pathname) || getBrazilPage?.("/br");
  const venues = BRAZIL_VENUES || [];
  const sources = sourceMap(BRAZIL_SOURCES || []);
  const [state, setState] = useState(() => initialState(initialUrl));
  const [shareStatus, setShareStatus] = useState("");
  const restoredFromUrlRef = useRef(false);

  const selectedVenues = useMemo(() => selectVenues(venues, state.platform), [state.platform, venues]);
  const estimate = useMemo(() => costEstimate(state), [state]);
  const shownTotal = Number(estimate.total) || 0; // the computed estimate, shown final (never an intermediate figure)
  const isBrazil = state.region === "BR";
  const isSpot = state.product === "spot";
  const selectedIsBrazilShortlist = isBrazilShortlistPlatform(venues, state.platform);
  const activePartner = selectedIsBrazilShortlist && partnerForVenue(selectedVenues.find(venue => venue.slug === state.platform) || {});
  const activeCta = selectedIsBrazilShortlist ? publicCtaForVenue(state.platform, pageLocale, state.region) : null;
  const activeRegionalCta = selectedIsBrazilShortlist ? regionalVenueCta(state.platform, pageLocale, state.region, state.product) : null;
  const directRegistration = Boolean(isBrazil && isSpot && selectedIsBrazilShortlist && activeCta?.hasReferral && activeRegionalCta?.direct && activeRegionalCta?.hasReferral && /^https:\/\//i.test(activeRegionalCta.ctaHref || ""));
  const mainRegistrationUrl = directRegistration ? activeRegionalCta.ctaHref : null;
  const globalDirectoryUrl = withBrazilPassport("/exchanges", state, pageLocale);
  const mainResearchUrl = state.platform
    ? selectedIsBrazilShortlist
      ? withBrazilPassport(`/exchanges/${state.platform}#registration-path`, state, pageLocale)
      : globalDirectoryUrl
    : "#br-shortlist-title";

  const emitDecision = useCallback((decision, detail = {}, decisionState = state) => {
    if (typeof trackGrowthDecision !== "function") return;
    trackGrowthDecision({
      market: decisionState.region,
      product: decisionState.product,
      platform: detail.platform || decisionState.platform || "",
      campaign: decisionState.campaign,
      publisher: decisionState.publisher,
      accountStage: decisionState.accountStage,
      funding: decisionState.funding,
      decision: decision === "brazil_platform_select" ? `select_${decisionState.platform || "undecided"}` : decision,
      placement: detail.placement || page.slug,
    });
  }, [page.slug, state, trackGrowthDecision]);

  const updateState = useCallback((patch, decision = "") => {
    setState((value) => {
      const next = normalizeDecisionState({ ...value, ...patch });
      if (decision && typeof window !== "undefined") window.queueMicrotask(() => emitDecision(decision, patch, next));
      return next;
    });
  }, [emitDecision]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    // Match prerender on the first frame; then restore real whitelisted campaign state.
    const saved = hasDecisionStateSearch(window.location.search)
      ? decisionStateFromUrl(window.location.href)
      : loadDecisionState(browserSessionStorage(window), state);
    if (JSON.stringify(saved) !== JSON.stringify(state)) setState(saved);
    restoredFromUrlRef.current = true;
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !restoredFromUrlRef.current) return undefined;
    saveDecisionState(browserSessionStorage(window), state);
    const nextPath = writeDecisionStateToUrl(window.location.href, state);
    window.history.replaceState({ ...(window.history.state || {}), nexuBrazilDecision: true }, "", nextPath);
    return undefined;
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onPop = () => setState(decisionStateFromUrl(window.location.href, defaultDecisionState));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const shareDecision = async () => {
    const location = currentLocation(initialUrl);
    const href = `${location.origin}${writeDecisionStateToUrl(location, state)}`;
    try {
      await navigator.clipboard.writeText(href);
      setShareStatus(copy.copied);
      emitDecision("share_brazil_decision", { placement: "share_link" });
    } catch {
      setShareStatus(copy.copyFailed);
    }
  };

  const contentSources = (page.sourceIds || []).map((id) => sources.get(id)).filter(Boolean);
  const isComparisonPage = page.path === "/br/comparar";
  const isEntryPage = page.path === "/br";
  const earlyNextStepSection = (
    <BrazilEarlyNextStep
      venues={venues}
      state={state}
      pageLocale={pageLocale}
      copy={copy}
      onDecision={emitDecision}
    />
  );
  const comparisonSupportSection = isComparisonPage ? (
    <section className="br-decision-rail v2-shell" aria-labelledby="br-decision-rail-title">
      <div className="br-section-head">
        <h2 id="br-decision-rail-title">Compare em três perguntas</h2>
        <a
          href={withBrazilPassport("/rates", state, pageLocale)}
          data-cta-kind="research"
          data-cta-placement="brazil-compare-cost-tool"
          data-growth-decision="br-costs"
          data-growth-placement="brazil-compare-cost-tool"
          data-growth-market={state.region}
          data-growth-product={state.product}
          data-growth-account-stage={state.accountStage}
          data-growth-funding={state.funding}
          onClick={() => emitDecision("brazil_cost_tool_click", { placement: "brazil-compare-cost-tool" })}
        >
          Simular custo em BRL
        </a>
      </div>
      <div className="br-decision-rail__grid">
        <article>
          <b>1. Como entra o dinheiro?</b>
          <p>Confirme BRL/Pix, limite e titularidade bancária dentro da sua conta.</p>
        </article>
        <article>
          <b>2. Qual é o custo total?</b>
          <p>Compare taxa spot, custo de entrada, spread, saque e valor da ordem.</p>
        </article>
        <article>
          <b>3. A conta é elegível?</b>
          <p>Confira CPF, KYC, residência, produto e regra da campanha antes do cadastro.</p>
        </article>
      </div>
    </section>
  ) : null;
  const shortlistSection = (
    <section className="br-shortlist v2-shell" aria-labelledby="br-shortlist-title">
      <div className="br-section-head">
        <h2 id="br-shortlist-title">{copy.compare}</h2>
        <a href={globalDirectoryUrl}>{copy.openGlobal}</a>
      </div>
      <div className="br-venue-grid">
        {selectedVenues.map((venue) => {
          const partner = partnerForVenue(venue);
          const cta = publicCtaForVenue(venue.slug, pageLocale, state.region);
          const regionalCta = regionalVenueCta(venue.slug, pageLocale, state.region, state.product);
          const registrationUrl = regionalCta.ctaHref || "";
          const canRegister = isBrazil && isSpot && cta.hasReferral && regionalCta.direct && regionalCta.hasReferral && /^https:\/\//i.test(registrationUrl);
          const researchUrl = withBrazilPassport(`/exchanges/${venue.slug}#registration-path`, state, pageLocale);
          const isSelected = state.platform === venue.slug;
          return (
            <article className="br-venue-card" key={venue.slug} data-testid={`brazil-venue-${venue.slug}`} data-selected={isSelected ? "true" : undefined}>
              <div className="br-venue-card__top">
                <span className="br-venue-card__logo"><BrandMark slug={venue.slug} compact /></span>
                <div className="br-venue-card__id">
                  <b translate="no" lang="en">{venue.name}</b>
                  <span>{venue.paymentSummary}</span>
                </div>
              </div>
              <details className="br-venue-card__details">
                <summary>{copy.readCriteria}</summary>
                <dl>
                  <div><dt>KYC</dt><dd><TextList value={venue.requirements} /></dd></div>
                  <div><dt>{copy.newAccount}</dt><dd>{venue.eligibilityNote || venueBenefit(partner, pageLocale) || copy.officialCheck}</dd></div>
                  <div><dt>Taxas</dt><dd>{venue.feeNote}</dd></div>
                </dl>
              </details>
              <div className="br-venue-card__actions">
                <button type="button" onClick={() => updateState({ platform: venue.slug }, "brazil_platform_select")} aria-pressed={isSelected}>
                  {isComparisonPage ? `Selecionar ${venue.name}` : `Escolher ${venue.name}`}
                </button>
                {canRegister ? (
                  <a href={registrationUrl} target="_blank" rel="sponsored noopener noreferrer" data-cta-kind="registration" data-cta-status={cta.claim.status} data-cta-platform={venue.slug} data-cta-placement={`brazil-${page.slug}-${venue.slug}`} data-growth-decision={venue.slug} data-growth-placement={`brazil-${page.slug}-${venue.slug}`} data-growth-market={state.region} data-growth-product={state.product} onClick={() => emitDecision("brazil_register_click", { platform: venue.slug, placement: `brazil-${page.slug}-${venue.slug}` })}>
                    {copy.register}
                  </a>
                ) : (
                  <a href={researchUrl} data-cta-kind="research" data-cta-status={cta.claim.status} data-cta-placement={`brazil-${page.slug}-${venue.slug}`} onClick={() => emitDecision("brazil_global_detail_click", { platform: venue.slug, placement: `brazil-${page.slug}-${venue.slug}` })}>
                    {isComparisonPage && isBrazil ? "Verificar condições" : isBrazil ? "Ver perfil e condições" : copy.openGlobal}
                  </a>
                )}
                {isComparisonPage || (isBrazil && !canRegister) ? <small className="br-venue-card__check-note">{isBrazil ? copy.officialCheck : copy.openGlobal}</small> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );

  const answerSection = (
    <section className="br-answer v2-shell" id="br-market-content">
        <p>{page.answer}</p>
      </section>
  );
  const pathBlock = (
    <BrazilDecisionPath
      state={state}
      selectedVenues={selectedVenues}
      mainRegistrationUrl={mainRegistrationUrl}
      mainResearchUrl={mainResearchUrl}
      globalDirectoryUrl={globalDirectoryUrl}
      canRegister={directRegistration}
      onDecision={emitDecision}
      asDisclosure={isComparisonPage}
    />
  );
  const heroSection = (
    <section className={`br-hero v2-shell${isComparisonPage ? " br-hero--comparison" : ""}`}>
        <div className="br-hero__copy">
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <nav className="br-hero__actions" aria-label="Ações de decisão do Brasil">
            <a href="#br-decision-controls">{copy.label}</a>
            <a href="#br-market-content">{copy.readPath}</a>
          </nav>
          {isEntryPage ? pathBlock : null}
        </div>
        <form className="br-decision-panel" id="br-decision-controls" data-testid="brazil-decision-controls" onSubmit={(event) => event.preventDefault()}>
          <div className="br-decision-panel__head">
            <div className="br-decision-panel__title"><b>{copy.label}</b><span className="br-panel-tag">Brasil · Decisão local</span></div>
            <button type="button" onClick={shareDecision} data-testid="brazil-share-link">{copy.share}</button>
          </div>
          <div className="br-control-grid">
            <label>
              <span>{copy.region}</span>
              <select name="region" value={state.region} onChange={(event) => updateState({ region: event.target.value }, "brazil_market_change")} data-testid="brazil-region">
                {regionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>{copy.product}</span>
              <select name="product" value={state.product} onChange={(event) => updateState({ product: event.target.value }, "brazil_product_change")} data-testid="brazil-product">
                {productOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>{copy.platform}</span>
              <select name="platform" value={state.platform} onChange={(event) => updateState({ platform: event.target.value }, "brazil_platform_select")} data-testid="brazil-platform">
                <option value="">{copy.platformEmpty}</option>
                {venues.filter((venue) => venue.access === "source-backed").map((venue) => <option key={venue.slug} value={venue.slug}>{venue.name}</option>)}
              </select>
            </label>
          </div>
          {state.platform && selectedIsBrazilShortlist && activeRegionalCta ? (
            <div className="br-selected-registration-confirm" data-testid="brazil-selected-registration-confirm">
              <div>
                <span>{copy.platform}</span>
                <b translate="no" lang="en">{activePartner?.name || state.platform.toUpperCase()}</b>
                {activeRegionalCta.inviteCode ? <small>{copy.newAccount}: <strong translate="no" lang="en">{activeRegionalCta.inviteCode}</strong></small> : <small>{copy.officialCheck}</small>}
              </div>
              {directRegistration ? (
                <a
                  href={activeRegionalCta.ctaHref}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  data-cta-kind="registration"
                  data-cta-status={activeCta.claim.status}
                  data-cta-platform={state.platform}
                  data-cta-placement="brazil-selected-registration-confirm"
                  data-growth-decision={state.platform}
                  data-growth-placement="brazil-selected-registration-confirm"
                  data-growth-market={state.region}
                  data-growth-product={state.product}
                  onClick={() => emitDecision("brazil_register_click", { platform: state.platform, placement: "brazil-selected-registration-confirm" })}
                >
                  {copy.register}
                </a>
              ) : (
                <a
                  href={isBrazil && isSpot ? mainResearchUrl : globalDirectoryUrl}
                  data-cta-kind="research"
                  data-cta-status={activeRegionalCta.claim.status}
                  data-cta-placement="brazil-selected-registration-confirm-research"
                  data-growth-decision="br_selected_research"
                  data-growth-placement="brazil-selected-registration-confirm"
                  data-growth-market={state.region}
                  data-growth-product={state.product}
                  onClick={() => emitDecision("brazil_global_detail_click", { platform: state.platform, placement: "brazil-selected-registration-confirm" })}
                >
                  {copy.officialCheck}
                </a>
              )}
            </div>
          ) : null}
          {!isEntryPage ? pathBlock : null}
          <div className="br-decision-primary">
            {mainRegistrationUrl ? <a href={mainRegistrationUrl} target="_blank" rel="sponsored noopener noreferrer" data-cta-kind="registration" data-cta-status={activeCta.claim.status} data-cta-platform={state.platform} data-cta-placement={`brazil-${page.slug}-primary`} data-growth-decision={state.platform} data-growth-placement={`brazil-${page.slug}-primary`} data-growth-market={state.region} data-growth-product={state.product}>
              {copy.register} · {activePartner.name || state.platform.toUpperCase()}
            </a> : <a href={isBrazil && isSpot ? mainResearchUrl : globalDirectoryUrl} data-cta-kind={isBrazil && isSpot && state.platform ? "research" : undefined} data-cta-status={activeCta?.claim.status} data-cta-placement={isBrazil && isSpot && state.platform ? `brazil-${page.slug}-primary-research` : undefined}>
              {isBrazil && isSpot && state.platform ? copy.officialCheck : (isBrazil && isSpot ? copy.compare : copy.openGlobal)}
            </a>}
          </div>
          <details className="br-cost-options" open={pathname === "/br/custos" ? true : undefined}>
            <summary>Simular custo em BRL · {formatCurrency(pageLocale, Number(state.amount) || 0)}</summary>
            <div className="br-control-grid">
            <label>
              <span>{copy.amount}</span>
              <input name="amount" type="number" inputMode="decimal" min="0" step="50" value={state.amount} onChange={(event) => updateState({ amount: event.target.value })} data-testid="brazil-amount" />
            </label>
            <label>
              <span>{copy.spotFee}</span>
              <input name="spot_fee_bps" type="number" inputMode="decimal" min="0" max="500" step="0.1" value={state.spotFeeBps} onChange={(event) => updateState({ spotFeeBps: event.target.value })} data-testid="brazil-spot-fee" />
            </label>
            <label>
              <span>{copy.depositPercent}</span>
              <input name="deposit_fee_pct" type="number" inputMode="decimal" min="0" max="10" step="0.01" value={state.depositFeePercent} onChange={(event) => updateState({ depositFeePercent: event.target.value })} data-testid="brazil-deposit-percent" />
            </label>
            <label>
              <span>{copy.depositFixed}</span>
              <input name="deposit_fixed_brl" type="number" inputMode="decimal" min="0" max="10000" step="1" value={state.depositFixedBrl} onChange={(event) => updateState({ depositFixedBrl: event.target.value })} data-testid="brazil-deposit-fixed" />
            </label>
          </div>
          </details>
          <div className="br-cost-strip" aria-live="polite" data-testid="brazil-cost-estimate">
            <span>{copy.costTitle}</span>
            {/* the figure always carries its basis: amount → cost, at the assumed bps (never a bare "R$ 1,00") */}
            <span className="br-cost-basis">{copy.amount} <b>{formatCurrency(pageLocale, Number(state.amount) || 0)}</b> <span aria-hidden="true">→</span></span><b aria-hidden="true" className="br-cost-figure">{formatCurrency(pageLocale, shownTotal)}</b><span className="br-cost-bps">{costAtCopy(pageLocale)} {String(state.spotFeeBps || 0).replace(".", pageLocale.startsWith("pt") ? "," : ".")} bps</span><b className="br-sr">{formatCurrency(pageLocale, estimate.total)}</b>
            <small>{copy.costNote}</small>
          </div>
          <p className="br-decision-panel__status" aria-live="polite">{shareStatus || (!isBrazil ? copy.nonBr : isSpot ? copy.brOnly : copy.spotOnly)}</p>
        </form>
        {!isComparisonPage && !isEntryPage ? earlyNextStepSection : null}
        {!isComparisonPage && !isEntryPage ? answerSection : null}
      </section>
  );
  const continuationSection = (
    <>
      <BrazilDecisionChain page={page} state={state} pageLocale={pageLocale} onDecision={emitDecision} />

      <section className="v2-shell" aria-label="Pesquisa contextual com o Telegram">
        <OnsiteTelegramBotHandoff
          canonicalPath={page.path}
          intent="compare"
          pair="binance-vs-okx"
          returnRoute={page.path}
          locale={pageLocale}
          market={state.region}
          product={state.product}
          campaign="r40-br-owner-telegram-return"
          placement="brazil-owner-telegram-handoff"
          queries={["Verificar condições da conta para Pix/BRL", "Voltar a esta decisão para o Brasil"]}
        />
      </section>

      <BrazilNextSteps steps={page.nextSteps} state={state} pageLocale={pageLocale} onDecision={emitDecision} />
    </>
  );

  return (
    <main
      className={`v6 v2-page v3-page br-decision${isComparisonPage ? " br-decision--comparison" : ""}${isEntryPage ? " br-decision--entry" : ""}`}
      id="top"
      lang={pageLocale}
      dir="ltr"
      data-testid="brazil-decision-page"
      data-requested-locale={requestedLocale === pageLocale ? undefined : requestedLocale}
      data-locale-fallback={requestedLocale === pageLocale ? undefined : pageLocale}
    >
      {isEntryPage ? (
        <section className="br-primary-workbench" aria-label={copy.label}>
          {heroSection}
          {answerSection}
          {shortlistSection}
        </section>
      ) : heroSection}

      {isComparisonPage ? shortlistSection : null}

      {isComparisonPage ? answerSection : null}

      {isComparisonPage ? earlyNextStepSection : null}

      {isEntryPage ? (
        <details className="br-continuation-disclosure v2-shell">
          <summary>{copy.readPath}</summary>
          {earlyNextStepSection}
          {continuationSection}
        </details>
      ) : continuationSection}

      {comparisonSupportSection}

      {!isComparisonPage && !isEntryPage ? shortlistSection : null}

      <details className="br-content-disclosure v2-shell">
        <summary>{copy.readEvidence}</summary>
        <div className="br-content-grid">
          {page.sections.map((section) => (
            <article className="br-content-block" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets?.length ? <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </article>
          ))}
        </div>
        <BrazilAeoAnswers answers={page.aeoAnswers} sources={sources} />
      </details>

      <section className="br-sources v2-shell" aria-labelledby="br-sources-title">
        <div className="br-section-head">
          <h2 id="br-sources-title">{copy.source}</h2>
          <span>{copy.facts}</span>
        </div>
        <ul>
          {contentSources.length ? contentSources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" {...(source.titleLang ? { lang: source.titleLang, translate: "no" } : {})}>{source.title}</a>
              <time dateTime={source.checkedAt}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(source.checkedAt))}</time>
            </li>
          )) : <li><span>{copy.officialCheck}</span></li>}
        </ul>
        {page.faq?.length ? (
          <div className="br-faq">
            {page.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default BrazilDecisionPage;
export { BrazilCostEmbed } from "./BrazilCostEmbed.jsx";
