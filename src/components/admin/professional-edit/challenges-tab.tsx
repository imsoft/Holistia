"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

interface ChallengesTabProps {
  professionalId: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: string;
  is_active: boolean;
}

export function ChallengesTab({ professionalId }: ChallengesTabProps) {
  const supabase = createClient();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, [professionalId]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Error al cargar los retos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Retos</CardTitle>
              <CardDescription>Gestiona los retos creados por este profesional</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Reto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {challenges.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay retos registrados
            </p>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-start gap-4 border rounded-lg p-4"
                >
                  {challenge.cover_image_url && (
                    <div className="relative h-20 w-20 shrink-0 rounded overflow-hidden">
                      <Image
                        src={challenge.cover_image_url}
                        alt={challenge.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{challenge.title}</h3>
                      {challenge.is_active && (
                        <Badge variant="default">Activo</Badge>
                      )}
                      {challenge.difficulty_level && (
                        <Badge variant="outline">{challenge.difficulty_level}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {challenge.short_description || challenge.description}
                    </p>
                    {challenge.duration_days && (
                      <p className="text-sm mt-2">
                        Duración: {challenge.duration_days} días
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
