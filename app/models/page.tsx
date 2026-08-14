import { getModels } from "@/lib/data/models";
import Badge from "@/components/ui/Badge";
import { formatPercent, formatSignedPercent, formatDate } from "@/lib/utils/format";

const statusVariant = {
  active: "success",
  beta: "default",
  training: "warning",
  deprecated: "default",
} as const;

export default async function ModelsPage() {
  const models = await getModels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Runner Models</h1>
        <p className="mt-1 text-sm text-text-muted">
          Simulated model registry. Sample sizes, accuracy, and calibration are illustrative placeholders — no model
          listed here is claimed to be production-verified.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {models.map((model) => (
          <div key={model.id} className="rounded-lg border border-border bg-surface p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-text tracking-wide">{model.name}</p>
                <p className="text-xs text-text-subtle mt-0.5">
                  {model.version} · {model.sport}
                </p>
              </div>
              <Badge variant={statusVariant[model.status]} label={model.status} />
            </div>

            <p className="text-sm text-text-muted">{model.description}</p>

            <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface-2 p-3 sm:grid-cols-4">
              <Metric label="Target" value={model.target} small />
              <Metric label="Sample Size" value={model.sampleSize.toLocaleString()} />
              <Metric label="Accuracy" value={formatPercent(model.accuracy, 1)} />
              <Metric label="Calibration" value={formatPercent(model.calibration, 0)} />
            </div>

            <div className="flex items-center justify-between text-xs text-text-subtle">
              <span>{model.roi !== undefined ? `Simulated ROI: ${formatSignedPercent(model.roi)}` : "ROI not yet applicable"}</span>
              <span>Updated {formatDate(model.lastUpdated)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-text-subtle mb-1">{label}</p>
      <p className={small ? "text-xs text-text" : "font-mono text-sm text-text"}>{value}</p>
    </div>
  );
}
