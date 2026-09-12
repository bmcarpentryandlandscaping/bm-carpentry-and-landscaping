import Link from "next/link";
import { brand } from "@/lib/brand";
import { getSiteDetails } from "@/lib/content";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  // { href: "/journal", label: "Journal" }, // journal disabled 2026-08, keep for later
  { href: "/contact", label: "Contact" },
];

function SocialIcon({ label }: { label: string }) {
  if (label === "Instagram") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="3.8" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (label === "LinkedIn") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3.2 9.2h3.6V21H3.2zM9.4 9.2H13v1.6h.05c.5-.9 1.74-1.86 3.58-1.86 3.83 0 4.54 2.4 4.54 5.52V21h-3.6v-5.3c0-1.26-.02-2.9-1.78-2.9-1.78 0-2.05 1.36-2.05 2.8V21H9.4z" />
      </svg>
    );
  }
  return null;
}

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const { licence } = await getSiteDetails();

  return (
    <footer className="surface-deep relative overflow-hidden border-t border-current/12">
      {/* oversized monogram watermark — depth, seated off the bottom-right edge */}
      <span
        aria-hidden
        className="brand-logo pointer-events-none absolute -bottom-24 -right-16 opacity-[0.04] md:-bottom-32 md:-right-10"
        style={{ width: 460, height: 460, transition: "none" }}
      />
      <div className="relative mx-auto max-w-[1600px] px-6 py-16 md:px-12 md:py-20">
        {/* brand + columns */}
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          {/* brand */}
          <div className="md:col-span-5">
            <img
              src="/logos/BMCL_LOGO_WHITE_ORANGE_LONG.png"
              alt={brand.fullName}
              width={1500}
              height={482}
              className="h-20 w-auto md:h-24"
            />
          </div>

          {/* index */}
          <nav className="md:col-span-3 md:col-start-7">
            <p className="eyebrow opacity-40">Index</p>
            <ul className="mt-4 flex flex-col gap-2 text-base">
              {navLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="arrow-link inline-flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* contact */}
          <div className="md:col-span-3">
            <p className="eyebrow opacity-40">Find us</p>
            <address className="mt-4 text-base not-italic leading-relaxed opacity-80">
              {brand.address.line1}
              <br />
              {brand.address.line2}
            </address>
            <a
              href={`mailto:${brand.email}`}
              className="arrow-link mt-4 inline-flex items-center gap-2 text-base opacity-80 transition-opacity hover:opacity-100"
            >
              {brand.email}
            </a>
            <ul className="mt-1.5 flex flex-col gap-1">
              {brand.phones.map((p) => (
                <li key={p.href}>
                  <a
                    href={p.href}
                    className="block w-fit text-base opacity-60 transition-opacity hover:opacity-100"
                  >
                    {p.name}: {p.number}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="mt-5 flex gap-6 text-sm">
              {brand.social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="social-link">
                    <SocialIcon label={s.label} />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* legal */}
        <div className="mt-14 flex flex-col gap-3 border-t border-current/10 pt-6 text-xs opacity-50 md:flex-row md:items-center md:justify-between">
          <span>
            © {year} {brand.fullName}
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {/* Blank until the client enters one in Admin → Site details. */}
            {licence && <span>Licence No. {licence}</span>}
            <Link href="/privacy" className="transition-opacity hover:opacity-100">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
