"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialFeedPost } from "@/components/ui/social-feed-post";
import { FollowButton } from "@/components/ui/follow-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Image as ImageIcon, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  type: string;
  username: string | null;
}

interface UserStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

interface FollowUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  username: string | null;
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
  const [followsDialogOpen, setFollowsDialogOpen] = useState(false);
  const [followsDialogType, setFollowsDialogType] = useState<"followers" | "following">("followers");
  const [followsList, setFollowsList] = useState<FollowUser[]>([]);
  const [followsListLoading, setFollowsListLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadUserProfile();
    loadUserCheckins();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Obtener perfil del usuario (incluye username si existe)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, type, username")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        toast.error("Error al cargar el perfil");
        return;
      }

      setProfile(profileData);

      // Obtener estadísticas
      // Publicaciones: contar desde la misma fuente que la lista (social_feed_checkins por user_id)
      const { count: postsCount } = await supabase
        .from("social_feed_checkins")
        .select("checkin_id", { count: "exact", head: true })
        .eq("user_id", userId);

      // Seguidores y siguiendo: usar la API para consistencia y evitar problemas de RLS al ver perfiles ajenos
      const statsResponse = await fetch(`/api/follows/stats?user_id=${userId}`);
      const statsData = await statsResponse.json();
      const followersCount = statsData.followers_count ?? 0;
      const followingCount = statsData.following_count ?? 0;

      setStats({
        posts_count: postsCount ?? 0,
        followers_count: followersCount,
        following_count: followingCount,
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

  const openFollowsDialog = async (type: "followers" | "following") => {
    setFollowsDialogType(type);
    setFollowsDialogOpen(true);
    setFollowsListLoading(true);
    setFollowsList([]);
    try {
      const res = await fetch(
        `/api/follows/list?user_id=${userId}&type=${type}`
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        setFollowsList(data.users);
      } else {
        toast.error("Error al cargar la lista");
      }
    } catch {
      toast.error("Error al cargar la lista");
    } finally {
      setFollowsListLoading(false);
    }
  };

  const getFollowUserInitials = (u: FollowUser) => {
    if (u.first_name && u.last_name) {
      return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
    }
    if (u.username) return u.username[0].toUpperCase();
    return "?";
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
              {profile.username && (
                <p className="text-sm text-muted-foreground mb-0.5">@{profile.username}</p>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {profile.first_name} {profile.last_name}
              </h1>

              {/* Estadísticas (Seguidores y Siguiendo son clicables) */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.posts_count}</p>
                  <p className="text-sm text-muted-foreground">
                    Publicaciones
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openFollowsDialog("followers")}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold">{stats.followers_count}</p>
                  <p className="text-sm text-muted-foreground">Seguidores</p>
                </button>
                <button
                  type="button"
                  onClick={() => openFollowsDialog("following")}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl font-bold">{stats.following_count}</p>
                  <p className="text-sm text-muted-foreground">Siguiendo</p>
                </button>
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

        {/* Dialog Seguidores / Siguiendo */}
        <Dialog open={followsDialogOpen} onOpenChange={setFollowsDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {followsDialogType === "followers" ? (
                  <>
                    <Users className="h-5 w-5" />
                    Seguidores
                  </>
                ) : (
                  <>
                    <UserCheck className="h-5 w-5" />
                    Siguiendo
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4 -mx-2">
              {followsListLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : followsList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {followsDialogType === "followers"
                    ? "No tiene seguidores aún"
                    : "No sigue a nadie aún"}
                </p>
              ) : (
                <div className="space-y-1 pb-4">
                  {followsList.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      onClick={() => setFollowsDialogOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors"
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {getFollowUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.username ? (
                          <p className="text-sm text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
