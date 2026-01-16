"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import Image from "next/image";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  MessageCircle,
  Monitor,
  Users,
  Heart,
  Calendar,
  Share2,
  Award,
  XCircle,
  CreditCard,
  Languages,
  ShoppingBag,
  MessageSquare,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MapboxMap from "@/components/ui/mapbox-map";
import ProfessionalGallery from "@/components/ui/professional-gallery";
import { createClient } from "@/utils/supabase/client";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { StarRating } from "@/components/reviews/star-rating";
import type { Review, ReviewStats } from "@/types/review";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DirectMessageChat } from "@/components/ui/direct-message-chat";
import { BookingDialog } from "@/components/ui/booking-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PaymentButton from "@/components/ui/payment-button";
import { FriendlyErrorDialog } from "@/components/ui/friendly-error-dialog";
import { WideCalendar } from "@/components/ui/wide-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { DigitalProductCard } from "@/components/ui/digital-product-card";
import { FollowButton } from "@/components/ui/follow-button";
import { FollowStats } from "@/components/ui/follow-stats";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  languages?: string[];
  experience: string;
  certifications: string[];
  services: Array<{
    id?: string;
    name: string;
    description: string;
    presencialCost: string;
    onlineCost: string;
    pricing_type?: "fixed" | "quote";
    image_url?: string;
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
  is_verified?: boolean;
  // Campos de horarios de trabajo
  working_start_time?: string;
  working_end_time?: string;
  working_days?: number[];
}


interface ProfessionalService {
  id: string;
  professional_id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: string;
  modality: string;
  duration: number;
  isactive: boolean;
  created_at: string;
  updated_at: string;
  cost: number | null;
  pricing_type?: "fixed" | "quote";
  program_duration: Record<string, unknown> | null;
  image_url?: string | null;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function ProfessionalProfilePage() {
  const router = useRouter();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const supabase = createClient();

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [supabase]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFriendlyErrorOpen, setIsFriendlyErrorOpen] = useState(false);
  const [friendlyErrorData, setFriendlyErrorData] = useState<{
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
    description?: string;
  } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    date: string;
    time: string;
    service: string;
    cost: number;
    professionalId: string;
    professionalName: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [appointmentForm, setAppointmentForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<{
    id?: string;
    name: string;
    description: string;
  } | null>(null);
  const [quoteDetails, setQuoteDetails] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);

  useUserStoreInit();
  const params = useParams();
  
  const patientId = useUserId();
  const slugParam = params.slug as string;
  
  // Extraer UUID del slug si está presente (formato: "nombre-apellido-{uuid}" o solo UUID)
  const uuidMatch = slugParam.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const professionalId = uuidMatch ? uuidMatch[0] : slugParam; // Si no hay UUID, usar el slug completo (puede ser un UUID directo)

  // Scroll al inicio cuando se carga la página (usar useLayoutEffect para ejecutar antes del render)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [professionalId]);

  // Obtener datos del profesional y usuario actual
  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Obtener perfil del usuario desde la tabla profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone')
            .eq('id', user.id)
            .maybeSingle();
          
          // Manejar error PGRST116 (no rows found) - es normal si el perfil no existe aún
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }
          
          const fullName = profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : profile?.email?.split('@')[0] || user.email?.split('@')[0] || 'Usuario';
          
          const userData: CurrentUser = {
            id: user.id,
            name: fullName,
            email: profile?.email || user.email || '',
            phone: profile?.phone || ''
          };
          setCurrentUser(userData);
          
          // Actualizar formulario con datos del usuario
          setAppointmentForm({
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            notes: "",
          });
        }

        // Obtener profesional por ID
        const { data: professionalData, error } = await supabase
          .from('professional_applications')
          .select('*')
          .eq('id', professionalId)
          .eq('status', 'approved')
          .eq('is_active', true)
          .eq('registration_fee_paid', true)
          .gt('registration_fee_expires_at', new Date().toISOString())
          .maybeSingle();

        // Manejar error PGRST116 (no rows found) - profesional no encontrado o no cumple condiciones
        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('⚠️ Profesional no encontrado o no cumple condiciones:', {
              professionalId,
              error: error.message
            });
            // No mostrar error al usuario, simplemente no cargar datos
            return;
          }
          console.error('❌ Error fetching professional:', error);
          return;
        }

        if (!professionalData) {
          console.warn('⚠️ Profesional no encontrado:', professionalId);
          return;
        }

        // Obtener servicios del profesional usando la función RPC para evitar problemas de RLS
        console.log('🔍 Buscando servicios para professional_id:', professionalId);
        const { data: servicesData, error: servicesError } = await supabase
          .rpc('get_professional_services', { p_professional_id: professionalId });

        console.log('📋 Resultado de la consulta de servicios:', { servicesData, servicesError });
        console.log('👤 Usuario autenticado:', user?.id);
        console.log('🔍 Professional ID buscado:', professionalId);

        if (servicesError) {
          console.error('❌ Error fetching services:', servicesError);
          console.error('❌ Detalles del error:', JSON.stringify(servicesError, null, 2));
        } else {
          console.log('✅ Servicios obtenidos exitosamente:', servicesData?.length || 0, 'servicios');
        }

        // También obtener servicios del campo JSONB en professional_applications
        const legacyServices = professionalData.services || [];
        console.log('📋 Servicios legacy de professional_applications:', legacyServices);

        // Convertir servicios de la nueva estructura a la estructura esperada
        // Agrupar servicios por nombre para combinar modalidades
        const servicesMap = new Map<string, {
          id: string;
          name: string;
          description: string;
          presencialCost: string;
          onlineCost: string;
          pricing_type?: "fixed" | "quote";
          image_url?: string;
        }>();

        // Procesar servicios de la tabla professional_services
        (servicesData as ProfessionalService[] || []).forEach((service: ProfessionalService) => {
          console.log('🔍 Procesando servicio de professional_services:', {
            id: service.id,
            name: service.name,
            pricing_type: service.pricing_type,
            cost: service.cost,
            image_url: service.image_url,
            hasImage: !!service.image_url
          });

          const existing = servicesMap.get(service.name);

          if (existing) {
            // Si ya existe, actualizar costos según la modalidad (solo si es precio fijo)
            if (service.pricing_type === 'fixed' && service.cost) {
              const costStr = service.cost.toString();
              if (service.modality === 'presencial') {
                existing.presencialCost = costStr;
              } else if (service.modality === 'online') {
                existing.onlineCost = costStr;
              } else if (service.modality === 'both') {
                existing.presencialCost = costStr;
                existing.onlineCost = costStr;
              }
            }
            // Actualizar pricing_type si es cotización (tiene prioridad)
            if (service.pricing_type === 'quote') {
              existing.pricing_type = 'quote';
              existing.presencialCost = '';
              existing.onlineCost = '';
            }
            // Priorizar imagen: si el servicio actual tiene imagen, usarla (incluso si el existente ya tiene una)
            // Esto asegura que siempre tengamos la imagen más reciente
            if (service.image_url) {
              existing.image_url = service.image_url;
              console.log('✅ Actualizando imagen del servicio:', service.name, service.image_url);
            }
          } else {
            // Crear nuevo servicio
            const serviceObj: {
              id: string;
              name: string;
              description: string;
              presencialCost: string;
              onlineCost: string;
              pricing_type?: "fixed" | "quote";
              image_url?: string;
            } = {
              id: service.id,
              name: service.name,
              description: service.description || '',
              presencialCost: '',
              onlineCost: '',
              pricing_type: service.pricing_type || 'fixed',
              image_url: service.image_url || undefined
            };
            
            // Si es precio fijo, asignar costos según modalidad
            if (service.pricing_type === 'fixed' && service.cost) {
              const costStr = service.cost.toString();
              if (service.modality === 'presencial' || service.modality === 'both') {
                serviceObj.presencialCost = costStr;
              }
              if (service.modality === 'online' || service.modality === 'both') {
                serviceObj.onlineCost = costStr;
              }
            } else if (service.pricing_type === 'quote') {
              // Si es cotización, no asignar costos
              serviceObj.presencialCost = '';
              serviceObj.onlineCost = '';
            }
            
            servicesMap.set(service.name, serviceObj);
            if (service.image_url) {
              console.log('✅ Agregando servicio con imagen:', service.name, service.image_url);
            }
          }
        });

        // Procesar servicios legacy del campo JSONB (solo si tienen datos válidos)
        (legacyServices || []).forEach((service: { name: string; description?: string; presencialCost?: number; onlineCost?: number }) => {
          console.log('🔍 Procesando servicio legacy:', service);
          
          // Solo procesar servicios que tengan nombre y al menos un costo
          if (service.name && service.name.trim() !== '' && (service.presencialCost || service.onlineCost)) {
            const existing = servicesMap.get(service.name);
            
            if (existing) {
              // Si ya existe, actualizar costos
              if (service.presencialCost) {
                existing.presencialCost = service.presencialCost.toString();
              }
              if (service.onlineCost) {
                existing.onlineCost = service.onlineCost.toString();
              }
            } else {
              // Crear nuevo servicio (legacy - no tiene id ni pricing_type)
              servicesMap.set(service.name, {
                id: `legacy-${service.name}`, // ID temporal para servicios legacy
                name: service.name,
                description: service.description || '',
                presencialCost: service.presencialCost ? service.presencialCost.toString() : '',
                onlineCost: service.onlineCost ? service.onlineCost.toString() : '',
                pricing_type: 'fixed', // Los servicios legacy son precio fijo
                image_url: undefined // Los servicios legacy no tienen imagen
              });
            }
          } else {
            console.log('⚠️ Servicio legacy ignorado (sin datos válidos):', service);
          }
        });
        
        const convertedServices = Array.from(servicesMap.values());
        
        // Filtrar servicios: mostrar si tienen costo (precio fijo) o si son de cotización
        const validServices = convertedServices.filter(service => 
          service.pricing_type === 'quote' || // Mostrar servicios de cotización
          (service.presencialCost && service.presencialCost !== '' && service.presencialCost !== '0' && Number(service.presencialCost) > 0) || 
          (service.onlineCost && service.onlineCost !== '' && service.onlineCost !== '0' && Number(service.onlineCost) > 0)
        );
        
        console.log('📋 Servicios de professional_services:', servicesData);
        console.log('📋 Servicios legacy de professional_applications:', legacyServices);
        console.log('📋 Servicios convertidos:', convertedServices);
        console.log('📋 Servicios válidos:', validServices);
        console.log('📋 Cantidad de servicios válidos:', validServices.length);
        
        // Debug detallado de cada servicio
        convertedServices.forEach((service, index) => {
          console.log(`📋 Servicio ${index}:`, {
            name: service.name,
            presencialCost: service.presencialCost,
            onlineCost: service.onlineCost,
            hasPresencial: service.presencialCost && service.presencialCost !== '' && service.presencialCost !== '0' && Number(service.presencialCost) > 0,
            hasOnline: service.onlineCost && service.onlineCost !== '' && service.onlineCost !== '0' && Number(service.onlineCost) > 0,
            isValid: (service.presencialCost && service.presencialCost !== '' && service.presencialCost !== '0' && Number(service.presencialCost) > 0) || (service.onlineCost && service.onlineCost !== '' && service.onlineCost !== '0' && Number(service.onlineCost) > 0)
          });
        });

        // Usar profile_photo de la aplicación profesional
        const finalProfilePhoto = professionalData.profile_photo;
        
        // Debug de imágenes de servicios
        validServices.forEach((service, index) => {
          console.log(`🖼️ Servicio ${index} (${service.name}):`, {
            image_url: service.image_url,
            hasImage: !!service.image_url,
            imageType: service.image_url ? (service.image_url.startsWith('http') ? 'URL completa' : 'Ruta relativa') : 'Sin imagen'
          });
        });
        
        console.log('🎯 Estableciendo servicios en el estado:', validServices);
        console.log('🎯 Cantidad final de servicios:', validServices.length);
        
        setProfessional({
          ...professionalData,
          profile_photo: finalProfilePhoto,
          services: validServices
        });

        // Verificar si es favorito
        if (user) {
          const { data: favoriteData, error: favoriteError } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('professional_id', professionalData.id)
            .maybeSingle();

          if (!favoriteError) {
            setIsFavorite(!!favoriteData);
          }
        }

        // Cargar productos digitales del profesional verificado
        if (professionalData.is_verified) {
          const { data: productsData } = await supabase
            .from('digital_products_with_professional')
            .select('*')
            .eq('professional_id', professionalData.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (productsData) {
            setDigitalProducts(productsData);
          }
        }

        // Cargar retos del profesional
        const { data: challengesData, error: challengesError } = await supabase
          .from('challenges')
          .select('*')
          .eq('professional_id', professionalData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (challengesError) {
          console.error('Error loading challenges:', challengesError);
        } else {
          setChallenges(challengesData || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    getData();

    // Sincronizar Google Calendar del profesional para asegurar que los eventos estén actualizados
    const syncGoogleCalendar = async () => {
      try {
        // Obtener el user_id del profesional
        const { data: professionalData } = await supabase
          .from('professional_applications')
          .select('user_id')
          .eq('id', professionalId)
          .single();

        if (professionalData?.user_id) {
          console.log('🔄 Iniciando sincronización de Google Calendar...');
          // Llamar a la API para sincronizar Google Calendar
          const response = await fetch('/api/cron/sync-google-calendar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: professionalData.user_id }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Google Calendar sincronizado para el profesional:', result);

            // Disparar evento para recargar el calendario con los datos actualizados
            console.log('🔄 Disparando evento reload-calendar para actualizar el calendario');
            window.dispatchEvent(new Event('reload-calendar'));
          } else {
            console.log('⚠️ No se pudo sincronizar Google Calendar (puede que no esté conectado)');
          }
        }
      } catch (error) {
        // No mostrar error al usuario, solo loguear
        console.log('⚠️ Error al sincronizar Google Calendar:', error);
      }
    };

    // Sincronizar en segundo plano sin bloquear la carga
    syncGoogleCalendar();
  }, [professionalId, patientId, supabase]);

  // No establecer fecha inicial - el usuario debe seleccionar una fecha primero
  // useEffect(() => {
  //   if (!selectedDate && professional) {
  //     const today = new Date();
  //     const todayString = today.toISOString().split('T')[0];
  //     console.log('📅 Estableciendo fecha inicial:', todayString);
  //     setSelectedDate(todayString);
  //     getAvailableTimes(todayString);
  //   }
  // }, [professional, selectedDate]);

  // Cargar estadísticas de reseñas y reseña del usuario
  useEffect(() => {
    const loadReviews = async () => {
      try {
        // Obtener estadísticas de reseñas
        const { data: statsData, error: statsError } = await supabase
          .from('professional_review_stats')
          .select('*')
          .eq('professional_id', professional?.user_id);

        // La vista puede devolver 0 o 1 resultado, manejar ambos casos
        if (!statsError && statsData && statsData.length > 0) {
          setReviewStats(statsData[0]);
        } else {
          setReviewStats(null);
        }

        // Obtener reseña del usuario actual (si existe)
        if (currentUser) {
          const { data: reviewData, error: reviewError } = await supabase
            .from('reviews')
            .select('*')
            .eq('professional_id', professional?.user_id)
            .eq('patient_id', currentUser.id);

          if (!reviewError && reviewData && reviewData.length > 0) {
            setUserReview(reviewData[0]);
          } else {
            setUserReview(null);
          }
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };

    if (professional?.user_id) {
      loadReviews();
    }
  }, [professional?.user_id, currentUser, refreshReviews, supabase]);

  const handleToggleFavorite = async () => {
    if (!currentUser || !professional) return;
    
    try {
      setFavoriteLoading(true);
      
      if (isFavorite) {
        // Remover de favoritos
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('professional_id', professional.id);

        if (error) {
          console.error('Error removing favorite:', error);
          return;
        }
        setIsFavorite(false);
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: currentUser.id,
            professional_id: professional.id
          });

        if (error) {
          console.error('Error adding favorite:', error);
          return;
        }
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Función para formatear los días de trabajo
  const formatWorkingDays = (workingDays: number[]) => {
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return workingDays.map(day => dayNames[day - 1]).join(', ');
  };

  // Función para formatear el horario de trabajo
  const formatWorkingHours = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  const getServiceTypeIcon = () => {
    if (!professional) return <MessageCircle className="h-4 w-4" />;

    const hasPresencial = professional.services.some(s => s.presencialCost && s.presencialCost !== '' && s.presencialCost !== '0' && Number(s.presencialCost) > 0);
    const hasOnline = professional.services.some(s => s.onlineCost && s.onlineCost !== '' && s.onlineCost !== '0' && Number(s.onlineCost) > 0);

    if (hasPresencial && hasOnline) {
      return <MessageCircle className="h-4 w-4" />;
    } else if (hasPresencial) {
      return <Users className="h-4 w-4" />;
    } else {
      return <Monitor className="h-4 w-4" />;
    }
  };

  const getServiceTypeText = () => {
    if (!professional) return "Presencial y en línea";

    const hasPresencial = professional.services.some(s => s.presencialCost && s.presencialCost !== '' && s.presencialCost !== '0' && Number(s.presencialCost) > 0);
    const hasOnline = professional.services.some(s => s.onlineCost && s.onlineCost !== '' && s.onlineCost !== '0' && Number(s.onlineCost) > 0);

    if (hasPresencial && hasOnline) {
      return "Presencial y en línea";
    } else if (hasPresencial) {
      return "Presencial";
    } else {
      return "En línea";
    }
  };

  const getExperienceDescription = (experience: string) => {
    // Extraer años de experiencia del texto
    const yearsMatch = experience.match(/(\d+)/);
    if (!yearsMatch) return experience;
    
    const years = parseInt(yearsMatch[1]);
    const experienceWithYears = experience.replace(/(\d+)/, `$1 años`);
    
    if (years < 1) {
      return `${experienceWithYears} - Recién graduado, con formación académica sólida y pasión por ayudar a sus pacientes.`;
    } else if (years >= 1 && years < 3) {
      return `${experienceWithYears} - Experto en desarrollo con experiencia inicial y compromiso con el crecimiento continuo.`;
    } else if (years >= 3 && years < 5) {
      return `${experienceWithYears} - Experiencia consolidada en el campo, con habilidades desarrolladas y enfoque en resultados.`;
    } else if (years >= 5 && years < 10) {
      return `${experienceWithYears} - Experiencia sólida y amplia, reconocido por su profesionalismo y resultados consistentes.`;
    } else if (years >= 10 && years < 15) {
      return `${experienceWithYears} - Experto con una década de experiencia, líder en su especialidad y mentor de otros expertos.`;
    } else if (years >= 15 && years < 20) {
      return `${experienceWithYears} - Experto senior con amplia trayectoria, reconocido por su expertise y contribuciones al campo.`;
    } else {
      return `${experienceWithYears} - Maestro en su especialidad con décadas de experiencia, referente y autoridad en el área.`;
    }
  };


  // Función para compartir el perfil del profesional (solo copiar enlace)
  const handleShare = async () => {
    if (!professional) return;

    // Crear slug: nombre-apellido-id
    const slug = `${professional.first_name.toLowerCase()}-${professional.last_name.toLowerCase()}-${professional.id}`;
    const shareUrl = `${window.location.origin}/explore/professional/${slug}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar enlace:', error);
      toast.error('Error al copiar enlace');
    }
  };


  // Generar fechas disponibles (próximos 30 días) - simplificado
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    // Días laborales por defecto (lunes a viernes)
    const workingDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      
      if (workingDays.includes(dayName)) {
        dates.push({
          date: date.toISOString().split('T')[0],
          dayName,
          display: `${dayName}, ${date.getDate()} de ${date.toLocaleDateString('es-ES', { month: 'long' })}`
        });
      }
    }
    return dates;
  };



  const handleRequestQuote = async () => {
    if (!selectedServiceForQuote || !currentUser || !professional || !quoteDetails.trim()) {
      toast.error('Por favor, describe qué necesitas del servicio');
      return;
    }

    try {
      setQuoteLoading(true);

      // Crear o obtener la conversación con el profesional
      const conversationResponse = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professional_id: professional.id,
        }),
      });

      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.json();
        throw new Error(errorData.error || 'Error al crear conversación');
      }

      const { conversation } = await conversationResponse.json();

      // Enviar mensaje inicial con los detalles de la cotización
      const messageContent = `Solicitud de cotización para: "${selectedServiceForQuote.name}"\n\nDetalles:\n${quoteDetails.trim()}`;

      const messageResponse = await fetch(`/api/messages/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
        }),
      });

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        console.error('Error sending message:', errorData);
        throw new Error(errorData.details || errorData.error || 'Error al enviar mensaje');
      }

      toast.success('Solicitud de cotización enviada. El experto te contactará pronto.');
      setIsQuoteDialogOpen(false);
      setQuoteDetails("");
      setSelectedServiceForQuote(null);
      
      // Abrir el chat para que el usuario pueda ver la conversación
      setConversationId(conversation.id);
      setIsMessageDialogOpen(true);
    } catch (error) {
      console.error('Error requesting quote:', error);
      toast.error(error instanceof Error ? error.message : 'Error al solicitar cotización');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleOpenMessageDialog = async () => {
    if (!professional) {
      toast.error('Información del experto no disponible');
      return;
    }

    try {
      // Crear o obtener conversación
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: professional.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear conversación');
      }

      setConversationId(data.conversation.id);
      setIsMessageDialogOpen(true);
    } catch (error) {
      console.error('Error opening message dialog:', error);
      toast.error(error instanceof Error ? error.message : 'Error al abrir mensajes');
    }
  };

  const handleBookingSubmit = async () => {
    // Validación de campos requeridos
    if (!selectedDate || !selectedTime || !selectedService || !currentUser || !professional) {
      setErrorMessage("Por favor completa todos los campos requeridos");
      setIsErrorModalOpen(true);
      return;
    }
    
    // Validación de datos del usuario
    if (!appointmentForm.name || !appointmentForm.email) {
      setErrorMessage("Los datos de tu perfil están incompletos. Por favor, actualiza tu perfil antes de reservar.");
      setIsErrorModalOpen(true);
      return;
    }
    
    try {
      setBookingLoading(true);
      
      // Verificar que no exista una cita duplicada
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', currentUser.id)
        .eq('professional_id', professional.id)
        .eq('appointment_date', selectedDate)
        .eq('appointment_time', selectedTime)
        .maybeSingle();

      if (existingAppointment) {
        setErrorMessage("Ya tienes una cita reservada en este horario con este profesional.");
        setIsErrorModalOpen(true);
        setBookingLoading(false);
        return;
      }
      
      // Determinar el costo basado en el tipo de servicio seleccionado
      const [serviceName, serviceModality] = selectedService.split('-');
      const service = professional.services.find(s => s.name === serviceName);
      
      if (!service) {
        setErrorMessage("El servicio seleccionado no está disponible.");
        setIsErrorModalOpen(true);
        setBookingLoading(false);
        return;
      }
      
      const cost = serviceModality === 'presencial' 
        ? parseFloat(service.presencialCost || '0')
        : parseFloat(service.onlineCost || '0');
      
      // NO crear la cita todavía - primero preparar datos para el pago
      setPaymentData({
        date: selectedDate,
        time: selectedTime,
        service: selectedService,
        cost: cost,
        professionalId: professional.id,
        professionalName: `${professional.first_name} ${professional.last_name}`
      });
      
      // Cerrar modal de booking y abrir modal de pago
      setIsBookingModalOpen(false);
      setIsPaymentModalOpen(true);
      
    } catch (error) {
      console.error('Error preparing payment:', error);
      setErrorMessage("Error inesperado. Por favor, inténtalo de nuevo.");
      setIsErrorModalOpen(true);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row gap-6">
              <Skeleton className="h-48 w-48 rounded-full shrink-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
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

  // Función para renderizar el contenido del profesional
  const renderProfessionalContent = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header del profesional */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
              <div 
                className="relative shrink-0 cursor-pointer group"
                onClick={() => setIsPhotoModalOpen(true)}
              >
                <Image
                  src={professional.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${professional.first_name} ${professional.last_name}`)}&background=random`}
                  alt={`${professional.first_name} ${professional.last_name}`}
                  width={120}
                  height={120}
                  className="h-20 w-20 sm:h-28 sm:w-28 aspect-square rounded-full object-cover shadow-lg transition-opacity group-hover:opacity-80"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-full transition-colors flex items-center justify-center">
                  <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver foto
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
                  {professional.first_name} {professional.last_name}
                  {professional.is_verified && <VerifiedBadge size={24} />}
                </h1>
                <p className="text-base sm:text-lg text-primary font-medium mb-2 sm:mb-3">
                  {professional.profession}
                </p>
                {/* Estadísticas de seguimiento */}
                {professional.user_id && (
                  <div className="mb-2 sm:mb-3">
                    <FollowStats userId={professional.user_id} />
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap mb-2 sm:mb-3">
                  <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-primary/10 rounded-full">
                    {getServiceTypeIcon()}
                    <span className="text-xs sm:text-sm text-primary font-medium">
                      {getServiceTypeText()}
                    </span>
                  </div>
                  {/* Mostrar rating si hay reseñas */}
                  {reviewStats && reviewStats.total_reviews > 0 && (
                    <div className="flex items-center gap-1">
                      <StarRating 
                        rating={reviewStats.average_rating} 
                        size="sm" 
                        showNumber={true}
                      />
                      <span className="text-xs text-muted-foreground ml-1">
                        ({reviewStats.total_reviews} {reviewStats.total_reviews === 1 ? 'reseña' : 'reseñas'})
                      </span>
                    </div>
                  )}
                </div>
                {/* Badges de especializaciones */}
                {professional.specializations && professional.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {professional.specializations.map((specialization, index) => (
                      <span 
                        key={index} 
                        className="text-xs bg-primary text-white px-2 sm:px-3 py-1 rounded-full font-medium"
                      >
                        {specialization}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 w-full lg:w-auto justify-end">
              {/* Botón de seguir */}
              {professional.user_id && (
                <FollowButton userId={professional.user_id} />
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`h-10 w-10 ${
                  isFavorite ? "text-red-500 border-red-500 bg-red-50" : ""
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-10">
            {/* Galería de imágenes */}
            <ProfessionalGallery
              images={professional.gallery || []}
              professionalName={`${professional.first_name} ${professional.last_name}`}
            />

            {/* Biografía */}
            {professional.biography && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
                  Acerca de {professional.first_name}
                </h2>
                <div 
                  className="text-sm sm:text-base text-muted-foreground leading-relaxed prose prose-sm sm:prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: professional.biography }}
                />
              </div>
            )}

            {/* Horarios de Trabajo */}
            {(professional.working_start_time || professional.working_end_time || professional.working_days) && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
                  Horarios de Trabajo
                </h2>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {professional.working_start_time && professional.working_end_time && (
                    <div className="flex items-center gap-2 text-sm sm:text-base">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-foreground">Horario:</span>
                      <span className="text-muted-foreground">
                        {formatWorkingHours(professional.working_start_time, professional.working_end_time)}
                      </span>
                    </div>
                  )}
                  {professional.working_days && professional.working_days.length > 0 && (
                    <div className="flex items-start gap-2 text-sm sm:text-base">
                      <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-medium text-foreground">Días:</span>
                      <span className="text-muted-foreground">
                        {formatWorkingDays(professional.working_days)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Idiomas */}
            {professional.languages && professional.languages.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
                  Idiomas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {professional.languages.map((language, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-linear-to-r from-primary/10 to-primary/20 border border-primary/30"
                    >
                      <Languages className="h-4 w-4 text-primary" />
                      <span className="text-sm sm:text-base text-foreground font-medium">
                        {language}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Precios y Experiencia - Visible solo en móvil después de idiomas */}
            <div className="lg:hidden space-y-6">
              {/* Resumen de precios */}
              {(() => {
                // Calcular precios mínimos
                const allPrices: number[] = [];
                professional.services.forEach(service => {
                  if (service.presencialCost && service.presencialCost !== '') {
                    allPrices.push(parseInt(service.presencialCost));
                  }
                  if (service.onlineCost && service.onlineCost !== '') {
                    allPrices.push(parseInt(service.onlineCost));
                  }
                });

                if (allPrices.length === 0) return null;

                return (
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">
                      Precios desde
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const minPrice = Math.min(...allPrices);
                        const maxPrice = Math.max(...allPrices);

                        return (
                          <div className="text-center p-4 rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20">
                            <div className="text-2xl font-bold text-primary mb-1">
                              {formatPrice(minPrice)}
                            </div>
                            {minPrice !== maxPrice && (
                              <div className="text-sm text-muted-foreground">
                                hasta {formatPrice(maxPrice)}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              por sesión
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* Experiencia */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">
                  Experiencia
                </h3>
                <div className="p-4 sm:p-5 rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground text-sm sm:text-base leading-relaxed font-medium">
                        {getExperienceDescription(professional.experience)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2 sm:space-y-3">
                {!isAuthenticated ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => router.push(`/signup?redirect=${encodeURIComponent(`/explore/professional/${slugParam}`)}`)}
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl bg-linear-to-r from-green-300 to-green-400 hover:from-green-400 hover:to-green-500 shadow-lg text-white touch-manipulation"
                    >
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Registrarse para reservar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/explore/professional/${slugParam}`)}`)}
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl"
                    >
                      Ya tengo cuenta
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔵 Click en botón Reservar cita');
                        setIsBookingModalOpen(true);
                        console.log('🔵 Estado isBookingModalOpen actualizado a:', true);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔵 TouchEnd en botón Reservar cita');
                        setIsBookingModalOpen(true);
                        console.log('🔵 Estado isBookingModalOpen actualizado a:', true);
                      }}
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl bg-linear-to-r from-green-300 to-green-400 hover:from-green-400 hover:to-green-500 shadow-lg text-white touch-manipulation"
                      style={{
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                        position: 'relative',
                        zIndex: 10,
                        pointerEvents: 'auto'
                      }}
                    >
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Reservar cita
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await handleOpenMessageDialog();
                      }}
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl"
                    >
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Enviar Mensaje
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Servicios */}
            {professional.services && professional.services.length > 0 && professional.services.some(service => 
              (service.presencialCost && service.presencialCost !== '') || 
              (service.onlineCost && service.onlineCost !== '')
            ) && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
                  Servicios
                </h2>
                <div className="space-y-4">
                  {professional.services.map((service, index) => {
                    const isQuote = service.pricing_type === 'quote';
                    const hasPresencial = !isQuote && service.presencialCost && service.presencialCost !== '' && service.presencialCost !== '0' && Number(service.presencialCost) > 0;
                    const hasOnline = !isQuote && service.onlineCost && service.onlineCost !== '' && service.onlineCost !== '0' && Number(service.onlineCost) > 0;

                    return (
                    <div
                      key={index}
                      className="rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all overflow-hidden"
                    >
                      {/* Grid: imagen a la izquierda, contenido a la derecha */}
                      <div className="grid grid-cols-1 sm:grid-cols-[25%_1fr] gap-0">
                        {/* Imagen del servicio */}
                        <div className="relative h-48 sm:h-full overflow-hidden rounded-l-lg">
                          <Image
                            src={service.image_url || "/logos/holistia-black.png"}
                            alt={service.name}
                            fill
                            className={`${service.image_url ? 'object-cover' : 'object-contain p-6 bg-muted'}`}
                            unoptimized={service.image_url?.includes('supabase.co') || service.image_url?.includes('supabase.in')}
                          />
                        </div>
                        
                        {/* Contenido del servicio */}
                        <div className="p-4 sm:p-6">
                          <h3 className="text-foreground font-semibold text-lg sm:text-xl mb-2">
                            {service.name}
                          </h3>
                          {service.description && (
                            <div
                              className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 prose prose-sm sm:prose-base max-w-none"
                              dangerouslySetInnerHTML={{ __html: service.description }}
                            />
                          )}
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {isQuote ? (
                              <button
                                onClick={() => {
                                  setSelectedServiceForQuote({
                                    id: service.id,
                                    name: service.name,
                                    description: service.description || '',
                                  });
                                  setIsQuoteDialogOpen(true);
                                }}
                                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm font-medium">
                                  Solicitar Cotización
                                </span>
                              </button>
                            ) : (
                              <>
                                {hasPresencial && (
                                  <button
                                    onClick={() => {
                                      setSelectedService(`${service.name}-presencial`);
                                      setIsBookingModalOpen(true);
                                    }}
                                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="text-xs sm:text-sm font-medium">
                                      Presencial: {formatPrice(parseInt(service.presencialCost))}
                                    </span>
                                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                                  </button>
                                )}
                                {hasOnline && (
                                  <button
                                    onClick={() => {
                                      setSelectedService(`${service.name}-online`);
                                      setIsBookingModalOpen(true);
                                    }}
                                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="text-xs sm:text-sm font-medium">
                                      En línea: {formatPrice(parseInt(service.onlineCost))}
                                    </span>
                                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Productos Digitales */}
            {professional.is_verified && digitalProducts.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Programas
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Meditaciones, ebooks y recursos creados por {professional.first_name}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {digitalProducts.map((product) => (
                    <DigitalProductCard
                      key={product.id}
                      product={product}
                      showProfessional={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Retos */}
            {challenges.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Retos Disponibles
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Desafíos creados por {professional.first_name} para ayudarte a alcanzar tus metas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {challenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={{
                        ...challenge,
                        professional_first_name: professional.first_name,
                        professional_last_name: professional.last_name,
                        professional_photo: professional.profile_photo,
                        professional_profession: professional.profession,
                        professional_is_verified: professional.is_verified || false,
                      }}
                      userId={patientId || undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ubicación con mapa */}
            {professional.address && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
                  Ubicación
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="text-foreground">
                      <p className="font-semibold text-base sm:text-lg">
                        {professional.address}
                      </p>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {professional.city}, {professional.state}, {professional.country}
                      </p>
                    </div>
                  </div>
                  
                  {/* Mapa de Mapbox */}
                  <div className="w-full h-80 rounded-xl border border-border shadow-lg overflow-hidden">
                    <MapboxMap 
                      address={`${professional.address}, ${professional.city}, ${professional.state}, ${professional.country}`}
                      className="w-full h-full"
                      height="320px"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Certificaciones */}
            {professional.certifications && professional.certifications.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
                  Certificaciones y Educación
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {professional.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base text-foreground font-medium">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sistema de reseñas */}
            <div className="space-y-6">
              {/* Formulario de reseña (solo si el usuario es diferente al profesional) */}
              {currentUser && currentUser.id !== professional.user_id && (
                <ReviewForm
                  professionalId={professional.user_id}
                  patientId={currentUser.id}
                  existingReview={userReview || editingReview || undefined}
                  onSuccess={() => {
                    setRefreshReviews(prev => prev + 1);
                    setEditingReview(null);
                  }}
                />
              )}

              {/* Lista de reseñas */}
              <ReviewsList
                professionalId={professional.user_id}
                currentUserId={currentUser?.id}
                onEditReview={(review) => setEditingReview(review)}
                refreshTrigger={refreshReviews}
              />
            </div>
          </div>

          {/* Sidebar - Oculto en móvil */}
          <div className="hidden lg:block space-y-6 sm:space-y-8">
            {/* Información de contacto y reserva */}
            <div className="sticky top-8">
              <div className="space-y-6">
                {/* Resumen de precios */}
                {(() => {
                  // Calcular precios mínimos
                  const allPrices: number[] = [];
                  professional.services.forEach(service => {
                    if (service.presencialCost && service.presencialCost !== '') {
                      allPrices.push(parseInt(service.presencialCost));
                    }
                    if (service.onlineCost && service.onlineCost !== '') {
                      allPrices.push(parseInt(service.onlineCost));
                    }
                  });

                  if (allPrices.length === 0) return null;

                  return (
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">
                        Precios desde
                      </h3>
                      <div className="space-y-3">
                        {(() => {
                          const minPrice = Math.min(...allPrices);
                          const maxPrice = Math.max(...allPrices);

                          return (
                            <div className="text-center p-4 rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20">
                              <div className="text-2xl font-bold text-primary mb-1">
                                {formatPrice(minPrice)}
                              </div>
                              {minPrice !== maxPrice && (
                                <div className="text-sm text-muted-foreground">
                                  hasta {formatPrice(maxPrice)}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-2">
                                por sesión
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {/* Experiencia */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">
                    Experiencia
                  </h3>
                  <div className="p-4 sm:p-5 rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm sm:text-base leading-relaxed font-medium">
                          {getExperienceDescription(professional.experience)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="space-y-2 sm:space-y-3">
                  {!isAuthenticated ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => router.push(`/signup?redirect=${encodeURIComponent(`/explore/professional/${slugParam}`)}`)}
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg text-white touch-manipulation"
                      >
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Registrarse para reservar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/explore/professional/${slugParam}`)}`)}
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl"
                      >
                        Ya tengo cuenta
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔵 Click en botón Reservar cita (servicios)');
                          setIsBookingModalOpen(true);
                          console.log('🔵 Estado isBookingModalOpen actualizado a:', true);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔵 TouchEnd en botón Reservar cita (servicios)');
                          setIsBookingModalOpen(true);
                          console.log('🔵 Estado isBookingModalOpen actualizado a:', true);
                        }}
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg text-white touch-manipulation"
                        style={{ 
                          touchAction: 'manipulation', 
                          WebkitTapHighlightColor: 'transparent',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          WebkitTouchCallout: 'none',
                          position: 'relative',
                          zIndex: 10,
                          pointerEvents: 'auto'
                        }}
                      >
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Reservar cita
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await handleOpenMessageDialog();
                        }}
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl"
                      >
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Enviar Mensaje
                      </Button>
                    </>
                  )}
                </div>
                      </div>
                    </div>
        </div>
      </div>
    </div>
  );

  // Si no está autenticado, mostrar con navbar público
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            {renderProfessionalContent()}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Si está autenticado, mostrar con layout normal (navbar del dashboard)
  return (
    <>
      {renderProfessionalContent()}

      {/* Dialog de Solicitud de Cotización */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={(open) => {
        setIsQuoteDialogOpen(open);
        if (!open) {
          setQuoteDetails("");
          setSelectedServiceForQuote(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Solicitar Cotización
            </DialogTitle>
          </DialogHeader>
          
          {selectedServiceForQuote && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground mb-1">Servicio:</p>
                <p className="text-base text-muted-foreground">{selectedServiceForQuote.name}</p>
                {selectedServiceForQuote.description && (
                  <div 
                    className="text-sm text-muted-foreground mt-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedServiceForQuote.description }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quoteDetails" className="text-base font-semibold">
                  Describe qué necesitas a detalle *
                </Label>
                <Textarea
                  id="quoteDetails"
                  value={quoteDetails}
                  onChange={(e) => setQuoteDetails(e.target.value)}
                  placeholder="Por favor, describe qué necesitas del servicio, tus objetivos, preferencias, y cualquier detalle relevante..."
                  rows={6}
                  className="text-base"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {quoteDetails.length} / 2000 caracteres
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsQuoteDialogOpen(false);
                    setQuoteDetails("");
                    setSelectedServiceForQuote(null);
                  }}
                  disabled={quoteLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRequestQuote}
                  disabled={quoteLoading || !quoteDetails.trim()}
                >
                  {quoteLoading ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Mensajes */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
          <DialogHeader className="shrink-0 p-4 border-b">
            <DialogTitle>
              Mensaje a {professional?.first_name} {professional?.last_name}
            </DialogTitle>
          </DialogHeader>
          {conversationId && professional && (
            <div className="flex-1 min-h-0">
              <DirectMessageChat
                conversationId={conversationId}
                 currentUserId={patientId || ''}
                otherUser={{
                  id: professional.id,
                  name: `${professional.first_name} ${professional.last_name}`,
                  avatar_url: professional.profile_photo,
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pago */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              Confirmar Reserva
            </DialogTitle>
          </DialogHeader>
          
          {paymentData && (
            <div className="space-y-4 py-4">
              <div className="bg-linear-to-r from-primary/5 to-primary/10 rounded-lg p-4 space-y-3 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha:
                  </span>
                  <span className="text-foreground font-semibold">
                    {new Date(paymentData.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora:
                  </span>
                  <span className="text-foreground font-semibold">{paymentData.time}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Profesional:
                  </span>
                  <span className="text-foreground font-semibold">{paymentData.professionalName}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-primary/20">
                  <span className="text-muted-foreground flex items-center gap-2">
                    💰 Costo:
                  </span>
                  <span className="text-foreground font-bold text-lg">
                    ${paymentData.cost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 text-center mb-2">
                  💳 <strong>Pago seguro:</strong> Completa tu pago para confirmar la cita
                </p>
                <p className="text-xs text-blue-700 text-center">
                  Tu información de pago está protegida con encriptación de nivel bancario.
                </p>
              </div>

              {/* Payment Button */}
              <PaymentButton
                serviceAmount={paymentData.cost}
                professionalId={paymentData.professionalId}
                appointmentDate={paymentData.date}
                appointmentTime={paymentData.time}
                appointmentType={(() => {
                  const modality = paymentData.service.split('-')[1];
                  // Asegurar que solo se envíen valores válidos para appointment_type
                  return modality === 'online' ? 'online' : 'presencial';
                })()}
                notes={appointmentForm.notes}
                description={`Consulta con ${paymentData.professionalName}`}
                onError={(error) => {
                  // Determinar el tipo de error y mostrar el FriendlyErrorDialog
                  let errorType: 'error' | 'warning' | 'info' | 'success' = 'error';
                  let title = 'Error al Reservar';
                  let description = 'Por favor, revisa la información e intenta nuevamente.';
                  
                  if (error.includes('configurado su cuenta de pagos')) {
                    errorType = 'warning';
                    title = 'Cuenta de Pagos No Configurada';
                    description = 'El profesional aún no ha configurado su cuenta para recibir pagos. Por favor, contacta al profesional o intenta con otro experto.';
                  } else if (error.includes('completamente configurada')) {
                    errorType = 'info';
                    title = 'Configuración en Proceso';
                    description = 'La cuenta de pagos del profesional está en proceso de configuración. Por favor, intenta más tarde o contacta al profesional.';
                  } else if (error.includes('ya tiene un pago confirmado')) {
                    errorType = 'info';
                    title = 'Pago Ya Confirmado';
                    description = 'Esta cita ya tiene un pago confirmado. No es necesario pagar nuevamente.';
                  } else if (error.includes('cita reservada en este horario')) {
                    errorType = 'warning';
                    title = 'Horario No Disponible';
                    description = 'Ya tienes una cita reservada en este horario con este profesional. Por favor, selecciona otro horario disponible.';
                  }
                  
                  setFriendlyErrorData({
                    title,
                    message: error,
                    type: errorType,
                    description
                  });
                  setIsFriendlyErrorOpen(true);
                  setIsPaymentModalOpen(false);
                }}
              />
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Error */}
      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              Error al Reservar
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 text-center">
                {errorMessage}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setIsErrorModalOpen(false)}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Modal de Foto de Perfil */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              {professional.first_name} {professional.last_name}
              {professional.is_verified && <VerifiedBadge size={20} />}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative w-full aspect-square">
            <Image
              src={professional.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${professional.first_name} ${professional.last_name}`)}&background=random`}
              alt={`${professional.first_name} ${professional.last_name}`}
              fill
              className="object-contain rounded-lg"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Friendly Error Dialog */}
      {friendlyErrorData && (
        <FriendlyErrorDialog
          open={isFriendlyErrorOpen}
          onOpenChange={setIsFriendlyErrorOpen}
          title={friendlyErrorData.title}
          message={friendlyErrorData.message}
          type={friendlyErrorData.type}
          description={friendlyErrorData.description}
          actionText="Entendido"
          onAction={() => {
            setIsFriendlyErrorOpen(false);
            setFriendlyErrorData(null);
          }}
        />
      )}

      {/* Booking Dialog - Movido fuera de contenedores anidados */}
      <BookingDialog 
        open={isBookingModalOpen} 
        onOpenChange={(open) => {
          console.log('🔵 BookingDialog onOpenChange llamado con:', open);
          setIsBookingModalOpen(open);
        }}
        title={`Reservar cita con ${professional?.first_name} ${professional?.last_name}`}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Selección de fecha y hora */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Selecciona fecha y hora</h3>
                
                <WideCalendar
                  professionalId={professional?.id || ''}
                  onTimeSelect={(date, time) => {
                    setSelectedDate(date);
                    setSelectedTime(time);
                  }}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  className="w-full"
                />
              </div>
            </div>

            {/* Formulario de información */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Información</h3>
                
                {/* Tipo de servicio */}
                <div>
                  <Label htmlFor="service" className="text-base font-semibold text-foreground">
                    Tipo de servicio
                  </Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="mt-3 h-12 text-base w-full">
                      <SelectValue placeholder="Selecciona el tipo de servicio" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {(() => {
                        console.log('🔍 Debug servicios:', {
                          professional: professional,
                          services: professional?.services,
                          servicesLength: professional?.services?.length
                        });
                        return null;
                      })()}
                      {professional?.services && professional.services.length > 0 ? (
                        professional.services.map((service, index) => {
                          const hasPresencial = service.presencialCost && service.presencialCost !== '' && service.presencialCost !== '0' && Number(service.presencialCost) > 0;
                          const hasOnline = service.onlineCost && service.onlineCost !== '' && service.onlineCost !== '0' && Number(service.onlineCost) > 0;

                          return (
                            <div key={index}>
                              {hasPresencial && (
                                <SelectItem value={`${service.name}-presencial`} className="text-base py-3">
                                  {service.name} - Presencial - {formatPrice(parseInt(service.presencialCost))}
                                </SelectItem>
                              )}
                              {hasOnline && (
                                <SelectItem value={`${service.name}-online`} className="text-base py-3">
                                  {service.name} - En línea - {formatPrice(parseInt(service.onlineCost))}
                                </SelectItem>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No hay servicios disponibles
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {professional?.services && professional.services.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      Este profesional no tiene servicios configurados
                    </p>
                  )}
                </div>

                {/* Campos del formulario */}
                <div className="mt-2 space-y-4">
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-base font-semibold text-foreground">
                        Nombre
                      </Label>
                      <Input
                        id="name"
                        value={appointmentForm.name}
                        readOnly
                        className="mt-2 h-12 bg-muted/50 cursor-not-allowed text-base"
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-base font-semibold text-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={appointmentForm.email}
                        readOnly
                        className="mt-2 h-12 bg-muted/50 cursor-not-allowed text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-base font-semibold text-foreground">
                        Teléfono
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={appointmentForm.phone}
                        readOnly
                        className="mt-2 h-12 bg-muted/50 cursor-not-allowed text-base"
                        placeholder="+52 55 1234 5678"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-base font-semibold text-foreground">
                        Notas (opcional)
                      </Label>
                      <Textarea
                        id="notes"
                        value={appointmentForm.notes}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="mt-2 text-base"
                        placeholder="Cuéntanos sobre tu consulta..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen de la cita y botones */}
                {(selectedDate || selectedTime || selectedService) && (
                  <div className="border-t border-border pt-6 mt-6">
                    <h4 className="text-xl font-bold text-foreground mb-4">Resumen</h4>
                    <div className="bg-muted/50 rounded-xl p-6 space-y-3">
                      {selectedDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-base text-muted-foreground">Fecha:</span>
                          <span className="text-base text-foreground font-semibold">
                            {(() => {
                              // Parsear la fecha manualmente para evitar problemas de zona horaria
                              const [year, month, day] = selectedDate.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            })()}
                          </span>
                        </div>
                      )}
                      {selectedTime && (
                        <div className="flex justify-between items-center">
                          <span className="text-base text-muted-foreground">Hora:</span>
                          <span className="text-base text-foreground font-semibold">{selectedTime}</span>
                        </div>
                      )}
                      {selectedService && (
                        <div className="flex justify-between items-center">
                          <span className="text-base text-muted-foreground">Servicio:</span>
                          <span className="text-base text-foreground font-semibold">
                            {(() => {
                              const [serviceName, serviceModality] = selectedService.split('-');
                              const service = professional?.services.find(s => s.name === serviceName);
                              const modalityText = serviceModality === 'presencial' ? 'Presencial' : 'En línea';
                              const cost = serviceModality === 'presencial' 
                                ? parseInt(service?.presencialCost || '0')
                                : parseInt(service?.onlineCost || '0');
                              return `${serviceName} - ${modalityText} - ${formatPrice(cost)}`;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 mt-6">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsBookingModalOpen(false)}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          setIsBookingModalOpen(false);
                        }}
                        className="w-full sm:w-auto h-12 text-base order-2 sm:order-1 touch-manipulation"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleBookingSubmit}
                        onTouchEnd={(e) => {
                          if (!selectedDate || !selectedTime || !selectedService || bookingLoading) {
                            return;
                          }
                          e.preventDefault();
                          handleBookingSubmit();
                        }}
                        disabled={!selectedDate || !selectedTime || !selectedService || bookingLoading}
                        className="w-full sm:w-auto h-12 text-base font-semibold order-1 sm:order-2 touch-manipulation"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      >
                        {bookingLoading ? 'Reservando...' : 'Confirmar reserva'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </BookingDialog>
    </>
  );

  // Si no está autenticado, mostrar con navbar público
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            {renderProfessionalContent()}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Si está autenticado, mostrar con layout normal (navbar del dashboard)
  return (
    <div className="min-h-screen bg-background">
      {renderProfessionalContent()}
    </div>
  );
}
