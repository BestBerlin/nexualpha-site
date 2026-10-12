import { existsSync, statSync } from "node:fs";
import path from "node:path";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
  [".vtt", "text/vtt; charset=utf-8"],
]);

export function contentTypeForAssetPath(filePath) {
  return contentTypes.get(path.extname(filePath)) ?? "application/octet-stream";
}

export function resolveAssetPath(clientRoot, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  const requested = normalized === "/" ? "/index.html" : normalized;
  const candidate = path.join(clientRoot, requested);
  const relative = path.relative(clientRoot, candidate);

  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  if (!existsSync(candidate)) return null;

  const stats = statSync(candidate);
  return stats.isFile() ? candidate : null;
}

export function rewriteLocalRedirectLocation(location, localOrigin, publicOrigin = "https://nexualpha.com") {
  if (!location) return location;
  try {
    const destination = new URL(location, publicOrigin);
    if (destination.origin !== publicOrigin) return location;
    const local = new URL(localOrigin);
    destination.protocol = local.protocol;
    destination.host = local.host;
    return destination.href;
  } catch {
    return location;
  }
}
