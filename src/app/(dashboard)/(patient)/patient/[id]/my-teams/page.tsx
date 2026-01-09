"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Users, Loader2, Target, Calendar, ArrowRight, UserPlus } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface Team {
  id: string;
  team_name: string | null;
  challenge_id: string;
  creator_id: string;
  max_members: number;
  is_full: boolean;
  created_at: string;
  challenge: {
    id: string;
    title: string;
    cover_image_url?: string;
    duration_days?: number;
    difficulty_level?: string;
  };
  member_count: number;
  is_creator: boolean;
}

export default function MyTeamsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Obtener equipos donde el usuario es creador
      const { data: createdTeams, error: createdError } = await supabase
        .from("challenge_teams")
        .select(`
          id,
          team_name,
          challenge_id,
          creator_id,
          max_members,
          is_full,
          created_at,
          challenges!inner (
            id,
            title,
            cover_image_url,
            duration_days,
            difficulty_level
          )
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (createdError) {
        console.error("Error fetching created teams:", createdError);
      }

      // Obtener equipos donde el usuario es miembro
      const { data: memberTeams, error: memberError } = await supabase
        .from("challenge_team_members")
        .select(`
          team_id,
          challenge_teams!inner (
            id,
            team_name,
            challenge_id,
            creator_id,
            max_members,
            is_full,
            created_at,
            challenges!inner (
              id,
              title,
              cover_image_url,
              duration_days,
              difficulty_level
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (memberError) {
        console.error("Error fetching member teams:", memberError);
      }

      // Obtener conteo de miembros para cada equipo
      const allTeamIds = new Set<string>();
      (createdTeams || []).forEach((team: any) => allTeamIds.add(team.id));
      (memberTeams || []).forEach((member: any) => allTeamIds.add(member.challenge_teams.id));

      const teamIdsArray = Array.from(allTeamIds);
      const memberCounts: Record<string, number> = {};

      if (teamIdsArray.length > 0) {
        const { data: counts } = await supabase
          .from("challenge_team_members")
          .select("team_id")
          .in("team_id", teamIdsArray);

        if (counts) {
          counts.forEach((count: any) => {
            memberCounts[count.team_id] = (memberCounts[count.team_id] || 0) + 1;
          });
        }
      }

      // Combinar y transformar equipos
      const combinedTeams: Team[] = [];

      // Agregar equipos creados
      (createdTeams || []).forEach((team: any) => {
        combinedTeams.push({
          id: team.id,
          team_name: team.team_name,
          challenge_id: team.challenge_id,
          creator_id: team.creator_id,
          max_members: team.max_members,
          is_full: team.is_full,
          created_at: team.created_at,
          challenge: team.challenges,
          member_count: memberCounts[team.id] || 0,
          is_creator: true,
        });
      });

      // Agregar equipos donde es miembro (excluyendo duplicados)
      const createdTeamIds = new Set((createdTeams || []).map((t: any) => t.id));
      (memberTeams || []).forEach((member: any) => {
        const team = member.challenge_teams;
        if (!createdTeamIds.has(team.id)) {
          combinedTeams.push({
            id: team.id,
            team_name: team.team_name,
            challenge_id: team.challenge_id,
            creator_id: team.creator_id,
            max_members: team.max_members,
            is_full: team.is_full,
            created_at: team.created_at,
            challenge: team.challenges,
            member_count: memberCounts[team.id] || 0,
            is_creator: false,
          });
        }
      });

      setTeams(combinedTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Error al cargar tus equipos");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (level?: string) => {
    const labels: Record<string, string> = {
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado",
      expert: "Experto",
    };
    return labels[level || ""] || level || "N/A";
  };

  const getDifficultyColor = (level?: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-blue-100 text-blue-800",
      advanced: "bg-orange-100 text-orange-800",
      expert: "bg-red-100 text-red-800",
    };
    return colors[level || ""] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Mis Equipos
          </h1>
          <p className="text-muted-foreground">
            Equipos en los que participas o has creado
          </p>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card className="py-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes equipos aún</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crea un equipo desde "Mis Retos" o acepta una invitación para unirte a uno
            </p>
            <Button onClick={() => router.push(`/patient/${userId}/my-challenges`)}>
              Ver Mis Retos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow py-4">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {team.team_name || "Equipo sin nombre"}
                  </CardTitle>
                  {team.is_creator && (
                    <Badge variant="default" className="ml-2">
                      Creador
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {team.member_count} / {team.max_members} miembros
                  </span>
                  {team.is_full && (
                    <Badge variant="outline" className="ml-2">
                      Lleno
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del reto */}
                <div className="space-y-2">
                  {team.challenge.cover_image_url && (
                    <div className="relative h-32 w-full rounded-lg overflow-hidden">
                      <Image
                        src={team.challenge.cover_image_url}
                        alt={team.challenge.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-sm">{team.challenge.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {team.challenge.duration_days && (
                        <>
                          <Calendar className="h-3 w-3" />
                          <span>{team.challenge.duration_days} días</span>
                        </>
                      )}
                      {team.challenge.difficulty_level && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${getDifficultyColor(team.challenge.difficulty_level)}`}
                        >
                          {getDifficultyLabel(team.challenge.difficulty_level)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/patient/${userId}/my-challenges/${team.challenge_id}`)
                  }
                >
                  Ver Equipo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
