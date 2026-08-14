import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json(
    { data, ...(meta ? { meta } : {}) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export function notFound(resource: string, id: string) {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: `${resource} '${id}' was not found` } },
    { status: 404 },
  );
}

export function filterValue(value: string, expected: string | null) {
  return !expected || value.toLowerCase() === expected.toLowerCase();
}

export function paginate<T>(items: T[], searchParams: URLSearchParams) {
  const requestedLimit = Number(searchParams.get("limit") ?? 50);
  const requestedOffset = Number(searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100) : 50;
  const offset = Number.isFinite(requestedOffset) ? Math.max(Math.trunc(requestedOffset), 0) : 0;

  return {
    data: items.slice(offset, offset + limit),
    meta: { total: items.length, limit, offset },
  };
}
