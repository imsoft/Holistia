"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Edit3, Clock, CheckCircle, XCircle, AlertCircle, Save, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Patient } from "@/types/patient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface ProfessionalApplication {
  id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
  profession: string;
  specializations: string[];
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<Patient | null>(null);
  const [professionalApplication, setProfessionalApplication] = useState<ProfessionalApplication | null>(null);
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

    const getProfessionalApplication = async () => {
      try {
        const { data, error } = await supabase
          .from('professional_applications')
          .select('id, status, submitted_at, reviewed_at, review_notes, profession, specializations')
          .eq('user_id', userId)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error fetching professional application:', error);
          return;
        }

        if (data) {
          setProfessionalApplication(data);
        }
      } catch (error) {
        console.error('Error fetching professional application:', error);
      }
    };

    getUserData();
    getProfessionalApplication();
  }, [userId, supabase]);

  const getApplicationStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pendiente',
          description: 'Tu solicitud está siendo revisada',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'under_review':
        return {
          icon: AlertCircle,
          label: 'En Revisión',
          description: 'Nuestro equipo está evaluando tu solicitud',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          label: 'Aprobada',
          description: '¡Felicitaciones! Tu solicitud ha sido aprobada',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rechazada',
          description: 'Tu solicitud no pudo ser aprobada en esta ocasión',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Clock,
          label: 'Desconocido',
          description: 'Estado no reconocido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        alert('Error al actualizar el teléfono. Inténtalo de nuevo.');
        return;
      }

      // Actualizar el estado local
      setProfile(prev => prev ? {
        ...prev,
        phone: phoneValue,
      } : null);

      setIsEditingPhone(false);
      alert('Teléfono actualizado exitosamente.');
    } catch (error) {
      console.error("Error saving phone:", error);
      alert('Error al guardar el teléfono. Inténtalo de nuevo.');
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
        alert('Por favor selecciona un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo es demasiado grande. El tamaño máximo es 2MB.');
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
          alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
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
          alert(`Error al subir la imagen: ${uploadError.message}`);
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
          alert('Error al actualizar el perfil. Inténtalo de nuevo.');
          return;
        }

        // Actualizar el estado local
        setProfile(prev => prev ? {
          ...prev,
          avatar: publicUrl,
        } : null);

        alert('Foto de perfil actualizada exitosamente.');
      } catch (error) {
        console.error("Error saving photo:", error);
        alert('Error al guardar la foto. Inténtalo de nuevo.');
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
          {/* Profile Photo Section */}
          <div>
            <h2 className="text-base/7 font-semibold text-foreground">Foto de perfil</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Tu foto de perfil será visible para los profesionales de salud mental.
            </p>

            <div className="mt-6 flex items-center gap-6">
              <div className="relative">
                <Image
                  src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`}
                  alt="Foto de perfil"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  style={{ aspectRatio: '1/1' }}
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
                  className="font-semibold bg-ring text-white hover:text-white"
                  onClick={handlePhotoChange}
                >
                  Cambiar foto
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  Haz clic para seleccionar una imagen. JPG, GIF o PNG. Máximo 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div>
            <h2 className="text-base/7 font-semibold text-foreground">Perfil</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Esta información será visible públicamente, así que ten cuidado con lo que compartes.
            </p>

            <dl className="mt-6 divide-y divide-border border-t border-border text-sm/6">
              <div className="py-6 sm:flex sm:items-center">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6 sm:flex sm:items-center">
                  Nombre completo
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground">{profile.name}</div>
                </dd>
              </div>
              <div className="py-6 sm:flex sm:items-center">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6 sm:flex sm:items-center">
                  Correo electrónico
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground">{profile.email}</div>
                </dd>
              </div>
              <div className="py-6 sm:flex sm:items-center">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6 sm:flex sm:items-center">
                  Teléfono
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  {isEditingPhone ? (
                    <div className="flex items-center justify-between w-full">
                      <Input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        className="max-w-md"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handlePhoneSave}
                          disabled={phoneLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handlePhoneCancel}
                          disabled={phoneLoading}
                        >
                          <X className="h-4 w-4" />
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
              <div className="py-6 sm:flex sm:items-center">
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
            <h2 className="text-base/7 font-semibold text-foreground">Información adicional</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Información adicional sobre tu cuenta y actividad.
            </p>

            <dl className="mt-6 divide-y divide-border border-t border-border text-sm/6">
              <div className="py-6 sm:flex">
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
              <div className="py-6 sm:flex">
                <dt className="font-medium text-foreground sm:w-64 sm:flex-none sm:pr-6">
                  Estado de cuenta
                </dt>
                <dd className="mt-1 sm:mt-0 sm:flex-auto">
                  <div className="text-foreground capitalize">{profile.status}</div>
                </dd>
              </div>
            </dl>
          </div>

          {/* Professional Application Status Section */}
          {professionalApplication && (
            <div>
              <h2 className="text-base/7 font-semibold text-foreground">Solicitud de Profesional</h2>
              <p className="mt-1 text-sm/6 text-muted-foreground">
                Estado de tu solicitud para convertirte en profesional de salud mental.
              </p>

              <div className="mt-6">
                <Card className={`border-2 ${getApplicationStatusInfo(professionalApplication.status).borderColor} ${getApplicationStatusInfo(professionalApplication.status).bgColor}`}>
                  <CardHeader className="pb-6 px-8 pt-8">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${getApplicationStatusInfo(professionalApplication.status).bgColor} ${getApplicationStatusInfo(professionalApplication.status).borderColor} border`}>
                        {(() => {
                          const IconComponent = getApplicationStatusInfo(professionalApplication.status).icon;
                          return <IconComponent className={`h-6 w-6 ${getApplicationStatusInfo(professionalApplication.status).color}`} />;
                        })()}
                      </div>
                      <div>
                        <CardTitle className={`text-xl ${getApplicationStatusInfo(professionalApplication.status).color} mb-2`}>
                          {getApplicationStatusInfo(professionalApplication.status).label}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {getApplicationStatusInfo(professionalApplication.status).description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-8 pb-8">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Profesión solicitada</p>
                          <p className="text-base text-muted-foreground">{professionalApplication.profession}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Fecha de envío</p>
                          <p className="text-base text-muted-foreground">{formatDate(professionalApplication.submitted_at)}</p>
                        </div>
                      </div>
                      
                      {professionalApplication.specializations.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-foreground">Especializaciones</p>
                          <div className="flex flex-wrap gap-3">
                            {professionalApplication.specializations.map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {professionalApplication.review_notes && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-foreground">Notas de revisión</p>
                          <p className="text-base text-muted-foreground bg-muted/50 p-4 rounded-lg">
                            {professionalApplication.review_notes}
                          </p>
                        </div>
                      )}

                      {professionalApplication.reviewed_at && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Fecha de revisión</p>
                          <p className="text-base text-muted-foreground">{formatDate(professionalApplication.reviewed_at)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* No Application Message */}
          {!professionalApplication && (
            <div>
              <h2 className="text-base/7 font-semibold text-foreground">Solicitud de Profesional</h2>
              <p className="mt-1 text-sm/6 text-muted-foreground">
                Aún no has enviado una solicitud para convertirte en profesional.
              </p>

              <div className="mt-6">
                <Card className="border-dashed border-2 border-border">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Edit3 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">¿Quieres ser profesional?</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                      Únete a nuestra plataforma como profesional de salud mental y ayuda a más personas a mejorar su bienestar.
                    </p>
                    <Link
                      href={`/patient/${userId}/explore/become-professional`}
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Enviar solicitud
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
