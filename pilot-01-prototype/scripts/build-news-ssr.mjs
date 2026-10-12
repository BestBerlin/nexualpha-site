#!/usr/bin/env node
// Offline runtime build: reuse the actual SSR entry and existing project config.
import { build } from 'vite';
await build({
  ssr: { noExternal: true },
  build: { ssr: 'src/entry-server.jsx', outDir: 'dist/news-ssr', emptyOutDir: true, copyPublicDir: false },
});
// This is a one-shot CLI build. The bundled compiler can retain its native runtime
// after build() resolves; exit only after success so downstream build stages run.
process.exit(0);
