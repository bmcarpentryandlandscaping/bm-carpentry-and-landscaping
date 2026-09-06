"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageSlot } from "./ImageSlot";
import { SaveBar } from "./SaveBar";
import { SlotList } from "./SlotList";
import { saveContent } from "@/app/(admin)/admin/_actions/content";
import type { GallerySize } from "@/lib/gallery";
import { Mosaic } from "@/lib/schemas";

/**
 * Mirrors `WORK_SIZES` in `src/app/(site)/page.tsx`, element for element.
 *
 * Typed as `GallerySize` (a type-only import, erased at runtime — it does NOT pull
 * the gallery data into the client bundle) so a typo is a compile error rather
 * than a silently wrong crop preview. The earlier version spelled these
 * "small"/"large" against the page's "sm"/"lg", which typechecked as plain
 * strings and would have diverged unnoticed.
 *
 * Display only: the client cannot change tile sizes. The ten sizes tile a perfect
 * rectangle with no gaps on both the 2-column and 4-column grids, verified by
 * hand. If `WORK_SIZES` is ever reordered, reorder this to match.
 */
const SIZES: GallerySize[] = ["sm", "tall", "lg", "wide", "tall", "sm", "tall", "lg", "lg", "wide"];

/** Friendly names for the slot labels; the client should not read "lg". */
const SIZE_LABEL: Record<GallerySize, string> = {
  sm: "small",
  wide: "wide",
  tall: "tall",
  lg: "large",
};

export function MosaicEditor({
  initial,
  projects,
}: {
  initial: Mosaic;
  projects: { slug: string; title: string }[];
}) {
  const form = useForm<Mosaic>({
    resolver: zodResolver(Mosaic),
    defaultValues: initial,
    mode: "onChange",
  });
  const { fields, move } = useFieldArray({ control: form.control, name: "tiles" });
  const { isDirty, isValid, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const missing = values.tiles
      .map((t, i) => (projects.some((p) => p.slug === t.slug) ? null : i + 1))
      .filter(Boolean);
    if (missing.length) {
      return toast.error(
        `Tile${missing.length > 1 ? "s" : ""} ${missing.join(", ")} point at a project that is not published.`,
      );
    }
    const res = await saveContent("home.mosaic", values);
    if (!res.ok) return toast.error(res.error);
    toast.success("Featured projects updated.");
    form.reset(values);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Ten tiles. Their sizes are fixed — the grid is hand-packed so there are no gaps — but you can
        change which project each one links to, its photo, and how the photo is cropped.
      </p>

      <SlotList
        items={fields}
        label={(i) => `Tile ${String(i + 1).padStart(2, "0")} · ${SIZE_LABEL[SIZES[i]]}`}
        onReorder={move}
        renderItem={(_, i) => (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Links to</Label>
                <Select
                  value={form.watch(`tiles.${i}.slug`)}
                  onValueChange={(v) =>
                    form.setValue(`tiles.${i}.slug`, v, { shouldDirty: true, shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`pos-${i}`}>Crop position (optional)</Label>
                <Input
                  id={`pos-${i}`}
                  placeholder="center 60%"
                  maxLength={24}
                  {...form.register(`tiles.${i}.pos`)}
                />
                <p className="text-xs text-muted-foreground">
                  Moves the visible part of the photo. “center 60%” shows more of the lower half.
                </p>
              </div>
            </div>

            <ImageSlot
              label="Photo"
              aspect={SIZES[i] === "tall" ? "1 / 2" : SIZES[i] === "wide" ? "2 / 1" : "1 / 1"}
              value={form.watch(`tiles.${i}.img`)}
              onChange={(url) =>
                form.setValue(`tiles.${i}.img`, url, { shouldDirty: true, shouldValidate: true })
              }
            />
          </div>
        )}
      />

      <SaveBar
        dirty={isDirty}
        valid={isValid}
        saving={isSubmitting}
        onDiscard={() => form.reset(initial)}
      />
    </form>
  );
}
