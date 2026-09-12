"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SaveBar } from "./SaveBar";
import { saveContent } from "@/app/(admin)/admin/_actions/content";
import { ServicesCopy } from "@/lib/schemas";

export function ServicesCopyEditor({ initial }: { initial: ServicesCopy }) {
  const form = useForm<ServicesCopy>({
    resolver: zodResolver(ServicesCopy),
    defaultValues: initial,
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await saveContent("services.copy", values);
    if (!res.ok) return toast.error(res.error);
    toast.success("Services wording updated.");
    form.reset(values);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="craft">Big words between the two photos</Label>
        <Input id="craft" maxLength={24} {...form.register("craft")} />
        <p className="text-xs text-muted-foreground">
          Each word sits on its own line, so “Our craft” reads as two lines. Two or three short
          words work best — 24 characters maximum.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="heading">Headline beside the second photo</Label>
        <Textarea id="heading" rows={3} maxLength={160} {...form.register("heading")} />
        <p className="text-xs text-muted-foreground">
          One sentence, 160 characters maximum.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intro">Paragraph under the headline</Label>
        <Textarea id="intro" rows={4} maxLength={400} {...form.register("intro")} />
        <p className="text-xs text-muted-foreground">400 characters maximum.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="disciplinesHeading">Heading above the four service cards</Label>
        <Input id="disciplinesHeading" maxLength={40} {...form.register("disciplinesHeading")} />
        <p className="text-xs text-muted-foreground">
          Set large across the page, e.g. “Four disciplines.” — 40 characters maximum.
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
