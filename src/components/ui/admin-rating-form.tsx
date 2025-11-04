"use client";

import { useState, useEffect } from "react";
import { Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

interface AdminRating {
  id?: string;
  rating: number;
  improvement_comments?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AdminRatingFormProps {
  professionalId: string;
  professionalName: string;
  existingRating?: AdminRating | null;
  onSuccess?: () => void;
}

export function AdminRatingForm({
  professionalId,
  professionalName,
  existingRating,
  onSuccess,
}: AdminRatingFormProps) {
  const [rating, setRating] = useState<number>(existingRating?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comments, setComments] = useState<string>(existingRating?.improvement_comments || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComments(existingRating.improvement_comments || "");
    }
  }, [existingRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Verificar que el usuario sea administrador
      const userType = user.user_metadata?.type;
      if (userType !== 'admin' && userType !== 'Admin') {
        throw new Error("Solo los administradores pueden calificar profesionales");
      }

      if (existingRating?.id) {
        // Actualizar calificación existente
        const { error } = await supabase
          .from("admin_ratings")
          .update({
            rating,
            improvement_comments: comments.trim() || null,
          })
          .eq("id", existingRating.id);

        if (error) throw error;
        toast.success("Calificación actualizada exitosamente");
      } else {
        // Crear nueva calificación
        const { error } = await supabase
          .from("admin_ratings")
          .insert({
            professional_id: professionalId,
            admin_id: user.id,
            rating,
            improvement_comments: comments.trim() || null,
          });

        if (error) throw error;
        toast.success("Calificación guardada exitosamente");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving rating:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al guardar la calificación";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRating?.id) return;

    if (!confirm("¿Estás seguro de que quieres eliminar esta calificación?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("admin_ratings")
        .delete()
        .eq("id", existingRating.id);

      if (error) throw error;
      toast.success("Calificación eliminada exitosamente");
      
      setRating(0);
      setComments("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting rating:", error);
      toast.error("Error al eliminar la calificación");
    } finally {
      setIsDeleting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>
          {existingRating ? "Editar Calificación" : "Calificar Profesional"}
        </CardTitle>
        <CardDescription>
          Califica a {professionalName} con una escala de 0 a 5 estrellas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Calificación (0-5 estrellas) *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => {
                const displayRating = hoveredRating || rating;
                const isFilled = value <= displayRating;
                return (
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
                        isFilled
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-300"
                      )}
                    />
                  </button>
                );
              })}
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
            {rating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  rating === 5 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                  rating === 4 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                  rating === 3 ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                )}>
                  {rating === 5 && "Excelente"}
                  {rating === 4 && "Bueno"}
                  {rating === 3 && "Regular"}
                  {(rating === 1 || rating === 2) && "Necesita Mejora"}
                </div>
                <span className="text-sm text-muted-foreground">
                  {rating}/5
                </span>
              </div>
            )}
          </div>

          {/* Improvement Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base font-semibold">
              Comentarios sobre qué puede mejorar
            </Label>
            <Textarea
              id="comments"
              placeholder="Escribe aquí qué áreas puede mejorar el profesional, qué fortalezas tiene, o cualquier observación relevante..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
              className="resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {comments.length}/1000 caracteres
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4">
            <div>
              {existingRating && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isSubmitting}
                >
                  {isDeleting ? "Eliminando..." : "Eliminar Calificación"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || isDeleting || rating === 0}
              >
                {isSubmitting ? "Guardando..." : existingRating ? "Actualizar" : "Guardar Calificación"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
