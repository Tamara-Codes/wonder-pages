import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateImage, detectObjects } from "@/lib/gemini";
import { pickFindItems, findItemLabel } from "@/lib/sprites";
import { variationPhrase } from "@/lib/variation";
import { GAME_MAP, type GameId } from "@/lib/games";
import { THEME_MAP, type ThemeId } from "@/lib/themes";
import { DIFFICULTY_MAP, type DifficultyId, type Difficulty } from "@/lib/difficulty";
import type { FindItAnswer, FoundItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREE_GAMES = 1;

function buildPrompt(
  game: GameId,
  theme: ThemeId,
  difficulty: DifficultyId,
  itemLabels: string[] = [],
): string {
  const subject = THEME_MAP[theme].prompt;
  if (game === "coloring") {
    return `Black and white coloring book page for young children. Subject: ${subject}. Bold clean black outlines only, absolutely no shading, no grey, no color fill, pure white background. ${DIFFICULTY_MAP[difficulty].coloringStyle} Centered full-page composition. ${variationPhrase(game)}`;
  }
  // find-it — the image model draws the checklist items AS PART of the scene
  // (a later detection pass finds where they ended up). They must be clearly
  // visible and well separated so detection — and a child — can spot them.
  const items = itemLabels.map((l) => `a ${l.toLowerCase()}`).join(", ");
  return `A busy children's seek-and-find picture, packed edge to edge with many small friendly objects. Theme: ${subject}. Naturally include these specific objects somewhere in the scene, each one fully visible (not hidden, cropped or covered), clearly recognizable, well separated from each other and placed in different areas: ${items}. STRICT FLAT VECTOR STICKER STYLE: solid flat color fills only, absolutely no gradients, no grain, no texture, no noise, no painterly shading, no soft lighting, no drop shadows. Bold uniform black outlines of even thickness around every object, like clean vector clip-art on a sticker sheet. Crisp digital cartoon. No text, no words, no letters. Flat full-bleed background filling the entire image. ${variationPhrase(game)}`;
}

/**
 * Generate a Find It! scene with the checklist items drawn in, then detect
 * where they landed. Retries once if the first attempt yields too few items.
 */
async function makeFindIt(
  theme: ThemeId,
  difficulty: DifficultyId,
  level: Difficulty,
): Promise<{ png: Buffer; answerKey: FindItAnswer }> {
  const wantedKeys = pickFindItems(level.findItCount);
  const wantedLabels = wantedKeys.map(findItemLabel);

  let best: { png: Buffer; items: FoundItem[]; W: number; H: number } | null =
    null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const image = await generateImage(
      buildPrompt("find-it", theme, difficulty, wantedLabels),
    );
    const png = await sharp(image).png().toBuffer();
    const meta = await sharp(png).metadata();
    const W = meta.width ?? 1024;
    const H = meta.height ?? 1024;

    // Detect on a small JPEG copy — far smaller payload than a flat-vector PNG,
    // much faster, and detection doesn't need lossless. Boxes are normalized
    // 0–1000, so they map back onto the full-size image.
    const detectImg = await sharp(png)
      .resize(640, 640, { fit: "inside" })
      .jpeg({ quality: 80 })
      .toBuffer();
    const boxes = await detectObjects(detectImg, wantedLabels, "image/jpeg");
    const items = matchItems(wantedKeys, boxes, W, H);

    if (!best || items.length > best.items.length) best = { png, items, W, H };
    if (items.length >= wantedKeys.length) break; // found them all
  }

  // Need at least a couple of findable items for a playable game.
  if (!best || best.items.length < 2) {
    throw new Error("find-it: too few items detected");
  }
  return {
    png: best.png,
    answerKey: { imgW: best.W, imgH: best.H, items: best.items },
  };
}

/** Pair each requested item with a detected box (by label), in image pixels. */
function matchItems(
  keys: string[],
  boxes: { label: string; box: [number, number, number, number] }[],
  W: number,
  H: number,
): FoundItem[] {
  const used = new Set<number>();
  const items: FoundItem[] = [];
  for (const key of keys) {
    const label = findItemLabel(key);
    const want = label.toLowerCase();
    const idx = boxes.findIndex((b, i) => {
      if (used.has(i)) return false;
      const got = b.label.toLowerCase();
      return got === want || got.includes(want) || want.includes(got);
    });
    if (idx === -1) continue;
    used.add(idx);
    const [ymin, xmin, ymax, xmax] = boxes[idx].box;
    const x = Math.round((xmin / 1000) * W);
    const y = Math.round((ymin / 1000) * H);
    const w = Math.max(1, Math.round(((xmax - xmin) / 1000) * W));
    const h = Math.max(1, Math.round(((ymax - ymin) / 1000) * H));
    items.push({ key, label, x, y, w, h });
  }
  return items;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const game = body?.game as GameId | undefined;
  const theme = body?.theme as ThemeId | undefined;
  const difficulty = body?.difficulty as DifficultyId | undefined;
  const titleInput = typeof body?.title === "string" ? body.title : undefined;

  if (
    !game ||
    !GAME_MAP[game] ||
    !theme ||
    !THEME_MAP[theme] ||
    !difficulty ||
    !DIFFICULTY_MAP[difficulty]
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const level = DIFFICULTY_MAP[difficulty];

  // Identify the player from their session cookie (anonymous or permanent).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Gate: anonymous users get FREE_GAMES, then must log in. Logged-in users
  // spend one credit per game (refunded below if generation fails).
  if (user.is_anonymous) {
    const { count } = await admin
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= FREE_GAMES) {
      return NextResponse.json({ error: "login_required" }, { status: 403 });
    }
  } else {
    const { data: remaining, error } = await admin.rpc("consume_credit", {
      uid: user.id,
    });
    if (error) {
      console.error("consume_credit failed:", error);
      return NextResponse.json({ error: "credit_error" }, { status: 500 });
    }
    if (typeof remaining !== "number" || remaining < 0) {
      return NextResponse.json({ error: "payment_required" }, { status: 402 });
    }
  }

  // Give the credit back if anything after this point fails.
  const refund = async () => {
    if (!user.is_anonymous) {
      await admin.rpc("increment_credits", { uid: user.id, n: 1 });
    }
  };

  // 1. Generate the artwork (+ answer key for Find It!).
  //    Coloring: a single image. Find It!: the model draws the checklist items
  //    into the scene, then a detection pass tells us where they are.
  let answerKey: FindItAnswer | null = null;
  let png: Buffer;
  try {
    if (game === "find-it") {
      const result = await makeFindIt(theme, difficulty, level);
      png = result.png;
      answerKey = result.answerKey;
    } else {
      const image = await generateImage(buildPrompt(game, theme, difficulty));
      png = await sharp(image).png().toBuffer();
    }
  } catch (err) {
    console.error("Generation failed:", err);
    await refund();
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  // 3. Store the image (service role bypasses RLS; bucket is public-read).
  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.png`;
  const { error: uploadError } = await admin.storage
    .from("pages")
    .upload(path, png, { contentType: "image/png", upsert: true });

  if (uploadError) {
    console.error("Upload failed:", uploadError);
    await refund();
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("pages").getPublicUrl(path);

  // 4. Save the row.
  const title =
    titleInput?.trim().slice(0, 80) ||
    `${THEME_MAP[theme].name} ${GAME_MAP[game].name}`;
  const { error: insertError } = await admin.from("games").insert({
    id,
    user_id: user.id,
    type: game,
    theme,
    difficulty,
    title,
    image_url: publicUrl,
    answer_key: answerKey,
  });

  if (insertError) {
    console.error("Insert failed:", insertError);
    await refund();
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ id });
}
