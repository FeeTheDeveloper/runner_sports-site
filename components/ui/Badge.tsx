interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export default function Badge({ label, variant = "default" }: BadgeProps) {
  return <span data-variant={variant}>{label}</span>;
}
