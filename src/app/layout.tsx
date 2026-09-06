import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { brand } from "@/lib/brand";
import "./globals.css";

// Self-hosted, preloaded, swap — no render-blocking Google @import, no FOUT.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-hanken",
  display: "swap",
});
const description =
  "BM Carpentry & Landscaping builds decking, pergolas, cladding, fencing, retaining walls and complete outdoor living spaces across Sydney. Licensed carpenters and landscapers delivering handcrafted timber and hardscape work.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bmcarpentry.com.au"),
  title: {
    default: `${brand.fullName} — Sydney Carpentry & Landscaping`,
    template: `%s — ${brand.fullName}`,
  },
  description,
  keywords: [
    "carpentry Sydney",
    "landscaping Sydney",
    "decking Sydney",
    "pergola builder Sydney",
    "timber cladding",
    "fencing",
    "retaining walls",
    "outdoor living",
    "hardwood decking",
    "landscape construction",
  ],
  alternates: { canonical: "/" },
  authors: [{ name: brand.fullName }],
  creator: brand.fullName,
  openGraph: {
    title: `${brand.fullName} — Sydney Carpentry & Landscaping`,
    description,
    type: "website",
    locale: "en_AU",
    siteName: brand.fullName,
    url: "https://bmcarpentry.com.au",
    images: [{ url: "/images/earlwood-2.webp", width: 1200, height: 675, alt: brand.fullName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.fullName} — Sydney Carpentry & Landscaping`,
    description,
    images: ["/images/earlwood-2.webp"],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#231F20",
};

// LocalBusiness structured data — the single biggest local-SEO lever for a
// trades business. Lets Google surface hours, area served, contact + socials.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  name: brand.fullName,
  description,
  url: "https://bmcarpentry.com.au",
  email: brand.email,
  telephone: brand.phones.map((p) => p.number),
  image: "https://bmcarpentry.com.au/images/earlwood-2.webp",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sydney",
    addressRegion: "NSW",
    addressCountry: "AU",
  },
  areaServed: brand.coverage.map((c) => ({ "@type": "Place", name: c })),
  sameAs: brand.social.map((s) => s.href),
  knowsAbout: [
    "Carpentry",
    "Landscaping",
    "Decking",
    "Pergolas",
    "Timber cladding",
    "Fencing",
    "Retaining walls",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hanken.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
