/**
 * useStaggerReveal — 轻量 IntersectionObserver hook
 * 当目标元素进入视口时，为其父容器添加 "is-revealed" 类名，
 * 配合 .nxa-stagger CSS 实现 stagger 入场动效。
 *
 * @param {React.RefObject} ref  — 要观察的容器 ref
 * @param {object} options
 * @param {number} options.threshold — 触发阈值（0–1），默认 0.08
 * @param {boolean} options.once    — 是否只触发一次，默认 true
 * @param {string} options.className — 注入的类名，默认 "is-revealed"
 */
import { useEffect } from "react";
import { prefersReducedMotionNow, whenReached } from "../lib/revealGuard.js";

export function useStaggerReveal(ref, options = {}) {
  const {
    threshold = 0.08,
    once = true,
    className = "is-revealed",
  } = options;

  useEffect(() => {
    const el = ref?.current;
    if (!el || typeof IntersectionObserver === "undefined" || prefersReducedMotionNow() || (once && el.getBoundingClientRect().top < window.innerHeight * 0.92)) {
      // SSR / 不支持 IO / 减少动态 / 已在首屏：直接显示（children are only hidden while the container carries .is-armed）
      if (el) el.classList.add(className);
      return;
    }
    el.classList.add("is-armed");
    let stop = () => {};
    if (once) stop = whenReached(el, () => { el.classList.add(className); observer.disconnect(); });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(className);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove(className);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => { observer.disconnect(); stop(); };
  }, [ref, threshold, once, className]);
}
