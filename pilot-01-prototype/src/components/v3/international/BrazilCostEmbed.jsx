import { useEffect, useMemo, useState } from "react";
import {
  costEstimate,
  browserSessionStorage,
  decisionStateFromUrl,
  hasDecisionStateSearch,
  loadDecisionState,
  normalizeDecisionState,
  saveDecisionState,
  writeDecisionStateToUrl,
} from "../../../data/decision-state.js";
import { copyFor } from "./BrazilDecisionPage.jsx";
import "./brazil-decision-page.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value);
}

function initialState(initialUrl) {
  const url = initialUrl || (typeof window !== "undefined" ? window.location.href : "/embed/calculator?market=BR&product=spot");
  return normalizeDecisionState({ ...decisionStateFromUrl(url), region: "BR", product: "spot" });
}

export function BrazilCostEmbed({ initialUrl, locale = "pt-BR" }) {
  const copy = copyFor(locale);
  const [state, setState] = useState(() => initialState(initialUrl));
  const estimate = useMemo(() => costEstimate(state), [state]);
  const detailHref = writeDecisionStateToUrl(`/br/custos?locale=${locale}`, state);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (hasDecisionStateSearch(window.location.search)) return undefined;
    const saved = normalizeDecisionState({ ...loadDecisionState(browserSessionStorage(window), state), region: "BR", product: "spot" });
    if (JSON.stringify(saved) !== JSON.stringify(state)) setState(saved);
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    saveDecisionState(browserSessionStorage(window), state);
    return undefined;
  }, [state]);

  const updateState = (patch) => setState((value) => normalizeDecisionState({ ...value, ...patch, region: "BR", product: "spot" }));

  return (
    <main className="br-cost-embed" lang="pt-BR" data-testid="brazil-cost-embed">
      <section className="br-cost-embed__panel" aria-labelledby="br-cost-embed-title">
        <div className="br-cost-embed__head">
          <span>NexuAlpha · Brasil</span>
          <h1 id="br-cost-embed-title">Simular custos em BRL</h1>
          <p>{copy.costNote}</p>
        </div>
        <div className="br-control-grid">
          <label>
            <span>{copy.amount}</span>
            <input name="amount" type="number" inputMode="decimal" min="0" step="50" value={state.amount} onChange={(event) => updateState({ amount: event.target.value })} data-testid="brazil-embed-amount" />
          </label>
          <label>
            <span>{copy.spotFee}</span>
            <input name="spot_fee_bps" type="number" inputMode="decimal" min="0" max="500" step="0.1" value={state.spotFeeBps} onChange={(event) => updateState({ spotFeeBps: event.target.value })} data-testid="brazil-embed-spot-fee" />
          </label>
          <label>
            <span>{copy.depositPercent}</span>
            <input name="deposit_fee_pct" type="number" inputMode="decimal" min="0" max="10" step="0.01" value={state.depositFeePercent} onChange={(event) => updateState({ depositFeePercent: event.target.value })} data-testid="brazil-embed-deposit-percent" />
          </label>
          <label>
            <span>{copy.depositFixed}</span>
            <input name="deposit_fixed_brl" type="number" inputMode="decimal" min="0" max="10000" step="1" value={state.depositFixedBrl} onChange={(event) => updateState({ depositFixedBrl: event.target.value })} data-testid="brazil-embed-deposit-fixed" />
          </label>
        </div>
        <dl className="br-cost-embed__results" data-testid="brazil-embed-cost-result">
          <div><dt>Trade</dt><dd>{formatCurrency(estimate.spotFee)}</dd></div>
          <div><dt>Entrada</dt><dd>{formatCurrency(estimate.depositFee)}</dd></div>
          <div><dt>Total</dt><dd>{formatCurrency(estimate.total)}</dd></div>
        </dl>
        <a className="br-cost-embed__link" href={detailHref} target="_blank" rel="noopener noreferrer">
          Abrir guia completo de custos
        </a>
      </section>
    </main>
  );
}

export default BrazilCostEmbed;
