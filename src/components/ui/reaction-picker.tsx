"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Flame, ThumbsUp, Sparkles, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReactionType = 'like' | 'love' | 'fire' | 'strong' | 'clap' | 'wow';

interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const REACTIONS: ReactionConfig[] = [
  {
    type: 'like',
    emoji: '👍',
    icon: <ThumbsUp className="h-5 w-5" />,
    label: 'Me gusta',
    color: 'text-blue-500',
  },
  {
    type: 'love',
    emoji: '❤️',
    icon: <Heart className="h-5 w-5" />,
    label: 'Me encanta',
    color: 'text-red-500',
  },
  {
    type: 'fire',
    emoji: '🔥',
    icon: <Flame className="h-5 w-5" />,
    label: 'Increíble',
    color: 'text-orange-500',
  },
  {
    type: 'strong',
    emoji: '💪',
    icon: <Target className="h-5 w-5" />,
    label: 'Motivador',
    color: 'text-amber-600',
  },
  {
    type: 'clap',
    emoji: '👏',
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Bravo',
    color: 'text-yellow-500',
  },
  {
    type: 'wow',
    emoji: '😮',
    icon: <Zap className="h-5 w-5" />,
    label: 'Wow',
    color: 'text-purple-500',
  },
];

interface ReactionPickerProps {
  currentReaction?: ReactionType | null;
  onReactionSelect: (reaction: ReactionType) => void;
  onReactionRemove: () => void;
  compact?: boolean;
}

export function ReactionPicker({
  currentReaction,
  onReactionSelect,
  onReactionRemove,
  compact = false,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

  const currentConfig = REACTIONS.find(r => r.type === currentReaction);

  const handleReactionClick = (reaction: ReactionType) => {
    if (currentReaction === reaction) {
      onReactionRemove();
    } else {
      onReactionSelect(reaction);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => {
          if (currentReaction) {
            onReactionRemove();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
          currentReaction
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-muted hover:bg-muted/80",
          compact && "px-2 py-1"
        )}
      >
        {currentConfig ? (
          <>
            <span className="text-lg">{currentConfig.emoji}</span>
            {!compact && (
              <span className="text-sm font-medium">{currentConfig.label}</span>
            )}
          </>
        ) : (
          <>
            <ThumbsUp className={cn("h-4 w-4", compact ? "h-3.5 w-3.5" : "")} />
          </>
        )}
      </button>

      {/* Reactions Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            className="absolute bottom-full left-0 mb-2 z-50"
          >
            <div className="bg-card border border-border rounded-full shadow-lg p-2 flex gap-1">
              {REACTIONS.map((reaction, index) => (
                <motion.button
                  key={reaction.type}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleReactionClick(reaction.type)}
                  onMouseEnter={() => setHoveredReaction(reaction.type)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full transition-all",
                    "hover:scale-125 hover:bg-muted",
                    currentReaction === reaction.type && "bg-primary/10 ring-2 ring-primary"
                  )}
                >
                  <span className="text-2xl">{reaction.emoji}</span>

                  {/* Label on hover */}
                  {hoveredReaction === reaction.type && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-md"
                    >
                      {reaction.label}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ReactionsSummaryProps {
  reactions: Record<ReactionType, number>;
  totalCount: number;
  userReaction?: ReactionType | null;
  onClick?: () => void;
  compact?: boolean;
}

export function ReactionsSummary({
  reactions,
  totalCount,
  userReaction,
  onClick,
  compact = false,
}: ReactionsSummaryProps) {
  if (totalCount === 0) return null;

  // Obtener los 3 tipos de reacción más populares
  const topReactions = Object.entries(reactions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => REACTIONS.find(r => r.type === type))
    .filter(Boolean);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
        compact && "text-xs"
      )}
    >
      {/* Emojis */}
      <div className="flex -space-x-1">
        {topReactions.map((reaction, index) => (
          <span
            key={reaction!.type}
            className="inline-flex items-center justify-center w-5 h-5 bg-background rounded-full border border-border"
            style={{ zIndex: 10 - index }}
          >
            <span className="text-xs">{reaction!.emoji}</span>
          </span>
        ))}
      </div>

      {/* Count */}
      <span className="font-medium">
        {totalCount}
        {userReaction && !compact && (
          <span className="text-primary ml-1">(Tú reaccionaste)</span>
        )}
      </span>
    </button>
  );
}

export { REACTIONS };
