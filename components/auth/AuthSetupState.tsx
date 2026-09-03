import Link from "next/link";

export default function AuthSetupState() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#070d20]/90 p-8 shadow-2xl backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-analytics">Clerk route ready</p>
      <h2 className="mt-3 text-2xl font-black uppercase text-white">Connect the app keys</h2>
      <p className="mt-4 text-sm leading-6 text-text-muted">The signup and signin paths are installed. Add the Clerk publishable and secret keys in the deployment environment to activate the hosted form.</p>
      <Link href="/" className="mt-6 inline-flex rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase tracking-wider text-white">Back to Runner</Link>
    </div>
  );
}
