import "./node-ws";
import { createClient } from "@supabase/supabase-js";

// Secret-key client for server-only work (storage uploads, trusted inserts).
// NEVER import this into a Client Component — it bypasses Row Level Security.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
