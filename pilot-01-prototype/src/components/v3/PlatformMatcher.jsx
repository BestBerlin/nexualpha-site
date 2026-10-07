import { useMemo, useState } from "react";
import { BrandMark } from "../brand/BrandMark";
import { intentFromSelection, matcherDecisionDefaults, platformMatcherModel, selectionForIntent } from "./matcher-model";
import { regionalShortlistAccountStageOptions, regionalShortlistMarketOptions, regionalShortlistProductOptions } from "../../data/regional-shortlist.js";
import "./matcher.css";

const compactMatcherCopy = (locale) => ({
  "zh-Hans": { kicker: "高级地区匹配器", hint: "展开后按居住地、产品和入金方式细分候选平台", selected: "当前上下文" },
  "zh-Hant": { kicker: "進階地區匹配器", hint: "展開後按居住地、產品和入金方式細分候選平台", selected: "目前上下文" },
  ja: { kicker: "高度な地域マッチャー", hint: "開くと居住地、商品、入金方法で候補を絞れます", selected: "現在の条件" },
  ko: { kicker: "고급 지역 매처", hint: "열면 거주 지역, 상품, 입금 방식으로 후보를 좁힙니다", selected: "현재 조건" },
  tr: { kicker: "Gelişmiş bölge eşleyici", hint: "Açınca ikamet, ürün ve fonlama yoluna göre adayları daraltır", selected: "Geçerli bağlam" },
  ru: { kicker: "Расширенный региональный подбор", hint: "Откройте, чтобы уточнить страну, продукт и способ пополнения", selected: "Текущий контекст" },
  de: { kicker: "Erweiterter Regional-Matcher", hint: "Öffnen, um Region, Produkt und Einzahlung zu verfeinern", selected: "Aktueller Kontext" },
  fr: { kicker: "Matcher régional avancé", hint: "Ouvrez pour affiner résidence, produit et mode de financement", selected: "Contexte actuel" },
  es: { kicker: "Selector regional avanzado", hint: "Abre para refinar residencia, producto y método de fondeo", selected: "Contexto actual" },
  "pt-BR": { kicker: "Seletor regional avançado", hint: "Abra para refinar residência, produto e forma de depósito", selected: "Contexto atual" },
  it: { kicker: "Matcher regionale avanzato", hint: "Apri per filtrare residenza, prodotto e metodo di funding", selected: "Contesto attuale" },
  id: { kicker: "Pencocok regional lanjutan", hint: "Buka untuk mempersempit wilayah, produk, dan metode pendanaan", selected: "Konteks saat ini" },
  vi: { kicker: "Bộ ghép khu vực nâng cao", hint: "Mở để lọc theo nơi cư trú, sản phẩm và cách nạp tiền", selected: "Ngữ cảnh hiện tại" },
  ar: { kicker: "مطابق إقليمي متقدم", hint: "افتحه لتصفية بلد الإقامة والمنتج وطريقة التمويل", selected: "السياق الحالي" },
}[locale] || { kicker: "Advanced regional matcher", hint: "Open to refine residence, product and funding route before comparing", selected: "Current context" });

export function PlatformMatcher({ locale = "en", venues = [], selected = [], decisionPassport = {}, defaultOpen = false, onSelectionChange }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [intentKey, setIntentKey] = useState(() => intentFromSelection(venues, selected));
  const marketOptions = useMemo(() => regionalShortlistMarketOptions(), []);
  const productOptions = useMemo(() => regionalShortlistProductOptions(locale), [locale]);
  const accountStageOptions = useMemo(() => regionalShortlistAccountStageOptions(locale), [locale]);
  const [market, setMarket] = useState(() => decisionPassport.market || marketOptions[0]?.value || "MX");
  const [product, setProduct] = useState(() => decisionPassport.product || "spot");
  const [accountStage, setAccountStage] = useState(() => decisionPassport.accountStage || "new_account");
  const [funding, setFunding] = useState(() => decisionPassport.funding || "");
  const [kycPreference, setKycPreference] = useState(() => decisionPassport.kycPreference || matcherDecisionDefaults.kycPreference);
  const [usageFrequency, setUsageFrequency] = useState(() => decisionPassport.usageFrequency || matcherDecisionDefaults.usageFrequency);
  const [usageScale, setUsageScale] = useState(() => decisionPassport.usageScale || matcherDecisionDefaults.usageScale);
  const model = useMemo(() => platformMatcherModel({
    locale,
    venues,
    selected,
    intentKey,
    decisionPassport: { market, product, accountStage, funding, kycPreference, usageFrequency, usageScale },
  }), [accountStage, funding, intentKey, kycPreference, locale, market, product, selected, usageFrequency, usageScale, venues]);
  const fundingOptions = model.regional?.fundingOptions?.length ? model.regional.fundingOptions : (model.regional?.funding ? [model.regional.funding] : []);
  const compactCopy = compactMatcherCopy(locale);
  const contextLabel = [model.regional?.market || market, model.regional?.product || product, model.regional?.funding || funding].filter(Boolean).join(" · ");

  const chooseIntent = (nextIntentKey) => {
    setIntentKey(nextIntentKey);
  };

  const chooseComparison = (event) => {
    if (!model.canCompare) {
      event.preventDefault();
      return;
    }
    onSelectionChange?.(model.comparisonSlugs?.length >= 2 ? model.comparisonSlugs : selectionForIntent(venues, model.activeIntentKey));
  };

  return <section className="v2-section platform-matcher" aria-labelledby="platform-matcher-title">
    <details className="platform-matcher__details" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className="platform-matcher__summary">
        <span className="platform-matcher__summary-kicker">{compactCopy.kicker}</span>
        <span className="platform-matcher__summary-copy">
          <strong id="platform-matcher-title">{model.copy.title}</strong>
          <small>{compactCopy.hint}</small>
        </span>
        <span className="platform-matcher__summary-context">
          <span>{compactCopy.selected}</span>
          <b>{contextLabel}</b>
        </span>
        <i aria-hidden="true">＋</i>
      </summary>

      <div className="platform-matcher__body">
        <div className="section-lead platform-matcher__lead">
          <p>{model.copy.eyebrow}</p>
          <span>{model.copy.body}</span>
        </div>

        {model.regional && <div className="platform-matcher__filters" aria-label={model.regional.copy.controls}>
          <label>{model.regional.copy.residence}<select value={market} onChange={(event) => { setMarket(event.target.value); setFunding(""); }}>
            {marketOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select></label>
          <label>{model.regional.copy.product}<select value={product} onChange={(event) => setProduct(event.target.value)}>
            {productOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select></label>
          <label>{model.regional.copy.accountStage}<select value={accountStage} onChange={(event) => setAccountStage(event.target.value)}>
            {accountStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select></label>
          <label>{model.regional.copy.funding}<select value={model.regional.funding} onChange={(event) => setFunding(event.target.value)}>
            {fundingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select></label>
          {model.decision.choices.map((group) => <label key={group.key}>{group.label}<select
            value={model.decision.values[group.key]}
            onChange={(event) => {
              if (group.key === "kycPreference") setKycPreference(event.target.value);
              if (group.key === "usageFrequency") setUsageFrequency(event.target.value);
              if (group.key === "usageScale") setUsageScale(event.target.value);
            }}
          >
            {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select></label>)}
        </div>}

        <div className="platform-matcher__layout">
          <div className="platform-matcher__intents" role="group" aria-label={model.copy.selectLabel}>
            {model.intents.map((intent) => <button
              key={intent.key}
              type="button"
              className={intent.selected ? "is-active" : ""}
              aria-pressed={intent.selected}
              onClick={() => chooseIntent(intent.key)}
            >
              <span>{intent.label}</span>
              <strong>{intent.title}</strong>
              <small>{intent.body}</small>
            </button>)}
          </div>

          <article className="platform-matcher__panel">
            <div className="platform-matcher__panel-head">
              <span>{model.copy.shortlistLabel}</span>
              <strong>{model.activeIntent.title}</strong>
            </div>

            <dl className="platform-matcher__decision">
              <div><dt>{model.copy.decisionLabels.custody}</dt><dd>{model.activeIntent.custody}</dd></div>
              <div><dt>{model.copy.decisionLabels.model}</dt><dd>{model.activeIntent.model}</dd></div>
              <div><dt>{model.copy.decisionLabels.risk}</dt><dd>{model.activeIntent.risk}</dd></div>
            </dl>

            {!model.regional && <div className="platform-matcher__venues">
              {model.shortlist.map((venue) => <a key={venue.slug} href={venue.href}>
                <span className="platform-matcher__identity" translate="no" lang="en" dir="ltr">
                  <BrandMark slug={venue.slug} compact />
                  <span>{venue.name}<small>{venue.category}</small></span>
                </span>
                <span
                  className="platform-matcher__source"
                  lang={venue.officialDomain ? "en" : undefined}
                  dir={venue.officialDomain ? "ltr" : undefined}
                  translate={venue.officialDomain ? "no" : undefined}
                >{venue.officialDomain || model.copy.sourceLabel}</span>
                <span>{model.copy.detailLabel}</span>
              </a>)}
            </div>}

            {model.regional?.candidates?.length > 0 && <div className="platform-matcher__regional" data-regional-matcher-market={model.regional.market} data-regional-matcher-product={model.regional.product}>
              <div className="platform-matcher__regional-head">
                <strong>{model.regional.copy.heading}</strong>
                <span>{model.regional.market} · {model.regional.product} · {model.regional.funding}</span>
              </div>
              <p>{model.regional.note}</p>
              <div className="platform-matcher__regional-list">
                {model.regional.candidates.map((candidate) => <article key={`${candidate.slug}-${candidate.status}`} data-cta-kind="research" data-cta-placement="platform-matcher-regional" data-growth-decision={`matcher_regional_${candidate.slug}`} data-growth-placement="platform-matcher-regional" data-growth-market={model.regional.market} data-growth-product={model.regional.product}>
                  <div className="platform-matcher__candidate-head">
                    <span><BrandMark slug={candidate.slug} compact /> <b>{candidate.name}</b></span>
                    <em>{model.decision.copy.candidateLabels.score} {candidate.score}</em>
                  </div>
                  <small>{candidate.statusLabel} · {candidate.sourceLabel}</small>
                  <ul className="platform-matcher__candidate-reasons" aria-label={model.decision.copy.candidateLabels.reasons}>
                    {candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                  <div className="platform-matcher__next-steps" aria-label={model.decision.copy.candidateLabels.nextSteps}>
                    {candidate.nextSteps.map((step) => <a key={`${candidate.slug}-${step.kind}`} href={step.href} data-next-step-kind={step.kind}>{step.label}</a>)}
                  </div>
                </article>)}
              </div>
            </div>}

            <a
              className={model.canCompare ? "platform-matcher__compare" : "platform-matcher__compare is-disabled"}
              href={model.comparisonHref || "#platform-matcher-title"}
              aria-disabled={!model.canCompare}
              onClick={chooseComparison}
            >
              {model.canCompare ? model.copy.compareLabel : model.copy.comparePending}
            </a>
          </article>
        </div>
      </div>
    </details>
  </section>;
}
