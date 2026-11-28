"use client";

import { useEffect, useRef } from "react";

export default function VayoCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) return;

    const root = document.documentElement;
    root.classList.add("vayo-custom-cursor-enabled");

    let frame = 0;
    let lastX = -100;
    let lastY = -100;

    const moveCursor = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const x = event.clientX;
      const y = event.clientY;
      const dx = x - lastX;
      const dy = y - lastY;
      const tilt = Math.max(-7, Math.min(7, dx * 0.12 + dy * 0.05));

      lastX = x;
      lastY = y;

      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${tilt}deg)`;
        cursor.classList.add("is-visible");
      });
    };

    const pressCursor = (event: PointerEvent) => {
      if (event.pointerType === "mouse") cursor.classList.add("is-pressed");
    };

    const releaseCursor = () => cursor.classList.remove("is-pressed");
    const hideCursor = () => {
      cursor.classList.remove("is-visible", "is-pressed");
    };

    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("pointerdown", pressCursor);
    window.addEventListener("pointerup", releaseCursor);
    window.addEventListener("blur", hideCursor);
    document.addEventListener("mouseleave", hideCursor);
    document.addEventListener("visibilitychange", hideCursor);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", moveCursor);
      window.removeEventListener("pointerdown", pressCursor);
      window.removeEventListener("pointerup", releaseCursor);
      window.removeEventListener("blur", hideCursor);
      document.removeEventListener("mouseleave", hideCursor);
      document.removeEventListener("visibilitychange", hideCursor);
      root.classList.remove("vayo-custom-cursor-enabled");
    };
  }, []);

  return (
    <div ref={cursorRef} className="vayo-custom-cursor" aria-hidden="true">
      <svg viewBox="0 0 40 40" focusable="false">
        <circle className="cursor-wheel-rim" cx="20" cy="20" r="16.2" />
        <circle className="cursor-wheel-inner-rim" cx="20" cy="20" r="12.7" />
        <path className="cursor-wheel-spokes" d="M20 18.8 20 5.8 M18.1 21 8.2 27.2 M21.9 21 31.8 27.2" />
        <circle className="cursor-wheel-hub" cx="20" cy="20" r="4.4" />
        <circle className="cursor-wheel-bolt" cx="20" cy="8.9" r="1.15" />
        <circle className="cursor-wheel-bolt" cx="10.5" cy="25.4" r="1.15" />
        <circle className="cursor-wheel-bolt" cx="29.5" cy="25.4" r="1.15" />
      </svg>
    </div>
  );
}
