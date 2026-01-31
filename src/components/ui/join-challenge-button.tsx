"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

interface JoinChallengeButtonProps {
  challengeId: string;
  challengeSlug?: string;
  userId: string;
  challengePrice?: number | null;
}

export function JoinChallengeButton({ challengeId, challengeSlug, userId, challengePrice }: JoinChallengeButtonProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si ya está participando al cargar
  useEffect(() => {
    const checkParticipation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: existingParticipation } = await supabase
          .from('challenge_purchases')
          .select('id')
          .eq('challenge_id', challengeId)
          .eq('participant_id', user.id)
          .maybeSingle();

        setIsParticipating(!!existingParticipation);
      } catch (error) {
        console.error("Error checking participation:", error);
      } finally {
        setLoading(false);
      }
    };

    checkParticipation();
  }, [challengeId, supabase]);

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
        setIsParticipating(true);
        router.push(`/patient/${userId}/my-challenges`);
        return;
      }

      // Si el reto tiene precio, redirigir al checkout
      if (challengePrice && challengePrice > 0) {
        toast.dismiss(toastId);
        router.push(`/explore/challenge/${challengeSlug || challengeId}/checkout`);
        return;
      }

      // Si no tiene precio, unirse directamente
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
      setIsParticipating(true);
      
      // Redirigir a la página de mis retos
      router.push(`/patient/${userId}/my-challenges`);
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al unirse al reto"
      );
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <Button disabled className="w-full" size="lg">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      </Button>
    );
  }

  // Si no está autenticado, mostrar botones de login/signup
  if (!isAuthenticated || !userId) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-center text-muted-foreground">
          Debes iniciar sesión para unirte a este reto
        </p>
        <div className="flex flex-col gap-2">
          <Button
            asChild
            className="w-full"
            size="lg"
          >
            <Link href={`/login?redirect=${encodeURIComponent(`/explore/challenge/${challengeSlug || challengeId}`)}`}>
              Iniciar sesión
            </Link>
          </Button>
          <Button
            asChild
            className="w-full"
            size="lg"
            variant="outline"
          >
            <Link href={`/signup?redirect=${encodeURIComponent(`/explore/challenge/${challengeSlug || challengeId}`)}`}>
              Crear cuenta
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isParticipating) {
    return (
      <Button
        onClick={() => router.push(`/my-challenges`)}
        className="w-full"
        size="lg"
        variant="outline"
      >
        <Check className="h-4 w-4 mr-2" />
        Ya estás participando
      </Button>
    );
  }

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
      ) : challengePrice && challengePrice > 0 ? (
        `Unirse al Reto - $${challengePrice} ${challengePrice > 0 ? 'MXN' : ''}`
      ) : (
        "Unirse al Reto"
      )}
    </Button>
  );
}
