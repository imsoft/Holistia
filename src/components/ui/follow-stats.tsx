"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface FollowStatsProps {
  userId: string;
  className?: string;
  showLabels?: boolean;
}

export function FollowStats({
  userId,
  className = "",
  showLabels = true,
}: FollowStatsProps) {
  const [stats, setStats] = useState({
    followers_count: 0,
    following_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/follows/stats?user_id=${userId}`);
      const data = await response.json();

      if (data.followers_count !== undefined) {
        setStats({
          followers_count: data.followers_count || 0,
          following_count: data.following_count || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching follow stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex gap-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">-</span>
        </div>
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">-</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{stats.followers_count}</span>
          {showLabels && (
            <span className="text-xs text-muted-foreground">
              {stats.followers_count === 1 ? "seguidor" : "seguidores"}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{stats.following_count}</span>
          {showLabels && (
            <span className="text-xs text-muted-foreground">siguiendo</span>
          )}
        </div>
      </div>
    </div>
  );
}
