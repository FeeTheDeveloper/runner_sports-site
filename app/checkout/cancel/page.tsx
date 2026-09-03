import Link from "next/link";
import RunnerLogo from "@/components/brand/RunnerLogo";

export default function CheckoutCancelPage() {
  return <main className="hero-stadium grid min-h-dvh place-items-center px-5"><section className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#070d20]/95 p-9 text-center"><div className="flex justify-center"><RunnerLogo /></div><p className="mt-8 text-[10px] font-black uppercase tracking-[.24em] text-analytics">Checkout closed</p><h1 className="mt-3 text-4xl font-black uppercase text-white">Nothing was charged.</h1><p className="mt-4 text-sm leading-6 text-text-muted">Return to the access board whenever you are ready.</p><Link href="/pricing" className="mt-7 inline-block rounded-lg bg-accent px-4 py-3 text-xs font-black uppercase text-white">Back to pricing</Link></section></main>;
}
