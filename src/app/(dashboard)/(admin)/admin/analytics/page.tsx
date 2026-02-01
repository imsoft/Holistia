"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Award,
  Clock,
  BarChart3,
  RefreshCw,
  Package,
  Target,
  Store,
  Building2,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";

interface TopProfessional {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  profession: string;
  appointment_count: number;
  total_revenue: number;
  professional_earnings: number;
  holistia_earnings: number;
  stripe_commissions: number;
}

interface TopPatient {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  appointment_count: number;
  total_spent: number;
}

interface ServiceStats {
  service_type: string;
  count: number;
  revenue: number;
}

interface GeneralStats {
  total_professionals: number;
  total_patients: number;
  total_appointments: number;
  total_revenue: number;
  active_professionals: number;
  completed_appointments: number;
}

interface EntityStats {
  total: number;
  active: number;
}

interface MonthlyData {
  month: string;
  count: number;
}

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export default function AnalyticsPage() {
  useUserStoreInit();
  const adminId = useUserId();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generalStats, setGeneralStats] = useState<GeneralStats>({
    total_professionals: 0,
    total_patients: 0,
    total_appointments: 0,
    total_revenue: 0,
    active_professionals: 0,
    completed_appointments: 0,
  });
  const [topProfessionals, setTopProfessionals] = useState<TopProfessional[]>([]);
  const [topPatients, setTopPatients] = useState<TopPatient[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);

  // Nuevas estadísticas por entidad
  const [digitalProducts, setDigitalProducts] = useState<EntityStats>({ total: 0, active: 0 });
  const [events, setEvents] = useState<EntityStats>({ total: 0, active: 0 });
  const [eventRegistrations, setEventRegistrations] = useState(0);
  const [challenges, setChallenges] = useState<EntityStats>({ total: 0, active: 0 });
  const [shops, setShops] = useState<EntityStats>({ total: 0, active: 0 });
  const [holisticCenters, setHolisticCenters] = useState<EntityStats>({ total: 0, active: 0 });
  const [restaurants, setRestaurants] = useState<EntityStats>({ total: 0, active: 0 });

  // Datos para gráficos
  const [chartData, setChartData] = useState<{
    appointments: MonthlyData[];
    professionals: MonthlyData[];
    digital_products: MonthlyData[];
    events: MonthlyData[];
    event_registrations: MonthlyData[];
    challenges: MonthlyData[];
    shops: MonthlyData[];
    holistic_centers: MonthlyData[];
    restaurants: MonthlyData[];
  }>({
    appointments: [],
    professionals: [],
    digital_products: [],
    events: [],
    event_registrations: [],
    challenges: [],
    shops: [],
    holistic_centers: [],
    restaurants: [],
  });

  const chartConfig = {
    count: {
      label: "Cantidad",
      color: "var(--primary)",
    },
    total: {
      label: "Total",
      color: "var(--primary)",
    },
    month: {
      label: "Mes",
    },
    mes: {
      label: "Mes",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/analytics");

        if (!response.ok) {
          throw new Error("Error al obtener datos de analíticas");
        }

        const data = await response.json();

        const appointmentsData = data.appointments || [];
        const paymentsData = data.payments || [];
        const professionalsData = data.professionals || [];
        const patientsData = data.patients || [];

        const uniquePatients = new Set(appointmentsData.map((a: { patient_id: string }) => a.patient_id));

        const totalRevenue = paymentsData.reduce((sum: number, p: { amount?: string | number }) => {
          const amount = typeof p.amount === "string" ? parseFloat(p.amount) : p.amount || 0;
          return sum + amount;
        }, 0);

        const completedAppointments = appointmentsData.filter((a: { status: string }) => a.status === "completed").length;

        setGeneralStats({
          total_professionals: data.professionals_count || 0,
          total_patients: uniquePatients.size,
          total_appointments: appointmentsData.length,
          total_revenue: totalRevenue,
          active_professionals: data.active_professionals_count || 0,
          completed_appointments: completedAppointments,
        });

        // Entidades adicionales
        setDigitalProducts(data.digital_products || { total: 0, active: 0 });
        setEvents(data.events || { total: 0, active: 0 });
        setEventRegistrations(data.event_registrations_count || 0);
        setChallenges(data.challenges || { total: 0, active: 0 });
        setShops(data.shops || { total: 0, active: 0 });
        setHolisticCenters(data.holistic_centers || { total: 0, active: 0 });
        setRestaurants(data.restaurants || { total: 0, active: 0 });

        // Datos para gráficos
        if (data.charts) {
          setChartData({
            appointments: data.charts.appointments || [],
            professionals: data.charts.professionals || [],
            digital_products: data.charts.digital_products || [],
            events: data.charts.events || [],
            event_registrations: data.charts.event_registrations || [],
            challenges: data.charts.challenges || [],
            shops: data.charts.shops || [],
            holistic_centers: data.charts.holistic_centers || [],
            restaurants: data.charts.restaurants || [],
          });
        }

        // Top profesionales
        if (professionalsData.length && appointmentsData.length && paymentsData.length) {
          const professionalStats = professionalsData.map((prof: { id: string }) => {
            const profAppointments = appointmentsData.filter((a: { professional_id: string }) => a.professional_id === prof.id);
            const profPayments = paymentsData.filter((p: { appointment_id: string }) =>
              profAppointments.some((a: { id: string }) => a.id === p.appointment_id)
            );
            const totalRev = profPayments.reduce((sum: number, p: { amount?: string | number }) => {
              const amount = typeof p.amount === "string" ? parseFloat(p.amount) : p.amount || 0;
              return sum + amount;
            }, 0);
            const holistiaCommissions = totalRev * 0.15;
            return {
              ...prof,
              appointment_count: profAppointments.length,
              total_revenue: totalRev,
              professional_earnings: totalRev - holistiaCommissions,
              holistia_earnings: holistiaCommissions,
            };
          });
          setTopProfessionals(
            professionalStats
              .sort((a: TopProfessional, b: TopProfessional) => b.appointment_count - a.appointment_count)
              .slice(0, 5)
          );
        }

        // Top pacientes
        if (appointmentsData.length && paymentsData.length) {
          const patientMap = new Map<string, { count: number; spent: number }>();
          appointmentsData.forEach((apt: { patient_id: string; id: string }) => {
            const existing = patientMap.get(apt.patient_id) || { count: 0, spent: 0 };
            const aptPayments = paymentsData.filter((p: { appointment_id: string }) => p.appointment_id === apt.id);
            const spent = aptPayments.reduce((sum: number, p: { amount?: string | number }) => {
              const amount = typeof p.amount === "string" ? parseFloat(p.amount) : p.amount || 0;
              return sum + amount;
            }, 0);
            patientMap.set(apt.patient_id, { count: existing.count + 1, spent: existing.spent + spent });
          });
          const topPats = Array.from(patientMap.entries())
            .map(([patientId, stats]) => {
              const patientData = patientsData.find((p: { id: string }) => p.id === patientId);
              return {
                id: patientId,
                full_name: patientData ? `${patientData.first_name || ""} ${patientData.last_name || ""}`.trim() : `Paciente ${patientId.slice(0, 8)}`,
                email: patientData?.email || "No disponible",
                avatar_url: patientData?.avatar_url || null,
                appointment_count: stats.count,
                total_spent: stats.spent,
              };
            })
            .sort((a, b) => b.appointment_count - a.appointment_count)
            .slice(0, 5);
          setTopPatients(topPats);
        }

        // Servicios por tipo
        if (appointmentsData.length && paymentsData.length) {
          const serviceTypeMap = new Map<string, { count: number; revenue: number }>();
          appointmentsData.forEach((apt: { appointment_type: string; id: string }) => {
            const type = apt.appointment_type === "presencial" ? "Presencial" : "En línea";
            const existing = serviceTypeMap.get(type) || { count: 0, revenue: 0 };
            const aptPayments = paymentsData.filter((p: { appointment_id: string }) => p.appointment_id === apt.id);
            const revenue = aptPayments.reduce((sum: number, p: { amount?: string | number }) => {
              const amount = typeof p.amount === "string" ? parseFloat(p.amount) : p.amount || 0;
              return sum + amount;
            }, 0);
            serviceTypeMap.set(type, { count: existing.count + 1, revenue: existing.revenue + revenue });
          });
          setServiceStats(
            Array.from(serviceTypeMap.entries()).map(([service_type, stats]) => ({
              service_type,
              count: stats.count,
              revenue: stats.revenue,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [adminId, refreshKey]);

  const handleSyncPayments = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/admin/sync-payments", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        setSyncMessage(`✅ ${data.message}: ${data.updated} pagos actualizados`);
        setRefreshKey((prev) => prev + 1);
      } else {
        setSyncMessage(`❌ Error: ${data.error}`);
      }
    } catch {
      setSyncMessage("❌ Error al sincronizar pagos");
    } finally {
      setSyncing(false);
    }
  };

  const ChartSection = ({ title, data, description }: { title: string; data: MonthlyData[]; description: string }) => {
    const chartDataFormatted = data.map((d) => ({ ...d, mes: formatMonth(d.month), total: d.count }));
    if (chartDataFormatted.every((d) => d.count === 0)) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart accessibilityLayer data={chartDataFormatted}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="mes" tickLine={false} tickMargin={8} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.3} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 sm:gap-0 sm:h-16">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Analíticas</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">Estadísticas y métricas del sistema</p>
            </div>
          </div>
          <Button onClick={handleSyncPayments} disabled={syncing} size="sm" className="w-full sm:w-auto sm:size-default">
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar pagos"}
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6">
        {syncMessage && (
          <div
            className={`rounded-lg p-3 text-sm ${
              syncMessage.startsWith("✅") ? "border border-green-200 bg-green-50 text-green-800" : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {syncMessage}
          </div>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="entidades">Entidades</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="ranking">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    Profesionales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generalStats.total_professionals}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{generalStats.active_professionals} activos</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Pacientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generalStats.total_patients}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Usuarios únicos</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Citas Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generalStats.total_appointments}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{generalStats.completed_appointments} completadas</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${generalStats.total_revenue?.toLocaleString("es-MX", { minimumFractionDigits: 0 })}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Tasa completadas {generalStats.total_appointments > 0 ? ((generalStats.completed_appointments / generalStats.total_appointments) * 100).toFixed(1) : 0}%</p>
                </CardContent>
              </Card>
            </div>

            <ChartSection
              title="Citas por mes"
              data={chartData.appointments}
              description="Tendencia de citas agendadas en los últimos 6 meses"
            />
          </TabsContent>

          <TabsContent value="entidades" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Programas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{digitalProducts.total}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{digitalProducts.active} activos</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Eventos y Talleres
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events.total}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{events.active} activos · {eventRegistrations} inscripciones</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Retos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{challenges.total}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{challenges.active} activos</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    Expertos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generalStats.total_professionals}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{generalStats.active_professionals} activos</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Store className="h-4 w-4" />
                    Comercios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{shops.total}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{shops.active} activos</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Centros Holísticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{holisticCenters.total}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{holisticCenters.active} activos</p>
                </CardContent>
              </Card>
              <Card className="py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <UtensilsCrossed className="h-4 w-4" />
                    Restaurantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurants.total}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{restaurants.active} activos</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="graficos" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ChartSection title="Profesionales aprobados" data={chartData.professionals} description="Nuevos profesionales por mes" />
              <ChartSection title="Programas digitales" data={chartData.digital_products} description="Productos creados por mes" />
              <ChartSection title="Eventos y talleres" data={chartData.events} description="Eventos creados por mes" />
              <ChartSection title="Inscripciones a eventos" data={chartData.event_registrations} description="Registros por mes" />
              <ChartSection title="Retos" data={chartData.challenges} description="Retos creados por mes" />
              <ChartSection title="Comercios" data={chartData.shops} description="Comercios registrados por mes" />
              <ChartSection title="Centros holísticos" data={chartData.holistic_centers} description="Centros por mes" />
              <ChartSection title="Restaurantes" data={chartData.restaurants} description="Restaurantes por mes" />
            </div>

            {serviceStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Servicios por tipo</CardTitle>
                  <CardDescription>Distribución de citas presencial vs en línea</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="mx-auto h-[250px] w-full max-w-md">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={serviceStats.map((s) => ({ name: s.service_type, value: s.count }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {serviceStats.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ranking" className="space-y-6">
            <Card className="py-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Top 5 Profesionales Más Contratados
                </CardTitle>
                <CardDescription>Profesionales con mayor número de citas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProfessionals.map((prof, index) => (
                    <div key={prof.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{index + 1}</div>
                        <Image
                          src={prof.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${prof.first_name} ${prof.last_name}`)}&background=random`}
                          alt={`${prof.first_name} ${prof.last_name}`}
                          width={48}
                          height={48}
                          className="aspect-square w-12 rounded-full border-2 border-border object-cover"
                        />
                        <div>
                          <p className="font-semibold text-foreground">
                            {prof.first_name} {prof.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{prof.profession}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold">{prof.appointment_count}</div>
                          <div className="text-xs text-muted-foreground">citas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Profesional</div>
                          <div className="text-sm font-medium text-blue-600">${prof.professional_earnings?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) || "0.00"}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Holistia</div>
                          <div className="text-sm font-medium text-green-600">${prof.holistia_earnings?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) || "0.00"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="py-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Top 5 Pacientes Más Activos
                  </CardTitle>
                  <CardDescription>Pacientes con mayor número de citas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPatients.map((patient, index) => (
                      <div key={patient.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</div>
                          <Image
                            src={patient.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.full_name || patient.email)}&background=random`}
                            alt={patient.full_name || patient.email}
                            width={40}
                            height={40}
                            className="aspect-square w-10 rounded-full border-2 border-border object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium">{patient.full_name || "Usuario"}</p>
                            <p className="text-xs text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{patient.appointment_count} citas</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="py-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Servicios Más Contratados
                  </CardTitle>
                  <CardDescription>Distribución por tipo de servicio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {serviceStats.map((service) => (
                      <div key={service.service_type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={service.service_type === "Presencial" ? "default" : "secondary"}>{service.service_type}</Badge>
                          <span className="text-sm font-bold text-green-600">
                            ${(service.revenue / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${generalStats.total_appointments > 0 ? (service.count / generalStats.total_appointments) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {service.count} citas · {generalStats.total_appointments > 0 ? ((service.count / generalStats.total_appointments) * 100).toFixed(1) : 0}% del total
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
