"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  CheckCircle,
  XCircle,
  CreditCard,
  Copy,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MapboxMap from "@/components/ui/mapbox-map";
import ProfessionalGallery from "@/components/ui/professional-gallery";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingDialog } from "@/components/ui/booking-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PaymentButton from "@/components/ui/payment-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function ProfessionalProfilePage() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<{
    date: string;
    time: string;
    professional: string;
    cost: number;
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
  const [availableTimes, setAvailableTimes] = useState<Array<{time: string, display: string, fullDateTime: string, status: 'available' | 'occupied' | 'blocked'}>>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const params = useParams();
  const supabase = createClient();
  
  const patientId = params.id as string;
  const professionalId = params.slug as string; // Ahora es el ID del profesional, no un slug

  // Obtener datos del profesional y usuario actual
  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Obtener nombre completo del usuario
          const firstName = user.user_metadata?.first_name || '';
          const lastName = user.user_metadata?.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          const userData: CurrentUser = {
            id: user.id,
            name: fullName || user.email?.split('@')[0] || 'Usuario',
            email: user.email || '',
            phone: user.user_metadata?.phone || ''
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
          .single();

        if (error) {
          console.error('Error fetching professional:', error);
          return;
        }

        // Obtener servicios del profesional desde la tabla professional_services
        const { data: servicesData, error: servicesError } = await supabase
          .from('professional_services')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('isactive', true)
          .order('created_at', { ascending: true });

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        }

        // Convertir servicios de la nueva estructura a la estructura esperada
        // Agrupar servicios por nombre para combinar modalidades
        const servicesMap = new Map();
        
        (servicesData || []).forEach(service => {
          console.log('🔍 Procesando servicio:', service);
          
          const existing = servicesMap.get(service.name);
          
          if (existing) {
            // Si ya existe, actualizar costos según la modalidad
            if (service.modality === 'presencial') {
              existing.presencialCost = service.cost ? service.cost.toString() : '';
            } else if (service.modality === 'online') {
              existing.onlineCost = service.cost ? service.cost.toString() : '';
            } else if (service.modality === 'both') {
              existing.presencialCost = service.cost ? service.cost.toString() : '';
              existing.onlineCost = service.cost ? service.cost.toString() : '';
            }
          } else {
            // Crear nuevo servicio
            servicesMap.set(service.name, {
              name: service.name,
              description: service.description || '',
              presencialCost: (service.modality === 'presencial' || service.modality === 'both') && service.cost ? service.cost.toString() : '',
              onlineCost: (service.modality === 'online' || service.modality === 'both') && service.cost ? service.cost.toString() : ''
            });
          }
        });
        
        const convertedServices = Array.from(servicesMap.values());
        
        // Filtrar servicios que tengan al menos un costo configurado
        const validServices = convertedServices.filter(service => 
          (service.presencialCost && service.presencialCost !== '') || 
          (service.onlineCost && service.onlineCost !== '')
        );
        
        console.log('📋 Servicios encontrados:', servicesData);
        console.log('📋 Servicios convertidos:', convertedServices);
        console.log('📋 Servicios válidos:', validServices);
        console.log('📋 Cantidad de servicios válidos:', validServices.length);
        
        // Debug detallado de cada servicio
        convertedServices.forEach((service, index) => {
          console.log(`📋 Servicio ${index}:`, {
            name: service.name,
            presencialCost: service.presencialCost,
            onlineCost: service.onlineCost,
            hasPresencial: service.presencialCost && service.presencialCost !== '',
            hasOnline: service.onlineCost && service.onlineCost !== '',
            isValid: (service.presencialCost && service.presencialCost !== '') || (service.onlineCost && service.onlineCost !== '')
          });
        });

        // Intentar obtener el avatar del perfil del usuario
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', professionalData.user_id)
          .single();
        
        // Priorizar avatar_url del perfil, luego profile_photo de la aplicación
        const finalProfilePhoto = profileData?.avatar_url || professionalData.profile_photo;
        
        setProfessional({
          ...professionalData,
          profile_photo: finalProfilePhoto,
          services: validServices
        });

        // Verificar si es favorito
        if (user) {
          const { data: favoriteData } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('professional_id', professionalData.id)
            .single();

          setIsFavorite(!!favoriteData);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [professionalId, patientId, supabase]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  const getServiceTypeIcon = () => {
    if (!professional) return <MessageCircle className="h-4 w-4" />;
    
    const hasPresencial = professional.services.some(s => s.presencialCost && s.presencialCost !== '');
    const hasOnline = professional.services.some(s => s.onlineCost && s.onlineCost !== '');
    
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
    
    const hasPresencial = professional.services.some(s => s.presencialCost && s.presencialCost !== '');
    const hasOnline = professional.services.some(s => s.onlineCost && s.onlineCost !== '');
    
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
      return `${experienceWithYears} - Profesional en desarrollo con experiencia inicial y compromiso con el crecimiento continuo.`;
    } else if (years >= 3 && years < 5) {
      return `${experienceWithYears} - Experiencia consolidada en el campo, con habilidades desarrolladas y enfoque en resultados.`;
    } else if (years >= 5 && years < 10) {
      return `${experienceWithYears} - Experiencia sólida y amplia, reconocido por su profesionalismo y resultados consistentes.`;
    } else if (years >= 10 && years < 15) {
      return `${experienceWithYears} - Experto con una década de experiencia, líder en su especialidad y mentor de otros profesionales.`;
    } else if (years >= 15 && years < 20) {
      return `${experienceWithYears} - Profesional senior con amplia trayectoria, reconocido por su expertise y contribuciones al campo.`;
    } else {
      return `${experienceWithYears} - Maestro en su especialidad con décadas de experiencia, referente y autoridad en el área.`;
    }
  };


  // Función para compartir el perfil del profesional
  const handleShare = async () => {
    if (!professional) return;

    const shareData = {
      title: `${professional.first_name} ${professional.last_name} - ${professional.profession}`,
      text: `Conoce a ${professional.first_name} ${professional.last_name}, especialista en ${professional.specializations.join(', ')}. ${professional.biography || ''}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: mostrar modal con opciones de compartir
        setIsShareModalOpen(true);
      }
    } catch (error) {
      // Solo mostrar modal si no es un error de cancelación
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error al compartir:', error);
      }
      // Siempre mostrar modal como fallback
      setIsShareModalOpen(true);
    }
  };

  // Función para compartir en redes sociales específicas
  const shareToSocial = (platform: string) => {
    if (!professional) return;

    const shareText = `Conoce a ${professional.first_name} ${professional.last_name}, especialista en ${professional.specializations.join(', ')}`;
    const url = window.location.href;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(shareText)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(`${professional.first_name} ${professional.last_name} - ${professional.profession}`)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Enlace copiado al portapapeles');
        setIsShareModalOpen(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setIsShareModalOpen(false);
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

  // Generar horarios disponibles para una fecha específica - con colchón de 30 minutos
  const getAvailableTimes = async (date: string) => {
    try {
      setLoadingTimes(true);
      
      // Obtener horarios de trabajo del profesional
      const { data: professionalData, error: profError } = await supabase
        .from('professional_applications')
        .select('working_start_time, working_end_time, working_days')
        .eq('id', professional?.id)
        .single();

      if (profError) {
        console.error('Error fetching professional working hours:', profError);
      }

      // Usar horarios del profesional o valores por defecto
      const startTime = professionalData?.working_start_time || '09:00';
      const endTime = professionalData?.working_end_time || '18:00';
      const workingDays = professionalData?.working_days || [1, 2, 3, 4, 5];
      
      // Verificar si la fecha seleccionada es un día de trabajo
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay(); // Convertir domingo de 0 a 7
      
      if (!workingDays.includes(dayOfWeek)) {
        console.log(`📅 ${date} no es un día de trabajo del profesional`);
        setAvailableTimes([]);
        return [];
      }
      
      // Convertir a números para cálculos
      const [startHour] = startTime.split(':').map(Number);
      const [endHour] = endTime.split(':').map(Number);
      
      console.log(`🕐 Horarios de trabajo: ${startTime} - ${endTime}`);
      
      // Obtener citas existentes para esta fecha y profesional
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, appointment_type')
        .eq('professional_id', professional?.id)
        .eq('appointment_date', date)
        .eq('status', 'confirmed'); // Solo citas confirmadas

      if (error) {
        console.error('Error fetching appointments:', error);
      }

      // Obtener bloqueos de disponibilidad para esta fecha
      const { data: availabilityBlocks, error: blocksError } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professional?.id)
        .lte('start_date', date)
        .or(`end_date.is.null,end_date.gte.${date}`);

      if (blocksError) {
        console.error('Error fetching availability blocks:', blocksError);
      }

      console.log('🚫 Bloqueos encontrados para', date, ':', availabilityBlocks);

      // Crear array de horarios bloqueados (cita + 30 min de colchón)
      const blockedTimes = new Set();
      const occupiedTimes = new Set(); // Para mostrar como ocupados
      
      if (existingAppointments) {
        console.log('📅 Citas existentes encontradas:', existingAppointments);
        
        existingAppointments.forEach(appointment => {
          const [startHour, startMinute] = appointment.appointment_time.split(':').map(Number);
          
          // Asumir duración de 50 minutos por cita
          const sessionDuration = 50;
          const bufferTime = 30; // Colchón de 30 minutos
          
          console.log(`🕐 Procesando cita: ${startHour}:${startMinute.toString().padStart(2, '0')}`);
          
          // Marcar como ocupado el horario de la cita
          const occupiedTimeString = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
          occupiedTimes.add(occupiedTimeString);
          console.log(`❌ Marcando como ocupado: ${occupiedTimeString}`);
          
          // Calcular el tiempo de finalización (inicio + duración + colchón)
          const totalMinutes = startHour * 60 + startMinute + sessionDuration + bufferTime;
          const endHour = Math.floor(totalMinutes / 60);
          const endMinute = totalMinutes % 60;
          
          console.log(`⏰ Tiempo de finalización (con colchón): ${endHour}:${endMinute.toString().padStart(2, '0')}`);
          
          // Bloquear todos los horarios desde el inicio hasta el final (incluyendo colchón)
          const startTimeMinutes = startHour * 60 + startMinute;
          const endTimeMinutes = endHour * 60 + endMinute;
          
          // Bloquear todos los horarios que caigan dentro del rango
          for (let minutes = startTimeMinutes; minutes < endTimeMinutes; minutes += 60) {
            const blockHour = Math.floor(minutes / 60);
            const blockMinute = minutes % 60;
            const timeString = `${blockHour.toString().padStart(2, '0')}:${blockMinute.toString().padStart(2, '0')}`;
            blockedTimes.add(timeString);
            console.log(`🚫 Bloqueando horario: ${timeString}`);
          }
        });
        
        console.log('🔒 Horarios bloqueados:', Array.from(blockedTimes));
        console.log('📋 Horarios ocupados:', Array.from(occupiedTimes));
      }

      // Procesar bloqueos de disponibilidad
      if (availabilityBlocks && availabilityBlocks.length > 0) {
        availabilityBlocks.forEach(block => {
          if (block.block_type === 'full_day') {
            // Si es bloqueo de día completo, marcar todos los horarios como bloqueados
            console.log('🚫 Día completo bloqueado:', date);
            // Agregamos un marcador especial para indicar que todo el día está bloqueado
            blockedTimes.add('FULL_DAY_BLOCKED');
          } else if (block.block_type === 'time_range' && block.start_time && block.end_time) {
            // Si es bloqueo de rango de horas, bloquear solo ese rango
            const [blockStartHour, blockStartMinute] = block.start_time.split(':').map(Number);
            const [blockEndHour, blockEndMinute] = block.end_time.split(':').map(Number);
            
            const blockStartMinutes = blockStartHour * 60 + blockStartMinute;
            const blockEndMinutes = blockEndHour * 60 + blockEndMinute;
            
            console.log(`🚫 Bloqueando rango: ${block.start_time} - ${block.end_time}`);
            
            // Marcar todos los horarios en el rango como bloqueados
            for (let hour = startHour; hour < endHour; hour++) {
              for (let minute = 0; minute < 60; minute += 60) {
                const timeMinutes = hour * 60 + minute;
                if (timeMinutes >= blockStartMinutes && timeMinutes < blockEndMinutes) {
                  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  blockedTimes.add(timeString);
                  console.log(`🚫 Bloqueando horario: ${timeString}`);
                }
              }
            }
          }
        });
      }

      // Si hay un bloqueo de día completo, no generar horarios
      if (blockedTimes.has('FULL_DAY_BLOCKED')) {
        console.log('🚫 Día completo bloqueado, no hay horarios disponibles');
        setAvailableTimes([]);
        return [];
      }

      const times = [];
      const sessionDuration = 50;
      const breakTime = 10;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += sessionDuration + breakTime) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Determinar el estado del horario
          let status: 'available' | 'occupied' | 'blocked' = 'available';
          if (blockedTimes.has(timeString)) {
            status = 'blocked';
          } else if (occupiedTimes.has(timeString)) {
            status = 'occupied';
          }
          
          times.push({
            time: timeString,
            display: timeString,
            fullDateTime: `${date}T${timeString}`,
            status: status
          });
        }
      }
      
      console.log('⏰ Horarios generados:', times);
      setAvailableTimes(times);
      return times;
    } catch (error) {
      console.error('Error generating available times:', error);
      setAvailableTimes([]);
      return [];
    } finally {
      setLoadingTimes(false);
    }
  };

  // Función para manejar el cambio de fecha
  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
    await getAvailableTimes(date);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Cargando profesional...</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header del profesional */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
              <div 
                className="relative flex-shrink-0 cursor-pointer group"
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
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                  {professional.first_name} {professional.last_name}
                </h1>
                <p className="text-base sm:text-lg text-primary font-medium mb-2 sm:mb-3">
                  {professional.profession}
                </p>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-primary/10 rounded-full">
                    {getServiceTypeIcon()}
                    <span className="text-xs sm:text-sm text-primary font-medium">
                      {getServiceTypeText()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full lg:w-auto justify-end">
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
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                  {professional.biography}
                </p>
              </div>
            )}

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
                  {professional.services.filter(service => 
                    (service.presencialCost && service.presencialCost !== '') || 
                    (service.onlineCost && service.onlineCost !== '')
                  ).map((service, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-foreground font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                            {service.name}
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {service.description}
                          </p>
                          <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 sm:mt-3">
                            {service.presencialCost && service.presencialCost !== '' && (
                              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-primary/10 rounded-full">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                <span className="text-xs sm:text-sm text-primary font-medium">
                                  Presencial: {formatPrice(parseInt(service.presencialCost))}
                                </span>
                              </div>
                            )}
                            {service.onlineCost && service.onlineCost !== '' && (
                              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-primary/10 rounded-full">
                                <Monitor className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                <span className="text-xs sm:text-sm text-primary font-medium">
                                  En línea: {formatPrice(parseInt(service.onlineCost))}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                      className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base text-foreground font-medium">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 sm:space-y-8">
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
                            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
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
                  <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
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
                  <Button 
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                  >
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Reservar cita
                  </Button>
                  
                  <BookingDialog 
                    open={isBookingModalOpen} 
                    onOpenChange={setIsBookingModalOpen}
                    title={`Reservar cita con ${professional?.first_name} ${professional?.last_name}`}
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Selección de fecha y hora */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-xl font-bold text-foreground mb-4">Fecha y hora</h3>
                            
                            {/* Fechas disponibles */}
                            <div>
                              <Label className="text-base font-semibold text-foreground">Fecha</Label>
                              <div className="grid grid-cols-3 gap-3 mt-3 max-h-60 overflow-y-auto">
                                {getAvailableDates().map((dateOption) => (
                                  <button
                                    key={dateOption.date}
                                    onClick={() => handleDateChange(dateOption.date)}
                                    className={`p-4 text-left rounded-xl border-2 transition-all hover:shadow-md ${
                                      selectedDate === dateOption.date
                                        ? "border-primary bg-primary/10 text-primary shadow-lg"
                                        : "border-border hover:border-primary/50 bg-background"
                                    }`}
                                  >
                                    <div className="text-base font-semibold">{dateOption.dayName}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {dateOption.display.split(', ')[1]}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Horarios disponibles */}
                            {selectedDate && (
                              <div>
                                <Label className="text-base font-semibold text-foreground">Horario</Label>
                                {loadingTimes ? (
                                  <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="ml-3 text-base text-muted-foreground">Cargando horarios...</span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-6 gap-3 mt-3 max-h-60 overflow-y-auto">
                                    {availableTimes.map((timeOption) => {
                                      const isAvailable = timeOption.status === 'available';
                                      const isOccupied = timeOption.status === 'occupied';
                                      const isBlocked = timeOption.status === 'blocked';
                                      
                                      return (
                                        <button
                                          key={timeOption.time}
                                          onClick={() => isAvailable ? setSelectedTime(timeOption.time) : null}
                                          disabled={!isAvailable}
                                          className={`p-3 text-center rounded-xl border-2 transition-all relative hover:shadow-md ${
                                            selectedTime === timeOption.time
                                              ? "border-primary bg-primary/10 text-primary shadow-lg"
                                              : isAvailable
                                              ? "border-border hover:border-primary/50 bg-background hover:bg-primary/5"
                                              : isOccupied
                                              ? "border-red-200 bg-red-50 text-red-600 cursor-not-allowed"
                                              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                          }`}
                                        >
                                          <div className={`text-base font-semibold ${
                                            isOccupied ? "line-through" : ""
                                          }`}>
                                            {timeOption.display}
                                          </div>
                                          {isOccupied && (
                                            <div className="text-xs text-red-500 mt-1">
                                              Ocupado
                                            </div>
                                          )}
                                          {isBlocked && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              No disponible
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                    {availableTimes.length === 0 && (
                                      <div className="col-span-6 text-center py-8 text-base text-muted-foreground">
                                        No hay horarios disponibles para esta fecha
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
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
                                <SelectTrigger className="mt-3 h-12 text-base">
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
                                      const hasPresencial = service.presencialCost && service.presencialCost !== '';
                                      const hasOnline = service.onlineCost && service.onlineCost !== '';
                                      
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
                            <div className="space-y-4">
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">
                                  ℹ️ Los datos se obtienen de tu perfil
                                </p>
                              </div>
                              
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
                          </div>
                        </div>
                      </div>

                      {/* Resumen de la cita */}
                      {(selectedDate || selectedTime || selectedService) && (
                        <div className="border-t border-border pt-6 mt-6">
                          <h4 className="text-xl font-bold text-foreground mb-4">Resumen</h4>
                          <div className="bg-muted/50 rounded-xl p-6 space-y-3">
                            {selectedDate && (
                              <div className="flex justify-between items-center">
                                <span className="text-base text-muted-foreground">Fecha:</span>
                                <span className="text-base text-foreground font-semibold">
                                  {getAvailableDates().find(d => d.date === selectedDate)?.display}
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
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 mt-6 border-t border-border">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setIsBookingModalOpen(false)}
                          className="w-full sm:w-auto h-12 text-base"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="lg"
                          onClick={handleBookingSubmit}
                          disabled={!selectedDate || !selectedTime || !selectedService || bookingLoading}
                          className="w-full sm:w-auto h-12 text-base"
                        >
                          {bookingLoading ? 'Reservando...' : 'Confirmar reserva'}
                        </Button>
                      </div>
                    </div>
                  </BookingDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 space-y-3 border border-primary/20">
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
                    ${paymentData.cost.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 text-center mb-2">
                  💳 <strong>Pago de comisión:</strong> Para confirmar tu cita, paga la comisión de reserva
                </p>
                <p className="text-xs text-blue-700 text-center">
                  El monto total de la consulta lo pagarás directamente al profesional.
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
                onSuccess={() => {
                  setIsPaymentModalOpen(false);
                  setSuccessData({
                    date: paymentData.date,
                    time: paymentData.time,
                    professional: paymentData.professionalName,
                    cost: paymentData.cost
                  });
                  setIsSuccessModalOpen(true);
                }}
                onError={(error) => {
                  setErrorMessage(`Error en el pago: ${error}`);
                  setIsErrorModalOpen(true);
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

      {/* Modal de Éxito Final (después del pago) */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              ¡Cita Confirmada!
            </DialogTitle>
          </DialogHeader>
          
          {successData && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 text-center mb-2">
                  ✅ <strong>Pago exitoso</strong>
                </p>
                <p className="text-xs text-green-700 text-center">
                  Tu cita ha sido confirmada y el profesional ha sido notificado.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setIsSuccessModalOpen(false);
                window.location.href = `/patient/${patientId}/explore/appointments`;
              }}
            >
              Ver Mis Citas
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

      {/* Modal de Compartir */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Compartir perfil
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex flex-wrap justify-center gap-6">
              {/* WhatsApp */}
              <button
                className="group flex flex-col items-center gap-3 p-4 rounded-full hover:bg-green-50 transition-colors duration-200"
                onClick={() => shareToSocial('whatsapp')}
              >
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                className="group flex flex-col items-center gap-3 p-4 rounded-full hover:bg-blue-50 transition-colors duration-200"
                onClick={() => shareToSocial('facebook')}
              >
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Facebook</span>
              </button>

              {/* Twitter */}
              <button
                className="group flex flex-col items-center gap-3 p-4 rounded-full hover:bg-sky-50 transition-colors duration-200"
                onClick={() => shareToSocial('twitter')}
              >
                <div className="w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Twitter</span>
              </button>

              {/* LinkedIn */}
              <button
                className="group flex flex-col items-center gap-3 p-4 rounded-full hover:bg-blue-50 transition-colors duration-200"
                onClick={() => shareToSocial('linkedin')}
              >
                <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">LinkedIn</span>
              </button>

              {/* Telegram */}
              <button
                className="group flex flex-col items-center gap-3 p-4 rounded-full hover:bg-blue-50 transition-colors duration-200"
                onClick={() => shareToSocial('telegram')}
              >
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">Telegram</span>
              </button>

              {/* Email */}
              <button
                className="group flex flex-col items-center gap-3 p-4 rounded-full hover:bg-gray-50 transition-colors duration-200"
                onClick={() => shareToSocial('email')}
              >
                <div className="w-14 h-14 bg-gray-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Email</span>
              </button>

              {/* Copiar enlace */}
              <button
                className="group flex flex-col items-center gap-3 p-4 rounded-full hover:bg-purple-50 transition-colors duration-200"
                onClick={() => shareToSocial('copy')}
              >
                <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  <Copy className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Copiar</span>
              </button>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsShareModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Foto de Perfil */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {professional.first_name} {professional.last_name}
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
    </div>
  );
}
