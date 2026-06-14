// Dev/test reset — refill credits and clear generated games so you can test
// the full flow again. Uses the service-role key (bypasses RLS).
//
//   node scripts/dev-reset.mjs              # credits -> 999 for all profiles, delete all games
//   node scripts/dev-reset.mjs --keep-games # only refill credits, keep existing games
//   node scripts/dev-reset.mjs --credits=50 # refill to a specific amount
//
// NOTE: this is destructive (deletes the games table contents) unless
// --keep-games is passed. Intended for your dev/test Supabase only.
import { readFileSync } from "node:fs";
import { WebSocket as NodeWebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";

// Node < 22 has no global WebSocket; supabase-js eagerly builds a realtime
// client that needs one (mirrors lib/supabase/node-ws.ts).
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = NodeWebSocket;
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const args = process.argv.slice(2);
const keepGames = args.includes("--keep-games");
const credits = Number(
  (args.find((a) => a.startsWith("--credits=")) || "--credits=999").split("=")[1],
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Before
const { count: profilesBefore } = await db
  .from("profiles")
  .select("id", { count: "exact", head: true });
const { count: gamesBefore } = await db
  .from("games")
  .select("id", { count: "exact", head: true });
console.log(`Before: ${profilesBefore ?? 0} profiles, ${gamesBefore ?? 0} games`);

// Refill credits for every profile.
const { error: upErr } = await db
  .from("profiles")
  .update({ credits })
  .gte("credits", -2147483648); // matches all rows
if (upErr) {
  console.error("Credit refill failed:", upErr.message);
  process.exit(1);
}
console.log(`✓ Set credits = ${credits} on all profiles`);

// Clear games so the anonymous "1 free game" gate resets too.
if (!keepGames) {
  const { error: delErr } = await db
    .from("games")
    .delete()
    .gte("created_at", "1970-01-01"); // matches all rows
  if (delErr) {
    console.error("Game delete failed:", delErr.message);
    process.exit(1);
  }
  console.log("✓ Deleted all games rows");
} else {
  console.log("• Kept existing games (--keep-games)");
}

console.log("Done. Reload the app — you can generate again.");
