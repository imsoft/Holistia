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
  Calculator,
  RefreshCw,
  Package,
  Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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
  digital_products_income: number;
  challenges_income: number;
}

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [exampleAmount, setExampleAmount] = useState(700);
  const [eventAmount, setEventAmount] = useState(500);
  const [registrationAmount, setRegistrationAmount] = useState(888);
  const [programAmount, setProgramAmount] = useState(499);
  const [challengeAmount, setChallengeAmount] = useState(399);
  const [syncingPayments, setSyncingPayments] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartData, setChartData] = useState<{ month: string; income: number; transactions: number }[]>([]);
  const supabase = createClient();

  const chartConfig = {
    income: { label: "Ingresos", color: "var(--primary)" },
    transactions: { label: "Transacciones", color: "var(--chart-2)" },
    mes: { label: "Mes" },
    Citas: { label: "Citas", color: "var(--chart-1)" },
    Eventos: { label: "Eventos", color: "var(--chart-2)" },
    Inscripciones: { label: "Inscripciones", color: "var(--chart-3)" },
    Programas: { label: "Programas", color: "var(--chart-4)" },
    Retos: { label: "Retos", color: "var(--chart-5)" },
  } satisfies ChartConfig;

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
      default:
        return 'Este Mes';
    }
  };

  // Función para calcular valores del ejemplo (Citas - 15% comisión)
  const calculateExampleValues = (amount: number) => {
    const stripeBase = (amount * 0.036) + 3;
    const stripeTax = stripeBase * 0.16;
    const stripeTotal = stripeBase + stripeTax;
    const platformFee = amount * 0.15;
    const netIncome = platformFee - stripeTotal;
    const professionalReceives = amount - platformFee;

    return {
      amount,
      stripeBase: Math.round(stripeBase * 100) / 100,
      stripeTax: Math.round(stripeTax * 100) / 100,
      stripeTotal: Math.round(stripeTotal * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      professionalReceives: Math.round(professionalReceives * 100) / 100,
    };
  };

  // Función para calcular valores de eventos (20% comisión con Connect)
  const calculateEventValues = (amount: number) => {
    const stripeBase = (amount * 0.036) + 3;
    const stripeTax = stripeBase * 0.16;
    const stripeTotal = stripeBase + stripeTax;
    const platformFee = amount * 0.20; // 20% para eventos
    const netIncome = platformFee - stripeTotal;
    const professionalReceives = amount - platformFee;

    return {
      amount,
      stripeBase: Math.round(stripeBase * 100) / 100,
      stripeTax: Math.round(stripeTax * 100) / 100,
      stripeTotal: Math.round(stripeTotal * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      professionalReceives: Math.round(professionalReceives * 100) / 100,
    };
  };

  // Función para calcular valores de inscripciones (Con Stripe pero sin comisión Holistia)
  const handleSyncPayments = async () => {
    try {
      setSyncingPayments(true);
      toast.info("Sincronizando pagos con Stripe...");

      const response = await fetch("/api/admin/sync-payments-by-session", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al sincronizar pagos");
      }

      toast.success(
        `Sincronización completada: ${result.updated} pagos actualizados de ${result.total_checked} revisados`
      );

      // Mostrar detalles si hay resultados
      if (result.results && result.results.length > 0) {
        const failedCount = result.results.filter((r: any) => !r.success).length;

        if (failedCount > 0) {
          toast.warning(`${failedCount} pagos no pudieron sincronizarse`);
        }
      }

      // Refetch data después de sincronizar
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Error syncing payments:", error);
      toast.error(error.message || "Error al sincronizar pagos");
    } finally {
      setSyncingPayments(false);
    }
  };

  const calculateRegistrationValues = (amount: number) => {
    // Las inscripciones SÍ pasan por Stripe pero NO tienen comisión de Holistia
    const stripeBase = (amount * 0.036) + 3;
    const stripeTax = stripeBase * 0.16;
    const stripeTotal = stripeBase + stripeTax;
    const platformFee = 0; // Sin comisión de Holistia para inscripciones
    const netIncome = amount - stripeTotal; // Monto total menos comisión de Stripe
    const professionalReceives = amount - platformFee; // Recibe el monto completo

    return {
      amount,
      stripeBase: Math.round(stripeBase * 100) / 100,
      stripeTax: Math.round(stripeTax * 100) / 100,
      stripeTotal: Math.round(stripeTotal * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      professionalReceives: Math.round(professionalReceives * 100) / 100,
    };
  };

  // Cargar datos financieros - primero sincroniza con Stripe para datos actualizados
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);

        // Sincronizar pagos con Stripe para asegurar datos más actualizados
        try {
          await fetch("/api/admin/sync-payments-by-session", { method: "POST" });
          await fetch("/api/admin/sync-payments", { method: "POST" });
        } catch (syncErr) {
          console.warn("Sync con Stripe falló, usando datos locales:", syncErr);
        }

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
          .gte('paid_at', startDate.toISOString())
          .lte('paid_at', now.toISOString())
          .in('status', ['succeeded', 'processing']);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          return;
        }

        // Obtener compras de productos digitales del período actual
        const { data: digitalProductPurchases } = await supabase
          .from('digital_product_purchases')
          .select('amount, purchased_at')
          .eq('payment_status', 'succeeded')
          .gte('purchased_at', startDate.toISOString())
          .lte('purchased_at', now.toISOString());

        // Obtener compras de retos del período actual
        const { data: challengePurchases } = await supabase
          .from('challenge_purchases')
          .select('amount, purchased_at')
          .eq('payment_status', 'completed')
          .gte('purchased_at', startDate.toISOString())
          .lte('purchased_at', now.toISOString());

        // Obtener pagos de los últimos 6 meses para gráficos
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const { data: chartPayments } = await supabase
          .from('payments')
          .select('*')
          .gte('paid_at', sixMonthsAgo.toISOString())
          .lte('paid_at', now.toISOString())
          .in('status', ['succeeded', 'processing']);

        // Obtener compras de productos digitales de los últimos 6 meses
        const { data: chartDigitalProducts } = await supabase
          .from('digital_product_purchases')
          .select('amount, purchased_at')
          .eq('payment_status', 'succeeded')
          .gte('purchased_at', sixMonthsAgo.toISOString())
          .lte('purchased_at', now.toISOString());

        // Obtener compras de retos de los últimos 6 meses
        const { data: chartChallenges } = await supabase
          .from('challenge_purchases')
          .select('amount, purchased_at')
          .eq('payment_status', 'completed')
          .gte('purchased_at', sixMonthsAgo.toISOString())
          .lte('purchased_at', now.toISOString());

        // Agrupar por mes para gráfico de tendencia
        const monthLabels: string[] = [];
        const chartDataMap: Record<string, { income: number; transactions: number }> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toISOString().slice(0, 7);
          monthLabels.push(key);
          chartDataMap[key] = { income: 0, transactions: 0 };
        }
        // Agregar pagos de appointments/events/registrations
        (chartPayments || []).forEach((p: { paid_at?: string; amount?: string | number }) => {
          const dateStr = p.paid_at || (p as { created_at?: string }).created_at;
          if (dateStr) {
            const monthKey = dateStr.slice(0, 7);
            if (chartDataMap[monthKey]) {
              chartDataMap[monthKey].income += Number(p.amount) || 0;
              chartDataMap[monthKey].transactions += 1;
            }
          }
        });
        // Agregar productos digitales
        (chartDigitalProducts || []).forEach((p: { purchased_at?: string; amount?: string | number }) => {
          if (p.purchased_at) {
            const monthKey = p.purchased_at.slice(0, 7);
            if (chartDataMap[monthKey]) {
              chartDataMap[monthKey].income += Number(p.amount) || 0;
              chartDataMap[monthKey].transactions += 1;
            }
          }
        });
        // Agregar retos
        (chartChallenges || []).forEach((p: { purchased_at?: string; amount?: string | number }) => {
          if (p.purchased_at) {
            const monthKey = p.purchased_at.slice(0, 7);
            if (chartDataMap[monthKey]) {
              chartDataMap[monthKey].income += Number(p.amount) || 0;
              chartDataMap[monthKey].transactions += 1;
            }
          }
        });
        setChartData(
          monthLabels.map((month) => {
            const [year, monthNum] = month.split("-").map(Number);
            const mes = `${MONTH_NAMES[monthNum - 1]} ${year}`;
            return {
              month,
              mes,
              income: chartDataMap[month]?.income || 0,
              transactions: chartDataMap[month]?.transactions || 0,
            };
          })
        );

        // Obtener pagos del período anterior para comparación
        const { data: previousPayments } = await supabase
          .from('payments')
          .select('*')
          .gte('paid_at', previousStartDate.toISOString())
          .lte('paid_at', previousEndDate.toISOString())
          .in('status', ['succeeded', 'processing']);

        // Obtener compras de productos digitales del período anterior
        const { data: previousDigitalProducts } = await supabase
          .from('digital_product_purchases')
          .select('amount')
          .eq('payment_status', 'succeeded')
          .gte('purchased_at', previousStartDate.toISOString())
          .lte('purchased_at', previousEndDate.toISOString());

        // Obtener compras de retos del período anterior
        const { data: previousChallenges } = await supabase
          .from('challenge_purchases')
          .select('amount')
          .eq('payment_status', 'completed')
          .gte('purchased_at', previousStartDate.toISOString())
          .lte('purchased_at', previousEndDate.toISOString());

        // Calcular ingresos de productos digitales y retos
        const digitalProductsIncome = digitalProductPurchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const challengesIncome = challengePurchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        // Calcular métricas del período actual (incluyendo productos digitales y retos)
        const totalIncome = (currentPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0) 
          + digitalProductsIncome 
          + challengesIncome;
        // Calcular comisiones de plataforma (15% del monto total)
        // Si platform_fee está en la BD lo usa, si no, calcula el 15%
        // Para productos digitales y retos también aplicamos 15% de comisión
        const platformFees = (currentPayments?.reduce((sum, p) => {
          const fee = p.platform_fee && Number(p.platform_fee) > 0 
            ? Number(p.platform_fee) 
            : Number(p.amount) * 0.15;
          return sum + fee;
        }, 0) || 0) 
        + (digitalProductsIncome * 0.15) 
        + (challengesIncome * 0.15);
        
        // Calcular comisiones de Stripe (3.6% + $3 MXN por transacción)
        // Incluir transacciones de productos digitales y retos
        const stripeFees = (currentPayments?.reduce((sum, p) => {
          const transactionFee = (Number(p.amount) * 0.036) + 3;
          return sum + transactionFee;
        }, 0) || 0)
        + (digitalProductPurchases?.reduce((sum, p) => {
          const amount = Number(p.amount) || 0;
          return sum + (amount * 0.036) + 3;
        }, 0) || 0)
        + (challengePurchases?.reduce((sum, p) => {
          const amount = Number(p.amount) || 0;
          return sum + (amount * 0.036) + 3;
        }, 0) || 0);

        // IVA solo sobre comisiones de Stripe (16%)
        const taxes = stripeFees * 0.16;

        // Comisión total de Stripe (incluye IVA)
        const totalStripeCommission = stripeFees + taxes;

        // Ingresos netos de la plataforma (comisiones plataforma - comisión total Stripe)
        const netIncome = platformFees - totalStripeCommission;

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
          total_transactions: (currentPayments?.length || 0) + (digitalProductPurchases?.length || 0) + (challengePurchases?.length || 0),
          appointments_income: appointmentsIncome,
          events_income: eventsIncome,
          registrations_income: registrationsIncome,
          digital_products_income: digitalProductsIncome,
          challenges_income: challengesIncome,
        };

        setSummary(financialSummary);

        // Calcular cambios comparando con período anterior
        const previousTotalIncome = (previousPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0)
          + (previousDigitalProducts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0)
          + (previousChallenges?.reduce((sum, p) => sum + Number(p.amount), 0) || 0);
        const previousPlatformFees = previousPayments?.reduce((sum, p) => {
          const fee = p.platform_fee && Number(p.platform_fee) > 0 
            ? Number(p.platform_fee) 
            : Number(p.amount) * 0.15;
          return sum + fee;
        }, 0) || 0;
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
            // Calcular platform_fee (15% si no está en la BD)
            const platformFee = p.platform_fee && Number(p.platform_fee) > 0 
              ? Number(p.platform_fee) 
              : Number(p.amount) * 0.15;
            const netAmount = Number(p.amount) - platformFee - stripeFee;

            return {
              id: p.id,
              type: p.payment_type || 'unknown',
              amount: Number(p.amount),
              platform_fee: platformFee,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, refreshKey]);

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
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
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
                Gestión financiera de la plataforma · Datos sincronizados con Stripe al cargar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[220px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{getCurrentPeriodName('month')}</SelectItem>
                <SelectItem value="quarter">{getCurrentPeriodName('quarter')}</SelectItem>
                <SelectItem value="year">{getCurrentPeriodName('year')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleSyncPayments}
              disabled={syncingPayments}
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncingPayments ? "animate-spin" : ""}`} />
              {syncingPayments ? "Sincronizando..." : "Actualizar desde Stripe"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Métricas Principales */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <AdminStatCard
              key={index}
              title={metric.title}
              value={metric.value}
              trend={metric.change !== "Después de costos" ? { value: metric.change, positive: metric.isPositive } : undefined}
              secondaryText={metric.change !== "Después de costos" ? "vs período anterior" : undefined}
              tertiaryText={metric.change === "Después de costos" ? "Después de costos" : undefined}
            />
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Tendencia de Ingresos</CardTitle>
              <CardDescription>Ingresos y transacciones de los últimos 6 meses (datos sincronizados con Stripe)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="mes" tickLine={false} tickMargin={8} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="var(--color-income)"
                    fill="var(--color-income)"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardHeader>
              <CardTitle>Ingresos por Tipo - {getPeriodLabel()}</CardTitle>
              <CardDescription>Distribución de ingresos del período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {summary && summary.total_income > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data=                      {[
                        { name: "Citas", value: summary.appointments_income },
                        { name: "Eventos", value: summary.events_income },
                        { name: "Inscripciones", value: summary.registrations_income },
                        { name: "Programas", value: summary.digital_products_income },
                        { name: "Retos", value: summary.challenges_income },
                      ].filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: "Citas", value: summary.appointments_income },
                        { name: "Eventos", value: summary.events_income },
                        { name: "Inscripciones", value: summary.registrations_income },
                        { name: "Programas", value: summary.digital_products_income },
                        { name: "Retos", value: summary.challenges_income },
                      ]
                        .filter((d) => d.value > 0)
                        .map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                  No hay ingresos en este período para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desglose Detallado */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Desglose de Ingresos */}
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

                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                      <Package className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Programas</p>
                      <p className="text-xs text-muted-foreground">Productos digitales</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-indigo-600">
                    ${summary?.digital_products_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg">
                      <Target className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Retos</p>
                      <p className="text-xs text-muted-foreground">Retos de bienestar</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-amber-600">
                    ${summary?.challenges_income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Análisis de Costos - {getPeriodLabel()}</CardTitle>
              <CardDescription>Comisiones e impuestos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
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
                    +${summary?.platform_fees.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

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
                    -${summary?.stripe_fees.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg border">
                      <FileText className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Impuestos (IVA 16%)</p>
                      <p className="text-xs text-muted-foreground">Sobre comisiones Stripe</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-red-600">
                    -${summary?.taxes.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Ingreso Neto Holistia</p>
                  <p className={`text-lg font-bold ${summary && summary.net_income > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${summary?.net_income.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comisiones Plataforma - Comisión Total Stripe (incluye IVA)
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

        {/* Ejemplo de Cálculo para Inscripciones */}
        <Card className="py-4 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-orange-900 dark:text-orange-100 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cálculo para Inscripciones (Sin comisión Holistia)
            </CardTitle>
            <CardDescription className="text-orange-800 dark:text-orange-200">
              Inscripciones profesionales con Stripe pero sin comisión de Holistia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Input para cambiar el monto de inscripción */}
              <div className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Label htmlFor="registration-amount" className="text-sm font-medium">
                    Monto de inscripción:
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      id="registration-amount"
                      type="number"
                      value={registrationAmount}
                      onChange={(e) => setRegistrationAmount(Number(e.target.value) || 0)}
                      className="w-24 h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Con Stripe - Sin comisión Holistia
                </div>
              </div>

              {/* Monto Original */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Monto Original</p>
                    <p className="text-xs text-muted-foreground">Inscripción de ${registrationAmount}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-orange-600">${registrationAmount.toFixed(2)}</p>
              </div>

              {/* Comisiones Stripe */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">Comisiones de Stripe</h4>
                
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-red-400">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Comisión base (3.6% + $3)</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">${calculateRegistrationValues(registrationAmount).stripeBase.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-orange-400">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">IVA sobre Stripe (16%)</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">${calculateRegistrationValues(registrationAmount).stripeTax.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-700" />
                    <span className="text-sm font-semibold">Comisión total Stripe</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">${calculateRegistrationValues(registrationAmount).stripeTotal.toFixed(2)}</span>
                </div>
              </div>


              {/* Resultados Finales */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">Resultados</h4>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold">Ingreso neto Holistia</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">${calculateRegistrationValues(registrationAmount).netIncome.toFixed(2)}</span>
                </div>

              </div>

              {/* Fórmula para inscripciones */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Fórmula:</strong> Ingreso Neto Holistia = Monto Total - Comisión Stripe<br/>
                  <strong>Resultado:</strong> ${registrationAmount.toFixed(2)} - ${calculateRegistrationValues(registrationAmount).stripeTotal.toFixed(2)} = ${calculateRegistrationValues(registrationAmount).netIncome.toFixed(2)}<br/>
                  <strong>Nota:</strong> Las inscripciones generan ingresos netos para Holistia después de descontar Stripe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo Detallado de Cálculos */}
        <Card className="py-4 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cálculo para Citas Profesionales (15% comisión con Connect)
            </CardTitle>
            <CardDescription className="text-green-800 dark:text-green-200">
              Citas con comisión del 15% y procesamiento con Stripe Connect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Input para cambiar el monto */}
              <div className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Label htmlFor="example-amount" className="text-sm font-medium">
                    Monto del ejemplo:
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      id="example-amount"
                      type="number"
                      value={exampleAmount}
                      onChange={(e) => setExampleAmount(Number(e.target.value) || 0)}
                      className="w-24 h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Los cálculos se actualizan automáticamente
                </div>
              </div>

              {/* Monto Original */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Monto Original</p>
                    <p className="text-xs text-muted-foreground">Cita de ${exampleAmount}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-green-600">${exampleAmount.toFixed(2)}</p>
              </div>

              {/* Comisiones Stripe */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">Comisiones de Stripe</h4>
                
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-red-400">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Comisión base (3.6% + $3)</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">${calculateExampleValues(exampleAmount).stripeBase.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-orange-400">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">IVA sobre Stripe (16%)</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">${calculateExampleValues(exampleAmount).stripeTax.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-700" />
                    <span className="text-sm font-semibold">Comisión total Stripe</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">${calculateExampleValues(exampleAmount).stripeTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Comisiones Plataforma */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">Comisiones de Holistia</h4>
                
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Comisión plataforma (15%)</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">${calculateExampleValues(exampleAmount).platformFee.toFixed(2)}</span>
                </div>
              </div>

              {/* Resultados Finales */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">Resultados</h4>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold">Ingreso neto Holistia</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">${calculateExampleValues(exampleAmount).netIncome.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold">Profesional recibe</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">${calculateExampleValues(exampleAmount).professionalReceives.toFixed(2)}</span>
                </div>
              </div>

              {/* Fórmula */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Fórmula:</strong> Ingreso Neto Holistia = Comisión Plataforma - Comisión Total Stripe<br/>
                  <strong>Resultado:</strong> ${calculateExampleValues(exampleAmount).platformFee.toFixed(2)} - ${calculateExampleValues(exampleAmount).stripeTotal.toFixed(2)} = ${calculateExampleValues(exampleAmount).netIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Ejemplo de Cálculo para Eventos */}
        <Card className="py-4 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="text-purple-900 dark:text-purple-100 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Cálculo para Eventos (20% comisión con Connect)
            </CardTitle>
            <CardDescription className="text-purple-800 dark:text-purple-200">
              Eventos con comisión del 20% y procesamiento con Stripe Connect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Input para cambiar el monto del evento */}
              <div className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Label htmlFor="event-amount" className="text-sm font-medium">
                    Monto del evento:
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      id="event-amount"
                      type="number"
                      value={eventAmount}
                      onChange={(e) => setEventAmount(Number(e.target.value) || 0)}
                      className="w-24 h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Comisión: 20% + Stripe Connect
                </div>
              </div>

              {/* Monto Original */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Monto Original</p>
                    <p className="text-xs text-muted-foreground">Evento de ${eventAmount}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-purple-600">${eventAmount.toFixed(2)}</p>
              </div>

              {/* Comisiones Stripe */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Comisiones de Stripe</h4>
                
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-red-400">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Comisión base (3.6% + $3)</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">${calculateEventValues(eventAmount).stripeBase.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-orange-400">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">IVA sobre Stripe (16%)</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">${calculateEventValues(eventAmount).stripeTax.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-700" />
                    <span className="text-sm font-semibold">Comisión total Stripe</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">${calculateEventValues(eventAmount).stripeTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Comisiones Plataforma */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Comisiones de Holistia</h4>
                
                <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950/20 rounded border-l-4 border-purple-500">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Comisión plataforma (20%)</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">${calculateEventValues(eventAmount).platformFee.toFixed(2)}</span>
                </div>
              </div>

              {/* Resultados Finales */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Resultados</h4>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold">Ingreso neto Holistia</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">${calculateEventValues(eventAmount).netIncome.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Profesional recibe</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">${calculateEventValues(eventAmount).professionalReceives.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo de Cálculo para Programas */}
        <Card className="py-4 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cálculo para Programas (15% comisión con Connect)
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              Programas digitales con comisión del 15% y procesamiento con Stripe Connect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Label htmlFor="program-amount" className="text-sm font-medium">
                    Monto del programa:
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      id="program-amount"
                      type="number"
                      value={programAmount}
                      onChange={(e) => setProgramAmount(Number(e.target.value) || 0)}
                      className="w-24 h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Comisión: 15% + Stripe Connect
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Monto Original</p>
                    <p className="text-xs text-muted-foreground">Programa de ${programAmount}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-blue-600">${programAmount.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Comisiones de Stripe</h4>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-red-400">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Comisión base (3.6% + $3)</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">${calculateExampleValues(programAmount).stripeBase.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-orange-400">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">IVA sobre Stripe (16%)</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">${calculateExampleValues(programAmount).stripeTax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-700" />
                    <span className="text-sm font-semibold">Comisión total Stripe</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">${calculateExampleValues(programAmount).stripeTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Comisiones de Holistia</h4>
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Comisión plataforma (15%)</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">${calculateExampleValues(programAmount).platformFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Resultados</h4>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold">Ingreso neto Holistia</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">${calculateExampleValues(programAmount).netIncome.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold">Profesional recibe</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">${calculateExampleValues(programAmount).professionalReceives.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Fórmula:</strong> Ingreso Neto Holistia = Comisión Plataforma - Comisión Total Stripe<br/>
                  <strong>Resultado:</strong> ${calculateExampleValues(programAmount).platformFee.toFixed(2)} - ${calculateExampleValues(programAmount).stripeTotal.toFixed(2)} = ${calculateExampleValues(programAmount).netIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo de Cálculo para Retos */}
        <Card className="py-4 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Cálculo para Retos (15% comisión con Connect)
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-200">
              Retos con comisión del 15% y procesamiento con Stripe Connect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Label htmlFor="challenge-amount" className="text-sm font-medium">
                    Monto del reto:
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      id="challenge-amount"
                      type="number"
                      value={challengeAmount}
                      onChange={(e) => setChallengeAmount(Number(e.target.value) || 0)}
                      className="w-24 h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Comisión: 15% + Stripe Connect
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Monto Original</p>
                    <p className="text-xs text-muted-foreground">Reto de ${challengeAmount}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-amber-600">${challengeAmount.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Comisiones de Stripe</h4>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-red-400">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Comisión base (3.6% + $3)</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">${calculateExampleValues(challengeAmount).stripeBase.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border-l-4 border-orange-400">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">IVA sobre Stripe (16%)</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">${calculateExampleValues(challengeAmount).stripeTax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-700" />
                    <span className="text-sm font-semibold">Comisión total Stripe</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">${calculateExampleValues(challengeAmount).stripeTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Comisiones de Holistia</h4>
                <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded border-l-4 border-amber-500">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Comisión plataforma (15%)</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">${calculateExampleValues(challengeAmount).platformFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Resultados</h4>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold">Ingreso neto Holistia</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">${calculateExampleValues(challengeAmount).netIncome.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold">Profesional recibe</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">${calculateExampleValues(challengeAmount).professionalReceives.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Fórmula:</strong> Ingreso Neto Holistia = Comisión Plataforma - Comisión Total Stripe<br/>
                  <strong>Resultado:</strong> ${calculateExampleValues(challengeAmount).platformFee.toFixed(2)} - ${calculateExampleValues(challengeAmount).stripeTotal.toFixed(2)} = ${calculateExampleValues(challengeAmount).netIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nota Informativa */}
        <Card className="py-4 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
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
                  <p>• <strong>Citas:</strong> 15% comisión + Stripe Connect (3.6% + $3 + IVA)</p>
                  <p>• <strong>Eventos:</strong> 20% comisión + Stripe Connect (3.6% + $3 + IVA)</p>
                  <p>• <strong>Programas:</strong> 15% comisión + Stripe Connect (3.6% + $3 + IVA)</p>
                  <p>• <strong>Retos:</strong> 15% comisión + Stripe Connect (3.6% + $3 + IVA)</p>
                  <p>• <strong>Inscripciones:</strong> Sin comisión Holistia + Stripe (3.6% + $3 + IVA)</p>
                  <p>• <strong>Impuestos:</strong> IVA del 16% solo sobre comisiones de Stripe</p>
                  <p>• <strong>Ingreso neto:</strong> Comisiones de plataforma - Costos de Stripe</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Utilidades de Administración */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Utilidades de Administración</CardTitle>
            <CardDescription>Herramientas para gestionar la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Sincronizar Pagos</h3>
                    <p className="text-xs text-muted-foreground">
                      Actualiza pagos desde Stripe
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sincroniza los pagos que están en "processing" o "pending" con el estado real en Stripe.
                </p>
                <Button
                  onClick={handleSyncPayments}
                  disabled={syncingPayments}
                  className="w-full"
                  size="sm"
                >
                  {syncingPayments ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Sincronizar Ahora
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

