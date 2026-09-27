import type { HalftimeReportContent } from "@/lib/sunday/types";
import Badge from "@/components/ui/Badge";

export default function HalftimeReport({ report }: { report: HalftimeReportContent }) {
  return (
    <div className="data-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-subtle">{report.gameLabel}</p>
          <p className="mt-1 text-2xl font-black uppercase tracking-tight text-text">{report.scoreLine}</p>
        </div>
        {report.placeholder ? (
          <Badge variant="default" label="Awaiting halftime" />
        ) : (
          <Badge variant="success" label="Halftime" />
        )}
      </div>
      <p className="mt-4 text-sm leading-6 text-text-muted">{report.summary}</p>
      {report.keyStats.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {report.keyStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-surface-2 p-3">
              <p className="text-[9px] uppercase tracking-wider text-text-subtle">{stat.label}</p>
              <p className="mt-1 font-mono text-sm font-black text-text">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
      {!report.placeholder && (
        <p className="mt-4 border-t border-border pt-3 text-[10px] text-text-subtle">
          Updated {new Date(report.updatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT
        </p>
      )}
    </div>
  );
}
