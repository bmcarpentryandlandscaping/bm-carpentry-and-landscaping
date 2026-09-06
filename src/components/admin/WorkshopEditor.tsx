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
import { Workshop } from "@/lib/schemas";

export function WorkshopEditor({ initial }: { initial: Workshop }) {
  const form = useForm<Workshop>({
    resolver: zodResolver(Workshop),
    defaultValues: initial,
    mode: "onChange",
  });
  const { fields, move } = useFieldArray({ control: form.control, name: "stages" });
  const { isDirty, isValid, isSubmitting, errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await saveContent("home.workshop", values);
    if (!res.ok) return toast.error(res.error);
    toast.success("Workshop updated.");
    form.reset(values);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        The five stages of the build story. The 01–05 numbering follows the order below, so
        reordering renumbers them for you.
      </p>

      <SlotList
        items={fields}
        label={(i) => `Stage ${String(i + 1).padStart(2, "0")}`}
        onReorder={move}
        renderItem={(_, i) => (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${i}`}>Stage name</Label>
                <Input id={`name-${i}`} maxLength={12} {...form.register(`stages.${i}.name`)} />
                <p className="text-xs text-muted-foreground">
                  One short word — it is set very large. 12 characters maximum.
                </p>
                {errors.stages?.[i]?.name && (
                  <p className="text-sm text-destructive">{errors.stages[i]?.name?.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`cap-${i}`}>Caption</Label>
                <Textarea id={`cap-${i}`} rows={3} maxLength={90} {...form.register(`stages.${i}.cap`)} />
                <p className="text-xs text-muted-foreground">
                  {form.watch(`stages.${i}.cap`)?.length ?? 0} / 90
                </p>
              </div>
            </div>

            <ImageSlot
              label="Photo"
              aspect="3 / 4"
              value={form.watch(`stages.${i}.img`)}
              alt={form.watch(`stages.${i}.alt`)}
              onChange={(url, row) => {
                form.setValue(`stages.${i}.img`, url, { shouldDirty: true, shouldValidate: true });
                if (row.alt) form.setValue(`stages.${i}.alt`, row.alt, { shouldDirty: true });
              }}
              onAltChange={(alt) =>
                form.setValue(`stages.${i}.alt`, alt, { shouldDirty: true, shouldValidate: true })
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
