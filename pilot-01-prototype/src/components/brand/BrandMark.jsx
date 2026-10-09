import { brandsBySlug } from "../../content/brand-manifest";
import { useEffect, useState } from "react";

export function BrandMark({ slug, compact = false, priority = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [slug]);
  const brand = brandsBySlug[slug];
  const name = brand?.name ?? slug;
  const preferred = brand?.preferredSquare;
  // Use only manifest-recorded assets. Deriving a sibling .webp path caused
  // predictable 404s for brands whose retained asset is PNG/JPEG only.
  const src = preferred;
  const handleError = () => {
    setFailed(true);
  };
  if (src && !failed) return <img className={compact ? `v2-brand v2-brand--compact v2-brand--${slug}` : `v2-brand v2-brand--${slug}`} src={src} alt="" aria-hidden="true" width={compact ? 28 : 40} height={compact ? 28 : 40} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" data-brand-slug={slug} data-brand-source={brand?.status} onError={handleError} />;
  const initials = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  return <span className={compact ? `v2-brand-fallback v2-brand-fallback--compact v2-brand-fallback--${slug}` : `v2-brand-fallback v2-brand-fallback--${slug}`} aria-hidden="true" data-brand-slug={slug} data-brand-fallback>{initials}</span>;
}
