"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StripeConnectButton } from "@/components/ui/stripe-connect-button";

// Interfaces
interface FinancialMetric {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  platform_fee: number;
  stripe_fee: number;
  professional_receives: number;
  status: string;
  created_at: string;
  description: string;
}

interface FinancialSummary {
  total_income: number;
  platform_fees: number;
  stripe_fees: number;
  net_income: number;
  total_transactions: number;
  appointments_income: number;
  events_income: number;
}

export default function ProfessionalFinancesPage() {
  useUserStoreInit();
  const professionalId = useUserId();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [professionalAppId, setProfessionalAppId] = useState<string>("");
  const [stripeStatus, setStripeStatus] = useState<{
    stripe_account_id: string | null;
    stripe_account_status: string | null;
    stripe_charges_enabled: boolean | null;
    stripe_payouts_enabled: boolean | null;
  }>({
    stripe_account_id: null,
    stripe_account_status: null,
    stripe_charges_enabled: null,
    stripe_payouts_enabled: null,
  });
  const supabase = createClient();

  // Función para obtener el nombre del período actual
  const getCurrentPeriodName = (period: string) => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
    const quarter = Math.floor(month / 3);

    switch (period) {
      case 'month':
        return `Este Mes (${monthNames[month]})`;
      case 'quarter':
        return `Este Trimestre (${quarterNames[quarter]})`;
      case 'year':
        return `Este Año (${year})`;
      case 'all':
        return 'Todo el tiempo';
      default:
        return 'Todo el tiempo';
    }
  };

  // Cargar datos financieros
  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!professionalId) {
        console.log('No professional ID provided in route params');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching financial data for professional:', professionalId);

        // Calcular rango de fechas según el período seleccionado
        const now = new Date();
        let startDate: Date;
        let previousStartDate: Date;
        let previousEndDate: Date;

        if (selectedPeriod === "month") {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else if (selectedPeriod === "quarter") {
          const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
          previousStartDate = new Date(now.getFullYear(), quarterStartMonth - 3, 1);
          previousEndDate = new Date(now.getFullYear(), quarterStartMonth, 0, 23, 59, 59);
        } else if (selectedPeriod === "year") {
          startDate = new Date(now.getFullYear(), 0, 1);
          previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
          previousEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        } else {
          startDate = new Date(2000, 0, 1); // rango amplio para "Todo el tiempo"
          previousStartDate = new Date(1999, 0, 1);
          previousEndDate = new Date(1999, 11, 31, 23, 59, 59);
        }

        // Obtener el ID de la aplicación profesional
        // Primero intentamos por ID directo
        let { data: professionalApp } = await supabase
          .from('professional_applications')
          .select('id, user_id, first_name, last_name, stripe_account_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled')
          .eq('id', professionalId)
          .maybeSingle();

        // Si no se encuentra, intentar por user_id
        if (!professionalApp) {
          const { data: appByUserId } = await supabase
            .from('professional_applications')
            .select('id, user_id, first_name, last_name, stripe_account_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled')
            .eq('user_id', professionalId)
            .maybeSingle();

          professionalApp = appByUserId;
        }

        if (!professionalApp) {
          console.error('No professional application found for ID:', professionalId);
          console.error('This ID may be a patient ID, not a professional ID');
          setLoading(false);
          return;
        }

        console.log('Professional application found:', {
          id: professionalApp.id,
          user_id: professionalApp.user_id,
          name: `${professionalApp.first_name} ${professionalApp.last_name}`
        });

        // Establecer el ID de la aplicación profesional y el estado de Stripe
        setProfessionalAppId(professionalApp.id);
        setStripeStatus({
          stripe_account_id: professionalApp.stripe_account_id,
          stripe_account_status: professionalApp.stripe_account_status,
          stripe_charges_enabled: professionalApp.stripe_charges_enabled,
          stripe_payouts_enabled: professionalApp.stripe_payouts_enabled,
        });

        // Obtener todos los pagos del profesional
        // Primero obtenemos las citas del profesional
        const { data: professionalAppointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('professional_id', professionalApp.id);

        const appointmentIds = professionalAppointments?.map(a => a.id) || [];
        console.log('Professional appointments found:', appointmentIds.length);
        console.log('Appointment IDs:', appointmentIds.slice(0, 5)); // Solo primeros 5 para no saturar logs

        // Debug: Primero intentar obtener TODOS los pagos que puede ver el profesional
        const { data: allVisiblePayments, error: allPaymentsError } = await supabase
          .from('payments')
          .select('id, payment_type, status, professional_id, appointment_id');

        console.log('ALL visible payments for professional (any status):', allVisiblePayments?.length || 0);
        console.log('Sample of all visible payments:', allVisiblePayments?.slice(0, 3));

        if (allPaymentsError) {
          console.error('Error fetching all payments:', allPaymentsError);
        }

        // Obtener pagos del profesional para el período actual
        // Primero filtrar por profesional, luego por estado
        let paymentsQuery = supabase
          .from('payments')
          .select('*');

        // Filtrar por pagos que tengan professional_id o appointment_id del profesional
        if (appointmentIds.length > 0) {
          paymentsQuery = paymentsQuery.or(`professional_id.eq.${professionalApp.id},appointment_id.in.(${appointmentIds.join(',')})`);
        } else {
          paymentsQuery = paymentsQuery.eq('professional_id', professionalApp.id);
        }

        // Después filtrar por estado
        // TEMPORAL: Mostrar todos los estados para debugging
        // paymentsQuery = paymentsQuery.eq('status', 'succeeded');
        paymentsQuery = paymentsQuery.in('status', ['succeeded', 'processing', 'pending']);

        if (selectedPeriod !== 'all') {
          paymentsQuery = paymentsQuery
            .gte('created_at', startDate.toISOString())
            .lte('created_at', now.toISOString());
        }

        const { data: currentPayments, error: paymentsError } = await paymentsQuery;

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          console.error('Error details:', paymentsError.message, paymentsError.details, paymentsError.hint);
          return;
        }

        console.log('Current payments found:', currentPayments?.length || 0);
        console.log('Current payments data:', currentPayments);
        console.log('Date range:', startDate.toISOString(), 'to', now.toISOString());

        // Debug: Log payment details
        if (currentPayments && currentPayments.length > 0) {
          console.log('Sample payment details:', {
            transfer_amount: currentPayments[0].transfer_amount,
            service_amount: currentPayments[0].service_amount,
            amount: currentPayments[0].amount,
            platform_fee: currentPayments[0].platform_fee,
            commission_percentage: currentPayments[0].commission_percentage,
          });
        }

        // Obtener pagos del período anterior para comparación
        let previousPayments: typeof currentPayments = [];
        if (selectedPeriod !== 'all') {
          let prevQuery = supabase
            .from('payments')
            .select('*')
            .in('status', ['succeeded', 'processing', 'pending'])
            .gte('created_at', previousStartDate.toISOString())
            .lte('created_at', previousEndDate.toISOString());

          if (appointmentIds.length > 0) {
            prevQuery = prevQuery.or(`professional_id.eq.${professionalApp.id},appointment_id.in.(${appointmentIds.join(',')})`);
          } else {
            prevQuery = prevQuery.eq('professional_id', professionalApp.id);
          }

          const { data: prev } = await prevQuery;
          previousPayments = prev || [];
        }

        // Calcular métricas del período actual
        // El profesional recibe el transfer_amount (monto después de comisión de plataforma)
        // Si transfer_amount no está disponible, calculamos: service_amount - platform_fee
        const totalIncome = currentPayments?.reduce((sum, p) => {
          let professionalAmount = Number(p.transfer_amount) || 0;

          // Si transfer_amount es 0 o null, calcular basado en service_amount
          if (professionalAmount === 0 && p.service_amount) {
            const serviceAmount = Number(p.service_amount) || 0;
            const platformFee = Number(p.platform_fee) || 0;
            professionalAmount = serviceAmount - platformFee;
          }

          return sum + professionalAmount;
        }, 0) || 0;

        // Los ingresos totales son lo que recibe el profesional directamente
        const netIncome = totalIncome;

        // Ingresos por tipo
        const appointmentsIncome = currentPayments
          ?.filter(p => p.payment_type === 'appointment')
          .reduce((sum, p) => {
            let professionalAmount = Number(p.transfer_amount) || 0;

            if (professionalAmount === 0 && p.service_amount) {
              const serviceAmount = Number(p.service_amount) || 0;
              const platformFee = Number(p.platform_fee) || 0;
              professionalAmount = serviceAmount - platformFee;
            }

            return sum + professionalAmount;
          }, 0) || 0;

        const eventsIncome = currentPayments
          ?.filter(p => p.payment_type === 'event')
          .reduce((sum, p) => {
            let professionalAmount = Number(p.transfer_amount) || 0;

            if (professionalAmount === 0 && p.service_amount) {
              const serviceAmount = Number(p.service_amount) || 0;
              const platformFee = Number(p.platform_fee) || 0;
              professionalAmount = serviceAmount - platformFee;
            }

            return sum + professionalAmount;
          }, 0) || 0;

        const financialSummary: FinancialSummary = {
          total_income: totalIncome,
          platform_fees: 0,
          stripe_fees: 0,
          net_income: netIncome,
          total_transactions: currentPayments?.length || 0,
          appointments_income: appointmentsIncome,
          events_income: eventsIncome,
        };

        setSummary(financialSummary);

        // Calcular cambios comparando con período anterior
        const previousTotalIncome = previousPayments?.reduce((sum, p) => {
          let professionalAmount = Number(p.transfer_amount) || 0;

          if (professionalAmount === 0 && p.service_amount) {
            const serviceAmount = Number(p.service_amount) || 0;
            const platformFee = Number(p.platform_fee) || 0;
            professionalAmount = serviceAmount - platformFee;
          }

          return sum + professionalAmount;
        }, 0) || 0;
        const previousNetIncome = previousTotalIncome;
        const previousTransactions = previousPayments?.length || 0;

        const incomeChange = previousTotalIncome > 0
          ? ((totalIncome - previousTotalIncome) / previousTotalIncome * 100).toFixed(1)
          : "0.0";

        const transactionsChange = previousTransactions > 0
          ? (((currentPayments?.length || 0) - previousTransactions) / previousTransactions * 100).toFixed(1)
          : "0.0";

        // Construir métricas
        const financialMetrics: FinancialMetric[] = [
          {
            title: "Ingresos Totales",
            value: `$${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${Number(incomeChange) >= 0 ? '+' : ''}${incomeChange}%`,
            isPositive: Number(incomeChange) >= 0,
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-100",
          },
          {
            title: "Citas",
            value: `$${appointmentsIncome.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `Servicios profesionales`,
            isPositive: true,
            icon: Calendar,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            title: "Eventos",
            value: `$${eventsIncome.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `Talleres y actividades`,
            isPositive: true,
            icon: CalendarDays,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
          },
          {
            title: "Transacciones",
            value: currentPayments?.length.toString() || "0",
            change: `${Number(transactionsChange) >= 0 ? '+' : ''}${transactionsChange}%`,
            isPositive: Number(transactionsChange) >= 0,
            icon: Receipt,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
          },
        ];

        setMetrics(financialMetrics);

        // Formatear transacciones recientes (últimas 10)
        const recentTransactions: Transaction[] = currentPayments
          ?.slice(-10)
          .reverse()
          .map(p => {
            let professionalAmount = Number(p.transfer_amount) || 0;
            const platformFee = Number(p.platform_fee) || 0;

            // Si transfer_amount es 0 o null, calcular basado en service_amount
            if (professionalAmount === 0 && p.service_amount) {
              const serviceAmount = Number(p.service_amount) || 0;
              professionalAmount = serviceAmount - platformFee;
            }

            return {
              id: p.id,
              type: p.payment_type || 'unknown',
              amount: professionalAmount, // Mostrar lo que recibe el profesional
              platform_fee: platformFee,
              stripe_fee: 0,
              professional_receives: professionalAmount,
              status: p.status,
              created_at: p.created_at,
              description: p.description || getPaymentTypeLabel(p.payment_type),
            };
          }) || [];

        setTransactions(recentTransactions);

      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [professionalId, selectedPeriod]);

  const getPaymentTypeLabel = (type: string | null) => {
    switch (type) {
      case 'appointment':
        return 'Pago de Cita';
      case 'event':
        return 'Pago de Evento';
      default:
        return 'Pago';
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month':
        return 'Este Mes';
      case 'quarter':
        return 'Este Trimestre';
      case 'year':
        return 'Este Año';
      case 'all':
        return 'Todo el tiempo';
      default:
        return 'Todo el tiempo';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-4 w-full max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
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
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Finanzas</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Resumen de tus ingresos y transacciones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[220px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{getCurrentPeriodName('month')}</SelectItem>
                <SelectItem value="quarter">{getCurrentPeriodName('quarter')}</SelectItem>
                <SelectItem value="year">{getCurrentPeriodName('year')}</SelectItem>
                <SelectItem value="all">{getCurrentPeriodName('all')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Métricas Principales */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="py-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`${metric.bgColor} p-2 rounded-lg`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {metric.isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      metric.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {metric.change}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    vs período anterior
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desglose de Ingresos */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Desglose de Ingresos - {getPeriodLabel()}</CardTitle>
              <CardDescription>Ingresos por tipo de servicio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Citas</p>
                      <p className="text-xs text-muted-foreground">Servicios profesionales</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-blue-600">
                    ${summary?.appointments_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                      <CalendarDays className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Eventos</p>
                      <p className="text-xs text-muted-foreground">Talleres y actividades</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-purple-600">
                    ${summary?.events_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Total Ingresos Brutos</p>
                  <p className="text-lg font-bold text-primary">
                    ${summary?.total_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardHeader>
              <CardTitle>Resumen Financiero - {getPeriodLabel()}</CardTitle>
              <CardDescription>Ingresos por tipo de servicio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Ingresos Totales</p>
                    <p className="text-xs text-muted-foreground">Total recibido</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">
                    ${summary?.total_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Por Citas</p>
                    <p className="text-xs text-muted-foreground">Servicios profesionales</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">
                    ${summary?.appointments_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Por Eventos</p>
                    <p className="text-xs text-muted-foreground">Talleres y actividades</p>
                  </div>
                  <p className="text-sm font-bold text-purple-600">
                    ${summary?.events_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Total de Ingresos</p>
                  <p className="text-lg font-bold text-green-600">
                    ${summary?.net_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Monto total recibido en el período
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transacciones Recientes */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Últimas 10 transacciones del período</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No hay transacciones en este período
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="shrink-0 mt-1">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {transaction.description}
                          </p>
                          <Badge className={`${getPaymentTypeColor(transaction.type)} text-xs`}>
                            {getPaymentTypeLabel(transaction.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm font-bold text-green-600">
                        ${transaction.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getPaymentTypeLabel(transaction.type)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuración de pagos con Stripe Connect */}
        {professionalAppId && (
          <StripeConnectButton
            professionalId={professionalAppId}
            initialStatus={stripeStatus}
          />
        )}
      </div>
    </div>
  );
}
