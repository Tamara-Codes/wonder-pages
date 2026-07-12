import type { Metadata } from "next";
import { Baloo_2, Nunito, Fredoka, Caveat, Sriracha } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

export const metadata: Metadata = {
  title: "Maštograd — personalizirana abeceda za djecu",
  description:
    "Personalizirana prva abeceda za djecu od 3 do 6 godina: za svako slovo listić za bojanje, sličicu i crte za pisanje, u poklon-vrećici s imenom djeteta.",
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
