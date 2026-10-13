#!/usr/bin/env node
import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { contentTypeForAssetPath, resolveAssetPath, rewriteLocalRedirectLocation } from "./asset-path.mjs";
import { createNewsSsrRenderer } from "./news-ssr.mjs";
import { createFundingMatrixReader } from "./funding-matrix.mjs";
import { marketEventsReaderFromEnv } from "./market-events-feed.mjs";
import { createCtaCollector } from "./cta-collector.mjs";
import { createFxFeed, FX_JSON_PATH } from "./fx-feed.mjs";

import { createPositionRadar } from "./position-radar.mjs";
const radar = createPositionRadar({ ...(process.env.INTEL_REFRESH === "off" ? { fetchImpl: async () => { throw new Error("radar network off"); } } : {}) });

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.resolve(process.env.DIST_ROOT || path.join(root, "dist"));
const clientRoot = path.join(distRoot, "client");
const renderNews = createNewsSsrRenderer(distRoot);
const fundingMatrix = createFundingMatrixReader({ enabled: process.env.INTEL_REFRESH !== "off" });
const marketEvents = marketEventsReaderFromEnv(process.env);
const fx = createFxFeed({
  enabled: process.env.FX_REFRESH !== "off",
  ...(process.env.FX_SOURCE_URL ? { sourceUrl: process.env.FX_SOURCE_URL } : {}),
  log: (m) => process.stdout.write(`[NexuAlpha] ${m}\n`),
});
const { default: worker } = await import(pathToFileURL(path.join(distRoot, "server/index.js")));
const collectCta = createCtaCollector(process.env.CTA_DATA_FILE || path.join(root, ".private", "analytics", "local-cta.jsonl"));
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const host = process.env.HOST ?? "127.0.0.1";

if (!existsSync(path.join(clientRoot, "index.html"))) {
  throw new Error("Run npm run build before starting the local Sites preview.");
}

const assets = {
  async fetch(request) {
    const url = new URL(request.url);
    const filePath = resolveAssetPath(clientRoot, url.pathname);
    if (!filePath) return new Response("missing", { status: 404 });

    const body = request.method === "HEAD" ? null : await streamBody(filePath);
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentTypeForAssetPath(filePath),
        "cache-control": /[/\\]brand[/\\].+-v\d+\.(?:avif|gif|jpe?g|png|webp)$/i.test(filePath)
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      },
    });
  },
};

createServer(async (request, response) => {
  try {
    const origin = `http://${request.headers.host ?? `${host}:${port}`}`;
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : request;
    const workerRequest = new Request(new URL(request.url ?? "/", origin), {
      method: request.method,
      headers: request.headers,
      body,
      duplex: body ? "half" : undefined,
    });
    const pathname = new URL(workerRequest.url).pathname;
    const workerResponse = pathname === "/api/analytics/cta"
      ? await collectCta(workerRequest, origin)
      : pathname === FX_JSON_PATH && (request.method === "GET" || request.method === "HEAD")
        ? await fx.respond(request.method)
        : await worker.fetch(workerRequest, {
      ASSETS: assets,
      NEWS_SSR_RENDER: renderNews,
      RADAR_READ: radar.read,
      FUNDING_MATRIX_READ: fundingMatrix.read,
      MARKET_EVENTS_READ: marketEvents.read,
      FX_SNAPSHOT_READ: fx.read,
      CORE_API_ORIGIN: process.env.CORE_API_ORIGIN,
      CORE_API_BASE_URL: process.env.CORE_API_BASE_URL,
    });

    const headers = Object.fromEntries(workerResponse.headers);
    if (headers.location) headers.location = rewriteLocalRedirectLocation(headers.location, origin);
    if (request.method === "HEAD" || !workerResponse.body) {
      response.writeHead(workerResponse.status, headers);
      response.end();
      return;
    }
    const rawBody = Buffer.from(await workerResponse.arrayBuffer());
    const contentType = headers["content-type"] || "";
    const acceptsGzip = /(?:^|,|\s)gzip(?:,|\s|$)/i.test(request.headers["accept-encoding"] || "");
    const compressible = /^(?:text\/|application\/(?:javascript|json|xml|wasm)|image\/svg\+xml)/i.test(contentType);
    const bodyBuffer = acceptsGzip && compressible ? gzipSync(rawBody, { level: 6 }) : rawBody;
    if (bodyBuffer.length !== rawBody.length) {
      headers["content-encoding"] = "gzip";
      headers.vary = headers.vary ? `${headers.vary}, Accept-Encoding` : "Accept-Encoding";
    }
    delete headers["content-length"];
    response.writeHead(workerResponse.status, headers);
    response.end(bodyBuffer);
  } catch {
    response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "unavailable", reasonCode: "LOCAL_SITES_PREVIEW_ERROR", updatedAt: new Date().toISOString(), data: [] }));
  }
}).listen(port, host, () => {
  process.stdout.write(`nexualpha local Sites preview listening on http://${host}:${port}\n`);
});

async function streamBody(filePath) {
  return new ReadableStream({
    start(controller) {
      const stream = createReadStream(filePath);
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (error) => controller.error(error));
    },
  });
}
