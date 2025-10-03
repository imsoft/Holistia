"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<{
    date: string;
    time: string;
    professional: string;
    cost: number;
    appointmentId: string;
    professionalId: string;
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
          const userData: CurrentUser = {
            id: user.id,
            name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
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
          profile_photo: finalProfilePhoto
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
        // Fallback: copiar URL al portapapeles
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      // Fallback adicional: mostrar modal con opciones de compartir
      alert('Enlace copiado al portapapeles');
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

  // Generar horarios disponibles para una fecha específica - simplificado
  const getAvailableTimes = (date: string) => {
    const times = [];
    const startHour = 9;
    const endHour = 18;
    const sessionDuration = 50;
    const breakTime = 10;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += sessionDuration + breakTime) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        times.push({
          time: timeString,
          display: timeString,
          fullDateTime: `${date}T${timeString}`
        });
      }
    }
    return times;
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
      
      // Determinar el costo basado en el tipo de servicio
      const service = professional.services.find(s => 
        (selectedService === 'presencial' && s.presencialCost && s.presencialCost !== '') ||
        (selectedService === 'online' && s.onlineCost && s.onlineCost !== '')
      );
      
      if (!service) {
        setErrorMessage("El servicio seleccionado no está disponible.");
        setIsErrorModalOpen(true);
        setBookingLoading(false);
        return;
      }
      
      const cost = selectedService === 'presencial' 
        ? parseFloat(service.presencialCost || '0')
        : parseFloat(service.onlineCost || '0');
      
      // Crear la cita en la base de datos
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: currentUser.id,
          professional_id: professional.id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          duration_minutes: 50,
          appointment_type: selectedService,
          status: 'pending',
          cost: cost,
          location: selectedService === 'online' ? 'Consulta en línea' : professional.address,
          notes: appointmentForm.notes || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        
        // Mensajes de error más específicos
        if (error.code === '23503') {
          setErrorMessage("Error: El profesional o usuario no es válido.");
        } else if (error.code === '42501') {
          setErrorMessage("No tienes permisos para crear citas. Por favor, verifica tu sesión.");
        } else {
          setErrorMessage(`Error al crear la cita: ${error.message}`);
        }
        setIsErrorModalOpen(true);
        return;
      }
      
      // Preparar datos para el modal de éxito (ahora incluye appointmentId)
      setSuccessData({
        date: selectedDate,
        time: selectedTime,
        professional: `${professional.first_name} ${professional.last_name}`,
        cost: cost,
        appointmentId: newAppointment.id,
        professionalId: professional.id
      });
      
      // Resetear formulario
      setSelectedDate("");
      setSelectedTime("");
      setSelectedService("");
      setAppointmentForm(prev => ({ 
        ...prev,
        notes: "" 
      }));
      setIsBookingModalOpen(false);
      
      // Mostrar modal de éxito
      setIsSuccessModalOpen(true);
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      setErrorMessage("Error inesperado al crear la cita. Por favor, inténtalo de nuevo.");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del profesional */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Image
                  src={professional.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${professional.first_name} ${professional.last_name}`)}&background=random`}
                  alt={`${professional.first_name} ${professional.last_name}`}
                  width={120}
                  height={120}
                  className="h-28 w-28 rounded-full object-cover shadow-lg"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  {professional.first_name} {professional.last_name}
                </h1>
                <p className="text-lg text-primary font-medium mb-3">
                  {professional.profession}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                    {getServiceTypeIcon()}
                    <span className="text-sm text-primary font-medium">
                      {getServiceTypeText()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-10">
            {/* Galería de imágenes */}
            <ProfessionalGallery
              images={professional.gallery || []}
              professionalName={`${professional.first_name} ${professional.last_name}`}
            />

            {/* Biografía */}
            {professional.biography && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Acerca de {professional.first_name}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base max-w-3xl">
                  {professional.biography}
                </p>
              </div>
            )}

            {/* Especialidades */}
            {professional.specializations && professional.specializations.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Especialidades
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {professional.specializations.map((specialization, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">
                        {specialization}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ubicación con mapa */}
            {professional.address && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Ubicación
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-foreground">
                      <p className="font-semibold text-lg">
                        {professional.address}
                      </p>
                      <p className="text-muted-foreground">
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
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Certificaciones y Educación
                </h2>
                <div className="space-y-3">
                  {professional.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Información de contacto y reserva */}
            <div className="sticky top-8">
              <div className="space-y-6">
                {/* Precios */}
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Precios por sesión
                  </h3>
                  <div className="space-y-3">
                    {professional.services.map((service, index) => {
                      const hasPresencial = service.presencialCost && service.presencialCost !== '';
                      const hasOnline = service.onlineCost && service.onlineCost !== '';
                      
                      return (
                        <div key={index}>
                          {hasPresencial && (
                            <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-foreground font-medium">
                                  Presencial
                                </span>
                              </div>
                              <span className="font-bold text-foreground">
                                {formatPrice(parseInt(service.presencialCost))}
                              </span>
                            </div>
                          )}
                          {hasOnline && (
                            <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Monitor className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-foreground font-medium">
                                  En línea
                                </span>
                              </div>
                              <span className="font-bold text-foreground">
                                {formatPrice(parseInt(service.onlineCost))}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Experiencia */}
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Experiencia
                  </h3>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground font-semibold">
                      {professional.experience}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="space-y-3">
                  <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full h-12 font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                        <Calendar className="h-5 w-5 mr-2" />
                        Reservar cita
                      </Button>
                    </DialogTrigger>
                    <DialogContent 
                      className="max-h-[95vh] overflow-y-auto" 
                      style={{ width: '95vw', maxWidth: 'none' }}
                    >
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">
                          Reservar cita con {professional.first_name} {professional.last_name}
                        </DialogTitle>
                      </DialogHeader>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-8">
                          {/* Selección de fecha y hora */}
                          <div className="space-y-8">
                            <h3 className="text-xl font-semibold text-foreground">Selecciona fecha y hora</h3>
                            
                            {/* Fechas disponibles */}
                            <div>
                              <Label className="text-base font-medium text-foreground">Fecha disponible</Label>
                              <div className="grid grid-cols-2 gap-3 mt-3 max-h-64 overflow-y-auto">
                                {getAvailableDates().map((dateOption) => (
                                  <button
                                    key={dateOption.date}
                                    onClick={() => {
                                      setSelectedDate(dateOption.date);
                                      setSelectedTime(""); // Reset time when date changes
                                    }}
                                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                                      selectedDate === dateOption.date
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-primary/50 bg-background"
                                    }`}
                                  >
                                    <div className="text-sm font-medium">{dateOption.dayName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {dateOption.display.split(', ')[1]}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Horarios disponibles */}
                            {selectedDate && (
                              <div>
                                <Label className="text-base font-medium text-foreground">Horario disponible</Label>
                                <div className="grid grid-cols-4 gap-3 mt-3 max-h-64 overflow-y-auto">
                                  {getAvailableTimes(selectedDate).map((timeOption) => (
                                    <button
                                      key={timeOption.time}
                                      onClick={() => setSelectedTime(timeOption.time)}
                                      className={`p-4 text-center rounded-lg border-2 transition-all ${
                                        selectedTime === timeOption.time
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "border-border hover:border-primary/50 bg-background"
                                      }`}
                                    >
                                      <div className="text-sm font-medium">{timeOption.display}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Formulario de información */}
                          <div className="space-y-8">
                            <h3 className="text-xl font-semibold text-foreground">Información de contacto</h3>
                            
                            {/* Tipo de servicio */}
                            <div>
                              <Label htmlFor="service" className="text-sm font-medium text-foreground">
                                Tipo de servicio
                              </Label>
                              <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Selecciona el tipo de servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                  {professional.services.map((service, index) => {
                                    const hasPresencial = service.presencialCost && service.presencialCost !== '';
                                    const hasOnline = service.onlineCost && service.onlineCost !== '';
                                    
                                    return (
                                      <div key={index}>
                                        {hasPresencial && (
                                          <SelectItem value="presencial">
                                            Presencial - {formatPrice(parseInt(service.presencialCost))}
                                          </SelectItem>
                                        )}
                                        {hasOnline && (
                                          <SelectItem value="online">
                                            En línea - {formatPrice(parseInt(service.onlineCost))}
                                          </SelectItem>
                                        )}
                                      </div>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Campos del formulario */}
                            <div className="space-y-6">
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">
                                  ℹ️ Los datos de contacto se obtienen de tu perfil de usuario y no se pueden modificar aquí.
                                </p>
                              </div>
                              
                              <div>
                                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                                  Nombre completo
                                </Label>
                                <Input
                                  id="name"
                                  value={appointmentForm.name}
                                  readOnly
                                  className="mt-1 bg-muted/50 cursor-not-allowed"
                                  placeholder="Tu nombre completo"
                                />
                              </div>

                              <div>
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                  Correo electrónico
                                </Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={appointmentForm.email}
                                  readOnly
                                  className="mt-1 bg-muted/50 cursor-not-allowed"
                                />
                              </div>

                              <div>
                                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                                  Teléfono
                                </Label>
                                <Input
                                  id="phone"
                                  type="tel"
                                  value={appointmentForm.phone}
                                  readOnly
                                  className="mt-1 bg-muted/50 cursor-not-allowed"
                                  placeholder="+52 55 1234 5678"
                                />
                              </div>

                              <div>
                                <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                                  Notas adicionales (opcional)
                                </Label>
                                <Textarea
                                  id="notes"
                                  value={appointmentForm.notes}
                                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                                  className="mt-1"
                                  placeholder="Cuéntanos sobre tu consulta..."
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Resumen de la cita */}
                        {(selectedDate || selectedTime || selectedService) && (
                          <div className="border-t border-border pt-6">
                            <h4 className="text-lg font-semibold text-foreground mb-4">Resumen de tu cita</h4>
                            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                              {selectedDate && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Fecha:</span>
                                  <span className="text-foreground font-medium">
                                    {getAvailableDates().find(d => d.date === selectedDate)?.display}
                                  </span>
                                </div>
                              )}
                              {selectedTime && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Hora:</span>
                                  <span className="text-foreground font-medium">{selectedTime}</span>
                                </div>
                              )}
                              {selectedService && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Servicio:</span>
                                  <span className="text-foreground font-medium">
                                    {selectedService === 'presencial' ? 'Presencial' : 'En línea'} - 
                                    {(() => {
                                      const service = professional.services.find(s => 
                                        (selectedService === 'presencial' && s.presencialCost) ||
                                        (selectedService === 'online' && s.onlineCost)
                                      );
                                      const cost = selectedService === 'presencial' 
                                        ? parseInt(service?.presencialCost || '0')
                                        : parseInt(service?.onlineCost || '0');
                                      return formatPrice(cost);
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-4 pt-8 border-t border-border">
                          <Button
                            variant="outline"
                            onClick={() => setIsBookingModalOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleBookingSubmit}
                            disabled={!selectedDate || !selectedTime || !selectedService || bookingLoading}
                          >
                            {bookingLoading ? 'Reservando...' : 'Confirmar reserva'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Éxito */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              ¡Cita Reservada Exitosamente!
            </DialogTitle>
          </DialogHeader>
          
          {successData && (
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 space-y-3 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha:
                  </span>
                  <span className="text-foreground font-semibold">
                    {new Date(successData.date).toLocaleDateString('es-ES', {
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
                  <span className="text-foreground font-semibold">{successData.time}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Profesional:
                  </span>
                  <span className="text-foreground font-semibold">{successData.professional}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-primary/20">
                  <span className="text-muted-foreground flex items-center gap-2">
                    💰 Costo:
                  </span>
                  <span className="text-foreground font-bold text-lg">
                    ${successData.cost.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 text-center mb-2">
                  💳 <strong>Paso final:</strong> Paga la comisión de reserva para confirmar tu cita
                </p>
                <p className="text-xs text-blue-700 text-center">
                  El monto total de la consulta lo pagarás directamente al profesional.
                </p>
              </div>

              {/* Payment Button */}
              <PaymentButton
                appointmentId={successData.appointmentId}
                serviceAmount={successData.cost}
                professionalId={successData.professionalId}
                description={`Consulta con ${successData.professional}`}
                onSuccess={() => {
                  alert('¡Pago exitoso! Tu cita ha sido confirmada.');
                  window.location.href = `/patient/${patientId}/explore/appointments`;
                }}
                onError={(error) => {
                  setErrorMessage(`Error en el pago: ${error}`);
                  setIsErrorModalOpen(true);
                  setIsSuccessModalOpen(false);
                }}
              />
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsSuccessModalOpen(false)}
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
    </div>
  );
}
