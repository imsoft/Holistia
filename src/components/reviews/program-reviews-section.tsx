"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/reviews/star-rating";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const POPULAR_SALES_THRESHOLD = 10;

interface ProgramReviewsSectionProps {
  productId: string;
  productTitle: string;
  salesCount: number;
  /** Si el usuario compró y tenemos su purchase_id, puede dejar reseña */
  userPurchaseId: string | null;
  refreshTrigger?: number;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
}

interface ReviewItem {
  id: string;
  purchase_id: string;
  buyer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export function ProgramReviewsSection({
  productId,
  productTitle,
  salesCount,
  userPurchaseId,
  refreshTrigger = 0,
}: ProgramReviewsSectionProps) {
  const [stats, setStats] = useState<ReviewStats>({ total_reviews: 0, average_rating: 0 });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAlreadyReviewed, setUserAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/programs/${productId}/reviews`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar reseñas");
      setStats(data.stats || { total_reviews: 0, average_rating: 0 });
      setReviews(data.reviews || []);
      if (userPurchaseId && data.reviews) {
        const hasUserReview = data.reviews.some((r: ReviewItem) => r.purchase_id === userPurchaseId);
        setUserAlreadyReviewed(hasUserReview);
      } else {
        setUserAlreadyReviewed(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar reseñas");
    } finally {
      setLoading(false);
    }
  }, [productId, userPurchaseId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPurchaseId || rating < 1) {
      toast.error("Selecciona una calificación");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/programs/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase_id: userPurchaseId, rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al publicar");
      toast.success("Reseña publicada");
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al publicar la reseña");
    } finally {
      setSubmitting(false);
    }
  };

  const showReviewForm = userPurchaseId && !userAlreadyReviewed;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reseñas
          {stats.total_reviews > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({stats.total_reviews} {stats.total_reviews === 1 ? "reseña" : "reseñas"})
            </span>
          )}
        </CardTitle>
        {salesCount >= POPULAR_SALES_THRESHOLD && (
          <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2.5 py-0.5 text-xs font-medium">
            Más vendido
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Promedio y estrellas */}
        {stats.total_reviews > 0 && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <StarRating rating={stats.average_rating} size="lg" showNumber={true} />
              <span className="text-muted-foreground text-sm">
                {stats.average_rating.toFixed(1)} · {stats.total_reviews} {stats.total_reviews === 1 ? "reseña" : "reseñas"}
              </span>
            </div>
          </div>
        )}

        {/* Formulario: solo si compró y aún no ha reseñado */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="space-y-4 p-4 bg-muted/40 rounded-lg">
            <p className="text-sm font-medium">¿Qué te pareció este programa?</p>
            <div>
              <Label className="text-xs text-muted-foreground">Calificación</Label>
              <div className="mt-1">
                <StarRating
                  rating={rating}
                  interactive={true}
                  onRatingChange={setRating}
                  showNumber={false}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="program-review-comment" className="text-xs text-muted-foreground">
                Comentario (opcional)
              </Label>
              <Textarea
                id="program-review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comparte tu experiencia..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={submitting || rating < 1}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publicar reseña
            </Button>
          </form>
        )}

        {/* Lista de reseñas */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            {stats.total_reviews === 0 ? "Aún no hay reseñas. ¡Sé el primero en opinar si ya lo compraste!" : "No hay más reseñas."}
          </p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StarRating rating={r.rating} size="sm" showNumber={false} />
                    <span className="text-sm font-medium">{r.author_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export const POPULAR_SALES_THRESHOLD_EXPORT = POPULAR_SALES_THRESHOLD;
