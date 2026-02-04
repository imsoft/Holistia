"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SocialFeedPost } from "@/components/ui/social-feed-post";
import { SkeletonPostList } from "@/components/ui/skeleton-post";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { toast } from "sonner";

export default function FeedPostPage() {
  useUserStoreInit();
  const params = useParams();
  const postId = params.id as string;

  const [checkin, setCheckin] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/social-feed?checkinId=${postId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al cargar el post");
        }

        const posts = data.data || [];
        if (posts.length === 0) {
          setError("Post no encontrado");
          setCheckin(null);
          return;
        }

        setCheckin(posts[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el post");
        setCheckin(null);
        toast.error("No se pudo cargar el post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-2xl mx-auto px-4 py-8">
          <SkeletonPostList count={1} />
        </main>
      </div>
    );
  }

  if (error || !checkin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Post no encontrado</h1>
          <p className="text-muted-foreground mb-6">
            {error || "El post que buscas no existe o ya no está disponible."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/feed">Ir al Feed</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <SocialFeedPost
          checkin={checkin}
          onLike={() => {
            setCheckin((prev: any) =>
              prev ? { ...prev, isLikedByCurrentUser: true, likes_count: (prev.likes_count || 0) + 1 } : prev
            );
          }}
          onUnlike={() => {
            setCheckin((prev: any) =>
              prev ? { ...prev, isLikedByCurrentUser: false, likes_count: Math.max(0, (prev.likes_count || 0) - 1) } : prev
            );
          }}
        />
      </main>
    </div>
  );
}
