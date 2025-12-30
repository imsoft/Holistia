"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface JoinChallengeButtonProps {
  challengeId: string;
  userId: string;
}

export function JoinChallengeButton({ challengeId, userId }: JoinChallengeButtonProps) {
  const [isJoining, setIsJoining] = useState(false);
  const supabase = createClient();

  const handleJoin = async () => {
    try {
      setIsJoining(true);
      const toastId = toast.loading("Uniéndote al reto...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Verificar si ya está participando
      const { data: existingParticipation } = await supabase
        .from('challenge_purchases')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('participant_id', user.id)
        .maybeSingle();

      if (existingParticipation) {
        toast.dismiss(toastId);
        toast.info("Ya estás participando en este reto");
        return;
      }

      // Crear participación
      const { error: participationError } = await supabase
        .from('challenge_purchases')
        .insert({
          challenge_id: challengeId,
          participant_id: user.id,
          access_granted: true,
        });

      if (participationError) {
        throw new Error(participationError.message || "Error al unirse al reto");
      }

      toast.dismiss(toastId);
      toast.success("¡Te has unido al reto exitosamente!");
      
      // Redirigir a la página de mis retos
      window.location.href = `/patient/${userId}/my-challenges`;
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al unirse al reto"
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={isJoining}
      className="w-full"
      size="lg"
    >
      {isJoining ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Uniéndote...
        </>
      ) : (
        "Unirse al Reto"
      )}
    </Button>
  );
}
