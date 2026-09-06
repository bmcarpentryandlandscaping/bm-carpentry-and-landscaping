import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/content";
import { projectSlug } from "@/lib/gallery";

const base = "https://bmcarpentry.com.au";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { url: "", priority: 1, changeFrequency: "monthly" as const },
    { url: "/services", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/projects", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/about", priority: 0.7, changeFrequency: "yearly" as const },
    // { url: "/journal", priority: 0.6, changeFrequency: "weekly" as const }, // journal disabled 2026-08
    { url: "/contact", priority: 0.8, changeFrequency: "yearly" as const },
  ].map((r) => ({ ...r, url: `${base}${r.url}`, lastModified: new Date() }));

  const items = await getProjects();
  const projectRoutes = items.map((item) => ({
    url: `${base}/projects/${projectSlug(item)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Journal routes disabled 2026-08, keep for later:
  // const journalRoutes = posts.map((p) => ({
  //   url: `${base}/journal/${p.slug}`,
  //   lastModified: new Date(),
  //   changeFrequency: "yearly" as const,
  //   priority: 0.5,
  // }));

  return [...staticRoutes, ...projectRoutes];
}
