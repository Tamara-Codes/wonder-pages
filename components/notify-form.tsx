"use client";

import { useState } from "react";
import { Mail } from "@/components/icons";

type State = "idle" | "busy" | "done" | "error";

/**
 * Email capture for an upcoming feature. Posts to /api/notify, which stores the
 * address server-side (no login needed). `source` tags where the signup came
 * from so demand can be reviewed per surface.
 */
export function NotifyForm({ source = "booklet" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy" || state === "done") return;
    setState("busy");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-5 font-display font-bold text-foreground">
        You&apos;re on the list! We&apos;ll email you the moment it&apos;s ready
        💛
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <label htmlFor="notify-email" className="sr-only">
        Your email
      </label>
      <div className="relative flex-1">
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden
        >
          <Mail size={18} />
        </span>
        <input
          id="notify-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="you@email.com"
          className="w-full rounded-full border border-border bg-card py-3.5 pl-11 pr-4 font-semibold text-foreground shadow-pop-sm outline-none focus:border-purple"
        />
      </div>
      <button
        type="submit"
        disabled={state === "busy"}
        className="btn-glow font-display font-extrabold text-white rounded-full px-7 py-3.5 shrink-0 disabled:opacity-60"
        style={{ background: "var(--purple)" }}
      >
        {state === "busy" ? "Adding…" : "Notify me"}
      </button>
      {state === "error" && (
        <p className="font-display font-semibold text-sm text-pink sm:basis-full">
          Something went wrong — please try again.
        </p>
      )}
    </form>
  );
}
