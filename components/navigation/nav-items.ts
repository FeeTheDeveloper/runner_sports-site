export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const navItems: NavItem[] = [
  { label: "For You", href: "/picks", icon: "grid" },
  { label: "Odds", href: "/odds", icon: "markets" },
  { label: "Games", href: "/games", icon: "calendar" },
  { label: "Props", href: "/props", icon: "target" },
  { label: "Runner Edge", href: "/edge", icon: "trending" },
  { label: "Research", href: "/research", icon: "chart" },
  { label: "Systems", href: "/systems", icon: "cpu" },
  { label: "Models", href: "/models", icon: "pulse" },
  { label: "Tracker", href: "/tracker", icon: "activity" },
];
