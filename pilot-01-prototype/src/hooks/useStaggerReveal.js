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

export function useStaggerReveal(ref, options = {}) {
  const {
    threshold = 0.08,
    once = true,
    className = "is-revealed",
  } = options;

  useEffect(() => {
    const el = ref?.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // SSR / 不支持 IO 的环境直接显示
      if (el) el.classList.add(className);
      return;
    }

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
    return () => observer.disconnect();
  }, [ref, threshold, once, className]);
}
