"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Check, Loader2, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { FollowButton } from "@/components/ui/follow-button";

interface AvailableUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  type: string;
  professional_id?: string;
  profession?: string;
  slug?: string;
  is_verified?: boolean;
}

interface TeamMember {
  id: string;
  user_id: string;
  profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface Team {
  id: string;
  team_name: string | null;
  max_members: number;
  is_full: boolean;
  members: TeamMember[];
}

export default function InviteTeamMembersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = params.id as string;
  const challengeId = params.challengeId as string;
  const teamId = searchParams.get("teamId");

  const [team, setTeam] = useState<Team | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [challengeInfo, setChallengeInfo] = useState<{ created_by_type?: string; is_free?: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (teamId) {
      loadChallengeInfo();
      loadTeam();
      loadAvailableUsers();
    }
  }, [teamId, challengeId]);

  // Escuchar eventos de seguir/dejar de seguir para recargar usuarios disponibles
  useEffect(() => {
    if (!teamId || !challengeId) return;

    const handleFollowChange = () => {
      // Recargar usuarios disponibles después de un pequeño delay
      setTimeout(() => {
        loadAvailableUsers();
      }, 500);
    };

    // Escuchar eventos personalizados
    window.addEventListener('user-followed', handleFollowChange);
    window.addEventListener('user-unfollowed', handleFollowChange);

    return () => {
      window.removeEventListener('user-followed', handleFollowChange);
      window.removeEventListener('user-unfollowed', handleFollowChange);
    };
  }, [teamId, challengeId]);

  const loadChallengeInfo = async () => {
    if (!challengeId) return;

    try {
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("created_by_type")
        .eq("id", challengeId)
        .single();

      if (challengeError) {
        console.error("Error loading challenge info:", challengeError);
        return;
      }

      // Si el reto fue creado por un paciente, es gratuito (no requiere compra)
      const isFree = challengeData?.created_by_type === 'patient';
      
      setChallengeInfo({
        created_by_type: challengeData?.created_by_type,
        is_free: isFree,
      });
    } catch (error) {
      console.error("Error loading challenge info:", error);
    }
  };

  const loadTeam = async () => {
    if (!teamId) return;

    try {
      // Obtener el equipo
      const { data: teamData, error: teamError } = await supabase
        .from("challenge_teams")
        .select(`
          id,
          team_name,
          max_members,
          is_full
        `)
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;

      // Obtener miembros del equipo
      const { data: membersData, error: membersError } = await supabase
        .from("challenge_team_members")
        .select("id, user_id")
        .eq("team_id", teamId);

      if (membersError) throw membersError;

      // Obtener perfiles de los miembros
      const userIds = (membersData || []).map((m) => m.user_id);
      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds);

        if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap[profile.id] = profile;
          });
        }
      }

      // Combinar datos
      const members = (membersData || []).map((member) => ({
        id: member.id,
        user_id: member.user_id,
        profile: profilesMap[member.user_id] || null,
      }));

      setTeam({
        ...teamData,
        members,
      } as any);
    } catch (error) {
      console.error("Error loading team:", error);
      toast.error("Error al cargar equipo");
      router.push(`/patient/${patientId}/my-challenges`);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (!teamId || !challengeId) return;

    try {
      const response = await fetch(
        `/api/challenges/teams/available-users?teamId=${teamId}&challengeId=${challengeId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar usuarios");
      }

      setAvailableUsers(data.data || []);
    } catch (error) {
      console.error("Error loading available users:", error);
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!team) return;

    try {
      setInviting(userId);

      const response = await fetch("/api/challenges/teams/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          inviteeId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar invitación");
      }

      toast.success("Invitación enviada");
      setAvailableUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error(error instanceof Error ? error.message : "Error al enviar invitación");
    } finally {
      setInviting(null);
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al buscar usuarios");
      }

      setSearchResults(data.data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Error al buscar usuarios");
    } finally {
      setSearching(false);
    }
  };

  const handleUserClick = (user: SearchResult) => {
    // Si es profesional, redirigir a su página profesional usando professional_id o slug
    if (user.type === "professional") {
      if (user.professional_id) {
        router.push(`/patient/${patientId}/explore/professional/${user.professional_id}`);
      } else if (user.slug) {
        router.push(`/patient/${patientId}/explore/professional/${user.slug}`);
      } else {
        // Fallback: usar el user_id si no hay professional_id ni slug
        router.push(`/patient/${patientId}/explore/professional/${user.id}`);
      }
    } else {
      // Si es paciente o usuario normal, redirigir a su perfil
      router.push(`/patient/${patientId}/profile/${user.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Título y subtítulo */}
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Invitar Miembros
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {team?.team_name || "Tu equipo"} - {team?.members.length || 0}/{team?.max_members || 5} miembros
            </p>
          </div>

          {/* Miembros actuales */}
          <Card className="!py-4">
            <CardHeader>
              <CardTitle>Miembros del equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {team?.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-primary/10"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {getUserInitials(
                            member.profile.first_name,
                            member.profile.last_name
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {member.profile.first_name} {member.profile.last_name}
                        </p>
                      </div>
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Búsqueda de usuarios */}
          <Card className="!py-4">
            <CardHeader>
              <CardTitle>Buscar usuarios y expertos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Busca entre todos los usuarios y expertos de Holistia para seguir e invitar
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              {searchResults.length > 0 && (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => handleUserClick(user)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {getUserInitials(user.first_name, user.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            {user.type === "professional" && user.is_verified && (
                              <Badge variant="default" className="text-xs">
                                Verificado
                              </Badge>
                            )}
                          </div>
                          {user.type === "professional" && user.profession && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.profession}
                            </p>
                          )}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <FollowButton
                            userId={user.id}
                            size="sm"
                            variant="outline"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  No se encontraron usuarios
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usuarios disponibles para invitar */}
          {!team?.is_full ? (
            <Card className="!py-4">
              <CardHeader>
                <CardTitle>Usuarios disponibles para invitar</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {challengeInfo?.is_free
                    ? "Solo puedes invitar a usuarios que sigues"
                    : "Solo puedes invitar a usuarios que sigues y que han comprado el reto"}
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {availableUsers.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-8">
                      No hay usuarios disponibles para invitar
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {getUserInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInviteUser(user.id)}
                            disabled={inviting === user.id}
                          >
                            {inviting === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Invitar
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="!py-4">
              <CardContent>
                <Badge variant="secondary" className="w-full justify-center py-2">
                  <Users className="h-4 w-4 mr-2" />
                  Equipo completo
                </Badge>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => router.push(`/patient/${patientId}/my-challenges`)}>
              Finalizar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
