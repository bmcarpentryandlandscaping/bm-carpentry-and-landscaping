"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import {
  createProject,
  deleteProject,
  moveProject,
  setPublished,
  type ProjectRow,
} from "@/app/(admin)/admin/_actions/projects";

export function ProjectList({ initial }: { initial: ProjectRow[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState<ProjectRow | null>(null);
  const [busy, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "That did not work.", { duration: 10000 });
      else {
        if (success) toast.success(success);
        router.refresh();
      }
    });

  return (
    <>
      <div className="mb-8 flex gap-2">
        <Input
          placeholder="New project name…"
          value={title}
          maxLength={48}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button
          disabled={!title.trim() || busy}
          onClick={() =>
            startTransition(async () => {
              const res = await createProject(title);
              // Braces, not `return toast.error(...)`: startTransition's callback
              // must resolve to void, and toast.error returns an id — a bare
              // `return` of it is a hard tsc error (TS2345).
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              setTitle("");
              router.push(`/admin/projects/${res.data.id}`);
            })
          }
        >
          Add project
        </Button>
      </div>

      <ul className="border-t border-border">
        {initial.map((p, i) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-4 border-b border-border py-4 sm:flex-nowrap sm:gap-5"
          >
            {/* The cover at 4:3 — the ratio it renders at on the projects
                index — so the list previews the real crop, not a letterbox. */}
            <div className="admin-plate w-24 shrink-0" style={{ aspectRatio: "4 / 3" }}>
              {p.data.cover ? <img src={p.data.cover} alt="" /> : null}
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/projects/${p.id}`}
                className="font-display text-lg underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
              >
                {p.data.title}
              </Link>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {p.data.location} · {p.data.year} · /{p.slug}
              </p>
            </div>

            {/* Control cluster: own line at phone width, inline again from sm: up. */}
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
              <span className="admin-pip gap-2.5" data-live={p.published}>
                {p.published ? "On the site" : "Hidden"}
                <Switch
                  checked={p.published}
                  disabled={busy}
                  aria-label={p.published ? "Unpublish" : "Publish"}
                  onCheckedChange={(v) => run(() => setPublished(p.id, v))}
                />
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Move up"
                  disabled={i === 0 || busy}
                  onClick={() => run(() => moveProject(p.id, "up"))}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Move down"
                  disabled={i === initial.length - 1 || busy}
                  onClick={() => run(() => moveProject(p.id, "down"))}
                >
                  ↓
                </Button>
                <Button variant="ghost" className="h-10" disabled={busy} onClick={() => setPending(p)}>
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pending?.data.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The project page and everything on it goes away for good. Anyone who has bookmarked or
              linked to it will get a “page not found”. If you only want it off the site for now,
              switch it to Hidden instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = pending!;
                setPending(null);
                run(() => deleteProject(target.id), "Project deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
