"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  Receipt,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CalendarDays,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
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
  net_amount: number;
  status: string;
  created_at: string;
  description: string;
}

interface FinancialSummary {
  total_income: number;
  platform_fees: number;
  stripe_fees: number;
  taxes: number;
  net_income: number;
  total_transactions: number;
  appointments_income: number;
  events_income: number;
  registrations_income: number;
}

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const supabase = createClient();

  // Cargar datos financieros
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);

        // Calcular rango de fechas según el período seleccionado
        const now = new Date();
        let startDate: Date;
        let previousStartDate: Date;
        let previousEndDate: Date;

        if (selectedPeriod === "month") {
          // Mes actual
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          // Mes anterior
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else if (selectedPeriod === "quarter") {
          // Trimestre actual
          const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
          // Trimestre anterior
          previousStartDate = new Date(now.getFullYear(), quarterStartMonth - 3, 1);
          previousEndDate = new Date(now.getFullYear(), quarterStartMonth, 0, 23, 59, 59);
        } else {
          // Año actual
          startDate = new Date(now.getFullYear(), 0, 1);
          // Año anterior
          previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
          previousEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        }

        // Obtener pagos del período actual
        const { data: currentPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString())
          .in('status', ['succeeded', 'processing']);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          return;
        }

        // Obtener pagos del período anterior para comparación
        const { data: previousPayments } = await supabase
          .from('payments')
          .select('*')
          .gte('created_at', previousStartDate.toISOString())
          .lte('created_at', previousEndDate.toISOString())
          .in('status', ['succeeded', 'processing']);

        // Calcular métricas del período actual
        const totalIncome = currentPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const platformFees = currentPayments?.reduce((sum, p) => sum + Number(p.platform_fee || 0), 0) || 0;
        
        // Calcular comisiones de Stripe (aproximado: 3.6% + $3 MXN por transacción)
        const stripeFees = currentPayments?.reduce((sum, p) => {
          const transactionFee = (Number(p.amount) * 0.036) + 3;
          return sum + transactionFee;
        }, 0) || 0;

        // IVA sobre comisiones (16%)
        const taxes = (platformFees + stripeFees) * 0.16;

        // Ingresos netos de la plataforma (comisiones - impuestos - costos Stripe)
        const netIncome = platformFees - stripeFees - taxes;

        // Ingresos por tipo
        const appointmentsIncome = currentPayments
          ?.filter(p => p.payment_type === 'appointment')
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        const eventsIncome = currentPayments
          ?.filter(p => p.payment_type === 'event')
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        const registrationsIncome = currentPayments
          ?.filter(p => p.payment_type === 'registration')
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        const financialSummary: FinancialSummary = {
          total_income: totalIncome,
          platform_fees: platformFees,
          stripe_fees: stripeFees,
          taxes: taxes,
          net_income: netIncome,
          total_transactions: currentPayments?.length || 0,
          appointments_income: appointmentsIncome,
          events_income: eventsIncome,
          registrations_income: registrationsIncome,
        };

        setSummary(financialSummary);

        // Calcular cambios comparando con período anterior
        const previousTotalIncome = previousPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const previousPlatformFees = previousPayments?.reduce((sum, p) => sum + Number(p.platform_fee || 0), 0) || 0;
        const previousTransactions = previousPayments?.length || 0;

        const incomeChange = previousTotalIncome > 0
          ? ((totalIncome - previousTotalIncome) / previousTotalIncome * 100).toFixed(1)
          : "0.0";

        const feesChange = previousPlatformFees > 0
          ? ((platformFees - previousPlatformFees) / previousPlatformFees * 100).toFixed(1)
          : "0.0";

        const transactionsChange = previousTransactions > 0
          ? ((currentPayments.length - previousTransactions) / previousTransactions * 100).toFixed(1)
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
            title: "Comisiones Plataforma",
            value: `$${platformFees.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${Number(feesChange) >= 0 ? '+' : ''}${feesChange}%`,
            isPositive: Number(feesChange) >= 0,
            icon: Wallet,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            title: "Ingresos Netos",
            value: `$${netIncome.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `Después de costos`,
            isPositive: netIncome > 0,
            icon: TrendingUp,
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
            const stripeFee = (Number(p.amount) * 0.036) + 3;
            const netAmount = Number(p.amount) - Number(p.platform_fee || 0) - stripeFee;

            return {
              id: p.id,
              type: p.payment_type || 'unknown',
              amount: Number(p.amount),
              platform_fee: Number(p.platform_fee || 0),
              stripe_fee: stripeFee,
              net_amount: netAmount,
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
  }, [supabase, selectedPeriod]);

  const getPaymentTypeLabel = (type: string | null) => {
    switch (type) {
      case 'appointment':
        return 'Pago de Cita';
      case 'event':
        return 'Pago de Evento';
      case 'registration':
        return 'Inscripción Profesional';
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
      case 'registration':
        return 'bg-green-100 text-green-800';
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
      default:
        return 'Este Mes';
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
                Gestión financiera de la plataforma
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Año</SelectItem>
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
            <Card key={index}>
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

        {/* Desglose Detallado */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Desglose de Ingresos */}
          <Card>
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

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Inscripciones</p>
                      <p className="text-xs text-muted-foreground">Profesionales nuevos</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-600">
                    ${summary?.registrations_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Total Ingresos</p>
                  <p className="text-lg font-bold text-primary">
                    ${summary?.total_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desglose de Costos */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Costos - {getPeriodLabel()}</CardTitle>
              <CardDescription>Comisiones e impuestos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg border">
                      <CreditCard className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Comisiones Stripe</p>
                      <p className="text-xs text-muted-foreground">3.6% + $3 por transacción</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-red-600">
                    -${summary?.stripe_fees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg border">
                      <FileText className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Impuestos (IVA 16%)</p>
                      <p className="text-xs text-muted-foreground">Sobre comisiones</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-red-600">
                    -${summary?.taxes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                      <Wallet className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Comisiones Plataforma</p>
                      <p className="text-xs text-muted-foreground">15% en transacciones</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-blue-600">
                    +${summary?.platform_fees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Ingreso Neto Holistia</p>
                  <p className={`text-lg font-bold ${summary && summary.net_income > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${summary?.net_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comisiones - Costos Stripe - Impuestos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transacciones Recientes */}
        <Card>
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
                      <div className="flex-shrink-0 mt-1">
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
                      <p className="text-sm font-bold">
                        ${transaction.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Comisión: ${transaction.platform_fee.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nota Informativa */}
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Nota sobre el cálculo de ingresos
                </h3>
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• <strong>Comisiones de Stripe:</strong> Se calculan como 3.6% + $3 MXN por transacción</p>
                  <p>• <strong>Comisiones de la plataforma:</strong> 15% sobre el monto de cada transacción</p>
                  <p>• <strong>Impuestos:</strong> IVA del 16% se aplica sobre las comisiones totales</p>
                  <p>• <strong>Ingreso neto:</strong> Comisiones de plataforma - Costos de Stripe - Impuestos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

