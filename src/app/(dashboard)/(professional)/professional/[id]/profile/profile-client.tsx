"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ProfilePhotoUploader from "@/components/ui/profile-photo-uploader";
import ProfessionalProfileEditor from "@/components/ui/professional-profile-editor";
import { UsernameSettings } from "@/components/username-settings";
import { AdminRatingDisplay } from "@/components/ui/admin-rating-display";
import { Button } from "@/components/ui/button";
import { User, Camera, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ProfessionalProfileClientProps {
  userId: string;
  professionalId: string;
  professionalName: string;
  firstName: string;
  lastName: string;
  profilePhoto: string;
  currentUsername?: string | null;
}

export function ProfessionalProfileClient({
  userId,
  professionalId,
  professionalName,
  firstName,
  lastName,
  profilePhoto: initialProfilePhoto,
  currentUsername,
}: ProfessionalProfileClientProps) {
  const [profilePhoto, setProfilePhoto] = useState(initialProfilePhoto);

  const handleShare = async () => {
    // Crear slug: nombre-apellido-id
    const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${userId}`;
    const publicUrl = `${window.location.origin}/public/professional/${slug}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  const handleProfileUpdate = () => {
    // Recargar datos después de actualizar
    window.location.reload();
  };

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
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Compartir</span>
          </Button>
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

          {/* Sección de Nombre de Usuario */}
          <div>
            <UsernameSettings
              userId={userId}
              currentUsername={currentUsername}
            />
          </div>

          {/* Calificación del Administrador */}
          <div>
            <AdminRatingDisplay professionalId={professionalId} />
          </div>
        </div>
      </div>
    </div>
  );
}
