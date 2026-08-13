export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-text-muted">{title}</p>
      {description && <p className="mt-1 text-xs text-text-subtle">{description}</p>}
    </div>
  );
}
