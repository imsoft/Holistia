"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { getDescriptiveErrorMessage, getFullErrorMessage, isSystemError } from "@/lib/error-messages";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Upload,
  X,
  FileText,
  Video,
  Headphones,
  Image as ImageIcon,
  File,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { WellnessAreasSelector } from "@/components/ui/wellness-areas-selector";

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

interface ChallengeFile {
  id: string;
  challenge_id: string;
  file_name: string;
  file_url: string;
  file_type: 'audio' | 'video' | 'pdf' | 'image' | 'document' | 'other';
  file_size_mb?: number;
  display_order: number;
  description?: string;
}

interface FormData {
  title: string;
  description: string;
  short_description: string;
  cover_image_url: string;
  duration_days: string;
  difficulty_level: string;
  category: string;
  wellness_areas: string[];
  linked_patient_id: string;
  is_active: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'expert', label: 'Experto' },
] as const;

export default function ProfessionalChallenges() {
  const params = useParams();
  const professionalId = params.id as string;
  const supabase = createClient();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);
  const [saving, setSaving] = useState(false);
  const [challengeFiles, setChallengeFiles] = useState<ChallengeFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [patients, setPatients] = useState<Array<{ patient_id: string; full_name: string; email: string }>>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    short_description: "",
    cover_image_url: "",
    duration_days: "",
    difficulty_level: "",
    category: "",
    wellness_areas: [],
    linked_patient_id: "",
    is_active: true,
  });

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchChallenges();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const userId = params.id as string;
      
      // Obtener professional_id
      const { data: professionalData, error: profError } = await supabase
        .from('professional_applications')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();

      if (profError || !professionalData) {
        return;
      }

      // Cargar pacientes desde professional_patient_info
      const { data: patientsData, error: patientsError } = await supabase
        .from('professional_patient_info')
        .select('patient_id, full_name, email')
        .eq('professional_id', professionalData.id)
        .order('full_name', { ascending: true });

      if (patientsError) {
        console.error('Error cargando pacientes:', patientsError);
        return;
      }

      // También cargar todos los pacientes registrados
      const { data: allPatientsData, error: allPatientsError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('type', 'patient')
        .eq('account_active', true)
        .order('first_name', { ascending: true });

      if (allPatientsError) {
        console.error('Error cargando todos los pacientes:', allPatientsError);
        return;
      }

      // Combinar y formatear
      const formattedAllPatients = (allPatientsData || []).map(profile => ({
        patient_id: profile.id,
        full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Paciente',
        email: profile.email || '',
      }));

      // Eliminar duplicados
      const uniquePatients = Array.from(
        new Map(formattedAllPatients.map(p => [p.patient_id, p])).values()
      );

      setPatients(uniquePatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

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
      toast.error("Error al cargar retos");
    } finally {
      setLoading(false);
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

  const handleOpenForm = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setFormData({
        title: challenge.title,
        description: challenge.description,
        short_description: challenge.short_description || "",
        cover_image_url: challenge.cover_image_url || "",
        duration_days: challenge.duration_days?.toString() || "",
        difficulty_level: challenge.difficulty_level || "",
        category: challenge.category || "",
        wellness_areas: challenge.wellness_areas || [],
        linked_patient_id: challenge.linked_patient_id || "none",
        is_active: challenge.is_active,
      });
      fetchChallengeFiles(challenge.id);
    } else {
      setEditingChallenge(null);
      setFormData({
        title: "",
        description: "",
        short_description: "",
        cover_image_url: "",
        duration_days: "",
        difficulty_level: "",
        category: "",
        wellness_areas: [],
        linked_patient_id: "none",
        is_active: true,
      });
      setChallengeFiles([]);
    }
    setIsFormOpen(true);
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
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

      let challengeId = editingChallenge?.id;

      // Si es un reto nuevo, crear primero el reto con datos mínimos
      if (!challengeId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Debes iniciar sesión");
          return;
        }

        const tempChallenge = {
          professional_id: professionalData.id,
          created_by_user_id: user.id,
          created_by_type: 'professional',
          title: formData.title || "Nuevo Reto",
          description: formData.description || "",
          linked_patient_id: formData.linked_patient_id && formData.linked_patient_id !== 'none' ? formData.linked_patient_id : null,
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

      // Subir imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `cover.${fileExt}`;
      const filePath = `${challengeId}/${fileName}`;

      // Subir imagen a Supabase Storage (bucket challenges)
      const { error: uploadError } = await supabase.storage
        .from('challenges')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permite sobrescribir si existe
        });

      if (uploadError) throw uploadError;

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!editingChallenge) {
      toast.error("Primero debes guardar el reto");
      return;
    }

    try {
      setUploadingFile(true);
      const challengeId = editingChallenge.id;

      // Determinar tipo de archivo
      let fileType: 'audio' | 'video' | 'pdf' | 'image' | 'document' | 'other' = 'other';
      if (file.type.startsWith('audio/')) fileType = 'audio';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.includes('document') || file.type.includes('word') || file.type.includes('excel')) fileType = 'document';

      // Subir archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${challengeId}/files/${fileName}`;

      // Subir archivo a Supabase Storage (bucket challenges)
      const { error: uploadError } = await supabase.storage
        .from('challenges')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permite sobrescribir si existe
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenges')
        .getPublicUrl(filePath);

      // Crear registro del archivo
      const response = await fetch(`/api/challenges/${challengeId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: file.name,
          file_url: publicUrl,
          file_type: fileType,
          file_size_mb: (file.size / (1024 * 1024)).toFixed(2),
          display_order: challengeFiles.length,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = getFullErrorMessage(data.error || "Error al guardar archivo", "Error al guardar el archivo");
        toast.error(errorMsg, { duration: 6000 });
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setChallengeFiles([...challengeFiles, data.file]);
      toast.success("Archivo subido exitosamente");

    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMsg = getFullErrorMessage(error, "Error al subir el archivo");
      toast.error(errorMsg, { duration: 6000 });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    if (!editingChallenge) return;

    try {
      const response = await fetch(`/api/challenges/${editingChallenge.id}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = getFullErrorMessage(data.error || "Error al eliminar archivo", "Error al eliminar el archivo");
        toast.error(errorMsg, { duration: 6000 });
        return;
      }

      setChallengeFiles(challengeFiles.filter(f => f.id !== fileId));
      toast.success("Archivo eliminado exitosamente");

    } catch (error) {
      console.error("Error removing file:", error);
      const errorMsg = getFullErrorMessage(error, "Error al eliminar el archivo");
      toast.error(errorMsg, { duration: 6000 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones más específicas
    if (!formData.title?.trim()) {
      toast.error("El título es requerido. Por favor, ingresa un título para tu reto.");
      return;
    }

    if (!formData.description?.trim()) {
      toast.error("La descripción es requerida. Por favor, describe tu reto.");
      return;
    }

    // Validar duration_days si se proporciona
    if (formData.duration_days && (isNaN(parseInt(formData.duration_days)) || parseInt(formData.duration_days) < 1)) {
      toast.error("La duración en días debe ser un número válido mayor a 0.");
      return;
    }

    try {
      setSaving(true);

      // Obtener el professional_id desde el user_id
      const userId = params.id as string;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error("Debes iniciar sesión para crear o editar retos. Por favor, inicia sesión e intenta nuevamente.");
        return;
      }

      const { data: professionalData, error: profError } = await supabase
        .from('professional_applications')
        .select('id, status, is_active')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();

      if (profError) {
        const errorMsg = getFullErrorMessage(profError, "Error al verificar tu perfil");
        toast.error(errorMsg, { duration: 6000 });
        return;
      }

      if (!professionalData) {
        toast.error("No se encontró tu perfil de profesional aprobado. Solo los profesionales aprobados pueden crear retos. Contacta al administrador si crees que esto es un error.");
        return;
      }

      if (professionalData.status !== 'approved') {
        toast.error(`Tu perfil está en estado "${professionalData.status}". Solo los profesionales aprobados pueden crear retos. Contacta al administrador si crees que esto es un error.`);
        return;
      }

      const challengeData = {
        professional_id: professionalData.id,
        created_by_user_id: user.id,
        created_by_type: 'professional',
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description?.trim() || null,
        cover_image_url: formData.cover_image_url || null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        difficulty_level: formData.difficulty_level || null,
        category: formData.category || null,
        wellness_areas: formData.wellness_areas || [],
        linked_patient_id: formData.linked_patient_id && formData.linked_patient_id !== 'none' ? formData.linked_patient_id : null,
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

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'audio': return Headphones;
      case 'video': return Video;
      case 'pdf': return FileText;
      case 'image': return ImageIcon;
      default: return File;
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
          <Button onClick={() => handleOpenForm()}>
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
              <Button onClick={() => handleOpenForm()}>
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
                      onClick={() => handleOpenForm(challenge)}
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

      {/* Dialog de formulario */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChallenge ? "Editar Reto" : "Nuevo Reto"}
            </DialogTitle>
            <DialogDescription>
              Completa la información del reto
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="mb-2 block">
                Título *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Reto de Meditación 21 Días"
                required
              />
            </div>

            <div>
              <Label htmlFor="short_description" className="mb-2 block">
                Descripción Corta
              </Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Breve descripción para mostrar en cards"
                maxLength={150}
              />
            </div>

            <div>
              <Label htmlFor="description" className="mb-2 block">
                Descripción Completa *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el reto en detalle..."
                rows={5}
                required
              />
            </div>

            {/* Selector de Paciente (Opcional) */}
            <div>
              <Label htmlFor="linked_patient_id" className="mb-2 block">
                Vincular a Paciente (Opcional)
              </Label>
              <Select
                value={formData.linked_patient_id}
                onValueChange={(value) => setFormData({ ...formData, linked_patient_id: value })}
                disabled={loadingPatients}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingPatients ? "Cargando pacientes..." : "Selecciona un paciente (opcional)"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">Ninguno (Reto público)</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_id} value={patient.patient_id}>
                      {patient.full_name} - {patient.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Si seleccionas un paciente, el reto estará vinculado específicamente a él. Si no seleccionas ninguno, será un reto público.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_days" className="mb-2 block">
                  Duración (días)
                </Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  placeholder="Ej: 21"
                />
              </div>
              <div>
                <Label htmlFor="difficulty_level" className="mb-2 block">
                  Nivel de Dificultad
                </Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="category" className="mb-2 block">
                Categoría
              </Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Meditación, Fitness, Nutrición"
              />
            </div>

            {/* Áreas de Bienestar */}
            <WellnessAreasSelector
              selectedAreas={formData.wellness_areas}
              onAreasChange={(areas) => setFormData({ ...formData, wellness_areas: areas })}
              label="Áreas de Bienestar"
              description="Selecciona las áreas de bienestar relacionadas con este reto"
            />

            {/* Imagen de portada */}
            <div>
              <Label className="mb-2 block">Imagen de Portada</Label>
              <div className="space-y-3">
                {formData.cover_image_url ? (
                  <div className="relative h-48 w-full rounded-lg overflow-hidden border-2 border-dashed border-muted">
                    <Image
                      src={formData.cover_image_url}
                      alt="Portada"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 shadow-lg"
                      onClick={() => setFormData({ ...formData, cover_image_url: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative h-48 w-full rounded-lg border-2 border-dashed border-muted bg-muted/10 flex flex-col items-center justify-center gap-2 hover:bg-muted/20 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No se ha subido ninguna imagen</p>
                  </div>
                )}
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => coverFileInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.cover_image_url ? "Cambiar Imagen" : "Subir Imagen de Portada"}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Tamaño máximo: 5MB. Formatos: JPG, PNG, WEBP
                </p>
              </div>
            </div>

            {/* Archivos multimedia */}
            {editingChallenge && (
              <div>
                <Label className="mb-2 block">Archivos Multimedia</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Agrega videos, audios, PDFs o documentos para complementar tu reto
                </p>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Archivo
                      </>
                    )}
                  </Button>

                  {challengeFiles.length > 0 ? (
                    <div className="space-y-2 border rounded-lg p-4 bg-muted/5">
                      <p className="text-sm font-medium mb-3">{challengeFiles.length} {challengeFiles.length === 1 ? 'archivo' : 'archivos'}</p>
                      {challengeFiles.map((file) => {
                        const FileIcon = getFileIcon(file.file_type);
                        return (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <FileIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.file_type.toUpperCase()} {file.file_size_mb && `• ${file.file_size_mb} MB`}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0 hover:text-destructive"
                              onClick={() => handleRemoveFile(file.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/5">
                      <File className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No hay archivos agregados</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active" className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <span>Reto Activo</span>
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  editingChallenge ? "Actualizar" : "Crear"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
