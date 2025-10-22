"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewFormProps {
  professionalId: string;
  patientId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  };
  onSuccess?: () => void;
}

export function ReviewForm({ professionalId, patientId, existingReview, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }

    setIsSubmitting(true);

    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            comment: comment.trim() || null,
          })
          .eq("id", existingReview.id);

        if (error) throw error;
        toast.success("Reseña actualizada exitosamente");
      } else {
        // Create new review
        const { error } = await supabase
          .from("reviews")
          .insert({
            professional_id: professionalId,
            patient_id: patientId,
            rating,
            comment: comment.trim() || null,
          });

        if (error) throw error;
        toast.success("Reseña publicada exitosamente");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error al publicar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>{existingReview ? "Editar tu reseña" : "Deja tu reseña"}</CardTitle>
        <CardDescription>
          Comparte tu experiencia con este profesional
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Calificación *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      value <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-300"
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating === 1 && "Muy malo"}
                  {rating === 2 && "Malo"}
                  {rating === 3 && "Regular"}
                  {rating === 4 && "Bueno"}
                  {rating === 5 && "Excelente"}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comentario (opcional)
            </label>
            <Textarea
              id="comment"
              placeholder="Cuéntanos sobre tu experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/1000 caracteres
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? "Publicando..." : existingReview ? "Actualizar reseña" : "Publicar reseña"}
            </Button>
            {existingReview && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRating(existingReview.rating);
                  setComment(existingReview.comment || "");
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

