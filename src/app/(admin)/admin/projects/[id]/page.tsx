import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getProjectRow } from "../../_actions/projects";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const res = await getProjectRow(id);
  if (!res.ok) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <Link href="/admin/projects" className="text-sm text-muted-foreground hover:text-foreground">
            ← All projects
          </Link>
          <h1 className="font-display text-3xl">{res.data.data.title}</h1>
        </div>
        {res.data.published && (
          <a
            href={`/projects/${res.data.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View on the site ↗
          </a>
        )}
      </div>
      <ProjectEditor project={res.data} />
    </div>
  );
}
