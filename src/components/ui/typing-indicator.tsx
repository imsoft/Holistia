"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/50"
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface TypingIndicatorWithTextProps {
  userName?: string;
}

export function TypingIndicatorWithText({ userName = "Alguien" }: TypingIndicatorWithTextProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{userName} está escribiendo</span>
      <TypingIndicator />
    </div>
  );
}
