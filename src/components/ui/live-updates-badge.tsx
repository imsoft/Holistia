"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LiveUpdatesBadgeProps {
  show: boolean;
  count: number;
  onClick: () => void;
  className?: string;
}

export function LiveUpdatesBadge({
  show,
  count,
  onClick,
  className,
}: LiveUpdatesBadgeProps) {
  return (
    <AnimatePresence>
      {show && count > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={cn(
            "fixed top-20 left-1/2 -translate-x-1/2 z-50",
            className
          )}
        >
          <Button
            onClick={onClick}
            size="sm"
            className="shadow-lg gap-2 bg-primary hover:bg-primary/90"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ArrowUp className="h-4 w-4" />
            </motion.div>
            <span className="font-medium">
              {count} {count === 1 ? "nueva publicación" : "nuevas publicaciones"}
            </span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface NewNotificationBadgeProps {
  show: boolean;
  onClick?: () => void;
  className?: string;
}

export function NewNotificationBadge({
  show,
  onClick,
  className,
}: NewNotificationBadgeProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          className={cn("absolute top-0 right-0", className)}
          onClick={onClick}
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-destructive border-2 border-background"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
