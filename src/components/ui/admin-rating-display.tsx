"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { Star, AlertCircle } from "lucide-react";

interface AdminRatingDisplayProps {
  professionalId: string;
}

interface AdminRating {
  rating: number;
  improvement_comments?: string | null;
  created_at: string;
  updated_at: string;
  admin?: {
    email?: string;
  };
}

export function AdminRatingDisplay({ professionalId }: AdminRatingDisplayProps) {
  const [rating, setRating] = useState<AdminRating | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRating = async () => {
      try {
        // Obtener la calificación promedio de todos los administradores
        const { data: ratingStats, error: statsError } = await supabase
          .from("professional_admin_rating_stats")
          .select("*")
          .eq("professional_id", professionalId)
          .single();

        if (statsError && statsError.code !== 'PGRST116') {
          console.error("Error loading rating stats:", statsError);
        }

        // Obtener todas las calificaciones (para mostrar comentarios)
        const { data: ratings, error: ratingsError } = await supabase
          .from("admin_ratings")
          .select("rating, improvement_comments, created_at, updated_at")
          .eq("professional_id", professionalId)
          .order("updated_at", { ascending: false });

        if (ratingsError) {
          console.error("Error loading ratings:", ratingsError);
          return;
        }

        if (ratings && ratings.length > 0) {
          // Obtener la calificación más reciente o el promedio
          const mostRecent = ratings[0];
          const avgRating = statsError ? null : ratingStats?.average_admin_rating;
          
          setRating({
            rating: avgRating || mostRecent.rating,
            improvement_comments: mostRecent.improvement_comments,
            created_at: mostRecent.created_at,
            updated_at: mostRecent.updated_at,
          });
        }
      } catch (error) {
        console.error("Error fetching rating:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [professionalId, supabase]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rating) {
    return null; // No mostrar nada si no hay calificación
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300";
    if (rating >= 6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300";
    if (rating >= 4) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 8) return "Excelente";
    if (rating >= 6) return "Bueno";
    if (rating >= 4) return "Regular";
    return "Necesita Mejora";
  };

  return (
    <Card className="border-2 py-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Calificación del Administrador
        </CardTitle>
        <CardDescription>
          Tu calificación oficial en la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Display */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "px-4 py-2 rounded-lg border-2 text-2xl font-bold",
            getRatingColor(rating.rating)
          )}>
            {rating.rating.toFixed(1)}/10
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn(getRatingColor(rating.rating))}>
                {getRatingLabel(rating.rating)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Última actualización: {new Date(rating.updated_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Improvement Comments */}
        {rating.improvement_comments && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <h4 className="font-semibold text-sm">Comentarios del Administrador</h4>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {rating.improvement_comments}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
