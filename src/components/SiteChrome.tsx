import { Cursor } from "@/components/Cursor";
import { Loader } from "@/components/Loader";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { SmoothScroll } from "@/components/SmoothScroll";

/**
 * The public site's shell: Lenis smooth scroll, the blend-mode cursor, the
 * loader curtain, nav and footer.
 *
 * Extracted so the root 404 can mount it too — a global not-found renders under
 * the ROOT layout, not under (site)'s, so without this it would come out as bare
 * text on a white page. The admin deliberately does not use it: Lenis and the
 * difference-blend cursor make form UI unusable.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <Loader />
      <SiteNav />
      <main className="min-h-dvh">{children}</main>
      <SiteFooter />
    </>
  );
}
