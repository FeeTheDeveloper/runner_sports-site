import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

let cached: ReturnType<typeof createClient<Database>> | undefined;

// Service-role client for server-side reads/writes (API routes, cron jobs).
// Never import this into a client component — it bypasses row-level security.
export function getSupabaseServerClient() {
  if (!cached) {
    const env = getEnv();
    cached = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return cached;
}
