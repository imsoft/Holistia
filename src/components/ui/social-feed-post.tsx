"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Target, TrendingUp, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ReactionPicker, ReactionsSummary, type ReactionType } from "@/components/ui/reaction-picker";
import { SharePostDialog } from "@/components/ui/share-post-dialog";
import { ImageViewerDialog } from "@/components/ui/image-viewer-dialog";

interface SocialFeedPostProps {
  checkin: {
    checkin_id: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_photo_url: string | null;
    challenge_id: string;
    challenge_title: string;
    challenge_cover_image: string | null;
    challenge_category: string | null;
    challenge_difficulty: string | null;
    professional_first_name: string;
    professional_last_name: string;
    day_number: number;
    checkin_date: string;
    checkin_time: string;
    evidence_type: string | null;
    evidence_url: string | null;
    notes: string | null;
    points_earned: number;
    likes_count: number;
    comments_count: number;
    current_streak: number | null;
    days_completed: number | null;
    completion_percentage: number | null;
    isLikedByCurrentUser: boolean;
    is_team?: boolean;
    team_id?: string;
    team_name?: string | null;
    userReaction?: ReactionType | null;
    reactions?: Record<string, number>;
    total_reactions?: number;
  };
  onLike?: () => void;
  onUnlike?: () => void;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-orange-100 text-orange-800",
  expert: "bg-red-100 text-red-800",
};

const difficultyLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  expert: "Experto",
};

export function SocialFeedPost({ checkin, onLike, onUnlike }: SocialFeedPostProps) {
  const [isLiked, setIsLiked] = useState(checkin.isLikedByCurrentUser);
  const [likesCount, setLikesCount] = useState(checkin.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  // Estado para reacciones - inicializar desde props
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    checkin.userReaction || null
  );
  const [reactions, setReactions] = useState<Record<ReactionType, number>>(
    (checkin.reactions as Record<ReactionType, number>) || ({} as any)
  );
  const [totalReactions, setTotalReactions] = useState(checkin.total_reactions || 0);
  
  // Estado para el modal de imagen
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  // Manejar reacción
  const handleReactionSelect = async (reactionType: ReactionType) => {
    try {
      const response = await fetch("/api/social-feed/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkinId: checkin.checkin_id,
          reactionType,
        }),
      });

      if (!response.ok) throw new Error("Error al reaccionar");

      // Actualizar estado local
      const newReactions = { ...reactions };

      // Si había reacción anterior, decrementar
      if (currentReaction && newReactions[currentReaction]) {
        newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
        if (newReactions[currentReaction] === 0) {
          delete newReactions[currentReaction];
        }
      }

      // Incrementar nueva reacción
      newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;

      setReactions(newReactions);
      setCurrentReaction(reactionType);
      setTotalReactions(Object.values(newReactions).reduce((a, b) => a + b, 0));
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Error al reaccionar");
    }
  };

  const handleReactionRemove = async () => {
    try {
      const response = await fetch(
        `/api/social-feed/reactions?checkinId=${checkin.checkin_id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Error al quitar reacción");

      // Actualizar estado local
      if (currentReaction && reactions[currentReaction]) {
        const newReactions = { ...reactions };
        newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
        if (newReactions[currentReaction] === 0) {
          delete newReactions[currentReaction];
        }
        setReactions(newReactions);
        setTotalReactions(Object.values(newReactions).reduce((a, b) => a + b, 0));
      }
      setCurrentReaction(null);
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error("Error al quitar reacción");
    }
  };

  const handleToggleLike = async () => {
    if (isTogglingLike) return;

    setIsTogglingLike(true);
    try {
      if (isLiked) {
        // Unlike
        const response = await fetch(
          `/api/social-feed/like?checkinId=${checkin.checkin_id}`,
          { method: "DELETE" }
        );

        if (!response.ok) throw new Error("Error al quitar like");

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        onUnlike?.();
      } else {
        // Like
        const response = await fetch("/api/social-feed/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkinId: checkin.checkin_id }),
        });

        if (!response.ok) throw new Error("Error al dar like");

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        onLike?.();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al procesar like");
    } finally {
      setIsTogglingLike(false);
    }
  };

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(
        `/api/social-feed/comments?checkinId=${checkin.checkin_id}`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al cargar comentarios");

      setComments(data.data || []);
    } catch (error) {
      toast.error("Error al cargar comentarios");
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      await loadComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch("/api/social-feed/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkinId: checkin.checkin_id,
          commentText: newComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al comentar");

      setComments(prev => [...prev, data.data]);
      setNewComment("");
      toast.success("Comentario agregado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al comentar");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getUserInitials = () => {
    const firstName = checkin.user_first_name || "";
    const lastName = checkin.user_last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  // Validar fecha antes de formatear
  const getTimeAgo = () => {
    if (!checkin.checkin_time) return "Hace un momento";
    try {
      const date = new Date(checkin.checkin_time);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", checkin.checkin_time);
        return "Hace un momento";
      }
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: es,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Hace un momento";
    }
  };

  const timeAgo = getTimeAgo();

  return (
    <Card className="overflow-hidden py-4">
      {/* Header con información del usuario */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={checkin.user_photo_url || undefined}
                alt={`${checkin.user_first_name} ${checkin.user_last_name}`}
              />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {checkin.user_first_name || checkin.user_last_name
                  ? `${checkin.user_first_name || ''} ${checkin.user_last_name || ''}`.trim()
                  : 'Usuario'}
              </p>
              <p className="text-sm text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {checkin.is_team && (
              <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <Users className="h-3 w-3" />
                {checkin.team_name || "Equipo"}
              </Badge>
            )}
            {checkin.current_streak && checkin.current_streak > 0 && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {checkin.current_streak} días
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4">
        {/* Información del reto */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span className="font-medium">{checkin.challenge_title}</span>
          {checkin.challenge_difficulty && (
            <Badge
              variant="outline"
              className={difficultyColors[checkin.challenge_difficulty]}
            >
              {difficultyLabels[checkin.challenge_difficulty]}
            </Badge>
          )}
        </div>

        {/* Día del reto y progreso */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Día {checkin.day_number}</span>
          </div>
          {checkin.completion_percentage != null && (
            <div className="text-muted-foreground">
              {checkin.completion_percentage.toFixed(0)}% completado
            </div>
          )}
        </div>

        {/* Notas del check-in */}
        {checkin.notes && (
          <p className="text-sm leading-relaxed">{checkin.notes}</p>
        )}

        {/* Evidencia multimedia */}
        {checkin.evidence_url && checkin.evidence_type === "photo" && (
          <>
            <div 
              className="relative w-full h-80 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsImageViewerOpen(true)}
            >
              <Image
                src={checkin.evidence_url}
                alt="Evidencia del reto"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <ImageViewerDialog
              open={isImageViewerOpen}
              onOpenChange={setIsImageViewerOpen}
              imageUrl={checkin.evidence_url}
              alt={`Evidencia del reto - ${checkin.challenge_title}`}
            />
          </>
        )}

        {checkin.evidence_url && checkin.evidence_type === "video" && (
          <video
            src={checkin.evidence_url}
            controls
            className="w-full rounded-lg"
          />
        )}

        {checkin.evidence_url && checkin.evidence_type === "audio" && (
          <audio src={checkin.evidence_url} controls className="w-full" />
        )}
      </CardContent>

      {/* Footer con acciones */}
      <CardFooter className="flex flex-col gap-3 px-4 pb-4">
        {/* Resumen de reacciones */}
        {totalReactions > 0 && (
          <div className="w-full border-b border-border pb-2">
            <ReactionsSummary
              reactions={reactions}
              totalCount={totalReactions}
              userReaction={currentReaction}
            />
          </div>
        )}

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Reaction Picker */}
            <ReactionPicker
              currentReaction={currentReaction}
              onReactionSelect={handleReactionSelect}
              onReactionRemove={handleReactionRemove}
            />

            {/* Botón de comentarios */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              className="gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{checkin.comments_count}</span>
            </Button>

            {/* Botón de compartir */}
            <SharePostDialog
              checkinId={checkin.checkin_id}
              challengeTitle={checkin.challenge_title}
              userName={`${checkin.user_first_name} ${checkin.user_last_name}`}
              compact
            />

            {/* Legacy Like button (mantener para compatibilidad) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleLike}
              disabled={isTogglingLike}
              className="gap-2 opacity-50 hover:opacity-100"
            >
              <Heart
                className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span className="text-xs">{likesCount}</span>
            </Button>
          </div>
          {checkin.points_earned > 0 && (
            <Badge variant="secondary" className="gap-1">
              +{checkin.points_earned} pts
            </Badge>
          )}
        </div>

        {/* Sección de comentarios */}
        {showComments && (
          <div className="w-full space-y-3 pt-3 border-t">
            {isLoadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <>
                {comments.length > 0 && (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={comment.profiles?.photo_url || undefined}
                          />
                          <AvatarFallback>
                            {comment.profiles?.first_name?.charAt(0)}
                            {comment.profiles?.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted rounded-lg p-2">
                          <p className="text-sm font-medium">
                            {comment.profiles?.first_name}{" "}
                            {comment.profiles?.last_name}
                          </p>
                          <p className="text-sm">{comment.comment_text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    size="sm"
                  >
                    {isSubmittingComment ? "..." : "Enviar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
