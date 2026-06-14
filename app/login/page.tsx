"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Wand } from "@/components/icons";
import { BrandLockup } from "@/components/brand";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const limit = params.get("reason") === "limit";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${location.origin}/auth/callback`;

    try {
      const { data } = await supabase.auth.getUser();
      // If they're currently anonymous, attach the email to that SAME account
      // so their free game is kept. Otherwise send a normal magic link.
      const { error } = data.user?.is_anonymous
        ? await supabase.auth.updateUser({ email })
        : await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectTo },
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
    <main className="relative flex-1 grid place-items-center p-6 overflow-hidden">
      <div className="relative w-full max-w-sm text-center">
        <Link
          href="/"
          className="font-display text-2xl font-extrabold inline-flex items-center gap-2 mb-7"
        >
          <BrandLockup markSize={30} />
        </Link>

        {sent ? (
          <div className="rounded-3xl bg-card p-8 shadow-pop">
            <div className="tile mx-auto h-16 w-16" style={{ background: "var(--teal)" }}>
              <Mail size={30} />
            </div>
            <h1 className="font-display text-2xl font-extrabold mt-4">
              Check your email!
            </h1>
            <p className="text-muted font-semibold mt-3">
              We sent a magic link to <strong>{email}</strong>. Tap it to keep
              creating games.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-card p-8 shadow-pop">
            <div className="tile mx-auto h-16 w-16" style={{ background: "var(--teal)" }}>
              <Wand size={30} />
            </div>
            <h1 className="font-display text-2xl font-extrabold mt-4">
              {limit ? "Keep the magic going" : "Log in"}
            </h1>
            <p className="text-muted font-semibold mt-2 text-sm">
              {limit
                ? "You've used your free game. Log in to create as many as you like — your saved game comes with you."
                : "Create and replay as many games as you like."}
            </p>

            <form onSubmit={sendLink} className="mt-6 flex flex-col gap-3">
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
              <p className="text-sm font-semibold text-red-500 mt-4">{error}</p>
            )}
            <p className="text-xs font-semibold text-muted mt-6">
              For grown-ups. By logging in you agree to look after the magic
              responsibly. 💫
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
