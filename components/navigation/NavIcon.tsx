const paths: Record<string, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  calendar: "M4 5h16M7 3v4M17 3v4M5 8h14v12H5zM8 12h3M13 12h3M8 16h3",
  target: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7a5 5 0 100 10 5 5 0 000-10zM12 11a1 1 0 100 2 1 1 0 000-2z",
  trending: "M4 16l5-6 4 4 7-9M14 5h6v6",
  activity: "M3 12h4l2 7 4-14 2 7h6",
  cpu: "M8 3v3M12 3v3M16 3v3M8 18v3M12 18v3M16 18v3M3 8h3M3 12h3M3 16h3M18 8h3M18 12h3M18 16h3M7 7h10v10H7z",
};

export default function NavIcon({ name, className }: { name: string; className?: string }) {
  const d = paths[name] ?? paths.grid;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
