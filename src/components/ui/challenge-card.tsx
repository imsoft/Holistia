"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface Challenge {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  professional_first_name?: string;
  professional_last_name?: string;
  professional_photo?: string;
  professional_profession?: string;
  professional_is_verified?: boolean;
  linked_patient_id?: string | null;
  linked_professional_id?: string | null;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin?: () => void;
  userId?: string;
}

const difficultyLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800',
};

export function ChallengeCard({ challenge, onJoin, userId }: ChallengeCardProps) {
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
        .eq('challenge_id', challenge.id)
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
          challenge_id: challenge.id,
          participant_id: user.id,
          access_granted: true,
        });

      if (participationError) {
        throw new Error(participationError.message || "Error al unirse al reto");
      }

      toast.dismiss(toastId);
      toast.success("¡Te has unido al reto exitosamente!");

      if (onJoin) {
        onJoin();
      }
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow py-4">
      <div className="relative h-48 w-full">
        <Image
          src={
            challenge.cover_image_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(challenge.title)}&background=random&size=400`
          }
          alt={challenge.title}
          fill
          className="object-cover"
        />
        <FavoriteButton
          itemId={challenge.id}
          favoriteType="challenge"
          variant="floating"
        />
        {challenge.difficulty_level && (
          <div className="absolute top-2 left-2">
            <Badge
              className={difficultyColors[challenge.difficulty_level]}
            >
              {difficultyLabels[challenge.difficulty_level]}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {challenge.title}
          </h3>
        </div>
        {challenge.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {challenge.short_description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Información del profesional */}
        {challenge.professional_first_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {challenge.professional_first_name} {challenge.professional_last_name}
            </span>
            {challenge.professional_is_verified && (
              <VerifiedBadge size={14} />
            )}
          </div>
        )}

        {/* Duración */}
        {challenge.duration_days && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {challenge.duration_days} {challenge.duration_days === 1 ? 'día' : 'días'}
            </span>
          </div>
        )}

        {/* Información de vinculación */}
        {challenge.linked_patient_id && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Reto vinculado a paciente
            </span>
          </div>
        )}
        {challenge.linked_professional_id && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Reto vinculado a profesional
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full"
          size="lg"
        >
          {isJoining ? "Uniéndote..." : "Unirse al Reto"}
        </Button>
      </CardFooter>
    </Card>
  );
}
