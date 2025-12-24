"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Distancia mínima para activar refresh (en px)
  resistance?: number; // Factor de resistencia al arrastrar
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);

  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isRefreshing) return;

      // Solo permitir pull-to-refresh si el scroll está en la parte superior
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
        setCanPull(true);
      }
    },
    [enabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isRefreshing || !canPull) return;

      const touchCurrentY = e.touches[0].clientY;
      const pullDelta = touchCurrentY - touchStartY.current;

      // Solo permitir arrastre hacia abajo
      if (pullDelta > 0) {
        isPulling.current = true;

        // Aplicar resistencia para que sea más difícil arrastrar
        const distance = Math.min(pullDelta / resistance, threshold * 1.5);
        setPullDistance(distance);

        // Prevenir scroll nativo si estamos arrastrando
        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [enabled, isRefreshing, canPull, threshold, resistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing || !isPulling.current) {
      setPullDistance(0);
      setCanPull(false);
      return;
    }

    // Si superamos el threshold, activar refresh
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Mantener en el threshold durante el refresh

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanPull(false);
        isPulling.current = false;
      }
    } else {
      // Animación de rebote
      setPullDistance(0);
      setCanPull(false);
      isPulling.current = false;
    }
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isRefreshing,
    isPulling: isPulling.current && pullDistance > 0,
    shouldTrigger: pullDistance >= threshold,
  };
}
