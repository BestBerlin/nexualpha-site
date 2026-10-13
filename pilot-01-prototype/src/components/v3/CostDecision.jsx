import { SourceLink } from "../shared/SourceLink.jsx";
import { useEffect, useId, useState } from 'react';
import { venueDatabase } from '../../data/venue-database.js';
import { regionalVenueCta } from '../../data/source-bound-cta.js';
import { isTurkeyGated } from '../../data/partner-geo-policy.js';
import { localizedHref } from '../../data/locale-routing.js';
import { appendDecisionPassportQuery } from '../../data/decision-passport.js';
import { appendCostScenarioQuery, buildDecisionReturnHref, readDecisionReturnState } from '../../data/decision-return.js';
import { partnerRebateShare } from '../../data/partner-benefit-status.js';
import { buildVenueFeeSummary, feeSummaryCopy } from '../../data/venue-fee-summary.js';
import { reviewedFeeCopy } from '../../data/reviewed-fee-copy.js';
import { DecisionReturnLink } from './DecisionReturnLink.jsx';
import { costBasisCopy, costDecisionCopy, costDecisionStateCopy } from '../../data/cost-decision-copy.js';
import { BrandMark } from '../brand/BrandMark.jsx';
import { matrixCopy } from './exchange-matrix-copy.js';
import { feePctOfRate, isoDay } from '../../data/exchange-facts.js';
import { r9Text } from '../v6/inner-r9-copy.js';
import './cost-decision.css';



export function reviewedCostDecisionRate(venue, market = 'futuresFee', order = 'takerRate') {
  const product = market === 'futuresFee' ? 'perpetuals' : 'spot';
  const rateProduct = product === 'spot' ? 'spot' : 'futures';
  const reviewedRate = buildVenueFeeSummary(venue).rates.find(item=>item.product===rateProduct);
  const rate = reviewedRate?.[order];
  if (!reviewedRate || !Number.isFinite(rate)) return null;
  return { product, reviewedRate, rate };
}

export function restoreCostDecisionState(search = '', hash = '') {
  const state = readDecisionReturnState(search, hash);
  if (!state || state.kind !== 'cost') return null;
  return {
    volume: String(state.volume),
    market: state.instrument === 'spot' ? 'spotFee' : 'futuresFee',
    order: state.order === 'maker' ? 'makerRate' : 'takerRate',
    basis: state.basis === 'rebate' ? 'rebate' : 'base',
  };
}

export function CostDecision({locale='en', regionMarket, product='perpetuals', accountStage, funding}) {
  const ui=costDecisionCopy(locale);
  const id=useId();
  const [volume,setVolume]=useState('100000');
  const [market,setMarket]=useState(product === 'spot' ? 'spotFee' : 'futuresFee');
  const [order,setOrder]=useState('takerRate');
  // Audit NX-03: 'base' = published base fees, 'rebate' = after the partner programme's maximum share (home formula).
  const [basis,setBasis]=useState('base');
  const bx=costBasisCopy(locale);
  const MAX_VOLUME=1e10;
  const rawAmount=Number(volume);
  const amount=Math.max(0,Math.min(MAX_VOLUME,Number.isFinite(rawAmount)?rawAmount:0));
  const capped=Number.isFinite(rawAmount)&&rawAmount>MAX_VOLUME;
  const noVolume=!(amount>0);
  const stateUi=costDecisionStateCopy(locale);
  // A fee that exchange-facts.js does not publish reads the same as on /exchanges: "Not yet checked".
  const unchecked=matrixCopy(locale).unchecked;
  const number=new Intl.NumberFormat(locale,{maximumFractionDigits:2});
  const feeText=feeSummaryCopy(locale);
  // Onward links (venue, compare, directory) carry the scenario: volume, spot/futures, maker/taker and basis.
  const researchHref=(path, selectedProduct)=>appendCostScenarioQuery(appendDecisionPassportQuery(
    localizedHref(path,{locale}),
    { market:regionMarket, product:selectedProduct, accountStage, funding },
  ), { instrument:market==='futuresFee'?'futures':'spot', order:order==='makerRate'?'maker':'taker', volume:amount, basis });
  useEffect(()=>{
    if(typeof window === 'undefined') return;
    const restored=restoreCostDecisionState(window.location.search, window.location.hash);
    if(!restored) return;
    setVolume(restored.volume);
    setMarket(restored.market);
    setOrder(restored.order);
    setBasis(restored.basis);
  },[locale]);
  const selectedProduct=market==='futuresFee'?'perpetuals':'spot';
  const decisionReturnBaseHref=buildDecisionReturnHref({kind:'cost',locale,market:regionMarket,instrument:market==='futuresFee'?'futures':'spot',order:order==='makerRate'?'maker':'taker',volume:amount,basis});
  const decisionReturnHref=decisionReturnBaseHref ? appendDecisionPassportQuery(decisionReturnBaseHref, { market:regionMarket, product:selectedProduct, accountStage, funding }) : decisionReturnBaseHref;
  const comparePath=market==='futuresFee'?'/compare/bybit-vs-bitget':'/compare/binance-vs-okx';
  const resultRows=['binance','okx','bybit','bitget'].map(slug=>{
    const venue=venueDatabase[slug];
    const quote = reviewedCostDecisionRate(venue, market, order);
    const product = market === 'futuresFee' ? 'perpetuals' : 'spot';
    const cta = regionalVenueCta(slug, locale, regionMarket, product, { accountStage, funding });
    const displayRate = quote ? feePctOfRate(quote.rate, locale) : null;
    // Same formula as the home calculator: net = base × (1 − top partner share); per month here, per year on the home.
    // Türkiye: no rebate share for a partner that may not be promoted there (owner 2026-10-13, legal).
    const rebateShare = isTurkeyGated(slug, { locale, market: regionMarket }) ? null : partnerRebateShare(slug);
    const baseCost = quote ? amount*quote.rate : null;
    const rebateCost = quote && rebateShare ? baseCost*(1-rebateShare) : null;
    const usesRebate = basis==='rebate' && rebateCost!=null;
    const cost = usesRebate ? rebateCost : baseCost;
    const sortRate = quote ? (usesRebate ? quote.rate*(1-rebateShare) : quote.rate) : null;
    const displayCost = quote ? (noVolume ? '–' : number.format(cost)) : unchecked;
    const reviewedRate = quote?.reviewedRate;
    const sourceCopy = reviewedRate ? reviewedFeeCopy(reviewedRate, locale) : null;
    return { slug, venue, quote, product, cta, displayRate, displayCost, reviewedRate, sourceCopy, rebateShare, baseCost, rebateCost, usesRebate, cost, sortRate };
  });
  // Checked venues first (cheapest first; a tie keeps the fixed neutral order), venues with no checked fee last and muted.
  resultRows.sort((a,b)=>{
    const ar=Number.isFinite(a.sortRate), br=Number.isFinite(b.sortRate);
    if (ar!==br) return ar?-1:1;
    return ar ? a.sortRate-b.sortRate : 0;
  });
  const lowestReviewed = resultRows.find(row=>Number.isFinite(row.quote?.rate)) || null;
  const checkedRows=resultRows.filter(row=>Number.isFinite(row.quote?.rate));
  const maxCost=Math.max(0,...checkedRows.map(row=>row.cost));
  // Bars are proportional to the highest checked cost (0 → max) on the axis above the rows. On a tie every bar is full
  // length and neutral: equal lengths say "same cost" and no venue is singled out (the accent marks the lowest only when it is lower).
  const axisMax=maxCost;
  const sameRate=checkedRows.length>1&&checkedRows.every(row=>Math.abs(row.sortRate-checkedRows[0].sortRate)<1e-12);
  const lowestCost=lowestReviewed?lowestReviewed.cost:0;
  const basisLabel=(row)=>row.usesRebate?bx.perMonthRebate:bx.perMonthBase;
  const notice=noVolume?stateUi.empty:capped?stateUi.capped.replace('{max}',number.format(MAX_VOLUME)):sameRate?stateUi.same.replace('{n}',String(checkedRows.length)):null;
  const tie=sameRate&&!noVolume;
  // The strip names one venue only when the checked fees single one out (never on a tie, never a fixed favourite).
  const primarySlug=!sameRate&&lowestReviewed?lowestReviewed.slug:null;
  const primaryVenue=primarySlug?venueDatabase[primarySlug]:null;
  const primaryCta=primarySlug?regionalVenueCta(primarySlug, locale, regionMarket, selectedProduct, { accountStage, funding }):null;
  return <section id="cost-scenario" className="cost-decision rt-cd" aria-labelledby={`${id}-title`}>
    <div className="cost-decision__intro rt-panel__intro">
      <h2 id={`${id}-title`}>{ui.title}</h2>
      <p>{ui.intro}</p>
    </div>
    <div className="rt-controls">
      <div className="cost-decision__inputs" role="group" aria-label={ui.eyebrow}>
        <label className="rt-field" htmlFor={`${id}-volume`}><span>{ui.volume}</span><span className="rt-field__box"><input id={`${id}-volume`} name="volume" aria-label={ui.volume} type="number" min="0" max="10000000000" step="0.01" inputMode="decimal" value={volume} onChange={e=>setVolume(e.target.value)}/><span className="rt-field__unit" aria-hidden="true">USDT</span></span></label>
        <div className="rt-field" role="radiogroup" aria-label={ui.market}><span aria-hidden="true">{ui.market}</span><div className="rt-seg" style={{'--idx':market==='futuresFee'?1:0}}>
          <label><input type="radio" name={`${id}-market`} value="spotFee" checked={market==='spotFee'} onChange={()=>setMarket('spotFee')}/><span>{ui.spot}</span></label>
          <label><input type="radio" name={`${id}-market`} value="futuresFee" checked={market==='futuresFee'} onChange={()=>setMarket('futuresFee')}/><span>{ui.futures}</span></label>
        </div></div>
        <div className="rt-field" role="radiogroup" aria-label={ui.order}><span aria-hidden="true">{ui.order}</span><div className="rt-seg" style={{'--idx':order==='makerRate'?1:0}}>
          <label><input type="radio" name={`${id}-order`} value="takerRate" checked={order==='takerRate'} onChange={()=>setOrder('takerRate')}/><span>{ui.taker}</span></label>
          <label><input type="radio" name={`${id}-order`} value="makerRate" checked={order==='makerRate'} onChange={()=>setOrder('makerRate')}/><span>{ui.maker}</span></label>
        </div></div>
        <div className="rt-field" role="radiogroup" aria-label={bx.group}><span aria-hidden="true">{bx.group}</span><div className="rt-seg" style={{'--idx':basis==='rebate'?1:0}}>
          <label><input type="radio" name={`${id}-basis`} value="base" checked={basis==='base'} onChange={()=>setBasis('base')}/><span>{bx.base}</span></label>
          <label><input type="radio" name={`${id}-basis`} value="rebate" checked={basis==='rebate'} onChange={()=>setBasis('rebate')}/><span>{bx.rebate}</span></label>
        </div></div>
      </div>
      <DecisionReturnLink href={decisionReturnHref} locale={locale} />
    </div>
    <div className="rt-result">
      {notice && <p className="cost-decision__notice rt-notice" role="status">{notice}</p>}
      {lowestReviewed && !noVolume && <div className={`cost-decision__verdict rt-verdict${tie ? " rt-verdict--tie" : ""}`}>
        <span className="rt-verdict__base">{ui.base} {lowestReviewed.displayRate}</span>
        <strong><span className="rt-verdict__venue">{tie ? stateUi.tie.replace('{n}',String(checkedRows.length)) : lowestReviewed.venue.name}</span> <span className="rt-verdict__figure" key={lowestReviewed.displayCost} aria-hidden="true">{lowestReviewed.displayCost}</span><span className="rt-sr">{tie ? stateUi.tie.replace('{n}',String(checkedRows.length)) : lowestReviewed.venue.name} · {lowestReviewed.displayCost}</span> <span className="rt-verdict__unit">USDT{ui.perMonth}</span> <small className="rt-basis" data-basis={lowestReviewed.usesRebate ? 'rebate' : 'base'}>{basisLabel(lowestReviewed)}</small></strong>
        {tie
          ? <a href={researchHref(comparePath,selectedProduct)} data-cta-kind="research" data-cta-placement="cost-calculator-tie-compare" data-growth-decision={market==='futuresFee'?'compare_bybit_bitget':'compare_binance_okx'} data-growth-placement="cost-calculator-tie" data-growth-market={regionMarket} data-growth-product={selectedProduct}>{ui.nextCompare}</a>
          : <a href={researchHref(`/exchanges/${lowestReviewed.slug}#registration-path`,lowestReviewed.product)} data-cta-kind="research" data-cta-platform={lowestReviewed.slug} data-cta-placement="cost-calculator-lowest-reviewed" data-growth-decision={lowestReviewed.slug} data-growth-placement="cost-calculator-lowest-reviewed" data-growth-market={regionMarket} data-growth-product={lowestReviewed.product}>{ui.nextPlatform}</a>}
      </div>}
      {/* The cost axis: one shared 0 → highest checked cost scale for every bar below (final values only, no count-up). */}
      {axisMax>0 && !noVolume && <div className="rt-axis" aria-hidden="true">
        <span className="rt-axis__cap">{r9Text(locale).cost}</span>
        <span className="rt-axis__ticks"><span>0</span><span>{number.format(axisMax/2)}</span><span>{number.format(axisMax)}</span></span>
      </div>}
      <div className="cost-decision__results" aria-live="polite">
        {resultRows.map((row)=>{
          const {slug,venue,quote,product,cta,displayRate,displayCost,reviewedRate,sourceCopy,rebateShare,baseCost,rebateCost,usesRebate}=row;
          const cost=quote?row.cost:0;
          // The other basis, shown next to the main figure so base vs after-rebate is never hidden in a disclaimer.
          const other=!quote||noVolume?null:usesRebate?`${bx.perMonthBase}: ${number.format(baseCost)}`:rebateCost!=null?`${bx.perMonthRebate}: ${number.format(rebateCost)}`:null;
          const share=quote&&axisMax>0?Math.max(2,Math.round(cost/axisMax*100)):0;
          const delta=quote&&!noVolume&&!sameRate&&lowestReviewed?cost-lowestCost:0;
          return <article key={slug} className={quote ? undefined : "rt-row--pending"}><h3>{venue.name}</h3><span className="rt-logo"><BrandMark slug={slug} compact /></span><p className={quote ? "cost-decision__amount" : "cost-decision__amount cost-decision__amount--pending"}>{displayCost}{quote && <small> USDT{ui.perMonth}</small>}{quote && !noVolume && <small className="rt-basis" data-basis={usesRebate ? 'rebate' : 'base'}>{basisLabel(row)}</small>}</p><p className={displayRate ? undefined : "cost-decision__base--pending"}>{ui.base} {displayRate || unchecked}{delta>0 && <span className="rt-delta"> · {stateUi.delta.replace('{x}', number.format(delta))}</span>}{other && <span className="rt-basis-alt"><br />{other} USDT</span>}{quote && !noVolume && basis==='rebate' && !rebateShare && <span className="rt-basis-alt"><br />{bx.noShare}</span>}</p>{quote && !noVolume && <i className="rt-bar" aria-hidden="true" data-low={!sameRate && checkedRows.length>1 && row.sortRate===lowestReviewed?.sortRate ? '' : undefined} style={{'--w':`${share}%`}} />}{reviewedRate && <p className="cost-decision__source rt-checked" title={`${sourceCopy.tier} · ${sourceCopy.scope}`}>{feeText.checked} <time dateTime={isoDay(reviewedRate.checkedAt)}>{isoDay(reviewedRate.checkedAt)}</time> · <SourceLink locale={locale} href={reviewedRate.sourceUrl} target="_blank" rel="noopener noreferrer">{feeText.source} ↗</SourceLink></p>}{isTurkeyGated(slug, { locale, market: regionMarket }) ? null : <a className="rt-offer" href={researchHref(`/exchanges/${slug}#registration-path`,product)} data-cta-kind="research" data-cta-platform={slug} data-cta-placement="cost-calculator-eligibility" data-growth-decision={slug} data-growth-placement="cost-calculator-eligibility" data-growth-market={regionMarket} data-growth-product={product}>{ui.offer}</a>}<a className="cost-decision__cta" data-cta-kind={cta.direct ? 'registration' : 'research'} data-cta-platform={slug} data-cta-placement="cost-calculator" data-cta-code={cta.direct && cta.hasReferral && cta.inviteCode ? cta.inviteCode : undefined} data-growth-decision={slug} data-growth-placement="cost-calculator" data-growth-market={regionMarket} data-growth-product={product} href={cta.ctaHref} target={cta.direct ? '_blank' : undefined} rel={cta.direct ? 'sponsored noopener noreferrer' : undefined}>{cta.direct ? (ui.register.replace('{venue}', venue.name)) : (ui.verify)} ↗</a></article>;
        })}
      </div>
    </div>
    {/* Method + next step sit after the results in reading/tab order. The tie verdict already carries
        "Continue comparison", so the strip offers the other route (never the same link twice). */}
    <div className="cost-decision__next-actions rt-strip" role="group" aria-label={ui.note.split(':')[0]}>
      <p className="cost-decision__next-copy"><span>{ui.note}</span> <span className="rt-basis-method">{bx.method}</span></p>
      {!tie && <a href={researchHref(comparePath,selectedProduct)} data-cta-kind="research" data-cta-placement="cost-calculator-next-compare" data-growth-decision={market==='futuresFee'?'compare_bybit_bitget':'compare_binance_okx'} data-growth-placement="cost-calculator-next" data-growth-market={regionMarket} data-growth-product={selectedProduct}>{ui.nextCompare}</a>}
      {(tie || !lowestReviewed || noVolume) && <a href={researchHref('/exchanges',selectedProduct)} data-cta-kind="research" data-cta-placement="cost-calculator-next-platform" data-growth-decision="platform_directory" data-growth-placement="cost-calculator-next" data-growth-market={regionMarket} data-growth-product={selectedProduct}>{ui.nextPlatform}</a>}
      {primaryCta && <a className="rt-strip__primary" href={primaryCta.ctaHref} target={primaryCta.direct ? '_blank' : undefined} rel={primaryCta.direct ? 'sponsored noopener noreferrer' : undefined} data-cta-kind={primaryCta.direct ? 'registration' : 'research'} data-cta-platform={primarySlug} data-cta-placement="cost-calculator-next-registration" data-growth-decision={primarySlug} data-growth-placement="cost-calculator-next" data-growth-market={regionMarket} data-growth-product={selectedProduct}>{primaryCta.direct ? ui.nextRegister : ui.verify} · {primaryVenue.name} ↗</a>}
    </div>
    <div className="rt-foot">
      <div className="rt-foot__links">
      <a href={researchHref('/compare/binance-vs-okx',market === 'futuresFee' ? 'perpetuals' : 'spot')} data-cta-kind="research" data-cta-placement="cost-calculator-compare" data-growth-decision="compare_binance_okx" data-growth-placement="cost-calculator-compare" data-growth-market={regionMarket} data-growth-product={market === 'futuresFee' ? 'perpetuals' : 'spot'}>{ui.compare}</a>
      </div>
    </div>
  </section>;
}
