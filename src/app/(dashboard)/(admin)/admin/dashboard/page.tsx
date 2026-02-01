"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Package,
  Calendar,
  Building2,
  UtensilsCrossed,
  Store,
  Briefcase,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";

// Interfaces para los datos dinámicos
interface DashboardStats {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  href?: string;
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
  const [coreStats, setCoreStats] = useState<DashboardStats[]>([]);
  const [contentStats, setContentStats] = useState<DashboardStats[]>([]);
  const [businessStats, setBusinessStats] = useState<DashboardStats[]>([]);
  const [recentApplications, setRecentApplications] = useState<ProfessionalApplication[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, loading: profileLoading } = useProfile();
  const supabase = createClient();

  // Obtener datos del dashboard
  useEffect(() => {
    if (profileLoading) return;
    if (!profile) {
      setLoading(false);
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fechas para comparaciones
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Obtener todas las estadísticas en paralelo
        const [
          // Core stats
          professionalsResult,
          pendingApplicationsResult,
          appointmentsResult,
          usersResult,
          // Content stats
          challengesResult,
          activeChallengesResult,
          digitalProductsResult,
          activeProductsResult,
          eventsResult,
          activeEventsResult,
          blogPostsResult,
          publishedPostsResult,
          // Business stats
          holisticCentersResult,
          activeHolisticCentersResult,
          restaurantsResult,
          activeRestaurantsResult,
          shopsResult,
          activeShopsResult,
          companiesResult,
          // Month comparisons
          lastMonthProfessionalsResult,
          lastMonthAppointmentsResult,
        ] = await Promise.all([
          // Core stats
          supabase.from('professional_applications').select('*', { count: 'exact' }).eq('status', 'approved'),
          supabase.from('professional_applications').select('*', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('appointments').select('*', { count: 'exact' }).gte('appointment_date', currentMonthStart.toISOString()),
          supabase.from('profiles').select('*', { count: 'exact' }).eq('type', 'patient'),
          // Content stats
          supabase.from('challenges').select('*', { count: 'exact' }),
          supabase.from('challenges').select('*', { count: 'exact' }).eq('is_active', true),
          supabase.from('digital_products').select('*', { count: 'exact' }),
          supabase.from('digital_products').select('*', { count: 'exact' }).eq('is_active', true),
          supabase.from('events_workshops').select('*', { count: 'exact' }),
          supabase.from('events_workshops').select('*', { count: 'exact' }).eq('is_active', true),
          supabase.from('blog_posts').select('*', { count: 'exact' }),
          supabase.from('blog_posts').select('*', { count: 'exact' }).eq('status', 'published'),
          // Business stats
          supabase.from('holistic_centers').select('*', { count: 'exact' }),
          supabase.from('holistic_centers').select('*', { count: 'exact' }).eq('is_active', true),
          supabase.from('restaurants').select('*', { count: 'exact' }),
          supabase.from('restaurants').select('*', { count: 'exact' }).eq('is_active', true),
          supabase.from('shops').select('*', { count: 'exact' }),
          supabase.from('shops').select('*', { count: 'exact' }).eq('is_active', true),
          supabase.from('company_leads').select('*', { count: 'exact' }),
          // Month comparisons
          supabase.from('professional_applications')
            .select('*', { count: 'exact' })
            .eq('status', 'approved')
            .gte('reviewed_at', lastMonthStart.toISOString())
            .lte('reviewed_at', lastMonthEnd.toISOString()),
          supabase.from('appointments')
            .select('*', { count: 'exact' })
            .gte('appointment_date', lastMonthStart.toISOString())
            .lte('appointment_date', lastMonthEnd.toISOString()),
        ]);

        // Calcular estadísticas
        const totalUsers = usersResult.count || 0;
        const activeProfessionals = professionalsResult.count || 0;
        const pendingApplications = pendingApplicationsResult.count || 0;
        const monthlyAppointments = appointmentsResult.count || 0;
        
        const totalChallenges = challengesResult.count || 0;
        const activeChallenges = activeChallengesResult.count || 0;
        const totalProducts = digitalProductsResult.count || 0;
        const activeProducts = activeProductsResult.count || 0;
        const totalEvents = eventsResult.count || 0;
        const activeEvents = activeEventsResult.count || 0;
        const totalPosts = blogPostsResult.count || 0;
        const publishedPosts = publishedPostsResult.count || 0;
        
        const totalCenters = holisticCentersResult.count || 0;
        const activeCenters = activeHolisticCentersResult.count || 0;
        const totalRestaurants = restaurantsResult.count || 0;
        const activeRestaurants = activeRestaurantsResult.count || 0;
        const totalShops = shopsResult.count || 0;
        const activeShops = activeShopsResult.count || 0;
        const totalCompanies = companiesResult.count || 0;

        const lastMonthProfessionals = lastMonthProfessionalsResult.count || 0;
        const lastMonthAppointments = lastMonthAppointmentsResult.count || 0;
        
        // Función para calcular porcentaje de cambio
        const calculatePercentageChange = (current: number, previous: number): string => {
          if (previous === 0) return current > 0 ? "+100%" : "0%";
          const change = ((current - previous) / previous) * 100;
          const sign = change >= 0 ? "+" : "";
          return `${sign}${Math.round(change)}%`;
        };

        // Core Stats - Usuarios y Profesionales
        const coreStatsData: DashboardStats[] = [
          {
            title: "Usuarios Registrados",
            value: totalUsers.toString(),
            subtitle: "Pacientes en la plataforma",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            href: "/admin/users",
          },
          {
            title: "Profesionales Activos",
            value: activeProfessionals.toString(),
            subtitle: `${calculatePercentageChange(activeProfessionals, lastMonthProfessionals)} vs mes anterior`,
            icon: UserCheck,
            color: "text-green-600",
            bgColor: "bg-green-50",
            href: "/admin/professionals",
          },
          {
            title: "Solicitudes Pendientes",
            value: pendingApplications.toString(),
            subtitle: pendingApplications > 0 ? "Requieren revisión" : "Sin pendientes",
            icon: UserPlus,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            href: "/admin/applications",
          },
          {
            title: "Citas del Mes",
            value: monthlyAppointments.toString(),
            subtitle: `${calculatePercentageChange(monthlyAppointments, lastMonthAppointments)} vs mes anterior`,
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
        ];

        // Content Stats - Contenido de la plataforma
        const contentStatsData: DashboardStats[] = [
          {
            title: "Retos",
            value: totalChallenges.toString(),
            subtitle: `${activeChallenges} activos`,
            icon: Target,
            color: "text-red-600",
            bgColor: "bg-red-50",
            href: "/admin/challenges",
          },
          {
            title: "Programas Digitales",
            value: totalProducts.toString(),
            subtitle: `${activeProducts} activos`,
            icon: Package,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50",
            href: "/admin/digital-products",
          },
          {
            title: "Eventos",
            value: totalEvents.toString(),
            subtitle: `${activeEvents} activos`,
            icon: Calendar,
            color: "text-pink-600",
            bgColor: "bg-pink-50",
            href: "/admin/events",
          },
          {
            title: "Blog Posts",
            value: totalPosts.toString(),
            subtitle: `${publishedPosts} publicados`,
            icon: FileText,
            color: "text-cyan-600",
            bgColor: "bg-cyan-50",
            href: "/admin/blog",
          },
        ];

        // Business Stats - Negocios y empresas
        const businessStatsData: DashboardStats[] = [
          {
            title: "Centros Holísticos",
            value: totalCenters.toString(),
            subtitle: `${activeCenters} activos`,
            icon: Building2,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
            href: "/admin/holistic-centers",
          },
          {
            title: "Restaurantes",
            value: totalRestaurants.toString(),
            subtitle: `${activeRestaurants} activos`,
            icon: UtensilsCrossed,
            color: "text-amber-600",
            bgColor: "bg-amber-50",
            href: "/admin/restaurants",
          },
          {
            title: "Comercios",
            value: totalShops.toString(),
            subtitle: `${activeShops} activos`,
            icon: Store,
            color: "text-violet-600",
            bgColor: "bg-violet-50",
            href: "/admin/shops",
          },
          {
            title: "Empresas (Leads)",
            value: totalCompanies.toString(),
            subtitle: "Contactos B2B",
            icon: Briefcase,
            color: "text-slate-600",
            bgColor: "bg-slate-50",
            href: "/admin/companies",
          },
        ];

        setCoreStats(coreStatsData);
        setContentStats(contentStatsData);
        setBusinessStats(businessStatsData);

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
  }, [supabase, profileLoading, profile]);

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

  // Componente para renderizar una tarjeta de estadística
  const StatCard = ({ stat }: { stat: DashboardStats }) => {
    const content = (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {stat.title}
          </CardTitle>
          <div className={`p-2 rounded-full ${stat.bgColor}`}>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          <p className="text-xs text-muted-foreground">
            {stat.subtitle}
          </p>
        </CardContent>
      </Card>
    );

    if (stat.href) {
      return <Link href={stat.href}>{content}</Link>;
    }
    return content;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-lg" />)}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-lg" />)}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-lg" />)}
          </div>
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
              <Link href="/admin/applications">
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="sm:inline">Revisar Solicitudes</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Core Stats - Usuarios y Profesionales */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios y Profesionales
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {coreStats.map((stat) => (
              <StatCard key={stat.title} stat={stat} />
            ))}
          </div>
        </div>

        {/* Content Stats - Contenido */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Contenido de la Plataforma
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {contentStats.map((stat) => (
              <StatCard key={stat.title} stat={stat} />
            ))}
          </div>
        </div>

        {/* Business Stats - Negocios */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Negocios y Empresas
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {businessStats.map((stat) => (
              <StatCard key={stat.title} stat={stat} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Solicitudes Recientes */}
          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>Solicitudes Recientes</CardTitle>
                  <CardDescription>
                    Últimas solicitudes de profesionales
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link href="/admin/applications">
                    Ver todas
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-3 sm:space-y-4">
                {recentApplications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay solicitudes recientes
                  </p>
                ) : (
                  recentApplications.map((application) => (
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
                          <Link href="/admin/applications">
                            Revisar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <div>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>
                  Últimas acciones del sistema
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-3 sm:space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay actividad reciente
                  </p>
                ) : (
                  recentActivities.map((activity) => (
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
