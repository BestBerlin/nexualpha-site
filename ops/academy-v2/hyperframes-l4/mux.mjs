import { readFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));
if (!process.argv[2])
  throw new Error(
    "Usage: node mux.mjs path/to/narration.wav (scene-aligned track, excludes 3-second intro)",
  );
const wav = resolve(process.argv[2]);
const env = {
  ...process.env,
  DYLD_LIBRARY_PATH: "/opt/homebrew/Cellar/x265/4.2/lib",
};
const probe = spawnSync(
  "ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "json", wav],
  { env, encoding: "utf8" },
);
if (probe.status !== 0) throw new Error(probe.stderr);
const length = Number(JSON.parse(probe.stdout).format.duration);
const timing = JSON.parse(
  await readFile(join(root, "evidence/scene-times.json"), "utf8"),
);
if (
  !Number.isFinite(length) ||
  length <= 0 ||
  length > timing.duration - 3 + 0.034
)
  throw new Error(
    "Narration exceeds scene-aligned duration. Rebuild from real scene/word timings first; audio is never silently truncated.",
  );
await mkdir(join(root, "renders"), { recursive: true });
for (const format of ["landscape", "portrait"]) {
  const args = [
    "-v",
    "error",
    "-i",
    join(root, "renders", `${format}.mp4`),
    "-i",
    wav,
    "-filter_complex",
    `[1:a]adelay=3000:all=1,apad,atrim=duration=${timing.duration},loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
    "-map",
    "0:v:0",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-y",
    join(root, "renders", `${format}-narrated.mp4`),
  ];
  const result = spawnSync("ffmpeg", args, { env, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
}
console.log("Wrote narrated derivatives; silent masters retained.");
