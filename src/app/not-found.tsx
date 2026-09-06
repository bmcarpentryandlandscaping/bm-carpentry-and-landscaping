import { SiteChrome } from "@/components/SiteChrome";
import NotFound from "./(site)/not-found";

/**
 * Root fallback for URLs that match no route at all. Next renders this under the
 * ROOT layout, which no longer carries the nav or footer — so mount the chrome
 * explicitly and reuse the group's 404 body.
 */
export default function RootNotFound() {
  return (
    <SiteChrome>
      <NotFound />
    </SiteChrome>
  );
}
