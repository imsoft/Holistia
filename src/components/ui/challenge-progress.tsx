"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Flame, Target, Award, Calendar } from "lucide-react";

interface ChallengeProgressProps {
  challengePurchaseId: string;
  challengeDurationDays?: number;
}

interface ProgressData {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  days_completed: number;
  completion_percentage: number;
  level: number;
  status: string;
  last_checkin_date: string | null;
}

export function ChallengeProgress({
  challengePurchaseId,
  challengeDurationDays,
}: ChallengeProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [challengePurchaseId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      
      // Validar que el challengePurchaseId es válido (no es un challenge.id)
      if (!challengePurchaseId || challengePurchaseId.length < 36) {
        console.warn("Invalid challengePurchaseId, using default progress");
        setProgress({
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          days_completed: 0,
          completion_percentage: 0,
          level: 1,
          status: 'in_progress',
          last_checkin_date: null,
        });
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch(
        `/api/challenges/progress?challenge_purchase_id=${challengePurchaseId}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        if (data.progress) {
          setProgress(data.progress);
        } else {
          // Si no hay progreso pero la respuesta es OK, crear uno por defecto
          setProgress({
            total_points: 0,
            current_streak: 0,
            longest_streak: 0,
            days_completed: 0,
            completion_percentage: 0,
            level: 1,
            status: 'in_progress',
            last_checkin_date: null,
          });
        }
      } else {
        console.error("Error fetching progress:", data.error);
        // Crear progreso por defecto si hay error pero no bloquear la UI
        setProgress({
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          days_completed: 0,
          completion_percentage: 0,
          level: 1,
          status: 'in_progress',
          last_checkin_date: null,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Timeout fetching progress");
      } else {
        console.error("Error fetching progress:", error);
      }
      // Crear progreso por defecto para no bloquear la UI
      setProgress({
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        days_completed: 0,
        completion_percentage: 0,
        level: 1,
        status: 'in_progress',
        last_checkin_date: null,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="py-4">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return null;
  }

  const pointsForNextLevel = (progress.level * 100) - progress.total_points;
  const progressToNextLevel = progress.total_points % 100;

  return (
    <div className="space-y-4">
      {/* Progreso general */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Progreso del Reto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Porcentaje de completitud */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completitud</span>
              <span className="text-sm font-bold text-primary">
                {progress.completion_percentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={progress.completion_percentage} className="h-3" />
            {challengeDurationDays && (
              <p className="text-xs text-muted-foreground mt-1">
                {progress.days_completed} de {challengeDurationDays} días completados
              </p>
            )}
          </div>

          {/* Nivel y puntos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Nivel</span>
              </div>
              <p className="text-2xl font-bold">{progress.level}</p>
              <p className="text-xs text-muted-foreground">
                {pointsForNextLevel > 0 ? `${pointsForNextLevel} pts para nivel ${progress.level + 1}` : 'Nivel máximo alcanzado'}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Puntos</span>
              </div>
              <p className="text-2xl font-bold">{progress.total_points}</p>
              <Progress value={progressToNextLevel} className="h-1 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Racha */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Racha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Racha Actual</p>
              <p className="text-2xl font-bold text-orange-500">
                {progress.current_streak} 🔥
              </p>
              {progress.current_streak > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.current_streak === 1 ? 'día' : 'días'} consecutivos
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mejor Racha</p>
              <p className="text-2xl font-bold">
                {progress.longest_streak} 🏆
              </p>
              {progress.longest_streak > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.longest_streak === 1 ? 'día' : 'días'} consecutivos
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado */}
      <div className="flex items-center justify-center">
        <Badge
          variant={
            progress.status === 'completed' ? 'default' :
            progress.status === 'abandoned' ? 'destructive' :
            'secondary'
          }
          className="text-sm px-4 py-2"
        >
          {progress.status === 'completed' && '✅ Completado'}
          {progress.status === 'abandoned' && '❌ Abandonado'}
          {progress.status === 'in_progress' && '🔄 En Progreso'}
        </Badge>
      </div>
    </div>
  );
}
