"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  UserX,
  Crown,
  LogOut,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  totalCheckins: number;
  totalPoints: number;
}

interface TeamManagementDialogProps {
  teamId: string;
  teamName: string;
  isCreator: boolean;
  creatorId: string;
  members: TeamMember[];
  currentUserId: string;
  onMemberRemoved?: () => void;
  onLeadershipTransferred?: () => void;
  onLeftTeam?: () => void;
}

export function TeamManagementDialog({
  teamId,
  teamName,
  isCreator,
  creatorId,
  members,
  currentUserId,
  onMemberRemoved,
  onLeadershipTransferred,
  onLeftTeam,
}: TeamManagementDialogProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiresTransfer, setRequiresTransfer] = useState(false);

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_member",
          userId: selectedMember.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al remover miembro");

      toast.success("Miembro removido exitosamente");
      setShowRemoveDialog(false);
      setSelectedMember(null);
      onMemberRemoved?.();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.message || "Error al remover miembro");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferLeadership = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer_leadership",
          userId: selectedMember.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al transferir liderazgo");

      toast.success("Liderazgo transferido exitosamente");
      setShowTransferDialog(false);
      setSelectedMember(null);
      onLeadershipTransferred?.();
    } catch (error: any) {
      console.error("Error transferring leadership:", error);
      toast.error(error.message || "Error al transferir liderazgo");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/manage`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresTransfer) {
          setRequiresTransfer(true);
          throw new Error(data.error);
        }
        throw new Error(data.error || "Error al salir del equipo");
      }

      if (data.teamDeleted) {
        toast.success("Equipo eliminado exitosamente");
      } else {
        toast.success("Saliste del equipo exitosamente");
      }

      setShowLeaveDialog(false);
      onLeftTeam?.();
    } catch (error: any) {
      console.error("Error leaving team:", error);
      toast.error(error.message || "Error al salir del equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Menú de acciones para cada miembro */}
      <div className="space-y-3">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const isMemberCreator = member.userId === creatorId;

          return (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.avatarUrl || undefined} />
                  <AvatarFallback>
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    {isMemberCreator && (
                      <Badge variant="default" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Líder
                      </Badge>
                    )}
                    {isSelf && (
                      <Badge variant="secondary">Tú</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {member.totalPoints} puntos • {member.totalCheckins} check-ins
                  </p>
                </div>
              </div>

              {isCreator && !isSelf && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedMember(member);
                        setShowTransferDialog(true);
                      }}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Transferir liderazgo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedMember(member);
                        setShowRemoveDialog(true);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Remover del equipo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón para salir del equipo */}
      <div className="mt-6 pt-6 border-t">
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive"
          onClick={() => setShowLeaveDialog(true)}
        >
          <LogOut className="h-4 w-4" />
          Salir del equipo
        </Button>
      </div>

      {/* Dialog de confirmación para remover miembro */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres remover a{" "}
              <strong>
                {selectedMember?.firstName} {selectedMember?.lastName}
              </strong>{" "}
              del equipo? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación para transferir liderazgo */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Transferir liderazgo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres transferir el liderazgo del equipo a{" "}
              <strong>
                {selectedMember?.firstName} {selectedMember?.lastName}
              </strong>
              ? Ya no podrás gestionar el equipo a menos que el nuevo líder te lo
              devuelva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransferLeadership} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Transferir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación para salir del equipo */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {requiresTransfer && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
              ¿Salir del equipo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isCreator && members.length > 1 ? (
                <div className="space-y-2">
                  <p className="text-destructive font-medium">
                    Eres el líder del equipo.
                  </p>
                  <p>
                    Debes transferir el liderazgo a otro miembro antes de salir del
                    equipo.
                  </p>
                </div>
              ) : isCreator ? (
                <p>
                  Eres el único miembro del equipo. Al salir, el equipo será eliminado
                  permanentemente.
                </p>
              ) : (
                <p>
                  ¿Estás seguro de que quieres salir del equipo "{teamName}"? Esta
                  acción no se puede deshacer.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            {!(isCreator && members.length > 1) && (
              <AlertDialogAction
                onClick={handleLeaveTeam}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isCreator ? "Eliminar equipo" : "Salir"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
