/**
 * /print — the whole ABC book on one page, every leaf sized to A5, ready to
 * print to PDF (browser Print → paper size A5 → Save as PDF). This is an
 * internal tool for fulfilling orders by hand, NOT part of the shop.
 *
 * Defaults to the Croatian alphabet edition. Switch booklet with `book=numbers`
 * (the current "Moji prvi brojevi" 0–9 set), `book=numbers-test` (a single
 * prototype page), or `book=numbers-v2` (the full 0–9 redesign — word-left +
 * Gemini numeral-character art, see buildNumbersV2PrintLeaves in
 * lib/print-build.ts). Personalize via query params:
 *   /print?name=Ema&possessive=Emina&surname=Horvat&gender=girl&lang=hr&posveta=Sretan%20rođendan!
 *   /print?book=numbers&name=Ema&possessive=Emini&gender=girl
 *   /print?book=numbers-test&name=Ema   (also numbers-play-test, numbers-tasks-test, numbers-kite-test, numbers-zoo-test)
 *   /print?book=numbers-tasks-test&name=Ema
 *   /print?book=numbers-v2&name=Ema&possessive=Emini&gender=girl
 *   /print?book=maze&name=Ema&gender=girl&age=7      (age 4–10 → difficulty)
 *   /print?book=sudoku&name=Ema&gender=girl&age=9    (age 5–10 → grid sizes)
 *
 * The leaves are pre-built HTML (lib/print-build), so this server component just
 * injects the print stylesheet and drops them in. Fonts come from the root
 * layout's next/font variables (--font-display etc.).
 */
import { buildPrintLeaves, buildNumbersPrintLeaves, buildNumberIntroTestLeaves, buildNumberPlayTestLeaves, buildNumberTasksTestLeaves, buildKiteTestLeaves, buildZooTestLeaves, buildColourByNumberTestLeaves, buildLadybugTestLeaves, buildNumbersV2PrintLeaves, PRINT_CSS, type PrintOpts } from "@/lib/print-build";
import { buildMazeBookLeaves } from "@/lib/maze-book";
import { buildSudokuBookLeaves } from "@/lib/sudoku-book";
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
  const ageRaw = Number(one(sp.age));
  const opts: PrintOpts = {
    language: lang,
    childName: one(sp.name),
    childSurname: one(sp.surname),
    gender: gender === "boy" || gender === "girl" ? gender : undefined,
    posveta: one(sp.posveta),
    possessive: one(sp.possessive),
    age: Number.isFinite(ageRaw) ? ageRaw : undefined,
  };

  const book = one(sp.book);
  const leaves =
    book === "numbers" ? buildNumbersPrintLeaves(opts)
    : book === "numbers-test" ? buildNumberIntroTestLeaves(opts.childName)
    : book === "numbers-play-test" ? buildNumberPlayTestLeaves(opts.childName)
    : book === "numbers-tasks-test" ? buildNumberTasksTestLeaves(opts.childName)
    : book === "numbers-kite-test" ? buildKiteTestLeaves(opts.childName)
    : book === "numbers-zoo-test" ? buildZooTestLeaves(opts.childName)
    : book === "numbers-colour-test" ? buildColourByNumberTestLeaves(opts.childName)
    : book === "numbers-ladybug-test" ? buildLadybugTestLeaves(opts.childName)
    : book === "numbers-v2" ? buildNumbersV2PrintLeaves(opts)
    : book === "maze" ? buildMazeBookLeaves(opts)
    : book === "sudoku" ? buildSudokuBookLeaves(opts)
    : buildPrintLeaves(opts);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <main dangerouslySetInnerHTML={{ __html: leaves.join("") }} />
    </>
  );
}
