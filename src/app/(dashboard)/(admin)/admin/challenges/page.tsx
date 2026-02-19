"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Calendar,
  Eye,
  Loader2,
  Target,
  Users,
  Award,
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  File,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/utils/supabase/client";
import { getDescriptiveErrorMessage, getFullErrorMessage } from "@/lib/error-messages";
import { WellnessAreasSelector } from "@/components/ui/wellness-areas-selector";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DeleteConfirmation } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Challenge {
  id: string;
  professional_id?: string | null;
  professional_name?: string;
  professional_email?: string;
  created_by_user_id?: string;
  created_by_type?: 'professional' | 'patient' | 'admin';
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  wellness_areas?: string[];
  linked_patient_id?: string | null;
  linked_professional_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'Todas las dificultades' },
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'expert', label: 'Experto' },
] as const;

export default function AdminChallengesPage() {
  useUserStoreInit();
  const router = useRouter();
  const adminId = useUserId();
  const supabase = createClient();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [creatorTypeFilter, setCreatorTypeFilter] = useState<string>("all");

  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalParticipants: 0,
    growthThisMonth: 0,
    previousMonthChallenges: 0,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover_image_url: "",
    duration_days: "",
    difficulty_level: "",
    category: "",
    wellness_areas: [] as string[],
    linked_patient_id: "",
    linked_professional_id: "",
    professional_id: "",
    is_active: true,
  });
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [challengeFiles, setChallengeFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchChallenges();
    fetchProfessionals();
    fetchPatients();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoadingProfessionals(true);
      const { data, error } = await supabase
        .from('professional_applications')
        .select('id, first_name, last_name, profession, is_verified')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoadingProfessionals(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('type', 'patient')
        .order('first_name', { ascending: true })
        .limit(100);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, difficultyFilter, creatorTypeFilter, challenges]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Obtener todos los retos
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching challenges:", error);
        throw error;
      }

      // Obtener información de profesionales para los retos que tienen professional_id
      const professionalIds = (challengesData || [])
        .filter((c: any) => c.professional_id)
        .map((c: any) => c.professional_id);
      
      let professionalsMap: Record<string, any> = {};
      if (professionalIds.length > 0) {
        const { data: professionalsData } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, email')
          .in('id', professionalIds);

        if (professionalsData) {
          professionalsMap = professionalsData.reduce((acc: Record<string, any>, prof: any) => {
            acc[prof.id] = prof;
            return acc;
          }, {});
        }
      }

      const formattedChallenges = (challengesData || []).map((challenge: any) => {
        const professional = challenge.professional_id ? professionalsMap[challenge.professional_id] : null;
        
        return {
          ...challenge,
          professional_name: professional
            ? `${professional.first_name} ${professional.last_name}`
            : challenge.created_by_type === 'admin' ? 'Administrador' 
            : challenge.created_by_type === 'patient' ? 'Paciente' 
            : challenge.created_by_type === 'professional' ? 'Profesional' 
            : 'Desconocido',
          professional_email: professional?.email,
        };
      });

      setChallenges(formattedChallenges);

      // Obtener total de participantes
      const { count: participantsCount } = await supabase
        .from('challenge_purchases')
        .select('*', { count: 'exact', head: true });

      // Calcular crecimiento este mes
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const challengesThisMonth = formattedChallenges.filter(
        (c) => new Date(c.created_at) >= startOfThisMonth
      ).length;
      
      const challengesLastMonth = formattedChallenges.filter(
        (c) => new Date(c.created_at) >= startOfLastMonth && new Date(c.created_at) < startOfThisMonth
      ).length;

      const growthPercentage = challengesLastMonth > 0 
        ? Math.round(((challengesThisMonth - challengesLastMonth) / challengesLastMonth) * 100)
        : challengesThisMonth > 0 ? 100 : 0;

      setStats({
        totalChallenges: formattedChallenges.length,
        activeChallenges: formattedChallenges.filter((c) => c.is_active).length,
        totalParticipants: participantsCount || 0,
        growthThisMonth: growthPercentage,
        previousMonthChallenges: challengesLastMonth,
      });

    } catch (error: any) {
      console.error("Error fetching challenges:", error);
      const errorMessage = getFullErrorMessage(error, "Error al cargar retos");
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...challenges];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.professional_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.professional_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) =>
        statusFilter === "active" ? c.is_active : !c.is_active
      );
    }

    // Filtrar por dificultad
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((c) => c.difficulty_level === difficultyFilter);
    }

    // Filtrar por tipo de creador
    if (creatorTypeFilter !== "all") {
      filtered = filtered.filter((c) => c.created_by_type === creatorTypeFilter);
    }

    setFilteredChallenges(filtered);
  };

  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return 'Sin especificar';
    const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
    return option?.label || difficulty;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const fetchChallengeFiles = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/files`);
      const data = await response.json();

      if (response.ok) {
        setChallengeFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching challenge files:", error);
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. El tamaño máximo es 5MB.');
      return;
    }

    try {
      setUploadingCover(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      let challengeId = editingChallenge?.id;

      if (!challengeId) {
        // Crear reto temporal para subir imagen
        const tempChallenge = {
          created_by_user_id: user.id,
          created_by_type: 'admin',
          title: formData.title || "Nuevo Reto",
          description: formData.description || "",
          professional_id: formData.professional_id && formData.professional_id !== 'none' ? formData.professional_id : null,
          linked_patient_id: formData.linked_patient_id && formData.linked_patient_id !== 'none' ? formData.linked_patient_id : null,
          linked_professional_id: formData.linked_professional_id && formData.linked_professional_id !== 'none' ? formData.linked_professional_id : null,
          is_active: false,
        };

        const response = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tempChallenge),
        });

        const data = await response.json();
        if (!response.ok) {
          const errorMsg = getFullErrorMessage(data.error || "Error al crear reto", "Error al crear el reto temporal");
          toast.error(errorMsg, { duration: 6000 });
          setUploadingCover(false);
          return;
        }

        challengeId = data.challenge.id;
        setEditingChallenge(data.challenge);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `cover.${fileExt}`;
      const filePath = `${challengeId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('challenges')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        const errorMsg = getFullErrorMessage(uploadError, "Error al subir la imagen de portada");
        toast.error(errorMsg, { duration: 6000 });
        setUploadingCover(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('challenges')
        .getPublicUrl(filePath);

      setFormData({ ...formData, cover_image_url: publicUrl });
      toast.success("Imagen de portada subida exitosamente");

    } catch (error) {
      console.error("Error uploading cover image:", error);
      const errorMsg = getFullErrorMessage(error, "Error al subir la imagen de portada");
      toast.error(errorMsg, { duration: 6000 });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDeleteClick = (challenge: Challenge) => {
    setChallengeToDelete(challenge);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!challengeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/challenges/${challengeToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el reto');
      }

      toast.success('Reto eliminado exitosamente');
      fetchChallenges();
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
    } catch (error) {
      console.error('Error deleting challenge:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el reto';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error("El título es requerido. Por favor, ingresa un título para el reto.");
      return;
    }

    if (!formData.description?.trim()) {
      toast.error("La descripción es requerida. Por favor, describe el reto.");
      return;
    }

    if (formData.duration_days && (isNaN(parseInt(formData.duration_days)) || parseInt(formData.duration_days) < 1)) {
      toast.error("La duración en días debe ser un número válido mayor a 0.");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Debes iniciar sesión para crear o editar retos.");
        return;
      }

      const challengeData = {
        created_by_user_id: user.id,
        created_by_type: 'admin',
        title: formData.title.trim(),
        description: formData.description.trim(),
        cover_image_url: formData.cover_image_url || null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        difficulty_level: formData.difficulty_level || null,
        category: formData.category || null,
        wellness_areas: formData.wellness_areas || [],
        professional_id: formData.professional_id && formData.professional_id !== 'none' ? formData.professional_id : null,
        linked_patient_id: formData.linked_patient_id && formData.linked_patient_id !== 'none' ? formData.linked_patient_id : null,
        linked_professional_id: formData.linked_professional_id && formData.linked_professional_id !== 'none' ? formData.linked_professional_id : null,
        is_active: formData.is_active,
      };

      if (editingChallenge) {
        const response = await fetch(`/api/challenges/${editingChallenge.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challengeData),
        });

        const data = await response.json();
        if (!response.ok) {
          const errorMsg = getFullErrorMessage(data.error || "Error al actualizar reto", "Error al actualizar el reto");
          toast.error(errorMsg, { duration: 6000 });
          return;
        }

        toast.success("Reto actualizado exitosamente");
      } else {
        const response = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challengeData),
        });

        const data = await response.json();
        if (!response.ok) {
          const errorMsg = getFullErrorMessage(data.error || "Error al crear reto", "Error al crear el reto");
          toast.error(errorMsg, { duration: 6000 });
          return;
        }

        toast.success("Reto creado exitosamente");
      }

      setIsFormOpen(false);
      fetchChallenges();
    } catch (error) {
      console.error("Error saving challenge:", error);
      const errorMsg = getFullErrorMessage(error, "Error al guardar el reto");
      toast.error(errorMsg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-shell">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Todos los Retos</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona y visualiza todos los retos de la plataforma
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/admin/challenges/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Reto
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Retos</span>
                <Badge variant="secondary" className="gap-1">
                  <Target className="h-3 w-3" />
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.totalChallenges}</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500 font-medium">Plataforma</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Retos en la plataforma</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Retos Activos</span>
                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                  <Award className="h-3 w-3" />
                </Badge>
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.activeChallenges}</div>
              <div className="flex items-center gap-1 mt-2">
                {stats.activeChallenges > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">
                      {Math.round((stats.activeChallenges / stats.totalChallenges) * 100) || 0}% del total
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Sin activos</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Disponibles para usuarios</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Participantes</span>
                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                  <Users className="h-3 w-3" />
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.totalParticipants}</div>
              <div className="flex items-center gap-1 mt-2">
                {stats.totalParticipants > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">Usuarios activos</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Sin participantes</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total de inscripciones</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Crecimiento</span>
                <Badge variant="secondary" className={`gap-1 ${stats.growthThisMonth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {stats.growthThisMonth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </Badge>
              </div>
              <div className={`text-3xl font-bold ${stats.growthThisMonth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.growthThisMonth >= 0 ? '+' : ''}{stats.growthThisMonth}%
              </div>
              <div className="flex items-center gap-1 mt-2">
                {stats.growthThisMonth >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-500 font-medium">Este mes</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500 font-medium">Este mes</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs. mes anterior ({stats.previousMonthChallenges} retos)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, profesional, email o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={creatorTypeFilter} onValueChange={setCreatorTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo de creador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los creadores</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="professional">Profesional</SelectItem>
              <SelectItem value="patient">Paciente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de retos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredChallenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {challenges.length === 0
                  ? "No hay retos en la plataforma"
                  : "No se encontraron retos con los filtros aplicados"}
              </p>
              {(searchTerm || statusFilter !== "all" || difficultyFilter !== "all" || creatorTypeFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDifficultyFilter("all");
                    setCreatorTypeFilter("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden hover:shadow-lg transition-shadow pt-0 pb-4">
                <div className="relative h-48 w-full overflow-hidden">
                  {challenge.cover_image_url ? (
                    <Image
                      src={challenge.cover_image_url}
                      alt={challenge.title}
                      fill
                      className="object-cover"
                      unoptimized={
                        challenge.cover_image_url.includes("supabase") ||
                        challenge.cover_image_url.includes("supabase.in")
                      }
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Target className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {!challenge.is_active && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                    {challenge.difficulty_level && (
                      <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                        {getDifficultyLabel(challenge.difficulty_level)}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      Por: <span className="font-medium text-foreground">{challenge.professional_name}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {challenge.category && (
                    <Badge variant="outline">{challenge.category}</Badge>
                  )}

                  {challenge.created_by_type && (
                    <Badge variant="secondary" className="text-xs">
                      Creado por: {challenge.created_by_type === 'admin' ? 'Administrador' : challenge.created_by_type === 'professional' ? 'Profesional' : 'Paciente'}
                    </Badge>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {challenge.duration_days && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {challenge.duration_days} días
                      </div>
                    )}
                    {challenge.difficulty_level && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        {getDifficultyLabel(challenge.difficulty_level)}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/admin/challenges/${challenge.id}/edit`)}
                      aria-label="Editar reto"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Link
                      href={`/admin/challenges/${challenge.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(challenge)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={challengeToDelete?.title || 'este reto'}
        loading={deleting}
      />
    </div>
  );
}
