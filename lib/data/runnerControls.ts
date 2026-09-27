import "server-only";

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
  // Keep the legacy API fail-closed for callers outside the MCP route as well.
  void command; void args; void token; void idempotencyKey;
  throw new Error("Remote Runner controls are disabled pending scoped transport authentication and approval receipts.");
}

export async function getRunnerControlResult(commandId: string, token: string) {
  void commandId; void token;
  throw new Error("Remote Runner command results are disabled pending scoped transport authentication.");
}
