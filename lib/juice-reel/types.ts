// Raw Juice Reel CSV export shape. Every field is a string — CSVs carry no
// types — and normalize.ts is the only place that parses these into the
// numbers/dates/booleans runner_bets and runner_bet_legs expect.
export interface JuiceReelRow {
  juice_bet_id: string;
  sportsbook: string;
  books_bet_id: string;
  risk_amount: string;
  max_potential_win: string;
  bet_result: string;
  amount_won_or_lost: string;
  odds_american: string;
  number_of_legs: string;
  date_placed: string;
  date_settled: string;
  date_synced: string;
  if_freeplay_then_amount_actually_at_risk: string;
  is_odds_boosted: string;
  clv_percent: string;
  bet_leg_id: string;
  leg_type: string;
  bet_on: string;
  bet_on_spread_total_number: string;
  if_duration_bet: string;
  leg_sport: string;
  leg_league: string;
  leg_vig: string;
  leg_description: string;
  long_description_of_leg: string;
  event_start_date: string;
  event_name: string;
  bet_tag_details: string;
}
