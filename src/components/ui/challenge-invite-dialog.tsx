"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string;
  type: string;
}

interface ChallengeInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: string;
  challengeTitle: string;
  currentParticipants: number;
  onInviteSuccess?: () => void;
}

export function ChallengeInviteDialog({
  open,
  onOpenChange,
  challengeId,
  challengeTitle,
  currentParticipants,
  onInviteSuccess,
}: ChallengeInviteDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const maxParticipants = 5;
  const minParticipants = 2;
  const availableSlots = maxParticipants - currentParticipants;

  useEffect(() => {
    if (open && searchQuery.length >= 2) {
      searchUsers();
    } else if (open && searchQuery.length === 0) {
      setUsers([]);
    }
  }, [searchQuery, open]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/challenges/${challengeId}/invite-users?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al buscar usuarios");
      }

      setUsers(data.data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Error al buscar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      return; // Ya está seleccionado
    }

    if (selectedUsers.length >= availableSlots) {
      toast.error(`Solo puedes invitar hasta ${availableSlots} usuario(s) más`);
      return;
    }

    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery("");
    setUsers([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Selecciona al menos un usuario para invitar");
      return;
    }

    const finalCount = currentParticipants + selectedUsers.length;
    if (finalCount < minParticipants) {
      toast.error(`Necesitas invitar al menos ${minParticipants - currentParticipants} usuario(s) más para formar un equipo`);
      return;
    }

    if (finalCount > maxParticipants) {
      toast.error(`El reto puede tener máximo ${maxParticipants} participantes`);
      return;
    }

    try {
      setInviting(true);
      const response = await fetch(`/api/challenges/${challengeId}/invite-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_ids: selectedUsers.map((u) => u.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al invitar usuarios");
      }

      toast.success(`${data.added} usuario(s) invitado(s) exitosamente`);
      setSelectedUsers([]);
      setSearchQuery("");
      setUsers([]);
      onInviteSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error inviting users:", error);
      toast.error(error instanceof Error ? error.message : "Error al invitar usuarios");
    } finally {
      setInviting(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email.split("@")[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Invitar participantes al reto</DialogTitle>
          <DialogDescription>
            Busca usuarios de toda la plataforma para invitar al reto "{challengeTitle}".
            Mínimo {minParticipants} participantes, máximo {maxParticipants}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Participantes actuales */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Participantes actuales: {currentParticipants} / {maxParticipants}
              </span>
            </div>
            {availableSlots > 0 ? (
              <p className="text-xs text-muted-foreground">
                Puedes invitar hasta {availableSlots} usuario(s) más
              </p>
            ) : (
              <p className="text-xs text-destructive">
                El reto ha alcanzado el máximo de participantes
              </p>
            )}
          </div>

          {/* Usuarios seleccionados */}
          {selectedUsers.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Usuarios seleccionados:</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getUserDisplayName(user)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{getUserDisplayName(user)}</span>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Búsqueda */}
          {availableSlots > 0 && (
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Resultados de búsqueda */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && searchQuery.length >= 2 && users.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No se encontraron usuarios
                </div>
              )}

              {!loading && users.length > 0 && (
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {getUserDisplayName(user)[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <UserPlus className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length < 2 && !loading && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Escribe al menos 2 caracteres para buscar usuarios
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedUsers.length > 0 && (
              <span>
                {selectedUsers.length} usuario(s) seleccionado(s). Total:{" "}
                {currentParticipants + selectedUsers.length} / {maxParticipants}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleInvite}
              disabled={
                inviting ||
                selectedUsers.length === 0 ||
                currentParticipants + selectedUsers.length < minParticipants ||
                currentParticipants + selectedUsers.length > maxParticipants
              }
            >
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Invitando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invitar ({selectedUsers.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
