// One JPG contact sheet per final mp4: a frame at every scene midpoint, tiled in scene order (left-to-right, top-to-bottom).
//   node final-contact-sheets.mjs  -> renders/final/contact-<variant>-<format>.jpg
import { readFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const lib = ['/opt/homebrew/Cellar/x265/4.2/lib', '/opt/homebrew/Cellar/x265/4.3/lib'].find(existsSync);
const env = lib ? { ...process.env, DYLD_LIBRARY_PATH: lib } : process.env;
const finalDir = join(root, 'renders/final');
for (const file of readdirSync(finalDir).filter(f => /^E\d\d-.+-(landscape|portrait)\.mp4$/.test(f))) {
  const name = file.replace(/\.mp4$/, '');
  const portrait = name.endsWith('portrait');
  const timeline = JSON.parse(readFileSync(join(root, `evidence/timeline-${name}.json`), 'utf8'));
  const tmp = join(root, `build/contact-${name}`);
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  timeline.scenes.forEach((s, i) => {
    const t = (s.start + s.duration / 2).toFixed(3);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', t, '-i', join(finalDir, file), '-frames:v', '1', '-vf', `scale=${portrait ? 360 : 640}:-2`, join(tmp, `${String(i).padStart(2, '0')}.png`)], { env });
  });
  const cols = 5, rows = Math.ceil(timeline.scenes.length / cols);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', join(tmp, '%02d.png'), '-vf', `tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', '-q:v', '3', join(finalDir, `contact-${name}.jpg`)], { env });
  rmSync(tmp, { recursive: true, force: true });
  console.log(`renders/final/contact-${name}.jpg (${timeline.scenes.length} scenes)`);
}
