"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Target,
  Calendar,
  BarChart3,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AnalyticsData {
  overview: {
    totalParticipants: number;
    totalCheckins: number;
    averageCompletionRate: number;
    totalRevenue: number;
  };
  engagement: Array<{
    date: string;
    checkins: number;
  }>;
  teamVsIndividual: {
    team: {
      participants: number;
      completionRate: number;
      avgCheckins: number;
    };
    individual: {
      participants: number;
      completionRate: number;
      avgCheckins: number;
    };
  };
  topChallenges: Array<{
    id: string;
    title: string;
    participants: number;
    checkins: number;
    engagement: number;
  }>;
  recentActivity: Array<{
    id: string;
    date: string;
    userName: string;
    userAvatar: string | null;
    challengeTitle: string;
  }>;
}

export function ProfessionalAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/professional?timeRange=${timeRange}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al cargar analytics");

      setAnalytics(data.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Error al cargar analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudieron cargar los analytics</p>
      </div>
    );
  }

  const { overview, engagement, teamVsIndividual, topChallenges, recentActivity } = analytics;

  return (
    <div className="space-y-6">
      {/* Header con selector de tiempo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Métricas de rendimiento de tus retos
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
            <SelectItem value="365">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participantes</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                Total de usuarios inscritos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalCheckins}</div>
              <p className="text-xs text-muted-foreground">
                Check-ins completados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completitud</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.averageCompletionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Tasa promedio de completitud
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${overview.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresos totales
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs con información detallada */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="comparison">Comparativa</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        {/* Tab de Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Retos por Engagement</CardTitle>
              <CardDescription>
                Retos con mejor rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topChallenges.map((challenge, index) => (
                  <div
                    key={challenge.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{challenge.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {challenge.participants} participantes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{challenge.checkins}</p>
                      <p className="text-xs text-muted-foreground">check-ins</p>
                    </div>
                  </div>
                ))}
                {topChallenges.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay datos suficientes para mostrar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfica de engagement (simplificada) */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Diario</CardTitle>
              <CardDescription>
                Check-ins por día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {engagement.map((day, index) => {
                  const maxCheckins = Math.max(...engagement.map((d) => d.checkins));
                  const height = maxCheckins > 0
                    ? (day.checkins / maxCheckins) * 100
                    : 0;

                  return (
                    <div
                      key={index}
                      className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-all relative group cursor-pointer"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {new Date(day.date).toLocaleDateString("es", {
                          month: "short",
                          day: "numeric",
                        })}
                        : {day.checkins}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Comparativa */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipos vs Individuales</CardTitle>
              <CardDescription>
                Comparación de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Equipos */}
                <div className="space-y-4 p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Equipos</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Participantes</p>
                      <p className="text-2xl font-bold">
                        {teamVsIndividual.team.participants}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completitud</p>
                      <p className="text-2xl font-bold">
                        {teamVsIndividual.team.completionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-ins promedio</p>
                      <p className="text-2xl font-bold">
                        {teamVsIndividual.team.avgCheckins.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individuales */}
                <div className="space-y-4 p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">Individuales</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Participantes</p>
                      <p className="text-2xl font-bold">
                        {teamVsIndividual.individual.participants}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completitud</p>
                      <p className="text-2xl font-bold">
                        {teamVsIndividual.individual.completionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-ins promedio</p>
                      <p className="text-2xl font-bold">
                        {teamVsIndividual.individual.avgCheckins.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Actividad */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimos check-ins de tus participantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Avatar>
                      <AvatarImage src={activity.userAvatar || undefined} />
                      <AvatarFallback>
                        {activity.userName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{activity.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.challengeTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {new Date(activity.date).toLocaleDateString("es", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay actividad reciente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
