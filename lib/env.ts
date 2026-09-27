// Validates required environment variables at boot so a missing key fails
// fast with a clear message instead of surfacing deep inside a data fetch.

const REQUIRED_VARS = [
  "ODDS_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

type Env = Record<RequiredVar, string>;

function readEnv(): Env {
  const missing: string[] = [];
  const values = {} as Env;

  for (const key of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      values[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. ` +
        "See .env.example for what each one is for.",
    );
  }

  return values;
}

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) {
    cached = readEnv();
  }
  return cached;
}

// Identity and billing storage do not depend on an odds-provider credential.
export function getSupabaseEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const expectedProject = process.env.SUPABASE_EXPECTED_PROJECT_REF?.trim();
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server connection is not configured.");
  if (!expectedProject || !/^[a-z0-9]{20}$/.test(expectedProject)) throw new Error("Expected Supabase project binding is not configured.");
  const url = new URL(SUPABASE_URL);
  if (url.protocol !== "https:" || url.hostname !== `${expectedProject}.supabase.co` || url.port || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) throw new Error("Supabase connection does not match the approved project binding.");
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
}
