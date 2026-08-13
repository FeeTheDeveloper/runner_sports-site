import type { Confidence } from "@/types";
import Badge from "@/components/ui/Badge";

const variantByConfidence: Record<Confidence, "success" | "warning" | "default"> = {
  high: "success",
  moderate: "warning",
  low: "default",
};

const labelByConfidence: Record<Confidence, string> = {
  high: "High Confidence",
  moderate: "Moderate Confidence",
  low: "Low Confidence",
};

export default function ConfidenceBadge({ confidence, compact = false }: { confidence: Confidence; compact?: boolean }) {
  return <Badge variant={variantByConfidence[confidence]} label={compact ? confidence.toUpperCase() : labelByConfidence[confidence]} />;
}
