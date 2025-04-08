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
  ChevronLeft,
  Check,
  ThumbsUp,
  Globe,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Sparkles,
  Info,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Tipos para los datos
type WellnessCenterProfile = {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviewCount: number;
  location: string;
  description: string;
  shortDescription: string;
  logo: string;
  coverImage: string;
  images: string[];
  tags: string[];
  verified: boolean;
  established: string;
  features: string[];
  services: Service[];
  professionals: Professional[];
  openingHours: {
    days: string;
    hours: string;
  }[];
  reviews: Review[];
  socialMedia: {
    website?: string;
    instagram?: string;
    facebook?: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
};

type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  category: string;
};

type Professional = {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  specialties: string[];
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

export const WellnessCenterProfile = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [serviceCategory, setServiceCategory] = useState<string>("all");

  // Datos de ejemplo para el perfil del centro wellness
  const center: WellnessCenterProfile = {
    id: "1",
    name: "Serenity Wellness Center",
    type: "Centro Holístico",
    rating: 4.9,
    reviewCount: 87,
    location: "Ciudad de México",
    shortDescription:
      "Centro holístico especializado en terapias integrativas y bienestar completo.",
    description:
      "Serenity Wellness Center es un espacio dedicado al bienestar integral, donde convergen diversas disciplinas holísticas para ofrecer una experiencia transformadora. Fundado en 2015 por un equipo de terapeutas y profesionales de la salud, nuestro centro se ha convertido en un referente en la Ciudad de México para quienes buscan un enfoque completo para su bienestar físico, mental y espiritual.\n\nNuestras instalaciones están diseñadas para crear un ambiente de paz y armonía, con espacios amplios y luminosos que invitan a la relajación y la reconexión. Contamos con salas especializadas para cada tipo de terapia, un estudio de yoga y meditación, y áreas comunes donde nuestra comunidad puede compartir experiencias.\n\nEn Serenity, creemos en un enfoque personalizado para cada persona, reconociendo que cada camino hacia el bienestar es único. Nuestro equipo de profesionales altamente calificados trabaja en colaboración para ofrecer planes integrales que abordan todas las dimensiones del ser.",
    logo: "/placeholder.svg?height=200&width=200",
    coverImage: "/placeholder.svg?height=500&width=1200",
    images: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    tags: ["Yoga", "Meditación", "Terapias Holísticas", "Masajes", "Nutrición"],
    verified: true,
    established: "2015",
    features: [
      "Estudio de yoga con capacidad para 25 personas",
      "5 salas privadas para terapias individuales",
      "Área de meditación con jardín zen",
      "Cafetería orgánica",
      "Tienda de productos naturales",
      "Estacionamiento gratuito",
      "Accesibilidad para personas con movilidad reducida",
    ],
    services: [
      {
        id: "s1",
        name: "Clase de Yoga Kundalini",
        description:
          "Práctica de yoga enfocada en despertar la energía kundalini a través de asanas, pranayama y meditación.",
        duration: "90 minutos",
        price: "$250 MXN",
        category: "Yoga",
      },
      {
        id: "s2",
        name: "Masaje Terapéutico",
        description:
          "Masaje personalizado que combina diferentes técnicas para aliviar tensiones y promover la relajación profunda.",
        duration: "60 minutos",
        price: "$800 MXN",
        category: "Masajes",
      },
      {
        id: "s3",
        name: "Terapia de Sonido con Cuencos Tibetanos",
        description:
          "Sesión de sanación a través de las vibraciones de cuencos tibetanos que armonizan los centros energéticos.",
        duration: "45 minutos",
        price: "$650 MXN",
        category: "Terapias",
      },
      {
        id: "s4",
        name: "Consulta de Nutrición Holística",
        description:
          "Evaluación nutricional completa con enfoque en la alimentación consciente y planes personalizados.",
        duration: "75 minutos",
        price: "$950 MXN",
        category: "Nutrición",
      },
      {
        id: "s5",
        name: "Meditación Guiada Grupal",
        description:
          "Sesión de meditación guiada para principiantes y practicantes intermedios.",
        duration: "45 minutos",
        price: "$200 MXN",
        category: "Meditación",
      },
      {
        id: "s6",
        name: "Yoga Restaurativo",
        description:
          "Práctica suave y terapéutica ideal para recuperación y relajación profunda.",
        duration: "75 minutos",
        price: "$280 MXN",
        category: "Yoga",
      },
      {
        id: "s7",
        name: "Masaje con Piedras Calientes",
        description:
          "Terapia que combina masaje tradicional con piedras volcánicas calientes para relajar músculos tensos.",
        duration: "90 minutos",
        price: "$950 MXN",
        category: "Masajes",
      },
      {
        id: "s8",
        name: "Taller de Alimentación Consciente",
        description:
          "Aprende técnicas prácticas para desarrollar una relación saludable con la comida.",
        duration: "120 minutos",
        price: "$450 MXN",
        category: "Nutrición",
      },
    ],
    professionals: [
      {
        id: "p1",
        name: "Mtra. Ana García",
        role: "Instructora de Yoga",
        image: "/placeholder.svg?height=150&width=150",
        rating: 4.9,
        specialties: ["Yoga Kundalini", "Yoga Restaurativo", "Meditación"],
      },
      {
        id: "p2",
        name: "Lic. Roberto Méndez",
        role: "Terapeuta Holístico",
        image: "/placeholder.svg?height=150&width=150",
        rating: 4.8,
        specialties: ["Masajes Terapéuticos", "Terapia de Sonido", "Reiki"],
      },
      {
        id: "p3",
        name: "Dra. Claudia Vázquez",
        role: "Nutrióloga Holística",
        image: "/placeholder.svg?height=150&width=150",
        rating: 4.7,
        specialties: [
          "Nutrición Funcional",
          "Alimentación Consciente",
          "Detox",
        ],
      },
      {
        id: "p4",
        name: "Mtro. Daniel Ortiz",
        role: "Instructor de Meditación",
        image: "/placeholder.svg?height=150&width=150",
        rating: 4.9,
        specialties: [
          "Mindfulness",
          "Meditación Guiada",
          "Respiración Consciente",
        ],
      },
    ],
    openingHours: [
      { days: "Lunes - Viernes", hours: "7:00 - 21:00" },
      { days: "Sábado", hours: "8:00 - 18:00" },
      { days: "Domingo", hours: "9:00 - 14:00" },
    ],
    reviews: [
      {
        id: "r1",
        user: {
          name: "Laura Martínez",
          image: "/placeholder.svg?height=50&width=50",
        },
        rating: 5,
        date: "10 de junio, 2023",
        comment:
          "Un oasis de paz en medio de la ciudad. Las instalaciones son hermosas y el personal es muy profesional. He tomado varias clases de yoga con Ana y han transformado mi práctica. Totalmente recomendado.",
        serviceUsed: "Clase de Yoga Kundalini",
      },
      {
        id: "r2",
        user: {
          name: "Carlos Hernández",
          image: "/placeholder.svg?height=50&width=50",
        },
        rating: 5,
        date: "28 de mayo, 2023",
        comment:
          "Excelente experiencia con el masaje terapéutico. Roberto tiene manos mágicas y logró aliviar mi dolor crónico de espalda. El ambiente es muy relajante y la atención es de primera.",
        serviceUsed: "Masaje Terapéutico",
      },
      {
        id: "r3",
        user: {
          name: "Sofía Ramírez",
          image: "/placeholder.svg?height=50&width=50",
        },
        rating: 4,
        date: "15 de mayo, 2023",
        comment:
          "La consulta de nutrición con la Dra. Claudia fue muy reveladora. Me dio un plan personalizado que ha sido fácil de seguir. El único detalle es que a veces hay que esperar un poco para las citas.",
        serviceUsed: "Consulta de Nutrición Holística",
      },
    ],
    socialMedia: {
      website: "https://serenitywellness.com",
      instagram: "serenity_wellness_mx",
      facebook: "SerenityCDMX",
    },
    contact: {
      email: "contacto@serenitywellness.com",
      phone: "+52 55 1234 5678",
      address: "Av. Reforma 123, Col. Juárez, Ciudad de México, CP 06600",
    },
  };

  // Generar fechas para el selector de días
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  const dates = generateDates();

  // Filtrar servicios por categoría
  const filteredServices =
    serviceCategory === "all"
      ? center.services
      : center.services.filter(
          (service) =>
            service.category.toLowerCase() === serviceCategory.toLowerCase()
        );

  // Obtener categorías únicas de servicios
  const serviceCategories = [
    "all",
    ...new Set(center.services.map((service) => service.category)),
  ];

  // Función para manejar la reserva de servicio
  const handleBookService = () => {
    if (!selectedService) {
      alert("Por favor selecciona un servicio para continuar");
      return;
    }

    // Aquí iría la lógica para reservar el servicio
    console.log("Reservando servicio:", {
      center: center.name,
      service: selectedService,
      date: format(selectedDate, "dd/MM/yyyy"),
    });

    // Redireccionar a página de confirmación o mostrar modal
    alert("¡Servicio reservado con éxito!");
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
          <div className="h-64 md:h-80 lg:h-96 w-full relative">
            <Image
              src={center.coverImage || "/placeholder.svg"}
              alt="Portada"
              fill
              className="object-cover opacity-70"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0D0D]"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end -mt-24 md:-mt-32 relative z-10">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-[#0D0D0D] shadow-xl">
                    <AvatarImage src={center.logo} alt={center.name} />
                    <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF] text-4xl">
                      {center.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {center.verified && (
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
                        {center.name}
                      </h1>
                      {center.verified && (
                        <Badge className="bg-[#AFF344]/20 text-[#AFF344] border-none">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    <p className="text-[#AC89FF] text-lg mb-1">{center.type}</p>
                    <div className="flex items-center text-white/70 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{center.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center mt-4 md:mt-0">
                    <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-lg mr-4">
                      <Star
                        className="h-4 w-4 text-yellow-400 mr-1"
                        fill="#FBBF24"
                      />
                      <span className="font-medium">{center.rating}</span>
                      <span className="text-white/70 text-sm ml-1">
                        ({center.reviewCount})
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
                  {center.tags.map((tag, index) => (
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
            {/* Columna izquierda - Información del centro */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-lg mb-6 w-full grid grid-cols-6">
                  <TabsTrigger
                    value="about"
                    className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                  >
                    Sobre nosotros
                  </TabsTrigger>
                  <TabsTrigger
                    value="services"
                    className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                  >
                    Servicios
                  </TabsTrigger>
                  <TabsTrigger
                    value="team"
                    className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                  >
                    Equipo
                  </TabsTrigger>
                  <TabsTrigger
                    value="gallery"
                    className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                  >
                    Galería
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

                {/* Tab: Sobre nosotros */}
                <TabsContent value="about" className="space-y-6">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium mb-4">
                        Acerca de {center.name}
                      </h3>
                      <p className="text-white/80 mb-6 leading-relaxed whitespace-pre-line">
                        {center.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-[#AC89FF] font-medium mb-3 flex items-center">
                            <Info className="h-4 w-4 mr-2" />
                            Información general
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-white/70">
                                Establecido:
                              </span>
                              <span className="text-white">
                                {center.established}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">Tipo:</span>
                              <span className="text-white">{center.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">Ubicación:</span>
                              <span className="text-white">
                                {center.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[#AC89FF] font-medium mb-3 flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            Horarios de atención
                          </h4>
                          <div className="space-y-2">
                            {center.openingHours.map((schedule, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-white/70">
                                  {schedule.days}:
                                </span>
                                <span className="text-white">
                                  {schedule.hours}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator className="my-6 bg-white/10" />

                      <h4 className="text-[#AC89FF] font-medium mb-3 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Instalaciones y características
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {center.features.map((feature, index) => (
                          <div key={index} className="flex items-start">
                            <Check className="h-4 w-4 text-[#AFF344] mr-2 mt-1" />
                            <span className="text-white/80">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium mb-4">Ubicación</h3>
                      <div className="bg-white/10 rounded-lg p-4 mb-4">
                        <p className="text-white/80 flex items-start">
                          <MapPin className="h-5 w-5 mr-2 mt-0.5 text-[#AC89FF]" />
                          {center.contact.address}
                        </p>
                      </div>
                      <div className="aspect-video relative rounded-lg overflow-hidden">
                        {/* Aquí iría un mapa, pero usamos un placeholder */}
                        <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="h-10 w-10 text-[#AC89FF]/50 mx-auto mb-2" />
                            <p className="text-white/50">
                              Mapa no disponible en la vista previa
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Servicios */}
                <TabsContent value="services" className="space-y-6">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {serviceCategories.map((category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className={`
                          cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all
                          ${
                            serviceCategory === category
                              ? "bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] border-transparent text-white"
                              : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                          }
                        `}
                        onClick={() => setServiceCategory(category)}
                      >
                        {category === "all" ? "Todos" : category}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {filteredServices.map((service) => (
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
                              <div className="flex items-center mb-1">
                                <h3 className="text-lg font-medium mr-2">
                                  {service.name}
                                </h3>
                                <Badge className="bg-[#AC89FF]/20 text-[#AC89FF] border-none">
                                  {service.category}
                                </Badge>
                              </div>
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

                {/* Tab: Equipo */}
                <TabsContent value="team" className="space-y-6">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium mb-4">
                        Nuestro equipo de profesionales
                      </h3>
                      <p className="text-white/80 mb-6">
                        Contamos con un equipo de profesionales altamente
                        calificados y apasionados por el bienestar integral.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {center.professionals.map((professional) => (
                          <Card
                            key={professional.id}
                            className="bg-white/5 border-white/10 card-hover"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start">
                                <Avatar className="h-16 w-16 mr-4 border border-white/10">
                                  <AvatarImage
                                    src={professional.image}
                                    alt={professional.name}
                                  />
                                  <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                                    {professional.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium text-white">
                                    {professional.name}
                                  </h4>
                                  <p className="text-[#AC89FF] text-sm mb-2">
                                    {professional.role}
                                  </p>
                                  <div className="flex items-center mb-2">
                                    <Star
                                      className="h-3.5 w-3.5 text-yellow-400 mr-1"
                                      fill="#FBBF24"
                                    />
                                    <span className="text-sm">
                                      {professional.rating}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {professional.specialties.map(
                                      (specialty, index) => (
                                        <span
                                          key={index}
                                          className="text-xs bg-white/10 text-white/80 px-2 py-0.5 rounded-full"
                                        >
                                          {specialty}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#AC89FF] hover:text-white"
                                >
                                  Ver perfil
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Galería */}
                <TabsContent value="gallery" className="space-y-6">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium mb-4">
                        Galería de imágenes
                      </h3>

                      {/* Imagen principal */}
                      <div className="mb-4 aspect-video relative rounded-lg overflow-hidden">
                        <Image
                          src={
                            center.images[selectedImageIndex] ||
                            "/placeholder.svg"
                          }
                          alt={`${center.name} - Imagen ${
                            selectedImageIndex + 1
                          }`}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Miniaturas */}
                      <div className="grid grid-cols-5 gap-2">
                        {center.images.map((image, index) => (
                          <div
                            key={index}
                            className={`aspect-square relative rounded-md overflow-hidden cursor-pointer ${
                              selectedImageIndex === index
                                ? "ring-2 ring-[#AC89FF]"
                                : ""
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <Image
                              src={image || "/placeholder.svg"}
                              alt={`Miniatura ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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
                            Basado en {center.reviewCount} reseñas
                          </p>
                        </div>
                        <div className="flex items-center bg-white/10 px-4 py-2 rounded-lg">
                          <Star
                            className="h-5 w-5 text-yellow-400 mr-2"
                            fill="#FBBF24"
                          />
                          <span className="text-2xl font-bold">
                            {center.rating}
                          </span>
                          <span className="text-white/70 text-sm ml-1">
                            / 5
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {center.reviews.map((review) => (
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

                      <div className="mt-6 flex justify-center">
                        <Button
                          variant="outline"
                          className="border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          Ver todas las reseñas
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Contacto */}
                <TabsContent value="contact" className="space-y-6">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium mb-6">
                        Información de contacto
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-4">
                          <div className="flex items-center p-4 bg-white/5 rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-[#AC89FF]/20 flex items-center justify-center mr-4">
                              <Phone className="h-5 w-5 text-[#AC89FF]" />
                            </div>
                            <div>
                              <p className="text-sm text-white/60">Teléfono</p>
                              <p className="font-medium text-white">
                                {center.contact.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center p-4 bg-white/5 rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-[#83C7FD]/20 flex items-center justify-center mr-4">
                              <Mail className="h-5 w-5 text-[#83C7FD]" />
                            </div>
                            <div>
                              <p className="text-sm text-white/60">
                                Correo electrónico
                              </p>
                              <p className="font-medium text-white">
                                {center.contact.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start p-4 bg-white/5 rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-[#AFF344]/20 flex items-center justify-center mr-4 mt-1">
                            <MapPin className="h-5 w-5 text-[#AFF344]" />
                          </div>
                          <div>
                            <p className="text-sm text-white/60">Dirección</p>
                            <p className="font-medium text-white">
                              {center.contact.address}
                            </p>
                          </div>
                        </div>
                      </div>

                      <h4 className="font-medium mb-4">Horarios de atención</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {center.openingHours.map((schedule, index) => (
                          <div
                            key={index}
                            className="p-3 bg-white/5 rounded-lg"
                          >
                            <p className="text-sm text-white/60">
                              {schedule.days}
                            </p>
                            <p className="font-medium text-white">
                              {schedule.hours}
                            </p>
                          </div>
                        ))}
                      </div>

                      <h4 className="font-medium mb-4">Redes sociales</h4>
                      <div className="flex flex-wrap gap-3">
                        {center.socialMedia.website && (
                          <Link
                            href={center.socialMedia.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Globe className="h-5 w-5 mr-3 text-white/70" />
                            <span>Sitio web</span>
                          </Link>
                        )}
                        {center.socialMedia.instagram && (
                          <Link
                            href={`https://instagram.com/${center.socialMedia.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Instagram className="h-5 w-5 mr-3 text-white/70" />
                            <span>Instagram</span>
                          </Link>
                        )}
                        {center.socialMedia.facebook && (
                          <Link
                            href={`https://facebook.com/${center.socialMedia.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Facebook className="h-5 w-5 mr-3 text-white/70" />
                            <span>Facebook</span>
                          </Link>
                        )}
                      </div>

                      <div className="mt-8">
                        <Button className="w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
                          <span className="relative z-10 flex items-center">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Enviar mensaje
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Columna derecha - Reserva y contacto */}
            <div>
              <Card className="bg-white/5 border-white/10 text-white sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-xl font-medium mb-4">
                    Reserva un servicio
                  </h3>

                  {/* Selector de servicio */}
                  <div className="mb-6">
                    <h4 className="text-sm text-white/70 mb-2">
                      Selecciona un servicio
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {center.services.map((service) => (
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
                            <Badge className="bg-[#AC89FF]/20 text-[#AC89FF] border-none">
                              {service.category}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-white/60 mt-1">
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              <span>{service.duration}</span>
                            </div>
                            <span className="text-white">{service.price}</span>
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

                  <Separator className="my-6 bg-white/10" />

                  {/* Resumen y botón de reserva */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70">Servicio:</span>
                      <span className="font-medium text-white">
                        {selectedService
                          ? center.services.find(
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
                      <span className="text-white/70">Precio:</span>
                      <span className="font-medium text-white">
                        {selectedService
                          ? center.services.find(
                              (s) => s.id === selectedService
                            )?.price
                          : "-"}
                      </span>
                    </div>

                    <Button
                      onClick={handleBookService}
                      disabled={!selectedService}
                      className="w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Reservar ahora
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-8">
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
