"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface Challenge {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  price?: number | null;
  currency?: string;
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
  const router = useRouter();
  const detailHref = `/explore/challenge/${challenge.slug || challenge.id}`;

  return (
    <Card
      className="group overflow-hidden hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer py-4"
      onClick={() => router.push(detailHref)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(detailHref);
        }
      }}
    >
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
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton
            itemId={challenge.id}
            favoriteType="challenge"
            variant="floating"
          />
        </div>
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
          <h3 className="font-semibold text-lg line-clamp-2 flex-1 group-hover:text-primary transition-colors">
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
    </Card>
  );
}
