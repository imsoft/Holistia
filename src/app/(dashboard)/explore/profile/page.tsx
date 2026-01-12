"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Edit3, Save, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { AccountDeactivation } from "@/components/ui/account-deactivation";
import { UsernameSettings } from "@/components/username-settings";
import { FollowButton } from "@/components/ui/follow-button";
import { FollowStats } from "@/components/ui/follow-stats";
import { Skeleton } from "@/components/ui/skeleton";

const ProfilePage = () => {
  const { profile, loading, updateProfile } = useProfile();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const supabase = createClient();

  const handlePhoneEdit = () => {
    setIsEditingPhone(true);
    setPhoneValue(profile?.phone || "");
  };

  const handlePhoneCancel = () => {
    setIsEditingPhone(false);
    setPhoneValue(profile?.phone || "");
  };

  const handlePhoneSave = async () => {
    if (!profile) return;

    try {
      setPhoneLoading(true);

      // Actualizar el teléfono en profiles
      const result = await updateProfile({ phone: phoneValue });

      if (!result) {
        toast.error('Error al actualizar el teléfono. Inténtalo de nuevo.');
        return;
      }

      setIsEditingPhone(false);
      toast.success('Teléfono actualizado exitosamente.');
    } catch (error) {
      console.error("Error saving phone:", error);
      toast.error('Error al guardar el teléfono. Inténtalo de nuevo.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handlePhotoChange = async () => {
    if (!profile) return;
    
    // Crear input de archivo dinámicamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.success('Por favor selecciona un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.success('El archivo es demasiado grande. El tamaño máximo es 2MB.');
        return;
      }

      try {
        // Generar nombre único para el archivo usando el ID del usuario
        // Usar estructura: avatars/<user-id>/avatar.ext para que [1] sea el user ID
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar.${fileExt}`;
        const filePath = `avatars/${profile.id}/${fileName}`;
        
        console.log('Uploading file with path:', filePath);
        console.log('User ID:', profile.id);
        console.log('File name parts:', filePath.split('/'));

        // Verificar que el usuario esté autenticado
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !currentUser) {
          console.error('User not authenticated:', authError);
          toast.success('Error de autenticación. Por favor, inicia sesión nuevamente.');
          return;
        }
        
        console.log('Current authenticated user ID:', currentUser.id);
        console.log('Profile user ID matches:', currentUser.id === profile.id);
        console.log('Expected folder name [0]:', filePath.split('/')[0]); // Should be 'avatars'
        console.log('Expected folder name [1]:', filePath.split('/')[1]); // Should be user ID
        console.log('Expected folder name [2]:', filePath.split('/')[2]); // Should be 'avatar.ext'

        // Intentar subir directamente sin eliminar primero
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          console.error("Upload error details:", uploadError.message);
          toast.success(`Error al subir la imagen: ${uploadError.message}`);
          return;
        }

        // Obtener URL pública del archivo
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Actualizar el avatar en profiles
        const result = await updateProfile({ avatar_url: publicUrl });

        if (!result) {
          toast.error('Error al actualizar el perfil. Inténtalo de nuevo.');
          return;
        }

        toast.success('Foto de perfil actualizada exitosamente.');
      } catch (error) {
        console.error("Error saving photo:", error);
        toast.success('Error al guardar la foto. Inténtalo de nuevo.');
      }
    };

    // Agregar el input al DOM y hacer click
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };


  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>

          <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
            {/* Profile Photo Section Skeleton */}
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-64 mb-4 sm:mb-6" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-10 w-full sm:w-32" />
                  <Skeleton className="h-4 w-full sm:w-80" />
                </div>
              </div>
            </div>

            {/* Profile Section Skeleton */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-24 mb-1" />
                  <Skeleton className="h-4 w-80 max-w-full" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>

              <div className="mt-4 sm:mt-6 divide-y divide-border border-t border-border space-y-4 sm:space-y-6">
                <div className="py-4 sm:py-6 sm:flex sm:items-center">
                  <Skeleton className="h-4 w-32 mb-2 sm:mb-0 sm:w-64 sm:shrink-0 sm:mr-6" />
                  <Skeleton className="h-4 w-48 sm:flex-auto" />
                </div>
                <div className="py-4 sm:py-6 sm:flex sm:items-center">
                  <Skeleton className="h-4 w-32 mb-2 sm:mb-0 sm:w-64 sm:shrink-0 sm:mr-6" />
                  <Skeleton className="h-4 w-64 sm:flex-auto" />
                </div>
                <div className="py-4 sm:py-6 sm:flex sm:items-center">
                  <Skeleton className="h-4 w-32 mb-2 sm:mb-0 sm:w-64 sm:shrink-0 sm:mr-6" />
                  <div className="flex items-center justify-between flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
                <div className="py-4 sm:py-6 sm:flex sm:items-center">
                  <Skeleton className="h-4 w-32 mb-2 sm:mb-0 sm:w-64 sm:shrink-0 sm:mr-6" />
                  <Skeleton className="h-4 w-24 sm:flex-auto" />
                </div>
              </div>
            </div>

            {/* Username Settings Skeleton */}
            <div>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-64 mb-4 sm:mb-6" />
              <div className="border-t border-border pt-4 sm:pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Skeleton className="h-10 flex-1 sm:max-w-md" />
                  <Skeleton className="h-10 w-full sm:w-32" />
                </div>
              </div>
            </div>

            {/* Additional Information Skeleton */}
            <div>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-72 mb-4 sm:mb-6" />
              <div className="mt-4 sm:mt-6 divide-y divide-border border-t border-border space-y-4 sm:space-y-6">
                <div className="py-4 sm:py-6 sm:flex">
                  <Skeleton className="h-4 w-32 mb-2 sm:mb-0 sm:w-64 sm:shrink-0 sm:mr-6" />
                  <Skeleton className="h-4 w-48 sm:flex-auto" />
                </div>
                <div className="py-4 sm:py-6 sm:flex">
                  <Skeleton className="h-4 w-32 mb-2 sm:mb-0 sm:w-64 sm:shrink-0 sm:mr-6" />
                  <Skeleton className="h-4 w-24 sm:flex-auto" />
                </div>
              </div>
            </div>

            {/* Account Deactivation Skeleton */}
            <div className="mt-12">
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-96 max-w-full mb-4" />
              <Skeleton className="h-10 w-full sm:w-48" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Si no hay perfil, mostrar error
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Error al cargar el perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Mi Perfil</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
          {/* Profile Photo Section */}
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Foto de perfil</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Tu foto de perfil será visible para los expertos en salud mental.
            </p>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="relative">
                <Image
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${profile.first_name} ${profile.last_name}`)}&background=random`}
                  alt="Foto de perfil"
                  width={80}
                  height={80}
                  className="h-20 w-20 aspect-square rounded-full object-cover border-2 border-border"
                />
                <Button 
                  className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                  onClick={handlePhotoChange}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  className="font-semibold bg-ring text-white hover:text-white w-full sm:w-auto"
                  onClick={handlePhotoChange}
                >
                  Cambiar foto
                </Button>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Haz clic para seleccionar una imagen. JPG, GIF o PNG. Máximo 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-foreground">Perfil</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Esta información será visible públicamente, así que ten cuidado con lo que compartes.
                </p>
              </div>
              {/* Estadísticas de seguimiento */}
              {profile.id && (
                <div className="flex items-center gap-3">
                  <FollowStats userId={profile.id} />
                  <FollowButton userId={profile.id} />
                </div>
              )}
            </div>

            <dl className="mt-4 sm:mt-6 divide-y divide-border border-t border-border text-xs sm:text-sm">
              <div className="py-4 sm:py-6 sm:flex sm:items-center">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6 sm:flex sm:items-center">
                  Nombre completo
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground">
                    {profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile.email?.split('@')[0] || 'Usuario'}
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:flex sm:items-center">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6 sm:flex sm:items-center">
                  Correo electrónico
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground">{profile.email}</div>
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:flex sm:items-center">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6 sm:flex sm:items-center">
                  Teléfono
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  {isEditingPhone ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                      <PhoneInput
                        value={phoneValue}
                        onChange={(value) => setPhoneValue(value)}
                        className="w-full sm:max-w-md"
                        defaultCountryCode="+52"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handlePhoneSave}
                          disabled={phoneLoading}
                          className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                        >
                          <Save className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Guardar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handlePhoneCancel}
                          disabled={phoneLoading}
                          className="flex-1 sm:flex-none"
                        >
                          <X className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-foreground">
                        {profile.phone || "No agregado"}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePhoneEdit}
                        className="h-8 px-2 ml-auto"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:flex sm:items-center">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6 sm:flex sm:items-center">
                  Tipo de usuario
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground">Paciente</div>
                </dd>
              </div>
            </dl>
          </div>

          {/* Username Settings */}
          <div>
            <UsernameSettings
              userId={profile.id}
              currentUsername={profile.username}
            />
          </div>

          {/* Información adicional del usuario */}
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Información adicional</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Información adicional sobre tu cuenta y actividad.
            </p>

            <dl className="mt-4 sm:mt-6 divide-y divide-border border-t border-border text-xs sm:text-sm">
              <div className="py-4 sm:py-6 sm:flex">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6">
                  Fecha de registro
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground">
                    {new Date(profile.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:flex">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6">
                  Estado de cuenta
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground capitalize">Activo</div>
                </dd>
              </div>
            </dl>
          </div>

          {/* Desactivar cuenta */}
          <div className="mt-12">
            <AccountDeactivation
              userId={profile.id}
              userEmail={profile.email}
              accountType="patient"
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
