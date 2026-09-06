import { requireSession } from "@/lib/auth";
import { loadContent } from "../_actions/content";
import { AdminPage } from "@/components/admin/AdminPage";
import { ServicesHeroEditor } from "@/components/admin/ServicesHeroEditor";

export default async function ServicesAdmin() {
  await requireSession();
  const hero = await loadContent("services.hero");

  return (
    <AdminPage
      title="Services"
      lede="The two photos at the top of the services page. The four service cards below them are the same four entries as Homepage → What we do, so they are edited there."
      viewHref="/services"
      viewLabel="See the services page"
    >
      <ServicesHeroEditor initial={hero} />
    </AdminPage>
  );
}
