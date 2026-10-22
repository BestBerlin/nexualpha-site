import { createServer } from 'node:http';

// Skip only the integration checks that require a port when the runner forbids
// binding one. Other errors still fail the test, and pure contracts still run.
export async function loopbackUnavailableReason() {
  const server = createServer();
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    return false;
  } catch (error) {
    if (!['EPERM', 'EACCES'].includes(error.code)) throw error;
    return `Loopback HTTP server unavailable: ${error.code} binding 127.0.0.1 in this environment`;
  } finally {
    if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}
