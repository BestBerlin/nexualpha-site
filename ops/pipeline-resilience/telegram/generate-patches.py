from pathlib import Path
import difflib, hashlib, json
source=Path('/Users/bestberlin/Documents/ChatGPT/Telegram')
out=Path(__file__).parent
paths=['apps/worker/src/publication-worker.ts','apps/bot-community/src/polling-runner.ts']
original={p:(source/p).read_text() for p in paths}
worker=original[paths[0]]
worker=worker.replace('import { Worker } from "bullmq";', '''import { Worker } from "bullmq";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";''')
worker=worker.replace('const connection = {', '''let backendClients: { status: string }[] = [];
let stopping = false;
let lastProgressAt = new Date().toISOString();
let lastBackendErrorAt: string | null = null;
let lastJobOutcome = "idle";
const healthPath = process.env.WORKER_HEARTBEAT_FILE ?? process.env.WORKER_HEALTH_SNAPSHOT_PATH ?? "/var/lib/crypto-telegram-ops/worker-heartbeat.json";

function writeWorkerHealth(): void {
  try {
    mkdirSync(dirname(healthPath), { recursive: true, mode: 0o700 });
    const temporaryPath = `${healthPath}.${process.pid}.tmp`;
    writeFileSync(temporaryPath, JSON.stringify({
      updatedAt: new Date().toISOString(), lastProgressAt, lastBackendErrorAt,
      status: stopping ? "stopping" : backendClients.length > 0 && backendClients.every(client => client.status === "ready") ? "running" : "reconnecting",
      backendConnectivity: backendClients.length > 0 && backendClients.every(client => client.status === "ready") ? "connected" : "unavailable",
      lastJobOutcome,
    }), { mode: 0o600 });
    renameSync(temporaryPath, healthPath);
  } catch {
    console.error(JSON.stringify({ service: "telegram-publication-worker", event: "heartbeat_write_failed" }));
  }
}

const connection = {''')
worker=worker.replace('  // Valkey requirepass', '''  // Workers must wait for Valkey through startup/network races, never exhaust command retries.
  maxRetriesPerRequest: null,
  connectTimeout: 10_000,
  retryStrategy: (attempt: number) => Math.min(30_000, 1_000 * 2 ** Math.min(attempt - 1, 5)),
  // Valkey requirepass''')
worker=worker.replace('worker.on("error", (error) => console.error(JSON.stringify({ service: "telegram-publication-worker", error: error.message })));', '''worker.on("error", () => {
  lastBackendErrorAt = new Date().toISOString();
  writeWorkerHealth();
  console.error(JSON.stringify({ service: "telegram-publication-worker", event: "backend_error" }));
});
const backend = worker.getBackend();
void Promise.all([backend.connection.client, ...(backend.blockingConnection ? [backend.blockingConnection.client] : [])]).then(clients => { backendClients = clients; writeWorkerHealth(); }).catch(() => {
  lastBackendErrorAt = new Date().toISOString();
  writeWorkerHealth();
});
for (const event of ["active", "completed", "failed"] as const) {
  worker.on(event, () => { lastProgressAt = new Date().toISOString(); lastJobOutcome = event; writeWorkerHealth(); });
}
writeWorkerHealth();
const heartbeatTimer = setInterval(writeWorkerHealth, 30_000);''')
worker=worker.replace('  console.info(JSON.stringify({ service: "telegram-publication-worker", signal, event: "stopping" }));', '''  if (stopping) return;
  stopping = true;
  clearInterval(heartbeatTimer);
  writeWorkerHealth();
  console.info(JSON.stringify({ service: "telegram-publication-worker", signal, event: "stopping" }));''')
poller=original[paths[1]]
poller=poller.replace('let offset = 0;', '''const pollHealthPath = process.env.POLL_HEALTH_SNAPSHOT_PATH ?? "/var/lib/crypto-telegram-ops/poller-health.json";
let lastSuccessfulPollAt: string | null = null;
let consecutivePollFailures = 0;

async function writePollHealth(status: string): Promise<void> {
  try {
    await mkdir(dirname(pollHealthPath), { recursive: true, mode: 0o700 });
    const temporaryPath = `${pollHealthPath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify({
      updatedAt: new Date().toISOString(), lastSuccessfulPollAt, consecutivePollFailures,
      status, phase: pollingPhase, backendConnectivity: consecutivePollFailures ? "degraded" : lastSuccessfulPollAt ? "connected" : "unknown",
    }), { mode: 0o600 });
    await rename(temporaryPath, pollHealthPath);
  } catch {
    console.error(JSON.stringify({ service: "telegram-community-poller", event: "heartbeat_write_failed" }));
  }
}

let offset = 0;''')
poller=poller.replace('await logGroupObservationCoverage();', 'await writePollHealth("starting");\nawait logGroupObservationCoverage();')
poller=poller.replace('    const updates = await getUpdates(offset);', '''    await writePollHealth("polling");
    const updates = await getUpdates(offset);
    lastSuccessfulPollAt = new Date().toISOString();
    consecutivePollFailures = 0;
    await writePollHealth("processing");''')
poller=poller.replace('      offset = updateId + 1;', '      await writePollHealth("processing");\n      offset = updateId + 1;')
poller=poller.replace('  } catch (error) {\n    if (processingUpdateId', '''  } catch (error) {
    consecutivePollFailures += 1;
    await writePollHealth("retrying");
    if (processingUpdateId''',1)
poller=poller.replace('  return 2_000;', '  return Math.min(30_000, 1_000 * 2 ** Math.min(consecutivePollFailures, 5));')
poller=poller.replace('await memberPool?.end();', 'await writePollHealth("stopped");\nawait memberPool?.end();')
patch=''.join(''.join(difflib.unified_diff(original[p].splitlines(True),updated.splitlines(True),fromfile='a/'+p,tofile='b/'+p)) for p,updated in zip(paths,[worker,poller]))
(out/'startup-heartbeats.patch').write_text(patch)
(out/'source-bases.json').write_text(json.dumps({p:hashlib.sha256(original[p].encode()).hexdigest() for p in paths},indent=2)+'\n')
