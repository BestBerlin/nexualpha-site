export function NexuAlphaWordmark({ href, variant = "header" }) {
  const target = href ?? "/#top";
  return <a className={`nx-brand nx-brand--${variant}`} href={target} aria-label="NexuAlpha" translate="no" lang="en" dir="ltr">
    <img className="nx-brand__mark" src="/brand/nexualpha/nexualpha-round.svg" width="150" height="150" alt="" aria-hidden="true" />
    <span className="nx-brand__label" aria-hidden="true" dir="ltr">Nexu<span>Alpha</span></span>
    <span className="sr-only" data-brand-slot="nexualpha-logo">NexuAlpha</span>
  </a>;
}
