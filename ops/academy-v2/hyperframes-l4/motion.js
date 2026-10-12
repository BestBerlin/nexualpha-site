const tl = gsap.timeline({ paused: true });
const enter = (selector, vars, time) =>
  tl.from(selector, { ...vars, immediateRender: false }, time);
tl.to(".ambient", { x: 75, y: 35, duration: TOTAL, ease: "none" }, 0);
tl.to(
  ".depth-ring",
  { x: -40, y: 65, scale: 1.07, duration: TOTAL, ease: "sine.inOut" },
  0,
);
enter(
  ".logo-build .brand-logo",
  { scale: 0.45, rotation: -35, duration: 0.65, ease: "back.out(1.25)" },
  0.12,
);
enter(
  ".logo-orbit",
  { scale: 1.25, rotation: 140, opacity: 0, duration: 0.7, ease: "expo.out" },
  0.2,
);
enter(
  ".intro .eyebrow",
  { x: 45, opacity: 0, duration: 0.5, ease: "power3.out" },
  0.32,
);
enter(
  ".intro h1",
  { y: 60, opacity: 0, duration: 0.65, ease: "expo.out" },
  0.48,
);
enter(
  ".intro-topic",
  { y: 25, opacity: 0, duration: 0.55, ease: "power2.out" },
  0.7,
);
tl.from(".progress-bar", { scaleX: 0, duration: TOTAL, ease: "none" }, 0);
function shutter(time) {
  tl.set(".shutter", { transformOrigin: "left" }, time - 0.2);
  tl.to(
    ".shutter",
    { scaleX: 1, duration: 0.2, ease: "power3.in" },
    time - 0.2,
  );
  tl.set(".shutter", { transformOrigin: "right" }, time);
  tl.to(".shutter", { scaleX: 0, duration: 0.2, ease: "power3.out" }, time);
}
SCENES.forEach((scene, i) => {
  const prefix = `#scene-${i + 1}`;
  const t = scene.start;
  const d = scene.duration;
  shutter(t);
  tl.set(i === 0 ? "#intro" : `#scene-${i}`, { opacity: 0 }, t);
  tl.set(prefix, { opacity: 1 }, t);
  enter(
    `${prefix} .eyebrow`,
    { x: 35, opacity: 0, duration: 0.45, ease: "power3.out" },
    t + 0.12,
  );
  enter(
    `${prefix} h1`,
    { y: 55, opacity: 0, duration: 0.6, ease: "expo.out" },
    t + 0.2,
  );
  enter(
    `${prefix} .deck`,
    { x: 30, opacity: 0, duration: 0.5, ease: "power2.out" },
    t + 0.34,
  );
  enter(
    `${prefix} .chapter-rule`,
    { scaleX: 0, duration: 0.5, ease: "expo.out", transformOrigin: "left" },
    t + 0.45,
  );
  enter(
    `${prefix} .lesson-label`,
    { y: 15, opacity: 0, duration: 0.45, ease: "power3.out" },
    t + 0.5,
  );
  enter(
    `${prefix} .visual`,
    { y: 48, scale: 0.96, opacity: 0, duration: 0.65, ease: "back.out(1.1)" },
    t + 0.28,
  );
  const rows = document.querySelectorAll(prefix + " .check-row");
  rows.forEach((row, j) => {
    const beat = t + 1 + j * Math.min(1.2, (d - 2) / Math.max(rows.length, 1));
    enter(row, { x: 35, opacity: 0, duration: 0.5, ease: "power3.out" }, beat);
    enter(
      row.querySelector(".tick"),
      { scale: 0, rotation: -30, duration: 0.45, ease: "back.out(1.5)" },
      beat + 0.35,
    );
  });
  if (i === 0) {
    tl.to(
      `${prefix} .input`,
      { borderColor: "#4f7cff", duration: 0.3 },
      t + d * 0.18,
    );
    document
      .querySelectorAll(prefix + " .typed-letter")
      .forEach((letter, j) =>
        tl.set(letter, { opacity: 1 }, t + d * 0.23 + j * 0.13),
      );
    tl.to(
      `${prefix} .toggle`,
      { backgroundColor: "#3ddc97", duration: 0.3 },
      t + d * 0.43,
    );
    tl.to(
      `${prefix} .toggle i`,
      { x: 28, duration: 0.35, ease: "back.out(1.3)" },
      t + d * 0.43,
    );
    tl.to(
      `${prefix} .status-rejected`,
      { opacity: 0, duration: 0.15 },
      t + d * 0.58,
    );
    tl.to(
      `${prefix} .status-ready`,
      { opacity: 1, duration: 0.15 },
      t + d * 0.58,
    );
    tl.to(
      `${prefix} .status`,
      { color: "#3ddc97", duration: 0.2 },
      t + d * 0.58,
    );
    tl.to(
      `${prefix} .status-dot`,
      { backgroundColor: "#3ddc97", duration: 0.2 },
      t + d * 0.58,
    );
    tl.to(
      `${prefix} .phone-button`,
      { scale: 0.96, duration: 0.15, repeat: 1, yoyo: true },
      t + d * 0.72,
    );
  }
  document
    .querySelectorAll(prefix + " .kyc-letters span")
    .forEach((letter, j) =>
      enter(
        letter,
        { y: 80, rotation: 4, opacity: 0, duration: 0.6, ease: "expo.out" },
        t + 0.7 + j * 0.15,
      ),
    );
  document
    .querySelectorAll(prefix + " .compare-row")
    .forEach((row, j) =>
      enter(
        row,
        { y: 30, opacity: 0, duration: 0.55, ease: "power3.out" },
        t + 1 + j * 0.8,
      ),
    );
  const nodes = document.querySelectorAll(prefix + " .flow-node");
  nodes.forEach((node, j) =>
    enter(
      node,
      { x: 40, opacity: 0, duration: 0.55, ease: "expo.out" },
      t + 0.8 + j * 0.8,
    ),
  );
  if (nodes.length)
    tl.to(
      `${prefix} .moving-dot`,
      {
        y: document.querySelector(prefix + " .flow-line").clientHeight - 14,
        duration: d - 2,
        ease: "power1.inOut",
      },
      t + 1.2,
    );
  if (i === 6) {
    enter(
      `${prefix} .blocked`,
      {
        scale: 0.8,
        rotation: -4,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.4)",
      },
      t + d * 0.4,
    );
  }
  if (i === 7) {
    enter(
      `${prefix} .cta`,
      { y: 30, opacity: 0, duration: 0.6, ease: "expo.out" },
      t + 2,
    );
    enter(
      `${prefix} .next-lesson`,
      { x: 30, opacity: 0, duration: 0.5, ease: "power3.out" },
      t + 2.4,
    );
  }
  const groups = document.querySelectorAll(prefix + " .caption-group");
  scene.captions.forEach((words, j) => {
    const group = groups[j];
    const begin = t + words[0].start;
    const end = t + words.at(-1).end;
    tl.set(group, { opacity: 1 }, begin);
    words.forEach((word, k) => {
      tl.set(
        group.children[k],
        { color: "#eef2f9", backgroundColor: "#4f7cff" },
        t + word.start,
      );
      tl.set(
        group.children[k],
        { color: "#eef2f9", backgroundColor: "transparent" },
        t + word.end,
      );
    });
    tl.set(group, { opacity: 0 }, end);
  });
});
window.__timelines = { academy: tl };
// Local review only; capture engine retains control when there is no ?at= parameter.
const reviewTime = new URLSearchParams(location.search).get("at");
if (reviewTime !== null && Number.isFinite(Number(reviewTime)))
  tl.seek(Number(reviewTime));
