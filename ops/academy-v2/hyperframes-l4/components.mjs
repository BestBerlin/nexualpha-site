import { readFileSync } from "node:fs";
const brandSvg = readFileSync(
  new URL("./assets/logo.svg", import.meta.url),
  "utf8",
)
  .replace('aria-labelledby="title desc"', 'aria-label="NexuAlpha"')
  .replace(/ id="(?:title|desc)"/g, "")
  .replace("<svg ", '<svg class="brand-logo" ');
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const logo = () => brandSvg;
export function brandIntro() {
  return `<div class="intro-lockup"><div class="logo-build">${logo()}<i class="logo-orbit"></i></div><div><p class="eyebrow">NEXUALPHA / ACADEMY</p><h1>新手村<span>第 4 关</span></h1><p class="intro-topic">注册 + KYC 一次过</p></div></div>`;
}
export const kineticTitle = (scene, index) =>
  `<div class="editorial"><p class="eyebrow">FIELD GUIDE / ${String(index + 1).padStart(2, "0")}</p><h1>${esc(scene.title)}</h1><p class="deck">${esc(scene.sub)}</p><div class="chapter-rule"></div><p class="lesson-label">注册与身份核验</p></div>`;
export function phoneMock() {
  return `<div class="phone-wrap"><div class="phone"><div class="phone-notch"></div><p class="phone-brand">IDENTITY / DEMO</p><div class="status"><b class="status-dot"></b><span class="status-rejected">未通过</span><span class="status-ready">资料已修正</span></div><h2>核对身份信息</h2><label>姓名 · 与证件一致</label><div class="input"><span class="typed-name">${[..."CHEN LIN"].map((c) => `<span class="typed-letter">${c === " " ? "&nbsp;" : c}</span>`).join("")}</span><i class="cursor"></i></div><label>证件有效期</label><div class="date-field">2030 / 08 / 16<span>有效</span></div><div class="toggle-row"><span>使用证件原件</span><div class="toggle"><i></i></div></div><div class="phone-button">重新提交</div><p class="phone-footnote">演示姓名 · 非个人资料</p></div><p class="mock-note">示意画面，非真实界面</p></div>`;
}
export function checklist(items) {
  return `<div class="checklist">${items.map((item, i) => `<div class="check-row"><span class="check-number">0${i + 1}</span><span class="check-copy">${esc(item)}</span><span class="tick">✓</span></div>`).join("")}</div>`;
}
export function comparisonTable(params) {
  return `<div class="compare"><div class="compare-head"><span>× ${esc(params.columns[0])}</span><span>✓ ${esc(params.columns[1])}</span></div>${params.rows.map((row, i) => `<div class="compare-row"><div><span class="row-index">0${i + 1}</span><p>${esc(row[0])}</p><div class="id-drawing bad"><i></i><b></b><b></b></div></div><div><span class="row-index">0${i + 1}</span><p>${esc(row[1])}</p><div class="id-drawing good"><i></i><b></b><b></b></div></div></div>`).join("")}</div>`;
}
export function warningCard(params) {
  return `<div class="warning"><div class="warning-symbol">!</div><p class="eyebrow">IDENTITY IS PRIVATE</p><h2>${esc(params.text)}</h2><div class="private-message"><span>私信 “客服”</span><p>请发一下证件照片</p><b class="blocked">× 不发送</b></div><p class="warning-detail">${esc(params.detail)}</p></div>`;
}
export function flowDiagram(nodes) {
  return `<div class="flow"><div class="flow-line"><i class="moving-dot"></i></div>${nodes.map((n, i) => `<div class="flow-node"><b class="node-number">0${i + 1}</b><h2>${esc(n)}</h2><p>${["页面 / 注册邮箱", "对应问题 · 一次修正", "核对后 · 再提交"][i]}</p></div>`).join("")}</div>`;
}
export function definition(params) {
  return `<div class="definition"><div class="kyc-letters">${[..."KYC"].map((c) => `<span>${c}</span>`).join("")}</div><p class="definition-en">${esc(params.lines[0])}</p><h2>了解你的客户</h2><div class="definition-rule"></div><p>${esc(params.lines[1])}</p><p>${esc(params.lines[2])}</p><span class="source">来源：${esc(params.source)}</span></div>`;
}
export function endCard(params) {
  return `<div class="end-card">${checklist(params.items)}<div class="cta"><img class="qr" src="assets/qr.svg" alt="OKX official registration QR"><div><p class="eyebrow">准备好证件 · 前往官网</p><h2>OKX 官网注册</h2><p class="invite">邀请码 <b>nexu888</b></p><p class="cta-url">okx.com/join/nexu888</p></div></div><p class="disclosure">${esc(params.cta_card.disclosure)}</p><p class="next-lesson">下一关 → 先锁好账户</p></div>`;
}
export function illustration(scene, index) {
  const p = scene.visual.params;
  if (p.cta_card) return endCard(p);
  return {
    "phone-mock": phoneMock,
    definition: () => definition(p),
    checklist: () => checklist(p.items),
    "compare-table": () => comparisonTable(p),
    flow: () => flowDiagram(p.nodes),
    "warning-card": () => warningCard(p),
  }[scene.visual.type]();
}
export function captionBand(words, limit) {
  const groups = [];
  let current = [];
  let count = 0;
  for (const word of words) {
    if (current.length && count + [...word.text].length > limit) {
      groups.push(current);
      current = [];
      count = 0;
    }
    current.push(word);
    count += [...word.text].length;
    if (/[。！？]$/.test(word.text)) {
      groups.push(current);
      current = [];
      count = 0;
    }
  }
  if (current.length) groups.push(current);
  return {
    groups,
    html: `<div class="caption-band">${groups.map((group, i) => `<div class="caption-group" data-group="${i}">${group.map((word) => `<span>${esc(word.text)}</span>`).join("")}</div>`).join("")}</div>`,
  };
}
