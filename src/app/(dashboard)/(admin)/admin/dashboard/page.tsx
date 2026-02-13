"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Building2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";

// Interfaces para los datos dinámicos (compatible con AdminStatCard)
interface DashboardStats {
  title: string;
  value: string;
  tertiaryText?: string;
  trend?: { value: string; positive: boolean };
  secondaryText?: string;
  href?: string;
}

export default function AdminDashboard() {
  const [coreStats, setCoreStats] = useState<DashboardStats[]>([]);
  const [contentStats, setContentStats] = useState<DashboardStats[]>([]);
  const [businessStats, setBusinessStats] = useState<DashboardStats[]>([]);
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
        const profChange = calculatePercentageChange(activeProfessionals, lastMonthProfessionals);
        const appointmentsChange = calculatePercentageChange(monthlyAppointments, lastMonthAppointments);
        const coreStatsData: DashboardStats[] = [
          {
            title: "Usuarios Registrados",
            value: totalUsers.toString(),
            tertiaryText: "Pacientes en la plataforma",
            href: "/admin/users",
          },
          {
            title: "Profesionales Activos",
            value: activeProfessionals.toString(),
            trend: { value: profChange, positive: !profChange.startsWith("-") },
            secondaryText: "vs mes anterior",
            tertiaryText: "Profesionales aprobados",
            href: "/admin/professionals",
          },
          {
            title: "Solicitudes Pendientes",
            value: pendingApplications.toString(),
            tertiaryText: pendingApplications > 0 ? "Requieren revisión" : "Sin pendientes",
            href: "/admin/applications",
          },
          {
            title: "Citas del Mes",
            value: monthlyAppointments.toString(),
            trend: { value: appointmentsChange, positive: !appointmentsChange.startsWith("-") },
            secondaryText: "vs mes anterior",
            tertiaryText: "Citas agendadas este mes",
          },
        ];

        // Content Stats - Contenido de la plataforma
        const contentStatsData: DashboardStats[] = [
          {
            title: "Retos",
            value: totalChallenges.toString(),
            tertiaryText: `${activeChallenges} activos`,
            href: "/admin/challenges",
          },
          {
            title: "Programas Digitales",
            value: totalProducts.toString(),
            tertiaryText: `${activeProducts} activos`,
            href: "/admin/digital-products",
          },
          {
            title: "Eventos",
            value: totalEvents.toString(),
            tertiaryText: `${activeEvents} activos`,
            href: "/admin/events",
          },
          {
            title: "Blog Posts",
            value: totalPosts.toString(),
            tertiaryText: `${publishedPosts} publicados`,
            href: "/admin/blog",
          },
        ];

        // Business Stats - Negocios y empresas
        const businessStatsData: DashboardStats[] = [
          {
            title: "Centros Holísticos",
            value: totalCenters.toString(),
            tertiaryText: `${activeCenters} activos`,
            href: "/admin/holistic-centers",
          },
          {
            title: "Restaurantes",
            value: totalRestaurants.toString(),
            tertiaryText: `${activeRestaurants} activos`,
            href: "/admin/restaurants",
          },
          {
            title: "Comercios",
            value: totalShops.toString(),
            tertiaryText: `${activeShops} activos`,
            href: "/admin/shops",
          },
          {
            title: "Empresas (Leads)",
            value: totalCompanies.toString(),
            tertiaryText: "Contactos B2B",
            href: "/admin/companies",
          },
        ];

        setCoreStats(coreStatsData);
        setContentStats(contentStatsData);
        setBusinessStats(businessStatsData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, profileLoading, profile]);

  if (loading) {
    return (
      <div className="admin-page-shell p-4 sm:p-6">
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
    <div className="admin-page-shell">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
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
              <AdminStatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                tertiaryText={stat.tertiaryText}
                trend={stat.trend}
                secondaryText={stat.secondaryText}
                href={stat.href}
              />
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
              <AdminStatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                tertiaryText={stat.tertiaryText}
                href={stat.href}
              />
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
              <AdminStatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                tertiaryText={stat.tertiaryText}
                href={stat.href}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
