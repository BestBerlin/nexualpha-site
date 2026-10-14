// Token-level contrast evidence. This is not a rendered glyph/pixel audit.
import { readFile, writeFile } from 'node:fs/promises';
const css = await readFile(new URL('../pilot-01-prototype/src/styles/tokens.css', import.meta.url), 'utf8');
const hex = name => css.match(new RegExp(`${name}:(#[A-Fa-f0-9]{6})`))?.[1];
const luminance = color => {
  const rgb = color.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
    .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const background = hex('--p-ink-0');
const gradient = css.match(/--hx-rate-grad:([^;]+)/)[1].match(/#[A-Fa-f0-9]{6}/g);
const checks = [...gradient.map(color => ({color, minimum:7})), ...['--p-white','--p-gray-1','--p-gray-2'].map(name => ({color:hex(name),name,minimum:4.5})), {color:'#E8FBFF',name:'tab number',minimum:4.5}]
  .map(check => ({...check,ratio:(luminance(check.color)+.05)/(luminance(background)+.05)}));
const result = {scope:'CSS tokens against the specified background; rendered glyph sampling remains unverified',background,checks,pass:checks.every(x => x.ratio >= x.minimum)};
await writeFile(new URL('../docs/evidence/ui-to-spec/token-contrast.json', import.meta.url), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if (!result.pass) process.exitCode = 1;
