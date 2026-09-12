import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { AdminPage } from "@/components/admin/AdminPage";
import { listProjects } from "./_actions/projects";
import { listMedia } from "./_actions/media";
import { loadContent } from "./_actions/content";

/**
 * The dashboard's job is orientation, not decoration: five ways in, each
 * carrying the one number that tells the client whether it needs attention.
 * Identical cards with static blurbs told them nothing they could act on.
 */
export default async function AdminDashboard() {
  const { user } = await requireSession();
  const [projects, media, details] = await Promise.all([
    listProjects(),
    listMedia(),
    loadContent("site.details"),
  ]);
  const licence = details.licence;

  const live = projects.ok ? projects.data.filter((p) => p.published).length : null;
  const hidden = projects.ok ? projects.data.length - (live ?? 0) : null;
  const photos = media.ok ? media.data.length : null;

  const sections = [
    {
      href: "/admin/homepage",
      title: "Homepage",
      body: "The big photo at the top, the four things you do, the featured work, and the workshop story.",
      status: "4 sections",
    },
    {
      href: "/admin/services",
      title: "Services",
      body: "The two photos at the top of the services page, and the wording around them.",
      status: "Photos + wording",
    },
    {
      href: "/admin/projects",
      title: "Projects",
      body: "Add a job, change its photos and description, put it in order, or take it off the site.",
      status:
        live === null
          ? "—"
          : `${live} on the site${hidden ? `, ${hidden} hidden` : ""}`,
    },
    {
      href: "/admin/media",
      title: "Media",
      body: "Every photo and video you can choose from. Upload new ones here.",
      status: photos === null ? "—" : `${photos} file${photos === 1 ? "" : "s"}`,
    },
    {
      href: "/admin/settings",
      title: "Site details",
      body: "Your licence number, shown in the footer of every page once you add it.",
      status: licence ? "Licence set" : "No licence yet",
    },
  ];

  return (
    <AdminPage title="Your site" lede={`Signed in as ${user.email}. Changes go live as soon as you save.`}>
      <ul>
        {sections.map((s, i) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex items-baseline gap-6 border-b border-border py-6 transition-colors hover:bg-muted/40"
              style={i === 0 ? { borderTop: "1px solid var(--color-border)" } : undefined}
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl transition-transform duration-200 ease-(--ease-out-quart) group-hover:translate-x-1">
                  {s.title}
                </h2>
                <p className="admin-lede mt-1.5 text-sm">{s.body}</p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">{s.status}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}
