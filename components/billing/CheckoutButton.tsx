"use client";

import { useState } from "react";
import type { PaidPlanId } from "@/lib/billing/plans";

export default function CheckoutButton({ plan, enabled }: { plan: PaidPlanId; enabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function beginCheckout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Checkout is unavailable.");
      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is unavailable.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={!enabled || pending}
        onClick={beginCheckout}
        className="w-full rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {pending ? "Opening secure checkout…" : enabled ? "Choose access" : "Stripe price pending"}
      </button>
      {error ? <p className="mt-2 text-xs text-accent">{error}</p> : null}
    </div>
  );
}
