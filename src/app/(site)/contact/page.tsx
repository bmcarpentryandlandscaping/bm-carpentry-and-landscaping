import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { HoverFillButton } from "@/components/HoverFillButton";
import { Reveal } from "@/components/Reveal";
import { RevealImage } from "@/components/RevealImage";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a garden, pool or carpentry project with BM.",
  openGraph: {
    title: "Contact | BM",
    description: "Get in touch about your next outdoor project.",
  },
};

/* ── Hero image capsules ──────────────────────────────────────── */
const PILL_A = "/images/earlwood-vid-cladding-sunset-wide.webp";
const PILL_B = "/images/campsie-6.webp";

/* ── Four-up gallery ──────────────────────────────────────────── */
const ROW = [
  { src: "/images/campsie-3.webp", alt: "Coastal garden and pool, Avalon Beach" },
  { src: "/images/earlwood-1.webp", alt: "Hardwood deck and cladding, Earlwood" },
  { src: "/images/campsie-2.webp", alt: "Landscaped courtyard, Campsie" },
  { src: "/images/earlwood-3.webp", alt: "Established planting against fresh hardwood, Earlwood" },
];

/* ── Form option group ────────────────────────────────────────── */
const PROJECT_TYPES = ["Landscape", "Carpentry", "Pool", "Stonework"];

/* ── Social icons for the contact card ────────────────────────── */
function SocialIcon({ label }: { label: string }) {
  if (label === "Instagram") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="3.8" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (label === "LinkedIn") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3.2 9.2h3.6V21H3.2zM9.4 9.2H13v1.6h.05c.5-.9 1.74-1.86 3.58-1.86 3.83 0 4.54 2.4 4.54 5.52V21h-3.6v-5.3c0-1.26-.02-2.9-1.78-2.9-1.78 0-2.05 1.36-2.05 2.8V21H9.4z" />
      </svg>
    );
  }
  if (label === "Facebook") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.56c0-.86.24-1.44 1.47-1.44h1.57V4.47C16.2 4.4 15.3 4.32 14.25 4.32c-2.19 0-3.69 1.34-3.69 3.79v2.33H8V13.4h2.56V21h2.94z" />
      </svg>
    );
  }
  return null;
}

export default function ContactPage() {
  return (
    <section className="contact-atmos relative overflow-hidden">
      <div className="film-grain" aria-hidden />

      {/* ═══ HERO — headline with image capsules baked in ═══ */}
      <div className="relative mx-auto max-w-[1320px] px-6 pt-28 text-center md:px-12 md:pt-36">
        <p className="display-heavy mx-auto text-[clamp(1.85rem,6.4vw,6rem)]">
          <Reveal as="span" className="block">
            Consult with <img src={PILL_A} alt="" aria-hidden className="hero-pill" /> us
          </Reveal>
          <Reveal as="span" delay={120} className="block">
            <img src={PILL_B} alt="" aria-hidden className="hero-pill" /> Before You Build
          </Reveal>
        </p>
      </div>

      {/* ═══ GET IN TOUCH — contact card · form ═══ */}
      <div className="relative mx-auto mt-20 max-w-[1320px] px-6 md:mt-28 md:px-12">
        

        <div className="mt-10 grid gap-x-14 gap-y-10 md:mt-14 md:grid-cols-2">
          {/* revamped contact card */}
          <Reveal delay={80} className="h-full">
            
            <div className="relative flex h-full flex-col justify-between gap-10 overflow-hidden rounded-[1.75rem] bg-secondary/70 p-8 md:p-11">
              <span
                aria-hidden
                className="brand-logo pointer-events-none absolute -bottom-14 -right-14 opacity-[0.05]"
                style={{ width: 260, height: 260, transition: "none" }}
              />

              <div className="relative flex flex-col gap-7">
                <InfoRow label="Get in Touch">
                  <div className="flex flex-col gap-1">
                    {brand.phones.map((p) => (
                      <a key={p.href} href={p.href} className="arrow-link block w-fit">
                        {p.number}
                      </a>
                    ))}
                  </div>
                </InfoRow>
                <div className="hairline" />
                <InfoRow label="Email">
                  <a href={`mailto:${brand.email}`} className="arrow-link block w-fit break-all">
                    {brand.email}
                  </a>
                </InfoRow>
                <div className="hairline" />
                <InfoRow label="Location">
                  {brand.address.line1}, {brand.address.line2}
                </InfoRow>
                <div className="hairline" />
                <InfoRow label="Hours">Mon–Fri · 7am–4pm</InfoRow>
                <div className="hairline" />
                <InfoRow label="Follow">
                  <div className="flex items-center gap-3">
                    {brand.social.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={s.label}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 transition-colors duration-200 hover:border-foreground hover:text-foreground"
                      >
                        <SocialIcon label={s.label} />
                      </a>
                    ))}
                  </div>
                </InfoRow>
              </div>
            </div>
          </Reveal>

          {/* enquiry form */}
          <Reveal delay={140}>
            <form className="contact-stagger grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
              <Field id="first-name" label="First Name" autoComplete="given-name" index={0} />
              <Field id="last-name" label="Last Name" autoComplete="family-name" index={1} />
              <Field id="email" label="Email" type="email" autoComplete="email" index={2} />
              <Field id="phone" label="Phone" type="tel" autoComplete="tel" index={3} />

              <SelectField
                id="project-type"
                label="Select an option"
                options={PROJECT_TYPES}
                index={4}
              />

              <Field
                id="address"
                label="Address"
                autoComplete="street-address"
                index={5}
                span
              />
              <Field id="heard" label="How did you hear about us?" index={6} span />

              <div className="field-line relative sm:col-span-2" style={{ ["--i" as string]: 7 }}>
                <label htmlFor="message" className="eyebrow text-muted-foreground">
                  Want to tell us more about the project?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  className="peer mt-3 w-full resize-none border-b border-border bg-transparent pb-2 text-base leading-[1.5] tracking-[-0.005em] outline-none md:text-[0.95rem]"
                />
              </div>

              <div className="pt-2 sm:col-span-2" style={{ ["--i" as string]: 8 }}>
                <HoverFillButton
                  type="button"
                  className="rounded-full border border-foreground px-8 py-3.5 text-[0.78rem] uppercase tracking-[0.06em] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
                >
                  Send Enquiry <span aria-hidden>→</span>
                </HoverFillButton>
              </div>
            </form>
          </Reveal>
        </div>
      </div>

      {/* ═══ FOUR-UP GALLERY ═══ */}
      <div className="relative mx-auto mt-24 px-6 md:mt-32 md:px-12">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {ROW.map((img, i) => (
            <Reveal key={img.src} delay={i * 90}>
              <RevealImage
                src={img.src}
                alt={img.alt}
                className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted"
              />
            </Reveal>
          ))}
        </div>
      </div>

      {/* ═══ SOCIAL CLUSTER — brand lockup + tumbled social pills, flush on the footer ═══ */}
      <div className="relative z-10 mx-auto mb-4 mt-16 max-w-[1320px] px-6 md:px-12">
        <div className="flex flex-col items-center gap-3.5 pb-2">
          <BrandMark size="xl" />
          <span
            className="eyebrow whitespace-nowrap text-muted-foreground"
            style={{ fontSize: "0.86rem" }}
          >
            Let&rsquo;s Build Together
          </span>
        </div>
      </div>
    </section>
  );
}

/* ── Stacked label/value row inside the contact card ─────────── */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow text-muted-foreground/80">{label}</p>
      <div className="mt-2.5 font-display text-[1.35rem] leading-snug tracking-[-0.01em] sm:text-[1.55rem]">
        {children}
      </div>
    </div>
  );
}

/* ── Underlined floating-label field ──────────────────────────── */
function Field({
  id,
  label,
  type = "text",
  autoComplete,
  index = 0,
  span = false,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  index?: number;
  span?: boolean;
}) {
  return (
    <div
      className={`field-line relative ${span ? "sm:col-span-2" : ""}`}
      style={{ ["--i" as string]: index }}
    >
      <label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        className="peer mt-3 w-full border-b border-border bg-transparent pb-2 text-base tracking-[-0.005em] outline-none md:text-[0.95rem]"
      />
    </div>
  );
}

/* ── Underlined select with custom chevron ─────────────────────── */
function SelectField({
  id,
  label,
  options,
  index = 0,
}: {
  id: string;
  label: string;
  options: string[];
  index?: number;
}) {
  return (
    <div
      className="field-line relative sm:col-span-2"
      style={{ ["--i" as string]: index }}
    >
      <label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </label>
      <div className="relative mt-3">
        <select
          id={id}
          name={id}
          defaultValue=""
          className="peer w-full appearance-none border-b border-border bg-transparent pb-2 pr-7 text-base tracking-[-0.005em] outline-none md:text-[0.95rem]"
        >
          <option value="" disabled>
            Select an option
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 8"
          className="pointer-events-none absolute right-0 top-1/2 h-2 w-3 -translate-y-1/2 text-muted-foreground"
        >
          <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    </div>
  );
}
