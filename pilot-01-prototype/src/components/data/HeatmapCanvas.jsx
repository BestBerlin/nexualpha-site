import React, { useEffect, useRef } from 'react';
import { formatUsdCompact } from '../../data/market-data-pages.js';
// Tiny renderer, loaded only with liquidation routes. No global chart dependency.
export function HeatmapCanvas({ rows, kind, title, longs, shorts, marketPrice }) {
 const ref = useRef(null);
 useEffect(() => {
  const canvas = ref.current;
  if (!canvas) return;
  const draw = () => {
   const width = Math.max(280, canvas.clientWidth), height = 286, ratio = Math.min(window.devicePixelRatio || 1, 2);
   canvas.width = width*ratio; canvas.height = height*ratio;
   const ctx = canvas.getContext('2d'); if (!ctx) return;
   ctx.scale(ratio,ratio); ctx.clearRect(0,0,width,height);
   ctx.font = '12px sans-serif'; ctx.fillStyle = getComputedStyle(canvas).color;
   const left = 62, right = width-12, bottom = 216, top = 28;
   const max = Math.max(1,...rows.map(r => kind === 'levels' ? r.usd : r.longUsd+r.shortUsd));
   ctx.fillText(title, left, 16);
   for (const fraction of [0,.5,1]) {
    const y = bottom-(bottom-top)*fraction;
    ctx.fillText(formatUsdCompact(max*fraction), 0, y+4);
    ctx.strokeStyle = 'rgba(140,150,170,.2)'; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(right,y); ctx.stroke();
   }
   const slot = (right-left)/Math.max(1,rows.length);
   const minPrice = Math.min(...rows.map(r=>r.price)), maxPrice = Math.max(...rows.map(r=>r.price));
   const priceX = p => left+8+(p-minPrice)/Math.max(1,maxPrice-minPrice)*(right-left-16);
   rows.forEach((row,i) => {
    const bw = kind === 'levels' ? Math.min(12,slot*.5) : slot*.85;
    const x = kind === 'levels' ? priceX(row.price)-bw/2 : left+i*slot;
    if (kind === 'levels') {
     ctx.fillStyle = row.side === 'long' ? '#37b6a4' : '#e88492';
     const h = row.usd/max*(bottom-top); ctx.fillRect(x,bottom-h,bw,h);
    } else {
     if (!row.observed) { ctx.fillStyle = 'rgba(140,150,170,.3)'; ctx.fillRect(x,top,bw,bottom-top); }
     const lh = row.longUsd/max*(bottom-top), sh = row.shortUsd/max*(bottom-top);
     ctx.fillStyle = '#37b6a4'; ctx.fillRect(x,bottom-lh,bw,lh);
     ctx.fillStyle = '#e88492'; ctx.fillRect(x,bottom-lh-sh,bw,sh);
    }
   });
   if(kind === 'levels' && marketPrice) { ctx.strokeStyle = '#809afa'; ctx.beginPath(); ctx.moveTo(priceX(marketPrice),top); ctx.lineTo(priceX(marketPrice),bottom); ctx.stroke(); }
   ctx.fillStyle = getComputedStyle(canvas).color;
   [0,Math.floor(rows.length/2),rows.length-1].filter((i,j,a) => i>=0 && a.indexOf(i)===j).forEach(i => {
    ctx.textAlign = i===0 ? 'left' : i===rows.length-1 ? 'right' : 'center';
    ctx.fillText(kind === 'levels' ? `$${Number(rows[i].price).toLocaleString()}` : String(rows[i].label), kind === 'levels' ? priceX(rows[i].price) : left+(i+.5)*slot, 242);
   });
   ctx.textAlign='center'; ctx.fillText(title,(left+right)/2,276); ctx.textAlign='left';
  };
  draw(); const observer = new ResizeObserver(draw); observer.observe(canvas);
  return () => observer.disconnect();
 },[rows,kind,title,marketPrice]);
 return <><canvas ref={ref} className="nxh-chart" style={{height:286}} role="img" aria-label={`${title} · ${longs} / ${shorts}`}>{title}</canvas><p className="nxh-legend"><span className="nxd-long">● {longs}</span><span className="nxd-short">● {shorts}</span></p></>;
}
