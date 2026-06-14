import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Capture a visitor's email for an upcoming feature (e.g. the mailed booklet).
// No auth: written with the service-role key, so anonymous visitors work.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const source =
    typeof body?.source === "string" ? body.source.slice(0, 40) : null;

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const admin = createAdminClient();
  // Idempotent: a repeat signup hits the unique-email constraint and is
  // silently ignored rather than erroring.
  const { error } = await admin
    .from("notify_emails")
    .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("notify insert failed:", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
