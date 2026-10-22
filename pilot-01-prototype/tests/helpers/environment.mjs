import { createServer } from "node:net";

// Probe the same loopback binding used by HTTP integration tests. A restricted
// runner must report the missing capability, rather than crash or silently pass.
export async function loopbackListenSkip() {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once("error", (error) => {
      if (["EPERM", "EACCES"].includes(error.code)) {
        resolve(`Local loopback listening is unavailable (${error.code} on 127.0.0.1)`);
      } else reject(error);
    });
    server.listen(0, "127.0.0.1", () => server.close((error) => error ? reject(error) : resolve(false)));
  });
}
