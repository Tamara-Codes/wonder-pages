/**
 * One-time coloring-catalog builder (admin-only).
 *
 * Generates a bounded BATCH of blank coloring pages for ONE theme + difficulty,
 * uploads them, and inserts `coloring_catalog` rows. This is the only place the
 * booklet flow ever pays for coloring art: run once to seed the shared library,
 * after which every booklet's coloring pages are selected from it for free.
 *
 * Kept small (a few images per call) so it stays under the function timeout;
 * scripts/build-coloring-catalog.mjs drives it across all themes × difficulties.
 *
 * Auth: requires the CATALOG_ADMIN_SECRET (Bearer or `secret` in the body), so
 * a leaked URL can't run up a Gemini bill.
 */
import { NextResponse } from "next/server";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateImage } from "@/lib/gemini";
import { buildColoringPrompt } from "@/lib/coloring";
import { THEME_MAP, type ThemeId } from "@/lib/themes";
import { DIFFICULTY_MAP, type DifficultyId } from "@/lib/difficulty";

export const runtime = "nodejs";
export const maxDuration = 60;

// Hard cap per request so one call can't blow the timeout or the budget.
const MAX_BATCH = 6;

export async function POST(request: Request) {
  const secret = process.env.CATALOG_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    body?.secret;
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const theme = body?.theme as ThemeId | undefined;
  const difficulty = body?.difficulty as DifficultyId | undefined;
  const count = Math.min(MAX_BATCH, Math.max(1, Number(body?.count) || 1));

  if (!theme || !THEME_MAP[theme] || !difficulty || !DIFFICULTY_MAP[difficulty]) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const created: { id: string; image_url: string }[] = [];
  const errors: string[] = [];

  // Sequential, not parallel: image gen is heavy and we'd rather not trip rate
  // limits or the timeout. The driver script handles overall throughput.
  for (let i = 0; i < count; i++) {
    try {
      const image = await generateImage(buildColoringPrompt(theme, difficulty));
      const png = await sharp(image).png().toBuffer();

      const id = crypto.randomUUID();
      const path = `catalog/${theme}/${difficulty}/${id}.png`;
      const { error: uploadError } = await admin.storage
        .from("pages")
        .upload(path, png, { contentType: "image/png", upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = admin.storage.from("pages").getPublicUrl(path);

      const { error: insertError } = await admin.from("coloring_catalog").insert({
        id,
        theme,
        difficulty,
        image_url: publicUrl,
      });
      if (insertError) throw insertError;

      created.push({ id, image_url: publicUrl });
    } catch (err) {
      console.error(`catalog gen failed (${theme}/${difficulty}):`, err);
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return NextResponse.json({
    theme,
    difficulty,
    requested: count,
    created: created.length,
    images: created,
    errors,
  });
}
