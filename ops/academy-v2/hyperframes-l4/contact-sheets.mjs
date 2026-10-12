import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = dirname(fileURLToPath(import.meta.url));
const timing = JSON.parse(
  await readFile(join(root, "evidence/scene-times.json"), "utf8"),
);
const frames = [{ id: "intro", hero: 2 }, ...timing.scenes];
for (const [format, w, h] of [
  ["landscape", 1920, 1080],
  ["portrait", 1080, 1920],
]) {
  const scale = format === "portrait" ? 0.18 : 0.24;
  const panels = frames
    .map(
      (f) =>
        `<figure><div class="frame"><iframe title="${f.id}" src="../${format}/index.html?at=${f.hero}" style="width:${w}px;height:${h}px;transform:scale(${scale});transform-origin:top left;border:0"></iframe></div><figcaption>${f.id} · ${f.hero.toFixed(2)} s</figcaption></figure>`,
    )
    .join("");
  await writeFile(
    join(root, `evidence/contact-${format}.html`),
    `<!doctype html><html><head><meta charset="utf-8"><title>Level 4 / ${format} contact sheet</title><style>body{background:#0b0d10;color:#eef2f9;font-family:Arial;padding:24px}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(3,${w * scale}px);gap:20px}figure{margin:0}.frame{width:${w * scale}px;height:${h * scale}px;overflow:hidden}figcaption{font-size:14px;padding:10px 0;color:#b6c0d0}@media print{@page{size:A3 landscape;margin:10mm}body{print-color-adjust:exact;-webkit-print-color-adjust:exact;padding:0}main{gap:10px}figure{break-inside:avoid}}</style></head><body><h1>NexuAlpha · Level 4 / ${format}</h1><p>Estimated narration timing · silent master review · HTML timeline hero frames (not encoded-video evidence)</p><main>${panels}</main></body></html>`,
  );
  if (process.argv.includes("--video")) {
    const dir = join(root, "evidence", `${format}-frames`);
    await mkdir(dir, { recursive: true });
    frames.forEach((f, i) => {
      const result = spawnSync(
        "ffmpeg",
        [
          "-v",
          "error",
          "-ss",
          String(f.hero),
          "-i",
          join(root, "renders", `${format}.mp4`),
          "-frames:v",
          "1",
          "-y",
          join(dir, `${String(i).padStart(2, "0")}.png`),
        ],
        {
          env: {
            ...process.env,
            DYLD_LIBRARY_PATH: "/opt/homebrew/Cellar/x265/4.2/lib",
          },
          encoding: "utf8",
        },
      );
      if (result.status !== 0) throw new Error(result.stderr);
    });
    const result = spawnSync(
      "ffmpeg",
      [
        "-v",
        "error",
        "-framerate",
        "1",
        "-i",
        join(dir, "%02d.png"),
        "-vf",
        `scale=${format === "portrait" ? 270 : 480}:-1,tile=3x3:padding=12:margin=12:color=0x0b0d10`,
        "-frames:v",
        "1",
        "-y",
        join(root, "evidence", `contact-${format}.png`),
      ],
      {
        env: {
          ...process.env,
          DYLD_LIBRARY_PATH: "/opt/homebrew/Cellar/x265/4.2/lib",
        },
        encoding: "utf8",
      },
    );
    if (result.status !== 0) throw new Error(result.stderr);
  }
}
console.log(
  "Wrote both HTML contact sheets" +
    (process.argv.includes("--video")
      ? " and PNG sheets extracted from masters."
      : ". Use --video after rendering for PNG sheets."),
);
