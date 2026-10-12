import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import QRCode from "qrcode";
import { estimateTiming, loadTiming } from "./timing.mjs";
import {
  logo,
  brandIntro,
  kineticTitle,
  illustration,
  captionBand,
} from "./components.mjs";
const root = dirname(fileURLToPath(import.meta.url));
const script = JSON.parse(await readFile(join(root, "script.json"), "utf8"));
const timingPath = process.argv[2];
const timing = timingPath
  ? await loadTiming(resolve(timingPath), script)
  : estimateTiming(script);
await writeFile(
  join(root, "timing.json"),
  JSON.stringify(timing, null, 2) + "\n",
);
await writeFile(
  join(root, "assets/qr.svg"),
  await QRCode.toString("https://www.okx.com/join/nexu888", {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 4,
    color: { dark: "#0b0d10", light: "#eef2f9" },
  }),
);
const css = await readFile(join(root, "style.css"), "utf8");
const runtime = await readFile(join(root, "motion.js"), "utf8");
let cursor = timing.introDuration;
const scenes = timing.scenes.map((s, i) => {
  const result = { ...s, start: cursor, index: i };
  cursor += s.duration;
  return result;
});
for (const [format, width, height] of [
  ["landscape", 1920, 1080],
  ["portrait", 1080, 1920],
]) {
  const dir = join(root, format);
  await mkdir(join(dir, "assets"), { recursive: true });
  for (const asset of ["logo.svg", "qr.svg"])
    await copyFile(join(root, "assets", asset), join(dir, "assets", asset));
  await copyFile(
    join(root, "node_modules/gsap/dist/gsap.min.js"),
    join(dir, "assets/gsap.min.js"),
  );
  const data = scenes.map((s) => ({
    ...s,
    captions: captionBand(s.words, format === "portrait" ? 12 : 16).groups,
  }));
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>NexuAlpha · 第 4 关 · ${format}</title><style>${css}</style></head><body><div id="academy" class="${format}" data-composition-id="academy" data-start="0" data-duration="${cursor}" data-width="${width}" data-height="${height}" data-fps="30" style="width:${width}px;height:${height}px"><div class="ambient" data-layout-ignore></div><div class="depth-ring" data-layout-ignore></div><div class="topbar"><div class="wordmark">${logo()}<span>NEXUALPHA</span></div><span class="edition">新手村 / 04</span></div><section id="intro" class="scene intro"><div class="scene-content">${brandIntro()}</div></section>${scenes.map((s) => `<section id="scene-${s.index + 1}" class="scene" style="opacity:0"><div class="scene-content">${kineticTitle(script.scenes[s.index], s.index)}<div class="visual">${illustration(script.scenes[s.index], s.index)}</div></div>${captionBand(s.words, format === "portrait" ? 12 : 16).html}</section>`).join("")}<div class="progress-track"><div class="progress-bar"></div></div><div class="shutter" data-layout-ignore></div></div><script src="assets/gsap.min.js"></script><script>const SCENES=${JSON.stringify(data)};const TOTAL=${cursor};${runtime}</script></body></html>`;
  await writeFile(join(dir, "index.html"), html);
}
await writeFile(
  join(root, "evidence/scene-times.json"),
  JSON.stringify(
    {
      duration: cursor,
      scenes: scenes.map((s) => ({
        id: s.id,
        start: s.start,
        duration: s.duration,
        hero: s.start + s.duration * 0.6,
      })),
    },
    null,
    2,
  ),
);
console.log(
  `Built landscape 1920×1080 and portrait 1080×1920; ${cursor.toFixed(3)}s at 30fps (${timingPath ? "supplied" : "estimated"} timing).`,
);
