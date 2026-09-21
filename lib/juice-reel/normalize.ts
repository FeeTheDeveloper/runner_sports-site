import type { JuiceReelRow } from "@/lib/juice-reel/types";

function nullableNumber(value?: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableInteger(value?: string | null): number | null {
  const parsed = nullableNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function nullableDate(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function booleanValue(value?: string | null): boolean {
  return value?.trim().toLowerCase() === "true";
}

function safeJson(value?: string | null): unknown {
  if (!value?.trim()) return [];
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export interface NormalizedTicket {
  juice_bet_id: number;
  sportsbook: string;
  books_bet_id: string | null;
  risk_amount: number | null;
  max_potential_win: number | null;
  bet_result: string | null;
  amount_won_or_lost: number | null;
  odds_american: number | null;
  number_of_legs: number;
  date_placed: string | null;
  date_settled: string | null;
  date_synced: string | null;
  freeplay_amount_at_risk: number | null;
  is_odds_boosted: boolean;
  clv_percent: number | null;
  source: "juice_reel";
  raw_ticket: JuiceReelRow;
}

export function normalizeTicket(row: JuiceReelRow): NormalizedTicket {
  return {
    juice_bet_id: Number(row.juice_bet_id),
    sportsbook: row.sportsbook?.trim() || "Unknown",
    books_bet_id: row.books_bet_id?.trim() || null,
    risk_amount: nullableNumber(row.risk_amount),
    max_potential_win: nullableNumber(row.max_potential_win),
    bet_result: row.bet_result?.trim() || null,
    amount_won_or_lost: nullableNumber(row.amount_won_or_lost),
    odds_american: nullableInteger(row.odds_american),
    number_of_legs: nullableInteger(row.number_of_legs) ?? 1,
    date_placed: nullableDate(row.date_placed),
    date_settled: nullableDate(row.date_settled),
    date_synced: nullableDate(row.date_synced),
    freeplay_amount_at_risk: nullableNumber(row.if_freeplay_then_amount_actually_at_risk),
    is_odds_boosted: booleanValue(row.is_odds_boosted),
    clv_percent: nullableNumber(row.clv_percent),
    source: "juice_reel",
    raw_ticket: row,
  };
}

export interface NormalizedLeg {
  bet_leg_id: number;
  juice_bet_id: number;
  leg_type: string | null;
  bet_on: string | null;
  spread_total_number: number | null;
  duration: string | null;
  sport: string | null;
  league: string | null;
  leg_vig: number | null;
  leg_description: string | null;
  long_description: string | null;
  event_start_date: string | null;
  event_name: string | null;
  bet_tag_details: unknown;
}

export function normalizeLeg(row: JuiceReelRow): NormalizedLeg {
  return {
    bet_leg_id: Number(row.bet_leg_id),
    juice_bet_id: Number(row.juice_bet_id),
    leg_type: row.leg_type?.trim() || null,
    bet_on: row.bet_on?.trim() || null,
    spread_total_number: nullableNumber(row.bet_on_spread_total_number),
    duration: row.if_duration_bet?.trim() || null,
    sport: row.leg_sport?.trim() || null,
    league: row.leg_league?.trim() || null,
    leg_vig: nullableInteger(row.leg_vig),
    leg_description: row.leg_description?.trim() || null,
    long_description: row.long_description_of_leg?.trim() || null,
    event_start_date: nullableDate(row.event_start_date),
    event_name: row.event_name?.trim() || null,
    bet_tag_details: safeJson(row.bet_tag_details),
  };
}
