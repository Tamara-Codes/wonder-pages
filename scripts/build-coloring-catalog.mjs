#!/usr/bin/env node
// One-time builder for the shared coloring catalog.
//
// Drives the admin route (app/api/admin/catalog) across every theme ×
// difficulty, in batches, until each combo has `target` blank coloring pages.
// This is the ONLY step in the whole product that spends real money on AI —
// after it runs once, every booklet's coloring pages are free.
//
// Usage (with the Next app running locally or deployed):
//   BASE_URL=http://localhost:3000 node scripts/build-coloring-catalog.mjs [target] [theme]
//     target  per-(theme,difficulty) image count   (default 6)
//     theme   restrict to one theme id             (default: all)
//
// Reads CATALOG_ADMIN_SECRET (and optionally BASE_URL) from .env.local or env.
// Cost guide: 11 themes × 3 levels × target images × ~$0.04 each.
//   target 6 ≈ 198 images ≈ ~$8 one-time.

import { readFileSync } from "node:fs";

function loadEnv() {
  const out = { ...process.env };
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m) out[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}
const ENV = loadEnv();
const SECRET = ENV.CATALOG_ADMIN_SECRET;
const BASE = ENV.BASE_URL || "http://localhost:3000";
if (!SECRET) {
  console.error("Missing CATALOG_ADMIN_SECRET (set in .env.local).");
  process.exit(1);
}

// Theme + difficulty ids must match lib/themes.ts and lib/difficulty.ts.
const THEMES = [
  "princess", "unicorns", "space", "dinosaurs", "ocean", "race-cars",
  "ghosts", "mermaids", "animals", "sports", "sweets",
];
const DIFFICULTIES = ["easy", "medium", "hard"];
const MAX_BATCH = 6; // must not exceed the route's MAX_BATCH

const target = Number(process.argv[2]) || 6;
const onlyTheme = process.argv[3];
const themes = onlyTheme ? THEMES.filter((t) => t === onlyTheme) : THEMES;
if (onlyTheme && themes.length === 0) {
  console.error(`Unknown theme "${onlyTheme}". Known: ${THEMES.join(", ")}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function batch(theme, difficulty, count) {
  const res = await fetch(`${BASE}/api/admin/catalog`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET}`,
    },
    body: JSON.stringify({ theme, difficulty, count }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
}

console.log(
  `Building catalog: ${themes.length} themes × ${DIFFICULTIES.length} levels × ${target} → ${themes.length * DIFFICULTIES.length * target} images\nBASE=${BASE}\n`,
);

let made = 0;
let failed = 0;
for (const theme of themes) {
  for (const difficulty of DIFFICULTIES) {
    let remaining = target;
    while (remaining > 0) {
      const n = Math.min(MAX_BATCH, remaining);
      try {
        const r = await batch(theme, difficulty, n);
        made += r.created;
        failed += (r.errors?.length ?? 0);
        console.log(
          `${theme}/${difficulty}: +${r.created}/${n}` +
            (r.errors?.length ? `  (${r.errors.length} errs)` : ""),
        );
      } catch (err) {
        failed += n;
        console.log(`${theme}/${difficulty}: BATCH FAILED — ${err.message}`);
      }
      remaining -= n;
      await sleep(1000); // be gentle on rate limits
    }
  }
}

console.log(`\nDone. Created ${made} images, ${failed} failures.`);
