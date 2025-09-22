"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, MessageCircle, MoreHorizontal } from "lucide-react";

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  avatar: string;
}

interface ProfessionalReviewsProps {
  rating: number;
  totalReviews: number;
  reviews: Review[];
}

const ProfessionalReviews = ({ rating, totalReviews, reviews }: ProfessionalReviewsProps) => {
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ""
  });
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  const handleSubmitReview = () => {
    if (newReview.comment.trim()) {
      // Aquí se enviaría la reseña a la API
      console.log("Nueva reseña:", newReview);
      alert("¡Gracias por tu reseña! Ha sido enviada correctamente.");
      setNewReview({ rating: 5, comment: "" });
      setShowReviewForm(false);
    }
  };

  const handleHelpfulClick = (reviewId: number) => {
    // Aquí se actualizaría el contador de "útil" en la API
    console.log("Marcado como útil:", reviewId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Reseñas y Calificaciones
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center">
                <span className="text-2xl font-bold">{rating}</span>
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 ml-1" />
              </div>
              <span className="text-muted-foreground">({totalReviews} reseñas)</span>
            </div>
          </div>
          <Button 
            onClick={() => setShowReviewForm(!showReviewForm)}
            variant="outline"
            size="sm"
          >
            Escribir Reseña
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Formulario de nueva reseña */}
        {showReviewForm && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/20">
            <h4 className="font-semibold mb-3">Tu Reseña</h4>
            <div className="space-y-4">
              {/* Calificación */}
              <div>
                <label className="text-sm font-medium mb-2 block">Calificación:</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <Star 
                        className={`h-6 w-6 ${
                          star <= newReview.rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-muted-foreground'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Comentario */}
              <div>
                <label className="text-sm font-medium mb-2 block">Comentario:</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Comparte tu experiencia con este profesional..."
                  className="w-full p-3 border border-border rounded-lg resize-none"
                  rows={3}
                />
              </div>
              
              {/* Botones */}
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} size="sm">
                  Enviar Reseña
                </Button>
                <Button 
                  onClick={() => setShowReviewForm(false)} 
                  variant="outline" 
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de reseñas */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.avatar} alt={review.user} />
                  <AvatarFallback className="text-sm">
                    {review.user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.user}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-muted-foreground'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleHelpfulClick(review.id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Útil ({review.helpful})
                    </button>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      Responder
                    </button>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botón para ver más reseñas */}
        {reviews.length >= 3 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Ver todas las reseñas ({totalReviews} total)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalReviews;
