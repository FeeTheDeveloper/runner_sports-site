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
  { label: "Tracker", href: "/tracker", icon: "activity" },
  { label: "Models", href: "/models", icon: "cpu" },
];
