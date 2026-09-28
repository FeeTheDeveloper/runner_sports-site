import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";
import Badge from "@/components/ui/Badge";
import OwnerBadge from "@/components/ui/OwnerBadge";
import { isClerkConfigured } from "@/lib/auth/config";
import { getRunnerAccess } from "@/lib/auth/access";
import { OWNER_BADGE } from "@/lib/auth/owner";

export const dynamic = "force-dynamic";

const ENTITLEMENT_LABELS: Record<string, string> = {
  none: "Not signed in",
  free: "Free account",
  active: "Active subscription",
  manual_access: "Complimentary access",
  trial: "Trial",
  past_due: "Payment needed",
  canceled: "Canceled",
  suspended: "Suspended",
  admin: "Administrator",
  owner: "Permanent access",
};

export default async function AccountPage() {
  const user = isClerkConfigured() ? await currentUser() : null;
  const access = await getRunnerAccess();

  return (
    <div className="space-y-7">
      <ProductHeading eyebrow="Runner Identity" title="Account" description="Your identity, access and saved intelligence settings." />
      <section className="data-panel p-6">
        {user ? (
          <>
            <p className="text-xs font-black uppercase tracking-wider text-accent">Signed in</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-text">{user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Runner user"}</h2>
              {access.isOwner ? <OwnerBadge /> : null}
            </div>
            <p className="mt-2 text-sm text-text-muted">{user.primaryEmailAddress?.emailAddress}</p>

            <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-text-subtle">Access level</dt>
                <dd className="mt-2 text-sm font-bold text-text">{ENTITLEMENT_LABELS[access.entitlement] ?? access.entitlement}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-text-subtle">Expires</dt>
                <dd className="mt-2 text-sm font-bold text-text">
                  {access.expiresAt ? new Date(access.expiresAt).toLocaleDateString("en-US") : access.fullAccess ? "Never" : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-text-subtle">Permissions</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={access.fullAccess ? "success" : "default"} label={access.fullAccess ? "Full access" : "Limited"} />
                  {access.isAdmin ? <Badge variant="accent" label="Admin" /> : null}
                </dd>
              </div>
            </dl>

            {access.isOwner ? (
              <p className="mt-5 border-t border-border pt-5 text-sm text-text-muted">{OWNER_BADGE.description} This account does not depend on a subscription and cannot expire.</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/billing" className="rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase text-white">Billing</Link>
              <Link href="/picks" className="rounded-lg border border-border px-4 py-3 text-xs font-black uppercase text-text">Best plays</Link>
              {access.isAdmin ? <Link href="/admin" className="rounded-lg border border-border px-4 py-3 text-xs font-black uppercase text-text">Admin</Link> : null}
            </div>
          </>
        ) : (
          <><p className="text-sm text-text-muted">Clerk is not active in this environment yet. The protected account path is ready for the production keys.</p><Link href="/sign-in" className="mt-5 inline-block rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase text-white">Open sign in</Link></>
        )}
      </section>
    </div>
  );
}
