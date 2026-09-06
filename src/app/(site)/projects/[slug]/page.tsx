import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MagneticLink } from "@/components/MagneticLink";
import { ProjectBanner } from "@/components/ProjectBanner";
import { Reveal } from "@/components/Reveal";
import { RevealImage } from "@/components/RevealImage";
import { SplitText } from "@/components/SplitText";
import { getProject, getProjects } from "@/lib/content";
import {
  getMoreProjects,
  projectDescription,
  projectFeature,
  projectImages,
  projectScope,
  projectSlug,
  projectYear,
} from "@/lib/gallery";

export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getProjects();
  return items.map((item) => ({ slug: projectSlug(item) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found" };
  const [intro] = projectDescription(project);
  return {
    title: project.title,
    description: intro,
    openGraph: { title: project.title, description: intro, images: [project.img] },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const description = projectDescription(project);
  const scope = projectScope(project);
  const year = projectYear(project);
  const feature = projectFeature(project);
  const shots = projectImages(project);
  const more = getMoreProjects(await getProjects(), slug, 3);

  return (
    <>
      {/* BANNER — full-bleed hero, consistent crop across every project */}
      <ProjectBanner
        src={project.img}
        alt={project.title}
        pos={project.pos}
        eyebrow={`${project.categories[0]} | ${year} · ${project.location}`}
      />

      {/* INFO — editorial spread mirroring the reference: title + copy + details · feature image */}
      <section className="mx-auto max-w-[1400px] px-6 pb-24 pt-14 md:px-12 md:pb-32 md:pt-20">
        <MagneticLink
          href="/projects"
          className="inline-flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.04em] text-muted-foreground"
        >
          <span aria-hidden>←</span> Projects
        </MagneticLink>

        <div className="mt-11 grid gap-x-16 gap-y-12 md:mt-16 md:grid-cols-2">
          {/* Left — information, tightly set */}
          <div className="flex flex-col">
            <SplitText
              as="h1"
              className="font-display text-[2.4rem] font-[500] leading-[1.02] tracking-[-0.035em] md:text-[3.4rem]"
              stagger={22}
            >
              {project.title}
            </SplitText>

            <div className="mt-7 max-w-[46ch] space-y-4 text-[0.95rem] leading-[1.6] tracking-[-0.006em] text-muted-foreground">
              {description.map((p, i) => (
                <Reveal key={i} delay={i * 90}>
                  <p>{p}</p>
                </Reveal>
              ))}
            </div>

            <dl className="mt-14 md:mt-20">
              <Detail label="Location" value={project.location} />
              <Detail label="Completed" value={String(year)} />
              <Detail label="Scope of work" value={scope} />
            </dl>
          </div>

          {/* Right — feature image at a fixed aspect, identical on every project */}
          <div className="md:pt-1">
            <RevealImage
              src={feature}
              alt={`${project.title} — feature`}
              loading="eager"
              className="aspect-[4/3] w-full bg-muted"
            />
          </div>
        </div>
      </section>

      {/* GALLERY — curated, asymmetric editorial composition, category-matched */}
      <section className="mx-auto max-w-[1400px] px-6 pb-24 md:px-12 md:pb-32">
        <div className="mb-8 flex items-end justify-between gap-6 border-t border-border pt-8 md:mb-12 md:pt-10">
          <h2 className="font-display text-2xl leading-[0.98] tracking-[-0.035em] md:text-[2rem]">
            Selected views
          </h2>
          <span className="eyebrow text-muted-foreground">
            {String(shots.length).padStart(2, "0")} — {project.location}
          </span>
        </div>

        <div className="space-y-3 md:space-y-4">
          {/* establishing wide shot */}
          <RevealImage
            src={shots[0]}
            alt={`${project.title} — view 1`}
            className="aspect-[16/9] w-full bg-muted"
          />

          {/* asymmetric two-up */}
          <div className="grid gap-3 md:grid-cols-12 md:gap-4">
            <RevealImage
              src={shots[1]}
              alt={`${project.title} — view 2`}
              className="aspect-[4/3] w-full bg-muted md:col-span-7"
            />
            <RevealImage
              src={shots[2]}
              alt={`${project.title} — view 3`}
              className="aspect-[4/5] w-full bg-muted md:col-span-5"
            />
          </div>

          {/* offset pair — reversed weighting, dropped tile for rhythm */}
          <div className="grid gap-3 md:grid-cols-12 md:items-start md:gap-4">
            <RevealImage
              src={shots[3]}
              alt={`${project.title} — view 4`}
              className="aspect-[5/6] w-full bg-muted md:col-span-5 md:mt-16"
            />
            <RevealImage
              src={shots[4]}
              alt={`${project.title} — view 5`}
              className="aspect-[3/2] w-full bg-muted md:col-span-7"
            />
          </div>
        </div>
      </section>

      {/* MORE PROJECTS */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-12 md:py-28">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl font-[500] leading-[0.98] tracking-[-0.03em] md:text-5xl">
              More projects
            </h2>
            <MagneticLink
              href="/projects"
              className="eyebrow hidden items-center gap-2 border-b border-foreground pb-1 md:inline-flex"
            >
              View all <span aria-hidden>→</span>
            </MagneticLink>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 md:mt-14 md:gap-5">
            {more.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${projectSlug(item)}`}
                aria-label={`${item.title}, ${item.location}`}
                className="gallery-tile group relative block aspect-[4/5] w-full overflow-hidden bg-muted"
              >
                <img
                  src={item.img}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                  style={{ objectPosition: item.pos }}
                />
                <div className="gallery-scrim pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div
                  className="gallery-cap pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5"
                  style={{ color: "var(--surface-deep-foreground)" }}
                >
                  <h3 className="font-display text-lg font-[500] leading-[1.05] tracking-[-0.02em] md:text-xl">
                    {item.title}
                  </h3>
                  <p className="eyebrow mt-1 truncate opacity-80">{item.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | string[] }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-baseline gap-4 border-t border-border/80 py-4 sm:grid-cols-2 sm:gap-8">
      <dt className="text-[0.7rem] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[0.9rem] leading-snug tracking-[-0.01em]">
        {Array.isArray(value)
          ? value.map((v) => (
              <span key={v} className="block">
                {v}
              </span>
            ))
          : value}
      </dd>
    </div>
  );
}
