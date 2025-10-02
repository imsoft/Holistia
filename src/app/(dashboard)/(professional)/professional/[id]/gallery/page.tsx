"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ImageGalleryManager from "@/components/ui/image-gallery-manager";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
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

      const { data, error } = await supabase
        .from('professional_applications')
        .select('*')
        .eq('id', professionalId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Profesional no encontrado');
      }

      setProfessional(data);
    } catch (err) {
      console.error('Error fetching professional:', err);
      setError('Error al cargar la información del profesional');
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
        .eq('id', professionalId);

      if (error) {
        throw error;
      }

      setProfessional(prev => prev ? { ...prev, gallery: newImages } : null);
      setSuccess('Galería actualizada correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating gallery:', err);
      setError('Error al actualizar la galería');
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href={`/professional/${professionalId}/dashboard`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
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
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/professional/${professionalId}/dashboard`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
          
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Información del Profesional</CardTitle>
            <CardDescription>
              Datos básicos de tu perfil profesional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="text-lg font-semibold">
                  {professional.first_name} {professional.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profesión</p>
                <p className="text-lg font-semibold">{professional.profession}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  professional.status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : professional.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {professional.status === 'approved' ? 'Aprobado' : 
                   professional.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                <p className="text-lg font-semibold">
                  {professional.city}, {professional.state}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de galería */}
        <Card>
          <CardHeader>
            <CardTitle>Galería de Imágenes</CardTitle>
            <CardDescription>
              Sube hasta 5 imágenes de tu espacio de trabajo. Cada imagen debe ser menor a 2MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageGalleryManager
              professionalId={professional.user_id}
              currentImages={professional.gallery || []}
              onImagesUpdate={handleImagesUpdate}
              maxImages={5}
              maxSizeMB={2}
            />
          </CardContent>
        </Card>

        {/* Consejos */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Consejos para tus imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">✅ Imágenes recomendadas:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Espacio de consulta limpio y organizado</li>
                  <li>• Sala de espera cómoda</li>
                  <li>• Equipamiento profesional</li>
                  <li>• Certificados y diplomas</li>
                  <li>• Ambiente acogedor y profesional</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">❌ Evita:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Imágenes borrosas o de baja calidad</li>
                  <li>• Espacios desordenados</li>
                  <li>• Información personal visible</li>
                  <li>• Imágenes no relacionadas con tu práctica</li>
                  <li>• Archivos muy pesados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
