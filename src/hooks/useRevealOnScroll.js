import { useEffect } from "react";

const defaultOptions = {
  threshold: 0.14,
  rootMargin: "0px 0px -8% 0px",
  once: true,
  revealClassName: "se-reveal--in",
};

export const useRevealOnScroll = (ref, options = {}) => {
  const threshold = options.threshold ?? defaultOptions.threshold;
  const rootMargin = options.rootMargin ?? defaultOptions.rootMargin;
  const once = options.once ?? defaultOptions.once;
  const revealClassName = options.revealClassName ?? defaultOptions.revealClassName;

  useEffect(() => {
    const el = ref?.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add(revealClassName);
      return undefined;
    }

    let io;
    const handleIntersect = (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;

      el.classList.add(revealClassName);
      if (once && io) io.disconnect();
    };

    io = new IntersectionObserver(handleIntersect, { threshold, rootMargin });
    io.observe(el);

    return () => {
      if (io) io.disconnect();
    };
  }, [ref, threshold, rootMargin, once, revealClassName]);
};
