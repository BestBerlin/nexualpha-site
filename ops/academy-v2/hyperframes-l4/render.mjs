import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));
await mkdir(join(root, "renders"), { recursive: true });
await mkdir(join(root, "evidence"), { recursive: true });
const measurements = [];
for (const format of ["landscape", "portrait"]) {
  const start = performance.now();
  const log = createWriteStream(join(root, "evidence", `render-${format}.log`));
  const args = [
    "render",
    format,
    "--fps",
    "30",
    "--quality",
    "high",
    "--workers",
    "2",
    "--strict",
    "--output",
    `renders/${format}.mp4`,
  ];
  const child = spawn(join(root, "node_modules/.bin/hyperframes"), args, {
    cwd: root,
    env: {
      ...process.env,
      DO_NOT_TRACK: "1",
      DYLD_LIBRARY_PATH: "/opt/homebrew/Cellar/x265/4.2/lib",
    },
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  log.end();
  measurements.push({
    format,
    command:
      (process.env.HYPERFRAMES_BROWSER_PATH
        ? "HYPERFRAMES_BROWSER_PATH=" +
          process.env.HYPERFRAMES_BROWSER_PATH +
          " "
        : "") +
      "DO_NOT_TRACK=1 DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib npx --no-install hyperframes " +
      args.join(" "),
    exitCode,
    elapsedSeconds: Math.round((performance.now() - start) / 100) / 10,
  });
  console.log(JSON.stringify(measurements.at(-1)));
}
await writeFile(
  join(root, "evidence/render-times.json"),
  JSON.stringify(measurements, null, 2) + "\n",
);
if (measurements.some((m) => m.exitCode !== 0)) process.exitCode = 1;
