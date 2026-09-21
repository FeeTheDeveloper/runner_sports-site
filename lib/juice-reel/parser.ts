import "server-only";
import Papa from "papaparse";
import type { JuiceReelRow } from "@/lib/juice-reel/types";

export interface ParsedJuiceReelCsv {
  rows: JuiceReelRow[];
  warnings: string[];
}

export function parseJuiceReelCsv(csvText: string): ParsedJuiceReelCsv {
  const result = Papa.parse<JuiceReelRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return {
    rows: result.data,
    warnings: result.errors.map((error) => `Row ${error.row ?? "?"}: ${error.message}`),
  };
}
