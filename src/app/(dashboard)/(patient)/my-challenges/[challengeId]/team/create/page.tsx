"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function CreateTeamPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const patientId = useUserId();
  const challengeId = params.challengeId as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createTeamAndRedirect = async () => {
      try {
        setLoading(true);

        // Crear equipo automáticamente con valores por defecto
        const response = await fetch("/api/challenges/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId,
            teamName: null, // Sin nombre por defecto
            maxMembers: 5, // Máximo por defecto
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Si ya existe un equipo, buscar el teamId existente
          if (data.error?.includes("ya está en un equipo") || data.error?.includes("Ya estás")) {
            // Buscar el equipo existente
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              const { data: purchase } = await supabase
                .from("challenge_purchases")
                .select("team_id")
                .eq("participant_id", user.id)
                .eq("challenge_id", challengeId)
                .maybeSingle();
              
              if (purchase?.team_id) {
                router.push(`/my-challenges/${challengeId}/team/invite?teamId=${purchase.team_id}`);
                return;
              }
            }
          }
          throw new Error(data.error || "Error al crear equipo");
        }

        // Redirigir directamente a invitar participantes
        router.push(`/my-challenges/${challengeId}/team/invite?teamId=${data.data.id}`);
      } catch (error) {
        console.error("Error creating team:", error);
        toast.error(error instanceof Error ? error.message : "Error al crear equipo");
        router.push(`/my-challenges`);
      } finally {
        setLoading(false);
      }
    };

    if (challengeId && patientId) {
      createTeamAndRedirect();
    }
  }, [challengeId, patientId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Preparando invitaciones...</p>
      </div>
    </div>
  );
}
