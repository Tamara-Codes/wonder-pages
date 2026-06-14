"use client";

import { createClient } from "./client";

/**
 * Ensure the visitor has a Supabase session. If they don't, create an
 * anonymous one so their generated games can be saved and replayed without
 * signing up. Later they can upgrade this anon account to a real one.
 */
export async function ensureSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }
}
