/**
 * /print — the whole ABC book on one page, every leaf sized to A5, ready to
 * print to PDF (browser Print → paper size A5 → Save as PDF). This is an
 * internal tool for fulfilling orders by hand, NOT part of the shop.
 *
 * Defaults to the Croatian alphabet edition. Switch booklet with `book=numbers`
 * (the "Moji prvi brojevi" 0–9 set). Personalize via query params:
 *   /print?name=Ema&possessive=Emina&surname=Horvat&gender=girl&lang=hr&posveta=Sretan%20rođendan!
 *   /print?book=numbers&name=Ema&possessive=Emini&gender=girl
 *
 * The leaves are pre-built HTML (lib/print-build), so this server component just
 * injects the print stylesheet and drops them in. Fonts come from the root
 * layout's next/font variables (--font-display etc.).
 */
import { buildPrintLeaves, buildNumbersPrintLeaves, PRINT_CSS, type PrintOpts } from "@/lib/print-build";
import type { LanguageId } from "@/lib/alphabet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const lang: LanguageId = one(sp.lang) === "en" ? "en" : "hr";
  const gender = one(sp.gender);
  const opts: PrintOpts = {
    language: lang,
    childName: one(sp.name),
    childSurname: one(sp.surname),
    gender: gender === "boy" || gender === "girl" ? gender : undefined,
    posveta: one(sp.posveta),
    possessive: one(sp.possessive),
  };

  const leaves = one(sp.book) === "numbers" ? buildNumbersPrintLeaves(opts) : buildPrintLeaves(opts);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <main dangerouslySetInnerHTML={{ __html: leaves.join("") }} />
    </>
  );
}
