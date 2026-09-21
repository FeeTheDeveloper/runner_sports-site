import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseJuiceReelCsv } from "@/lib/juice-reel/parser";
import { dedupeJuiceReelRows } from "@/lib/juice-reel/dedupe";
import { normalizeLeg, normalizeTicket } from "@/lib/juice-reel/normalize";
import type { Json } from "@/lib/supabase/database.types";

// runner_bets/runner_bet_legs are typed as the loose RunnerTable alias
// (Record<string, Json | undefined>) rather than generated columns, so a
// named interface variable needs this cast to satisfy the index signature
// supabase-js expects — the shape itself is still whatever normalize.ts produced.
type JsonRecord = Record<string, Json | undefined>;

export interface JuiceReelImportResult {
  importRunId: string;
  rawRows: number;
  uniqueTickets: number;
  uniqueLegs: number;
  parseWarnings: string[];
}

export async function importJuiceReelCsv(csvText: string, filename?: string): Promise<JuiceReelImportResult> {
  const supabase = getSupabaseServerClient();
  const { rows, warnings } = parseJuiceReelCsv(csvText);
  const { tickets, legs } = dedupeJuiceReelRows(rows);

  const { data: importRun, error: runError } = await supabase
    .from("runner_import_runs")
    .insert({
      source: "juice_reel",
      filename: filename ?? null,
      total_rows: rows.length,
      unique_bets: tickets.length,
      unique_legs: legs.length,
      status: "processing",
    })
    .select("id")
    .single();
  if (runError || !importRun) throw runError ?? new Error("Failed to create import run");

  const importRunId = (importRun as { id: string }).id;

  const normalizedTickets = tickets.map((row) => ({
    ...normalizeTicket(row),
    import_run_id: importRunId,
  }));

  const { error: betError } = await supabase
    .from("runner_bets")
    .upsert(normalizedTickets as unknown as JsonRecord[], { onConflict: "juice_bet_id" });
  if (betError) {
    await markFailed(importRunId, betError);
    throw betError;
  }

  const normalizedLegs = legs.map(normalizeLeg);
  const { error: legError } = await supabase
    .from("runner_bet_legs")
    .upsert(normalizedLegs as unknown as JsonRecord[], { onConflict: "bet_leg_id" });
  if (legError) {
    await markFailed(importRunId, legError);
    throw legError;
  }

  await supabase
    .from("runner_import_runs")
    .update({
      status: warnings.length ? "completed_with_errors" : "completed",
      rows_inserted: normalizedTickets.length + normalizedLegs.length,
      error_summary: warnings.length ? { parseWarnings: warnings } : null,
    })
    .eq("id", importRunId);

  return {
    importRunId,
    rawRows: rows.length,
    uniqueTickets: normalizedTickets.length,
    uniqueLegs: normalizedLegs.length,
    parseWarnings: warnings,
  };
}

async function markFailed(importRunId: string, error: unknown) {
  const supabase = getSupabaseServerClient();
  await supabase
    .from("runner_import_runs")
    .update({
      status: "failed",
      error_summary: { message: error instanceof Error ? error.message : String(error) },
    })
    .eq("id", importRunId);
}
