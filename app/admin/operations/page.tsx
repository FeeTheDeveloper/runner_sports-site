import Link from "next/link";
import { redirect } from "next/navigation";
import ProductHeading from "@/components/ui/ProductHeading";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { getAdminOperations, OperationsAccessError, type ReceiptSection } from "@/lib/operations/status";

export const dynamic = "force-dynamic";

const linkStyle = "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:bg-surface-2";
const receiptMessages: Record<Exclude<ReceiptSection["state"], "available">, string> = {
  empty: "No saved receipts yet. Verify the approved Demon publisher and database setup.",
  unavailable: "Receipts could not be read. Check database configuration, schema and provider availability, then refresh this page.",
  not_configured: "Configure the Runner database connection to read saved receipts.",
  target_mismatch: "The configured database target does not match the verified Runner project. Confirm the project before reading receipts.",
};

function ReceiptList({ section }: { section: ReceiptSection }) {
  if (section.state !== "available") return <p className="rounded-lg border border-border bg-surface-2 p-4 text-sm leading-6 text-text-muted">{receiptMessages[section.state]}</p>;
  return <ul className="divide-y divide-border">
    {section.items.map((item, index) => <li key={`${item.name}-${index}`} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0">
      <div className="min-w-0">
        <p className="font-semibold text-text">{item.name}</p>
        <p className="mt-1 text-xs text-text-muted">Reported state: {item.status.toLowerCase()}</p>
        <p className="mt-2 break-words font-mono text-xs text-text-muted">{item.receivedAt ? <time dateTime={item.receivedAt}>{new Date(item.receivedAt).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "medium" })} UTC</time> : "No valid receipt timestamp"}</p>
      </div>
      <Badge label={item.freshness === "RECENT" ? "Receipt under 5 min" : item.freshness === "STALE" ? "Stale receipt" : "Time unverified"} variant={item.freshness === "RECENT" ? "accent" : "warning"} />
    </li>)}
  </ul>;
}

export default async function OperationsPage() {
  const state = await getAdminOperations().catch(error => {
    if (error instanceof OperationsAccessError) redirect(error.status === 401 ? "/sign-in" : "/account");
    throw error;
  });
  return <div className="space-y-8">
    <ProductHeading eyebrow="Runner owner workspace" title="Operations center" description="Connection evidence, engine receipts and the work required before the next release." actions={<Link href="/admin" className={linkStyle}>Subscriber management</Link>} />

    <section className="runner-card overflow-hidden" aria-labelledby="release-state">
      <div className="flex flex-col gap-5 border-l-4 border-warning p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-warning">Release acceptance</p>
          <h2 id="release-state" className="mt-2 text-2xl font-black text-text">Production gates remain open</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">Confirm hosting, production identity, payment ownership and database acceptance. Configuration presence alone does not clear a release gate.</p>
        </div>
        <a href="#maintenance" className={linkStyle}>Review release work</a>
      </div>
      <div className="border-t border-border bg-surface-2 px-6 py-4 text-xs leading-5 text-text-muted">Snapshot read <time dateTime={state.checkedAt}>{new Date(state.checkedAt).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "medium" })} UTC</time>. Refresh the page to read again. Runner Sports Plug supports operator review; background monitoring is not connected.</div>
    </section>

    <section aria-label="Server configuration">
      <SectionHeader title="Server configuration" subtitle="Presence checks in this environment. Credentials and private endpoint values are never displayed." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.connections.map(connection => <article key={connection.id} className="runner-card flex flex-col p-5">
          <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-lg font-bold text-text">{connection.name}</h3><Badge label={connection.configured ? "Configured" : "Setup incomplete"} variant={connection.configured ? "accent" : "warning"} /></div>
          <dl className="my-5 space-y-2 text-xs">{connection.requirements.map(check => <div key={check.label} className="flex justify-between gap-3"><dt className="text-text-muted">{check.label}</dt><dd className={check.present ? "font-semibold text-text" : "font-semibold text-warning"}>{check.present ? "Present" : "Missing"}</dd></div>)}</dl>
          <p className="mb-5 text-sm leading-6 text-text-muted">{connection.note}</p>
          {connection.href.startsWith("/") ? <Link className={`${linkStyle} mt-auto`} href={connection.href}>Open Runner dashboard</Link> : <a className={`${linkStyle} mt-auto`} href={connection.href} target="_blank" rel="noopener noreferrer">Open {connection.name === "Data plane" ? "Supabase" : connection.name === "Identity" ? "Clerk" : connection.name === "Subscriptions" ? "Stripe" : "Vercel"} <span className="sr-only">in a new tab</span><span aria-hidden="true" className="ml-2">↗</span></a>}
        </article>)}
      </div>
    </section>

    <section aria-label="Latest engine and provider receipts" className="grid gap-4 lg:grid-cols-2">
      <div className="runner-card p-5"><SectionHeader title="Engine heartbeat" subtitle="Latest saved heartbeat. Process state does not establish model or provider readiness." /><ReceiptList section={state.engine} /></div>
      <div className="runner-card p-5"><SectionHeader title="Provider receipts" subtitle="Up to 25 saved provider records. Receipt age is recalculated; stored freshness labels are not trusted." /><ReceiptList section={state.providers} /></div>
    </section>

    <section aria-label="Dated connection audit" className="runner-card p-5 sm:p-6">
      <SectionHeader title="Connection audit" subtitle={`Checked ${state.audit.checkedOn} · ${state.audit.method}. These findings are historical, not live connection tests.`} />
      <div className="divide-y divide-border">{state.audit.entries.map(entry => <article key={entry.provider} className="grid gap-3 py-5 first:pt-0 last:pb-0 lg:grid-cols-[10rem_1fr]">
        <h3 className="font-bold text-text">{entry.provider}</h3>
        <div><Badge label={entry.state} variant="default" /><p className="mt-3 text-sm leading-6 text-text">{entry.finding}</p><p className="mt-2 text-sm leading-6 text-text-muted">Next: {entry.next}</p></div>
      </article>)}</div>
    </section>

    <section id="maintenance" className="scroll-mt-24" aria-label="Maintenance and release work">
      <SectionHeader title="Maintenance & release work" subtitle="Operator checklist. External changes require an approved action and a recorded outcome." />
      <ol className="grid gap-3">{state.maintenance.map((gate, index) => <li key={gate.title} className="runner-card flex gap-4 p-5">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-strong font-mono text-xs text-text-muted">{index + 1}</span>
        <div><h3 className="font-bold text-text">{gate.title}</h3><p className="mt-2 text-sm leading-6 text-text-muted">{gate.detail}</p><p className="mt-2 text-xs text-text-muted">Owner: {gate.owner}</p></div>
      </li>)}</ol>
    </section>
  </div>;
}
