import { requireSession } from "@/lib/auth";
import { loadContent } from "../_actions/content";
import { AdminPage } from "@/components/admin/AdminPage";
import { SiteDetailsEditor } from "@/components/admin/SiteDetailsEditor";

export default async function SettingsAdmin() {
  await requireSession();
  const details = await loadContent("site.details");

  return (
    <AdminPage
      title="Site details"
      lede="Details that sit in the footer of every page."
      viewHref="/"
      viewLabel="See the site"
    >
      <SiteDetailsEditor initial={details} />
    </AdminPage>
  );
}
