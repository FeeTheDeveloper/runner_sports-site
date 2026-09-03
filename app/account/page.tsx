import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";
import { isClerkConfigured } from "@/lib/auth/config";

export default async function AccountPage() {
  const user = isClerkConfigured() ? await currentUser() : null;

  return (
    <div className="space-y-7">
      <ProductHeading eyebrow="Runner Identity" title="Account" description="Your identity, access and saved intelligence settings." />
      <section className="data-panel p-6">
        {user ? (
          <>
            <p className="text-xs font-black uppercase tracking-wider text-accent">Signed in</p>
            <h2 className="mt-2 text-2xl font-black text-text">{user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Runner user"}</h2>
            <p className="mt-2 text-sm text-text-muted">{user.primaryEmailAddress?.emailAddress}</p>
            <div className="mt-6 flex gap-3"><Link href="/billing" className="rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase text-white">Billing</Link><Link href="/picks" className="rounded-lg border border-border px-4 py-3 text-xs font-black uppercase text-text">Best plays</Link></div>
          </>
        ) : (
          <><p className="text-sm text-text-muted">Clerk is not active in this environment yet. The protected account path is ready for the production keys.</p><Link href="/sign-in" className="mt-5 inline-block rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase text-white">Open sign in</Link></>
        )}
      </section>
    </div>
  );
}
