import { Reveal } from "@/components/Reveal";
import { Armchair, Hourglass, TreePalm } from "lucide-react";

export type ValueIcon = "leaf" | "chair" | "hourglass";

export type ValueItem = {
  icon: ValueIcon;
  title: string;
  desc: string;
};

/** Hand-drawn, single-stroke line icons — no generic icon library. */
const ICONS: Record<ValueIcon, React.ReactNode> = {
  leaf: <TreePalm size={60} strokeWidth={1.5} />,
  // Usability is about a space you actually sit in, and longevity about how it
  // performs over years — a map pin and a recycling mark said neither.
  chair: <Armchair size={60} strokeWidth={1.5} />,
  hourglass: <Hourglass size={60} strokeWidth={1.5} />,
};

/**
 * Equal-weight three-column values grid — icon above heading above a single
 * supporting line, centred, no card borders and no imagery. Modelled on a
 * plain symmetric icon grid rather than a bordered bento layout.
 */
export function ValueReveal({ items }: { items: ValueItem[] }) {
  return (
    <div className="grid gap-14 sm:grid-cols-3 md:gap-16">
      {items.map((it, i) => (
        <Reveal key={it.title} delay={i * 100} className="flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center text-accent" aria-hidden>
            {ICONS[it.icon]}
          </span>
          <h3 className="mt-6 font-display text-xl font-light leading-[1.2] tracking-[-0.02em] md:text-2xl">
            {it.title}
          </h3>
          <p className="mx-auto mt-4 max-w-[50ch] text-sm leading-relaxed tracking-[-0.01em] text-muted-foreground">
            {it.desc}
          </p>
        </Reveal>
      ))}
    </div>
  );
}
