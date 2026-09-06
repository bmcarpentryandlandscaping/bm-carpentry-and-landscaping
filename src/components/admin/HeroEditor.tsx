"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageSlot } from "./ImageSlot";
import { SaveBar } from "./SaveBar";
import { saveContent } from "@/app/(admin)/admin/_actions/content";
import { Hero } from "@/lib/schemas";

export function HeroEditor({ initial }: { initial: Hero }) {
  const form = useForm<Hero>({
    resolver: zodResolver(Hero),
    defaultValues: initial,
    mode: "onChange",
  });

  const kind = form.watch("kind");
  const src = form.watch("src");
  const poster = form.watch("poster");
  const { isDirty, isValid, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await saveContent("home.hero", values);
    if (!res.ok) return toast.error(res.error);
    toast.success("Hero updated — reload the homepage to see it.");
    form.reset(values); // clears dirty without a refetch
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={kind}
          onValueChange={(v) => form.setValue("kind", v as Hero["kind"], { shouldDirty: true })}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Photo</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Video plays muted and loops. Keep it under 25MB — it loads before anything else on the
          page.
        </p>
      </div>

      <ImageSlot
        label={kind === "video" ? "Hero video" : "Hero photo"}
        kind={kind === "video" ? "video" : "image"}
        value={src}
        alt={form.watch("alt")}
        aspect="16 / 9"
        onChange={(url, row) => {
          form.setValue("src", url, { shouldDirty: true, shouldValidate: true });
          if (row.alt) form.setValue("alt", row.alt, { shouldDirty: true });
        }}
        onAltChange={(alt) => form.setValue("alt", alt, { shouldDirty: true, shouldValidate: true })}
      />

      {kind === "video" && (
        <ImageSlot
          label="Poster image (shown while the video loads)"
          value={poster ?? ""}
          aspect="16 / 9"
          onChange={(url) => form.setValue("poster", url, { shouldDirty: true })}
        />
      )}

      {form.formState.errors.alt && (
        <p className="text-sm text-destructive">{form.formState.errors.alt.message}</p>
      )}

      <SaveBar
        dirty={isDirty}
        valid={isValid}
        saving={isSubmitting}
        onDiscard={() => form.reset(initial)}
      />
    </form>
  );
}
