import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { venueProfile } from "../../../data/v3-product";
import { sectionEyebrowAttrs } from "../../../data/section-eyebrow.js";


const ssrActivityCenterModules = import.meta.env.SSR ? import.meta.glob(["./ActivityCenterV3.jsx"], { eager: true }) : {};
const ServerActivityCenterV3 = import.meta.env.SSR ? ssrActivityCenterModules["./ActivityCenterV3.jsx"].ActivityCenterV3 : null;
let activityCenterChunk;
const loadActivityCenter = () => (activityCenterChunk ??= import("./ActivityCenterV3.jsx"));

function ActivityCenterIsland(props) {
  if (import.meta.env.SSR) {
    return <div id="activity-center-v3-root"><ServerActivityCenterV3 {...props} /></div>;
  }
  const hostRef = useRef(null);
  const rootRef = useRef(null);
  const latestProps = useRef(props);
  latestProps.current = props;
  const [serverHtml] = useState(() => (typeof document === "undefined" ? "" : document.getElementById("activity-center-v3-root")?.innerHTML || ""));
  const frozenHtml = useMemo(() => ({ __html: serverHtml }), [serverHtml]);

  useEffect(() => {
    let cancelled = false;
    let idle = null;
    const start = () => {
      if (cancelled || rootRef.current || !hostRef.current) return;
      loadActivityCenter().then((mod) => {
        if (cancelled || rootRef.current || !hostRef.current) return;
        import("react-dom/client").then((client) => {
          if (cancelled || rootRef.current || !hostRef.current) return;
          const element = <mod.ActivityCenterV3 {...latestProps.current} />;
          rootRef.current = serverHtml ? client.hydrateRoot(hostRef.current, element) : client.createRoot(hostRef.current);
          if (!serverHtml) rootRef.current.render(element);
        });
      });
    };
    const schedule = () => {
      idle = typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(start, { timeout: 1000 })
        : window.setTimeout(start, 0);
    };
    const wake = () => start();
    schedule();
    hostRef.current?.addEventListener("pointerdown", wake, { once: true, passive: true, capture: true });
    hostRef.current?.addEventListener("keydown", wake, { once: true, capture: true });
    return () => {
      cancelled = true;
      if (idle !== null) { window.cancelIdleCallback?.(idle); window.clearTimeout(idle); }
      hostRef.current?.removeEventListener("pointerdown", wake, { capture: true });
      hostRef.current?.removeEventListener("keydown", wake, { capture: true });
      const root = rootRef.current;
      rootRef.current = null;
      if (root) setTimeout(() => root.unmount(), 0);
    };
  }, [serverHtml]);

  useEffect(() => {
    if (!rootRef.current) return;
    loadActivityCenter().then((mod) => rootRef.current?.render(<mod.ActivityCenterV3 {...latestProps.current} />));
  }, [props.locale, props.market, props.product, props.copy, props.venues, props.publicUpdates, props.campaignFeed]);

  return <div id="activity-center-v3-root" ref={hostRef} suppressHydrationWarning dangerouslySetInnerHTML={frozenHtml} />;
}
const ssrActivityDetailModules = import.meta.env.SSR ? import.meta.glob(["./ActivityDetailPage.jsx"], { eager: true }) : {};
const ServerActivityDetailPage = import.meta.env.SSR ? ssrActivityDetailModules["./ActivityDetailPage.jsx"].ActivityDetailPage : null;
const ClientActivityDetailPage = import.meta.env.SSR ? null : lazy(() => import("./ActivityDetailPage.jsx").then((mod) => ({ default: mod.ActivityDetailPage })));

export function ActivityDetailPage(props) {
  const DetailPage = import.meta.env.SSR ? ServerActivityDetailPage : ClientActivityDetailPage;
  return <Suspense fallback={null}><DetailPage {...props} /></Suspense>;
}

export function ActivityCenterPage({ copy, locale, market, product, venues, updates, campaignFeed }) {
  const profiles = venues.map((venue) => venueProfile(venue, locale));
  return <main className="v6 v2-page v3-page v3-activity-center" id="top" {...sectionEyebrowAttrs(locale, "campaigns")}>
    <ActivityCenterIsland locale={locale} market={market} product={product} copy={copy} venues={profiles} publicUpdates={updates} campaignFeed={campaignFeed} />
  </main>;
}
