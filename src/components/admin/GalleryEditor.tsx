"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "./MediaPicker";

/**
 * Ordered list of gallery images. Empty means the site generates five
 * category-matched shots, exactly as it does today — which is why an empty
 * gallery is a valid state and not an error.
 */
export function GalleryEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Gallery ({value.length}/24)</Label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={value.length >= 24}
          onClick={() => setAdding(true)}
        >
          Add photo
        </Button>
      </div>

      {value.length === 0 && (
        <p className="rounded border border-dashed border-border p-4 text-sm text-muted-foreground">
          No photos chosen — the site will pick five that match this project’s category, as it does
          now. Add photos here to choose them yourself.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-3">
        {value.map((url, i) => (
          <li key={`${url}-${i}`} className="space-y-1">
            <div className="aspect-[4/3] overflow-hidden rounded border border-border bg-muted">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-1">
              <span className="flex-1 text-xs text-muted-foreground">{i + 1}</span>
              <Button type="button" variant="ghost" size="sm" aria-label="Move left" onClick={() => move(i, i - 1)}>
                ←
              </Button>
              <Button type="button" variant="ghost" size="sm" aria-label="Move right" onClick={() => move(i, i + 1)}>
                →
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Remove"
                onClick={() => onChange(value.filter((_, k) => k !== i))}
              >
                ✕
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <MediaPicker
        open={adding}
        onOpenChange={setAdding}
        onSelect={(row) => onChange([...value, row.url])}
      />
    </div>
  );
}
