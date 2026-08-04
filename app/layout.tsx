import type { Metadata } from "next";
import { Baloo_2, Nunito, Fredoka, Caveat, Sriracha } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

// Rounded display face used ONLY by the printed leaves / previews
// (lib/print-build.ts, lib/preview-build.ts) via var(--font-baloo).
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fredoka = Fredoka({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Casual handwritten script for the "A is for" / "A kao" connective.
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Bold marker script matching the castle logo: the "Maštograd" wordmark AND
// the site-wide display face (globals.css .font-display points at this).
const sriracha = Sriracha({
  variable: "--font-logo",
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
});

const SITE_URL = "https://www.mastograd.eu";
const SITE_TITLE = "Maštograd — personalizirana abeceda i brojevi za djecu";
const SITE_DESCRIPTION =
  "Personalizirana prva abeceda i brojevi za djecu od 3 do 6 godina: za svako slovo i broj listić za bojanje, sličicu i crte za pisanje, ručno izrađeno u Hrvatskoj i zapakirano kao poklon s imenom djeteta.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s · Maštograd" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "hr_HR",
    url: "/",
    siteName: "Maštograd",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Maštograd — personalizirani listići za bojanje s imenom djeteta" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.jpg"],
  },
};

// Site-wide structured data: who we are. Product + FAQ schema lives on the
// landing page (app/page.tsx) where that content actually renders.
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Maštograd",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: SITE_DESCRIPTION,
  areaServed: { "@type": "Country", name: "Hrvatska" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hr"
      className={`${baloo.variable} ${nunito.variable} ${fredoka.variable} ${caveat.variable} ${sriracha.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
        {children}
        <Analytics />
        <Script
          strategy="afterInteractive"
          src="https://umami-tamara.vercel.app/script.js"
          data-website-id="fec800d1-f943-481f-8846-3e07c2cd8fae"
        />
      </body>
    </html>
  );
}
