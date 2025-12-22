"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, User, ShoppingBag } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface Challenge {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  sales_count?: number;
  professional_first_name?: string;
  professional_last_name?: string;
  professional_photo?: string;
  professional_profession?: string;
  professional_is_verified?: boolean;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onPurchase?: () => void;
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

export function ChallengeCard({ challenge, onPurchase }: ChallengeCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const supabase = createClient();

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      const toastId = toast.loading("Redirigiendo al pago...");

      const response = await fetch("/api/stripe/challenge-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challenge_id: challenge.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar el pago");
      }

      toast.dismiss(toastId);
      toast.success("Redirigiendo a Stripe...");

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de pago");
      }

      if (onPurchase) {
        onPurchase();
      }
    } catch (error) {
      console.error("Error purchasing challenge:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al procesar el pago"
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
        {challenge.difficulty_level && (
          <div className="absolute top-2 right-2">
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

        {/* Ventas */}
        {challenge.sales_count !== undefined && challenge.sales_count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {challenge.sales_count} {challenge.sales_count === 1 ? 'participante' : 'participantes'}
            </span>
          </div>
        )}

        {/* Precio */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-2xl font-bold text-primary">
            ${challenge.price.toFixed(2)} {challenge.currency}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full"
          size="lg"
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          {isPurchasing ? "Procesando..." : "Comprar Reto"}
        </Button>
      </CardFooter>
    </Card>
  );
}
