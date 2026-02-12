"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import Link from "next/link";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Package,
  Target,
  ShoppingBag,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Appointment } from "@/types";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ProfessionalOnboardingChecklist } from "@/components/shared/professional-onboarding-checklist";

interface ProfessionalDataForDashboard {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  registration_fee_paid: boolean;
  registration_fee_amount: number;
  registration_fee_currency: string;
  registration_fee_paid_at: string | null;
  registration_fee_expires_at: string | null;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
}

interface StatsData {
  upcomingCount: number;
  upcomingChange: number;
  activePatients: number;
  weeklyChange: number;
  totalRevenue: number;
  servicesCount: number;
  challengesCount: number;
  digitalProductsCount: number;
  eventsCount: number;
}

interface MonthlyMetrics {
  profileViews: number;
  bookings: number;
  income: number;
}

export interface DashboardClientProps {
  professionalData: ProfessionalDataForDashboard;
  googleCalendarConnected: boolean;
  appointments: Appointment[];
  statsData: StatsData;
  monthlyMetrics: MonthlyMetrics;
}

export function DashboardClient({
  professionalData,
  googleCalendarConnected,
  appointments,
  statsData,
  monthlyMetrics,
}: DashboardClientProps) {
  useUserStoreInit();
  const router = useRouter();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<{
    connected: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
  }>({
    connected: !!(professionalData.stripe_account_id &&
      professionalData.stripe_charges_enabled &&
      professionalData.stripe_payouts_enabled),
    charges_enabled: professionalData.stripe_charges_enabled || false,
    payouts_enabled: professionalData.stripe_payouts_enabled || false,
  });

  // Background check for Stripe Connect status (fire-and-forget)
  useEffect(() => {
    if (professionalData.stripe_account_id) {
      fetch(`/api/stripe/connect/account-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professional_id: professionalData.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.connected && data.charges_enabled && data.payouts_enabled) {
            setStripeConnectStatus({
              connected: true,
              charges_enabled: data.charges_enabled,
              payouts_enabled: data.payouts_enabled,
            });
          }
        })
        .catch((err) => {
          console.error("Error verificando estado de Stripe:", err);
        });
    }
  }, [professionalData.stripe_account_id, professionalData.id]);

  // Build stats cards from server data
  const stats = [
    {
      title: "Citas Próximas",
      value: statsData.upcomingCount.toString(),
      change: statsData.upcomingChange >= 0 ? `+${statsData.upcomingChange} vs semana pasada` : `${statsData.upcomingChange} vs semana pasada`,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pacientes Activos",
      value: statsData.activePatients.toString(),
      change: statsData.weeklyChange >= 0 ? `+${statsData.weeklyChange} esta semana` : `${statsData.weeklyChange} esta semana`,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Ingresos Totales",
      value: `$${statsData.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "Neto después de comisión (15%)",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Servicios",
      value: String(statsData.servicesCount),
      change: "Gestionar servicios",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      href: "/services",
    },
    {
      title: "Retos",
      value: String(statsData.challengesCount),
      change: "Gestionar retos",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/challenges",
    },
    {
      title: "Programas",
      value: String(statsData.digitalProductsCount),
      change: "Gestionar programas",
      icon: ShoppingBag,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      href: "/digital-products",
    },
    {
      title: "Eventos",
      value: String(statsData.eventsCount),
      change: "Mis eventos",
      icon: CalendarDays,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      href: "/my-events",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      case "completed":
        return "Completada";
      default:
        return status;
    }
  };

  const handleViewAllAppointments = () => {
    router.push(`/appointments`);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const registrationFeeStatus = {
    paid: professionalData.registration_fee_paid,
    amount: professionalData.registration_fee_amount,
    currency: professionalData.registration_fee_currency,
    expires_at: professionalData.registration_fee_expires_at,
    paid_at: professionalData.registration_fee_paid_at,
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <div className="border-b border-border bg-card w-full">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0 w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
                {professionalData.is_verified && <VerifiedBadge size={20} />}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {`Bienvenido/a, ${professionalData.first_name} ${professionalData.last_name}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full">
        {/* Onboarding guiado para profesionales recién aprobados */}
        <ProfessionalOnboardingChecklist />

        {/* Métricas del mes */}
        <section className="space-y-3 sm:space-y-4 w-full">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Tu resumen del mes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-primary/20 bg-card overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                    {monthlyMetrics.profileViews}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Visitas a tu perfil este mes
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-card overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                    {monthlyMetrics.bookings}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Citas reservadas este mes
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-card overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                    ${monthlyMetrics.income.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ingresos del mes (neto)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
          {stats.map((stat) => {
            const cardContent = (
              <Card className={stat.href ? "cursor-pointer transition-colors hover:shadow-md hover:border-primary/30" : undefined}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 sm:p-2 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    {stat.href ? (
                      <span className="text-primary font-medium">{stat.change} →</span>
                    ) : (
                      <>
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {stat.change}
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>
            );
            return stat.href ? (
              <Link key={stat.title} href={stat.href}>
                {cardContent}
              </Link>
            ) : (
              <div key={stat.title}>{cardContent}</div>
            );
          })}
        </div>

        {/* Próximas Citas */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div>
                <CardTitle className="text-base sm:text-lg">Próximas Citas</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Citas programadas para hoy
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAllAppointments}
                className="w-full sm:w-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">No hay citas programadas para hoy</div>
              ) : (
                appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-3 sm:gap-0"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-xs sm:text-sm font-medium text-foreground">
                          {appointment.time}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-medium text-foreground truncate">
                          {appointment.patient.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {appointment.type} • {appointment.duration} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 justify-end sm:justify-start">
                      <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                        {getStatusText(appointment.status)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAppointment(appointment)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerta de Estado de Inscripción */}
        <>
          {/* Sin pagar */}
          {!registrationFeeStatus.paid && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-sm sm:text-base font-semibold text-red-900">
                      ⚠️ Pago de Inscripción Pendiente
                    </h3>
                    <p className="text-xs sm:text-sm text-red-800">
                      Para aparecer en la plataforma de Holistia y poder recibir citas de pacientes,
                      necesitas pagar la cuota de inscripción anual de <strong>${registrationFeeStatus.amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {registrationFeeStatus.currency.toUpperCase()}</strong>.
                    </p>
                    <Button
                      className="mt-3 bg-red-600 hover:bg-red-700"
                      size="sm"
                      onClick={() => router.push(`/patient/${professionalData.user_id}/explore/become-professional`)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar Inscripción
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagado pero expirado */}
          {registrationFeeStatus.paid && registrationFeeStatus.expires_at && new Date(registrationFeeStatus.expires_at) <= new Date() && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-sm sm:text-base font-semibold text-red-900">
                      ❌ Inscripción Expirada
                    </h3>
                    <p className="text-xs sm:text-sm text-red-800">
                      Tu inscripción anual expiró el <strong>{new Date(registrationFeeStatus.expires_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</strong>.
                      Para seguir apareciendo en la plataforma y poder recibir citas, necesitas renovar tu pago de <strong>${registrationFeeStatus.amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {registrationFeeStatus.currency.toUpperCase()}</strong>.
                    </p>
                    <Button
                      className="mt-3 bg-red-600 hover:bg-red-700"
                      size="sm"
                      onClick={() => router.push(`/patient/${professionalData.user_id}/explore/become-professional`)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Renovar Inscripción
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagado pero próximo a vencer (30 días) */}
          {registrationFeeStatus.paid &&
            registrationFeeStatus.expires_at &&
            new Date(registrationFeeStatus.expires_at) > new Date() &&
            new Date(registrationFeeStatus.expires_at).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm sm:text-base font-semibold text-yellow-900">
                        ⚠️ Renovación Próxima
                      </h3>
                      <p className="text-xs sm:text-sm text-yellow-800">
                        Tu inscripción expira el <strong>{new Date(registrationFeeStatus.expires_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</strong>.
                        Renueva tu pago de <strong>${registrationFeeStatus.amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {registrationFeeStatus.currency.toUpperCase()}</strong> para seguir apareciendo en la plataforma sin interrupciones.
                      </p>
                      <Button
                        className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                        size="sm"
                        onClick={() => router.push(`/patient/${professionalData.user_id}/explore/become-professional`)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Renovar Ahora
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Pagado y vigente (solo mostrar si es reciente, menos de 7 días desde el pago) */}
          {registrationFeeStatus.paid &&
            registrationFeeStatus.expires_at &&
            new Date(registrationFeeStatus.expires_at) > new Date() &&
            new Date(registrationFeeStatus.expires_at).getTime() - new Date().getTime() >= 30 * 24 * 60 * 60 * 1000 &&
            registrationFeeStatus.paid_at &&
            new Date().getTime() - new Date(registrationFeeStatus.paid_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-green-900">
                        ✅ Inscripción Activa
                      </h3>
                      <p className="text-xs sm:text-sm text-green-800 mt-1">
                        Tu inscripción está vigente hasta el <strong>{new Date(registrationFeeStatus.expires_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</strong>.
                        ¡Gracias por ser parte de Holistia!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </>

        {/* Alertas de Integraciones Pendientes */}
        {registrationFeeStatus.paid &&
          registrationFeeStatus.expires_at &&
          new Date(registrationFeeStatus.expires_at) > new Date() && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alerta de Stripe Connect */}
              {!stripeConnectStatus.connected && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-sm sm:text-base font-semibold text-blue-900">
                          Conecta tu cuenta de Stripe
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-800">
                          Para recibir pagos por tus citas y servicios, necesitas conectar tu cuenta de Stripe.
                        </p>
                        <Button
                          className="mt-3 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                          onClick={() => router.push("/finances")}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Conectar Stripe
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alerta de Google Calendar */}
              {!googleCalendarConnected && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-sm sm:text-base font-semibold text-purple-900">
                          Conecta Google Calendar
                        </h3>
                        <p className="text-xs sm:text-sm text-purple-800">
                          Sincroniza tus citas automáticamente con tu calendario de Google para no perder ninguna cita.
                        </p>
                        <Button
                          className="mt-3 bg-purple-600 hover:bg-purple-700"
                          size="sm"
                          onClick={() => router.push("/appointments")}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Conectar Google Calendar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
      </div>

      {/* Modal para ver detalles de la cita */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Detalles de la Cita</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Información completa de la cita seleccionada
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 sm:space-y-6">
              {/* Información del paciente */}
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Información del Paciente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Nombre:</span>
                    <span className="truncate">{selectedAppointment.patient.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Email:</span>
                    <span className="truncate">{selectedAppointment.patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Teléfono:</span>
                    <span>{selectedAppointment.patient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Información de la cita */}
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Información de la Cita</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col sm:flex-row sm:gap-1">
                      <span className="font-medium">Fecha:</span>
                      <span className="text-muted-foreground">{new Date(selectedAppointment.date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Hora:</span>
                    <span>{selectedAppointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Duración:</span>
                    <span>{selectedAppointment.duration} minutos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Tipo:</span>
                    <span>{selectedAppointment.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Ubicación:</span>
                    <span className="truncate">{selectedAppointment.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">Estado:</span>
                    <Badge className={`${getStatusColor(selectedAppointment.status)} text-xs`}>
                      {getStatusText(selectedAppointment.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedAppointment.notes && (
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Notas</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
