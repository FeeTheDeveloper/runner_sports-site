import Link from "next/link";

export default function NotFound() {
  return <div className="mx-auto max-w-lg py-24 text-center"><p className="font-mono text-sm text-accent">404 / SIGNAL NOT FOUND</p><h1 className="mt-4 text-3xl font-semibold text-text">That route is outside the board.</h1><p className="mt-3 text-sm leading-6 text-text-muted">The page may have moved or the address may be incorrect.</p><Link href="/dashboard" className="mt-7 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-bold text-canvas">Return to Dashboard</Link></div>;
}
