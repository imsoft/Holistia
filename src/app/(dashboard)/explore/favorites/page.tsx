"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { createClient } from "@/utils/supabase/client";
import { determineProfessionalModality, transformServicesFromDB } from "@/utils/professional-utils";
import { Heart } from "lucide-react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Favorite {
  id: string;
  user_id: string;
  professional_id: string;
  created_at: string;
}

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
  modality?: "presencial" | "online" | "both"; // Modalidad calculada basada en servicios
  gallery: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  imagePosition?: string; // Posición de la imagen en la card
}

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useUserStoreInit();
  const params = useParams();
  const supabase = createClient();

  const userId = useUserId();

  // Obtener favoritos del usuario
  useEffect(() => {
    const getFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching favorites for user:', userId);
        
        // Obtener favoritos del usuario
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('user_favorites')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (favoritesError) {
          console.error('Supabase error fetching favorites:', {
            message: favoritesError.message,
            details: favoritesError.details,
            hint: favoritesError.hint,
            code: favoritesError.code
          });
          
          // Manejar diferentes tipos de errores
          if (favoritesError.code === '42P01') {
            setError('La tabla de favoritos no existe. Por favor contacta al administrador.');
          } else if (favoritesError.code === '42501') {
            setError('No tienes permisos para acceder a los favoritos.');
          } else {
            setError(`Error al cargar los favoritos: ${favoritesError.message}`);
          }
          return;
        }

        console.log('Favorites fetched successfully:', favoritesData);
        setFavorites(favoritesData || []);

        // Si hay favoritos, obtener los datos de los profesionales
        if (favoritesData && favoritesData.length > 0) {
          const professionalIds = favoritesData.map(fav => fav.professional_id);
          
          const { data: professionalsData, error: professionalsError } = await supabase
            .from('professional_applications')
            .select('*')
            .in('id', professionalIds)
            .eq('status', 'approved')
            .eq('is_active', true)
            .eq('registration_fee_paid', true)
            .gt('registration_fee_expires_at', new Date().toISOString());

          if (professionalsError) {
            console.error('Error fetching professionals:', {
              message: professionalsError.message,
              details: professionalsError.details,
              hint: professionalsError.hint,
              code: professionalsError.code
            });
            setError(`Error al cargar los datos de los profesionales: ${professionalsError.message}`);
            return;
          }

          console.log('Professionals fetched successfully:', professionalsData);
          
          // Obtener servicios para cada profesional
          const professionalsWithServices = await Promise.all(
            (professionalsData || []).map(async (prof) => {
              const { data: services } = await supabase
                .from("professional_services")
                .select("*")
                .eq("professional_id", prof.id)
                .eq("isactive", true);

              // Transformar servicios a la estructura esperada usando la función utilitaria
              const transformedServices = transformServicesFromDB(services || []);
              
              // Determinar la modalidad del profesional basándose en los servicios
              const professionalModality = determineProfessionalModality(transformedServices);

              return {
                ...prof,
                services: transformedServices.length > 0 ? transformedServices : prof.services || [],
                modality: professionalModality, // Agregar la modalidad calculada
                imagePosition: prof.image_position || "center center", // Agregar posición de imagen
                is_verified: prof.is_verified || false,
                verified: prof.is_verified || false
              };
            })
          );

          setProfessionals(professionalsWithServices);
        }
      } catch (error) {
        console.error('Unexpected error fetching favorites:', error);
        setError('Error inesperado al cargar los favoritos. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      getFavorites();
    } else {
      setError('ID de usuario no válido.');
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey]);

  // Componente de skeleton para las cards de profesionales
  const ProfessionalCardSkeleton = () => (
    <div className="relative">
      <Card className="h-full flex flex-col group overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-border">
        <div className="relative w-full h-64 overflow-hidden bg-gray-100">
          <Skeleton className="w-full h-full" />
        </div>
        <CardContent className="px-4 pt-3 pb-4 flex flex-col grow">
          <div className="space-y-2 flex flex-col grow">
            <div>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <div className="flex items-center justify-between gap-2 mt-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="flex gap-1 mb-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-1 mt-auto">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </CardContent>
        <div className="absolute top-3 right-3 pointer-events-auto" style={{ zIndex: 9999 }}>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Mis Favoritos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Expertos guardados en tus favoritos
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`favorite-skeleton-${i}`} className="relative">
                <ProfessionalCardSkeleton />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Error al cargar los favoritos</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={() => setRefreshKey(prev => prev + 1)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {professionals.map((professional) => (
              <div key={professional.id} className="relative">
                <ProfessionalCard
                  userId={params.id as string}
                  showFavoriteButton={false}
                  professional={{
                    id: professional.id,
                    slug: `${professional.first_name.toLowerCase()}-${professional.last_name.toLowerCase()}`,
                    name: `${professional.first_name} ${professional.last_name}`,
                    email: professional.email,
                    whatsapp: professional.phone || '',
                    socialMedia: {
                      instagram: '',
                      linkedin: ''
                    },
                    profession: professional.profession,
                    therapyTypes: professional.specializations,
                    costs: {
                      presencial: professional.services.find(s => s.presencialCost)?.presencialCost 
                        ? parseInt(professional.services.find(s => s.presencialCost)?.presencialCost || '0')
                        : 0,
                      online: professional.services.find(s => s.onlineCost)?.onlineCost 
                        ? parseInt(professional.services.find(s => s.onlineCost)?.onlineCost || '0')
                        : 0
                    },
                    serviceType: (() => {
                      // Usar la modalidad calculada si está disponible, sino calcularla
                      if (professional.modality) {
                        switch (professional.modality) {
                          case 'presencial':
                            return 'in-person';
                          case 'online':
                            return 'online';
                          case 'both':
                            return 'both';
                          default:
                            return 'in-person';
                        }
                      }
                      
                      // Fallback: calcular basándose en los servicios
                      const hasPresencial = professional.services.some(s => s.presencialCost && s.presencialCost !== '');
                      const hasOnline = professional.services.some(s => s.onlineCost && s.onlineCost !== '');
                      if (hasPresencial && hasOnline) return 'both';
                      if (hasPresencial) return 'in-person';
                      return 'online';
                    })(),
                    location: {
                      city: professional.city,
                      state: professional.state,
                      country: professional.country,
                      address: professional.address
                    },
                    bookingOption: true,
                    serviceDescription: professional.services[0]?.description || professional.biography || '',
                      biography: professional.biography || '',
                      profilePhoto: professional.profile_photo || '',
                      gallery: professional.gallery,
                      imagePosition: professional.imagePosition || "center center"
                  }}
                />
                <div 
                  className="absolute top-3 right-3 pointer-events-auto" 
                  style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
                >
                  <FavoriteButton
                    itemId={professional.id}
                    favoriteType="professional"
                    variant="floating"
                    onToggle={(isFavorite) => {
                      if (!isFavorite) {
                        // Si se eliminó el favorito, actualizar la lista
                        setFavorites(prev => prev.filter(fav => fav.professional_id !== professional.id));
                        setProfessionals(prev => prev.filter(prof => prof.id !== professional.id));
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No tienes favoritos aún</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
              Explora expertos en salud mental y guarda tus favoritos para acceder a ellos fácilmente.
            </p>
            <Button 
              className="bg-primary text-primary-foreground px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto"
              onClick={() => window.location.href = `/patient/${userId}/explore`}
            >
              Explorar Expertos
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default FavoritesPage;