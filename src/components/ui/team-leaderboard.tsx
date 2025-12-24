"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Users, Flame, Target } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TeamLeaderboardProps {
  challengeId: string;
  currentTeamId?: string;
}

interface LeaderboardEntry {
  team_id: string;
  rank: number;
  total_points: number;
  total_checkins: number;
  completion_percentage: number;
  current_streak: number;
  team: {
    team_name: string;
  };
  memberCount: number;
  memberAvatars: Array<{
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }>;
}

export function TeamLeaderboard({ challengeId, currentTeamId }: TeamLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [challengeId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/leaderboard?challengeId=${challengeId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al cargar leaderboard");

      setLeaderboard(data.data || []);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Error al cargar la tabla de clasificación");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tabla de Clasificación</CardTitle>
          <CardDescription>Cargando rankings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-600" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Tabla de Clasificación
        </CardTitle>
        <CardDescription>
          {leaderboard.length} equipos compitiendo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay equipos registrados aún
            </p>
          ) : (
            leaderboard.map((entry, index) => {
              const isCurrentTeam = entry.team_id === currentTeamId;
              const isTopThree = entry.rank <= 3;

              return (
                <motion.div
                  key={entry.team_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all",
                    isCurrentTeam && "ring-2 ring-primary bg-primary/5",
                    isTopThree && !isCurrentTeam && "bg-gradient-to-r from-background to-muted/30"
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center min-w-[60px]">
                    {getRankIcon(entry.rank) ? (
                      <div className="flex flex-col items-center">
                        {getRankIcon(entry.rank)}
                        <span className="text-xs font-bold mt-1">#{entry.rank}</span>
                      </div>
                    ) : (
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full font-bold",
                        getRankBadgeColor(entry.rank)
                      )}>
                        {entry.rank}
                      </div>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        {entry.team.team_name}
                      </h4>
                      {isCurrentTeam && (
                        <Badge variant="default" className="text-xs">
                          Tu equipo
                        </Badge>
                      )}
                    </div>

                    {/* Member Avatars */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {entry.memberAvatars.slice(0, 4).map((member, i) => (
                          <Avatar
                            key={i}
                            className="h-6 w-6 border-2 border-background"
                          >
                            <AvatarImage src={member.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {entry.memberCount > 4 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border-2 border-background text-xs font-medium">
                            +{entry.memberCount - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {entry.memberCount} {entry.memberCount === 1 ? "miembro" : "miembros"}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <div className="text-right">
                        <p className="font-bold">{entry.total_points}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-blue-600" />
                      <div className="text-right">
                        <p className="font-bold">{entry.total_checkins}</p>
                        <p className="text-xs text-muted-foreground">checks</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-600" />
                      <div className="text-right">
                        <p className="font-bold">{entry.current_streak}</p>
                        <p className="text-xs text-muted-foreground">racha</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
