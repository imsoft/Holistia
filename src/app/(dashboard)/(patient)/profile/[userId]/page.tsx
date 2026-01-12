"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialFeedPost } from "@/components/ui/social-feed-post";
import { FollowButton } from "@/components/ui/follow-button";
import { Users, Image as ImageIcon, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  type: string;
}

interface UserStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const currentUserId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
  });
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinsLoading, setCheckinsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUserProfile();
    loadUserCheckins();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Obtener perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, type")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        toast.error("Error al cargar el perfil");
        return;
      }

      setProfile(profileData);

      // Obtener estadísticas
      // Primero obtener IDs de compras del usuario
      const { data: purchasesData } = await supabase
        .from("challenge_purchases")
        .select("id")
        .eq("buyer_id", userId);

      const purchaseIds = purchasesData?.map((p) => p.id) || [];

      // Contar posts públicos
      const { count: postsCount } = await supabase
        .from("challenge_checkins")
        .select("id", { count: "exact", head: true })
        .eq("is_public", true)
        .in("challenge_purchase_id", purchaseIds);

      // Contar seguidores
      const { count: followersCount } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId);

      // Contar siguiendo
      const { count: followingCount } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", userId);

      setStats({
        posts_count: postsCount || 0,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const loadUserCheckins = async () => {
    try {
      setCheckinsLoading(true);

      // Obtener check-ins públicos del usuario desde la vista
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("social_feed_checkins")
        .select("*")
        .eq("user_id", userId)
        .order("checkin_time", { ascending: false });

      if (checkinsError) {
        console.error("Error loading checkins:", checkinsError);
        return;
      }

      // Verificar si el usuario actual dio like a cada check-in
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const checkinIds = checkinsData?.map((c) => c.checkin_id) || [];

        const { data: likesData } = await supabase
          .from("challenge_checkin_likes")
          .select("checkin_id")
          .eq("user_id", user.id)
          .in("checkin_id", checkinIds);

        const likedCheckinIds = new Set(
          likesData?.map((l) => l.checkin_id) || []
        );

        const checkinsWithLikeStatus = checkinsData?.map((checkin) => ({
          ...checkin,
          isLikedByCurrentUser: likedCheckinIds.has(checkin.checkin_id),
        }));

        setCheckins(checkinsWithLikeStatus || []);
      } else {
        setCheckins(
          checkinsData?.map((c) => ({ ...c, isLikedByCurrentUser: false })) ||
            []
        );
      }
    } catch (error) {
      console.error("Error loading checkins:", error);
    } finally {
      setCheckinsLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!profile) return "?";
    return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Usuario no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header del perfil */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={`${profile.first_name} ${profile.last_name}`}
              />
              <AvatarFallback className="text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Información del usuario */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {profile.first_name} {profile.last_name}
              </h1>

              {/* Estadísticas */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.posts_count}</p>
                  <p className="text-sm text-muted-foreground">
                    Publicaciones
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.followers_count}</p>
                  <p className="text-sm text-muted-foreground">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.following_count}</p>
                  <p className="text-sm text-muted-foreground">Siguiendo</p>
                </div>
              </div>

              {/* Botón de seguir */}
              <FollowButton userId={userId} />
            </div>
          </div>
        </div>

        {/* Grid de publicaciones */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Publicaciones
          </h2>

          {checkinsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : checkins.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {userId === currentUserId
                  ? "Aún no tienes publicaciones públicas"
                  : "Este usuario no tiene publicaciones públicas"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {checkins.map((checkin) => (
                <SocialFeedPost
                  key={checkin.checkin_id}
                  checkin={checkin}
                  onLike={() => {
                    setCheckins((prev) =>
                      prev.map((item) =>
                        item.checkin_id === checkin.checkin_id
                          ? { ...item, isLikedByCurrentUser: true, likes_count: item.likes_count + 1 }
                          : item
                      )
                    );
                  }}
                  onUnlike={() => {
                    setCheckins((prev) =>
                      prev.map((item) =>
                        item.checkin_id === checkin.checkin_id
                          ? { ...item, isLikedByCurrentUser: false, likes_count: Math.max(0, item.likes_count - 1) }
                          : item
                      )
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
