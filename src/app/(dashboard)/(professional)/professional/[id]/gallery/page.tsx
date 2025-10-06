"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ImageGalleryManager from "@/components/ui/image-gallery-manager";
import { Image as ImageIcon } from "lucide-react";
import Link from "next/link";

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  experience: string;
  certifications: string[];
  services: Array<{
    name: string;
    description: string;
    presencialCost: string;
    onlineCost: string;
  }>;
  address: string;
  city: string;
  state: string;
  country: string;
  biography?: string;
  profile_photo?: string;
  gallery: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export default function ProfessionalGalleryPage() {
  const params = useParams();
  const professionalId = params.id as string;
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchProfessional();
  }, [professionalId]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchProfessional = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Debug: professionalId from URL:', professionalId);

      // Primero verificar si el usuario está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Debes estar autenticado para acceder a esta página');
      }

      console.log('Debug: authenticated user ID:', user.id);
      console.log('Debug: professionalId from URL:', professionalId);
      console.log('Debug: IDs match:', user.id === professionalId);

      // Verificar si el usuario está intentando acceder a su propio perfil
      if (user.id !== professionalId) {
        throw new Error('Solo puedes acceder a tu propia galería de imágenes');
      }

      console.log('Debug: Querying professional_applications for user_id:', professionalId);

      // Primero verificar si la tabla existe y qué datos tiene
      const { data: allData, error: allError } = await supabase
        .from('professional_applications')
        .select('id, user_id, first_name, last_name, email')
        .limit(5);

      console.log('Debug: All professional_applications data:', allData);
      console.log('Debug: All professional_applications error:', allError);
      
      // Mostrar los IDs disponibles
      if (allData && allData.length > 0) {
        console.log('Debug: Available IDs in professional_applications:', allData.map(p => p.id));
        console.log('Debug: Available user_ids in professional_applications:', allData.map(p => p.user_id));
      }

      const { data, error } = await supabase
        .from('professional_applications')
        .select('*')
        .eq('user_id', professionalId)
        .maybeSingle();

      console.log('Debug: Query result - data:', data);
      console.log('Debug: Query result - error:', error);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.code === '42501') {
          throw new Error('No tienes permisos para acceder a este perfil');
        } else if (error.code === 'PGRST301') {
          throw new Error('No se encontró el perfil solicitado');
        } else {
          throw new Error(`Error de base de datos: ${error.message || 'Error desconocido'}`);
        }
      }

      if (!data) {
        throw new Error('Profesional no encontrado');
      }

      setProfessional(data);
      
      // Cargar la galería desde la base de datos
      setGalleryImages(data.gallery || []);
    } catch (err) {
      console.error('Error fetching professional:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar la información del profesional';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImagesUpdate = async (newImages: string[]) => {
    if (!professional) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('professional_applications')
        .update({ 
          gallery: newImages,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', professionalId);

      if (error) {
        console.error('Supabase update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.code === '42501') {
          throw new Error('No tienes permisos para actualizar este perfil');
        } else if (error.code === 'PGRST301') {
          throw new Error('No se encontró el perfil para actualizar');
        } else {
          throw new Error(`Error al actualizar: ${error.message || 'Error desconocido'}`);
        }
      }

      setProfessional(prev => prev ? { ...prev, gallery: newImages } : null);
      setGalleryImages(newImages);
      setSuccess('Galería actualizada correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating gallery:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la galería';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Cargando galería...</p>
        </div>
      </div>
    );
  }

  if (error && !professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error de Acceso</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          
          {error.includes('Solo puedes acceder a tu propia galería') && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Solo puedes gestionar la galería de tu propio perfil profesional. 
                Asegúrate de estar logueado con la cuenta correcta.
              </p>
            </div>
          )}
          
          {error.includes('Debes estar autenticado') && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Acción requerida:</strong> Por favor inicia sesión para acceder a esta página.
              </p>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <Link href="/login">
              <Button variant="default">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Ir al Inicio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profesional no encontrado</h1>
          <p className="text-muted-foreground">El profesional que buscas no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Galería de Imágenes
              </h1>
              <p className="text-muted-foreground">
                Gestiona las imágenes de tu espacio de trabajo
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Información del profesional */}
        <Card className="mb-8 p-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Información del Profesional</CardTitle>
            <CardDescription>
              Datos básicos de tu perfil profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="text-lg font-semibold">
                  {professional.first_name} {professional.last_name}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Profesión</p>
                <p className="text-lg font-semibold">{professional.profession}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  professional.status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : professional.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : professional.status === 'under_review'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {professional.status === 'approved' ? 'Aprobado' : 
                   professional.status === 'pending' ? 'Pendiente' : 
                   professional.status === 'under_review' ? 'En revisión' : 'Rechazado'}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                <p className="text-lg font-semibold">
                  {professional.city}, {professional.state}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de galería */}
        <Card className="mb-8 p-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Galería de Imágenes</CardTitle>
            <CardDescription>
              Sube hasta 4 imágenes de tu espacio de trabajo. Cada imagen debe ser menor a 2MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ImageGalleryManager
              professionalId={professional.user_id}
              currentImages={galleryImages}
              onImagesUpdate={handleImagesUpdate}
              maxImages={4}
              maxSizeMB={2}
            />
          </CardContent>
        </Card>

        {/* Consejos */}
        <Card className="mt-8 p-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Consejos para tus imágenes</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground mb-3 text-lg">✅ Imágenes recomendadas:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Espacio de consulta limpio y organizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Sala de espera cómoda</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Equipamiento profesional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Certificados y diplomas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Ambiente acogedor y profesional</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground mb-3 text-lg">❌ Evita:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>Imágenes borrosas o de baja calidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>Espacios desordenados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>Información personal visible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>Imágenes no relacionadas con tu práctica</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>Archivos muy pesados</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}