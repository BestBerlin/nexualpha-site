# Globe compositor migration

Keep the current hero, SSR SVG, chip content and box dimensions. Replace only the lazy canvas renderer with a one-time, two-period dotted SVG texture translated by CSS, fixed spherical shading and SVG routes with transform-based travelling pulses. Keep all animation state CSS-owned; visibility and reduced-motion changes only toggle pause state. Measure chip leaders only on mount/resize/selection and clean up observers on unmount.

Regression gates: no globe frame/timer scheduling; one texture per mount; continuous visible CSS animation; hidden/offscreen/reduced-motion pause and resume; current chip selection and resize geometry; teardown; SSR/home contracts; strict home static closure and globe gzip <= 8,000 bytes. Render the existing SSR globe and new SVG composition with resvg for review. Attempt real Chrome checks at 390/768/1440; document any sandbox blocker rather than claiming browser verification.
