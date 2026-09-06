"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ImageSlot } from "./ImageSlot";
import { SaveBar } from "./SaveBar";
import { GalleryEditor } from "./GalleryEditor";
import { updateProject, type ProjectRow } from "@/app/(admin)/admin/_actions/projects";
import { ProjectData } from "@/lib/schemas";
import { CATEGORIES } from "@/lib/gallery";
import { slugify } from "@/lib/media";

const SIZES = [
  { value: "sm", label: "Small square" },
  { value: "wide", label: "Wide" },
  { value: "tall", label: "Tall" },
  { value: "lg", label: "Large" },
] as const;

export function ProjectEditor({ project }: { project: ProjectRow }) {
  const router = useRouter();
  const [slug, setSlug] = useState(project.slug);
  const [confirmSlug, setConfirmSlug] = useState(false);

  const form = useForm<ProjectData>({
    resolver: zodResolver(ProjectData),
    defaultValues: project.data,
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting, errors } = form.formState;
  const dirty = isDirty || slug !== project.slug;

  async function save(values: ProjectData) {
    const res = await updateProject(project.id, { slug, data: values });
    if (!res.ok) return toast.error(res.error, { duration: 10000 });
    toast.success("Saved.");
    form.reset(values);
    if (res.data.slug !== project.slug) router.replace(`/admin/projects/${project.id}`);
    router.refresh();
  }

  const onSubmit = form.handleSubmit(async (values) => {
    // A changed slug changes the project's public URL, so make it a decision
    // rather than a side effect of editing the title.
    if (slug !== project.slug) return setConfirmSlug(true);
    await save(values);
  });

  const categories = form.watch("categories");

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project name</Label>
            <Input id="title" maxLength={48} {...form.register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Web address</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/projects/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onBlur={(e) => setSlug(slugify(e.target.value))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Changing this breaks any existing link to the project.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" maxLength={48} {...form.register("location")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year completed</Label>
              <Input
                id="year"
                type="number"
                min={2000}
                max={2100}
                {...form.register("year", { valueAsNumber: true })}
              />
              {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tile size on the projects page</Label>
              <Select
                value={form.watch("size")}
                onValueChange={(v) =>
                  form.setValue("size", v as ProjectData["size"], { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={categories.includes(c)}
                    onCheckedChange={(on) =>
                      form.setValue(
                        "categories",
                        on
                          ? ([...categories, c] as ProjectData["categories"])
                          : (categories.filter((x) => x !== c) as ProjectData["categories"]),
                        { shouldDirty: true, shouldValidate: true },
                      )
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
            {errors.categories && (
              <p className="text-sm text-destructive">Choose at least one category.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Intro paragraph (optional)</Label>
            <Textarea id="summary" rows={4} maxLength={400} {...form.register("summary")} />
            <p className="text-xs text-muted-foreground">
              Leave empty and the site writes an opening line from the location and category, as it
              does now. {form.watch("summary")?.length ?? 0} / 400
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <ImageSlot
            label="Cover photo (the banner, and the tile on the projects page)"
            aspect="16 / 9"
            value={form.watch("cover")}
            onChange={(url) =>
              form.setValue("cover", url, { shouldDirty: true, shouldValidate: true })
            }
          />
          <div className="space-y-2">
            <Label htmlFor="pos">Cover crop position (optional)</Label>
            <Input id="pos" placeholder="center 60%" maxLength={24} {...form.register("pos")} />
          </div>

          <ImageSlot
            label="Feature photo (optional — beside the project details)"
            aspect="3 / 4"
            value={form.watch("feature") ?? ""}
            onChange={(url) => form.setValue("feature", url, { shouldDirty: true })}
          />
        </div>
      </div>

      <GalleryEditor
        value={form.watch("gallery")}
        onChange={(next) =>
          form.setValue("gallery", next, { shouldDirty: true, shouldValidate: true })
        }
      />

      <SaveBar
        dirty={dirty}
        valid={isValid}
        saving={isSubmitting}
        onDiscard={() => {
          form.reset(project.data);
          setSlug(project.slug);
        }}
      />

      <AlertDialog open={confirmSlug} onOpenChange={setConfirmSlug}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change this project’s web address?</AlertDialogTitle>
            <AlertDialogDescription>
              It moves from <code>/projects/{project.slug}</code> to <code>/projects/{slug}</code>.
              Any link or bookmark using the old address will stop working — there is no automatic
              forwarding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSlug(project.slug)}>Keep the old one</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmSlug(false);
                await save(form.getValues());
              }}
            >
              Change it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
