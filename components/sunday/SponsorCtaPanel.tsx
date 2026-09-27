import type { CtaSponsorPanel } from "@/lib/sunday/types";
import SponsorPanel from "@/components/sunday/SponsorTag";
import SponsorMark from "@/components/sunday/SponsorMark";
import { renderQrCodeSvg } from "@/lib/sunday/qr";

export default async function SponsorCtaPanelView({ panel }: { panel: CtaSponsorPanel }) {
  const qrSvg = panel.showQrCode ? await renderQrCodeSvg(panel.ctaHref).catch(() => null) : null;

  return (
    <SponsorPanel placeholder={panel.sponsor.placeholder}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <SponsorMark sponsor={panel.sponsor} size="md" />
          <div className="min-w-0">
            <p className="text-lg font-black uppercase tracking-tight text-text">{panel.headline}</p>
            <p className="mt-1 text-sm leading-6 text-text-muted">{panel.body}</p>
            <a
              href={panel.ctaHref}
              className="mt-4 inline-flex items-center rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-warning"
            >
              {panel.ctaLabel} →
            </a>
          </div>
        </div>
        {qrSvg && (
          <div className="shrink-0 self-center rounded-xl border border-warning/30 bg-white p-2" aria-label="Scan to open sponsor link">
            <div className="h-28 w-28 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          </div>
        )}
      </div>
    </SponsorPanel>
  );
}
