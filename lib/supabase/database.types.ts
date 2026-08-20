// Generated from the live Supabase schema (supabase/migrations/0001_init.sql)
// via the Supabase MCP `generate_typescript_types`. Regenerate after any
// migration change rather than hand-editing this file.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      games: {
        Row: {
          away_team: Json;
          book_odds: Json;
          home_team: Json;
          id: string;
          key_factors: string[];
          league: string;
          source: Json;
          sport_id: string;
          starts_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          away_team: Json;
          book_odds?: Json;
          home_team: Json;
          id: string;
          key_factors?: string[];
          league: string;
          source: Json;
          sport_id: string;
          starts_at: string;
          status: string;
          updated_at?: string;
        };
        Update: {
          away_team?: Json;
          book_odds?: Json;
          home_team?: Json;
          id?: string;
          key_factors?: string[];
          league?: string;
          source?: Json;
          sport_id?: string;
          starts_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      market_movements: {
        Row: {
          captured_at: string;
          current_line: number | null;
          current_price: number;
          direction: string;
          event: string;
          id: string;
          market: string;
          opening_line: number | null;
          opening_price: number;
          source: Json;
          sportsbook: string;
          updated_at: string;
        };
        Insert: {
          captured_at: string;
          current_line?: number | null;
          current_price: number;
          direction: string;
          event: string;
          id: string;
          market: string;
          opening_line?: number | null;
          opening_price: number;
          source: Json;
          sportsbook: string;
          updated_at?: string;
        };
        Update: {
          captured_at?: string;
          current_line?: number | null;
          current_price?: number;
          direction?: string;
          event?: string;
          id?: string;
          market?: string;
          opening_line?: number | null;
          opening_price?: number;
          source?: Json;
          sportsbook?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      props: {
        Row: {
          book_odds: Json;
          game_id: string;
          id: string;
          market: string;
          matchup_context: string | null;
          opponent: string;
          player: Json;
          recent_hit_rate: number | null;
          source: Json;
          sport: string;
          updated_at: string;
        };
        Insert: {
          book_odds?: Json;
          game_id: string;
          id: string;
          market: string;
          matchup_context?: string | null;
          opponent: string;
          player: Json;
          recent_hit_rate?: number | null;
          source: Json;
          sport: string;
          updated_at?: string;
        };
        Update: {
          book_odds?: Json;
          game_id?: string;
          id?: string;
          market?: string;
          matchup_context?: string | null;
          opponent?: string;
          player?: Json;
          recent_hit_rate?: number | null;
          source?: Json;
          sport?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "props_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      signals: {
        Row: {
          event: string;
          id: string;
          market: string;
          model_market_delta: number;
          movement: Json;
          note: string;
          updated_at: string;
        };
        Insert: {
          event: string;
          id: string;
          market: string;
          model_market_delta?: number;
          movement: Json;
          note: string;
          updated_at?: string;
        };
        Update: {
          event?: string;
          id?: string;
          market?: string;
          model_market_delta?: number;
          movement?: Json;
          note?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tracked_bets: {
        Row: {
          bet_date: string;
          closing_odds: number | null;
          clv: number | null;
          created_at: string;
          event: string;
          id: string;
          market: string;
          odds: number;
          profit: number;
          result: string;
          selection: string;
          sport: string;
          sportsbook: string;
          stake: number;
        };
        Insert: {
          bet_date: string;
          closing_odds?: number | null;
          clv?: number | null;
          created_at?: string;
          event: string;
          id?: string;
          market: string;
          odds: number;
          profit?: number;
          result: string;
          selection: string;
          sport: string;
          sportsbook: string;
          stake: number;
        };
        Update: {
          bet_date?: string;
          closing_odds?: number | null;
          clv?: number | null;
          created_at?: string;
          event?: string;
          id?: string;
          market?: string;
          odds?: number;
          profit?: number;
          result?: string;
          selection?: string;
          sport?: string;
          sportsbook?: string;
          stake?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
