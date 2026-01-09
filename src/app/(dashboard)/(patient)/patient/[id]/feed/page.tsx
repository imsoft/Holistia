"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { SocialFeedPost } from "@/components/ui/social-feed-post";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Users, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh-indicator";
import { SkeletonPostList } from "@/components/ui/skeleton-post";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { FeedFilters, type FeedFilterOptions } from "@/components/ui/feed-filters";

export default function SocialFeedPage() {
  const params = useParams();
  const userId = params.id as string;

  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "following" | "recommended">("all");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [advancedFilters, setAdvancedFilters] = useState<FeedFilterOptions>({
    categories: [],
    difficulties: [],
    searchQuery: "",
  });

  // Memoizar las dependencias para evitar loops infinitos
  const filtersKey = useMemo(() => 
    JSON.stringify({ filter, categories: advancedFilters.categories, difficulties: advancedFilters.difficulties, searchQuery: advancedFilters.searchQuery }),
    [filter, advancedFilters.categories, advancedFilters.difficulties, advancedFilters.searchQuery]
  );

  const loadFeed = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      // Build query params
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        filter,
      });

      if (advancedFilters.categories.length > 0) {
        queryParams.append('categories', advancedFilters.categories.join(','));
      }
      if (advancedFilters.difficulties.length > 0) {
        queryParams.append('difficulties', advancedFilters.difficulties.join(','));
      }
      if (advancedFilters.searchQuery) {
        queryParams.append('search', advancedFilters.searchQuery);
      }

      const response = await fetch(`/api/social-feed?${queryParams.toString()}`);
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
  }, [filter, advancedFilters.categories, advancedFilters.difficulties, advancedFilters.searchQuery, offset, limit]);

  useEffect(() => {
    loadFeed(true);
  }, [filtersKey]);

  const handleRefresh = useCallback(async () => {
    await loadFeed(true);
    toast.success("Feed actualizado");
  }, [loadFeed]);

  const handleLoadMore = useCallback(async () => {
    await loadFeed(false);
  }, [loadFeed]);

  // Pull to refresh
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  // Infinite scroll
  const { triggerRef, isLoading: isLoadingMore } = useInfiniteScrollTrigger(
    handleLoadMore,
    hasMore,
    !loading
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={80}
      />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold">Feed Social</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${loading || isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </motion.div>

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
            {loading && feed.length === 0 ? (
              <SkeletonPostList count={3} />
            ) : feed.length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-muted-foreground">
                  {filter === "following"
                    ? "No hay actividad de personas que sigues. ¡Comienza a seguir a otros usuarios!"
                    : "No hay evidencias disponibles aún"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <AnimatePresence mode="popLayout">
                  {feed.map((checkin) => (
                    <motion.div
                      key={checkin.checkin_id}
                      variants={staggerItem}
                      layout
                    >
                      <SocialFeedPost
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
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Infinite scroll trigger */}
                {hasMore && (
                  <div ref={triggerRef} className="flex justify-center pt-4">
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Cargando más...</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
