import type { Metadata } from "next";

// page.tsx here is a client component, so canonical lives in this server layout.
export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
