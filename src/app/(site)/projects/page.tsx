import type { Metadata } from "next";
import { ProjectGallery } from "@/components/ProjectGallery";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Recent gardens, pools and carpentry projects across Sydney and the NSW South Coast.",
  openGraph: {
    title: "Projects — BM.",
    description: "Selected landscape and carpentry work.",
  },
};

export default async function ProjectsPage() {
  const items = await getProjects();
  return (
    <>
      {/* HEADER — homepage type pattern: word-rise + italic accent */}
      <section className="mx-auto max-w-[1600px] px-6 pb-10 pt-32 md:px-12 md:pb-16 md:pt-40">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <p className="eyebrow text-muted-foreground">Selected work</p>
          <p className="eyebrow text-muted-foreground">
            {String(items.length).padStart(2, "0")} — Sydney &amp; South Coast
          </p>
        </div>
        <h1 className="word-rise mt-8 font-display text-6xl leading-[0.86] tracking-[-0.03em] md:mt-10 md:text-[8rem]">
          <span style={{ animationDelay: "0.15s" }}>Projects</span>
          <span style={{ animationDelay: "0.3s" }} className="italic font-[300]">
            .
          </span>
        </h1>
      </section>

      {/* FILTERABLE MASONRY GALLERY */}
      <ProjectGallery items={items} />
    </>
  );
}
