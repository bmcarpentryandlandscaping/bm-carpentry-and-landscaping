"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { signOut } from "@/app/(admin)/admin/_actions/auth";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/media", label: "Media" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  // Logged-out screen: brand only — no section links, no working Sign out.
  if (pathname === "/admin/login") {
    return (
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <Link href="/admin" className="font-display text-lg">
            <BrandMark />
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center gap-8">
          <Link href="/admin" className="font-display text-lg">
            <BrandMark />
          </Link>

          {/* The underline indicator is the site nav's idea, reduced to its
              essentials: no measuring, no sliding span — a form UI does not
              need choreography, it needs to say where you are. */}
          <nav className="hidden gap-7 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="admin-navlink"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-6">
            <Link
              href="/"
              target="_blank"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View site ↗
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Phone: the sections become a scrollable strip under the brand row.
            Negative margin lets it bleed to the screen edge so the last item
            does not look clipped mid-word. */}
        <nav className="-mx-6 flex gap-6 overflow-x-auto px-6 pb-1 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className="admin-navlink shrink-0 whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
