import { headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Deliberately does NOT mount SiteChrome. Lenis hijacks scroll and the
 * difference-blend cursor hides the caret — both make form UI unusable.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Touching headers() opts the admin out of static rendering, which is correct:
  // it is per-user and must never be cached at the edge.
  await headers();

  return (
    <div className="admin-scope min-h-dvh bg-background text-foreground">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-12">{children}</main>
      <Toaster position="bottom-right" />
    </div>
  );
}
