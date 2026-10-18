// Node 20's bundled undici can throw "ReadableStream is already closed" (ERR_INVALID_STATE) from a microtask when a fetch
// is aborted at the moment its response body finishes (our feed refreshes abort on timeout). Nothing can catch it, so
// it took the whole web server down (2026-10-19: two restarts in 25 minutes after "feed refresh timed out").
// This guard swallows exactly that error, logs it, and lets every other uncaught exception crash the process as before.
export function isUndiciCloseRace(error) {
  return error?.code === "ERR_INVALID_STATE" && /ReadableStream is already closed/.test(String(error?.message || ""))
    && /ReadableByteStreamController\.close|undici/.test(String(error?.stack || ""));
}

export function installUndiciCloseRaceGuard(proc = process, log = (m) => console.error(m)) {
  proc.on("uncaughtException", (error, origin) => {
    if (isUndiciCloseRace(error)) { log("[NexuAlpha] ignored undici ReadableStream close race after an aborted fetch"); return; }
    // Same outcome as without a handler: print and exit non-zero (the container restarts).
    console.error(origin === "unhandledRejection" ? "Unhandled rejection:" : "Uncaught exception:", error);
    proc.exit(1);
  });
}
