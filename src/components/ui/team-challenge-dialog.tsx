"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserPlus, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface TeamChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: string;
  challengeTitle: string;
  onTeamCreated?: () => void;
}

interface AvailableUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
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

export function TeamChallengeDialog({
  open,
  onOpenChange,
  challengeId,
  challengeTitle,
  onTeamCreated,
}: TeamChallengeDialogProps) {
  const [step, setStep] = useState<"create" | "invite">("create");
  const [teamName, setTeamName] = useState("");
  const [maxMembers, setMaxMembers] = useState(5);
  const [team, setTeam] = useState<Team | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      checkExistingTeam();
    }
  }, [open, challengeId]);

  useEffect(() => {
    if (step === "invite" && team) {
      loadAvailableUsers();
    }
  }, [step, team]);

  const checkExistingTeam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar si el usuario ya tiene un equipo para este reto
      const { data: membership } = await supabase
        .from("challenge_team_members")
        .select(`
          team:challenge_teams(
            id,
            team_name,
            max_members,
            is_full,
            challenge_id,
            members:challenge_team_members(
              id,
              user_id,
              profile:profiles(first_name, last_name, avatar_url)
            )
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership?.team) {
        const teamData = Array.isArray(membership.team) ? membership.team[0] : membership.team;
        if (teamData && teamData.challenge_id === challengeId) {
          setTeam(teamData as any);
          setStep("invite");
        }
      }
    } catch (error) {
      console.error("Error checking existing team:", error);
    }
  };

  const handleCreateTeam = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/challenges/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          teamName: teamName.trim() || null,
          maxMembers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear equipo");
      }

      toast.success("Equipo creado exitosamente");
      setTeam(data.data);
      setStep("invite");
      onTeamCreated?.();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear equipo");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (!team) return;

    try {
      const response = await fetch(
        `/api/challenges/teams/available-users?teamId=${team.id}&challengeId=${challengeId}`
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
      // Remover usuario de la lista de disponibles
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "create" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Crear Equipo
              </DialogTitle>
              <DialogDescription>
                Forma un equipo de hasta 5 personas para completar el reto: <strong>{challengeTitle}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">
                  Nombre del equipo <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="teamName"
                  placeholder="Ej: Los Guerreros del Bienestar"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Máximo de miembros</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min={2}
                  max={5}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Puedes tener entre 2 y 5 miembros en tu equipo
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTeam} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Equipo
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invitar Miembros
              </DialogTitle>
              <DialogDescription>
                {team?.team_name || "Tu equipo"} - {team?.members.length || 0}/{team?.max_members || 5} miembros
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Miembros actuales */}
              <div className="space-y-2">
                <Label>Miembros del equipo</Label>
                <ScrollArea className="h-[120px] border rounded-lg p-2">
                  <div className="space-y-2">
                    {team?.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted"
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
              </div>

              {/* Usuarios disponibles para invitar */}
              {!team?.is_full && (
                <div className="space-y-2">
                  <Label>Usuarios disponibles para invitar</Label>
                  <p className="text-xs text-muted-foreground">
                    Solo puedes invitar a usuarios que sigues y que han comprado el reto
                  </p>
                  <ScrollArea className="h-[200px] border rounded-lg p-2">
                    {availableUsers.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
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
                </div>
              )}

              {team?.is_full && (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  Equipo completo
                </Badge>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
