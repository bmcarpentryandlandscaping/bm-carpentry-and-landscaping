import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleRail } from "@/components/ArticleRail";
import { MagneticLink } from "@/components/MagneticLink";
import { ParallaxImage } from "@/components/ParallaxImage";
import { ReadingProgress } from "@/components/ReadingProgress";
import { Reveal } from "@/components/Reveal";
import { SplitText } from "@/components/SplitText";
import { brand } from "@/lib/brand";
import { getNextPost, getPost, headingId, posts } from "@/lib/journal";

// Journal disabled 2026-08 — no static pages generated; restore the
// `posts.map(...)` body below to bring the route back.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.dek,
    openGraph: {
      title: post.title,
      description: post.dek,
      type: "article",
      images: [post.hero],
    },
  };
}

const imgAspect = {
  wide: "aspect-[16/9]",
  tall: "aspect-[4/5]",
  square: "aspect-square",
} as const;

// Journal disabled 2026-08 — the real page below is kept intact as
// `ArticlePageContent`; the exported default just 404s. Swap the export
// back to `ArticlePageContent` to bring the route back.
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  notFound();
}

async function ArticlePageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const next = getNextPost(slug);
  const more = posts.filter((p) => p.slug !== slug && p.slug !== next.slug).slice(0, 2);

  const chapters = post.body
    .filter((b): b is Extract<typeof b, { type: "h" }> => b.type === "h")
    .map((b) => ({ id: headingId(b.text), text: b.text }));

  return (
    <article id="article-root" className="relative">
      <ReadingProgress targetId="article-root" />

      {/* ─── HERO — header matched to the About/Services family: eyebrow +
          hairline row, restrained display title, dek + byline grid. A faint
          ghost of the cover sits behind for warmth and depth. ─────────────── */}
      <header className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img src={post.hero} alt="" className="h-full w-full object-cover opacity-[0.05]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/80 to-background" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-6 pb-12 pt-32 md:px-12 md:pb-16 md:pt-40">
          {/* eyebrow + hairline — same row pattern as the About hero */}
          <div className="flex items-center gap-4">
            <Link
              href="/journal"
              className="arrow-link eyebrow inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <span aria-hidden className="arrow">
                ←
              </span>{" "}
              The journal
            </Link>
            <span className="h-px flex-1 bg-border" />
            <span className="eyebrow text-muted-foreground">
              {post.tag} · {post.date}
            </span>
          </div>

          <SplitText
            as="h1"
            className="mt-9 max-w-[20ch] font-display text-[2.5rem] leading-[1.0] tracking-[-0.025em] md:mt-12 md:text-[4.75rem] md:leading-[0.95]"
            stagger={18}
          >
            {post.title}
          </SplitText>

          <div className="mt-10 grid gap-x-12 gap-y-8 border-t border-border pt-8 md:mt-14 md:grid-cols-12 md:pt-10">
            <Reveal delay={120} className="md:col-span-7">
              <p className="font-display text-2xl leading-snug tracking-[-0.01em] text-foreground md:text-3xl">
                {post.dek}
              </p>
            </Reveal>
            <Reveal delay={220} className="flex md:col-span-3 md:col-start-10 md:items-end">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-border font-display text-sm tracking-[-0.02em]"
                >
                  {post.author.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </span>
                <div>
                  <p className="font-display text-lg leading-tight tracking-[-0.02em]">
                    {post.author.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{post.read} read</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* ─── COVER — full scrub parallax + zoom-settle, floating caption ──── */}
      <div className="mx-auto mt-6 max-w-[1600px] px-6 md:mt-10 md:px-12">
        <div className="img-zoom relative w-full">
          <ParallaxImage
            src={post.hero}
            alt={post.title}
            className="aspect-[16/10] w-full md:aspect-[16/8]"
            imgClassName="h-full w-full object-cover"
            strength={120}
            zoomFrom={1.08}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-6 pb-6 md:px-9 md:pb-8"
            style={{ color: "var(--surface-deep-foreground)" }}
          >
            <span className="eyebrow opacity-90">
              {brand.fullName.split(" ").slice(0, 2).join(" ")} · Field notes
            </span>
            <span className="eyebrow opacity-90">{post.tag}</span>
          </div>
        </div>
      </div>

      {/* ─── BODY — sticky chapter rail beside an offset reading column ───── */}
      <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-12 md:py-28">
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12 lg:items-start">
          <aside className="lg:col-span-3 lg:sticky lg:top-28 lg:self-start">
            <ArticleRail chapters={chapters} />
          </aside>

          <div className="article-body lg:col-span-8 lg:col-start-5">
            {post.body.map((block, i) => {
              switch (block.type) {
                case "h": {
                  const id = headingId(block.text);
                  const n = chapters.findIndex((c) => c.id === id) + 1;
                  return (
                    <Reveal key={i}>
                      <h2
                        id={id}
                        data-chapter
                        className="mt-20 flex scroll-mt-28 items-baseline gap-5 font-display text-3xl leading-[1.05] tracking-[-0.02em] md:text-5xl"
                      >
                        <span className="eyebrow shrink-0 translate-y-[-0.55em] text-muted-foreground/70">
                          {String(n).padStart(2, "0")}
                        </span>
                        <span>{block.text}</span>
                      </h2>
                    </Reveal>
                  );
                }
                case "p":
                  return (
                    <Reveal key={i} delay={40}>
                      <p
                        className={
                          block.lead
                            ? "drop-cap text-lg leading-snug text-foreground md:text-xl"
                            : "mt-5 text-lg leading-snug text-muted-foreground md:text-xl"
                        }
                      >
                        {block.text}
                      </p>
                    </Reveal>
                  );
                case "quote":
                  return (
                    <Reveal key={i} delay={40}>
                      <figure className="relative my-16 pl-10 md:my-24 md:pl-16">
                        <span
                          aria-hidden
                          className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-foreground/30"
                        />
                        <span
                          aria-hidden
                          className="absolute -left-1 -top-6 select-none font-display text-7xl leading-none text-foreground/15 md:-top-8 md:text-8xl"
                        >
                          &ldquo;
                        </span>
                        <blockquote className="font-display text-3xl leading-[1.15] tracking-[-0.02em] md:text-[2.6rem]">
                          {block.text}
                        </blockquote>
                        {block.cite && (
                          <figcaption className="eyebrow mt-7 flex items-center gap-3 text-muted-foreground">
                            <span aria-hidden className="h-px w-6 bg-border" />
                            {block.cite}
                          </figcaption>
                        )}
                      </figure>
                    </Reveal>
                  );
                case "image":
                  return (
                    <Reveal key={i} delay={40} className="my-14 md:my-20">
                      <figure>
                        <div className={`img-zoom ${imgAspect[block.aspect]} w-full`}>
                          <ParallaxImage
                            src={block.src}
                            alt={block.alt}
                            imgClassName="h-full w-full object-cover"
                            strength={70}
                            zoomFrom={1.06}
                          />
                        </div>
                        <figcaption className="mt-4 flex items-start gap-3 border-t border-border pt-3">
                          <span
                            aria-hidden
                            className="eyebrow shrink-0 pt-0.5 text-muted-foreground/60"
                          >
                            Fig.
                          </span>
                          <span className="text-sm leading-snug text-muted-foreground">
                            {block.alt}
                          </span>
                        </figcaption>
                      </figure>
                    </Reveal>
                  );
                case "list":
                  return (
                    <Reveal key={i} delay={40}>
                      <ul className="mt-10 space-y-0">
                        {block.items.map((item, j) => (
                          <li
                            key={j}
                            className="flex gap-5 border-t border-border py-5 text-lg leading-snug text-muted-foreground last:border-b last:border-border md:gap-7 md:text-xl"
                          >
                            <span className="eyebrow shrink-0 pt-1.5 text-foreground">
                              {String(j + 1).padStart(2, "0")}
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  );
                default:
                  return null;
              }
            })}

            {/* sign-off */}
            <Reveal>
              <div className="mt-16 flex flex-col gap-6 border-t border-border pt-9 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="grid size-12 shrink-0 place-items-center rounded-full border border-border font-display text-sm tracking-[-0.02em]"
                  >
                    {post.author.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="font-display text-lg leading-tight tracking-[-0.02em]">
                      {post.author.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {post.author.role} | {brand.fullName.split(" ").slice(0, 2).join(" ")}
                    </p>
                  </div>
                </div>
                <span
                  className="brand-logo"
                  role="img"
                  aria-label={brand.fullName}
                  style={{ width: 32, height: 32 }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ─── MORE FIELD NOTES — quiet index of the remaining posts ────────── */}
      {more.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-12 md:pb-28">
          <Reveal>
            <div className="flex items-end justify-between gap-6 border-t border-border pt-9">
              <p className="eyebrow text-muted-foreground">More field notes</p>
              <MagneticLink
                href="/journal"
                className="eyebrow inline-flex items-center gap-2 border-b border-foreground pb-1"
              >
                All articles <span aria-hidden>→</span>
              </MagneticLink>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2">
            {more.map((p, i) => (
              <Reveal key={p.slug} delay={i * 90}>
                <Link href={`/journal/${p.slug}`} className="arrow-link group block">
                  <div className="img-zoom aspect-[16/10] w-full">
                    <img
                      src={p.hero}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                    <span className="eyebrow">{p.date}</span>
                    <span className="eyebrow opacity-40">·</span>
                    <span className="eyebrow">{p.tag}</span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl leading-[1.1] tracking-[-0.02em]">
                    {p.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    Read <span aria-hidden>→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ─── CONTINUE READING — full-bleed next post ──────────────────────── */}
      <section className="relative overflow-hidden">
        <Link href={`/journal/${next.slug}`} className="group block">
          <div className="parallax-stage relative h-[72svh] min-h-[440px]">
            <img
              src={next.hero}
              alt={next.title}
              className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/55 transition-colors duration-700 group-hover:bg-black/45" />
            <div
              className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-between px-6 py-14 md:px-12 md:py-20"
              style={{ color: "var(--surface-deep-foreground)" }}
            >
              <div className="flex items-center gap-4">
                <span className="eyebrow opacity-80">Continue reading</span>
                <span className="h-px flex-1 bg-current opacity-25" />
                <span className="eyebrow opacity-80">{next.tag}</span>
              </div>
              <div>
                <p className="eyebrow opacity-80">
                  {next.date} · {next.read} read
                </p>
                <h2 className="mt-4 max-w-[18ch] font-display text-4xl leading-[0.98] tracking-[-0.02em] md:text-7xl">
                  {next.title}
                </h2>
                <div className="mt-7 inline-flex items-center gap-3 border-b border-current pb-1 text-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                  Read article <span aria-hidden>→</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>
    </article>
  );
}
