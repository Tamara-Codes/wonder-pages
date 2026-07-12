/**
 * print-book — render the print book ONE PAGE PER FILE for review, and (with
 * --pdf) assemble the final A5 PDF. This drives a headless Chromium over the
 * real /print route, so the output is pixel-identical to "browser Print → Save
 * as PDF" — same next/font fonts, same icon art, same layout.
 *
 * Workflow:
 *   1. node scripts/print-book.mjs                 → print-out/abc/page-NN-*.png
 *   2. eyeball the PNGs, fix the data/art/layout, re-run step 1
 *   3. node scripts/print-book.mjs --pdf           → print-out/abc/book.pdf
 *
 * Flags (all optional):
 *   --book=abc|numbers|numbers-v2|maze|sudoku|numbers-*-test   which booklet (default abc)
 *   --age=7              child's age (maze 4–10, sudoku 5–10 → difficulty)
 *   --name=Ema           child's name (default Ema)
 *   --possessive=Emina   possessive form for the cover headline
 *   --surname=Horvat     surname (shown on the diploma)
 *   --gender=girl|boy    accent colour + grammatical endings
 *   --posveta="…"        dedication text (defaults to the built-in message)
 *   --lang=hr|en         alphabet edition (default hr; numbers is hr-only)
 *   --pdf                also write the combined book PDF
 *   --png=false          skip the per-page PNGs (use with --pdf for PDF only)
 *   --scale=3            PNG pixel density (3 ≈ 1675×2381 px per A5 page)
 *   --out=DIR            output dir (default print-out/<book>)
 *   --base-url=URL       reuse a running server (e.g. http://localhost:3000)
 *                        instead of this script spawning its own `next dev`
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, rm, readdir } from "node:fs/promises";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.replace(/^--/, "").split("=");
    return [m[0], m.length > 1 ? m.slice(1).join("=") : "true"];
  }),
);

// Any value the /print route understands (abc | numbers | numbers-v2 |
// numbers-*-test); "abc" is the default and maps to no query param.
const book = args.book && args.book !== "true" ? args.book : "abc";
const wantPng = args.png !== "false";
const wantPdf = args.pdf === "true" || args.pdf === "";
const scale = Number(args.scale) || 3;
const outDir = args.out || join("print-out", book);
const SPAWN_PORT = 3777; // off the usual 3000 so a running `next dev` is untouched

// Query params the /print route understands.
const qp = new URLSearchParams();
if (book !== "abc") qp.set("book", book);
for (const k of ["name", "possessive", "surname", "gender", "posveta", "lang", "age"]) {
  if (args[k] && args[k] !== "true") qp.set(k, args[k]);
}

function slug(label) {
  // Keep unicode letters/digits (so "letter-Ž" survives), drop everything else.
  return label.replace(/[^\p{L}\p{N}-]/gu, "").trim() || "page";
}

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      if (r.ok || r.status === 405) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready in ${timeoutMs / 1000}s`);
}

async function main() {
  let baseUrl = args["base-url"];
  let server = null;

  if (!baseUrl) {
    baseUrl = `http://localhost:${SPAWN_PORT}`;
    console.log(`Starting "next dev" on ${baseUrl} …`);
    // detached:true puts next + its children in their own process group so the
    // teardown can SIGKILL the WHOLE group at once. We call the local next
    // binary directly (not via npx) so server.pid IS the group leader, and we
    // use SIGKILL because `next dev` ignores SIGTERM on its parent CLI (the
    // worker dies and frees the port, but the parent lingers as an orphan).
    const nextBin = join("node_modules", ".bin", "next");
    server = spawn(nextBin, ["dev", "-p", String(SPAWN_PORT)], {
      stdio: ["ignore", "inherit", "inherit"],
      env: { ...process.env },
      detached: true,
    });
    await waitForServer(baseUrl);
  } else {
    console.log(`Using running server at ${baseUrl}`);
  }

  const url = `${baseUrl}/print?${qp.toString()}`;
  console.log(`Rendering ${url}`);

  const browser = await chromium.launch();
  try {
    await mkdir(outDir, { recursive: true });

    // ── Per-page PNGs (screen media — looks like what you see in the browser) ──
    if (wantPng) {
      const page = await browser.newPage({ deviceScaleFactor: scale });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      // Clear stale PNGs so deleted/renamed pages don't linger.
      for (const f of await readdir(outDir)) {
        if (f.endsWith(".png")) await rm(join(outDir, f));
      }

      const leaves = await page.locator(".leaf").all();
      console.log(`${leaves.length} pages → ${outDir}`);
      let i = 0;
      for (const leaf of leaves) {
        i += 1;
        const label = (await leaf.getAttribute("data-leaf")) || `page-${i}`;
        const name = `page-${String(i).padStart(2, "0")}-${slug(label)}.png`;
        await leaf.screenshot({ path: join(outDir, name) });
        console.log(`  ${name}`);
      }
      await page.close();
    }

    // ── Combined book PDF (print media — true A5, vector text) ──
    if (wantPdf) {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const pdfPath = join(outDir, "book.pdf");
      await page.pdf({ path: pdfPath, format: "A5", printBackground: true, preferCSSPageSize: true });
      console.log(`PDF → ${pdfPath}`);
      await page.close();
    }
  } finally {
    await browser.close();
    if (server?.pid) {
      try {
        process.kill(-server.pid, "SIGKILL"); // negative pid = whole process group
      } catch {
        server.kill("SIGKILL");
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
