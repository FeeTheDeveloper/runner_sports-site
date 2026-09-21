"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  importRunId: string;
  rawRows: number;
  uniqueTickets: number;
  uniqueLegs: number;
  parseWarnings: string[];
}

export default function ImportPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport(event: React.FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/performance/import", { method: "POST", body });
      const payload = (await response.json()) as (ImportResult & { ok: true }) | { ok: false; error: string };
      if (!response.ok || !payload.ok) throw new Error("error" in payload ? payload.error : "Import failed.");
      setResult(payload);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="data-panel space-y-4 p-6">
      <h2 className="text-sm font-black uppercase tracking-wider text-text">Import Juice Reel CSV</h2>
      <p className="text-xs text-text-muted">
        Tickets are deduplicated by <code className="text-text">juice_bet_id</code> and upserted, so re-importing the same export is
        safe.
      </p>
      <form onSubmit={handleImport} className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          required
          className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-text outline-none"
        />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-lg bg-accent px-5 py-3 text-xs font-black uppercase text-white disabled:opacity-50"
        >
          {uploading ? "Importing…" : "Import"}
        </button>
      </form>
      {error && <p className="text-xs text-negative">{error}</p>}
      {result && (
        <p className="text-xs text-positive">
          Imported {result.uniqueTickets} tickets and {result.uniqueLegs} legs from {result.rawRows} rows.
          {result.parseWarnings.length > 0 && ` ${result.parseWarnings.length} parse warning(s).`}
        </p>
      )}
    </section>
  );
}
