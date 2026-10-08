import { useEffect, useId, useState } from 'react';
import { venueDatabase } from '../../data/venue-database.js';
import { regionalVenueCta } from '../../data/source-bound-cta.js';
import { localizedHref } from '../../data/locale-routing.js';
import { appendDecisionPassportQuery } from '../../data/decision-passport.js';
import { buildDecisionReturnHref, decisionReturnCopy, readDecisionReturnState } from '../../data/decision-return.js';
import { buildTelegramWebsiteFunnelContext } from '../../data/telegram-config.js';
import { buildVenueFeeSummary, feeSummaryCopy } from '../../data/venue-fee-summary.js';
import { reviewedFeeCopy } from '../../data/reviewed-fee-copy.js';
import { DecisionReturnLink } from './DecisionReturnLink.jsx';
import { costDecisionCopy, costDecisionStateCopy } from '../../data/cost-decision-copy.js';
import { BrandMark } from '../brand/BrandMark.jsx';
import { matrixCopy } from './exchange-matrix-copy.js';
import { feePctOfRate, isoDay } from '../../data/exchange-facts.js';
import './cost-decision.css';



export function reviewedCostDecisionRate(venue, market = 'futuresFee', order = 'takerRate') {
  const product = market === 'futuresFee' ? 'perpetuals' : 'spot';
  const rateProduct = product === 'spot' ? 'spot' : 'futures';
  const reviewedRate = buildVenueFeeSummary(venue).rates.find(item=>item.product===rateProduct);
  const rate = reviewedRate?.[order];
  if (!reviewedRate || !Number.isFinite(rate)) return null;
  return { product, reviewedRate, rate };
}

export function restoreCostDecisionState(search = '') {
  const state = readDecisionReturnState(search);
  if (!state || state.kind !== 'cost') return null;
  return {
    volume: String(state.volume),
    market: state.instrument === 'spot' ? 'spotFee' : 'futuresFee',
    order: state.order === 'maker' ? 'makerRate' : 'takerRate',
  };
}

export function CostDecision({locale='en', regionMarket, product='perpetuals', accountStage, funding}) {
  const ui=costDecisionCopy(locale);
  const id=useId();
  const [volume,setVolume]=useState('100000');
  const [market,setMarket]=useState(product === 'spot' ? 'spotFee' : 'futuresFee');
  const [order,setOrder]=useState('takerRate');
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
  const researchHref=(path, selectedProduct)=>appendDecisionPassportQuery(
    localizedHref(path,{locale}),
    { market:regionMarket, product:selectedProduct, accountStage, funding },
  );
  useEffect(()=>{
    if(typeof window === 'undefined') return;
    const restored=restoreCostDecisionState(window.location.search);
    if(!restored) return;
    setVolume(restored.volume);
    setMarket(restored.market);
    setOrder(restored.order);
  },[locale]);
  const selectedProduct=market==='futuresFee'?'perpetuals':'spot';
  const decisionReturnBaseHref=buildDecisionReturnHref({kind:'cost',locale,market:regionMarket,instrument:market==='futuresFee'?'futures':'spot',order:order==='makerRate'?'maker':'taker',volume:amount});
  const decisionReturnHref=decisionReturnBaseHref ? appendDecisionPassportQuery(decisionReturnBaseHref, { market:regionMarket, product:selectedProduct, accountStage, funding }) : decisionReturnBaseHref;
  const telegramFunnel=buildTelegramWebsiteFunnelContext({intent:'fees',locale,market:regionMarket,product:market==='futuresFee'?'perpetuals':'spot',venue:'all',instrument:market==='futuresFee'?'futures':'spot',amount,campaign:'cost_decision_fee'});
  const comparePath=market==='futuresFee'?'/compare/bybit-vs-bitget':'/compare/binance-vs-okx';
  const resultRows=['binance','okx','bybit','bitget'].map(slug=>{
    const venue=venueDatabase[slug];
    const quote = reviewedCostDecisionRate(venue, market, order);
    const product = market === 'futuresFee' ? 'perpetuals' : 'spot';
    const cta = regionalVenueCta(slug, locale, regionMarket, product, { accountStage, funding });
    const displayRate = quote ? feePctOfRate(quote.rate) : null;
    const displayCost = quote ? (noVolume ? '–' : number.format(amount*quote.rate)) : unchecked;
    const reviewedRate = quote?.reviewedRate;
    const sourceCopy = reviewedRate ? reviewedFeeCopy(reviewedRate, locale) : null;
    return { slug, venue, quote, product, cta, displayRate, displayCost, reviewedRate, sourceCopy };
  });
  // Checked venues first (cheapest first; a tie keeps the fixed neutral order), venues with no checked fee last and muted.
  resultRows.sort((a,b)=>{
    const ar=Number.isFinite(a.quote?.rate), br=Number.isFinite(b.quote?.rate);
    if (ar!==br) return ar?-1:1;
    return ar ? a.quote.rate-b.quote.rate : 0;
  });
  const lowestReviewed = resultRows.find(row=>Number.isFinite(row.quote?.rate)) || null;
  const checkedRows=resultRows.filter(row=>Number.isFinite(row.quote?.rate));
  const maxCost=Math.max(0,...checkedRows.map(row=>amount*row.quote.rate));
  // Bars are proportional to the highest checked cost (0 → max). On a tie they are not drawn: the notice and the
  // neutral verdict say it in words, and no venue is singled out.
  const axisMax=maxCost;
  const sameRate=checkedRows.length>1&&checkedRows.every(row=>row.quote.rate===checkedRows[0].quote.rate);
  const lowestCost=lowestReviewed?amount*lowestReviewed.quote.rate:0;
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
    <div className="cost-decision__next-actions rt-strip" role="group" aria-label={ui.offer}>
      <div className="cost-decision__next-copy">
        <strong>{ui.offer}</strong>
        <span>{ui.note}</span>
      </div>
      <a href={researchHref(comparePath,selectedProduct)} data-cta-kind="research" data-cta-placement="cost-calculator-next-compare" data-growth-decision={market==='futuresFee'?'compare_bybit_bitget':'compare_binance_okx'} data-growth-placement="cost-calculator-next" data-growth-market={regionMarket} data-growth-product={selectedProduct}>{ui.nextCompare}</a>
      <a href={researchHref(primarySlug?`/exchanges/${primarySlug}#registration-path`:'/exchanges',selectedProduct)} data-cta-kind="research" data-cta-platform={primarySlug||undefined} data-cta-placement="cost-calculator-next-platform" data-growth-decision={primarySlug||'platform_directory'} data-growth-placement="cost-calculator-next" data-growth-market={regionMarket} data-growth-product={selectedProduct}>{ui.nextPlatform}</a>
      {primaryCta && <a className="rt-strip__primary" href={primaryCta.ctaHref} target={primaryCta.direct ? '_blank' : undefined} rel={primaryCta.direct ? 'sponsored noopener noreferrer' : undefined} data-cta-kind={primaryCta.direct ? 'registration' : 'research'} data-cta-platform={primarySlug} data-cta-placement="cost-calculator-next-registration" data-growth-decision={primarySlug} data-growth-placement="cost-calculator-next" data-growth-market={regionMarket} data-growth-product={selectedProduct}>{primaryCta.direct ? ui.nextRegister : ui.verify} · {primaryVenue.name} ↗</a>}
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
      </div>
      <DecisionReturnLink href={decisionReturnHref} locale={locale} />
    </div>
    <div className="rt-result">
      {notice && <p className="cost-decision__notice rt-notice" role="status">{notice}</p>}
      {lowestReviewed && !noVolume && <div className={`cost-decision__verdict rt-verdict${tie ? " rt-verdict--tie" : ""}`}>
        <span className="rt-verdict__base">{ui.base} {lowestReviewed.displayRate}</span>
        <strong><span className="rt-verdict__venue">{tie ? stateUi.tie.replace('{n}',String(checkedRows.length)) : lowestReviewed.venue.name}</span> <span className="rt-verdict__figure" key={lowestReviewed.displayCost} aria-hidden="true">{lowestReviewed.displayCost}</span><span className="rt-sr">{tie ? stateUi.tie.replace('{n}',String(checkedRows.length)) : lowestReviewed.venue.name} · {lowestReviewed.displayCost}</span> <span className="rt-verdict__unit">USDT{ui.perMonth}</span></strong>
        {tie
          ? <a href={researchHref(comparePath,selectedProduct)} data-cta-kind="research" data-cta-placement="cost-calculator-tie-compare" data-growth-decision={market==='futuresFee'?'compare_bybit_bitget':'compare_binance_okx'} data-growth-placement="cost-calculator-tie" data-growth-market={regionMarket} data-growth-product={selectedProduct}>{ui.nextCompare}</a>
          : <a href={researchHref(`/exchanges/${lowestReviewed.slug}#registration-path`,lowestReviewed.product)} data-cta-kind="research" data-cta-platform={lowestReviewed.slug} data-cta-placement="cost-calculator-lowest-reviewed" data-growth-decision={lowestReviewed.slug} data-growth-placement="cost-calculator-lowest-reviewed" data-growth-market={regionMarket} data-growth-product={lowestReviewed.product}>{ui.nextPlatform}</a>}
      </div>}
      <div className="cost-decision__results" aria-live="polite">
        {resultRows.map(({slug,venue,quote,product,cta,displayRate,displayCost,reviewedRate,sourceCopy})=>{
          const cost=quote?amount*quote.rate:0;
          const share=quote&&axisMax>0?Math.max(2,Math.round(cost/axisMax*100)):0;
          const delta=quote&&!noVolume&&!sameRate&&lowestReviewed?cost-lowestCost:0;
          return <article key={slug} className={quote ? undefined : "rt-row--pending"}><h3>{venue.name}</h3><span className="rt-logo"><BrandMark slug={slug} compact /></span><p className={quote ? "cost-decision__amount" : "cost-decision__amount cost-decision__amount--pending"}>{displayCost}{quote && <small> USDT{ui.perMonth}</small>}</p><p className={displayRate ? undefined : "cost-decision__base--pending"}>{ui.base} {displayRate || unchecked}{delta>0 && <span className="rt-delta"> · {stateUi.delta.replace('{x}', number.format(delta))}</span>}</p>{quote && !tie && <i className="rt-bar" aria-hidden="true" style={{'--w':`${share}%`}} />}{reviewedRate && <p className="cost-decision__source rt-checked" title={`${sourceCopy.tier} · ${sourceCopy.scope}`}>{feeText.checked} <time dateTime={isoDay(reviewedRate.checkedAt)}>{isoDay(reviewedRate.checkedAt)}</time> · <a href={reviewedRate.sourceUrl} target="_blank" rel="noopener noreferrer">{feeText.source} ↗</a></p>}<a className="rt-offer" href={researchHref(`/exchanges/${slug}#registration-path`,product)} data-cta-kind="research" data-cta-platform={slug} data-cta-placement="cost-calculator-eligibility" data-growth-decision={slug} data-growth-placement="cost-calculator-eligibility" data-growth-market={regionMarket} data-growth-product={product}>{ui.offer}</a><a className="cost-decision__cta" data-cta-kind={cta.direct ? 'registration' : 'research'} data-cta-platform={slug} data-cta-placement="cost-calculator" data-growth-decision={slug} data-growth-placement="cost-calculator" data-growth-market={regionMarket} data-growth-product={product} href={cta.ctaHref} target={cta.direct ? '_blank' : undefined} rel={cta.direct ? 'sponsored noopener noreferrer' : undefined}>{cta.direct ? (ui.register.replace('{venue}', venue.name)) : (ui.verify)} ↗</a></article>;
        })}
      </div>
    </div>
    <div className="rt-foot">
      <p className="cost-decision__note">{ui.note}</p>
      <div className="rt-foot__links">
      <a href={telegramFunnel.deepLink} target="_blank" rel="noopener noreferrer" className="cost-decision__telegram" data-cta-kind="telegram" data-cta-placement="cost-decision-telegram" data-growth-decision="telegram_fee_calc" data-growth-placement="cost-decision-support" data-growth-market={regionMarket} data-growth-product={selectedProduct} data-telegram-start={telegramFunnel.startPayload} data-telegram-return-href={telegramFunnel.returnHref}>{ui.telegramSupport || decisionReturnCopy(locale).botFeeOpen}</a>
      <a href={researchHref('/compare/binance-vs-okx',market === 'futuresFee' ? 'perpetuals' : 'spot')} data-cta-kind="research" data-cta-placement="cost-calculator-compare" data-growth-decision="compare_binance_okx" data-growth-placement="cost-calculator-compare" data-growth-market={regionMarket} data-growth-product={market === 'futuresFee' ? 'perpetuals' : 'spot'}>{ui.compare}</a>
      </div>
    </div>
  </section>;
}
