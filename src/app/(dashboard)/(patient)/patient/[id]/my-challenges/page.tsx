"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, TrendingUp, Flame, Target, Award, Loader2, CheckCircle2, Circle } from "lucide-react";
import { CheckinForm } from "@/components/ui/checkin-form";
import { ChallengeProgress } from "@/components/ui/challenge-progress";
import { ChallengeBadges } from "@/components/ui/challenge-badges";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface ChallengePurchase {
  id: string;
  challenge_id: string;
  challenge: {
    id: string;
    title: string;
    description: string;
    short_description?: string;
    cover_image_url?: string;
    duration_days?: number;
    difficulty_level?: string;
    category?: string;
    professional_applications: {
      first_name: string;
      last_name: string;
      profile_photo?: string;
      is_verified?: boolean;
    };
  };
  access_granted: boolean;
  payment_status: string;
  started_at?: string;
  completed_at?: string;
}

interface Checkin {
  id: string;
  day_number: number;
  checkin_date: string;
  evidence_type: string;
  evidence_url?: string;
  notes?: string;
  points_earned: number;
  verified_by_professional: boolean;
}

export default function MyChallengesPage() {
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();

  const [challenges, setChallenges] = useState<ChallengePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengePurchase | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false);
  const [nextDayNumber, setNextDayNumber] = useState(1);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Obtener retos comprados por el usuario
      const { data: purchases, error } = await supabase
        .from('challenge_purchases')
        .select(`
          id,
          challenge_id,
          access_granted,
          payment_status,
          started_at,
          completed_at,
          challenges(
            id,
            title,
            description,
            short_description,
            cover_image_url,
            duration_days,
            difficulty_level,
            category,
            professional_applications(
              first_name,
              last_name,
              profile_photo,
              is_verified
            )
          )
        `)
        .eq('buyer_id', user.id)
        .eq('payment_status', 'succeeded')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar datos de Supabase a formato esperado
      const transformedPurchases = (purchases || []).map((purchase: any) => ({
        id: purchase.id,
        challenge_id: purchase.challenge_id,
        access_granted: purchase.access_granted,
        payment_status: purchase.payment_status,
        started_at: purchase.started_at,
        completed_at: purchase.completed_at,
        challenge: Array.isArray(purchase.challenges) && purchase.challenges.length > 0
          ? purchase.challenges[0]
          : purchase.challenges,
      }));

      setChallenges(transformedPurchases);

    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Error al cargar retos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckins = async (challengePurchaseId: string) => {
    try {
      const response = await fetch(
        `/api/challenges/checkins?challenge_purchase_id=${challengePurchaseId}`
      );
      const data = await response.json();

      if (response.ok) {
        setCheckins(data.checkins || []);
        // Calcular siguiente día
        const maxDay = data.checkins?.length > 0
          ? Math.max(...data.checkins.map((c: Checkin) => c.day_number))
          : 0;
        setNextDayNumber(maxDay + 1);
      }
    } catch (error) {
      console.error("Error fetching checkins:", error);
    }
  };

  const handleOpenChallenge = async (challenge: ChallengePurchase) => {
    setSelectedChallenge(challenge);
    await fetchCheckins(challenge.id); // challenge.id es el challenge_purchase_id
  };

  const handleCheckinComplete = async () => {
    if (selectedChallenge) {
      await fetchCheckins(selectedChallenge.id);
      // Refrescar progreso
      fetchChallenges();
    }
    setIsCheckinDialogOpen(false);
  };

  const getDifficultyLabel = (level?: string) => {
    const labels: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    };
    return labels[level || ''] || level || 'N/A';
  };

  const getDifficultyColor = (level?: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800',
    };
    return colors[level || ''] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mis Retos</h1>
        <p className="text-muted-foreground">
          Gestiona tus retos activos y completa tus check-ins diarios
        </p>
      </div>

      {challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes retos aún</h3>
            <p className="text-muted-foreground text-center mb-6">
              Explora los retos disponibles y comienza tu transformación
            </p>
            <Button asChild>
              <a href={`/patient/${userId}/explore`}>Explorar Retos</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de retos */}
          <div className="lg:col-span-1 space-y-4">
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  selectedChallenge?.id === challenge.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleOpenChallenge(challenge)}
              >
                <div className="relative h-32">
                  {challenge.challenge.cover_image_url ? (
                    <Image
                      src={challenge.challenge.cover_image_url}
                      alt={challenge.challenge.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Target className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    {challenge.challenge.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {challenge.challenge.professional_applications.first_name}{' '}
                      {challenge.challenge.professional_applications.last_name}
                    </span>
                    {challenge.challenge.professional_applications.is_verified && (
                      <VerifiedBadge size={14} />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    {challenge.challenge.duration_days && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {challenge.challenge.duration_days} días
                      </Badge>
                    )}
                    {challenge.challenge.difficulty_level && (
                      <Badge className={`text-xs ${getDifficultyColor(challenge.challenge.difficulty_level)}`}>
                        {getDifficultyLabel(challenge.challenge.difficulty_level)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detalles del reto seleccionado */}
          {selectedChallenge && (
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="progress" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="progress">Progreso</TabsTrigger>
                  <TabsTrigger value="checkins">Check-ins</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                </TabsList>

                <TabsContent value="progress" className="space-y-4">
                  <ChallengeProgress
                    challengePurchaseId={selectedChallenge.id}
                    challengeDurationDays={selectedChallenge.challenge.duration_days}
                  />
                </TabsContent>

                <TabsContent value="checkins" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Check-ins Diarios</CardTitle>
                        <Button
                          onClick={() => setIsCheckinDialogOpen(true)}
                          disabled={!selectedChallenge.access_granted}
                        >
                          Nuevo Check-in
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {checkins.length === 0 ? (
                        <div className="text-center py-8">
                          <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">
                            Aún no has completado ningún check-in
                          </p>
                          <Button onClick={() => setIsCheckinDialogOpen(true)}>
                            Comenzar Día 1
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Array.from({ length: selectedChallenge.challenge.duration_days || 30 }, (_, i) => i + 1).map((day) => {
                            const checkin = checkins.find(c => c.day_number === day);
                            return (
                              <div
                                key={day}
                                className={`flex items-center gap-4 p-4 border rounded-lg ${
                                  checkin ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  {checkin ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                  ) : (
                                    <Circle className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">Día {day}</span>
                                    {checkin && (
                                      <>
                                        <Badge variant="secondary" className="text-xs">
                                          +{checkin.points_earned} pts
                                        </Badge>
                                        {checkin.verified_by_professional && (
                                          <Badge variant="default" className="text-xs">
                                            Verificado
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  {checkin && (
                                    <div className="text-sm text-muted-foreground">
                                      {checkin.notes && (
                                        <p className="mb-1">{checkin.notes}</p>
                                      )}
                                      {checkin.evidence_url && (
                                        <div className="mt-2">
                                          {checkin.evidence_type === 'photo' && (
                                            <Image
                                              src={checkin.evidence_url}
                                              alt="Evidencia"
                                              width={100}
                                              height={100}
                                              className="rounded-lg object-cover"
                                            />
                                          )}
                                        </div>
                                      )}
                                      <p className="text-xs mt-1">
                                        {new Date(checkin.checkin_date).toLocaleDateString('es-ES')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="badges">
                  <ChallengeBadges challengePurchaseId={selectedChallenge.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}

      {/* Dialog para nuevo check-in */}
      <Dialog open={isCheckinDialogOpen} onOpenChange={setIsCheckinDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Check-in - Día {nextDayNumber}</DialogTitle>
            <DialogDescription>
              Completa tu check-in diario para ganar puntos y mantener tu racha
            </DialogDescription>
          </DialogHeader>
          {selectedChallenge && (
            <CheckinForm
              challengePurchaseId={selectedChallenge.id}
              dayNumber={nextDayNumber}
              challengeDurationDays={selectedChallenge.challenge.duration_days}
              onCheckinComplete={handleCheckinComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
