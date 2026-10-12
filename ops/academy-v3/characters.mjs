import { readFile } from "node:fs/promises";

const MASCOT_DIR = new URL("../brand/mascot/svg/", import.meta.url);

const NEXUBO_POSES = {
  rest: "model-front.svg",
  point: "pose-point-right.svg",
  wave: "pose-wave-hello.svg",
  "hold-phone": "pose-hold-phone.svg",
  shield: "pose-hold-shield.svg",
  "thumbs-up": "pose-thumbs-up.svg",
  facepalm: "pose-facepalm.svg",
};

const NEXUBO_EXPRESSIONS = {
  neutral: "model-front.svg",
  happy: "expression-happy.svg",
  thinking: "expression-thinking.svg",
  careful: "expression-thinking.svg",
  surprised: "expression-surprised.svg",
  warning: "expression-warning.svg",
  worried: "expression-warning.svg",
  celebrating: "expression-celebrating.svg",
  confused: "expression-confused.svg",
};

const ANTENNA_COLORS = {
  blue: "#4f7cff",
  mint: "#3ddc97",
  green: "#3ddc97",
  amber: "#f8bb6a",
  yellow: "#f8bb6a",
  red: "#ed5969",
  warning: "#ed5969",
};

const SAM_EXPRESSIONS = new Set([
  "neutral",
  "happy",
  "confused",
  "worried",
  "surprised",
]);

const SAM_POSES = new Set(["rest", "point", "wave", "hold-phone"]);

let autoId = 0;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char];
  });

const cleanToken = (value, fallback) => {
  const raw = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return raw || fallback;
};

const instanceId = (id, label) => cleanToken(id || `${label}-${++autoId}`, label);

const resolveKey = (table, value, fallback) => {
  const key = cleanToken(value, fallback);
  return Object.hasOwn(table, key) ? key : fallback;
};

const readMascotSvg = async (file) => readFile(new URL(file, MASCOT_DIR), "utf8");

const findGroupEnd = (svg, start) => {
  const tagPattern = /<\/?g\b[^>]*>/g;
  tagPattern.lastIndex = start;
  let depth = 0;
  for (;;) {
    const match = tagPattern.exec(svg);
    if (!match) return -1;
    if (match[0].startsWith("</")) {
      depth -= 1;
      if (depth === 0) return tagPattern.lastIndex;
    } else if (!match[0].endsWith("/>")) {
      depth += 1;
    }
  }
};

const groupById = (svg, id) => {
  const start = svg.indexOf(`<g id="${id}"`);
  if (start < 0) throw new Error(`Missing SVG group: ${id}`);
  const end = findGroupEnd(svg, start);
  if (end < 0) throw new Error(`Unclosed SVG group: ${id}`);
  return svg.slice(start, end);
};

const replaceGroup = (svg, id, replacement) => {
  const start = svg.indexOf(`<g id="${id}"`);
  if (start < 0) throw new Error(`Missing SVG group: ${id}`);
  const end = findGroupEnd(svg, start);
  if (end < 0) throw new Error(`Unclosed SVG group: ${id}`);
  return `${svg.slice(0, start)}${replacement}${svg.slice(end)}`;
};

const withGroupClass = (svg, id, className) =>
  svg.replace(`<g id="${id}"`, `<g id="${id}" class="${className}"`);

const withNexuboRigClasses = (svg) => {
  let next = svg;
  next = withGroupClass(next, "character", "rig-character");
  next = withGroupClass(next, "body", "rig-body");
  next = withGroupClass(next, "eyes", "rig-eyes");
  next = withGroupClass(next, "mouth", "rig-mouth");
  next = withGroupClass(next, "arm-left", "rig-arm-left");
  next = withGroupClass(next, "arm-right", "rig-arm-right");
  next = withGroupClass(next, "antenna-light", "rig-antenna-light");
  next = withGroupClass(next, "coin", "rig-coin");
  next = withGroupClass(next, "props", "rig-props");
  next = withGroupClass(next, "effects", "rig-effects");
  return next;
};

const antennaColor = (value) => {
  if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim())) {
    return value.trim();
  }
  return ANTENNA_COLORS[cleanToken(value, "blue")] || ANTENNA_COLORS.blue;
};

const tintAntenna = (svg, color) =>
  replaceGroup(
    svg,
    "antenna-light",
    groupById(svg, "antenna-light").replace(/fill="#(?:4f7cff|3ddc97|f8bb6a|ed5969)"/gi, `fill="${color}"`),
  );

const namespaceSvg = (svg, prefix) => {
  const idMap = new Map();
  let next = svg.replace(/\bid="([^"]+)"/g, (_, id) => {
    const namespaced = `${prefix}-${id}`;
    idMap.set(id, namespaced);
    return `id="${namespaced}"`;
  });
  next = next.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${idMap.get(id) || `${prefix}-${id}`})`);
  next = next.replace(/\b(?:xlink:)?href="#([^"]+)"/g, (match, id) =>
    match.replace(`#${id}"`, `#${idMap.get(id) || `${prefix}-${id}`}"`),
  );
  next = next.replace(/\baria-labelledby="([^"]+)"/g, (_, refs) => {
    const scopedRefs = refs
      .split(/\s+/)
      .map((ref) => idMap.get(ref) || `${prefix}-${ref}`)
      .join(" ");
    return `aria-labelledby="${scopedRefs}"`;
  });
  return next;
};

const decorateRoot = (svg, attrs) =>
  svg.replace(
    "<svg ",
    `<svg class="${attrs.className}" data-character="${attrs.character}" data-rig="${attrs.rig}" data-pose="${attrs.pose}" data-expression="${attrs.expression}" `,
  );

const mergeNexuboExpression = (poseSvg, expressionSvg) => {
  let next = poseSvg;
  for (const group of ["antenna-light", "eyes", "mouth", "effects"]) {
    next = replaceGroup(next, group, groupById(expressionSvg, group));
  }
  return next;
};

export async function nexubo({
  id,
  pose = "point",
  expression = "happy",
  antenna = "blue",
} = {}) {
  const poseKey = resolveKey(NEXUBO_POSES, pose, "point");
  const expressionKey = resolveKey(NEXUBO_EXPRESSIONS, expression, "happy");
  const scopedId = instanceId(id, "nexubo");
  const [poseSvg, expressionSvg] = await Promise.all([
    readMascotSvg(NEXUBO_POSES[poseKey]),
    readMascotSvg(NEXUBO_EXPRESSIONS[expressionKey]),
  ]);

  let svg = mergeNexuboExpression(poseSvg, expressionSvg);
  svg = tintAntenna(svg, antennaColor(antenna));
  svg = withNexuboRigClasses(svg);
  svg = namespaceSvg(svg, scopedId);
  svg = decorateRoot(svg, {
    character: "nexubo",
    className: "academy-character academy-character-nexubo",
    expression: expressionKey,
    pose: poseKey,
    rig: "nexubo",
  });
  return svg;
}

const samEyes = (expression) => {
  if (expression === "happy") {
    return `<g id="eyes" class="rig-eyes" data-rig="eyes"><path d="M190 209 Q207 195 224 209" fill="none" stroke="#161922" stroke-width="9" stroke-linecap="round"/><path d="M288 209 Q306 195 323 209" fill="none" stroke="#161922" stroke-width="9" stroke-linecap="round"/><path d="M177 183 Q204 170 230 184 M282 184 Q309 171 335 184" fill="none" stroke="#263247" stroke-width="6" stroke-linecap="round"/></g>`;
  }
  if (expression === "confused") {
    return `<g id="eyes" class="rig-eyes" data-rig="eyes"><ellipse cx="208" cy="207" rx="17" ry="22" fill="#161922"/><ellipse cx="299" cy="205" rx="17" ry="22" fill="#161922"/><circle cx="202" cy="200" r="5" fill="#ffffff"/><circle cx="293" cy="198" r="5" fill="#ffffff"/><path d="M178 181 Q203 166 228 182 M285 176 L333 184" fill="none" stroke="#263247" stroke-width="6" stroke-linecap="round"/></g>`;
  }
  if (expression === "worried") {
    return `<g id="eyes" class="rig-eyes" data-rig="eyes"><ellipse cx="210" cy="211" rx="16" ry="20" fill="#161922"/><ellipse cx="301" cy="211" rx="16" ry="20" fill="#161922"/><circle cx="205" cy="204" r="5" fill="#ffffff"/><circle cx="296" cy="204" r="5" fill="#ffffff"/><path d="M178 184 Q203 171 228 188 M284 188 Q309 171 335 184" fill="none" stroke="#263247" stroke-width="6" stroke-linecap="round"/></g>`;
  }
  if (expression === "surprised") {
    return `<g id="eyes" class="rig-eyes" data-rig="eyes"><ellipse cx="209" cy="207" rx="20" ry="27" fill="#161922"/><ellipse cx="302" cy="207" rx="20" ry="27" fill="#161922"/><circle cx="201" cy="197" r="6" fill="#ffffff"/><circle cx="294" cy="197" r="6" fill="#ffffff"/><path d="M180 178 Q204 166 229 177 M283 177 Q309 166 334 178" fill="none" stroke="#263247" stroke-width="6" stroke-linecap="round"/></g>`;
  }
  return `<g id="eyes" class="rig-eyes" data-rig="eyes"><ellipse cx="209" cy="207" rx="17" ry="23" fill="#161922"/><ellipse cx="302" cy="207" rx="17" ry="23" fill="#161922"/><circle cx="203" cy="199" r="5" fill="#ffffff"/><circle cx="296" cy="199" r="5" fill="#ffffff"/><path d="M178 181 Q204 171 230 181 M282 181 Q309 171 335 181" fill="none" stroke="#263247" stroke-width="6" stroke-linecap="round"/></g>`;
};

const samMouth = (expression) => {
  if (expression === "happy") {
    return `<g id="mouth" class="rig-mouth" data-rig="mouth"><path d="M231 256 Q256 282 283 256" fill="none" stroke="#161922" stroke-width="8" stroke-linecap="round"/><path d="M248 270 Q256 266 265 270" fill="none" stroke="#ef6f6c" stroke-width="6" stroke-linecap="round"/></g>`;
  }
  if (expression === "confused") {
    return `<g id="mouth" class="rig-mouth" data-rig="mouth"><path d="M234 261 Q246 250 256 261 Q268 273 281 258" fill="none" stroke="#161922" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  if (expression === "worried") {
    return `<g id="mouth" class="rig-mouth" data-rig="mouth"><path d="M232 269 Q256 250 282 268" fill="none" stroke="#161922" stroke-width="7" stroke-linecap="round"/></g>`;
  }
  if (expression === "surprised") {
    return `<g id="mouth" class="rig-mouth" data-rig="mouth"><ellipse cx="257" cy="263" rx="13" ry="18" fill="#161922"/></g>`;
  }
  return `<g id="mouth" class="rig-mouth" data-rig="mouth"><path d="M236 260 Q256 272 278 258" fill="none" stroke="#161922" stroke-width="7" stroke-linecap="round"/></g>`;
};

const samLeftArm = (pose) => {
  if (pose === "wave") {
    return `<g id="arm-left" class="rig-arm-left" data-rig="arm-left"><path d="M160 278 Q123 255 110 213 L96 201 Q88 193 91 184 Q93 178 101 181 L103 164 Q105 153 114 158 L121 177 Q137 163 145 178 Q154 190 139 201 Q148 230 173 247" fill="#c89a72" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  return `<g id="arm-left" class="rig-arm-left" data-rig="arm-left"><path d="M160 278 Q127 284 112 316 Q101 339 117 349 Q132 357 144 330 L166 309" fill="#c89a72" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
};

const samRightArm = (pose) => {
  if (pose === "point") {
    return `<g id="arm-right" class="rig-arm-right" data-rig="arm-right"><path d="M352 278 Q389 260 421 263 L459 260 Q475 260 476 271 Q477 281 450 282 Q464 288 455 299 Q448 307 423 302 Q394 303 352 308" fill="#c89a72" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  if (pose === "hold-phone") {
    return `<g id="arm-right" class="rig-arm-right" data-rig="arm-right"><path d="M352 278 Q382 284 393 310 Q404 337 387 348 Q371 356 362 329 L345 309" fill="#c89a72" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  return `<g id="arm-right" class="rig-arm-right" data-rig="arm-right"><path d="M352 278 Q386 286 401 318 Q411 340 395 350 Q380 357 368 331 L346 309" fill="#c89a72" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
};

const samProps = (pose) => {
  if (pose !== "hold-phone") return `<g id="props" class="rig-props" data-rig="props"></g>`;
  return `<g id="props" class="rig-props" data-rig="props"><rect x="357" y="244" width="61" height="103" rx="13" fill="#161922" stroke="#ffffff" stroke-width="4"/><rect x="366" y="257" width="43" height="70" rx="6" fill="#eef3ff"/><path d="M375 293 L384 302 L400 280" fill="none" stroke="#4f7cff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="388" cy="337" r="4" fill="#ffffff"/></g>`;
};

const samSvg = ({ id, pose, expression }) => {
  const title = `Sam ${pose} ${expression}`;
  const desc = `Inclusive region-neutral adult learner chibi for NexuAlpha academy scenes.`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
<title id="title">${escapeHtml(title)}</title><desc id="desc">${escapeHtml(desc)}</desc>
<g id="shadow" opacity=".14"><ellipse cx="256" cy="452" rx="104" ry="13" fill="#0b0d10"/></g>
<g id="character" class="rig-character" data-rig="character">
<g id="legs" class="rig-legs" data-rig="legs"><path d="M202 388 L196 430 Q213 446 234 430 L235 391" fill="#31435f" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M282 391 L284 430 Q304 447 322 430 L311 388" fill="#31435f" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
<g id="body" class="rig-body" data-rig="body"><path d="M166 252 Q163 341 204 395 Q256 430 308 394 Q349 340 346 252 Z" fill="#eef3ff" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M180 293 Q256 328 333 292 L331 360 Q297 407 256 410 Q214 407 181 360 Z" fill="#4f7cff" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M222 316 H291" fill="none" stroke="#86a5ff" stroke-width="9" stroke-linecap="round"/></g>
${samLeftArm(pose)}
${samRightArm(pose)}
<g id="head" class="rig-head" data-rig="head"><path d="M156 201 C154 128 199 83 256 83 C314 83 359 129 357 201 C356 260 315 302 256 302 C197 302 157 260 156 201 Z" fill="#c89a72" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M160 181 C181 123 221 105 258 105 C299 105 333 126 351 181 C334 145 302 139 260 140 C218 141 185 147 160 181 Z" fill="#24324a" stroke="#161922" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M177 180 Q213 146 261 147 Q314 148 338 180" fill="none" stroke="#405171" stroke-width="12" stroke-linecap="round"/><ellipse cx="176" cy="229" rx="13" ry="18" fill="#c89a72" stroke="#161922" stroke-width="5"/><ellipse cx="336" cy="229" rx="13" ry="18" fill="#c89a72" stroke="#161922" stroke-width="5"/><ellipse cx="190" cy="248" rx="13" ry="7" fill="#ef8f82"/><ellipse cx="322" cy="248" rx="13" ry="7" fill="#ef8f82"/>${samEyes(expression)}${samMouth(expression)}</g>
${samProps(pose)}
<g id="effects" class="rig-effects" data-rig="effects">${expression === "confused" ? '<path d="M384 145 Q381 124 399 124 Q420 127 406 144 L398 153" fill="none" stroke="#f8bb6a" stroke-width="7" stroke-linecap="round"/><circle cx="396" cy="168" r="4" fill="#f8bb6a"/>' : ""}</g>
</g>
</svg>`;
  return namespaceSvg(
    decorateRoot(svg, {
      character: "sam",
      className: "academy-character academy-character-sam",
      expression,
      pose,
      rig: "sam",
    }),
    id,
  );
};

export async function sam({ id, pose = "rest", expression = "neutral" } = {}) {
  const poseKey = SAM_POSES.has(cleanToken(pose, "rest")) ? cleanToken(pose, "rest") : "rest";
  const expressionKey = SAM_EXPRESSIONS.has(cleanToken(expression, "neutral"))
    ? cleanToken(expression, "neutral")
    : "neutral";
  return samSvg({
    id: instanceId(id, "sam"),
    expression: expressionKey,
    pose: poseKey,
  });
}
