export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface UserNavigation {
  name: string;
  href: string;
  current: boolean;
}

export interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ProfessionalNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}
