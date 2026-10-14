// Temporary local development React entry over the built SSR server, for readable hydration diagnostics.
import { createServer as createViteServer } from 'vite';
import { createServer } from 'node:http';
const upstream = process.env.AUDIT_UPSTREAM || 'http://127.0.0.1:43219';
const vite = await createViteServer({ optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false } });
const server = createServer((req, res) => vite.middlewares(req, res, async () => {
  try {
    const response = await fetch(new URL(req.url, upstream), { redirect: 'manual' });
    const headers = Object.fromEntries(response.headers);
    delete headers['content-length'];
    delete headers['content-encoding'];
    if (headers['content-type']?.includes('text/html')) {
      const html = (await response.text()).replaceAll(/\/assets\/index-[A-Za-z0-9_-]+\.js/g, '/src/main.jsx');
      const transformed = await vite.transformIndexHtml(req.url, html);
      res.writeHead(response.status, headers); res.end(transformed);
    } else { res.writeHead(response.status, headers); res.end(Buffer.from(await response.arrayBuffer())); }
  } catch (error) { res.writeHead(500); res.end(String(error)); }
}));
server.listen(43220, '127.0.0.1', () => console.log('Audit dev preview: http://127.0.0.1:43220'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(async () => { await vite.close(); process.exit(0); }));
