import { useEffect, useRef, useState } from "react";
import { formatPercent } from "../../data/format-percent.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { reduced } from "./home7-shared.jsx";
import "../../styles/v7/rebate-owner.css";

function countTo({ from, to, setShown }) {
  if (from === to || reduced()) {
    setShown(to);
    return undefined;
  }
  const start = performance.now();
  let frame = 0;
  const step = (now) => {
    const t = Math.min(1, (now - start) / 820);
    const eased = 1 - Math.pow(1 - t, 4);
    setShown(from + (to - from) * eased);
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

export function RebateNumber({ locale, venue }) {
  const target = Math.max(0, Math.round((venue?.share || 0) * 100));
  const [shown, setShown] = useState(target);
  const lastTarget = useRef(target);
  const mounted = useRef(false);
  const percentBefore = formatPercent(locale, 1).startsWith("%");

  useEffect(() => {
    const from = mounted.current ? lastTarget.current : 0;
    mounted.current = true;
    lastTarget.current = target;
    return countTo({ from, to: target, setShown });
  }, [target, venue?.slug]);

  const rounded = String(Math.round(shown));
  return (
    <p className="h7-num h7-rebate-figure" data-brand={venue?.slug} data-final-value={target}>
      <span className="h7-sr">{venue?.name ? `${venue.name} ${formatPercent(locale, target)}` : formatPercent(locale, target)}</span>
      <span className="h7-rebate-logo" aria-hidden="true"><BrandMark slug={venue?.slug} compact priority /></span>
      <span className="h7-rebate-value" aria-hidden="true">
        {percentBefore && <span className="h7-rebate-percent">%</span>}
        <span className="h7-rebate-digits">{rounded}</span>
        {!percentBefore && <span className="h7-rebate-percent">%</span>}
      </span>
    </p>
  );
}
