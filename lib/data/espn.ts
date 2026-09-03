import type { EspnRecordDataType, EspnRecordRow, SourceMetadata } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Read layer for ESPN enrichment records persisted by app/api/cron/sync-espn.
// Every row carries its SourceMetadata lineage so consumers can tell provider,
// retrieval time, sport, league, and data type without joining anything.

interface EspnRecordDbRow {
  id: string;
  provider: string;
  sport: string;
  league: string;
  data_type: EspnRecordDataType;
  entity_id: string;
  payload: unknown;
  retrieved_at: string;
  source: SourceMetadata;
}

function mapRow(row: EspnRecordDbRow): EspnRecordRow {
  return {
    id: row.id,
    provider: row.provider,
    sport: row.sport,
    league: row.league,
    dataType: row.data_type,
    entityId: row.entity_id,
    payload: row.payload,
    retrievedAt: row.retrieved_at,
    source: row.source,
  };
}

export interface EspnRecordFilters {
  sport?: string;
  league?: string;
  dataType?: string;
  entityId?: string;
}

export async function getEspnRecords(filters: EspnRecordFilters = {}): Promise<EspnRecordRow[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase.from("espn_records").select("*").order("retrieved_at", { ascending: false });
  if (filters.sport) query = query.eq("sport", filters.sport);
  if (filters.league) query = query.eq("league", filters.league);
  if (filters.dataType) query = query.eq("data_type", filters.dataType);
  if (filters.entityId) query = query.eq("entity_id", filters.entityId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as EspnRecordDbRow[]).map(mapRow);
}

export async function getEspnRecordById(id: string): Promise<EspnRecordRow | undefined> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("espn_records").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as unknown as EspnRecordDbRow) : undefined;
}
