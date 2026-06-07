"use client";

import { useEffect } from "react";

export default function HalftoneScroll() {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (motionQuery.matches) {
      return;
    }

    let animationFrame = 0;

    function updateHalftoneOffset() {
      const offset = Math.round(window.scrollY * 0.08);
      document.documentElement.style.setProperty(
        "--halftone-offset",
        `${offset}px`,
      );
      animationFrame = 0;
    }

    function handleScroll() {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(updateHalftoneOffset);
    }

    updateHalftoneOffset();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      document.documentElement.style.removeProperty("--halftone-offset");
    };
  }, []);

  return null;
}
