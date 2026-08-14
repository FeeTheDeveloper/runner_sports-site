"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-lg py-24 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-negative">Workspace interrupted</p><h1 className="mt-4 text-3xl font-semibold text-text">The intelligence view could not load.</h1><p className="mt-3 text-sm leading-6 text-text-muted">Your data has not been changed. Retry the request or return to the dashboard.</p><button onClick={reset} className="mt-7 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-canvas">Try again</button></div>;
}
