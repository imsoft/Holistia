"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Users,
  Flame,
  Target,
  TrendingUp,
  Award,
  Star,
  Zap,
  Calendar,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface TeamStatsDashboardProps {
  teamId: string;
}

interface TeamStats {
  team: {
    team_name: string;
    total_points: number;
    total_checkins: number;
    current_streak: number;
    longest_streak: number;
    days_completed: number;
    completion_rate: number;
    active_members: number;
    member_count: number;
    achievements_count: number;
    leaderboard_rank: number | null;
    challenge_title: string;
  };
  achievements: Array<{
    id: string;
    achievement_type: string;
    title: string;
    description: string;
    icon_name: string;
    points_awarded: number;
    earned_at: string;
  }>;
  members: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    totalCheckins: number;
    totalPoints: number;
  }>;
}

export function TeamStatsDashboard({ teamId }: TeamStatsDashboardProps) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [teamId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}/stats`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al cargar estadísticas");

      setStats(data.data);
    } catch (error) {
      console.error("Error loading team stats:", error);
      toast.error("Error al cargar estadísticas del equipo");
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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const { team, achievements, members } = stats;

  // Ordenar miembros por puntos
  const sortedMembers = [...members].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="space-y-6">
      {/* Header con métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.total_points}</div>
              <p className="text-xs text-muted-foreground">
                {team.total_checkins} check-ins completados
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
              <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
              <Flame className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.current_streak} días</div>
              <p className="text-xs text-muted-foreground">
                Máxima: {team.longest_streak} días
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
              <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {team.active_members}/{team.member_count}
              </div>
              <Progress
                value={(team.active_members / team.member_count) * 100}
                className="mt-2"
              />
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
              <CardTitle className="text-sm font-medium">Ranking</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {team.leaderboard_rank ? `#${team.leaderboard_rank}` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {team.achievements_count} logros desbloqueados
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs con contenido detallado */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="members">Miembros</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
        </TabsList>

        {/* Tab de Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progreso del Equipo</CardTitle>
              <CardDescription>
                Reto: {team.challenge_title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Tasa de Completitud</span>
                  <span className="font-medium">{team.completion_rate.toFixed(1)}%</span>
                </div>
                <Progress value={team.completion_rate} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Días Completados</p>
                    <p className="text-xl font-bold">{team.days_completed}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-ins</p>
                    <p className="text-xl font-bold">{team.total_checkins}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Miembros */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Miembros</CardTitle>
              <CardDescription>
                Contribución individual al equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedMembers.map((member, index) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {index < 3 && (
                        <div className={`
                          flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${index === 0 ? "bg-yellow-100 text-yellow-700" : ""}
                          ${index === 1 ? "bg-gray-100 text-gray-700" : ""}
                          ${index === 2 ? "bg-orange-100 text-orange-700" : ""}
                        `}>
                          {index + 1}
                        </div>
                      )}
                      <Avatar>
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback>
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.totalCheckins} check-ins
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{member.totalPoints}</p>
                      <p className="text-xs text-muted-foreground">puntos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Logros */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logros Desbloqueados</CardTitle>
              <CardDescription>
                {achievements.length} de muchos posibles logros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
                    Aún no hay logros desbloqueados. ¡Sigue trabajando en equipo!
                  </p>
                ) : (
                  achievements.map((achievement) => {
                    const IconComponent = achievement.icon_name === 'trophy' ? Trophy
                      : achievement.icon_name === 'users' ? Users
                      : achievement.icon_name === 'flame' ? Flame
                      : achievement.icon_name === 'star' ? Star
                      : Award;

                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-start gap-3 p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20"
                      >
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                          <IconComponent className="h-6 w-6 text-yellow-700 dark:text-yellow-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="gap-1">
                              <Zap className="h-3 w-3" />
                              +{achievement.points_awarded} pts
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(achievement.earned_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
