"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialFeedPost } from "@/components/ui/social-feed-post";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function FeedPostPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const checkinId = params.id as string;
  const supabase = createClient();

  const [checkin, setCheckin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    if (checkinId) {
      fetchCheckin();
    }
  }, [checkinId]);

  const fetchCheckin = async () => {
    try {
      setLoading(true);

      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Debes iniciar sesión para ver esta publicación");
        router.push("/login");
        return;
      }

      // Obtener el check-in desde la vista social_feed_checkins
      const { data: checkinData, error: checkinError } = await supabase
        .from("social_feed_checkins")
        .select("*")
        .eq("checkin_id", checkinId)
        .single();

      if (checkinError || !checkinData) {
        toast.error("Publicación no encontrada");
        router.push("/feed");
        return;
      }

      // Verificar si el usuario le dio like o reacción
      const [likeData, reactionData] = await Promise.all([
        supabase
          .from("challenge_checkin_likes")
          .select("id")
          .eq("checkin_id", checkinId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("post_reactions")
          .select("reaction_type")
          .eq("checkin_id", checkinId)
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      setCheckin({
        ...checkinData,
        isLikedByCurrentUser: !!likeData.data,
        userReaction: reactionData.data?.reaction_type || null,
      });
      setIsLiked(!!likeData.data);
      setUserReaction(reactionData.data?.reaction_type || null);
    } catch (error) {
      console.error("Error fetching checkin:", error);
      toast.error("Error al cargar la publicación");
      router.push("/feed");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    setIsLiked(true);
    setCheckin((prev: any) => ({
      ...prev,
      isLikedByCurrentUser: true,
      likes_count: (prev.likes_count || 0) + 1,
    }));
  };

  const handleUnlike = () => {
    setIsLiked(false);
    setCheckin((prev: any) => ({
      ...prev,
      isLikedByCurrentUser: false,
      likes_count: Math.max(0, (prev.likes_count || 0) - 1),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!checkin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Publicación no encontrada</p>
          <Button onClick={() => router.push("/feed")}>
            Volver al Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Botón de regreso */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Post individual */}
        {checkin && (
          <SocialFeedPost
            checkin={checkin}
            onLike={handleLike}
            onUnlike={handleUnlike}
          />
        )}
      </div>
    </div>
  );
}
