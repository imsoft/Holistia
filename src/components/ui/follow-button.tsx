"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string; // ID del usuario a seguir/dejar de seguir
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
}

export function FollowButton({
  userId,
  className,
  variant = "default",
  size = "default",
  showIcon = true,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkFollowStatus();
  }, [userId]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        setCurrentUserId(null);
        return;
      }

      setCurrentUserId(user.id);

      // No mostrar el botón si es el propio usuario
      if (user.id === userId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/follows/check?following_id=${userId}`);
      const data = await response.json();

      setIsFollowing(data.is_following || false);
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      setIsToggling(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión para seguir usuarios");
        return;
      }

      if (user.id === userId) {
        toast.error("No puedes seguirte a ti mismo");
        return;
      }

      const endpoint = isFollowing ? "/api/follows/unfollow" : "/api/follows/follow";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ following_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el seguimiento");
      }

      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? "Dejaste de seguir a este usuario" : "Ahora sigues a este usuario");
      
      // Disparar evento personalizado para notificar cambios
      window.dispatchEvent(new CustomEvent(isFollowing ? 'user-unfollowed' : 'user-followed', {
        detail: { userId }
      }));
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar el seguimiento");
    } finally {
      setIsToggling(false);
    }
  };

  // No mostrar el botón si está cargando
  if (isLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Cargando...
      </Button>
    );
  }

  // No mostrar el botón si es el propio usuario
  if (currentUserId === userId) {
    return null;
  }

  // No mostrar si no hay usuario autenticado
  if (!currentUserId) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={isToggling}
      className={className}
    >
      {isToggling ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isFollowing ? "Dejando de seguir..." : "Siguiendo..."}
        </>
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserMinus className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )
          )}
          {isFollowing ? "Siguiendo" : "Seguir"}
        </>
      )}
    </Button>
  );
}
