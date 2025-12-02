"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  const params = useParams();
  const professionalId = params.id as string;
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
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
        const { data: professionalApp } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('id', professionalId)
          .maybeSingle();

        if (!professionalApp) {
          console.log('No professional application found for user');
          setLoading(false);
          return;
        }

        console.log('Professional application ID:', professionalApp.id);

        // Obtener pagos del profesional para el período actual
        // Usar created_at en lugar de paid_at porque paid_at puede ser null
        let paymentsQuery = supabase
          .from('payments')
          .select('*')
          .eq('professional_id', professionalApp.id)
          .eq('status', 'succeeded'); // Solo pagos completados

        if (selectedPeriod !== 'all') {
          paymentsQuery = paymentsQuery
            .gte('created_at', startDate.toISOString())
            .lte('created_at', now.toISOString());
        }

        const { data: currentPayments, error: paymentsError } = await paymentsQuery;

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          return;
        }

        console.log('Current payments found:', currentPayments?.length || 0);
        console.log('Current payments data:', currentPayments);
        console.log('Date range:', startDate.toISOString(), 'to', now.toISOString());

        // Obtener pagos del período anterior para comparación
        let previousPayments: typeof currentPayments = [];
        if (selectedPeriod !== 'all') {
          const { data: prev } = await supabase
            .from('payments')
            .select('*')
            .eq('professional_id', professionalApp.id)
            .gte('created_at', previousStartDate.toISOString())
            .lte('created_at', previousEndDate.toISOString())
            .eq('status', 'succeeded'); // Solo pagos completados
          previousPayments = prev || [];
        }

        // Calcular métricas del período actual
        // El profesional recibe el transfer_amount (monto después de comisión de plataforma)
        const totalIncome = currentPayments?.reduce((sum, p) => {
          const transferAmount = Number(p.transfer_amount) || 0;
          return sum + transferAmount;
        }, 0) || 0;

        // Los ingresos totales son lo que recibe el profesional directamente
        const netIncome = totalIncome;

        // Ingresos por tipo
        const appointmentsIncome = currentPayments
          ?.filter(p => p.payment_type === 'appointment')
          .reduce((sum, p) => {
            const transferAmount = Number(p.transfer_amount) || 0;
            return sum + transferAmount;
          }, 0) || 0;

        const eventsIncome = currentPayments
          ?.filter(p => p.payment_type === 'event')
          .reduce((sum, p) => {
            const transferAmount = Number(p.transfer_amount) || 0;
            return sum + transferAmount;
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
          const transferAmount = Number(p.transfer_amount) || 0;
          return sum + transferAmount;
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
            const transferAmount = Number(p.transfer_amount) || 0;
            const platformFee = Number(p.platform_fee) || 0;

            return {
              id: p.id,
              type: p.payment_type || 'unknown',
              amount: transferAmount, // Mostrar lo que recibe el profesional
              platform_fee: platformFee,
              stripe_fee: 0,
              professional_receives: transferAmount,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando datos financieros...</p>
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
      </div>
    </div>
  );
}
