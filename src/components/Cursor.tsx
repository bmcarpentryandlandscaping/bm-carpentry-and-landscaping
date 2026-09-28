"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Subtle two-part custom cursor: a hard dot tracking the pointer in
 * real time and a softer trailing ring that lags via lerp. Ring scales
 * up over interactive elements (anything with `[data-cursor="hover"]`
 * or anchors/buttons).
 *
 * Nothing is RENDERED unless the device has a real pointer. Returning early
 * from the effect is not enough: the dot and ring would still be in the DOM,
 * just never moved, leaving them parked wherever CSS put them — which is what
 * put a stray ring in the middle of a phone screen. The `(hover: none)` rule in
 * globals.css hid that on most phones, but a browser in "Desktop site" mode
 * reports hover, and the parked ring came straight back.
 *
 * A real `touchstart` is treated as proof of a touch device and retires the
 * cursor for the session, whatever the media queries claim.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  // Starts false so the server renders nothing and a touch device never sees a
  // frame of it. A mouse gets the cursor a tick later, on hydration.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => setEnabled(pointer.matches && !reduced.matches);
    sync();

    // Plugging in or unplugging a mouse flips these, so follow them rather than
    // reading once at mount.
    pointer.addEventListener("change", sync);
    reduced.addEventListener("change", sync);

    // One real touch outranks every media query, including a phone lying about
    // hover in desktop mode.
    const onTouch = () => setEnabled(false);
    window.addEventListener("touchstart", onTouch, { passive: true, once: true });

    return () => {
      pointer.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      window.removeEventListener("touchstart", onTouch);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      }
    };

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(var(--ring-scale, 1))`;
      }
      raf = requestAnimationFrame(tick);
    };

    const enterInteractive = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('a, button, [data-cursor="hover"]')) {
        ringRef.current?.style.setProperty("--ring-scale", "1.8");
      }
    };
    const leaveInteractive = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('a, button, [data-cursor="hover"]')) {
        ringRef.current?.style.setProperty("--ring-scale", "1");
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", enterInteractive, true);
    document.addEventListener("pointerout", leaveInteractive, true);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", enterInteractive, true);
      document.removeEventListener("pointerout", leaveInteractive, true);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}
