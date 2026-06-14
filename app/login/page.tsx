"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail } from "@/components/icons";
import { BrandLockup, WonderMark } from "@/components/brand";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

/** Google's multicolor "G" mark. */
function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44c11 0 20-8 20-20 0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const limit = params.get("reason") === "limit";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redirectTo = () => `${location.origin}/auth/callback`;

  async function continueWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setError(error.message);
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data } = await supabase.auth.getUser();
      // If they're currently anonymous, attach the email to that SAME account
      // so their free games are kept. Otherwise send a normal magic link.
      const { error } = data.user?.is_anonymous
        ? await supabase.auth.updateUser({ email })
        : await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectTo() },
          });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 grid lg:grid-cols-2 min-h-full">
      {/* ── Left — pink panel: image + "time to pay" message ─────── */}
      <aside
        className="hidden lg:flex flex-col p-12 text-white"
        style={{ background: "var(--pink)" }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-display text-2xl font-extrabold text-white"
        >
          <WonderMark size={34} />
          Wonder Pages
        </Link>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Image
            src="/hero-find-it.png"
            alt="A colorful ocean seek-and-find scene made with Wonder Pages."
            width={600}
            height={600}
            className="w-[80%] max-w-[360px] h-auto rounded-3xl shadow-2xl"
          />
          <div className="mt-10">
            <h2 className="font-display text-3xl font-extrabold leading-tight">
              Loved your free games?
            </h2>
            <p className="mt-3 text-lg font-semibold text-white/90 max-w-[42ch] mx-auto">
              You get one of each game free. Want more? Log in — token packs
              are coming very soon.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right — blue panel: the actual login ─────────────────── */}
      <section
        className="flex items-center justify-center p-6 sm:p-12"
        style={{ background: "var(--teal)" }}
      >
        <div className="w-full max-w-sm rounded-[28px] bg-card p-8 shadow-pop text-center">
          <Link
            href="/"
            className="font-display text-xl font-extrabold inline-flex items-center gap-2 mb-6"
          >
            <BrandLockup markSize={26} />
          </Link>

          {sent ? (
            <>
              <div
                className="tile mx-auto h-16 w-16"
                style={{ background: "var(--teal)" }}
              >
                <Mail size={30} />
              </div>
              <h1 className="font-display text-2xl font-extrabold mt-4">
                Check your email!
              </h1>
              <p className="text-muted font-semibold mt-3">
                We sent a magic link to <strong>{email}</strong>. Tap it to keep
                creating games.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-extrabold">
                {limit ? "Want more? Log in & pay" : "Log in"}
              </h1>
              <p className="text-muted font-semibold mt-2 text-sm">
                {limit
                  ? "You've used your free game. Logging in is how you'll buy token packs to make more."
                  : "Log in to buy token packs and make more games."}
              </p>

              <button
                type="button"
                onClick={continueWithGoogle}
                className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-full border-2 border-border bg-white px-5 py-3 font-display font-bold text-foreground lift"
              >
                <GoogleMark size={20} />
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3 text-muted">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={sendLink} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="grown-up@email.com"
                  className="rounded-full border-2 border-border px-5 py-3 font-semibold outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="font-display font-extrabold text-white bg-brand rounded-full px-6 py-3.5 btn-glow disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Email me a magic link"}
                </button>
              </form>

              {error && (
                <p className="text-sm font-semibold text-red-500 mt-4">
                  {error}
                </p>
              )}
              <p className="text-xs font-semibold text-muted mt-6">
                For grown-ups. Making more games needs a token pack — coming
                soon. 💫
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
