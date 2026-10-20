import autopilotOverrides from "./seo-autopilot-overrides.json" with { type: "json" };
// SSR-only helper shared by the worker metadata and SSR head finalizers.
export function applyAutopilotOverride(seo, pathname, locale, overrides = autopilotOverrides, publicPath = pathname) {
  if (!seo || seo.status !== 200 || /\bnoindex\b/i.test(seo.robots || "") || !/^(?:\/exchanges\/[^/]+|\/compare\/[^/]+|\/news(?:\/page\/\d+|\/category\/[^/]+)?|\/data\/[^/]+|\/liquidations|\/funding-rates)$/.test(pathname)) return seo;
  const entry = overrides[publicPath];
  if (!entry || entry.revert) return seo;
  const key = String(locale).toLowerCase();
  const title = entry.title?.[key], description = entry.description?.[key];
  return { ...seo, ...(typeof title === "string" && title.trim() ? { title } : {}), ...(typeof description === "string" && description.trim() ? { description } : {}) };
}

