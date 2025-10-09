"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Save, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Patient } from "@/types/patient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ProfilePage = () => {
  const [profile, setProfile] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const params = useParams();
  const supabase = createClient();
  
  // Obtener ID del usuario de los parámetros
  const userId = params.id as string;


  // Obtener datos del usuario desde Supabase
  useEffect(() => {
    const getUserData = async () => {
      try {
        setLoading(true);
        
        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          return;
        }

        if (!session?.user) {
          console.error("No user session found");
          return;
        }

        // Obtener datos del usuario desde auth.users
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error getting user:", userError);
          return;
        }

        if (userData.user) {
          const userMetadata = userData.user.user_metadata || {};
          
          // Formatear datos del usuario según la interface Patient
          const formattedUser: Patient = {
            id: userData.user.id,
            name: userMetadata.first_name && userMetadata.last_name 
              ? `${userMetadata.first_name} ${userMetadata.last_name}`
              : userData.user.email?.split('@')[0] || 'Usuario',
            email: userData.user.email || '',
            phone: userMetadata.phone || '',
            location: userMetadata.location || '',
            status: "active",
            type: "patient",
            joinDate: userData.user.created_at || new Date().toISOString(),
            lastLogin: userData.user.last_sign_in_at || new Date().toISOString(),
            appointments: 0,
            avatar: userMetadata.avatar_url || userData.user.user_metadata?.avatar_url || '',
            age: userMetadata.age,
            gender: userMetadata.gender,
            therapyType: userMetadata.therapyType,
            totalSessions: 0,
            nextSession: null,
            lastSession: undefined,
            notes: userMetadata.notes,
          };

          setProfile(formattedUser);
          setPhoneValue(formattedUser.phone || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, [userId, supabase]);

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

      // Actualizar el teléfono en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          phone: phoneValue
        }
      });

      if (updateError) {
        console.error("Error updating phone:", updateError);
        toast.success('Error al actualizar el teléfono. Inténtalo de nuevo.');
        return;
      }

      // Actualizar el estado local
      setProfile(prev => prev ? {
        ...prev,
        phone: phoneValue,
      } : null);

      setIsEditingPhone(false);
      toast.success('Teléfono actualizado exitosamente.');
    } catch (error) {
      console.error("Error saving phone:", error);
      toast.success('Error al guardar el teléfono. Inténtalo de nuevo.');
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

        // Actualizar el avatar del usuario en Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            avatar_url: publicUrl
          }
        });

        if (updateError) {
          console.error("Error updating user avatar:", updateError);
          toast.success('Error al actualizar el perfil. Inténtalo de nuevo.');
          return;
        }

        // Actualizar el estado local
        setProfile(prev => prev ? {
          ...prev,
          avatar: publicUrl,
        } : null);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando perfil...</p>
        </div>
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
              Tu foto de perfil será visible para los profesionales de salud mental.
            </p>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="relative">
                <Image
                  src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`}
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
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Perfil</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Esta información será visible públicamente, así que ten cuidado con lo que compartes.
            </p>

            <dl className="mt-4 sm:mt-6 divide-y divide-border border-t border-border text-xs sm:text-sm">
              <div className="py-4 sm:py-6 sm:flex sm:items-center">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6 sm:flex sm:items-center">
                  Nombre completo
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground">{profile.name}</div>
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
                      <Input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        className="w-full sm:max-w-md"
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
                    {new Date(profile.joinDate).toLocaleDateString('es-ES', {
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
                  <div className="text-foreground capitalize">{profile.status}</div>
                </dd>
              </div>
            </dl>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
