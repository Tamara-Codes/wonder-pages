import { GoogleGenAI } from "@google/genai";

// Model id is env-overridable so we can swap it without a code change once we
// confirm which image model the key has access to.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
// Vision model used to locate the items the image model drew (Find It!).
const DETECT_MODEL = process.env.GEMINI_DETECT_MODEL ?? "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
function ai() {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
      // Image generation + vision detection can take a while; the SDK default
      // is too short and surfaces as UND_ERR_HEADERS_TIMEOUT.
      httpOptions: { timeout: 120000 },
    });
  }
  return client;
}

/**
 * Generate a single image from a text prompt and return it as PNG bytes.
 * Uses Gemini's image model ("Nano Banana"), which returns the image as an
 * inline base64 part on the response.
 */
export async function generateImage(prompt: string): Promise<Buffer> {
  const response = await ai().models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const data = part.inlineData?.data;
    if (data) {
      return Buffer.from(data, "base64");
    }
  }

  throw new Error("Gemini returned no image data for the prompt.");
}

/**
 * Edit an existing image from a text instruction (image-to-image). Used by
 * Spot the Difference to make scene B by removing a few elements from scene A.
 */
export async function editImage(
  image: Buffer,
  instruction: string,
  mimeType = "image/png",
): Promise<Buffer> {
  const response = await ai().models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: image.toString("base64") } },
          { text: instruction },
        ],
      },
    ],
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
  }
  throw new Error("Gemini returned no edited image.");
}

/**
 * Plain text generation from a prompt (no image, no vision). Used by Odd One
 * Out to have the model invent the category sets. Returns the concatenated
 * text parts; callers parse JSON out of it themselves.
 */
export async function generateText(prompt: string): Promise<string> {
  const response = await ai().models.generateContent({
    model: DETECT_MODEL,
    contents: prompt,
  });
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  let text = "";
  for (const part of parts) if (typeof part.text === "string") text += part.text;
  return text;
}

/** One detected object: a normalized [ymin, xmin, ymax, xmax] box (0–1000). */
export interface DetectedBox {
  label: string;
  box: [number, number, number, number];
}

/** Parse a Gemini detection reply (named-edge boxes, tolerant of prose/fences). */
function parseBoxes(text: string): DetectedBox[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v));
  const ok = (n: number) => Number.isFinite(n);
  const out: DetectedBox[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const label = typeof e.label === "string" ? e.label : undefined;
    if (!label) continue;
    if (e.xmin != null && e.ymin != null && e.xmax != null && e.ymax != null) {
      const ymin = num(e.ymin),
        xmin = num(e.xmin),
        ymax = num(e.ymax),
        xmax = num(e.xmax);
      if ([ymin, xmin, ymax, xmax].every(ok)) {
        out.push({ label, box: [ymin, xmin, ymax, xmax] });
      }
    }
  }
  return out;
}

/**
 * Open-vocabulary detection: list the distinct, separate elements in an image
 * with boxes (0–1000). Used by Spot the Difference to discover what's in a
 * generated scene so we can pick some at random to change — no fixed label list.
 */
export async function detectElements(
  image: Buffer,
  mimeType = "image/png",
): Promise<DetectedBox[]> {
  const prompt =
    `List the distinct, separate visual elements in this image that a child could point to ` +
    `(individual animals, characters, plants, trees, the sun, clouds, props, etc.). ` +
    `Return ONLY a JSON array, no prose, no markdown, no code fences. ` +
    `For EACH element output an object with EXACTLY these keys: "label", "xmin", "ymin", "xmax", "ymax". ` +
    `The four numbers are integers from 0 to 1000 (x runs left→right, y runs top→bottom). ` +
    `Do NOT use a "box_2d" array. Follow this exact format:\n` +
    `[{"label":"cow","xmin":120,"ymin":60,"xmax":300,"ymax":240}]\n` +
    `Give a TIGHT box around each element. Do not include the sky or the ground/grass background ` +
    `itself. List up to 24 of the clearest, most separated elements.`;

  const response = await ai().models.generateContent({
    model: DETECT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: image.toString("base64") } },
          { text: prompt },
        ],
      },
    ],
  });
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  let text = "";
  for (const part of parts) if (typeof part.text === "string") text += part.text;
  return parseBoxes(text);
}

/** A detected element plus its pixel-silhouette mask (a PNG, may be null). */
export interface SegmentedElement extends DetectedBox {
  /** Gemini's segmentation mask for this element: a greyscale PNG probability
   *  map covering the box. Null if the model didn't return one. */
  mask: Buffer | null;
}

/**
 * Like detectElements, but also asks Gemini 2.5 for a per-element segmentation
 * MASK (a base64 PNG covering each box). Spot the Difference uses these so it can
 * remove an element by its exact silhouette and composite the fill back only over
 * those pixels — guaranteeing the rest of the scene stays identical.
 */
export async function segmentElements(
  image: Buffer,
  mimeType = "image/png",
): Promise<SegmentedElement[]> {
  const prompt =
    `Give the segmentation masks for the distinct, separate visual elements in this ` +
    `image that a child could point to (individual animals, characters, plants, trees, ` +
    `the sun, clouds, props). Do NOT include the sky or the ground/grass background itself. ` +
    `Return ONLY a JSON array, no prose, no markdown, no code fences. For EACH element ` +
    `output an object with EXACTLY these keys: "box_2d" (an array [ymin,xmin,ymax,xmax] of ` +
    `integers 0–1000), "mask" (a base64 PNG data URI of the segmentation mask for that box), ` +
    `and "label" (a short string). List up to 20 of the clearest, most separated elements.`;

  const response = await ai().models.generateContent({
    model: DETECT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: image.toString("base64") } },
          { text: prompt },
        ],
      },
    ],
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  let text = "";
  for (const part of parts) if (typeof part.text === "string") text += part.text;

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const num = (v: unknown) => (typeof v === "number" ? v : Number(v));
  const ok = (n: number) => Number.isFinite(n);
  const out: SegmentedElement[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const label = typeof e.label === "string" ? e.label : undefined;
    const b = e.box_2d;
    if (!label || !Array.isArray(b) || b.length !== 4) continue;
    const box = b.map(num) as [number, number, number, number];
    if (!box.every(ok)) continue;

    let mask: Buffer | null = null;
    if (typeof e.mask === "string" && e.mask) {
      const comma = e.mask.indexOf(",");
      const b64 = comma >= 0 ? e.mask.slice(comma + 1) : e.mask;
      try {
        mask = b64 ? Buffer.from(b64, "base64") : null;
      } catch {
        mask = null;
      }
    }
    out.push({ label, box, mask });
  }
  return out;
}

/**
 * Locate the given objects inside an image using Gemini's 2D object detection.
 * Returns a box per object it can find (normalized to 0–1000, the Gemini
 * convention). Objects it can't find are simply omitted.
 *
 * This is how Find It! gets its answer key: the image model draws the items as
 * part of the scene, then this pass tells us where they ended up — so the code
 * still owns the coordinates, just sourced from detection instead of pasting.
 */
export async function detectObjects(
  image: Buffer,
  labels: string[],
  mimeType = "image/png",
): Promise<DetectedBox[]> {
  const list = labels.map((l) => `"${l}"`).join(", ");
  // Force NAMED coordinate fields via a one-shot example. gemini-2.5-flash
  // otherwise emits a "box_2d" array whose order it flips between runs
  // (sometimes [ymin,xmin,...], sometimes [xmin,ymin,...]) — which would put
  // found-markers in the wrong place. Named edges + an example are unambiguous.
  const prompt =
    `Detect these objects in the image: ${list}. ` +
    `Return ONLY a JSON array, no prose, no markdown, no code fences. ` +
    `For EACH object output an object with EXACTLY these keys: "label", "xmin", "ymin", "xmax", "ymax". ` +
    `The four numbers are integers from 0 to 1000 (x runs left→right, y runs top→bottom). ` +
    `Do NOT use a "box_2d" array. Follow this exact format:\n` +
    `[{"label":"Star","xmin":120,"ymin":60,"xmax":300,"ymax":240}]\n` +
    `List each object at most once. Omit any requested object not clearly present.`;

  const response = await ai().models.generateContent({
    model: DETECT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: image.toString("base64") } },
          { text: prompt },
        ],
      },
    ],
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  let text = "";
  for (const part of parts) {
    if (typeof part.text === "string") text += part.text;
  }

  // The model may wrap the array in prose or ```json fences; grab the array.
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const num = (v: unknown) => (typeof v === "number" ? v : Number(v));
  const ok = (n: number) => Number.isFinite(n);

  const out: DetectedBox[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const label = typeof e.label === "string" ? (e.label as string) : undefined;
    if (!label) continue;

    // Preferred: named edges (unambiguous). DetectedBox.box is [ymin,xmin,ymax,xmax].
    if (
      e.xmin != null &&
      e.ymin != null &&
      e.xmax != null &&
      e.ymax != null
    ) {
      const ymin = num(e.ymin),
        xmin = num(e.xmin),
        ymax = num(e.ymax),
        xmax = num(e.xmax);
      if ([ymin, xmin, ymax, xmax].every(ok)) {
        out.push({ label, box: [ymin, xmin, ymax, xmax] });
        continue;
      }
    }

    // Fallback: an array field, assumed [ymin,xmin,ymax,xmax] (Gemini default).
    const box = (e.box_2d ?? e.box ?? e.bbox) as unknown;
    if (Array.isArray(box) && box.length === 4) {
      const nums = box.map(num);
      if (nums.every(ok)) {
        out.push({ label, box: [nums[0], nums[1], nums[2], nums[3]] });
      }
    }
  }
  return out;
}
