// Validates required environment variables at boot so a missing key fails
// fast with a clear message instead of surfacing deep inside a data fetch.

const REQUIRED_VARS = [
  "ODDS_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
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
