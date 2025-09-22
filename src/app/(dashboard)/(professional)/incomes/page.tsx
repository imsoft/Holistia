"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  BarChart3,
  Download,
  Filter,
  Eye
} from "lucide-react";

// Datos de ejemplo para ingresos
const mockIncomeData = {
  currentMonth: {
    total: 12500,
    sessions: 45,
    averagePerSession: 278,
    growth: 12
  },
  lastMonth: {
    total: 11160,
    sessions: 42,
    averagePerSession: 266
  },
  monthlyBreakdown: [
    { month: "Ene", amount: 9800, sessions: 35 },
    { month: "Feb", amount: 11200, sessions: 40 },
    { month: "Mar", amount: 12500, sessions: 45 },
    { month: "Abr", amount: 10800, sessions: 38 },
    { month: "May", amount: 13200, sessions: 48 },
    { month: "Jun", amount: 12500, sessions: 45 }
  ],
  recentTransactions: [
    {
      id: 1,
      patient: "María González",
      date: "2024-01-22",
      amount: 350,
      type: "Consulta Especializada",
      status: "completado"
    },
    {
      id: 2,
      patient: "Carlos Rodríguez", 
      date: "2024-01-22",
      amount: 250,
      type: "Consulta General",
      status: "completado"
    },
    {
      id: 3,
      patient: "Ana Martínez",
      date: "2024-01-21",
      amount: 300,
      type: "Seguimiento",
      status: "completado"
    }
  ]
};

const IncomesPage = () => {
  const { currentMonth, lastMonth, monthlyBreakdown, recentTransactions } = mockIncomeData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análisis de Ingresos</h1>
          <p className="text-muted-foreground">Monitorea tus ingresos y rendimiento financiero</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Este Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonth.total)}</div>
            <div className="flex items-center text-xs">
              <span className={getGrowthColor(currentMonth.growth)}>
                {currentMonth.growth > 0 ? '+' : ''}{currentMonth.growth}%
              </span>
              <span className="text-muted-foreground ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Realizadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonth.sessions}</div>
            <p className="text-xs text-muted-foreground">
              +{currentMonth.sessions - lastMonth.sessions} vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Sesión</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonth.averagePerSession)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(currentMonth.averagePerSession - lastMonth.averagePerSession)} vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonth.total / 30)}</div>
            <p className="text-xs text-muted-foreground">promedio diario</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Desglose mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Desglose Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyBreakdown.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="font-medium">{month.month}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(month.amount)}</div>
                    <div className="text-sm text-muted-foreground">{month.sessions} sesiones</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transacciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Transacciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{transaction.patient}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.type} • {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      +{formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {transaction.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Ver Reportes</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Download className="h-6 w-6" />
              <span>Exportar Datos</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Eye className="h-6 w-6" />
              <span>Análisis Detallado</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomesPage;