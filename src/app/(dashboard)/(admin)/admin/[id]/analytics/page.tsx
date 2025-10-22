"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Award,
  Clock,
  BarChart3,
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

export default function AnalyticsPage() {
  const params = useParams();
  const adminId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Obtener estadísticas generales
        const [
          { count: professionalsCount },
          { count: activeProfessionalsCount },
          { data: appointmentsData },
          { data: paymentsData },
        ] = await Promise.all([
          supabase.from('professional_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
          supabase.from('professional_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved').eq('is_active', true),
          supabase.from('appointments').select('*'),
          supabase.from('payments').select('*').eq('status', 'succeeded'),
        ]);

        // Obtener pacientes únicos
        const uniquePatients = new Set(appointmentsData?.map(a => a.patient_id) || []);

        // Calcular ingresos totales
        const totalRevenue = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Citas completadas
        const completedAppointments = appointmentsData?.filter(a => a.status === 'completed').length || 0;

        setGeneralStats({
          total_professionals: professionalsCount || 0,
          total_patients: uniquePatients.size,
          total_appointments: appointmentsData?.length || 0,
          total_revenue: totalRevenue,
          active_professionals: activeProfessionalsCount || 0,
          completed_appointments: completedAppointments,
        });

        // Obtener top profesionales
        const { data: professionals } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, profile_photo, profession')
          .eq('status', 'approved');

        if (professionals && appointmentsData && paymentsData) {
          const professionalStats = professionals.map(prof => {
            const profAppointments = appointmentsData.filter(a => a.professional_id === prof.id);
            const profAppointmentIds = profAppointments.map(a => a.id);
            const profPayments = paymentsData.filter(p => profAppointmentIds.includes(p.appointment_id));

            return {
              ...prof,
              appointment_count: profAppointments.length,
              total_revenue: profPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
            };
          });

          const topProfs = professionalStats
            .sort((a, b) => b.appointment_count - a.appointment_count)
            .slice(0, 5);

          setTopProfessionals(topProfs);
        }

        // Obtener top pacientes
        if (appointmentsData && paymentsData) {
          const patientMap = new Map<string, { count: number; spent: number }>();

          appointmentsData.forEach(apt => {
            const existing = patientMap.get(apt.patient_id) || { count: 0, spent: 0 };
            const aptPayments = paymentsData.filter(p => p.appointment_id === apt.id);
            const spent = aptPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            patientMap.set(apt.patient_id, {
              count: existing.count + 1,
              spent: existing.spent + spent,
            });
          });

          const patientIds = Array.from(patientMap.keys()).slice(0, 20);
          const { data: patientsData } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', patientIds);

          if (patientsData) {
            const topPats = patientsData
              .map(patient => {
                const stats = patientMap.get(patient.id);
                return {
                  ...patient,
                  appointment_count: stats?.count || 0,
                  total_spent: stats?.spent || 0,
                };
              })
              .sort((a, b) => b.appointment_count - a.appointment_count)
              .slice(0, 5);

            setTopPatients(topPats);
          }
        }

        // Estadísticas por tipo de servicio
        if (appointmentsData && paymentsData) {
          const serviceTypeMap = new Map<string, { count: number; revenue: number }>();

          appointmentsData.forEach(apt => {
            const type = apt.appointment_type === 'presencial' ? 'Presencial' : 'En línea';
            const existing = serviceTypeMap.get(type) || { count: 0, revenue: 0 };
            const aptPayments = paymentsData.filter(p => p.appointment_id === apt.id);
            const revenue = aptPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            serviceTypeMap.set(type, {
              count: existing.count + 1,
              revenue: existing.revenue + revenue,
            });
          });

          const serviceStatsArray = Array.from(serviceTypeMap.entries()).map(([type, stats]) => ({
            service_type: type,
            count: stats.count,
            revenue: stats.revenue,
          }));

          setServiceStats(serviceStatsArray);
        }

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [adminId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analíticas</h1>
            <p className="text-muted-foreground">
              Estadísticas y métricas del sistema
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalStats.total_professionals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {generalStats.active_professionals} activos
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalStats.total_patients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuarios únicos
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Citas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalStats.total_appointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {generalStats.completed_appointments} completadas
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(generalStats.total_revenue / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MXN
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Promedio por Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${generalStats.total_appointments > 0
                ? ((generalStats.total_revenue / generalStats.total_appointments) / 100).toFixed(2)
                : '0.00'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MXN
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tasa Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generalStats.total_appointments > 0
                ? ((generalStats.completed_appointments / generalStats.total_appointments) * 100).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De total de citas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Profesionales */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Top 5 Profesionales Más Contratados
          </CardTitle>
          <CardDescription>
            Profesionales con mayor número de citas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProfessionals.map((prof, index) => (
              <div
                key={prof.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <Image
                    src={prof.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${prof.first_name} ${prof.last_name}`)}&background=random`}
                    alt={`${prof.first_name} ${prof.last_name}`}
                    width={48}
                    height={48}
                    className="w-12 h-12 aspect-square rounded-full object-cover border-2 border-border"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      {prof.first_name} {prof.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{prof.profession}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">{prof.appointment_count}</span>
                    <span className="text-sm text-muted-foreground">citas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      ${(prof.total_revenue / 100).toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Pacientes y Servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pacientes */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top 5 Pacientes Más Activos
            </CardTitle>
            <CardDescription>
              Pacientes con mayor número de citas agendadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPatients.map((patient, index) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <Image
                      src={patient.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.full_name || patient.email)}&background=random`}
                      alt={patient.full_name || patient.email}
                      width={40}
                      height={40}
                      className="w-10 h-10 aspect-square rounded-full object-cover border-2 border-border"
                    />
                    <div>
                      <p className="font-medium text-sm">{patient.full_name || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{patient.appointment_count} citas</Badge>
                    <p className="text-xs text-green-600 mt-1">
                      ${(patient.total_spent / 100).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Servicios Más Contratados */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Servicios Más Contratados
            </CardTitle>
            <CardDescription>
              Distribución por tipo de servicio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceStats.map((service, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={service.service_type === 'Presencial' ? 'default' : 'secondary'}>
                        {service.service_type}
                      </Badge>
                      <span className="text-sm font-medium">{service.count} citas</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      ${(service.revenue / 100).toLocaleString('es-MX')}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(service.count / generalStats.total_appointments) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {((service.count / generalStats.total_appointments) * 100).toFixed(1)}% del total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
