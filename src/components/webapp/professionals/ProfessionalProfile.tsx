"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Heart,
  Share2,
  MessageCircle,
  ChevronLeft,
  Check,
  Shield,
  Award,
  ThumbsUp,
  ArrowRight,
  Globe,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "../../ui/card";

// Tipos para los datos
type ProfessionalProfile = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  location: string;
  description: string;
  image: string;
  coverImage: string;
  tags: string[];
  verified: boolean;
  experience: string;
  education: string[];
  languages: string[];
  services: Service[];
  availability: {
    days: string[];
    hours: string[];
  };
  reviews: Review[];
  socialMedia: {
    website?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  contact: {
    email: string;
    phone: string;
  };
};

type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
};

type Review = {
  id: string;
  user: {
    name: string;
    image: string;
  };
  rating: number;
  date: string;
  comment: string;
  serviceUsed: string;
};

type TimeSlot = {
  time: string;
  available: boolean;
};

export const ProfessionalProfile = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Datos de ejemplo para el perfil del profesional
  const professional: ProfessionalProfile = {
    id: "1",
    name: "Dra. Sofía Mendoza",
    specialty: "Nutricionista Holística",
    rating: 4.9,
    reviewCount: 124,
    location: "Ciudad de México",
    description:
      "Soy nutricionista holística con más de 8 años de experiencia, especializada en medicina funcional y bienestar digestivo. Mi enfoque integra la nutrición basada en evidencia científica con prácticas de medicina tradicional para crear planes personalizados que abordan la raíz de los problemas de salud, no solo los síntomas. Trabajo con pacientes que buscan mejorar su salud digestiva, equilibrar hormonas, aumentar energía y optimizar su bienestar general a través de la alimentación consciente y cambios en el estilo de vida.",
    image: "/placeholder.svg?height=400&width=400",
    coverImage: "/placeholder.svg?height=500&width=1200",
    tags: [
      "Nutrición",
      "Medicina Funcional",
      "Bienestar Digestivo",
      "Alimentación Consciente",
      "Salud Hormonal",
    ],
    verified: true,
    experience: "8 años",
    education: [
      "Doctorado en Nutrición Clínica, Universidad Nacional Autónoma de México",
      "Maestría en Medicina Funcional, Instituto de Medicina Funcional",
      "Certificación en Nutrición Holística, Instituto de Nutrición Integrativa",
    ],
    languages: ["Español", "Inglés", "Francés"],
    services: [
      {
        id: "s1",
        name: "Consulta Inicial",
        description:
          "Evaluación completa de tu estado de salud, historial médico, hábitos alimenticios y estilo de vida para crear un plan personalizado.",
        duration: "90 minutos",
        price: "$1,200 MXN",
      },
      {
        id: "s2",
        name: "Consulta de Seguimiento",
        description:
          "Revisión de avances, ajustes al plan nutricional y resolución de dudas para optimizar resultados.",
        duration: "45 minutos",
        price: "$800 MXN",
      },
      {
        id: "s3",
        name: "Plan Nutricional Personalizado",
        description:
          "Desarrollo de un plan de alimentación detallado adaptado a tus necesidades, preferencias y objetivos de salud.",
        duration: "No aplica",
        price: "$1,500 MXN",
      },
      {
        id: "s4",
        name: "Taller de Alimentación Consciente",
        description:
          "Aprende técnicas prácticas para desarrollar una relación saludable con la comida y mejorar tus hábitos alimenticios.",
        duration: "120 minutos",
        price: "$950 MXN",
      },
    ],
    availability: {
      days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
      hours: ["09:00", "10:00", "11:00", "12:00", "16:00", "17:00", "18:00"],
    },
    reviews: [
      {
        id: "r1",
        user: {
          name: "Carlos Ramírez",
          image: "/placeholder.svg?height=50&width=50",
        },
        rating: 5,
        date: "15 de mayo, 2023",
        comment:
          "La Dra. Sofía cambió completamente mi relación con la comida. Su enfoque holístico me ayudó a resolver problemas digestivos que tenía desde hace años. Altamente recomendada.",
        serviceUsed: "Consulta Inicial",
      },
      {
        id: "r2",
        user: {
          name: "Ana Gutiérrez",
          image: "/placeholder.svg?height=50&width=50",
        },
        rating: 5,
        date: "3 de abril, 2023",
        comment:
          "Excelente profesional. El plan nutricional que me diseñó se adaptó perfectamente a mis necesidades y estilo de vida. He notado una gran mejora en mi energía y bienestar general.",
        serviceUsed: "Plan Nutricional Personalizado",
      },
      {
        id: "r3",
        user: {
          name: "Miguel Ángel López",
          image: "/placeholder.svg?height=50&width=50",
        },
        rating: 4,
        date: "20 de marzo, 2023",
        comment:
          "Muy buena atención y seguimiento. El único detalle es que a veces las citas se retrasan un poco, pero el servicio profesional es excelente.",
        serviceUsed: "Consulta de Seguimiento",
      },
    ],
    socialMedia: {
      website: "https://drasofíamendoza.com",
      instagram: "dra.sofia.nutricion",
      facebook: "DrasofiaMendozaNutricion",
      linkedin: "sofia-mendoza-nutricion",
    },
    contact: {
      email: "contacto@drasofíamendoza.com",
      phone: "+52 55 1234 5678",
    },
  };

  // Generar horarios disponibles para la fecha seleccionada
  const generateTimeSlots = (): TimeSlot[] => {
    // Simulamos disponibilidad basada en el día de la semana
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Usamos un patrón fijo en lugar de Math.random()
    return professional.availability.hours.map((hour) => {
      // Patrón determinista: horarios pares disponibles, impares no disponibles
      // excepto fines de semana donde todos están no disponibles
      const hourNum = Number.parseInt(hour.split(":")[0]);
      const isAvailable = !isWeekend && hourNum % 2 === 0;

      return {
        time: hour,
        available: isAvailable,
      };
    });
  };

  const timeSlots = generateTimeSlots();

  // Generar fechas para el selector de días
  const generateDates = (): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  const dates = generateDates();

  // Función para manejar la reserva de cita
  const handleBookAppointment = () => {
    if (!selectedService || !selectedTimeSlot) {
      alert("Por favor selecciona un servicio y un horario para continuar");
      return;
    }

    // Aquí iría la lógica para reservar la cita
    console.log("Reservando cita:", {
      professional: professional.name,
      service: selectedService,
      date: format(selectedDate, "dd/MM/yyyy"),
      time: selectedTimeSlot,
    });

    // Redireccionar a página de confirmación o mostrar modal
    alert("¡Cita agendada con éxito!");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Estilos para el gradiente animado */}
      <style jsx global>{`
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
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[120px] -z-10"></div>

      {/* Header con navegación de regreso */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-[#0D0D0D]/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/explore"
              className="flex items-center text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span>Volver a explorar</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite ? "fill-[#AC89FF] text-[#AC89FF]" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Portada y perfil */}
        <section className="relative">
          <div className="h-48 md:h-64 lg:h-80 w-full relative">
            <Image
              src={professional.coverImage || "/placeholder.svg"}
              alt="Portada"
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0D0D]"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end -mt-20 md:-mt-24 relative z-10">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-[#0D0D0D] shadow-xl">
                    <AvatarImage
                      src={professional.image}
                      alt={professional.name}
                    />
                    <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF] text-4xl">
                      {professional.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {professional.verified && (
                    <div className="absolute bottom-1 right-1 bg-[#AFF344] rounded-full p-1 border-2 border-[#0D0D0D]">
                      <Check className="h-4 w-4 text-[#0D0D0D]" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-grow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold mr-2">
                        {professional.name}
                      </h1>
                      {professional.verified && (
                        <Badge className="bg-[#AFF344]/20 text-[#AFF344] border-none">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    <p className="text-[#AC89FF] text-lg mb-1">
                      {professional.specialty}
                    </p>
                    <div className="flex items-center text-white/70 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{professional.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center mt-4 md:mt-0">
                    <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-lg mr-4">
                      <Star
                        className="h-4 w-4 text-yellow-400 mr-1"
                        fill="#FBBF24"
                      />
                      <span className="font-medium">{professional.rating}</span>
                      <span className="text-white/70 text-sm ml-1">
                        ({professional.reviewCount})
                      </span>
                    </div>
                    <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
                      <span className="relative z-10 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contactar
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {professional.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className="bg-white/10 hover:bg-white/20 text-white border-none"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contenido principal */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna izquierda - Información del profesional */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-lg mb-6 w-full grid grid-cols-4">
                  <TabsTrigger
                    value="about"
                    className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                  >
                    Sobre mí
                  </TabsTrigger>
                  <TabsTrigger
                    value="services"
                    className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                  >
                    Servicios
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                  >
                    Reseñas
                  </TabsTrigger>
                  <TabsTrigger
                    value="contact"
                    className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                  >
                    Contacto
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Sobre mí */}
                <TabsContent value="about" className="space-y-6">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium mb-4">Biografía</h3>
                      <p className="text-white/80 mb-6 leading-relaxed">
                        {professional.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-[#AC89FF] font-medium mb-2 flex items-center">
                            <Award className="h-4 w-4 mr-2" />
                            Experiencia
                          </h4>
                          <p className="text-white/80">
                            {professional.experience}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-[#AC89FF] font-medium mb-2 flex items-center">
                            <Globe className="h-4 w-4 mr-2" />
                            Idiomas
                          </h4>
                          <ul className="text-white/80 space-y-1">
                            {professional.languages.map((language, index) => (
                              <li key={index}>{language}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-[#AC89FF] font-medium mb-2 flex items-center">
                            <Shield className="h-4 w-4 mr-2" />
                            Verificación
                          </h4>
                          <p className="text-white/80 flex items-center">
                            <Check className="h-4 w-4 mr-1 text-[#AFF344]" />
                            Identidad verificada
                          </p>
                          <p className="text-white/80 flex items-center">
                            <Check className="h-4 w-4 mr-1 text-[#AFF344]" />
                            Credenciales verificadas
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium mb-4">
                        Educación y Certificaciones
                      </h3>
                      <ul className="space-y-4">
                        {professional.education.map((edu, index) => (
                          <li key={index} className="flex items-start">
                            <div className="h-6 w-6 rounded-full bg-[#AC89FF]/20 flex items-center justify-center mr-3 mt-0.5">
                              <span className="text-[#AC89FF] text-xs">
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-white/80">{edu}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Servicios */}
                <TabsContent value="services" className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {professional.services.map((service) => (
                      <Card
                        key={service.id}
                        className={`bg-white/5 border-white/10 transition-all hover:bg-white/10 cursor-pointer text-white ${
                          selectedService === service.id
                            ? "border-[#AC89FF] bg-[#AC89FF]/10"
                            : ""
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium mb-1">
                                {service.name}
                              </h3>
                              <p className="text-white/80 mb-3">
                                {service.description}
                              </p>

                              <div className="flex flex-wrap gap-4 text-sm text-white/70">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1 text-[#83C7FD]" />
                                  <span>{service.duration}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-white">
                                    {service.price}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {selectedService === service.id && (
                              <div className="h-6 w-6 rounded-full bg-[#AC89FF] flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Tab: Reseñas */}
                <TabsContent value="reviews" className="space-y-6">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-medium mb-1">
                            Reseñas de clientes
                          </h3>
                          <p className="text-white/70">
                            Basado en {professional.reviewCount} reseñas
                          </p>
                        </div>
                        <div className="flex items-center bg-white/10 px-4 py-2 rounded-lg">
                          <Star
                            className="h-5 w-5 text-yellow-400 mr-2"
                            fill="#FBBF24"
                          />
                          <span className="text-2xl font-bold">
                            {professional.rating}
                          </span>
                          <span className="text-white/70 text-sm ml-1">
                            / 5
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {professional.reviews.map((review) => (
                          <div
                            key={review.id}
                            className="border-b border-white/10 pb-6 last:border-0 last:pb-0"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3 border border-white/10">
                                  <AvatarImage
                                    src={review.user.image}
                                    alt={review.user.name}
                                  />
                                  <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                                    {review.user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium text-white">
                                    {review.user.name}
                                  </h4>
                                  <p className="text-white/60 text-sm">
                                    {review.date}
                                  </p>
                                </div>
                              </div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "text-yellow-400"
                                        : "text-white/20"
                                    }`}
                                    fill={
                                      i < review.rating ? "#FBBF24" : "none"
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-white/80 mb-3">
                              {review.comment}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge className="bg-white/10 text-white/70 border-none">
                                {review.serviceUsed}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/60 hover:text-white"
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Útil
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Contacto */}
                <TabsContent value="contact" className="space-y-6">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium mb-4">
                        Información de contacto
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex items-center p-4 bg-white/5 rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-[#AC89FF]/20 flex items-center justify-center mr-4">
                            <Mail className="h-5 w-5 text-[#AC89FF]" />
                          </div>
                          <div>
                            <p className="text-sm text-white/60">
                              Correo electrónico
                            </p>
                            <p className="font-medium text-white">
                              {professional.contact.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center p-4 bg-white/5 rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-[#83C7FD]/20 flex items-center justify-center mr-4">
                            <Phone className="h-5 w-5 text-[#83C7FD]" />
                          </div>
                          <div>
                            <p className="text-sm text-white/60">Teléfono</p>
                            <p className="font-medium text-white">
                              {professional.contact.phone}
                            </p>
                          </div>
                        </div>
                      </div>

                      <h4 className="font-medium mb-3">Redes sociales</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {professional.socialMedia.website && (
                          <Link
                            href={professional.socialMedia.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Globe className="h-5 w-5 mr-3 text-white/70" />
                            <span>Sitio web</span>
                          </Link>
                        )}

                        {professional.socialMedia.instagram && (
                          <Link
                            href={`https://instagram.com/${professional.socialMedia.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Instagram className="h-5 w-5 mr-3 text-white/70" />
                            <span>Instagram</span>
                          </Link>
                        )}

                        {professional.socialMedia.facebook && (
                          <Link
                            href={`https://facebook.com/${professional.socialMedia.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Facebook className="h-5 w-5 mr-3 text-white/70" />
                            <span>Facebook</span>
                          </Link>
                        )}

                        {professional.socialMedia.linkedin && (
                          <Link
                            href={`https://linkedin.com/in/${professional.socialMedia.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Linkedin className="h-5 w-5 mr-3 text-white/70" />
                            <span>LinkedIn</span>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Columna derecha - Reserva de cita */}
            <div>
              <Card className="bg-white/5 border-white/10 text-white sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-xl font-medium mb-4">Reserva una cita</h3>

                  {/* Selector de servicio */}
                  <div className="mb-6">
                    <h4 className="text-sm text-white/70 mb-2">
                      Selecciona un servicio
                    </h4>
                    <div className="space-y-2">
                      {professional.services.map((service) => (
                        <div
                          key={service.id}
                          className={`p-3 rounded-lg cursor-pointer transition-all text-white ${
                            selectedService === service.id
                              ? "bg-[#AC89FF]/20 border border-[#AC89FF]/50"
                              : "bg-white/5 border border-transparent hover:bg-white/10"
                          }`}
                          onClick={() => setSelectedService(service.id)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-sm">{service.price}</span>
                          </div>
                          <div className="flex items-center text-sm text-white/60 mt-1">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>{service.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selector de fecha */}
                  <div className="mb-6">
                    <h4 className="text-sm text-white/70 mb-2">
                      Selecciona una fecha
                    </h4>
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {dates.map((date, index) => {
                        const isToday = index === 0;
                        const isSelected =
                          selectedDate.getDate() === date.getDate() &&
                          selectedDate.getMonth() === date.getMonth();

                        return (
                          <div
                            key={index}
                            className={`flex-shrink-0 w-16 p-2 rounded-lg cursor-pointer text-center ${
                              isSelected
                                ? "bg-[#AC89FF] text-white"
                                : "bg-white/5 hover:bg-white/10"
                            }`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <p className="text-xs text-white/70">
                              {format(date, "EEE", { locale: es })}
                            </p>
                            <p className="text-lg font-medium">
                              {format(date, "d")}
                            </p>
                            <p className="text-xs">
                              {isToday
                                ? "Hoy"
                                : format(date, "MMM", { locale: es })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector de hora */}
                  <div className="mb-6">
                    <h4 className="text-sm text-white/70 mb-2">
                      Selecciona una hora
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`p-2 rounded-lg text-center text-sm ${
                            !slot.available
                              ? "bg-white/5 text-white/30 cursor-not-allowed"
                              : selectedTimeSlot === slot.time
                              ? "bg-[#AC89FF] text-white"
                              : "bg-white/10 hover:bg-white/20 cursor-pointer"
                          }`}
                          disabled={!slot.available}
                          onClick={() => setSelectedTimeSlot(slot.time)}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6 bg-white/10" />

                  {/* Resumen y botón de reserva */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70">Servicio:</span>
                      <span className="font-medium text-white">
                        {selectedService
                          ? professional.services.find(
                              (s) => s.id === selectedService
                            )?.name
                          : "No seleccionado"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70">Fecha:</span>
                      <span className="font-medium text-white">
                        {format(selectedDate, "d 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-white/70">Hora:</span>
                      <span className="font-medium text-white">
                        {selectedTimeSlot || "No seleccionada"}
                      </span>
                    </div>

                    <Button
                      onClick={handleBookAppointment}
                      disabled={!selectedService || !selectedTimeSlot}
                      className="w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Reservar cita
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Profesionales similares */}
        <section className="container mx-auto px-4 py-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Profesionales similares</h2>
            <Button
              variant="link"
              className="text-[#AC89FF] hover:text-[#83C7FD]"
            >
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <Card
                key={item}
                className="bg-white/5 border-white/10 card-hover text-white"
              >
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <Avatar className="h-12 w-12 mr-3 border border-white/10">
                      <AvatarImage
                        src={`/placeholder.svg?height=48&width=48`}
                        alt="Profesional"
                      />
                      <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                        P{item}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white">
                        Dr. Apellido {item}
                      </h4>
                      <p className="text-sm text-white/70">
                        Especialidad {item}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star
                        className="h-3.5 w-3.5 text-yellow-400 mr-1"
                        fill="#FBBF24"
                      />
                      <span className="text-sm">{4.5 + item * 0.1}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      Ver perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold animated-gradient-text mb-2">
                Holistia
              </h2>
              <p className="text-white/70 text-sm">
                Conectando el bienestar integral
              </p>
            </div>
            <div className="flex space-x-6">
              <Link
                href="/about"
                className="text-white/70 hover:text-white text-sm"
              >
                Sobre nosotros
              </Link>
              <Link
                href="/contact"
                className="text-white/70 hover:text-white text-sm"
              >
                Contacto
              </Link>
              <Link
                href="/privacy"
                className="text-white/70 hover:text-white text-sm"
              >
                Privacidad
              </Link>
              <Link
                href="/terms"
                className="text-white/70 hover:text-white text-sm"
              >
                Términos
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/50">
              &copy; {new Date().getFullYear()} Holistia. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
