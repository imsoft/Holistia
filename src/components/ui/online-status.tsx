"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnlineStatusProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  showPulse?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function OnlineStatus({
  isOnline,
  size = "md",
  showPulse = true,
  className,
}: OnlineStatusProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      {/* Punto de estado */}
      <motion.div
        className={cn(
          "rounded-full border-2 border-background",
          sizeClasses[size],
          isOnline ? "bg-green-500" : "bg-gray-400"
        )}
        initial={false}
        animate={
          isOnline && showPulse
            ? {
                scale: [1, 1.2, 1],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Efecto de pulso (anillo expandiéndose) */}
      {isOnline && showPulse && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full bg-green-500",
            sizeClasses[size]
          )}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{
            scale: 2,
            opacity: 0,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
    </div>
  );
}

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function OnlineStatusBadge({
  isOnline,
  text,
  size = "md",
}: OnlineStatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <OnlineStatus isOnline={isOnline} size={size} />
      {text && (
        <span
          className={cn(
            "font-medium",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            isOnline ? "text-green-600" : "text-gray-500"
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
}
