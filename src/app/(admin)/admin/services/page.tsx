import { requireSession } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadContent } from "../_actions/content";
import { AdminPage } from "@/components/admin/AdminPage";
import { ServicesCopyEditor } from "@/components/admin/ServicesCopyEditor";
import { ServicesHeroEditor } from "@/components/admin/ServicesHeroEditor";

export default async function ServicesAdmin() {
  await requireSession();
  const [hero, copy] = await Promise.all([
    loadContent("services.hero"),
    loadContent("services.copy"),
  ]);

  return (
    <AdminPage
      title="Services"
      lede="The two photos at the top of the services page and the wording around them. The four service cards below them are the same four entries as Homepage → What we do, so they are edited there."
      viewHref="/services"
      viewLabel="See the services page"
    >
      <Tabs defaultValue="photos">
        <TabsList className="h-auto w-full justify-start gap-7 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="photos"
            className="-mb-px rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-[0.9375rem] font-normal text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >Photos</TabsTrigger>
          <TabsTrigger
            value="wording"
            className="-mb-px rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-[0.9375rem] font-normal text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >Wording</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="pt-8">
          <ServicesHeroEditor initial={hero} />
        </TabsContent>
        <TabsContent value="wording" className="pt-8">
          <ServicesCopyEditor initial={copy} />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
