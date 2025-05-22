"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  Star,
  Filter,
  ChevronDown,
  Sparkles,
  Heart,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipos para los datos
type Professional = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  location: string;
  description: string;
  image: string;
  tags: string[];
  availability: string;
  price: string;
};

type Center = {
  id: string;
  name: string;
  type: string;
  rating: number;
  location: string;
  services: string[];
  image: string;
  tags: string[];
  price: string;
};

export const Explore = () => {
  const [activeTab, setActiveTab] = useState("professionals");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  console.log("Active Tab:", activeTab);

  // Datos de ejemplo para profesionales
  const professionals: Professional[] = [
    {
      id: "1",
      name: "Dra. Sofía Mendoza",
      specialty: "Nutricionista Holística",
      rating: 4.9,
      location: "Ciudad de México",
      description:
        "Especialista en nutrición integrativa y medicina funcional con enfoque en bienestar digestivo.",
      image: "/placeholder.svg?height=400&width=400",
      tags: ["Nutrición", "Medicina Funcional", "Bienestar Digestivo"],
      availability: "Disponible hoy",
      price: "Desde $800 MXN",
    },
    {
      id: "2",
      name: "Mtro. Alejandro Ruiz",
      specialty: "Instructor de Yoga",
      rating: 4.8,
      location: "Guadalajara",
      description:
        "Maestro certificado en Hatha y Vinyasa Yoga con 10 años de experiencia en mindfulness.",
      image: "/placeholder.svg?height=400&width=400",
      tags: ["Yoga", "Meditación", "Mindfulness"],
      availability: "Disponible mañana",
      price: "Desde $600 MXN",
    },
    {
      id: "3",
      name: "Lic. Carmen Vázquez",
      specialty: "Terapeuta Holística",
      rating: 4.7,
      location: "Monterrey",
      description:
        "Especialista en terapias alternativas, aromaterapia y sanación energética.",
      image: "/placeholder.svg?height=400&width=400",
      tags: ["Terapia", "Aromaterapia", "Sanación"],
      availability: "Disponible en 2 días",
      price: "Desde $750 MXN",
    },
    {
      id: "4",
      name: "Dr. Miguel Ángel Torres",
      specialty: "Acupunturista",
      rating: 4.9,
      location: "Ciudad de México",
      description:
        "Doctor en medicina tradicional china especializado en acupuntura y moxibustión.",
      image: "/placeholder.svg?height=400&width=400",
      tags: ["Acupuntura", "Medicina China", "Dolor Crónico"],
      availability: "Disponible hoy",
      price: "Desde $900 MXN",
    },
    {
      id: "5",
      name: "Mtra. Laura Herrera",
      specialty: "Coach de Bienestar",
      rating: 4.6,
      location: "Puebla",
      description:
        "Coach certificada en bienestar integral y desarrollo personal con enfoque en hábitos saludables.",
      image: "/placeholder.svg?height=400&width=400",
      tags: ["Coaching", "Hábitos", "Desarrollo Personal"],
      availability: "Disponible mañana",
      price: "Desde $700 MXN",
    },
    {
      id: "6",
      name: "Lic. Roberto Campos",
      specialty: "Quiropráctico",
      rating: 4.8,
      location: "Querétaro",
      description:
        "Especialista en ajustes vertebrales y tratamiento de dolores musculoesqueléticos.",
      image: "/placeholder.svg?height=400&width=400",
      tags: ["Quiropráctica", "Dolor de Espalda", "Postura"],
      availability: "Disponible en 3 días",
      price: "Desde $850 MXN",
    },
  ];

  // Datos de ejemplo para centros wellness
  const centers: Center[] = [
    {
      id: "1",
      name: "Serenity Wellness Center",
      type: "Centro Holístico",
      rating: 4.9,
      location: "Ciudad de México",
      services: ["Yoga", "Meditación", "Masajes", "Terapias"],
      image: "/placeholder.svg?height=500&width=800",
      tags: ["Yoga", "Spa", "Terapias"],
      price: "Desde $500 MXN",
    },
    {
      id: "2",
      name: "Equilibrium Spa & Yoga",
      type: "Spa y Centro de Yoga",
      rating: 4.7,
      location: "Cancún",
      services: ["Tratamientos Spa", "Clases de Yoga", "Sauna", "Masajes"],
      image: "/placeholder.svg?height=500&width=800",
      tags: ["Spa", "Yoga", "Masajes"],
      price: "Desde $800 MXN",
    },
    {
      id: "3",
      name: "Natura Healing Center",
      type: "Centro de Sanación",
      rating: 4.8,
      location: "San Miguel de Allende",
      services: ["Temazcal", "Acupuntura", "Terapias Energéticas", "Retiros"],
      image: "/placeholder.svg?height=500&width=800",
      tags: ["Temazcal", "Retiros", "Sanación"],
      price: "Desde $600 MXN",
    },
    {
      id: "4",
      name: "Zen Garden Retreat",
      type: "Centro de Retiros",
      rating: 4.9,
      location: "Valle de Bravo",
      services: [
        "Retiros de Silencio",
        "Meditación",
        "Alimentación Consciente",
      ],
      image: "/placeholder.svg?height=500&width=800",
      tags: ["Retiros", "Meditación", "Naturaleza"],
      price: "Desde $1,200 MXN",
    },
  ];

  // Categorías para filtrar
  const categories = [
    { id: "all", name: "Todos" },
    { id: "yoga", name: "Yoga" },
    { id: "nutrition", name: "Nutrición" },
    { id: "therapy", name: "Terapias" },
    { id: "meditation", name: "Meditación" },
    { id: "massage", name: "Masajes" },
    { id: "acupuncture", name: "Acupuntura" },
  ];

  // Filtrar profesionales por búsqueda y categoría
  const filteredProfessionals = professionals.filter((pro) => {
    const matchesSearch =
      searchQuery === "" ||
      pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" ||
      pro.tags.some((tag) =>
        tag.toLowerCase().includes(selectedCategory.toLowerCase())
      );

    return matchesSearch && matchesCategory;
  });

  // Filtrar centros por búsqueda y categoría
  const filteredCenters = centers.filter((center) => {
    const matchesSearch =
      searchQuery === "" ||
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" ||
      center.tags.some((tag) =>
        tag.toLowerCase().includes(selectedCategory.toLowerCase())
      );

    return matchesSearch && matchesCategory;
  });

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
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(172, 137, 255, 0.1),
            0 10px 10px -5px rgba(131, 199, 253, 0.1);
        }
      `}</style>

      {/* Gradient blobs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[120px] -z-10"></div>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-[#0D0D0D]/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold animated-gradient-text">
              Holistia
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/explore"
                className="text-white hover:text-[#AC89FF] transition-colors"
              >
                Explorar
              </Link>
              <Link
                href="/appointments"
                className="text-white/70 hover:text-white transition-colors"
              >
                Mis Citas
              </Link>
              <Link
                href="/messages"
                className="text-white/70 hover:text-white transition-colors"
              >
                Mensajes
              </Link>
              <Link
                href="/favorites"
                className="text-white/70 hover:text-white transition-colors"
              >
                Favoritos
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10 border border-white/20">
                    <AvatarImage
                      src="/placeholder.svg?height=40&width=40"
                      alt="@usuario"
                    />
                    <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                      US
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-[#1A1A1A] border-white/10 text-white"
                align="end"
                forceMount
              >
                <DropdownMenuItem className="hover:bg-white/5">
                  <Link href="/profile" className="flex items-center w-full">
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-white/5">
                  <Link href="/settings" className="flex items-center w-full">
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-white/5 text-red-400">
                  <Link href="/logout" className="flex items-center w-full">
                    Cerrar Sesión
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Explora el bienestar
              </h1>
              <p className="text-white/70 max-w-2xl">
                Descubre profesionales y centros especializados en bienestar
                integral para tu mente, cuerpo y espíritu.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#1A1A1A] border-white/10 text-white">
                  <DropdownMenuItem className="hover:bg-white/5">
                    Más valorados
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-white/5">
                    Precio: Menor a Mayor
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-white/5">
                    Precio: Mayor a Menor
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-white/5">
                    Disponibilidad Hoy
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-white/5">
                    Más cercanos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Ubicación
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
            <Input
              type="text"
              placeholder="Busca por nombre, especialidad, ubicación o servicio..."
              className="pl-10 bg-white/5 border-white/20 focus:border-[#AC89FF] text-white placeholder:text-white/50 h-12 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                className={`
                  cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] border-transparent text-white"
                      : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                  }
                `}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </section>

        {/* Tabs for Professionals and Centers */}
        <Tabs
          defaultValue="professionals"
          className="mb-12"
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-lg mb-8">
            <TabsTrigger
              value="professionals"
              className={`rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white`}
            >
              Profesionales
            </TabsTrigger>
            <TabsTrigger
              value="centers"
              className={`rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white`}
            >
              Centros Wellness
            </TabsTrigger>
          </TabsList>

          {/* Professionals Tab */}
          <TabsContent value="professionals">
            {filteredProfessionals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfessionals.map((professional) => (
                  <div
                    key={professional.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden card-hover"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={professional.image || "/placeholder.svg"}
                        alt={professional.name}
                        fill
                        className="object-cover"
                      />
                      <button className="absolute top-3 right-3 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors">
                        <Heart className="h-5 w-5 text-white" />
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">
                            {professional.name}
                          </h3>
                          <p className="text-[#AC89FF]">
                            {professional.specialty}
                          </p>
                        </div>
                        <div className="flex items-center bg-white/10 px-2 py-1 rounded-md">
                          <Star
                            className="h-3.5 w-3.5 text-yellow-400 mr-1"
                            fill="#FBBF24"
                          />
                          <span className="text-sm font-medium">
                            {professional.rating}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-white/70 text-sm mb-3">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span>{professional.location}</span>
                      </div>

                      <p className="text-white/80 text-sm mb-4 line-clamp-2">
                        {professional.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {professional.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-[#AFF344]" />
                          <span className="text-[#AFF344]">
                            {professional.availability}
                          </span>
                        </div>
                        <div className="text-sm text-white/80">
                          {professional.price}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
                          <span className="relative z-10 flex items-center">
                            Agendar cita
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          Ver perfil
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                  <Search className="h-8 w-8 text-white/50" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-white/70 max-w-md mx-auto">
                  No encontramos profesionales que coincidan con tu búsqueda.
                  Intenta con otros términos o filtros.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Centers Tab */}
          <TabsContent value="centers">
            {filteredCenters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCenters.map((center) => (
                  <div
                    key={center.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden card-hover"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={center.image || "/placeholder.svg"}
                        alt={center.name}
                        fill
                        className="object-cover"
                      />
                      <button className="absolute top-3 right-3 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors">
                        <Heart className="h-5 w-5 text-white" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="font-bold text-xl text-white">
                          {center.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-white/90">{center.type}</p>
                          <div className="flex items-center bg-white/10 px-2 py-1 rounded-md">
                            <Star
                              className="h-3.5 w-3.5 text-yellow-400 mr-1"
                              fill="#FBBF24"
                            />
                            <span className="text-sm font-medium">
                              {center.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center text-white/70 text-sm mb-3">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span>{center.location}</span>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm text-white/70 mb-2">
                          Servicios destacados:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {center.services.map((service, index) => (
                            <Badge
                              key={index}
                              className="bg-white/10 hover:bg-white/20 text-white border-none"
                            >
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-wrap gap-1">
                          {center.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-[#AC89FF]/20 text-[#AC89FF] px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-white/80">
                          {center.price}
                        </div>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
                        <span className="relative z-10 flex items-center">
                          Ver centro
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                  <Search className="h-8 w-8 text-white/50" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-white/70 max-w-md mx-auto">
                  No encontramos centros wellness que coincidan con tu búsqueda.
                  Intenta con otros términos o filtros.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Featured section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Destacados para ti</h2>
            <Button
              variant="link"
              className="text-[#AC89FF] hover:text-[#83C7FD]"
            >
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="bg-gradient-to-r from-[#AC89FF]/10 to-[#83C7FD]/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] rounded-full p-2 mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">
                Recomendaciones personalizadas
              </h3>
            </div>

            <p className="text-white/70 mb-6">
              Basado en tus preferencias y búsquedas anteriores, hemos
              seleccionado estos profesionales y centros que podrían
              interesarte.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 flex items-center">
                <Avatar className="h-12 w-12 mr-3 border border-white/10">
                  <AvatarImage
                    src="/placeholder.svg?height=48&width=48"
                    alt="Dr. Martínez"
                  />
                  <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                    DM
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">Dr. Martínez</h4>
                  <p className="text-sm text-white/70">Medicina Integrativa</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 flex items-center">
                <Avatar className="h-12 w-12 mr-3 border border-white/10">
                  <AvatarImage
                    src="/placeholder.svg?height=48&width=48"
                    alt="Harmony Center"
                  />
                  <AvatarFallback className="bg-[#83C7FD]/20 text-[#83C7FD]">
                    HC
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">Harmony Center</h4>
                  <p className="text-sm text-white/70">Centro de Yoga</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 flex items-center">
                <Avatar className="h-12 w-12 mr-3 border border-white/10">
                  <AvatarImage
                    src="/placeholder.svg?height=48&width=48"
                    alt="Mtra. Sánchez"
                  />
                  <AvatarFallback className="bg-[#AFF344]/20 text-[#AFF344]">
                    MS
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">Mtra. Sánchez</h4>
                  <p className="text-sm text-white/70">Terapia Holística</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pagination */}
        <div className="flex justify-center mt-12">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 w-10 p-0"
            >
              &lt;
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-[#AC89FF] hover:bg-[#AC89FF]/90 text-white w-10 p-0"
            >
              1
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 w-10 p-0"
            >
              2
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 w-10 p-0"
            >
              3
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 w-10 p-0"
            >
              &gt;
            </Button>
          </div>
        </div>
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

const Bell = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
};
