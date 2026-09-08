import "server-only";
import { assertRunnerMcpToken } from "@/lib/auth/runnerMcp";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export const RUNNER_CONTROL_COMMANDS = [
  "HEALTH_CHECK",
  "REFRESH_MARKETS",
  "REFRESH_PROVIDER",
  "FORCE_PUBLISH",
  "PAUSE_INGESTION",
  "RESUME_INGESTION",
  "RUN_REPLAY",
  "RUN_BACKTEST",
  "REFRESH_GAME",
] as const;
export type RunnerControlCommand = (typeof RUNNER_CONTROL_COMMANDS)[number];

export async function submitRunnerControlCommand(
  command: RunnerControlCommand,
  args: Record<string, unknown>,
  token: string,
  idempotencyKey?: string,
) {
  assertRunnerMcpToken(token);
  const client = getSupabaseServerClient();
  const requestKey = idempotencyKey?.trim() || `${command}:${Date.now()}`;
  if (idempotencyKey?.trim()) {
    const { data: existing, error: lookupError } = await client
      .from("runner_control_commands")
      .select("id, command_type, status, requested_at, expires_at")
      .eq("idempotency_key", requestKey)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return existing;
  }
  const { data, error } = await client
    .from("runner_control_commands")
    .insert({ command_type: command, arguments: args as Json, status: "PENDING", idempotency_key: requestKey })
    .select("id, command_type, status, requested_at, expires_at")
    .single();
  if (error) throw error;
  return data;
}

export async function getRunnerControlResult(commandId: string, token: string) {
  assertRunnerMcpToken(token);
  const { data, error } = await getSupabaseServerClient()
    .from("runner_control_results")
    .select("*")
    .eq("command_id", commandId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
