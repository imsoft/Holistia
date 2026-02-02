"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Review } from "@/types/review";

interface ReviewsListProps {
  professionalId: string;
  currentUserId?: string;
  onEditReview?: (review: Review) => void;
  refreshTrigger?: number;
}

export function ReviewsList({ 
  professionalId, 
  currentUserId, 
  onEditReview,
  refreshTrigger = 0 
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      // Obtenemos las reseñas directamente
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Obtener IDs de pacientes únicos
      const patientIds = [...new Set((reviewsData || []).map(review => review.patient_id))];

      // Cargar perfiles de pacientes
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", patientIds);

      // Crear un mapa de perfiles por ID
      const profilesMap = new Map(
        (profiles || []).map(p => [
          p.id,
          {
            id: p.id,
            email: p.email,
            full_name: p.first_name && p.last_name
              ? `${p.first_name} ${p.last_name}`.trim()
              : undefined
          }
        ])
      );

      // Crear reseñas con información del paciente
      const reviewsWithBasicInfo = (reviewsData || []).map(review => ({
        ...review,
        patient: profilesMap.get(review.patient_id) || {
          id: review.patient_id,
          email: undefined,
          full_name: undefined
        }
      }));

      setReviews(reviewsWithBasicInfo);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Error al cargar las reseñas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, refreshTrigger]);

  const handleDelete = async (reviewId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar tu reseña?")) {
      return;
    }

    setDeletingId(reviewId);

    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("Reseña eliminada exitosamente");
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Error al eliminar la reseña");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Reseñas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4 py-8 w-full">
            <div className="h-8 bg-muted rounded w-40 mx-auto" />
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Reseñas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aún no hay reseñas. ¡Sé el primero en compartir tu experiencia!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Reseñas ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => {
          const isOwnReview = currentUserId === review.patient_id;
          // Si es la reseña propia, mostrar "Tú", si no mostrar el nombre del perfil o "Usuario verificado"
          const patientName = isOwnReview 
            ? "Tú" 
            : (review.patient?.full_name || 
               review.patient?.email?.split("@")[0] || 
               "Usuario verificado");

          return (
            <div
              key={review.id}
              className="border-b last:border-b-0 pb-4 last:pb-0 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{patientName}</span>
                    {isOwnReview && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Tu reseña
                      </span>
                    )}
                  </div>
                  <StarRating rating={review.rating} size="sm" showNumber={false} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>

                {isOwnReview && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditReview && onEditReview(review)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {review.comment && (
                <p className="text-sm text-foreground mt-2">{review.comment}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

