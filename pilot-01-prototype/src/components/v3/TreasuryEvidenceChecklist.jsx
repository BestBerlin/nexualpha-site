import React, { useId, useMemo, useState } from "react";
import {
  buildTreasuryEvidenceChecklist,
  createTreasuryEvidenceStates,
  setTreasuryEvidenceStatus,
  summarizeTreasuryEvidenceStates,
  TREASURY_EVIDENCE_STATUS_VALUES,
} from "../../data/treasury-evidence-checklist.js";
import treasuryRightsOpsAsset from "../../../public/research/wave48-tokenized-treasury-rights-ops.json" with { type: "json" };
import "./TreasuryEvidenceChecklist.css";

const COPY = {
  en: {
    summary: "Open Treasury evidence reading checklist",
    eyebrow: "Local reading state",
    title: "Mark what you have read before comparing tokenized Treasuries",
    lead: "This tool uses the 2026-09-15 historical JSON snapshot. Read means you reviewed the excerpt; it is not investment eligibility, account approval or a live product review.",
    localOnly: "Local only; refresh resets this checklist to pending.",
    productLabel: "Choose product record",
    snapshot: "Historical snapshot",
    source: "Open source",
    dataset: "Open JSON dataset",
    methodology: "Review methodology",
    read: "Read",
    pending: "Pending",
    uncertain: "Still uncertain",
    pendingLabel: "Pending",
    readLabel: "Read",
    uncertainLabel: "Uncertain",
    counts: ({ read, pending, uncertain, total }) => `${read}/${total} read · ${pending} pending · ${uncertain} uncertain`,
    next: "Next evidence to read",
    allRead: "All four steps are marked read. Continue with methodology and source context; this is still not a product approval badge.",
    uncertainFirst: "At least one dimension remains uncertain. Resolve that before treating the product as comparable.",
    clear: "Clear local states",
    unavailable: "Treasury evidence checklist is unavailable because the source record failed validation.",
  },
  "zh-Hans": {
    summary: "打开代币化美债证据阅读清单",
    eyebrow: "本地阅读状态",
    title: "比较代币化美债前，先标记你已经读过的证据",
    lead: "本工具只读取 2026-09-15 历史 JSON 快照。已读只表示你看过该字段摘录，不代表投资资格、账户批准或当前产品复审。",
    localOnly: "只保存在当前页面；刷新后会重新回到待查。",
    productLabel: "选择产品记录",
    snapshot: "历史快照",
    source: "打开来源",
    dataset: "打开 JSON 数据集",
    methodology: "查看研究方法",
    read: "已读",
    pending: "待查",
    uncertain: "仍不确定",
    pendingLabel: "待查",
    readLabel: "已读",
    uncertainLabel: "不确定",
    counts: ({ read, pending, uncertain, total }) => `${read}/${total} 已读 · ${pending} 待查 · ${uncertain} 不确定`,
    next: "下一项待读证据",
    allRead: "四项都已标记已读。下一步应查看方法论和来源背景；这仍不是产品通过、安全或合资格徽章。",
    uncertainFirst: "至少一个维度仍不确定。把产品拿来横向比较前，先处理这个不确定项。",
    clear: "清空本地状态",
    unavailable: "代币化美债证据清单不可用，因为来源记录没有通过校验。",
  },
};

function text(locale, key) {
  return COPY[locale]?.[key] || COPY.en[key];
}

function statusClass(status) {
  return TREASURY_EVIDENCE_STATUS_VALUES.includes(status) ? status : "pending";
}

export function TreasuryEvidenceChecklist({ locale = "en" }) {
  const resolvedLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
  const controlId = useId();
  const checklist = useMemo(() => buildTreasuryEvidenceChecklist(treasuryRightsOpsAsset, resolvedLocale), [resolvedLocale]);
  const [productId, setProductId] = useState(() => checklist.products[0]?.id || "");
  const [states, setStates] = useState(() => createTreasuryEvidenceStates());

  if (!checklist.available) {
    return (
      <aside className="treasury-evidence-checklist treasury-evidence-checklist--unavailable">
        {text(resolvedLocale, "unavailable")}
      </aside>
    );
  }

  const selectedProduct = checklist.products.find((product) => product.id === productId) || checklist.products[0];
  const summary = summarizeTreasuryEvidenceStates(states);
  const nextStep = checklist.steps.find((step) => step.id === summary.nextStepId) || checklist.steps.find((step) => states[step.id] === "uncertain") || checklist.steps[0];

  function changeProduct(event) {
    setProductId(event.target.value);
    setStates(createTreasuryEvidenceStates());
  }

  function setStep(stepId, status) {
    setStates((current) => setTreasuryEvidenceStatus(current, stepId, status));
  }

  function clearStates() {
    setStates(createTreasuryEvidenceStates());
  }

  return (
    <details id="treasury-evidence-checklist" className="treasury-evidence-checklist">
      <summary>{text(resolvedLocale, "summary")}</summary>
      <div className="treasury-evidence-checklist__body">
        <div className="treasury-evidence-checklist__intro">
          <h2>{text(resolvedLocale, "title")}</h2>
          <p>{text(resolvedLocale, "lead")}</p>
          <p>{text(resolvedLocale, "localOnly")}</p>
        </div>

        <div className="treasury-evidence-checklist__controls">
          <label htmlFor={`${controlId}-product`}>{text(resolvedLocale, "productLabel")}</label>
          <select
            id={`${controlId}-product`}
            name="treasury-evidence-product"
            autoComplete="off"
            value={selectedProduct.id}
            onChange={changeProduct}
          >
            {checklist.products.map((product) => (
              <option key={product.id} value={product.id}>{product.name} · {product.productName}</option>
            ))}
          </select>
        </div>

        <div className="treasury-evidence-checklist__snapshot">
          <strong lang="en">{selectedProduct.name}</strong>
          <span>{text(resolvedLocale, "snapshot")}: {selectedProduct.checkedAt}</span>
          <a href={selectedProduct.sourceUrl} target="_blank" rel="noreferrer">{text(resolvedLocale, "source")}</a>
          <a href={checklist.assetUrl} target="_blank" rel="noreferrer">{text(resolvedLocale, "dataset")}</a>
          <a href={resolvedLocale === "zh-Hans" ? "/zh-hans/methodology" : "/methodology"}>{text(resolvedLocale, "methodology")}</a>
        </div>

        <div className={`treasury-evidence-checklist__status treasury-evidence-checklist__status--${summary.uncertain > 0 ? "uncertain" : summary.allRead ? "read" : "pending"}`} aria-live="polite">
          <span>{COPY[resolvedLocale].counts(summary)}</span>
          {summary.allRead ? (
            <strong>{text(resolvedLocale, "allRead")}</strong>
          ) : (
            <a href={`#treasury-evidence-${nextStep.id}`}>
              {summary.uncertain > 0 ? text(resolvedLocale, "uncertainFirst") : `${text(resolvedLocale, "next")}: ${nextStep.labels[resolvedLocale] || nextStep.labels.en}`}
            </a>
          )}
        </div>

        <div className="treasury-evidence-checklist__steps">
          {checklist.steps.map((step) => {
            const evidence = selectedProduct.evidence[step.id];
            const status = statusClass(states[step.id]);
            return (
              <details className={`treasury-evidence-checklist__step treasury-evidence-checklist__step--${status}`} key={step.id} id={`treasury-evidence-${step.id}`}>
                <summary>
                  <span>{evidence.label}</span>
                  <strong>{text(resolvedLocale, `${status}Label`)}</strong>
                </summary>
                <div className="treasury-evidence-checklist__step-body">
                  <div className="treasury-evidence-checklist__state-buttons" aria-label={evidence.label}>
                    <button type="button" aria-pressed={status === "pending"} onClick={() => setStep(step.id, "pending")}>{text(resolvedLocale, "pending")}</button>
                    <button type="button" aria-pressed={status === "read"} onClick={() => setStep(step.id, "read")}>{text(resolvedLocale, "read")}</button>
                    <button type="button" aria-pressed={status === "uncertain"} onClick={() => setStep(step.id, "uncertain")}>{text(resolvedLocale, "uncertain")}</button>
                  </div>
                  <dl>
                    {evidence.excerpt.map((item, index) => (
                      <React.Fragment key={`${item.field}-${index}`}>
                        <dt>{item.label}</dt>
                        <dd lang="en">{item.text}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                  <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{text(resolvedLocale, "source")}</a>
                </div>
              </details>
            );
          })}
        </div>

        <div className="treasury-evidence-checklist__actions">
          <button type="button" onClick={clearStates}>{text(resolvedLocale, "clear")}</button>
        </div>
      </div>
    </details>
  );
}
