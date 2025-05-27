'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserIcon,
  Settings,
  Calendar,
  Heart,
  LogOut,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Shield,
  Lock,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  createUserProfile,
} from '@/services/profile-service';
import type {
  Profile,
  User,
  UserPreference,
  Appointment,
  AppointmentService,
  AppointmentProfessional,
  AppointmentWellnessCenter,
  SupabaseFavoriteProfessionalResponse,
  SupabaseFavoriteCenterResponse,
} from '@/types/database.types';
import { supabase } from '@/lib/supabaseClient';

type FavoritesState = {
  professionals: Array<{
    id: string;
    name: string;
    specialty: string;
    image_url: string | null;
    location: string | null;
    rating: number | null;
  }>;
  centers: Array<{
    id: string;
    name: string;
    type: string;
    logo_url: string | null;
    location: string | null;
    rating: number | null;
  }>;
};

interface UserProfilePageProps {
  user: User | null;
  appointments: Partial<Appointment>[];
  favoriteProfessionals: SupabaseFavoriteProfessionalResponse[] | null;
  favoriteCenters: SupabaseFavoriteCenterResponse[] | null;
  preferences: Partial<UserPreference> | null;
}

// Función segura para formatear fechas en el componente
const safeFormatDate = (
  dateString: string | undefined,
  formatStr: string
): string => {
  if (!dateString) return 'Fecha no disponible';
  try {
    // Asegurarse de que dateString es una cadena válida
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return format(date, formatStr, { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
};

export const UserProfilePage = ({
  user: initialUser = null,
  appointments: initialAppointments = [],
  favoriteProfessionals: initialFavoriteProfessionals = [],
  favoriteCenters: initialFavoriteCenters = [],
  preferences: initialPreferences = null,
}: UserProfilePageProps) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userPreferences, setPreferences] = useState<UserPreference | null>(
    initialPreferences as UserPreference | null
  );
  const [userForm, setUserForm] = useState<Partial<Profile>>({});
  const [appointments, setAppointments] =
    useState<Partial<Appointment>[]>(initialAppointments);
  const [favorites, setFavorites] = useState<FavoritesState>({
    professionals: [],
    centers: [],
  });
  const [activeTab, setActiveTab] = useState('profile');
  console.log('activeTab', activeTab);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          router.push('/signin');
          return;
        }

        setUser(currentUser);

        // Fetch profile data
        const userProfile = await getUserProfile(currentUser.id);
        setProfile({
          id: null,
          user_id: currentUser.id,
          full_name: userProfile.user?.user_metadata.full_name || '',
          avatar_url: userProfile.user?.user_metadata.avatar_url || '',
          phone: '',
          location: '',
          bio: '',
          cover_image: '',
          created_at: userProfile.user?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Fetch user preferences
        const userPrefs = await getUserPreferences(currentUser.id);
        setPreferences(userPrefs);

        // Fetch appointments
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(
            `
            id, date, time, status,
            services:service_id(name),
            professionals:professional_id(id, name, specialty, image_url),
            wellness_centers:center_id(id, name, type, logo_url)
          `
          )
          .eq('user_id', currentUser.id)
          .order('date', { ascending: true });

        if (appointmentsData) {
          setAppointments(
            appointmentsData.map((item) => ({
              id: item.id,
              date: item.date,
              time: item.time,
              status: item.status as 'upcoming' | 'completed' | 'cancelled',
              services: (item.services?.[0] || null) as AppointmentService,
              professionals: (item.professionals?.[0] ||
                null) as AppointmentProfessional,
              wellness_centers: (item.wellness_centers?.[0] ||
                null) as AppointmentWellnessCenter,
            }))
          );
        }

        const { data: favProfessionals } = await supabase
          .from('favorite_professionals')
          .select(
            `
    professional_id,
    professionals:professional_id(id, name, specialty, image_url, location, rating)
  `
          )
          .eq('user_id', currentUser.id);

        const { data: favCenters } = await supabase
          .from('favorite_centers')
          .select(
            `
    center_id,
    wellness_centers:center_id(id, name, type, logo_url, location, rating)
  `
          )
          .eq('user_id', currentUser.id);

        setFavorites({
          professionals:
            favProfessionals?.map(
              (fp) =>
                fp.professionals?.[0] || {
                  id: '',
                  name: '',
                  specialty: '',
                  image_url: null,
                  location: null,
                  rating: null,
                }
            ) || [],
          centers:
            favCenters?.map(
              (fc) =>
                fc.wellness_centers?.[0] || {
                  id: '',
                  name: '',
                  type: '',
                  logo_url: null,
                  location: null,
                  rating: null,
                }
            ) || [],
        });

        // Initialize form with profile data
        if (userProfile) {
          setProfile({
            id: null,
            user_id: currentUser.id,
            full_name: userProfile.user?.user_metadata?.full_name || '',
            avatar_url: userProfile.user?.user_metadata?.avatar_url || '',
            phone: '', // 👈 (Aquí pones campos vacíos si no hay)
            location: '',
            bio: '',
            cover_image: '',
            created_at:
              userProfile.user?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('No se pudo cargar la información del perfil');
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialUser) {
      fetchUserData();
    } else {
      // Initialize with props
      setUser(initialUser);
      setAppointments(initialAppointments);
      setPreferences(initialPreferences as UserPreference | null);

      // Transform favorites from props
      if (initialFavoriteProfessionals && initialFavoriteCenters) {
        setFavorites({
          professionals: initialFavoriteProfessionals.flatMap(
            (fp) => fp.data?.map((d) => d.professionals) || []
          ),

          centers: initialFavoriteCenters.flatMap(
            (fc) => fc.data?.map((d) => d.wellness_centers) || []
          ),
        });
      }

      setIsLoading(false);
    }
  }, [
    router,
    initialUser,
    initialAppointments,
    initialFavoriteProfessionals,
    initialFavoriteCenters,
    initialPreferences,
  ]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!user) return;

      setIsLoading(true);

      // Check if profile exists
      if (profile) {
        const result = await updateUserProfile(user.id, {
          ...userForm,
          updated_at: new Date().toISOString(),
        });
        if (result.success) {
          // Manualmente actualizamos el profile
          setProfile((prev) => ({
            ...prev!,
            ...userForm,
            updated_at: new Date().toISOString(),
          }));
        } else {
          toast.error(result.error || 'No se pudo actualizar el perfil');
          return;
        }
      } else {
        const result = await createUserProfile({
          id: null,
          user_id: user.id,
          full_name: userForm.full_name ?? null,
          avatar_url: userForm.avatar_url ?? null,
          phone: userForm.phone ?? null,
          location: userForm.location ?? null,
          bio: userForm.bio ?? null,
          cover_image: userForm.cover_image ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (result.success) {
          setProfile({
            id: null,
            user_id: user.id,
            ...userForm,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            avatar_url: '', // o el que corresponda
            phone: userForm.phone || '',
            location: userForm.location || '',
            bio: userForm.bio || '',
            cover_image: '',
            full_name: userForm.full_name || '',
          });
        } else {
          toast.error(result.message || 'No se pudo crear el perfil');
          return;
        }
      }

      toast.success('Tu información ha sido guardada correctamente', {
        description: 'Perfil actualizado',
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('No se pudo guardar la información del perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current profile data
    if (profile) {
      setUserForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = async (type: string, value: boolean) => {
    try {
      if (!user || !userPreferences) return;

      const updatedPreferences: Partial<UserPreference> = {
        ...userPreferences,
        [`notification_${type}` as keyof UserPreference]: value,
      };

      const result = await updateUserPreferences(user.id, updatedPreferences);
      if (result) {
        setPreferences(result);
      }

      toast.success(
        `Notificaciones por ${type} ${value ? 'activadas' : 'desactivadas'}`,
        {
          description: 'Preferencias actualizadas',
        }
      );
    } catch (error) {
      console.error(`Error updating ${type} notification:`, error);
      toast.error('No se pudo actualizar las preferencias');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('No se pudo cerrar la sesión');
    }
  };

  if (isLoading && !user) {
    return (
      <div className='min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <Loader2 className='h-8 w-8 animate-spin text-[#AC89FF] mb-4' />
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#0D0D0D] text-white'>
      {/* Estilos para el gradiente animado */}
      <style
        jsx
        global
      >{`
        .animated-gradient-text {
          background: linear-gradient(
            to right,
            #ffffff,
            #ac89ff,
            #83c7fd,
            #aff344,
            #ffe5be,
            #ac89ff,
            #83c7fd,
            #ffffff
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: flow 10s linear infinite;
        }

        @keyframes flow {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .card-hover {
          transition: all 0.3s ease;
        }

        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(172, 137, 255, 0.1),
            0 10px 10px -5px rgba(131, 199, 253, 0.1);
        }
      `}</style>

      {/* Gradient blobs */}
      {/*  <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[120px] -z-10"></div>
 */}

      <main className='container mx-auto px-4 py-8'>
        {/* Portada y perfil */}
        <section className='relative mb-8'>
          <div className='h-48 md:h-64 w-full relative rounded-xl overflow-hidden'>
            <Image
              src={
                profile?.cover_image ||
                '/placeholder.svg?height=400&width=1200&query=abstract gradient background'
              }
              alt='Portada'
              fill
              className='object-cover opacity-70'
              priority
            />
            <div className='absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0D0D]/80'></div>
          </div>

          <div className='flex flex-col md:flex-row md:items-end -mt-16 md:-mt-20 relative z-10 px-4'>
            <div className='flex-shrink-0 mb-4 md:mb-0 md:mr-6'>
              <div className='relative'>
                <Avatar className='h-32 w-32 border-4 border-[#0D0D0D] shadow-xl'>
                  <AvatarImage
                    src={profile?.avatar_url || ''}
                    alt={profile?.full_name || user?.email || ''}
                  />
                  <AvatarFallback className='bg-[#AC89FF]/20 text-[#AC89FF] text-4xl'>
                    {profile?.full_name
                      ? profile.full_name.charAt(0).toUpperCase()
                      : user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button className='absolute bottom-1 right-1 bg-[#AC89FF] rounded-full p-1.5 border-2 border-[#0D0D0D]'>
                  <Camera className='h-4 w-4 text-white' />
                </button>
              </div>
            </div>

            <div className='flex-grow'>
              <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
                <div>
                  <h1 className='text-2xl md:text-3xl font-bold'>
                    {profile?.full_name || user?.email || 'Usuario'}
                  </h1>
                  <p className='text-white/70 text-sm mb-2'>
                    Miembro desde{' '}
                    {profile?.created_at
                      ? safeFormatDate(profile.created_at, 'MMMM yyyy')
                      : safeFormatDate(new Date().toISOString(), 'MMMM yyyy')}
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {userPreferences?.categories?.map((category, index) => (
                      <Badge
                        key={index}
                        className='bg-white/10 hover:bg-white/20 text-white border-none'
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {!isEditing && (
                  <Button
                    onClick={handleEditProfile}
                    className='mt-4 md:mt-0 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group'
                  >
                    <span className='relative z-10 flex items-center'>
                      <Edit className='h-4 w-4 mr-2' />
                      Editar perfil
                    </span>
                    <span className='absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out'></span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Contenido principal */}
        <section className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Columna izquierda - Información del usuario */}
          <div className='lg:col-span-2'>
            <Tabs
              defaultValue='profile'
              className='w-full'
              onValueChange={setActiveTab}
            >
              <TabsList className='bg-white/5 border border-white/10 p-1 rounded-lg mb-6 w-full grid grid-cols-4'>
                <TabsTrigger
                  value='profile'
                  className='rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white'
                >
                  <UserIcon className='h-4 w-4 mr-2' />
                  Perfil
                </TabsTrigger>
                <TabsTrigger
                  value='appointments'
                  className='rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white'
                >
                  <Calendar className='h-4 w-4 mr-2' />
                  Citas
                </TabsTrigger>
                <TabsTrigger
                  value='favorites'
                  className='rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white'
                >
                  <Heart className='h-4 w-4 mr-2' />
                  Favoritos
                </TabsTrigger>
                <TabsTrigger
                  value='settings'
                  className='rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white'
                >
                  <Settings className='h-4 w-4 mr-2' />
                  Configuración
                </TabsTrigger>
              </TabsList>

              {/* Tab: Perfil */}
              <TabsContent
                value='profile'
                className='space-y-6'
              >
                <Card className='bg-white/5 border-white/10 text-white'>
                  <CardHeader>
                    <CardTitle className='flex items-center justify-between'>
                      <span>Información personal</span>
                      {isEditing && (
                        <div className='flex space-x-2'>
                          <Button
                            size='sm'
                            onClick={handleSaveProfile}
                            className='bg-[#AFF344] hover:bg-[#AFF344]/90 text-[#0D0D0D]'
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                            ) : (
                              <Save className='h-4 w-4 mr-2' />
                            )}
                            Guardar
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={handleCancelEdit}
                          >
                            <X className='h-4 w-4 mr-2' />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='full_name'>Nombre completo</Label>
                            <Input
                              id='full_name'
                              name='full_name'
                              value={userForm.full_name || ''}
                              onChange={handleInputChange}
                              className='bg-white/10 border-white/20 focus:border-[#AC89FF] text-white'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='email'>Correo electrónico</Label>
                            <Input
                              id='email'
                              name='email'
                              type='email'
                              value={user?.email || ''}
                              disabled
                              className='bg-white/10 border-white/20 focus:border-[#AC89FF] text-white/70'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='phone'>Teléfono</Label>
                            <Input
                              id='phone'
                              name='phone'
                              value={userForm.phone || ''}
                              onChange={handleInputChange}
                              className='bg-white/10 border-white/20 focus:border-[#AC89FF] text-white'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='location'>Ubicación</Label>
                            <Input
                              id='location'
                              name='location'
                              value={userForm.location || ''}
                              onChange={handleInputChange}
                              className='bg-white/10 border-white/20 focus:border-[#AC89FF] text-white'
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='bio'>Biografía</Label>
                          <Textarea
                            id='bio'
                            name='bio'
                            value={userForm.bio || ''}
                            onChange={handleInputChange}
                            rows={4}
                            className='bg-white/10 border-white/20 focus:border-[#AC89FF] text-white resize-none'
                          />
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-3'>
                            <div className='flex items-center text-white/70'>
                              <Mail className='h-4 w-4 mr-2 text-[#AC89FF]' />
                              <span className='text-sm'>
                                Correo electrónico
                              </span>
                            </div>
                            <p>{user?.email || 'No especificado'}</p>
                          </div>
                          <div className='space-y-3'>
                            <div className='flex items-center text-white/70'>
                              <Phone className='h-4 w-4 mr-2 text-[#AC89FF]' />
                              <span className='text-sm'>Teléfono</span>
                            </div>
                            <p>{profile?.phone || 'No especificado'}</p>
                          </div>
                          <div className='space-y-3'>
                            <div className='flex items-center text-white/70'>
                              <MapPin className='h-4 w-4 mr-2 text-[#AC89FF]' />
                              <span className='text-sm'>Ubicación</span>
                            </div>
                            <p>{profile?.location || 'No especificada'}</p>
                          </div>
                        </div>

                        <Separator className='my-6 bg-white/10' />

                        <div>
                          <h3 className='text-lg font-medium mb-3'>Sobre mí</h3>
                          <p className='text-white/80 leading-relaxed'>
                            {profile?.bio ||
                              'No hay información biográfica disponible.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className='bg-white/5 border-white/10 text-white'>
                  <CardHeader>
                    <CardTitle>Intereses y preferencias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <h3 className='text-lg font-medium'>
                        Categorías de interés
                      </h3>
                      <div className='flex flex-wrap gap-2'>
                        {userPreferences?.categories &&
                        userPreferences.categories.length > 0 ? (
                          userPreferences.categories.map((category, index) => (
                            <Badge
                              key={index}
                              className='bg-gradient-to-r from-[#AC89FF]/20 to-[#83C7FD]/20 text-white border-none px-3 py-1.5'
                            >
                              {category}
                            </Badge>
                          ))
                        ) : (
                          <p className='text-white/70'>
                            No has seleccionado categorías de interés.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Citas */}
              <TabsContent
                value='appointments'
                className='space-y-6'
              >
                <Card className='bg-white/5 border-white/10 text-white'>
                  <CardHeader>
                    <CardTitle>Próximas citas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {appointments
                        .filter(
                          (appointment) => appointment.status === 'upcoming'
                        )
                        .map((appointment) => (
                          <div
                            key={appointment.id}
                            className='bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#AC89FF]/50 transition-colors'
                          >
                            <div className='flex items-center justify-between mb-3'>
                              <div className='flex items-center'>
                                <Avatar className='h-12 w-12 mr-3 border border-white/10'>
                                  <AvatarImage
                                    src={
                                      appointment.professionals?.image_url ||
                                      appointment.wellness_centers?.logo_url ||
                                      '/placeholder.svg?height=100&width=100&query=profile' ||
                                      '/placeholder.svg'
                                    }
                                    alt={
                                      appointment.professionals?.name ||
                                      appointment.wellness_centers?.name ||
                                      'Proveedor'
                                    }
                                  />
                                  <AvatarFallback className='bg-[#AC89FF]/20 text-[#AC89FF]'>
                                    {(
                                      appointment.professionals?.name ||
                                      appointment.wellness_centers?.name ||
                                      'P'
                                    ).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className='font-medium'>
                                    {appointment.professionals?.name ||
                                      appointment.wellness_centers?.name ||
                                      'Proveedor desconocido'}
                                  </h4>
                                  <p className='text-sm text-white/70'>
                                    {appointment.professionals?.specialty ||
                                      appointment.wellness_centers?.type ||
                                      appointment.services?.name ||
                                      'Servicio'}
                                  </p>
                                </div>
                              </div>
                              <Badge className='bg-[#AFF344]/20 text-[#AFF344] border-none'>
                                Próxima
                              </Badge>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-3'>
                              <div className='flex items-center'>
                                <Calendar className='h-4 w-4 mr-2 text-[#83C7FD]' />
                                <span>
                                  {safeFormatDate(
                                    appointment.date,
                                    "d 'de' MMMM, yyyy"
                                  )}
                                </span>
                              </div>
                              <div className='flex items-center'>
                                <Clock className='h-4 w-4 mr-2 text-[#83C7FD]' />
                                <span>{appointment.time}</span>
                              </div>
                            </div>

                            <div className='bg-white/5 rounded p-3'>
                              <p className='text-sm text-white/80'>
                                {appointment.services?.name ||
                                  'Servicio no especificado'}
                              </p>
                            </div>

                            <div className='flex justify-end mt-3'>
                              <Button
                                variant='outline'
                                size='sm'
                                className='border-white/20 bg-white/5 hover:bg-white/10'
                              >
                                Reprogramar
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                className='ml-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300'
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ))}

                      {appointments.filter(
                        (appointment) => appointment.status === 'upcoming'
                      ).length === 0 && (
                        <div className='text-center py-8'>
                          <Calendar className='h-12 w-12 mx-auto text-white/30 mb-3' />
                          <h3 className='text-lg font-medium mb-1'>
                            No tienes citas próximas
                          </h3>
                          <p className='text-white/60 max-w-md mx-auto mb-4'>
                            Explora profesionales y centros de bienestar para
                            agendar tu próxima cita.
                          </p>
                          <Button className='bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white'>
                            Explorar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className='bg-white/5 border-white/10 text-white'>
                  <CardHeader>
                    <CardTitle>Historial de citas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {appointments
                        .filter(
                          (appointment) => appointment.status === 'completed'
                        )
                        .map((appointment) => (
                          <div
                            key={appointment.id}
                            className='bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors'
                          >
                            <div className='flex items-center justify-between mb-3'>
                              <div className='flex items-center'>
                                <Avatar className='h-10 w-10 mr-3 border border-white/10'>
                                  <AvatarImage
                                    src={
                                      appointment.professionals?.image_url ||
                                      appointment.wellness_centers?.logo_url ||
                                      '/placeholder.svg?height=100&width=100&query=profile' ||
                                      '/placeholder.svg'
                                    }
                                    alt={
                                      appointment.professionals?.name ||
                                      appointment.wellness_centers?.name ||
                                      'Proveedor'
                                    }
                                  />
                                  <AvatarFallback className='bg-[#AC89FF]/20 text-[#AC89FF]'>
                                    {(
                                      appointment.professionals?.name ||
                                      appointment.wellness_centers?.name ||
                                      'P'
                                    ).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className='font-medium'>
                                    {appointment.professionals?.name ||
                                      appointment.wellness_centers?.name ||
                                      'Proveedor desconocido'}
                                  </h4>
                                  <p className='text-sm text-white/70'>
                                    {appointment.professionals?.specialty ||
                                      appointment.wellness_centers?.type ||
                                      'Servicio'}
                                  </p>
                                </div>
                              </div>
                              <Badge className='bg-white/10 text-white/70 border-none'>
                                Completada
                              </Badge>
                            </div>

                            <div className='flex flex-wrap gap-4 text-sm text-white/70 mb-2'>
                              <div className='flex items-center'>
                                <Calendar className='h-3.5 w-3.5 mr-1' />
                                <span>
                                  {safeFormatDate(
                                    appointment.date,
                                    "d 'de' MMMM, yyyy"
                                  )}
                                </span>
                              </div>
                              <div className='flex items-center'>
                                <Clock className='h-3.5 w-3.5 mr-1' />
                                <span>{appointment.time}</span>
                              </div>
                            </div>

                            <p className='text-sm text-white/80'>
                              {appointment.services?.name ||
                                'Servicio no especificado'}
                            </p>

                            <div className='flex justify-end mt-3'>
                              <Button
                                variant='outline'
                                size='sm'
                                className='border-white/20 bg-white/5 hover:bg-white/10'
                              >
                                Dejar reseña
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                className='ml-2 border-white/20 bg-white/5 hover:bg-white/10'
                              >
                                Agendar similar
                              </Button>
                            </div>
                          </div>
                        ))}

                      {appointments.filter(
                        (appointment) => appointment.status === 'completed'
                      ).length === 0 && (
                        <div className='text-center py-6'>
                          <p className='text-white/60'>
                            No tienes citas completadas en tu historial.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Favoritos */}
              <TabsContent
                value='favorites'
                className='space-y-6'
              >
                <Card className='bg-white/5 border-white/10 text-white'>
                  <CardHeader>
                    <CardTitle>Profesionales favoritos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {favorites.professionals.map((professional) => (
                        <div
                          key={professional.id}
                          className='bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#AC89FF]/50 transition-colors card-hover'
                        >
                          <div className='flex items-center mb-3'>
                            <Avatar className='h-12 w-12 mr-3 border border-white/10'>
                              <AvatarImage
                                src={
                                  professional.image_url ||
                                  '/placeholder.svg?height=100&width=100&query=professional'
                                }
                                alt={professional.name}
                              />
                              <AvatarFallback className='bg-[#AC89FF]/20 text-[#AC89FF]'>
                                {professional.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className='font-medium'>
                                {professional.name}
                              </h4>
                              <p className='text-sm text-[#AC89FF]'>
                                {professional.specialty}
                              </p>
                            </div>
                          </div>

                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center text-sm text-white/70'>
                              <MapPin className='h-3.5 w-3.5 mr-1' />
                              <span>
                                {professional.location ||
                                  'Ubicación no especificada'}
                              </span>
                            </div>
                            <div className='flex items-center'>
                              <Star
                                className='h-3.5 w-3.5 text-yellow-400 mr-1'
                                fill='#FBBF24'
                              />
                              <span className='text-sm'>
                                {professional.rating || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className='flex justify-between'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='border-white/20 bg-white/5 hover:bg-white/10'
                            >
                              Ver perfil
                            </Button>
                            <Button
                              className='bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white'
                              size='sm'
                            >
                              Agendar cita
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {favorites.professionals.length === 0 && (
                      <div className='text-center py-8'>
                        <Heart className='h-12 w-12 mx-auto text-white/30 mb-3' />
                        <h3 className='text-lg font-medium mb-1'>
                          No tienes profesionales favoritos
                        </h3>
                        <p className='text-white/60 max-w-md mx-auto mb-4'>
                          Explora y guarda tus profesionales favoritos para
                          acceder rápidamente a ellos.
                        </p>
                        <Button className='bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white'>
                          Explorar profesionales
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className='bg-white/5 border-white/10 text-white'>
                  <CardHeader>
                    <CardTitle>Centros favoritos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {favorites.centers.map((center) => (
                        <div
                          key={center.id}
                          className='bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#AC89FF]/50 transition-colors card-hover'
                        >
                          <div className='flex items-center mb-3'>
                            <Avatar className='h-12 w-12 mr-3 border border-white/10'>
                              <AvatarImage
                                src={
                                  center.logo_url ||
                                  '/placeholder.svg?height=100&width=100&query=wellness center'
                                }
                                alt={center.name}
                              />
                              <AvatarFallback className='bg-[#83C7FD]/20 text-[#83C7FD]'>
                                {center.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className='font-medium'>{center.name}</h4>
                              <p className='text-sm text-[#83C7FD]'>
                                {center.type}
                              </p>
                            </div>
                          </div>

                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center text-sm text-white/70'>
                              <MapPin className='h-3.5 w-3.5 mr-1' />
                              <span>
                                {center.location || 'Ubicación no especificada'}
                              </span>
                            </div>
                            <div className='flex items-center'>
                              <Star
                                className='h-3.5 w-3.5 text-yellow-400 mr-1'
                                fill='#FBBF24'
                              />
                              <span className='text-sm'>
                                {center.rating || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className='flex justify-between'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='border-white/20 bg-white/5 hover:bg-white/10'
                            >
                              Ver centro
                            </Button>
                            <Button
                              className='bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white'
                              size='sm'
                            >
                              Reservar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {favorites.centers.length === 0 && (
                      <div className='text-center py-8'>
                        <Heart className='h-12 w-12 mx-auto text-white/30 mb-3' />
                        <h3 className='text-lg font-medium mb-1'>
                          No tienes centros favoritos
                        </h3>
                        <p className='text-white/60 max-w-md mx-auto mb-4'>
                          Explora y guarda tus centros favoritos para acceder
                          rápidamente a ellos.
                        </p>
                        <Button className='bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white'>
                          Explorar centros
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Configuración */}
              <TabsContent
                value='settings'
                className='space-y-6'
              >
                <Card className='bg-white/5 border-white/10 text-white'>
                  <CardHeader>
                    <CardTitle>Notificaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>
                            Notificaciones por correo
                          </h4>
                          <p className='text-sm text-white/70'>
                            Recibe recordatorios y actualizaciones por correo
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences?.notification_email || false}
                          onCheckedChange={(checked) =>
                            handleNotificationChange('email', checked)
                          }
                          className='data-[state=checked]:bg-[#AC89FF]'
                        />
                      </div>
                      <Separator className='bg-white/10' />
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>Notificaciones push</h4>
                          <p className='text-sm text-white/70'>
                            Recibe notificaciones en tu navegador
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences?.notification_push || false}
                          onCheckedChange={(checked) =>
                            handleNotificationChange('push', checked)
                          }
                          className='data-[state=checked]:bg-[#AC89FF]'
                        />
                      </div>
                      <Separator className='bg-white/10' />
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>Notificaciones SMS</h4>
                          <p className='text-sm text-white/70'>
                            Recibe recordatorios por mensaje de texto
                          </p>
                        </div>
                        <Switch
                          checked={userPreferences?.notification_sms || false}
                          onCheckedChange={(checked) =>
                            handleNotificationChange('sms', checked)
                          }
                          className='data-[state=checked]:bg-[#AC89FF]'
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className='bg-white/5 border-white/10 text-white'>
                  <CardHeader>
                    <CardTitle>Seguridad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center'>
                          <div className='h-10 w-10 rounded-full bg-[#AC89FF]/20 flex items-center justify-center mr-4'>
                            <Lock className='h-5 w-5 text-[#AC89FF]' />
                          </div>
                          <div>
                            <h4 className='font-medium'>Cambiar contraseña</h4>
                            <p className='text-sm text-white/70'>
                              Actualiza tu contraseña de acceso
                            </p>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          className='border-white/20 bg-white/5 hover:bg-white/10'
                        >
                          Cambiar
                        </Button>
                      </div>
                      <Separator className='bg-white/10' />
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center'>
                          <div className='h-10 w-10 rounded-full bg-[#83C7FD]/20 flex items-center justify-center mr-4'>
                            <Shield className='h-5 w-5 text-[#83C7FD]' />
                          </div>
                          <div>
                            <h4 className='font-medium'>
                              Verificación en dos pasos
                            </h4>
                            <p className='text-sm text-white/70'>
                              Añade una capa extra de seguridad
                            </p>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          className='border-white/20 bg-white/5 hover:bg-white/10'
                        >
                          Configurar
                        </Button>
                      </div>
                      <Separator className='bg-white/10' />
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center'>
                          <div className='h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center mr-4'>
                            <LogOut className='h-5 w-5 text-red-400' />
                          </div>
                          <div>
                            <h4 className='font-medium text-red-400'>
                              Cerrar sesión
                            </h4>
                            <p className='text-sm text-white/70'>
                              Salir de tu cuenta
                            </p>
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          className='border-red-500/30 text-red-400 hover:bg-red-500/10'
                          onClick={handleSignOut}
                        >
                          Cerrar sesión
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Columna derecha - Resumen y estadísticas */}
          <div>
            <div className='space-y-6'>
              <Card className='bg-white/5 border-white/10 text-white sticky top-24'>
                <CardHeader>
                  <CardTitle>Resumen de actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-6'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='bg-white/5 rounded-lg p-4 text-center'>
                        <p className='text-3xl font-bold text-[#AC89FF]'>
                          {
                            appointments.filter((a) => a.status === 'completed')
                              .length
                          }
                        </p>
                        <p className='text-sm text-white/70'>
                          Citas completadas
                        </p>
                      </div>
                      <div className='bg-white/5 rounded-lg p-4 text-center'>
                        <p className='text-3xl font-bold text-[#83C7FD]'>
                          {
                            appointments.filter((a) => a.status === 'upcoming')
                              .length
                          }
                        </p>
                        <p className='text-sm text-white/70'>Citas próximas</p>
                      </div>
                      <div className='bg-white/5 rounded-lg p-4 text-center'>
                        <p className='text-3xl font-bold text-[#AFF344]'>
                          {favorites.professionals.length +
                            favorites.centers.length}
                        </p>
                        <p className='text-sm text-white/70'>Favoritos</p>
                      </div>
                      <div className='bg-white/5 rounded-lg p-4 text-center'>
                        <p className='text-3xl font-bold text-white/90'>
                          {userPreferences?.categories?.length || 0}
                        </p>
                        <p className='text-sm text-white/70'>Intereses</p>
                      </div>
                    </div>

                    <Separator className='bg-white/10' />

                    <div>
                      <h3 className='text-lg font-medium mb-4'>Próxima cita</h3>
                      {appointments.filter((a) => a.status === 'upcoming')
                        .length > 0 ? (
                        <div className='bg-gradient-to-r from-[#AC89FF]/10 to-[#83C7FD]/10 rounded-lg p-4'>
                          {(() => {
                            const nextAppointment = appointments
                              .filter((a) => a.status === 'upcoming')
                              .sort((a, b) => {
                                if (!a.date || !b.date) return 0;
                                return (
                                  new Date(a.date).getTime() -
                                  new Date(b.date).getTime()
                                );
                              })[0];

                            return (
                              <>
                                <div className='flex items-center mb-3'>
                                  <Avatar className='h-10 w-10 mr-3 border border-white/10'>
                                    <AvatarImage
                                      src={
                                        nextAppointment.professionals
                                          ?.image_url ||
                                        nextAppointment.wellness_centers
                                          ?.logo_url ||
                                        '/placeholder.svg?height=100&width=100&query=profile' ||
                                        '/placeholder.svg'
                                      }
                                      alt={
                                        nextAppointment.professionals?.name ||
                                        nextAppointment.wellness_centers
                                          ?.name ||
                                        'Proveedor'
                                      }
                                    />
                                    <AvatarFallback className='bg-[#AC89FF]/20 text-[#AC89FF]'>
                                      {(
                                        nextAppointment.professionals?.name ||
                                        nextAppointment.wellness_centers
                                          ?.name ||
                                        'P'
                                      ).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className='font-medium'>
                                      {nextAppointment.professionals?.name ||
                                        nextAppointment.wellness_centers
                                          ?.name ||
                                        'Proveedor'}
                                    </h4>
                                    <p className='text-sm text-white/70'>
                                      {nextAppointment.services?.name ||
                                        'Servicio'}
                                    </p>
                                  </div>
                                </div>

                                <div className='flex items-center justify-between text-sm'>
                                  <div className='flex items-center'>
                                    <Calendar className='h-3.5 w-3.5 mr-1 text-[#AC89FF]' />
                                    <span>
                                      {safeFormatDate(
                                        nextAppointment.date,
                                        "d 'de' MMMM"
                                      )}
                                    </span>
                                  </div>
                                  <div className='flex items-center'>
                                    <Clock className='h-3.5 w-3.5 mr-1 text-[#AC89FF]' />
                                    <span>{nextAppointment.time}</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className='text-center py-4'>
                          <p className='text-white/60'>
                            No tienes citas programadas
                          </p>
                          <Button
                            variant='link'
                            className='text-[#AC89FF] hover:text-[#83C7FD] mt-1 p-0'
                          >
                            Agendar una cita
                          </Button>
                        </div>
                      )}
                    </div>

                    <Button className='w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group'>
                      <span className='relative z-10'>Ver todas mis citas</span>
                      <span className='absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out'></span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='border-t border-white/10 mt-16 py-8'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <div className='mb-6 md:mb-0'>
              <h2 className='text-xl font-bold animated-gradient-text mb-2'>
                Holistia
              </h2>
              <p className='text-white/70 text-sm'>
                Conectando el bienestar integral
              </p>
            </div>
            <div className='flex space-x-6'>
              <Link
                href='/about'
                className='text-white/70 hover:text-white text-sm'
              >
                Sobre nosotros
              </Link>
              <Link
                href='/contact'
                className='text-white/70 hover:text-white text-sm'
              >
                Contacto
              </Link>
              <Link
                href='/privacy'
                className='text-white/70 hover:text-white text-sm'
              >
                Privacidad
              </Link>
              <Link
                href='/terms'
                className='text-white/70 hover:text-white text-sm'
              >
                Términos
              </Link>
            </div>
          </div>
          <div className='mt-8 pt-6 border-t border-white/10 text-center'>
            <p className='text-xs text-white/50'>
              &copy; {new Date().getFullYear()} Holistia. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
