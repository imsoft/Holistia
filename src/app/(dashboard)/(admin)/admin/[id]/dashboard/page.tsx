"use client";

import { useState, useEffect } from "react";
// import { useParams } from "next/navigation";
import {
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

// Interfaces para los datos dinámicos
interface DashboardStats {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface ProfessionalApplication {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  profile_photo?: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats[]>([]);
  const [recentApplications, setRecentApplications] = useState<ProfessionalApplication[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const supabase = createClient();

  // Obtener el ID del usuario autenticado
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, [supabase]);

  // Obtener datos del dashboard
  useEffect(() => {
    if (!userId) return; // Esperar a que se obtenga el userId
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fechas para comparaciones
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Obtener estadísticas
        const [
          professionalsResult, 
          pendingApplicationsResult, 
          appointmentsResult,
          lastMonthProfessionalsResult,
          lastMonthAppointmentsResult,
          allApplicationsResult
        ] = await Promise.all([
          // Profesionales aprobados
          supabase.from('professional_applications').select('*', { count: 'exact' }).eq('status', 'approved'),
          // Solicitudes pendientes
          supabase.from('professional_applications').select('*', { count: 'exact' }).eq('status', 'pending'),
          // Citas del mes actual
          supabase.from('appointments').select('*', { count: 'exact' }).gte('appointment_date', currentMonthStart.toISOString()),
          // Profesionales aprobados el mes pasado
          supabase.from('professional_applications')
            .select('*', { count: 'exact' })
            .eq('status', 'approved')
            .gte('reviewed_at', lastMonthStart.toISOString())
            .lte('reviewed_at', lastMonthEnd.toISOString()),
          // Citas del mes pasado
          supabase.from('appointments')
            .select('*', { count: 'exact' })
            .gte('appointment_date', lastMonthStart.toISOString())
            .lte('appointment_date', lastMonthEnd.toISOString()),
          // Total de solicitudes (para contar usuarios únicos)
          supabase.from('professional_applications').select('user_id', { count: 'exact' })
        ]);

        // Calcular estadísticas
        // Contar usuarios únicos desde las solicitudes
        const uniqueUsers = new Set(allApplicationsResult.data?.map(app => app.user_id) || []);
        const totalUsers = uniqueUsers.size;
        
        const activeProfessionals = professionalsResult.data?.length || 0;
        const pendingApplications = pendingApplicationsResult.data?.length || 0;
        const monthlyAppointments = appointmentsResult.data?.length || 0;
        
        // Calcular cambios del mes anterior
        const lastMonthProfessionals = lastMonthProfessionalsResult.data?.length || 0;
        const lastMonthAppointments = lastMonthAppointmentsResult.data?.length || 0;
        
        // Función para calcular porcentaje de cambio
        const calculatePercentageChange = (current: number, previous: number): string => {
          if (previous === 0) return current > 0 ? "+100%" : "0%";
          const change = ((current - previous) / previous) * 100;
          const sign = change >= 0 ? "+" : "";
          return `${sign}${Math.round(change)}%`;
        };

        // Crear array de estadísticas
        const dashboardStats: DashboardStats[] = [
          {
            title: "Solicitudes de Usuarios",
            value: totalUsers.toString(),
            change: `${totalUsers} usuarios han enviado solicitudes`,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            title: "Profesionales Activos",
            value: activeProfessionals.toString(),
            change: `${calculatePercentageChange(activeProfessionals, lastMonthProfessionals)} vs mes anterior`,
            icon: UserCheck,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            title: "Solicitudes Pendientes",
            value: pendingApplications.toString(),
            change: pendingApplications > 0 ? "Requieren revisión" : "Sin solicitudes pendientes",
            icon: UserPlus,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
          {
            title: "Citas del Mes",
            value: monthlyAppointments.toString(),
            change: `${calculatePercentageChange(monthlyAppointments, lastMonthAppointments)} vs mes anterior`,
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
        ];

        setStats(dashboardStats);

        // Obtener solicitudes recientes (últimas 5)
        const { data: applications, error: applicationsError } = await supabase
          .from('professional_applications')
          .select('*')
          .order('submitted_at', { ascending: false })
          .limit(5);

        if (!applicationsError && applications) {
          setRecentApplications(applications);
        }

        // Crear actividades recientes basadas en datos reales
        const activities: RecentActivity[] = [];
        
        // Agregar actividad por cada solicitud reciente
        applications?.slice(0, 3).forEach((app) => {
          const timeAgo = getTimeAgo(app.submitted_at);
          activities.push({
            id: `app-${app.id}`,
            action: app.status === 'pending' ? 'Nueva solicitud de profesional' : 
                   app.status === 'approved' ? 'Profesional aprobado' : 
                   app.status === 'rejected' ? 'Solicitud rechazada' : 'Solicitud en revisión',
            user: `${app.first_name} ${app.last_name}`,
            time: timeAgo,
            type: app.status === 'approved' ? 'success' : 
                  app.status === 'rejected' ? 'error' : 'info'
          });
        });

        setRecentActivities(activities);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, userId]);

  // Función para calcular tiempo transcurrido
  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobada";
      case "pending":
        return "Pendiente";
      case "rejected":
        return "Rechazada";
      case "under_review":
        return "En Revisión";
      default:
        return status;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "info":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard Administrador</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Panel de control de Holistia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" className="sm:size-default w-full sm:w-auto">
              <Link href={`/admin/${userId}/applications`}>
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="sm:inline">Revisar Solicitudes</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solicitudes Recientes */}
          <Card>
            <CardHeader className="px-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Solicitudes Recientes</CardTitle>
                  <CardDescription>
                    Últimas solicitudes de profesionales
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/${userId}/applications`}>
                    Ver todas
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-3"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {application.first_name} {application.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {application.profession}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {application.email}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      <Badge className={getStatusColor(application.status)}>
                        {getStatusText(application.status)}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                        <Link href={`/admin/${userId}/applications`}>
                          Revisar
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card>
            <CardHeader className="px-6 pt-6">
              <div>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>
                  Últimas acciones del sistema
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.user}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
