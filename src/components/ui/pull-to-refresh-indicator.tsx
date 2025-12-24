"use client";

import { motion } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldTrigger = pullDistance >= threshold;

  // No mostrar nada si no hay pull
  if (pullDistance === 0 && !isRefreshing) {
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
      }}
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg">
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <motion.div
            animate={{
              rotate: shouldTrigger ? 180 : 0,
              scale: shouldTrigger ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <ArrowDown
              className={cn(
                "h-5 w-5 transition-colors",
                shouldTrigger ? "text-primary" : "text-muted-foreground"
              )}
            />
          </motion.div>
        )}
      </div>

      {/* Barra de progreso circular */}
      {!isRefreshing && (
        <svg
          className="absolute"
          width="60"
          height="60"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="30"
            cy="30"
            r="26"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-muted"
            opacity="0.2"
          />
          <motion.circle
            cx="30"
            cy="30"
            r="26"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className={cn(
              "transition-colors",
              shouldTrigger ? "text-primary" : "text-muted-foreground"
            )}
            strokeDasharray={`${2 * Math.PI * 26}`}
            strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
      )}
    </motion.div>
  );
}
