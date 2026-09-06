"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMedia, renameMedia, setMediaAlt } from "@/app/(admin)/admin/_actions/media";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ACCEPT, uploadAll } from "@/lib/upload";
import type { MediaRow } from "@/lib/schemas";

type Props = {
  initial: MediaRow[];
  /** Where each URL appears on the site, from listMediaUsage(). Absent = unused. */
  usage: Record<string, string[]>;
};

export function MediaLibrary({ initial, usage }: Props) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<MediaRow | null>(null);
  // Without this the confirm button fires deleteMedia once per click — a
  // double tap on a phone sends two deletes, and the second comes back
  // "That file no longer exists." on a row the client just removed fine.
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  // The row currently being edited, and its values before the edit began.
  //
  // Two problems this solves, both only visible with a search active:
  //   1. Renaming a photo so it no longer matches the query would filter its own
  //      card out from under the client mid-typing — taking the focused input with
  //      it, so onBlur may never fire and the rename is silently lost. Mobile
  //      Safari is worst here, and a phone is this client's main device.
  //   2. A rejected rename left the bad value on screen with only a toast, so the
  //      client reads "saved" and finds the old name after a reload.
  const [editingId, setEditingId] = useState<string | null>(null);
  const before = useRef<{ name: string; alt: string } | null>(null);

  const beginEdit = (row: MediaRow) => {
    setEditingId(row.id);
    before.current = { name: row.name, alt: row.alt };
  };

  // A row stays visible while it is being edited, whatever the query now matches.
  const visible = rows.filter(
    (r) => r.id === editingId || r.name.toLowerCase().includes(query.toLowerCase()),
  );

  const patch = (id: string, next: Partial<MediaRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...next } : r)));

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;

    // Same contract as MediaPicker: uploadAll fires onFile(name, 100) TWICE on
    // success, so completion is `row` or `error`, never `pct === 100`. And a
    // failed file must clear its progress entry too, or its bar sticks at the
    // last percentage it reported for the rest of the session.
    const clear = (name: string) =>
      setProgress((p) => {
        const { [name]: _drop, ...rest } = p;
        return rest;
      });

    await uploadAll([...files], (name, pct, row, error) => {
      if (error) {
        toast.error(`${name}: ${error}`);
        clear(name);
        return;
      }
      if (row) {
        setRows((r) => [row, ...r]);
        clear(name);
        toast.success(`${row.name} uploaded`);
        return;
      }
      setProgress((p) => ({ ...p, [name]: pct }));
    });
  }

  async function confirmDelete() {
    if (!pending || deleting) return;
    setDeleting(true);
    try {
      const res = await deleteMedia(pending.id);
      if (!res.ok) toast.error(res.error, { duration: 10000 });
      else {
        setRows((r) => r.filter((x) => x.id !== pending.id));
        toast.success(pending.source === "repo" ? "Removed from your library" : "Deleted");
      }
      setPending(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-8 flex gap-2">
        <Input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
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

      <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((row) => (
          <div key={row.id} className="space-y-3">
            <div className="admin-plate" style={{ aspectRatio: "4 / 3" }}>
              {row.kind === "video" ? (
                <video src={row.url} muted />
              ) : (
                <img src={row.url} alt={row.alt || row.name} loading="lazy" />
              )}
              <UsedInBadge places={usage[row.url]} />
            </div>

            <Input
              value={row.name}
              onFocus={() => beginEdit(row)}
              onChange={(e) => patch(row.id, { name: e.target.value })}
              onBlur={async (e) => {
                const was = before.current?.name ?? row.name;
                const next = e.target.value;
                setEditingId(null);
                if (next === was) return;
                const res = await renameMedia(row.id, next);
                if (!res.ok) {
                  toast.error(res.error);
                  patch(row.id, { name: was }); // put the real value back on screen
                }
              }}
            />
            <Input
              placeholder="Description (alt text)"
              value={row.alt}
              maxLength={160}
              onFocus={() => beginEdit(row)}
              onChange={(e) => patch(row.id, { alt: e.target.value })}
              onBlur={async (e) => {
                const was = before.current?.alt ?? row.alt;
                const next = e.target.value;
                setEditingId(null);
                if (next === was) return;
                const res = await setMediaAlt(row.id, next);
                if (!res.ok) {
                  toast.error(res.error);
                  patch(row.id, { alt: was });
                }
              }}
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {row.source === "repo" ? "Built in" : "Uploaded"}
                {row.bytes ? ` · ${Math.round(row.bytes / 1024)}KB` : ""}
                {row.width && row.height ? ` · ${row.width}×${row.height}` : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={(usage[row.url]?.length ?? 0) > 0}
                title={
                  usage[row.url]?.length
                    ? "Take it off the pages listed above first."
                    : undefined
                }
                onClick={() => setPending(row)}
              >
                {row.source === "repo" ? "Remove" : "Delete"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.source === "repo" ? "Remove" : "Delete"} “{pending?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.source === "repo"
                ? "This removes the photo from your library. It ships with the site, so the file itself stays put and your developer can restore it."
                : "This cannot be undone."}{" "}
              If the photo is used anywhere on the site, the delete will be refused and you will be
              told where it is used.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                // Keep the dialog open while the action runs, so the client
                // sees "Removing…" rather than a dialog that vanishes and a
                // toast that arrives a second later.
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Removing…" : pending?.source === "repo" ? "Remove" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * The "where is this used" signal, as a badge on the photo itself rather
 * than a line of text competing with the name and alt fields below it.
 *
 * A quiet corner badge only appears when the photo IS in use — silence means
 * unused, the same "state is the exception, not the default" rule as
 * `.admin-pip`. Clicking it opens the list in a popover anchored to the
 * badge, so a nine-reference photo does not shove every card below it down
 * the page the way an inline expanding list did.
 */
function UsedInBadge({ places }: { places?: string[] }) {
  const n = places?.length ?? 0;
  if (n === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
          {n === 1 ? "Used in 1 place" : `Used in ${n} places`}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <p className="text-xs font-medium text-muted-foreground">Appears on</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {places!.map((place) => (
            <li key={place}>{place}</li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
