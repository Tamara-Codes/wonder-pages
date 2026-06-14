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
  const [menuOpen, setMenuOpen] = useState(false);
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

  const closeMenu = () => setMenuOpen(false);

  const authChip = (full = false) =>
    credits === null ? (
      <Link
        href="/login"
        onClick={full ? closeMenu : undefined}
        className={`lift-sm font-display font-bold text-sm rounded-full px-5 py-2.5 border-2 ${
          full ? "flex justify-center" : ""
        }`}
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
        onClick={full ? closeMenu : undefined}
        className={`lift-sm font-display font-bold text-sm rounded-full px-5 py-2.5 inline-flex items-center gap-2 border-2 ${
          full ? "justify-center" : ""
        }`}
        style={{
          background: "rgba(33,199,182,0.10)",
          color: "var(--teal-d)",
          borderColor: "rgba(33,199,182,0.4)",
        }}
      >
        <Ticket size={18} /> {credits} {credits === 1 ? "game" : "games"}
      </Link>
    );

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border bg-[rgba(255,251,242,0.92)] backdrop-blur ${
        print ? "print:hidden" : ""
      }`}
    >
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-3.5 gap-2">
        <Link
          href="/"
          className="font-display text-lg sm:text-[22px] font-extrabold inline-flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          <BrandLockup markSize={28} />
        </Link>

        {/* Desktop nav — full set inline */}
        <nav className="hidden sm:flex items-center gap-2.5">
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
          {authChip()}
        </nav>

        {/* Mobile — primary CTA stays visible, the rest behind a menu */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/create"
            onClick={closeMenu}
            className="shadow-pop-sm lift-sm font-display font-bold text-sm rounded-full px-4 py-2 text-white"
            style={{ background: "var(--pink)" }}
          >
            Create
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="shadow-pop-sm lift-sm grid h-10 w-10 place-items-center rounded-full bg-card text-foreground"
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-2">
          {!onHome && (
            <Link
              href="/"
              onClick={closeMenu}
              className="shadow-pop-sm lift-sm font-display font-bold text-sm rounded-full bg-background px-5 py-2.5 text-foreground inline-flex items-center justify-center gap-2"
            >
              <Home size={18} /> Home
            </Link>
          )}
          <Link
            href="/games"
            onClick={closeMenu}
            className="shadow-pop-sm lift-sm font-display font-bold text-sm rounded-full px-5 py-2.5 text-white flex justify-center"
            style={{ background: "var(--pink)" }}
          >
            My games
          </Link>
          {authChip(true)}
        </nav>
      )}
    </header>
  );
}

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
