import { useId, useState } from 'react';
import { calculateHyperliquidFeeScenario, formatHyperliquidFee, hyperliquidFeeScenarioCopy, hyperliquidFeeSnapshot } from '../../data/hyperliquid-fee-scenario.js';
import { contextualHref } from '../../data/contextual-href.js';
import './HyperliquidFeeScenario.css';

export function HyperliquidFeeScenario({ locale, market, snapshot = hyperliquidFeeSnapshot }) {
  const id = useId();
  const [amount, setAmount] = useState('1000');
  const [liquidity, setLiquidity] = useState('taker');
  const [fills, setFills] = useState(1);
  const text = hyperliquidFeeScenarioCopy(locale);
  if (!text) return null;
  const result = calculateHyperliquidFeeScenario({ amount, liquidity, fills }, snapshot);
  const invalid = result.status === 'invalid-input';
  return <details className="v3-hyperliquid-fee-scenario" data-hyperliquid-fee-scenario lang={locale}>
    <summary>{text.title}</summary>
    <div className="v3-hyperliquid-fee-scenario__body">
      <p>{text.intro}</p>
      <div className="v3-hyperliquid-fee-scenario__controls">
        <div><label htmlFor={`${id}-amount`}>{text.amount}</label><input id={`${id}-amount`} name="hypothetical-notional-usd" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={amount} onChange={(event) => setAmount(event.target.value)} aria-invalid={invalid} aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ''}`} /><p id={`${id}-help`}>{text.inputHelp}</p>{invalid && <p id={`${id}-error`}>{text.invalid}</p>}</div>
        <div><label htmlFor={`${id}-liquidity`}>{text.liquidity}</label><select id={`${id}-liquidity`} name="hypothetical-fill-type" autoComplete="off" value={liquidity} onChange={(event) => setLiquidity(event.target.value)}><option value="maker">{text.maker}</option><option value="taker">{text.taker}</option></select></div>
        <div><label htmlFor={`${id}-fills`}>{text.fills}</label><select id={`${id}-fills`} name="hypothetical-fill-count" autoComplete="off" value={fills} onChange={(event) => setFills(event.target.value === '2' ? 2 : 1)}><option value="1">{text.one}</option><option value="2">{text.two}</option></select></div>
      </div>
      <div aria-live="polite" aria-atomic="true" className="v3-hyperliquid-fee-scenario__result">
        {result.status === 'ready' ? <><strong>{text.result}: <output>{formatHyperliquidFee(result.feeUsd, locale)}</output></strong><p>{text.formula}: {amount} USD × {liquidity === 'maker' ? '0.015%' : '0.045%'} × {fills}</p></> : <p>{result.status === 'unavailable' ? text.unavailable : text.invalid}</p>}
      </div>
      <p>{text.boundary}</p>
      <p>{text.privacy}</p>
      {result.status !== 'unavailable' && <p><a href={snapshot.sourceHref} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="hyperliquid-fee-scenario-source">{text.source}</a> <time dateTime={snapshot.reviewedAt}>{snapshot.reviewedAt}</time><br />{text.dateNote}</p>}
      <a href={contextualHref('/compare/hyperliquid-vs-dydx', { locale, market, product: 'perpetuals' })} data-cta-kind="research" data-cta-placement="hyperliquid-fee-scenario-compare" data-growth-decision="compare_hyperliquid_dydx" data-growth-placement="hyperliquid-fee-scenario-compare" data-growth-market={market || "unknown"} data-growth-product="perpetuals">{text.compare}</a>
    </div>
  </details>;
}
