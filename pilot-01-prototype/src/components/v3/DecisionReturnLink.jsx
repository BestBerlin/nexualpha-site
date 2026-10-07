import { useState } from 'react';
import { decisionReturnCopy } from '../../data/decision-return.js';
import './decision-return-link.css';

export function DecisionReturnLink({href,locale='en'}) {
  const [result,setResult]=useState(null);
  const copy=decisionReturnCopy(locale);
  if(typeof href!=='string' || !href.startsWith('/') || href.startsWith('//') || href.includes('\\')) return null;
  const current=result?.href===href?result:null;
  async function copyLink() {
    const url=new URL(href,window.location.origin).href;
    try {
      if(!navigator.clipboard?.writeText) throw new Error('CLIPBOARD_UNAVAILABLE');
      await navigator.clipboard.writeText(url);
      setResult({href,url,status:'copied'});
    } catch {
      setResult({href,url,status:'failed'});
    }
  }
  return <div className="decision-return-link">
    <button type="button" onClick={copyLink} data-cta-kind="research" data-cta-placement="decision-return-copy">{copy.copy}</button>
    <span role="status" aria-live="polite">{current?.status==='copied'?copy.copied:current?.status==='failed'?copy.failed:''}</span>
    {current?.status==='failed' && <input aria-label={copy.linkLabel} readOnly value={current.url} onFocus={e=>e.currentTarget.select()} dir="ltr" />}
  </div>;
}
