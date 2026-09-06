import { requireSession } from "@/lib/auth";
import { listMedia, listMediaUsage } from "../_actions/media";
import { AdminPage } from "@/components/admin/AdminPage";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export default async function MediaPage() {
  await requireSession();
  const [res, usage] = await Promise.all([listMedia(), listMediaUsage()]);

  return (
    <AdminPage
      title="Media"
      lede="Every photo and video you can choose from. Each one says where it appears on the site, so you can see what is safe to remove. Drop new ones in here — they are resized for the web automatically."
    >
      {res.ok ? (
        <MediaLibrary initial={res.data} usage={usage.ok ? usage.data : {}} />
      ) : (
        <p className="text-sm text-destructive">{res.error}</p>
      )}
    </AdminPage>
  );
}
