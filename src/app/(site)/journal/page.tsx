import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ParallaxImage } from "@/components/ParallaxImage";
import { Reveal } from "@/components/Reveal";
import { posts } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes from the workshop and the field.",
  openGraph: {
    title: "Journal | BM",
    description: "Writing on plants, timber and the craft of building outdoors.",
  },
};

const [lead, ...rest] = posts;

// Journal disabled 2026-08 — notFound() short-circuits before the markup
// below runs; page kept intact so it's a one-line revert to bring back.
export default function JournalPage() {
  notFound();
  return (
    <>
      {/* HEADER — homepage type pattern: word-rise + italic accent dot */}
      <section className="mx-auto max-w-[1600px] px-6 pb-10 pt-32 md:px-12 md:pb-12 md:pt-40">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <p className="eyebrow text-muted-foreground">Journal · field notes</p>
          <p className="eyebrow text-muted-foreground">
            {String(posts.length).padStart(2, "0")} · Sydney &amp; South Coast
          </p>
        </div>
        <h1 className="word-rise mt-7 font-display text-6xl leading-[0.8] tracking-[-0.05em] md:mt-9 md:text-[8rem]">
          <span style={{ animationDelay: "0.15s" }}>Journal</span>
          <span style={{ animationDelay: "0.3s" }} className="italic font-[300]">
            .
          </span>
        </h1>
      </section>

      {/* FEATURED LEAD — wide image beside title; the rest sit in a tight grid */}
      <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-12 md:pb-28">
        <Reveal>
          <Link
            href={`/journal/${lead.slug}`}
            className="arrow-link group grid items-end gap-6 border-t border-border pt-8 md:grid-cols-12 md:gap-10 md:pt-10"
          >
            <div className="img-zoom md:col-span-8">
              <ParallaxImage
                src={lead.hero}
                alt={lead.title}
                className="aspect-[16/10] w-full"
                imgClassName="h-full w-full object-cover"
                strength={50}
                zoomFrom={1.05}
              />
            </div>
            <div className="md:col-span-4 md:pb-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                <span className="eyebrow text-foreground">Latest</span>
                <span className="eyebrow opacity-40">·</span>
                <span className="eyebrow">{lead.tag}</span>
                <span className="eyebrow opacity-40">·</span>
                <span className="eyebrow">{lead.read}</span>
              </div>
              <h2 className="mt-3.5 font-display text-3xl leading-[0.95] tracking-[-0.035em] md:text-[2.7rem]">
                {lead.title}
              </h2>
              <p className="mt-2.5 max-w-md text-base leading-[1.35] tracking-[-0.015em] text-muted-foreground">
                {lead.dek}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm">
                Read article <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        </Reveal>

        {/* GRID — articles shown next to one another, three across */}
        <div className="mt-12 grid gap-x-6 gap-y-12 border-t border-border pt-12 md:mt-16 md:grid-cols-3 md:gap-x-8 md:pt-14">
          {rest.map((post, i) => (
            <Reveal key={post.slug} delay={i * 80}>
              <Link href={`/journal/${post.slug}`} className="arrow-link group block">
                <div className="img-zoom aspect-[4/5] w-full">
                  <img
                    src={post.hero}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-3.5 flex items-baseline justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-muted-foreground">
                    <span className="eyebrow">{post.date}</span>
                    <span className="eyebrow opacity-40">·</span>
                    <span className="eyebrow">{post.tag}</span>
                  </div>
                  <span className="eyebrow shrink-0 text-muted-foreground">
                    0{i + 2}
                  </span>
                </div>
                <h3 className="mt-1.5 font-display text-2xl leading-[1.0] tracking-[-0.035em]">
                  {post.title}
                </h3>
                <span className="mt-2.5 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  Read <span aria-hidden>→</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
