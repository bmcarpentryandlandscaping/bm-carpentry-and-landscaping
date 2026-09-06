"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageSlot } from "./ImageSlot";
import { SaveBar } from "./SaveBar";
import { saveContent } from "@/app/(admin)/admin/_actions/content";
import { ServicesHero } from "@/lib/schemas";

export function ServicesHeroEditor({ initial }: { initial: ServicesHero }) {
  const form = useForm<ServicesHero>({
    resolver: zodResolver(ServicesHero),
    defaultValues: initial,
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await saveContent("services.hero", values);
    if (!res.ok) return toast.error(res.error);
    toast.success("Services images updated.");
    form.reset(values);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-4xl space-y-8">
      {(["a", "b"] as const).map((slot) => (
        <div key={slot} className="grid gap-4 md:grid-cols-2">
          <ImageSlot
            label={slot === "a" ? "First image (wide, near the top)" : "Second image (square)"}
            aspect={slot === "a" ? "16 / 9" : "1 / 1"}
            value={form.watch(`${slot}.src`)}
            alt={form.watch(`${slot}.alt`)}
            onChange={(url, row) => {
              form.setValue(`${slot}.src`, url, { shouldDirty: true, shouldValidate: true });
              if (row.alt) form.setValue(`${slot}.alt`, row.alt, { shouldDirty: true });
            }}
            onAltChange={(alt) =>
              form.setValue(`${slot}.alt`, alt, { shouldDirty: true, shouldValidate: true })
            }
          />
          <div className="space-y-2">
            <Label htmlFor={`cap-${slot}`}>Caption pill</Label>
            <Input id={`cap-${slot}`} maxLength={18} {...form.register(`${slot}.caption`)} />
            <p className="text-xs text-muted-foreground">
              The small label over the photo, e.g. “Earlwood”. 18 characters maximum.
            </p>
          </div>
        </div>
      ))}

      <SaveBar
        dirty={isDirty}
        valid={isValid}
        saving={isSubmitting}
        onDiscard={() => form.reset(initial)}
      />
    </form>
  );
}
