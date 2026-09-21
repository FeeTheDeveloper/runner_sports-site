import type { JuiceReelRow } from "@/lib/juice-reel/types";

// Ticket financial data (risk, payout, result) repeats once per leg in the
// Juice Reel export. Retaining more than one row per juice_bet_id would
// double-count a multi-leg ticket's risk/P/L — so this is the only place
// that collapses ticket rows, and it must stay ticket-identity-first.
export function dedupeJuiceReelRows(rows: JuiceReelRow[]) {
  const ticketMap = new Map<string, JuiceReelRow>();
  const legMap = new Map<string, JuiceReelRow>();

  for (const row of rows) {
    if (row.juice_bet_id && !ticketMap.has(row.juice_bet_id)) {
      ticketMap.set(row.juice_bet_id, row);
    }
    if (row.bet_leg_id) {
      legMap.set(row.bet_leg_id, row);
    }
  }

  return {
    tickets: [...ticketMap.values()],
    legs: [...legMap.values()],
  };
}
