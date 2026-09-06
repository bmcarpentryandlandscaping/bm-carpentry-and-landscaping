import type { Metadata } from "next";
import { MagneticLink } from "@/components/MagneticLink";
import { MaskHeading } from "@/components/MaskHeading";
import { Reveal } from "@/components/Reveal";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How BM Carpentry & Landscaping collects, uses and protects your personal information, in line with the Australian Privacy Principles.",
  openGraph: {
    title: "Privacy | BM",
    description:
      "Our approach to your personal information — enquiries, quotes, site visits and project photography.",
  },
};

const LAST_UPDATED = "July 2026";

type Section = {
  n: string;
  label: string;
  title: string;
  body: (string | string[])[];
};

const sections: Section[] = [
  {
    n: "01",
    label: "Who we are",
    title: "About this policy.",
    body: [
      `${brand.fullName} (“we”, “us”, “our”) is a Sydney-based carpentry and landscape construction business. We respect your privacy and are committed to handling your personal information openly and responsibly.`,
      "This policy explains what we collect, why we collect it and how we look after it. We handle personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).",
    ],
  },
  {
    n: "02",
    label: "What we collect",
    title: "Information we collect.",
    body: [
      "We only collect information we genuinely need to quote, plan and deliver your project. Depending on how you engage us, that may include:",
      [
        "Contact details — your name, email address, phone number and postal address.",
        "Project details — the site address, property access notes, your brief, budget range and design preferences.",
        "Site information — measurements, photographs and notes gathered during a site visit or consultation.",
        "Correspondence — the messages, quotes and documents we exchange while scoping and running a project.",
        "Website data — basic analytics such as pages viewed and approximate location, collected automatically as you browse.",
      ],
      "We do not seek sensitive information, and we ask that you don’t send us financial account details, government identifiers or similar over email.",
    ],
  },
  {
    n: "03",
    label: "How we collect",
    title: "How we gather it.",
    body: [
      "Most information comes directly from you — through our enquiry form, a phone call or email, or in person during an on-site consultation.",
      "Some information is collected automatically when you visit this website, using cookies and analytics tools. You can disable cookies in your browser, though parts of the site may not work as intended.",
    ],
  },
  {
    n: "04",
    label: "How we use it",
    title: "Why we use it.",
    body: [
      "We use your information to run our business and deliver work you’ve asked us to do. That includes:",
      [
        "Responding to your enquiry and answering questions.",
        "Preparing quotes, estimates and design proposals.",
        "Scheduling site visits and coordinating the build.",
        "Sourcing materials and briefing our trades and suppliers.",
        "Invoicing, record-keeping and meeting our tax obligations.",
        "Improving our website and the way we work.",
      ],
      "We may occasionally send you updates about a live project. We won’t add you to marketing lists without your consent, and you can opt out at any time.",
    ],
  },
  {
    n: "05",
    label: "Project imagery",
    title: "Photography of your project.",
    body: [
      "Craftsmanship is how we win work, so we photograph our builds — during construction and once complete — for our portfolio, website and social channels.",
      "We show the work, not your private details: we don’t publish your name or street address, and we’re happy to hold any images back on request. Just let us know before or during your project and we’ll note it on your file.",
    ],
  },
  {
    n: "06",
    label: "Disclosure",
    title: "Who we share it with.",
    body: [
      "We only share your information where it’s needed to deliver your project or where the law requires it. This may include:",
      [
        "Trusted subcontractors and suppliers engaged on your job.",
        "Our accountant, insurer or professional advisers.",
        "Certifiers, councils or authorities where a project requires approval.",
        "Government or regulatory bodies where we’re legally obliged to disclose.",
      ],
      "We never sell your personal information, and we don’t disclose it for unrelated marketing.",
    ],
  },
  {
    n: "07",
    label: "Security & retention",
    title: "Keeping it safe.",
    body: [
      "We take reasonable steps to protect your information from misuse, loss and unauthorised access, and we limit access to the people who need it to do their job.",
      "We keep records for as long as we have an active relationship with you, and afterwards for as long as we’re required to for legal, insurance and tax purposes. When information is no longer needed, we take reasonable steps to destroy or de-identify it.",
    ],
  },
  {
    n: "08",
    label: "Your rights",
    title: "Access, correction & complaints.",
    body: [
      "You can ask us for a copy of the personal information we hold about you, and ask us to correct anything that’s inaccurate or out of date. We’ll respond within a reasonable time.",
      `If you have a concern about how we’ve handled your information, contact us first at ${brand.email} and we’ll work with you to resolve it. If you’re not satisfied, you can contact the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au.`,
    ],
  },
  {
    n: "09",
    label: "Updates",
    title: "Changes to this policy.",
    body: [
      "We may update this policy from time to time as our business and obligations change. The current version always lives on this page, with the revision date shown above.",
    ],
  },
];

function Body({ block }: { block: string | string[] }) {
  if (Array.isArray(block)) {
    return (
      <ul className="mt-5 flex flex-col gap-3">
        {block.map((item) => (
          <li
            key={item}
            className="relative pl-6 leading-relaxed text-muted-foreground before:absolute before:left-0 before:top-[0.62em] before:h-px before:w-3 before:bg-foreground/30"
          >
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mt-5 leading-relaxed text-muted-foreground first:mt-0">{block}</p>;
}

export default function PrivacyPage() {
  return (
    <section className="relative overflow-hidden">
      {/* oversized monogram watermark — quiet depth behind the intro */}
      <span
        aria-hidden
        className="brand-logo pointer-events-none absolute -top-20 -right-24 opacity-[0.035] md:-top-28 md:-right-20"
        style={{ width: 520, height: 520, transition: "none" }}
      />

      {/* HERO */}
      <div className="mx-auto max-w-[1600px] px-6 pb-16 pt-36 md:px-12 md:pb-24 md:pt-48">
        <div className="grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <p className="eyebrow text-muted-foreground">Legal · Privacy</p>
            <MaskHeading
              as="h1"
              lines={["Your information,", "handled with care."]}
              className="mt-6 font-display text-5xl leading-[0.98] tracking-[-0.02em] md:text-7xl"
            />
          </Reveal>
          <div className="md:col-span-4 md:col-start-9 md:self-end">
            <Reveal delay={200}>
              <p className="max-w-sm leading-relaxed text-muted-foreground">
                The same care we bring to a build, applied to the details you trust us with —
                enquiries, quotes, site visits and the photos of your finished project.
              </p>
              <p className="eyebrow mt-6 text-muted-foreground">Last updated · {LAST_UPDATED}</p>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] border-t border-border px-6 md:px-12">
        {sections.map((s) => (
          <Reveal key={s.n}>
            <article className="grid gap-6 border-b border-border py-12 md:grid-cols-12 md:gap-8 md:py-16">
              {/* sticky index rail */}
              <div className="md:col-span-4">
                <div className="flex items-baseline gap-4 md:sticky md:top-32">
                  <span className="eyebrow text-muted-foreground/60 tabular-nums">{s.n}</span>
                  <span className="eyebrow text-muted-foreground">{s.label}</span>
                </div>
              </div>
              {/* prose */}
              <div className="md:col-span-7 md:col-start-6">
                <h2 className="font-display text-2xl leading-tight md:text-3xl">{s.title}</h2>
                {s.body.map((block, i) => (
                  <Body key={i} block={block} />
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {/* CONTACT CTA */}
      <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-12 md:py-28">
        <Reveal>
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <p className="eyebrow text-muted-foreground">Contact us</p>
              <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight md:text-4xl">
                Questions about your information, or a request to access or correct it?
              </h2>
              <div className="mt-8 flex flex-col gap-1.5">
                <a
                  href={`mailto:${brand.email}`}
                  className="arrow-link inline-flex w-fit items-center gap-2 text-lg transition-opacity hover:opacity-70"
                >
                  {brand.email}
                </a>
                <p className="text-muted-foreground">
                  {brand.address.line1}, {brand.address.line2}
                </p>
              </div>
            </div>
            <div className="md:col-span-3 md:col-start-10 md:text-right">
              <MagneticLink
                href="/contact"
                className="eyebrow inline-flex items-center gap-2 border-b border-foreground pb-1"
              >
                Get in touch <span aria-hidden>→</span>
              </MagneticLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
