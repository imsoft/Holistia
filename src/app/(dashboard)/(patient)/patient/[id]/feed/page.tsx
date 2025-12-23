"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SocialFeedPost } from "@/components/ui/social-feed-post";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Users, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function SocialFeedPage() {
  const params = useParams();
  const userId = params.id as string;

  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "following" | "recommended">("all");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadFeed(true);
  }, [filter]);

  const loadFeed = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      const response = await fetch(
        `/api/social-feed?limit=${limit}&offset=${currentOffset}&filter=${filter}`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al cargar feed");

      if (reset) {
        setFeed(data.data || []);
        setOffset(limit);
      } else {
        setFeed(prev => [...prev, ...(data.data || [])]);
        setOffset(prev => prev + limit);
      }

      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Error loading feed:", error);
      toast.error("Error al cargar el feed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFeed(true);
  };

  const handleLoadMore = () => {
    loadFeed(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Feed Social</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Tabs de filtros */}
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as typeof filter)}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <Users className="h-4 w-4" />
              Siguiendo
            </TabsTrigger>
            <TabsTrigger value="recommended" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Populares
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {/* Feed de posts */}
            <div className="space-y-6">
              {loading && feed.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : feed.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {filter === "following"
                      ? "No hay actividad de personas que sigues. ¡Comienza a seguir a otros usuarios!"
                      : "No hay evidencias disponibles aún"}
                  </p>
                </div>
              ) : (
                <>
                  {feed.map((checkin) => (
                    <SocialFeedPost
                      key={checkin.checkin_id}
                      checkin={checkin}
                      onLike={() => {
                        // Actualizar el estado local
                        setFeed(prev =>
                          prev.map(item =>
                            item.checkin_id === checkin.checkin_id
                              ? { ...item, isLikedByCurrentUser: true }
                              : item
                          )
                        );
                      }}
                      onUnlike={() => {
                        setFeed(prev =>
                          prev.map(item =>
                            item.checkin_id === checkin.checkin_id
                              ? { ...item, isLikedByCurrentUser: false }
                              : item
                          )
                        );
                      }}
                    />
                  ))}

                  {/* Botón de cargar más */}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loading}
                        variant="outline"
                      >
                        {loading ? "Cargando..." : "Cargar más"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
