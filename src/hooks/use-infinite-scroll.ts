"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number; // Distancia del bottom para activar (en px)
  enabled?: boolean;
  rootMargin?: string; // Margen para IntersectionObserver
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  threshold = 200,
  enabled = true,
  rootMargin = "0px",
}: UseInfiniteScrollOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (!enabled || !hasMore || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      await onLoadMore();
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [enabled, hasMore, onLoadMore]);

  useEffect(() => {
    if (!enabled || !hasMore) return;

    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingRef.current) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin,
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [enabled, hasMore, handleLoadMore, rootMargin]);

  // También observar el scroll manual como fallback
  useEffect(() => {
    if (!enabled || !hasMore) return;

    const handleScroll = () => {
      if (loadingRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < threshold) {
        handleLoadMore();
      }
    };

    // Throttle scroll events
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = undefined as any;
      }, 100);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, hasMore, threshold, handleLoadMore]);

  return {
    observerTarget,
    isLoading,
  };
}

/**
 * Hook simplificado para casos comunes
 * Retorna un ref que debe colocarse en el elemento que activa la carga
 */
export function useInfiniteScrollTrigger(
  onLoadMore: () => Promise<void>,
  hasMore: boolean,
  enabled = true
) {
  const { observerTarget, isLoading } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    enabled,
  });

  return { triggerRef: observerTarget, isLoading };
}
