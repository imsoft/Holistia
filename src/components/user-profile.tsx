"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  User,
  Settings,
  Calendar,
  Heart,
  Bell,
  LogOut,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  ChevronRight,
  Shield,
  Lock,
  CreditCard,
  HelpCircle,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Tipos para los datos
type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
  coverImage: string;
  joinDate: string;
  preferences: {
    categories: string[];
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  appointments: Appointment[];
  favorites: {
    professionals: FavoriteItem[];
    centers: FavoriteItem[];
  };
};

type Appointment = {
  id: string;
  date: string;
  time: string;
  with: {
    name: string;
    type: "professional" | "center";
    image: string;
    specialty?: string;
  };
  service: string;
  status: "upcoming" | "completed" | "cancelled";
};

type FavoriteItem = {
  id: string;
  name: string;
  image: string;
  type: string;
  rating: number;
  location: string;
};

export const UserProfile = ({ user }: { user: UserProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userForm, setUserForm] = useState<Partial<UserProfile>>({});

  const handleEditProfile = () => {
    setIsEditing(true);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      bio: user.bio,
    });
  };

  const handleSaveProfile = () => {
    // Aquí iría la lógica para guardar los cambios
    console.log("Guardando cambios:", userForm);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (
    type: keyof UserProfile["preferences"]["notifications"],
    value: boolean
  ) => {
    console.log(`Cambiando notificación ${type} a ${value}`);
    // Aquí iría la lógica para actualizar las preferencias de notificación
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
                className="text-white/70 hover:text-white transition-colors"
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
            <Avatar className="h-10 w-10 border border-[#AC89FF]">
              <AvatarImage
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
              />
              <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Portada y perfil */}
        <section className="relative mb-8">
          <div className="h-48 md:h-64 w-full relative rounded-xl overflow-hidden">
            <Image
              src={user.coverImage || "/placeholder.svg"}
              alt="Portada"
              fill
              className="object-cover opacity-70"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0D0D]/80"></div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end -mt-16 md:-mt-20 relative z-10 px-4">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-[#0D0D0D] shadow-xl">
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF] text-4xl">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-1 right-1 bg-[#AC89FF] rounded-full p-1.5 border-2 border-[#0D0D0D]">
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {user.name}
                  </h1>
                  <p className="text-white/70 text-sm mb-2">
                    Miembro desde{" "}
                    {format(new Date(user.joinDate), "MMMM yyyy", {
                      locale: es,
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.categories.map((category, index) => (
                      <Badge
                        key={index}
                        className="bg-white/10 hover:bg-white/20 text-white border-none"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {!isEditing && (
                  <Button
                    onClick={handleEditProfile}
                    className="mt-4 md:mt-0 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar perfil
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Contenido principal */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Información del usuario */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="bg-white/5 border border-white/10 p-1 rounded-lg mb-6 w-full grid grid-cols-4">
                <TabsTrigger
                  value="profile"
                  className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger
                  value="appointments"
                  className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Citas
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favoritos
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-md transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#AC89FF] data-[state=active]:to-[#83C7FD] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </TabsTrigger>
              </TabsList>

              {/* Tab: Perfil */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Información personal</span>
                      {isEditing && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={handleSaveProfile}
                            className="bg-[#AFF344] hover:bg-[#AFF344]/90 text-[#0D0D0D]"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nombre completo</Label>
                            <Input
                              id="name"
                              name="name"
                              value={userForm.name || ""}
                              onChange={handleInputChange}
                              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={userForm.email || ""}
                              onChange={handleInputChange}
                              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                              id="phone"
                              name="phone"
                              value={userForm.phone || ""}
                              onChange={handleInputChange}
                              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Ubicación</Label>
                            <Input
                              id="location"
                              name="location"
                              value={userForm.location || ""}
                              onChange={handleInputChange}
                              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Biografía</Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            value={userForm.bio || ""}
                            onChange={handleInputChange}
                            rows={4}
                            className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center text-white/70">
                              <Mail className="h-4 w-4 mr-2 text-[#AC89FF]" />
                              <span className="text-sm">
                                Correo electrónico
                              </span>
                            </div>
                            <p>{user.email}</p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center text-white/70">
                              <Phone className="h-4 w-4 mr-2 text-[#AC89FF]" />
                              <span className="text-sm">Teléfono</span>
                            </div>
                            <p>{user.phone}</p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center text-white/70">
                              <MapPin className="h-4 w-4 mr-2 text-[#AC89FF]" />
                              <span className="text-sm">Ubicación</span>
                            </div>
                            <p>{user.location}</p>
                          </div>
                        </div>

                        <Separator className="my-6 bg-white/10" />

                        <div>
                          <h3 className="text-lg font-medium mb-3">Sobre mí</h3>
                          <p className="text-white/80 leading-relaxed">
                            {user.bio}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Intereses y preferencias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Categorías de interés
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {user.preferences.categories.map((category, index) => (
                          <Badge
                            key={index}
                            className="bg-gradient-to-r from-[#AC89FF]/20 to-[#83C7FD]/20 text-white border-none px-3 py-1.5"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Citas */}
              <TabsContent value="appointments" className="space-y-6">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Próximas citas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {user.appointments
                        .filter(
                          (appointment) => appointment.status === "upcoming"
                        )
                        .map((appointment) => (
                          <div
                            key={appointment.id}
                            className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#AC89FF]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <Avatar className="h-12 w-12 mr-3 border border-white/10">
                                  <AvatarImage
                                    src={
                                      appointment.with.image ||
                                      "/placeholder.svg"
                                    }
                                    alt={appointment.with.name}
                                  />
                                  <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                                    {appointment.with.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">
                                    {appointment.with.name}
                                  </h4>
                                  <p className="text-sm text-white/70">
                                    {appointment.with.specialty ||
                                      appointment.with.type}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-[#AFF344]/20 text-[#AFF344] border-none">
                                Próxima
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-[#83C7FD]" />
                                <span>
                                  {format(
                                    new Date(appointment.date),
                                    "d 'de' MMMM, yyyy",
                                    { locale: es }
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-[#83C7FD]" />
                                <span>{appointment.time}</span>
                              </div>
                            </div>

                            <div className="bg-white/5 rounded p-3">
                              <p className="text-sm text-white/80">
                                {appointment.service}
                              </p>
                            </div>

                            <div className="flex justify-end mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20 bg-white/5 hover:bg-white/10"
                              >
                                Reprogramar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ))}

                      {user.appointments.filter(
                        (appointment) => appointment.status === "upcoming"
                      ).length === 0 && (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 mx-auto text-white/30 mb-3" />
                          <h3 className="text-lg font-medium mb-1">
                            No tienes citas próximas
                          </h3>
                          <p className="text-white/60 max-w-md mx-auto mb-4">
                            Explora profesionales y centros de bienestar para
                            agendar tu próxima cita.
                          </p>
                          <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white">
                            Explorar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Historial de citas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {user.appointments
                        .filter(
                          (appointment) => appointment.status === "completed"
                        )
                        .map((appointment) => (
                          <div
                            key={appointment.id}
                            className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3 border border-white/10">
                                  <AvatarImage
                                    src={
                                      appointment.with.image ||
                                      "/placeholder.svg"
                                    }
                                    alt={appointment.with.name}
                                  />
                                  <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                                    {appointment.with.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">
                                    {appointment.with.name}
                                  </h4>
                                  <p className="text-sm text-white/70">
                                    {appointment.with.specialty ||
                                      appointment.with.type}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-white/10 text-white/70 border-none">
                                Completada
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-white/70 mb-2">
                              <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                <span>
                                  {format(
                                    new Date(appointment.date),
                                    "d 'de' MMMM, yyyy",
                                    { locale: es }
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>{appointment.time}</span>
                              </div>
                            </div>

                            <p className="text-sm text-white/80">
                              {appointment.service}
                            </p>

                            <div className="flex justify-end mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20 bg-white/5 hover:bg-white/10"
                              >
                                Dejar reseña
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 border-white/20 bg-white/5 hover:bg-white/10"
                              >
                                Agendar similar
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Favoritos */}
              <TabsContent value="favorites" className="space-y-6">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Profesionales favoritos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.favorites.professionals.map((professional) => (
                        <div
                          key={professional.id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#AC89FF]/50 transition-colors card-hover"
                        >
                          <div className="flex items-center mb-3">
                            <Avatar className="h-12 w-12 mr-3 border border-white/10">
                              <AvatarImage
                                src={professional.image || "/placeholder.svg"}
                                alt={professional.name}
                              />
                              <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                                {professional.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">
                                {professional.name}
                              </h4>
                              <p className="text-sm text-[#AC89FF]">
                                {professional.type}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-sm text-white/70">
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              <span>{professional.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Star
                                className="h-3.5 w-3.5 text-yellow-400 mr-1"
                                fill="#FBBF24"
                              />
                              <span className="text-sm">
                                {professional.rating}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/5 hover:bg-white/10"
                            >
                              Ver perfil
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white"
                              size="sm"
                            >
                              Agendar cita
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {user.favorites.professionals.length === 0 && (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 mx-auto text-white/30 mb-3" />
                        <h3 className="text-lg font-medium mb-1">
                          No tienes profesionales favoritos
                        </h3>
                        <p className="text-white/60 max-w-md mx-auto mb-4">
                          Explora y guarda tus profesionales favoritos para
                          acceder rápidamente a ellos.
                        </p>
                        <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white">
                          Explorar profesionales
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Centros favoritos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.favorites.centers.map((center) => (
                        <div
                          key={center.id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#AC89FF]/50 transition-colors card-hover"
                        >
                          <div className="flex items-center mb-3">
                            <Avatar className="h-12 w-12 mr-3 border border-white/10">
                              <AvatarImage
                                src={center.image || "/placeholder.svg"}
                                alt={center.name}
                              />
                              <AvatarFallback className="bg-[#83C7FD]/20 text-[#83C7FD]">
                                {center.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{center.name}</h4>
                              <p className="text-sm text-[#83C7FD]">
                                {center.type}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-sm text-white/70">
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              <span>{center.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Star
                                className="h-3.5 w-3.5 text-yellow-400 mr-1"
                                fill="#FBBF24"
                              />
                              <span className="text-sm">{center.rating}</span>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/5 hover:bg-white/10"
                            >
                              Ver centro
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white"
                              size="sm"
                            >
                              Reservar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {user.favorites.centers.length === 0 && (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 mx-auto text-white/30 mb-3" />
                        <h3 className="text-lg font-medium mb-1">
                          No tienes centros favoritos
                        </h3>
                        <p className="text-white/60 max-w-md mx-auto mb-4">
                          Explora y guarda tus centros favoritos para acceder
                          rápidamente a ellos.
                        </p>
                        <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white">
                          Explorar centros
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Configuración */}
              <TabsContent value="settings" className="space-y-6">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Notificaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            Notificaciones por correo
                          </h4>
                          <p className="text-sm text-white/70">
                            Recibe recordatorios y actualizaciones por correo
                          </p>
                        </div>
                        <Switch
                          checked={user.preferences.notifications.email}
                          onCheckedChange={(checked) =>
                            handleNotificationChange("email", checked)
                          }
                          className="data-[state=checked]:bg-[#AC89FF]"
                        />
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Notificaciones push</h4>
                          <p className="text-sm text-white/70">
                            Recibe notificaciones en tu navegador
                          </p>
                        </div>
                        <Switch
                          checked={user.preferences.notifications.push}
                          onCheckedChange={(checked) =>
                            handleNotificationChange("push", checked)
                          }
                          className="data-[state=checked]:bg-[#AC89FF]"
                        />
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Notificaciones SMS</h4>
                          <p className="text-sm text-white/70">
                            Recibe recordatorios por mensaje de texto
                          </p>
                        </div>
                        <Switch
                          checked={user.preferences.notifications.sms}
                          onCheckedChange={(checked) =>
                            handleNotificationChange("sms", checked)
                          }
                          className="data-[state=checked]:bg-[#AC89FF]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Seguridad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#AC89FF]/20 flex items-center justify-center mr-4">
                            <Lock className="h-5 w-5 text-[#AC89FF]" />
                          </div>
                          <div>
                            <h4 className="font-medium">Cambiar contraseña</h4>
                            <p className="text-sm text-white/70">
                              Actualiza tu contraseña de acceso
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          Cambiar
                        </Button>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#83C7FD]/20 flex items-center justify-center mr-4">
                            <Shield className="h-5 w-5 text-[#83C7FD]" />
                          </div>
                          <div>
                            <h4 className="font-medium">
                              Verificación en dos pasos
                            </h4>
                            <p className="text-sm text-white/70">
                              Añade una capa extra de seguridad
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          Configurar
                        </Button>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#AFF344]/20 flex items-center justify-center mr-4">
                            <CreditCard className="h-5 w-5 text-[#AFF344]" />
                          </div>
                          <div>
                            <h4 className="font-medium">Métodos de pago</h4>
                            <p className="text-sm text-white/70">
                              Gestiona tus tarjetas y métodos de pago
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Cuenta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center mr-4">
                            <HelpCircle className="h-5 w-5 text-white/70" />
                          </div>
                          <div>
                            <h4 className="font-medium">Centro de ayuda</h4>
                            <p className="text-sm text-white/70">
                              Obtén ayuda y soporte
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center mr-4">
                            <LogOut className="h-5 w-5 text-red-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-red-400">
                              Cerrar sesión
                            </h4>
                            <p className="text-sm text-white/70">
                              Salir de tu cuenta
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
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
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10 text-white sticky top-24">
                <CardHeader>
                  <CardTitle>Resumen de actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-[#AC89FF]">
                          {
                            user.appointments.filter(
                              (a) => a.status === "completed"
                            ).length
                          }
                        </p>
                        <p className="text-sm text-white/70">
                          Citas completadas
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-[#83C7FD]">
                          {
                            user.appointments.filter(
                              (a) => a.status === "upcoming"
                            ).length
                          }
                        </p>
                        <p className="text-sm text-white/70">Citas próximas</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-[#AFF344]">
                          {user.favorites.professionals.length +
                            user.favorites.centers.length}
                        </p>
                        <p className="text-sm text-white/70">Favoritos</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-white/90">
                          {user.preferences.categories.length}
                        </p>
                        <p className="text-sm text-white/70">Intereses</p>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Próxima cita</h3>
                      {user.appointments.filter((a) => a.status === "upcoming")
                        .length > 0 ? (
                        <div className="bg-gradient-to-r from-[#AC89FF]/10 to-[#83C7FD]/10 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <Avatar className="h-10 w-10 mr-3 border border-white/10">
                              <AvatarImage
                                src={
                                  user.appointments.find(
                                    (a) => a.status === "upcoming"
                                  )?.with.image ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg"
                                }
                                alt={
                                  user.appointments.find(
                                    (a) => a.status === "upcoming"
                                  )?.with.name || ""
                                }
                              />
                              <AvatarFallback className="bg-[#AC89FF]/20 text-[#AC89FF]">
                                {user.appointments
                                  .find((a) => a.status === "upcoming")
                                  ?.with.name.charAt(0) || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">
                                {
                                  user.appointments.find(
                                    (a) => a.status === "upcoming"
                                  )?.with.name
                                }
                              </h4>
                              <p className="text-sm text-white/70">
                                {
                                  user.appointments.find(
                                    (a) => a.status === "upcoming"
                                  )?.service
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-[#AC89FF]" />
                              <span>
                                {format(
                                  new Date(
                                    user.appointments.find(
                                      (a) => a.status === "upcoming"
                                    )?.date || ""
                                  ),
                                  "d 'de' MMMM",
                                  { locale: es }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1 text-[#AC89FF]" />
                              <span>
                                {
                                  user.appointments.find(
                                    (a) => a.status === "upcoming"
                                  )?.time
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-white/60">
                            No tienes citas programadas
                          </p>
                          <Button
                            variant="link"
                            className="text-[#AC89FF] hover:text-[#83C7FD] mt-1 p-0"
                          >
                            Agendar una cita
                          </Button>
                        </div>
                      )}
                    </div>

                    <Button className="w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
                      <span className="relative z-10">Ver todas mis citas</span>
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
