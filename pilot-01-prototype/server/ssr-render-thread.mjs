import { parentPort, workerData } from 'node:worker_threads';
import { createReadStream } from 'node:fs';
import { contentTypeForAssetPath, resolveAssetPath } from './asset-path.mjs';
import { createNewsSsrRenderer } from './news-ssr.mjs';

const { default: worker } = await import(workerData.workerUrl);
const news = createNewsSsrRenderer(workerData.distRoot);
const scope = {};
const assets = { async fetch(request) {
        const file = resolveAssetPath(workerData.clientRoot, new URL(request.url).pathname);
        if (!file) return new Response('Not Found', { status: 404 });
        return new Response(request.method === 'HEAD' ? null : createReadStream(file), { headers: { 'content-type': contentTypeForAssetPath(file) } });
      } };
const readers = new Map();
let sequence = 0;
parentPort.on('message', async (message) => {
  if (message.type === 'reader-result') {
    const callback = readers.get(message.call);
    readers.delete(message.call);
    if (callback) message.error ? callback.reject(new Error(message.error)) : callback.resolve(message.value);
    return;
  }
  const revive = (value) => {
    if (value?.__ssrReader) return (...args) => new Promise((resolve, reject) => {
      const call = ++sequence;
      readers.set(call, { resolve, reject });
      parentPort.postMessage({ type: 'reader', id: message.id, call, name: value.__ssrReader, args });
    });
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, revive(child)]));
    return value;
  };
  try {
    const response = await worker.fetch(new Request(message.url, { method: message.method, headers: message.headers }), {
      ...revive(message.env), NEWS_SSR_RENDER: news, WORKER_POLLED_JSON_CACHE_SCOPE: scope,
      ASSETS: assets,
    });
    const body = await response.arrayBuffer();
    parentPort.postMessage({ id: message.id, status: response.status, headers: [...response.headers], body }, [body]);
  } catch (error) { parentPort.postMessage({ id: message.id, error: String(error?.message || error) }); }
});
