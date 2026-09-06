"use client";

import { useState } from "react";
import type { Disciplines } from "@/lib/schemas";

export function WhatWeDo({ items }: { items: Disciplines["items"] }) {
  const [active, setActive] = useState(0);

  return (
    <section className="surface-deep">
      <div className="mx-auto grid max-w-[1600px] gap-px md:grid-cols-2">
        {/* LEFT — copy + practice list */}
        <div className="flex flex-col justify-between gap-12 px-6 py-16 md:px-12 md:py-20 lg:px-16">
          <div>
            <p className="eyebrow opacity-60">What we do</p>
            {/* All four blurbs stacked in one grid cell: the box is always as
                tall as the longest one, so switching practice can't reflow the
                list below it and bounce the row out from under the cursor. */}
            <div className="mt-7 grid max-w-md">
              {items.map((p, i) => (
                <p
                  key={p.label}
                  aria-hidden={i !== active}
                  className={`col-start-1 row-start-1 text-lg leading-relaxed md:text-xl ${
                    i === active ? "wwd-row opacity-90" : "opacity-0"
                  }`}
                >
                  {p.blurb}
                </p>
              ))}
            </div>
          </div>

          <ul className="flex flex-col">
            {items.map((p, i) => {
              const on = i === active;
              return (
                <li key={p.label} className="border-t border-current/15 last:border-b">
                  <button
                    type="button"
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={on}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left md:py-6"
                  >
                    <span
                      className={`font-display text-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:text-3xl ${
                        on ? "translate-x-2 opacity-100" : "opacity-55"
                      }`}
                    >
                      {p.label}
                    </span>
                    <span
                      aria-hidden
                      className={`text-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        on ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-30"
                      }`}
                    >
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* RIGHT — crossfading showcase */}
        <div className="relative min-h-[58svh] overflow-hidden md:min-h-full bg-black">
          {items.map((p, i) => {
            const isVideo = p.img.endsWith(".mp4");
            const activeClass = i === active 
              ? "scale-100 opacity-100 pointer-events-auto" 
              : "scale-105 opacity-0 pointer-events-none";
            return isVideo ? (
              <video
                key={p.label}
                src={p.img}
                autoPlay
                loop
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${activeClass}`}
                aria-label={p.alt}
              />
            ) : (
              <img
                key={p.label}
                src={p.img}
                alt={p.alt}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${activeClass}`}
              />
            );
          })}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
      </div>
    </section>
  );
}
