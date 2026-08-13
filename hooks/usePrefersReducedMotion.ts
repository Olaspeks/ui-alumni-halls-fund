"use client";

import { useEffect, useState } from "react";

/**
 * JS-visible version of the `prefers-reduced-motion` media query.
 *
 * Most of this app's motion is plain CSS (transitions/keyframes), which
 * already respects the media query natively — no JS needed. This hook
 * exists only for the handful of cases CSS can't reach: SVG SMIL
 * animations (<animateTransform>, <animate>), which have no equivalent
 * "disable under this media query" mechanism, so the elements have to
 * not be rendered at all. See BarometerTube's gradient-flow and bubbles.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
