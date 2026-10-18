// Native details keeps every section in SSR and works before hydration.
export function VenueSectionDisclosure({ label, children }) {
  return <details className="venue-section-disclosure">
    <summary>{label}</summary>
    <div className="venue-section-disclosure__body">{children}</div>
  </details>;
}
