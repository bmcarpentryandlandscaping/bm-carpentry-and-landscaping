"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageSlot } from "./ImageSlot";
import { SaveBar } from "./SaveBar";
import { SlotList } from "./SlotList";
import { saveContent } from "@/app/(admin)/admin/_actions/content";
import { Disciplines } from "@/lib/schemas";

export function DisciplinesEditor({ initial }: { initial: Disciplines }) {
  const form = useForm<Disciplines>({
    resolver: zodResolver(Disciplines),
    defaultValues: initial,
    mode: "onChange",
  });
  const { fields, move } = useFieldArray({ control: form.control, name: "items" });
  const { isDirty, isValid, isSubmitting, errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await saveContent("disciplines", values);
    if (!res.ok) return toast.error(res.error);
    toast.success("Saved — this updates the homepage and the services page.");
    form.reset(values);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        These four appear in “What we do” on the homepage and as the four discipline cards on the
        services page. Editing one changes both.
      </p>

      <SlotList
        items={fields}
        label={(i) => `Practice ${String(i + 1).padStart(2, "0")}`}
        onReorder={move}
        renderItem={(_, i) => (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`label-${i}`}>Name</Label>
                <Input id={`label-${i}`} maxLength={24} {...form.register(`items.${i}.label`)} />
                {errors.items?.[i]?.label && (
                  <p className="text-sm text-destructive">{errors.items[i]?.label?.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`blurb-${i}`}>Description</Label>
                <Textarea
                  id={`blurb-${i}`}
                  rows={5}
                  maxLength={260}
                  {...form.register(`items.${i}.blurb`)}
                />
                <p className="text-xs text-muted-foreground">
                  {form.watch(`items.${i}.blurb`)?.length ?? 0} / 260
                </p>
                {errors.items?.[i]?.blurb && (
                  <p className="text-sm text-destructive">{errors.items[i]?.blurb?.message}</p>
                )}
              </div>
            </div>

            <ImageSlot
              label="Photo"
              aspect="4 / 5"
              value={form.watch(`items.${i}.img`)}
              alt={form.watch(`items.${i}.alt`)}
              onChange={(url, row) => {
                form.setValue(`items.${i}.img`, url, { shouldDirty: true, shouldValidate: true });
                if (row.alt) form.setValue(`items.${i}.alt`, row.alt, { shouldDirty: true });
              }}
              onAltChange={(alt) =>
                form.setValue(`items.${i}.alt`, alt, { shouldDirty: true, shouldValidate: true })
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
