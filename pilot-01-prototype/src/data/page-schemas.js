import { organizationSchema, websiteSchema, ORGANIZATION_ID, WEBSITE_ID } from "./brand-entity.js";
import { localizedPath } from "./locale-routing.js";

// Complete the emitted graph without changing route metadata, publication gates or content locales.
// Both the SSR head and navigation payload use this boundary.
export function completePageSchemas(schema, { pathname, canonical, title, description, locale = "en" }) {
  const nodes = Array.isArray(schema) ? [...schema] : schema?.["@graph"] ? [...schema["@graph"]] : schema ? [schema] : [];
  if (!nodes.length && pathname !== "/" && pathname !== "/index.html") {
    nodes.push({ "@context": "https://schema.org", "@type": "WebPage", name: title, url: canonical, inLanguage: locale, ...(description ? { description } : {}) });
  }
  for (const [id, entity] of [[ORGANIZATION_ID, organizationSchema(locale)], [WEBSITE_ID, websiteSchema(locale)]]) {
    const index = nodes.findIndex((node) => node?.["@id"] === id);
    if (index < 0) nodes.push({ "@context": "https://schema.org", ...entity });
    else nodes[index] = { ...entity, ...nodes[index] };
  }
  if (pathname !== "/" && pathname !== "/index.html" && !nodes.some((node) => node?.["@type"] === "BreadcrumbList")) {
    const origin = new URL(canonical).origin;
    nodes.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "NexuAlpha", item: `${origin}${localizedPath("/", locale)}` },
        { "@type": "ListItem", position: 2, name: title, item: canonical },
      ],
    });
  }
  return nodes;
}
