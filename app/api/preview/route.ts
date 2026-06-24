import { NextResponse } from "next/server";
import { buildPreview, type PreviewOpts } from "@/lib/preview-build";
import { isProductId } from "@/lib/products";
import { THEME_MAP, type ThemeId } from "@/lib/themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Render a representative preview of a configured book. Pure code (no AI), so
// it's free to call as the customer tweaks options in the wizard.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !isProductId(body.product)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const theme: ThemeId | undefined =
    typeof body.theme === "string" && body.theme in THEME_MAP ? body.theme : undefined;
  const ageRaw = Number(body.age);
  const age = Number.isInteger(ageRaw) && ageRaw >= 3 && ageRaw <= 8 ? ageRaw : undefined;
  const language = body.language === "en" || body.language === "hr" ? body.language : undefined;

  const s = (v: unknown, max: number) =>
    typeof v === "string" ? v.slice(0, max) : undefined;

  const opts: PreviewOpts = {
    childName: typeof body.childName === "string" ? body.childName.slice(0, 80) : "",
    childSurname: s(body.childSurname, 80),
    gender: body.gender === "boy" || body.gender === "girl" ? body.gender : undefined,
    theme,
    age,
    language,
    coverActivity: s(body.coverActivity, 80),
    coverAlphabet: s(body.coverAlphabet, 80),
    coverNumbers: s(body.coverNumbers, 80),
    dedication: s(body.dedication, 120),
    alphabetByline: s(body.alphabetByline, 80),
    // alphabet keepsake leaves (pre-localized strings from the caller)
    posveta: s(body.posveta, 220),
    nameLeafLabel: s(body.nameLeafLabel, 60),
    diplomaTitle: s(body.diplomaTitle, 60),
    diplomaIntro: s(body.diplomaIntro, 80),
    diplomaBody: s(body.diplomaBody, 200),
  };

  try {
    const pages = await buildPreview(body.product, opts);
    return NextResponse.json({ pages });
  } catch (e) {
    console.error("preview build failed:", e);
    return NextResponse.json({ error: "preview_failed" }, { status: 500 });
  }
}
