"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ProfilePhotoUploader from "@/components/ui/profile-photo-uploader";
import ProfessionalProfileEditor from "@/components/ui/professional-profile-editor";
import { User, Camera } from "lucide-react";

export default function ProfessionalProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [professionalName, setProfessionalName] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string>("");

  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        const { data: professionalApp, error } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, profile_photo')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();

        if (error) {
          console.error('Error obteniendo profesional:', error);
          return;
        }

        if (professionalApp) {
          setProfessionalName(`${professionalApp.first_name} ${professionalApp.last_name}`);
          setProfilePhoto(professionalApp.profile_photo || '');
        }
      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [userId, supabase]);

  const handleProfileUpdate = () => {
    // Recargar datos después de actualizar
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mi Perfil</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Administra tu información profesional
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 max-w-6xl">
        <div className="space-y-6 sm:space-y-8">
          {/* Sección de Foto de Perfil y Edición */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Foto de Perfil */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Foto de Perfil</h2>
              </div>
              <ProfilePhotoUploader
                professionalId={userId}
                currentPhoto={profilePhoto}
                professionalName={professionalName}
                onPhotoUpdate={(newPhotoUrl) => setProfilePhoto(newPhotoUrl)}
              />
            </div>

            {/* Editor de Perfil */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Información Profesional</h2>
              </div>
              <ProfessionalProfileEditor
                professionalId={userId}
                onProfileUpdate={handleProfileUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

