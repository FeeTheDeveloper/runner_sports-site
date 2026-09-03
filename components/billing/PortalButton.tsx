"use client";

import { useState } from "react";

export default function PortalButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Billing portal is unavailable.");
      window.location.assign(payload.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Billing portal is unavailable.");
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={openPortal} disabled={pending} className="rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50">
        {pending ? "Opening…" : "Manage billing"}
      </button>
      {error ? <p className="mt-2 text-xs text-accent">{error}</p> : null}
    </div>
  );
}
