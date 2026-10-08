// V6 signature: ONE continuous route rail down the inline-start gutter, from the hero's "You" line to the closing CTA.
// R7: fully server-rendered. Every act carries its own piece of the rail as static markup:
//   <RailSeg />  the track for that act (a 2px hairline at the gutter x, the act's full height) with its fill inside;
//   <RailDock /> the dock (node + tick + act label), level with the act's heading.
// No measuring and no JS: the fill is a scroll-driven CSS animation (animation-timeline: view(), one reading line at 62% of
// the viewport for every segment, so the segments read as one line), and a dock lights when it crosses that line.
// Browsers without scroll-driven animations (and reduced motion) get the static rail: track, docks and labels, no fill.
// Decorative only: aria-hidden, pointer-events none, never in the content columns. Styles: src/styles/v6/home-r7.css.
import { RAIL, pickLocale } from "../v3/LeanHeroCopyV6.js";

// i = RAIL label index: 0 compare, 1 verify, 2 directory, 3 sign up (the destination)
export function RailDock({ i, locale, kind = "act" }) {
  const lab = pickLocale(RAIL, locale)[i];
  return (
    <span className={`rr-dock rr-dock--${kind}`} aria-hidden="true">
      <i className="rr-dock__tick" />
      {lab && <em className="rr-dock__lab">{lab}</em>}
      <b className="rr-dock__node" />
    </span>
  );
}

// start: the hero's piece begins level with the "You" pill (CSS anchor), with a short stub toward the intents and the start node.
export function RailSeg({ start = false, dest = false }) {
  return (
    <>
      <span className={`rr-seg${start ? " rr-seg--start" : ""}${dest ? " rr-seg--dest" : ""}`} aria-hidden="true"><i className="rr-seg__fill" /></span>
      {start && <i className="rr-stub" aria-hidden="true" />}
      {start && <b className="rr-start" aria-hidden="true" />}
    </>
  );
}
