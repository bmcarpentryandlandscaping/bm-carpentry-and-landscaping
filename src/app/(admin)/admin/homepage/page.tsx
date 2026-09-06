import { requireSession } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPage } from "@/components/admin/AdminPage";
import { listPublishedProjects, loadContent } from "../_actions/content";
import { HeroEditor } from "@/components/admin/HeroEditor";
import { DisciplinesEditor } from "@/components/admin/DisciplinesEditor";
import { MosaicEditor } from "@/components/admin/MosaicEditor";
import { WorkshopEditor } from "@/components/admin/WorkshopEditor";

export default async function HomepageAdmin() {
  await requireSession();
  const [hero, disciplines, mosaic, workshop, projects] = await Promise.all([
    loadContent("home.hero"),
    loadContent("disciplines"),
    loadContent("home.mosaic"),
    loadContent("home.workshop"),
    listPublishedProjects(),
  ]);

  return (
    <AdminPage
      title="Homepage"
      lede="Four sections, in the order a visitor scrolls past them. Pick one to change it."
      viewHref="/"
      viewLabel="See the homepage"
    >
      <Tabs defaultValue="hero">
        <TabsList className="h-auto w-full justify-start gap-7 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="hero"
            className="-mb-px rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-[0.9375rem] font-normal text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >Hero</TabsTrigger>
          <TabsTrigger
            value="disciplines"
            className="-mb-px rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-[0.9375rem] font-normal text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >What we do</TabsTrigger>
          <TabsTrigger
            value="mosaic"
            className="-mb-px rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-[0.9375rem] font-normal text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >Featured</TabsTrigger>
          <TabsTrigger
            value="workshop"
            className="-mb-px rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-[0.9375rem] font-normal text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >Workshop</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="pt-8">
          <HeroEditor initial={hero} />
        </TabsContent>
        <TabsContent value="disciplines" className="pt-8">
          <DisciplinesEditor initial={disciplines} />
        </TabsContent>
        <TabsContent value="mosaic" className="pt-8">
          <MosaicEditor initial={mosaic} projects={projects} />
        </TabsContent>
        <TabsContent value="workshop" className="pt-8">
          <WorkshopEditor initial={workshop} />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
