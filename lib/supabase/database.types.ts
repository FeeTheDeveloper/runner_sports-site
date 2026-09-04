// Generated from the live Supabase schema (supabase/migrations/0001_init.sql,
// 0002_multi_provider.sql) via the Supabase MCP `generate_typescript_types`.
// Regenerate after any migration change rather than hand-editing this file.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      espn_records: {
        Row: {
          data_type: string;
          entity_id: string;
          id: string;
          league: string;
          payload: Json;
          provider: string;
          retrieved_at: string;
          source: Json;
          sport: string;
          updated_at: string;
        };
        Insert: {
          data_type: string;
          entity_id: string;
          id: string;
          league: string;
          payload: Json;
          provider?: string;
          retrieved_at: string;
          source: Json;
          sport: string;
          updated_at?: string;
        };
        Update: {
          data_type?: string;
          entity_id?: string;
          id?: string;
          league?: string;
          payload?: Json;
          provider?: string;
          retrieved_at?: string;
          source?: Json;
          sport?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
      prediction_markets: {
        Row: {
          closes_at: string | null;
          event_id: string | null;
          external_id: string;
          id: string;
          implied_probability: number | null;
          last_price: number | null;
          liquidity: number | null;
          market_type: string;
          provider: string;
          raw: Json;
          rules: string | null;
          source_timestamp: string;
          sport: string | null;
          status: string;
          title: string;
          updated_at: string;
          volume: number | null;
          yes_ask: number | null;
          yes_bid: number | null;
        };
        Insert: {
          closes_at?: string | null;
          event_id?: string | null;
          external_id: string;
          id: string;
          implied_probability?: number | null;
          last_price?: number | null;
          liquidity?: number | null;
          market_type?: string;
          provider: string;
          raw?: Json;
          rules?: string | null;
          source_timestamp: string;
          sport?: string | null;
          status: string;
          title: string;
          updated_at?: string;
          volume?: number | null;
          yes_ask?: number | null;
          yes_bid?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["prediction_markets"]["Insert"]>;
        Relationships: [];
      };
      prediction_market_snapshots: {
        Row: {
          captured_at: string;
          id: number;
          implied_probability: number | null;
          last_price: number | null;
          liquidity: number | null;
          market_id: string;
          volume: number | null;
          yes_ask: number | null;
          yes_bid: number | null;
        };
        Insert: {
          captured_at?: string;
          id?: never;
          implied_probability?: number | null;
          last_price?: number | null;
          liquidity?: number | null;
          market_id: string;
          volume?: number | null;
          yes_ask?: number | null;
          yes_bid?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["prediction_market_snapshots"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prediction_market_snapshots_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "prediction_markets";
            referencedColumns: ["id"];
          },
        ];
      };
      prediction_market_game_mappings: {
        Row: {
          confidence: number;
          created_at: string;
          game_id: string;
          id: number;
          mapping_method: string;
          market_id: string;
          verified: boolean;
        };
        Insert: {
          confidence: number;
          created_at?: string;
          game_id: string;
          id?: never;
          mapping_method: string;
          market_id: string;
          verified?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["prediction_market_game_mappings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prediction_market_game_mappings_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "prediction_markets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prediction_market_game_mappings_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
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
      team_registry: {
        Row: {
          abbreviation: string;
          aliases: string[];
          espn_id: string | null;
          id: string;
          league: string;
          logo_url: string | null;
          name: string;
          odds_api_name: string | null;
          updated_at: string;
        };
        Insert: {
          abbreviation: string;
          aliases?: string[];
          espn_id?: string | null;
          id: string;
          league: string;
          logo_url?: string | null;
          name: string;
          odds_api_name?: string | null;
          updated_at?: string;
        };
        Update: {
          abbreviation?: string;
          aliases?: string[];
          espn_id?: string | null;
          id?: string;
          league?: string;
          logo_url?: string | null;
          name?: string;
          odds_api_name?: string | null;
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
