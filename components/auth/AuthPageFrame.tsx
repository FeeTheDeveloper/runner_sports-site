import Link from "next/link";
import RunnerLogo from "@/components/brand/RunnerLogo";

export default function AuthPageFrame({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="hero-stadium min-h-dvh px-5 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" aria-label="Runner Sports home"><RunnerLogo /></Link>
        <Link href="/pricing" className="text-xs font-black uppercase tracking-widest text-text-muted">View access</Link>
      </div>
      <div className="mx-auto grid min-h-[calc(100dvh-100px)] max-w-6xl items-center gap-12 py-12 lg:grid-cols-2">
        <section>
          <p className="text-[10px] font-black uppercase tracking-[.28em] text-accent">{eyebrow}</p>
          <h1 className="mt-5 text-5xl font-black uppercase leading-[.9] tracking-[-.05em] text-white sm:text-7xl">{title}</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-text-muted">One identity across picks, saved research, alerts, model access and billing. We run sports and analytics.</p>
        </section>
        <section className="flex justify-center lg:justify-end">{children}</section>
      </div>
    </main>
  );
}
