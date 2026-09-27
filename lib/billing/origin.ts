import "server-only";

export function billingOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) throw new Error("Canonical application origin is not configured.");
  const origin = new URL(configured);
  const local = origin.hostname === "localhost" || origin.hostname === "127.0.0.1";
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash ||
      (origin.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && local && origin.protocol === "http:"))) {
    throw new Error("Canonical application origin is invalid.");
  }
  const callerOrigin = request.headers.get("origin");
  if (callerOrigin && callerOrigin !== origin.origin) throw new Error("Billing request origin is not allowed.");
  return origin.origin;
}
