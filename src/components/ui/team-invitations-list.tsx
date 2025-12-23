"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  status: string;
  created_at: string;
  team: {
    id: string;
    team_name: string | null;
    max_members: number;
    is_full: boolean;
    challenge: {
      id: string;
      title: string;
      cover_image_url: string | null;
    };
    creator: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  };
  inviter: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export function TeamInvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/challenges/teams/invitations?type=received");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar invitaciones");
      }

      setInvitations(data.data || []);
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId: string, action: "accept" | "reject") => {
    try {
      setResponding(invitationId);

      const response = await fetch("/api/challenges/teams/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al responder invitación");
      }

      toast.success(action === "accept" ? "Te uniste al equipo" : "Invitación rechazada");

      // Remover invitación de la lista
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast.error(error instanceof Error ? error.message : "Error al responder");
    } finally {
      setResponding(null);
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invitaciones a Equipos ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg"
          >
            {/* Imagen del reto */}
            <div className="shrink-0">
              <img
                src={
                  invitation.team.challenge.cover_image_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    invitation.team.challenge.title
                  )}&background=random&size=80`
                }
                alt={invitation.team.challenge.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            </div>

            {/* Información */}
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold">{invitation.team.challenge.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {invitation.team.team_name || "Equipo sin nombre"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={invitation.inviter.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(
                      invitation.inviter.first_name,
                      invitation.inviter.last_name
                    )}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  <strong>
                    {invitation.inviter.first_name} {invitation.inviter.last_name}
                  </strong>{" "}
                  te invitó a su equipo
                </p>
              </div>

              {invitation.team.is_full && (
                <Badge variant="secondary">Equipo lleno</Badge>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={() => handleResponse(invitation.id, "accept")}
                disabled={responding === invitation.id || invitation.team.is_full}
                className="flex-1 sm:flex-none"
              >
                {responding === invitation.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Aceptar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResponse(invitation.id, "reject")}
                disabled={responding === invitation.id}
                className="flex-1 sm:flex-none"
              >
                {responding === invitation.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Rechazar
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
