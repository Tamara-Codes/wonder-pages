"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ticket, Home } from "@/components/icons";
import { BrandLockup } from "@/components/brand";

/**
 * The one header used on every page, so navigation is identical everywhere.
 * Brand → home, plus Create / My games, and a Log in or credits chip.
 * Pass `print` on in-game screens so it's hidden when printing.
 */
export function SiteHeader({ print = false }: { print?: boolean }) {
  const [credits, setCredits] = useState<number | null>(null);
  const pathname = usePathname();
  const onHome = pathname === "/";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user && !data.user.is_anonymous) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", data.user.id)
          .single();
        setCredits(profile?.credits ?? 0);
      }
    });
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border bg-[rgba(255,251,242,0.92)] backdrop-blur ${
        print ? "print:hidden" : ""
      }`}
    >
      <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3.5">
        <Link
          href="/"
          className="font-display text-[22px] font-extrabold inline-flex items-center gap-2"
        >
          <BrandLockup markSize={32} />
        </Link>
        <nav className="flex items-center gap-2.5">
          {!onHome && (
            <Link
              href="/"
              className="shadow-pop-sm lift-sm font-display font-bold text-sm rounded-full bg-card px-5 py-2.5 text-foreground inline-flex items-center gap-2"
            >
              <Home size={18} /> Home
            </Link>
          )}
          <Link
            href="/create"
            className="shadow-pop-sm lift-sm font-display font-bold text-sm rounded-full px-5 py-2.5 text-white"
            style={{ background: "var(--pink)" }}
          >
            Create
          </Link>
          <Link
            href="/games"
            className="shadow-pop-sm lift-sm font-display font-bold text-sm rounded-full px-5 py-2.5 text-white"
            style={{ background: "var(--pink)" }}
          >
            My games
          </Link>
          {credits === null ? (
            <Link
              href="/login"
              className="lift-sm font-display font-bold text-sm rounded-full px-5 py-2.5 border-2"
              style={{
                background: "rgba(33,199,182,0.10)",
                color: "var(--teal-d)",
                borderColor: "rgba(33,199,182,0.4)",
              }}
            >
              Log in
            </Link>
          ) : (
            <Link
              href="/buy"
              className="lift-sm font-display font-bold text-sm rounded-full px-5 py-2.5 inline-flex items-center gap-2 border-2"
              style={{
                background: "rgba(33,199,182,0.10)",
                color: "var(--teal-d)",
                borderColor: "rgba(33,199,182,0.4)",
              }}
            >
              <Ticket size={18} /> {credits} {credits === 1 ? "game" : "games"}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
