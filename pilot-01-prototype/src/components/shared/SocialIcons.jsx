// Official brand glyphs for the social matrix (X and YouTube paths from Simple Icons, CC0). Monochrome: colour comes from
// `currentColor`, so each surface decides between ink and the platform's brand colour.
const base = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", focusable: "false" };

export function XGlyph({ size = 18, className }) {
  return <svg {...base} width={size} height={size} className={className}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>;
}

export function YouTubeGlyph({ size = 18, className }) {
  return <svg {...base} width={size} height={size} className={className}><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.5 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>;
}

// Telegram: the round mark with the plane cut out (even-odd), drawn compactly because the header ships in the entry.
export function TelegramGlyph({ size = 18, className }) {
  return <svg {...base} width={size} height={size} className={className}><path fillRule="evenodd" d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.4 7.2-2 9.6c-.15.7-.55.85-1.1.53l-3-2.2-1.45 1.4c-.16.16-.3.3-.6.3l.2-3.1 5.6-5.05c.25-.22-.05-.34-.38-.12L7.7 13l-2.98-.93c-.65-.2-.66-.65.14-.96l11.63-4.48c.54-.2 1.01.13.9.97Z" /></svg>;
}
