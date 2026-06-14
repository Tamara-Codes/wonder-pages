import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateImage, editImage, detectObjects, detectElements } from "@/lib/gemini";
import { pickFindItems, findItemLabel } from "@/lib/sprites";
import { variationPhrase } from "@/lib/variation";
import { GAME_MAP, type GameId } from "@/lib/games";
import { THEME_MAP, type ThemeId } from "@/lib/themes";
import { DIFFICULTY_MAP, type DifficultyId, type Difficulty } from "@/lib/difficulty";
import type { AnswerKey, DiffBox, FindItAnswer, FoundItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREE_PER_TYPE = 1;

function buildPrompt(
  game: GameId,
  theme: ThemeId,
  difficulty: DifficultyId,
  itemLabels: string[] = [],
): string {
  const subject = THEME_MAP[theme].prompt;
  if (game === "spot-difference") {
    // A busy, varied scene full of distinct elements we can later change.
    return `A cheerful children's picture-book scene. Theme: ${subject}. Flat 2D vector cartoon style, bright happy colours, simple clean shapes. Fill the scene with lots of DISTINCT, clearly-separated elements spread around — characters, animals, plants, trees, flowers, the sun or clouds, and little props — each one whole, well spaced and not overlapping the others. Leave a small margin so nothing is cropped at the edges. No text, no words, no letters. ${variationPhrase(game)}`;
  }
  if (game === "coloring") {
    return `A single illustration for a young child's coloring book — ONE storybook scene, like a page from a picture book (not a pattern or poster). World to draw from: ${subject}. Pick just ONE main character as the clear focus in the foreground, doing something, set in a simple background with only a few supporting details. COMPOSITION: keep it natural and asymmetric. Do NOT draw the main character more than once, do NOT repeat or duplicate figures, do NOT mirror the left and right halves of the page, and never use a kaleidoscope, mandala, tiled, grid or symmetrical pattern layout. LINE ART: bold, clean black outlines of even weight only — absolutely no shading, no grey, no hatching or cross-hatching, no solid filled-black areas, and no colour at all. Pure white background. Keep shapes large and open with clear gaps so small hands can easily colour inside them. ${DIFFICULTY_MAP[difficulty].coloringStyle} ${variationPhrase(game)}`;
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

/** Rough position words from a 0–1000 box center, to disambiguate edits. */
function posWord(cx: number, cy: number): string {
  const h = cx < 333 ? "left" : cx > 666 ? "right" : "middle";
  const v = cy < 333 ? "top" : cy > 666 ? "bottom" : "middle";
  return v === "middle" && h === "middle" ? "center" : `${v} ${h}`;
}

/**
 * Spot the Difference: draw a busy scene (A), detect its distinct elements, pick
 * some at RANDOM (any element — animal, plant, sun, prop), and edit them out to
 * make scene B. The answer key is the boxes of the elements we confirmed are
 * gone in B (re-detected), so editor drift on untouched areas never counts.
 * Retries once if too few elements / too few removals land.
 */
async function makeSpotDiff(
  theme: ThemeId,
  level: Difficulty,
): Promise<{ png: Buffer; pngB: Buffer; imgW: number; imgH: number; diffs: DiffBox[] }> {
  const N = level.diffCount;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const aRaw = await generateImage(buildPrompt("spot-difference", theme, "medium"));
      const a = await sharp(aRaw)
        .resize({ width: 1024, withoutEnlargement: false })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toBuffer();
      const meta = await sharp(a).metadata();
      const W = meta.width ?? 1024;
      const H = meta.height ?? 1024;

      // Discover elements; keep fair-sized ones (not the whole background, not specks).
      const els = await detectElements(a);
      const cand = els.filter((e) => {
        const fw = (e.box[3] - e.box[1]) / 1000;
        const fh = (e.box[2] - e.box[0]) / 1000;
        const frac = fw * fh;
        return frac > 0.005 && frac < 0.22 && fw < 0.6 && fh < 0.6;
      });
      if (cand.length < 2) throw new Error("spot-diff: too few elements found");

      // Shuffle and take up to N as the change targets.
      for (let i = cand.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cand[i], cand[j]] = [cand[j], cand[i]];
      }
      const targets = cand.slice(0, Math.min(N, cand.length));

      const desc = targets
        .map((t) => `the ${t.label} in the ${posWord((t.box[1] + t.box[3]) / 2, (t.box[0] + t.box[2]) / 2)}`)
        .join("; ");
      const editPrompt =
        `This is a children's picture. Produce an edited copy that is EXACTLY identical — same ` +
        `background, art style, colours, and the same position and appearance of everything else, ` +
        `pixel for pixel — EXCEPT remove these completely and fill each spot with the matching ` +
        `surrounding background so it looks natural and seamless: ${desc}. Do NOT move, add, ` +
        `recolour, resize or redraw anything else, and keep the framing identical. Output only the edited image.`;

      const bRaw = await editImage(a, editPrompt);
      const b = await sharp(bRaw)
        .resize(W, H, { fit: "fill" })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toBuffer();

      // Keep only targets we can confirm actually disappeared in B.
      const bEls = await detectElements(b);
      const confirmed = targets.filter((t) => {
        const tcx = (t.box[1] + t.box[3]) / 2;
        const tcy = (t.box[0] + t.box[2]) / 2;
        return !bEls.some(
          (e) =>
            e.label.toLowerCase() === t.label.toLowerCase() &&
            Math.hypot((e.box[1] + e.box[3]) / 2 - tcx, (e.box[0] + e.box[2]) / 2 - tcy) < 130,
        );
      });
      if (confirmed.length < Math.min(2, N)) {
        throw new Error("spot-diff: edit removed too few elements");
      }

      const diffs: DiffBox[] = confirmed.map((t) => ({
        x: Math.round((t.box[1] / 1000) * W),
        y: Math.round((t.box[0] / 1000) * H),
        w: Math.round(((t.box[3] - t.box[1]) / 1000) * W),
        h: Math.round(((t.box[2] - t.box[0]) / 1000) * H),
      }));
      return { png: a, pngB: b, imgW: W, imgH: H, diffs };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("spot-diff: generation failed");
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

  // Gate: anonymous users get one free game of EACH type (coloring, find-it,
  // spot-difference). A second game of the same type means they must log in.
  // Logged-in users spend one credit per game (refunded below if it fails).
  if (user.is_anonymous) {
    const { count } = await admin
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", game);

    if ((count ?? 0) >= FREE_PER_TYPE) {
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

  // 1. Generate the artwork (+ answer key where the game needs one).
  //    Coloring:      a single AI image.
  //    Find It!:      the model draws the checklist items into the scene, then a
  //                   detection pass tells us where they are.
  //    Spot the Diff: scene A + an edited scene B (a few elements removed); the
  //                   removed boxes are the answer key. B is uploaded separately.
  let answerKey: AnswerKey | null = null;
  let png: Buffer;
  let spot: { pngB: Buffer; imgW: number; imgH: number; diffs: DiffBox[] } | null = null;
  try {
    if (game === "find-it") {
      const result = await makeFindIt(theme, difficulty, level);
      png = result.png;
      answerKey = result.answerKey;
    } else if (game === "spot-difference") {
      const result = await makeSpotDiff(theme, level);
      png = result.png;
      spot = { pngB: result.pngB, imgW: result.imgW, imgH: result.imgH, diffs: result.diffs };
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

  // 3b. Spot the Difference also stores scene B; its URL + the changed boxes
  //     become the answer key.
  if (spot) {
    const pathB = `${user.id}/${id}-b.png`;
    const { error: uploadBError } = await admin.storage
      .from("pages")
      .upload(pathB, spot.pngB, { contentType: "image/png", upsert: true });
    if (uploadBError) {
      console.error("Upload (B) failed:", uploadBError);
      await refund();
      return NextResponse.json({ error: "upload_failed" }, { status: 500 });
    }
    const {
      data: { publicUrl: publicUrlB },
    } = admin.storage.from("pages").getPublicUrl(pathB);
    answerKey = { imgW: spot.imgW, imgH: spot.imgH, imageB: publicUrlB, diffs: spot.diffs };
  }

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
