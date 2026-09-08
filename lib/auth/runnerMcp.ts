import "server-only";

const BEARER_PREFIX = "Bearer ";

export function getRunnerMcpBearerToken(): string | undefined {
  const token = process.env.RUNNER_MCP_BEARER_TOKEN?.trim();
  return token || undefined;
}

export function isRunnerMcpAuthorized(request: Request, suppliedToken?: string): boolean {
  const expected = getRunnerMcpBearerToken();
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const received = suppliedToken ?? (header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : "");
  return received.length > 0 && received === expected;
}

export function assertRunnerMcpToken(suppliedToken?: string): void {
  const expected = getRunnerMcpBearerToken();
  if (!expected || !suppliedToken || suppliedToken !== expected) {
    throw new Error("Runner MCP control authentication is not configured or the token is invalid.");
  }
}
