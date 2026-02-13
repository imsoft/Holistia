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
    // Usar el professionalId directamente (la ruta del dashboard del paciente usa el ID del profesional)
    // Nota: El enlace compartido requerirá que el usuario inicie sesión para ver el perfil
    const shareUrl = `${window.location.origin}/login?redirect=/explore/professional/${professionalId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  const handleProfileUpdate = () => {
    // Los datos se han guardado en la BD - la próxima visita mostrará la actualización
    toast.success("Perfil actualizado correctamente");
  };

  return (
    <div className="professional-page-shell">
      {/* Header */}
      <div className="professional-page-header">
        <div className="professional-page-header-inner professional-page-header-inner-row">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mi Perfil</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Administra tu información profesional
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="w-full sm:w-auto">
            <Share2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Compartir</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="professional-page-content w-full">
        <div className="space-y-6 sm:space-y-8">
          {/* Foto de Perfil */}
          <div>
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

          {/* Información Profesional */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Información Profesional</h2>
            </div>
            <ProfessionalProfileEditor
              professionalId={userId}
              onProfileUpdate={handleProfileUpdate}
            />
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
