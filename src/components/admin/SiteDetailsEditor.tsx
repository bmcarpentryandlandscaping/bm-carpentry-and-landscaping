"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveBar } from "./SaveBar";
import { saveContent } from "@/app/(admin)/admin/_actions/content";
import { SiteDetails } from "@/lib/schemas";

export function SiteDetailsEditor({ initial }: { initial: SiteDetails }) {
  const form = useForm<SiteDetails>({
    resolver: zodResolver(SiteDetails),
    defaultValues: initial,
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await saveContent("site.details", values);
    if (!res.ok) return toast.error(res.error);
    toast.success("Site details updated.");
    form.reset(values);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="licence">Licence number</Label>
        <Input id="licence" maxLength={40} placeholder="e.g. 123456C" {...form.register("licence")} />
        <p className="text-xs text-muted-foreground">
          Shows in the footer of every page as “Licence No. …”. Leave it empty and nothing is shown
          at all — so it can wait until you have one.
        </p>
      </div>

      <SaveBar
        dirty={isDirty}
        valid={isValid}
        saving={isSubmitting}
        onDiscard={() => form.reset(initial)}
      />
    </form>
  );
}
