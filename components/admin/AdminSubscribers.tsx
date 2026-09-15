"use client";

import { useEffect, useState } from "react";

interface ClerkUserResult {
  id: string;
  email: string | null;
  fullName: string | null;
  subscriptionStatus: unknown;
  runnerPlan: unknown;
  role: unknown;
}

interface ManualGrant {
  id: string;
  email: string;
  clerk_user_id: string | null;
  granted_by: string;
  granted_at: string;
  expires_at: string | null;
  reason: string | null;
  notes: string | null;
  active: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
}

export default function AdminSubscribers() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<ClerkUserResult[]>([]);

  const [grants, setGrants] = useState<ManualGrant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(true);

  const [formEmail, setFormEmail] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formExpires, setFormExpires] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadGrants() {
    setGrantsLoading(true);
    try {
      const response = await fetch("/api/admin/grants");
      const payload = (await response.json()) as { grants?: ManualGrant[] };
      setGrants(payload.grants ?? []);
    } finally {
      setGrantsLoading(false);
    }
  }

  useEffect(() => {
    loadGrants();
  }, []);

  async function searchUsers(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(query.trim())}`);
      const payload = (await response.json()) as { users?: ClerkUserResult[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Search failed.");
      setResults(payload.users ?? []);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function grantAccess(email: string, clerkUserId?: string) {
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/admin/grants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          clerkUserId,
          reason: formReason || undefined,
          expiresAt: formExpires ? new Date(formExpires).toISOString() : undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to grant access.");
      setFormEmail("");
      setFormReason("");
      setFormExpires("");
      await loadGrants();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to grant access.");
    } finally {
      setSubmitting(false);
    }
  }

  async function revokeGrant(id: string) {
    await fetch(`/api/admin/grants/${id}`, { method: "PATCH" });
    await loadGrants();
  }

  return (
    <div className="space-y-8">
      <section className="data-panel space-y-4 p-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-text">Find a subscriber</h2>
        <form onSubmit={searchUsers} className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="user@example.com"
            type="email"
            className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-text outline-none"
          />
          <button type="submit" disabled={searching} className="rounded-lg bg-accent px-5 py-3 text-xs font-black uppercase text-white disabled:opacity-50">
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {searchError && <p className="text-xs text-accent">{searchError}</p>}
        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
                <div>
                  <p className="font-bold text-text">{user.fullName ?? user.email}</p>
                  <p className="text-xs text-text-subtle">{user.email}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    plan: {String(user.runnerPlan ?? "none")} · status: {String(user.subscriptionStatus ?? "none")} · role: {String(user.role ?? "member")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => user.email && grantAccess(user.email, user.id)}
                  className="rounded-lg border border-accent px-4 py-2 text-xs font-black uppercase text-accent disabled:opacity-50"
                >
                  Grant full access
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="data-panel space-y-4 p-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-text">Grant access by email</h2>
        <p className="text-xs text-text-muted">Use this if the person hasn&apos;t signed up yet, or you don&apos;t need to search Clerk first. The grant activates automatically the moment that email signs in.</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={formEmail}
            onChange={(event) => setFormEmail(event.target.value)}
            placeholder="user@example.com"
            type="email"
            className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-text outline-none"
          />
          <input
            value={formReason}
            onChange={(event) => setFormReason(event.target.value)}
            placeholder="Reason (optional)"
            className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-text outline-none"
          />
          <input
            value={formExpires}
            onChange={(event) => setFormExpires(event.target.value)}
            type="date"
            className="rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-text outline-none"
          />
          <button
            type="button"
            disabled={submitting || !formEmail.trim()}
            onClick={() => grantAccess(formEmail.trim())}
            className="rounded-lg bg-accent px-5 py-3 text-xs font-black uppercase text-white disabled:opacity-50"
          >
            Grant access
          </button>
        </div>
        {formError && <p className="text-xs text-accent">{formError}</p>}
      </section>

      <section className="data-panel space-y-4 p-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-text">Manual access grants</h2>
        {grantsLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : grants.length === 0 ? (
          <p className="text-sm text-text-muted">No manual grants yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="text-[10px] uppercase tracking-widest text-text-subtle">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Granted by</th>
                  <th className="px-3 py-2">Granted at</th>
                  <th className="px-3 py-2">Expires</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {grants.map((grant) => (
                  <tr key={grant.id} className="border-t border-border">
                    <td className="px-3 py-3 font-bold text-text">{grant.email}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 font-bold ${grant.active ? "bg-positive/10 text-positive" : "bg-border text-text-subtle"}`}>
                        {grant.active ? "ACTIVE" : "REVOKED"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-muted">{grant.granted_by}</td>
                    <td className="px-3 py-3 text-text-muted">{new Date(grant.granted_at).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-text-muted">{grant.expires_at ? new Date(grant.expires_at).toLocaleDateString() : "Never"}</td>
                    <td className="px-3 py-3 text-text-muted">{grant.reason ?? "—"}</td>
                    <td className="px-3 py-3">
                      {grant.active && (
                        <button type="button" onClick={() => revokeGrant(grant.id)} className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-black uppercase text-text-muted hover:border-accent hover:text-accent">
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
