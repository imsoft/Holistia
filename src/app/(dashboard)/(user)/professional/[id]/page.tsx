"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, Brain, Dumbbell, Stethoscope, Users, LucideIcon } from "lucide-react";
import { useParams } from "next/navigation";

// Importar componentes
import ProfessionalHeader from "@/components/professional/ProfessionalHeader";
import ProfessionalBio from "@/components/professional/ProfessionalBio";
import ProfessionalEducation from "@/components/professional/ProfessionalEducation";
import ProfessionalServices from "@/components/professional/ProfessionalServices";
import ProfessionalLocation from "@/components/professional/ProfessionalLocation";
import ProfessionalGallery from "@/components/professional/ProfessionalGallery";
import ProfessionalReviews from "@/components/professional/ProfessionalReviews";
import BookingSidebar from "@/components/professional/BookingSidebar";

// Datos de profesionales (en una app real vendrían de una API)
const professionals = [
  {
    id: 1,
    name: "Dra. María García",
    specialty: "Psicología Clínica",
    experience: "8 años",
    rating: 4.9,
    totalReviews: 127,
    location: "Ciudad de México",
    coordinates: { lat: 19.4326, lng: -99.1332 },
    price: "$1,200/sesión",
    availability: "Disponible hoy",
    description: "Especialista en terapia cognitivo-conductual y ansiedad",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80&facepad=3",
    badges: ["Terapia Individual", "Ansiedad", "Depresión"],
    nextAvailable: "Hoy 14:00",
    bio: "Soy una psicóloga clínica con más de 8 años de experiencia ayudando a personas a superar la ansiedad y la depresión. Mi enfoque se basa en la terapia cognitivo-conductual y técnicas de mindfulness.",
    education: [
      "Licenciatura en Psicología - UNAM",
      "Maestría en Terapia Cognitivo-Conductual - UAM",
      "Certificación en Mindfulness - Instituto Mexicano de Mindfulness"
    ],
    services: [
      "Terapia individual para adultos",
      "Terapia de pareja",
      "Terapia grupal",
      "Consultas online",
      "Talleres de manejo de ansiedad"
    ],
    schedule: [
      "Lunes - Viernes: 9:00 - 18:00",
      "Sábados: 9:00 - 14:00",
      "Domingos: Cerrado"
    ],
    availableSlots: [
      { date: "2024-01-15", time: "09:00", available: true },
      { date: "2024-01-15", time: "10:00", available: true },
      { date: "2024-01-15", time: "11:00", available: false },
      { date: "2024-01-15", time: "14:00", available: true },
      { date: "2024-01-15", time: "15:00", available: true },
      { date: "2024-01-15", time: "16:00", available: true },
      { date: "2024-01-16", time: "09:00", available: true },
      { date: "2024-01-16", time: "10:00", available: true },
      { date: "2024-01-16", time: "11:00", available: true },
      { date: "2024-01-16", time: "14:00", available: false },
      { date: "2024-01-16", time: "15:00", available: true },
      { date: "2024-01-16", time: "16:00", available: true },
      { date: "2024-01-17", time: "09:00", available: true },
      { date: "2024-01-17", time: "10:00", available: true },
      { date: "2024-01-17", time: "11:00", available: true },
      { date: "2024-01-17", time: "14:00", available: true },
      { date: "2024-01-17", time: "15:00", available: true },
      { date: "2024-01-17", time: "16:00", available: false }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80"
    ],
    reviews: [
      {
        id: 1,
        user: "Ana Martínez",
        rating: 5,
        comment: "Excelente profesional. Me ayudó mucho con mi ansiedad. Muy recomendada.",
        date: "2024-01-10",
        helpful: 12,
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      },
      {
        id: 2,
        user: "Carlos López",
        rating: 5,
        comment: "La Dra. García es muy profesional y empática. Las sesiones son muy efectivas.",
        date: "2024-01-08",
        helpful: 8,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      },
      {
        id: 3,
        user: "María González",
        rating: 4,
        comment: "Muy buena experiencia. Me siento mucho mejor después de las sesiones.",
        date: "2024-01-05",
        helpful: 5,
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      }
    ]
  },
  {
    id: 2,
    name: "Dr. Carlos López",
    specialty: "Nutrición Clínica",
    experience: "12 años",
    rating: 4.8,
    totalReviews: 89,
    location: "Guadalajara",
    coordinates: { lat: 20.6597, lng: -103.3496 },
    price: "$980/consulta",
    availability: "Disponible mañana",
    description: "Nutricionista especializado en dietas terapéuticas y deportivas",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80&facepad=3",
    badges: ["Dieta Deportiva", "Pérdida de Peso", "Diabetes"],
    nextAvailable: "Mañana 10:00",
    bio: "Nutricionista clínico con 12 años de experiencia en el tratamiento de enfermedades metabólicas y nutrición deportiva. Especialista en diabetes y obesidad.",
    education: [
      "Licenciatura en Nutriología - Universidad de Guadalajara",
      "Especialidad en Nutrición Clínica - UNAM",
      "Certificación en Nutrición Deportiva - CONADE"
    ],
    services: [
      "Consultas nutricionales personalizadas",
      "Planes de alimentación para deportistas",
      "Manejo de diabetes y prediabetes",
      "Pérdida de peso saludable",
      "Nutrición pediátrica"
    ],
    schedule: [
      "Lunes - Miércoles: 8:00 - 16:00",
      "Jueves - Viernes: 10:00 - 18:00",
      "Sábados: 9:00 - 13:00"
    ],
    availableSlots: [
      { date: "2024-01-15", time: "08:00", available: true },
      { date: "2024-01-15", time: "10:00", available: true },
      { date: "2024-01-15", time: "12:00", available: false },
      { date: "2024-01-15", time: "14:00", available: true },
      { date: "2024-01-16", time: "08:00", available: true },
      { date: "2024-01-16", time: "10:00", available: true },
      { date: "2024-01-16", time: "12:00", available: true },
      { date: "2024-01-16", time: "14:00", available: false },
      { date: "2024-01-17", time: "08:00", available: true },
      { date: "2024-01-17", time: "10:00", available: true },
      { date: "2024-01-17", time: "12:00", available: true },
      { date: "2024-01-17", time: "14:00", available: true }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80"
    ],
    reviews: [
      {
        id: 1,
        user: "Roberto Silva",
        rating: 5,
        comment: "Excelente nutricionista. Me ayudó a perder peso de forma saludable.",
        date: "2024-01-09",
        helpful: 15,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      },
      {
        id: 2,
        user: "Laura Pérez",
        rating: 4,
        comment: "Muy profesional y conocedor. Recomendado para deportistas.",
        date: "2024-01-07",
        helpful: 9,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      }
    ]
  },
  {
    id: 3,
    name: "Ana Rodríguez",
    specialty: "Entrenamiento Personal",
    experience: "6 años",
    rating: 4.9,
    totalReviews: 156,
    location: "Monterrey",
    coordinates: { lat: 25.6866, lng: -100.3161 },
    price: "$680/sesión",
    availability: "Disponible ahora",
    description: "Entrenadora personal especializada en fitness funcional",
    avatar: "https://images.unsplash.com/photo-1594824377518-5c9b9c8b8b8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80&facepad=3",
    badges: ["Fitness Funcional", "Rehabilitación", "Grupos"],
    nextAvailable: "Ahora",
    bio: "Entrenadora personal certificada con 6 años de experiencia en fitness funcional y rehabilitación. Ayudo a personas de todas las edades a alcanzar sus objetivos de salud.",
    education: [
      "Licenciatura en Ciencias del Deporte - UANL",
      "Certificación Internacional en Fitness Funcional",
      "Especialización en Rehabilitación Deportiva"
    ],
    services: [
      "Entrenamiento personal individual",
      "Clases grupales de fitness funcional",
      "Rehabilitación post-lesión",
      "Programas para adultos mayores",
      "Entrenamiento online"
    ],
    schedule: [
      "Lunes - Viernes: 6:00 - 20:00",
      "Sábados: 7:00 - 15:00",
      "Domingos: 8:00 - 12:00"
    ],
    availableSlots: [
      { date: "2024-01-15", time: "07:00", available: true },
      { date: "2024-01-15", time: "08:00", available: true },
      { date: "2024-01-15", time: "09:00", available: false },
      { date: "2024-01-15", time: "18:00", available: true },
      { date: "2024-01-15", time: "19:00", available: true },
      { date: "2024-01-16", time: "07:00", available: true },
      { date: "2024-01-16", time: "08:00", available: true },
      { date: "2024-01-16", time: "09:00", available: true },
      { date: "2024-01-16", time: "18:00", available: true },
      { date: "2024-01-16", time: "19:00", available: false },
      { date: "2024-01-17", time: "07:00", available: true },
      { date: "2024-01-17", time: "08:00", available: true },
      { date: "2024-01-17", time: "09:00", available: true },
      { date: "2024-01-17", time: "18:00", available: true },
      { date: "2024-01-17", time: "19:00", available: true }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80"
    ],
    reviews: [
      {
        id: 1,
        user: "Miguel Torres",
        rating: 5,
        comment: "Ana es una excelente entrenadora. Me ayudó a recuperarme de mi lesión.",
        date: "2024-01-11",
        helpful: 18,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      },
      {
        id: 2,
        user: "Patricia Ruiz",
        rating: 5,
        comment: "Muy motivadora y profesional. Las clases son dinámicas y efectivas.",
        date: "2024-01-09",
        helpful: 11,
        avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      },
      {
        id: 3,
        user: "Fernando Díaz",
        rating: 4,
        comment: "Buen entrenamiento personalizado. Recomendado.",
        date: "2024-01-06",
        helpful: 7,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      }
    ]
  },
  {
    id: 4,
    name: "Dr. Roberto Martín",
    specialty: "Medicina General",
    experience: "15 años",
    rating: 4.7,
    totalReviews: 203,
    location: "Puebla",
    coordinates: { lat: 19.0414, lng: -98.2063 },
    price: "$1,050/consulta",
    availability: "Disponible hoy",
    description: "Médico general con enfoque en medicina preventiva",
    avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80&facepad=3",
    badges: ["Medicina Preventiva", "Consultas Online", "Chequeos"],
    nextAvailable: "Hoy 16:30",
    bio: "Médico general con 15 años de experiencia en medicina preventiva y familiar. Enfoque en la promoción de la salud y prevención de enfermedades.",
    education: [
      "Licenciatura en Medicina - BUAP",
      "Especialidad en Medicina Familiar - UNAM",
      "Diplomado en Medicina Preventiva - Instituto Nacional de Salud"
    ],
    services: [
      "Consultas médicas generales",
      "Chequeos médicos completos",
      "Medicina preventiva",
      "Consultas online",
      "Atención a familias"
    ],
    schedule: [
      "Lunes - Viernes: 8:00 - 18:00",
      "Sábados: 8:00 - 14:00",
      "Emergencias: 24/7"
    ],
    availableSlots: [
      { date: "2024-01-15", time: "08:00", available: true },
      { date: "2024-01-15", time: "09:00", available: true },
      { date: "2024-01-15", time: "10:00", available: false },
      { date: "2024-01-15", time: "11:00", available: true },
      { date: "2024-01-15", time: "16:00", available: true },
      { date: "2024-01-15", time: "17:00", available: true },
      { date: "2024-01-16", time: "08:00", available: true },
      { date: "2024-01-16", time: "09:00", available: true },
      { date: "2024-01-16", time: "10:00", available: true },
      { date: "2024-01-16", time: "11:00", available: true },
      { date: "2024-01-16", time: "16:00", available: true },
      { date: "2024-01-16", time: "17:00", available: false },
      { date: "2024-01-17", time: "08:00", available: true },
      { date: "2024-01-17", time: "09:00", available: true },
      { date: "2024-01-17", time: "10:00", available: true },
      { date: "2024-01-17", time: "11:00", available: true },
      { date: "2024-01-17", time: "16:00", available: true },
      { date: "2024-01-17", time: "17:00", available: true }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80"
    ],
    reviews: [
      {
        id: 1,
        user: "Elena Vargas",
        rating: 5,
        comment: "Dr. Martín es muy atento y profesional. Excelente médico de familia.",
        date: "2024-01-12",
        helpful: 20,
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      },
      {
        id: 2,
        user: "Jorge Méndez",
        rating: 4,
        comment: "Muy buen médico, siempre disponible y con buenos diagnósticos.",
        date: "2024-01-08",
        helpful: 14,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      },
      {
        id: 3,
        user: "Carmen Herrera",
        rating: 5,
        comment: "Recomendado al 100%. Muy profesional y empático.",
        date: "2024-01-05",
        helpful: 16,
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80&facepad=3"
      }
    ]
  }
];

const getSpecialtyIcon = (specialty: string): LucideIcon => {
  switch (specialty.toLowerCase()) {
    case 'psicología clínica':
      return Brain;
    case 'nutrición clínica':
      return Heart;
    case 'entrenamiento personal':
      return Dumbbell;
    case 'medicina general':
      return Stethoscope;
    default:
      return Users;
  }
};

const ProfessionalDetailPage = () => {
  const params = useParams();
  const professionalId = parseInt(params.id as string);
  
  const professional = professionals.find(p => p.id === professionalId);
  const SpecialtyIcon = professional ? getSpecialtyIcon(professional.specialty) : Users;

  if (!professional) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Profesional no encontrado
            </h3>
            <p className="text-muted-foreground">
              El profesional que buscas no existe o ha sido eliminado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header con botón de volver */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil del Profesional</h1>
          <p className="text-muted-foreground">Información detallada y servicios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          <ProfessionalHeader 
            professional={professional} 
            SpecialtyIcon={SpecialtyIcon} 
          />
          
          <ProfessionalBio 
            name={professional.name} 
            bio={professional.bio} 
          />
          
          <ProfessionalEducation 
            education={professional.education} 
          />
          
          <ProfessionalServices 
            services={professional.services} 
          />
          
          <ProfessionalLocation 
            name={professional.name}
            location={professional.location}
            coordinates={professional.coordinates}
            rating={professional.rating}
            totalReviews={professional.totalReviews}
          />
          
          <ProfessionalGallery 
            name={professional.name}
            gallery={professional.gallery}
          />
          
          <ProfessionalReviews 
            rating={professional.rating}
            totalReviews={professional.totalReviews}
            reviews={professional.reviews}
          />
        </div>

        {/* Sidebar con información de contacto y reserva */}
        <BookingSidebar 
          availableSlots={professional.availableSlots}
          availability={professional.availability}
          schedule={professional.schedule}
        />
      </div>
    </div>
  );
};

export default ProfessionalDetailPage;
