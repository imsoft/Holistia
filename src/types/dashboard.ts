export interface DashboardStats {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: "success" | "error" | "info";
}

export interface AdminStats {
  totalUsers: number;
  activeProfessionals: number;
  pendingApplications: number;
  monthlyAppointments: number;
}

export interface ProfessionalStats {
  todayAppointments: number;
  activePatients: number;
  monthlyIncome: number;
}
