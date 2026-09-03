import Link from "next/link";
import RunnerLogo from "@/components/brand/RunnerLogo";

export default function CheckoutSuccessPage() {
  return <main className="hero-stadium grid min-h-dvh place-items-center px-5"><section className="w-full max-w-xl rounded-2xl border border-positive/25 bg-[#070d20]/95 p-9 text-center"><div className="flex justify-center"><RunnerLogo /></div><p className="mt-8 text-[10px] font-black uppercase tracking-[.24em] text-positive">Checkout complete</p><h1 className="mt-3 text-4xl font-black uppercase text-white">Access is syncing.</h1><p className="mt-4 text-sm leading-6 text-text-muted">Stripe has returned successfully. The verified webhook is the authority that activates your Runner access.</p><div className="mt-7 flex justify-center gap-3"><Link href="/billing" className="rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase text-white">View billing</Link><Link href="/picks" className="rounded-lg border border-white/15 px-4 py-3 text-xs font-black uppercase text-white">Best plays</Link></div></section></main>;
}
