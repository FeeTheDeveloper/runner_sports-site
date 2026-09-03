export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Games", href: "/games", icon: "calendar" },
  { label: "Props", href: "/props", icon: "target" },
  { label: "Edge", href: "/edge", icon: "trending" },
  { label: "Markets", href: "/markets", icon: "markets" },
  { label: "Prediction Markets", href: "/prediction-markets", icon: "pulse" },
  { label: "Tracker", href: "/tracker", icon: "activity" },
  { label: "Analytics", href: "/analytics", icon: "chart" },
  { label: "Models", href: "/models", icon: "cpu" },
];
