"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { Trophy, Lock } from "lucide-react";

interface ChallengeBadgesProps {
  challengePurchaseId: string;
}

interface Badge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_color: string;
  badge_type: string;
  unlocked_at?: string;
  points_earned?: number;
}

export function ChallengeBadges({ challengePurchaseId }: ChallengeBadgesProps) {
  const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
  const [lockedBadges, setLockedBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [challengePurchaseId]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/challenges/badges?challenge_purchase_id=${challengePurchaseId}`
      );
      const data = await response.json();

      if (response.ok) {
        // Transformar datos de badges desbloqueados
        const unlocked = (data.unlocked || []).map((ub: any) => ({
          id: ub.challenge_badges.id,
          badge_name: ub.challenge_badges.badge_name,
          badge_description: ub.challenge_badges.badge_description,
          badge_icon: ub.challenge_badges.badge_icon,
          badge_color: ub.challenge_badges.badge_color,
          badge_type: ub.challenge_badges.badge_type,
          unlocked_at: ub.unlocked_at,
          points_earned: ub.points_earned,
        }));

        setUnlockedBadges(unlocked);
        setLockedBadges(data.locked || []);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="py-4">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Badges desbloqueados */}
      {unlockedBadges.length > 0 && (
        <Card className="py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Badges Desbloqueados ({unlockedBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {unlockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-md transition-shadow"
                >
                  <div
                    className="text-4xl mb-2"
                    style={{ color: badge.badge_color || '#000' }}
                  >
                    {badge.badge_icon}
                  </div>
                  <p className="font-semibold text-sm text-center mb-1">
                    {badge.badge_name}
                  </p>
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    {badge.badge_description}
                  </p>
                  {badge.points_earned && badge.points_earned > 0 && (
                    <BadgeComponent variant="secondary" className="text-xs">
                      +{badge.points_earned} pts
                    </BadgeComponent>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges bloqueados */}
      {lockedBadges.length > 0 && (
        <Card className="py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Badges por Desbloquear ({lockedBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center p-4 border rounded-lg bg-muted/30 opacity-60"
                >
                  <div className="text-4xl mb-2 grayscale">
                    {badge.badge_icon}
                  </div>
                  <p className="font-semibold text-sm text-center mb-1">
                    {badge.badge_name}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {badge.badge_description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {unlockedBadges.length === 0 && lockedBadges.length === 0 && (
        <Card className="py-4">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No hay badges disponibles para este reto
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
