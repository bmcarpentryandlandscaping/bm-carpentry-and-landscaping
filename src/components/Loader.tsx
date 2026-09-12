"use client";

import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";

export function Loader() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2750);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className="loader-curtain fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "var(--surface-deep)", color: "var(--surface-deep-foreground)" }}
    >
      {/* The full lockup, not the masked monogram: it already carries the
          wordmark, so the tagline line underneath it was saying it twice. */}
      <img
        src="/logos/BMCL_LOGO_WHITE_ORANGE.png"
        alt={brand.fullName}
        width={1500}
        height={895}
        className="brand-logo-reveal h-auto w-[min(62vw,320px)]"
      />
    </div>
  );
}
