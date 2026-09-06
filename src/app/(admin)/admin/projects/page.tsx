import { requireSession } from "@/lib/auth";
import { listProjects } from "../_actions/projects";
import { AdminPage } from "@/components/admin/AdminPage";
import { ProjectList } from "@/components/admin/ProjectList";

export default async function ProjectsAdmin() {
  await requireSession();
  const res = await listProjects();

  return (
    <AdminPage
      title="Projects"
      lede="Every job on the site, in the order they appear. New projects start hidden so you can finish them before anyone sees them."
      viewHref="/projects"
      viewLabel="See the projects page"
    >
      {res.ok ? (
        <ProjectList initial={res.data} />
      ) : (
        <p className="text-sm text-destructive">{res.error}</p>
      )}
    </AdminPage>
  );
}
