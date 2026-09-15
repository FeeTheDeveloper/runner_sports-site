"use client";

import { useEffect, useState } from "react";
import { VETERAN_DISCOUNT_PERCENT, VETERAN_DISCOUNT_SLA_HOURS, VETERAN_DISCOUNT_VERIFIER } from "@/lib/billing/veteranDiscount";

interface VeteranRequest {
  id: string;
  status: "pending" | "approved" | "denied";
  requested_at: string;
  review_due_at: string;
  reviewed_at: string | null;
  denial_reason: string | null;
}

export default function VeteranDiscountPanel() {
  const [request, setRequest] = useState<VeteranRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/veteran-discount/request")
      .then((response) => response.json())
      .then((payload: { request?: VeteranRequest }) => setRequest(payload.request ?? null))
      .catch(() => setError("Could not load veteran discount status."))
      .finally(() => setLoading(false));
  }, []);

  async function submitRequest() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/veteran-discount/request", { method: "POST" });
      const payload = (await response.json()) as { request?: VeteranRequest; error?: string };
      if (!response.ok || !payload.request) throw new Error(payload.error ?? "Could not submit request.");
      setRequest(payload.request);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const status = request?.status;

  return (
    <section className="data-panel p-6">
      <p className="text-[10px] font-black uppercase tracking-wider text-text-subtle">Veteran discount</p>
      <p className="mt-2 text-sm leading-6 text-text-muted">
        Veterans get {VETERAN_DISCOUNT_PERCENT}% off Runner subscriptions. Verification is handled by{" "}
        {VETERAN_DISCOUNT_VERIFIER} and typically completes within {VETERAN_DISCOUNT_SLA_HOURS} hours.
      </p>

      {loading ? null : status === "approved" ? (
        <p className="mt-4 text-sm font-black uppercase tracking-wider text-positive">
          Verified — {VETERAN_DISCOUNT_PERCENT}% discount applied to your subscription.
        </p>
      ) : status === "pending" ? (
        <p className="mt-4 text-sm text-text">
          Verification requested {new Date(request!.requested_at).toLocaleString()}. {VETERAN_DISCOUNT_VERIFIER} is
          reviewing it — expect a decision by {new Date(request!.review_due_at).toLocaleString()}.
        </p>
      ) : (
        <div className="mt-4">
          {status === "denied" ? (
            <p className="text-sm text-text-muted">
              Your last verification request wasn&apos;t approved{request?.denial_reason ? `: ${request.denial_reason}` : "."} You can
              request another review.
            </p>
          ) : null}
          <button
            type="button"
            onClick={submitRequest}
            disabled={submitting}
            className="mt-3 rounded-lg border border-white/15 px-4 py-3 text-xs font-black uppercase tracking-wider text-text disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Request veteran verification"}
          </button>
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-accent">{error}</p> : null}
    </section>
  );
}
