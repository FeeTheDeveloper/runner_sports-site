import Link from "next/link";

export default function SundayHeadquartersHero({ liveGameCount }: { liveGameCount: number }) {
  return (
    <section className="hero-stadium relative border-b border-white/10">
      <div className="mx-auto grid min-h-[420px] max-w-[1500px] items-center gap-10 px-5 py-16 lg:px-10 lg:py-20">
        <div className="relative z-10">
          <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.3em] text-analytics">
            <span className="h-px w-10 bg-analytics" /> NFL Sunday Activation
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.6rem,7vw,6.4rem)] font-black uppercase leading-[.85] tracking-[-.06em] text-white">
            RUNNER SUNDAY<br />
            <span className="runner-outline">HEADQUARTERS</span>
          </h1>
          <p className="mt-6 max-w-2xl text-sm font-medium leading-7 text-text-muted sm:text-base">
            One command center for the entire NFL Sunday slate — Runner&apos;s model board, sponsor
            spotlights, live desk, halftime recap, and the accountability record, all on one page.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/pricing" className="hero-button-primary">GET RUNNER ACCESS →</Link>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">
              {liveGameCount > 0 ? `${liveGameCount} NFL game${liveGameCount === 1 ? "" : "s"} tracked today` : "Slate syncs at kickoff"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
