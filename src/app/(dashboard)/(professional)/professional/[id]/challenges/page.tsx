"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { getDescriptiveErrorMessage, getFullErrorMessage, isSystemError } from "@/lib/error-messages";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Challenge {
  id: string;
  professional_id?: string | null;
  created_by_user_id?: string;
  created_by_type?: 'professional' | 'patient';
  linked_patient_id?: string | null;
  linked_professional_id?: string | null;
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  wellness_areas?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProfessionalChallenges() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;
  const supabase = createClient();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);

  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

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

      // Obtener el professional_id desde el user_id
      const userId = params.id as string;
      const { data: professionalData, error: profError } = await supabase
        .from('professional_applications')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();

      if (profError || !professionalData) {
        toast.error("No se encontró el profesional");
        return;
      }

      const response = await fetch(`/api/challenges?professional_id=${professionalData.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar retos");
      }

      setChallenges(data.challenges || []);

      // Calcular estadísticas (sin ventas)
      setStats({
        totalChallenges: data.challenges?.length || 0,
        activeChallenges: data.challenges?.filter((c: Challenge) => c.is_active).length || 0,
        totalSales: 0,
        totalRevenue: 0,
      });

    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("No pudimos cargar tus retos. Por favor, recarga la página e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingChallenge) return;

    try {
      const response = await fetch(`/api/challenges/${deletingChallenge.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = getFullErrorMessage(data.error || "Error al eliminar reto", "Error al eliminar el reto");
        toast.error(errorMsg, { duration: 6000 });
        return;
      }

      toast.success("Reto eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingChallenge(null);
      fetchChallenges();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      const errorMsg = getFullErrorMessage(error, "Error al eliminar el reto");
      toast.error(errorMsg, { duration: 6000 });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Retos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea y gestiona retos para tus usuarios
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/professional/${professionalId}/challenges/participants`}>
              Ver Participantes
            </a>
          </Button>
          <Button onClick={() => router.push(`/professional/${professionalId}/challenges/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Reto
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Retos
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">{stats.totalChallenges}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Retos Activos
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">{stats.activeChallenges}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de retos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : challenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No tienes retos aún</p>
              <Button onClick={() => router.push(`/professional/${professionalId}/challenges/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Reto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden py-4">
                <div className="relative h-48">
                  {challenge.cover_image_url ? (
                    <Image
                      src={challenge.cover_image_url}
                      alt={challenge.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  {!challenge.is_active && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">Inactivo</Badge>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {challenge.duration_days && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {challenge.duration_days} {challenge.duration_days === 1 ? 'día' : 'días'}
                    </div>
                  )}
                  {challenge.linked_patient_id && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Reto vinculado a paciente
                    </div>
                  )}
                  {challenge.linked_professional_id && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Reto vinculado a profesional
                    </div>
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/professional/${professionalId}/challenges/${challenge.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setDeletingChallenge(challenge);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Reto"
        description={`¿Estás seguro de que deseas eliminar "${deletingChallenge?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
