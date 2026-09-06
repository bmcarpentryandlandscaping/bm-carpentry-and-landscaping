"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, projectSlug, type GalleryItem, type GallerySize } from "@/lib/gallery";

const FILTERS = ["All", ...CATEGORIES] as const;

// Column masonry: equal column widths, height varies by aspect ratio.
const ASPECT: Record<GallerySize, string> = {
  wide: "aspect-[3/2]",
  sm: "aspect-[4/3]",
  tall: "aspect-[4/5]",
  lg: "aspect-[3/4]",
};

export function ProjectGallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<(typeof FILTERS)[number]>("All");

  const filtered = useMemo(
    () => (active === "All" ? items : items.filter((g) => g.categories.includes(active))),
    [active, items],
  );

  // Per-filter counts — a quiet superscript that gives each chip a little weight.
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    map.set("All", items.length);
    for (const c of CATEGORIES) {
      map.set(c, items.filter((g) => g.categories.includes(c)).length);
    }
    return map;
  }, [items]);

  return (
    <>
      {/* Filter bar */}
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <div className="flex flex-wrap items-baseline gap-x-7 gap-y-3 border-b border-border pb-5">
          {FILTERS.map((f) => {
            const isActive = f === active;
            return (
              <button
                key={f}
                onClick={() => setActive(f)}
                aria-pressed={isActive}
                className={`filter-chip font-display text-[0.95rem] tracking-[-0.01em] transition-colors duration-300 ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            );
          })}
          <span className="eyebrow ml-auto self-center text-muted-foreground tabular-nums">
            {String(filtered.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Masonry — equal breathing room top and bottom */}
      <div className="mx-auto max-w-[1600px] px-6 py-10 md:px-12 md:py-14">
        <div key={active} className="columns-2 gap-3 sm:columns-3 md:gap-4">
          {filtered.map((item, i) => (
            <Link
              key={item.id}
              href={`/projects/${projectSlug(item)}`}
              aria-label={`${item.title}, ${item.location}`}
              style={{ ["--d" as string]: `${Math.min(i, 14) * 45}ms` }}
              className={`gallery-tile gallery-enter group relative mb-3 block w-full break-inside-avoid overflow-hidden bg-muted md:mb-4 ${ASPECT[item.size]}`}
            >
              <img
                src={item.img}
                alt={item.title}
                loading={i < 4 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                style={{ objectPosition: item.pos }}
              />
              {/* Hover cue: soft bottom gradient + caption slide-up */}
              <div className="gallery-scrim pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div
                className="gallery-cap pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5"
                style={{ color: "var(--surface-deep-foreground)" }}
              >
                <h2 className="font-display text-lg font-[400] leading-[1.05] tracking-[-0.025em] md:text-xl">
                  {item.title}
                </h2>
                <p className="eyebrow mt-1 truncate opacity-80">{item.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
