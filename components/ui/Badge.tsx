interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  className?: string;
}

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-surface-3 text-text-muted border-border-strong",
  success: "bg-positive/10 text-positive border-positive/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-negative/10 text-negative border-negative/30",
  accent: "bg-accent/10 text-accent border-accent/30",
};

export default function Badge({ label, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide ${variants[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
