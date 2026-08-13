// Shared domain types for Runner Sports

export interface Sport {
  id: string;
  name: string;
  slug: string;
}

export interface Game {
  id: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  status: "scheduled" | "live" | "final";
}

export interface Prop {
  id: string;
  gameId: string;
  player: string;
  market: string;
  line: number;
  overOdds: number;
  underOdds: number;
}

export interface TrackerEntry {
  id: string;
  propId: string;
  result: "win" | "loss" | "push" | "pending";
  stake: number;
  payout: number;
  createdAt: string;
}

export interface EdgeModel {
  id: string;
  name: string;
  description: string;
  version: string;
}
