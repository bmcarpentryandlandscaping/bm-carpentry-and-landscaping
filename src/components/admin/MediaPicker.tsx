"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listMedia } from "@/app/(admin)/admin/_actions/media";
import { ACCEPT, uploadAll } from "@/lib/upload";
import type { MediaRow } from "@/lib/schemas";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (row: MediaRow) => void;
  /** Restrict the grid — the hero accepts both, every other slot is images only. */
  kind?: "image" | "video" | "both";
};

export function MediaPicker({ open, onOpenChange, onSelect, kind = "image" }: Props) {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, startLoading] = useTransition();

  // Each keystroke fires its own listMedia call, and a slower earlier request can
  // resolve after a faster later one — repainting the grid with results for a query
  // the client has already moved on from. A sequence token drops stale responses.
  const seq = useRef(0);

  const refresh = (q: string) => {
    const mine = ++seq.current;
    startLoading(async () => {
      const res = await listMedia(q);
      if (mine !== seq.current) return; // superseded by a newer search
      if (res.ok) setRows(res.data);
      else toast.error(res.error);
    });
  };

  useEffect(() => {
    if (open) refresh(query);
    // Refresh whenever the dialog opens or the search changes.
  }, [open, query]);

  const visible = rows.filter((r) => kind === "both" || r.kind === kind);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;

    // Completion is `row` or `error` — never `pct === 100`, which fires twice.
    const clear = (name: string) =>
      setProgress((p) => {
        const { [name]: _drop, ...rest } = p;
        return rest;
      });

    await uploadAll([...files], (name, pct, row, error) => {
      if (error) {
        toast.error(`${name}: ${error}`);
        clear(name); // otherwise the failed file's bar sticks at its last % forever
        return;
      }
      if (row) {
        setRows((r) => [row, ...r]);
        clear(name);
        return;
      }
      setProgress((p) => ({ ...p, [name]: pct }));
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose a {kind === "video" ? "video" : "photo"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button asChild variant="secondary">
            <label className="cursor-pointer">
              Upload
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="sr-only"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
          </Button>
        </div>

        {Object.entries(progress).map(([name, pct]) => (
          <p key={name} className="text-xs text-muted-foreground">
            {name} — {pct}%
          </p>
        ))}

        <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
          {loading && visible.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">Loading…</p>
          )}
          {!loading && visible.length === 0 && (
            <p className="col-span-full py-8 text-sm text-muted-foreground">
              {query
                ? `No photo called “${query}”. Try part of the name, or upload a new one.`
                : "Nothing here yet. Upload a photo to get started."}
            </p>
          )}
          {visible.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                onSelect(row);
                onOpenChange(false);
              }}
              className="group block w-full text-left"
            >
              {/*
                The aspect box has to be a CHILD of the grid item, not the grid
                item itself. A grid item's own aspect-ratio does not feed row
                track sizing, so `aspect-square` on this <button> collapsed every
                row to ~24px and the tiles overlapped — every row but the last
                rendered as a thin strip. Measured: tracks 24px, tiles 110px.
              */}
              <div className="admin-plate aspect-square transition-transform duration-200 ease-(--ease-out-quart) group-hover:-translate-y-0.5">
                {row.kind === "video" ? (
                  <video src={row.url} muted className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={row.url}
                    alt={row.alt || row.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
                {/* The caption sits on a gradient rather than a solid bar —
                    a hard black band across every tile reads as chrome and
                    fights the photos, which are the thing being chosen. */}
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5 text-[11px] text-white">
                  {row.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
