import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // a flattened coloring PNG is well under this

/**
 * Save the child's colored version of a coloring page. The browser POSTs the
 * canvas as a PNG; we store it in the `pages` bucket and record its URL on the
 * game's `colored_url` — leaving the blank line art in `image_url` untouched so
 * the page can still be re-coloured or printed blank.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Identify the player (anonymous or permanent) from their session cookie.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  // RLS scopes this to the caller's own rows — so this both fetches the game
  // and proves ownership. Only coloring games carry a saved colored version.
  const { data: game } = await supabase
    .from("games")
    .select("id, type")
    .eq("id", id)
    .single();
  if (!game) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (game.type !== "coloring") {
    return NextResponse.json({ error: "not_coloring" }, { status: 400 });
  }

  const png = Buffer.from(await request.arrayBuffer());
  if (png.length === 0 || png.length > MAX_BYTES) {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  // Stable path keyed to the game, so re-saving overwrites the previous version.
  const admin = createAdminClient();
  const path = `${user.id}/${id}-colored.png`;
  const { error: uploadError } = await admin.storage
    .from("pages")
    .upload(path, png, { contentType: "image/png", upsert: true });
  if (uploadError) {
    console.error("Colored upload failed:", uploadError);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("pages").getPublicUrl(path);

  // Cache-bust: the path is stable across saves, so vary the stored URL to make
  // the My Games thumbnail and re-opened canvas pick up the latest coloring.
  const coloredUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await admin
    .from("games")
    .update({ colored_url: coloredUrl })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updateError) {
    // Log the fields individually — a PostgrestError stringifies to "{}"
    // (message is a non-enumerable Error prop), which hides the real cause.
    console.error("Colored save failed:", {
      message: updateError.message,
      code: updateError.code,
      details: updateError.details,
      hint: updateError.hint,
    });
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ colored_url: coloredUrl });
}
