"use client";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Globe,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Info,
  MapIcon,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  WellnessCenter,
  WellnessCenterContact,
  WellnessCenterImage,
  OpeningHours,
} from "@/types/database.types";
import Image from "next/image";

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

interface WellnessCenterProfileProps {
  wellnessCenter: WellnessCenter;
  contact?: WellnessCenterContact | null;
  images?: WellnessCenterImage[];
  openingHours?: OpeningHours[];
}

export function WellnessCenterProfile({
  wellnessCenter,
  contact,
  images,
  openingHours,
}: WellnessCenterProfileProps) {
  return (
    <div className="space-y-8">
      {/* Cabecera con imagen de portada */}
      <div className="relative h-64 rounded-xl overflow-hidden">
        <Image
          src={wellnessCenter.cover_image_url || "/serene-wellness-space.png"}
          alt={wellnessCenter.name}
          className="w-full h-full object-cover"
          width={1280}
          height={400}
        />
        {wellnessCenter.verified && (
          <Badge className="absolute top-4 right-4 bg-green-500/80 hover:bg-green-500">
            Verificado
          </Badge>
        )}
      </div>

      {/* Información principal */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-white/10 mb-4">
                <Image
                  src={
                    wellnessCenter.logo_url ||
                    "/placeholder.svg?height=96&width=96&query=wellness center logo"
                  }
                  alt={`Logo de ${wellnessCenter.name}`}
                  className="h-full w-full object-cover"
                  width={96}
                  height={96}
                />
              </div>
              <CardTitle className="text-2xl">{wellnessCenter.name}</CardTitle>
              <p className="text-white/70">{wellnessCenter.type}</p>
              {wellnessCenter.established && (
                <p className="text-sm text-white/60">
                  Establecido en {wellnessCenter.established}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {wellnessCenter.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#83C7FD]" />
                  <span>{wellnessCenter.location}</span>
                </div>
              )}

              {wellnessCenter.address && (
                <div className="flex items-start gap-2">
                  <MapIcon className="h-5 w-5 text-[#83C7FD] mt-1 flex-shrink-0" />
                  <span className="text-white/80">
                    {wellnessCenter.address}
                  </span>
                </div>
              )}

              {contact?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-[#83C7FD]" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="hover:text-[#AC89FF] transition-colors"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}

              {contact?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#83C7FD]" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-[#AC89FF] transition-colors"
                  >
                    {contact.email}
                  </a>
                </div>
              )}

              {contact?.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#83C7FD]" />
                  <a
                    href={
                      contact.website.startsWith("http")
                        ? contact.website
                        : `https://${contact.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#AC89FF] transition-colors"
                  >
                    Sitio web
                  </a>
                </div>
              )}

              <Separator className="bg-white/10" />

              <div className="flex flex-wrap gap-2">
                {contact?.instagram && (
                  <a
                    href={`https://instagram.com/${contact.instagram.replace(
                      "@",
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 rounded-full hover:bg-[#AC89FF]/20 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}

                {contact?.facebook && (
                  <a
                    href={`https://facebook.com/${contact.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 rounded-full hover:bg-[#AC89FF]/20 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
              </div>

              {wellnessCenter.rating && (
                <>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    <span className="text-lg font-semibold">
                      {wellnessCenter.rating.toFixed(1)}
                    </span>
                    <span className="text-white/60">
                      ({wellnessCenter.review_count} reseñas)
                    </span>
                  </div>
                </>
              )}

              <Button className="w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group">
                <Calendar className="h-4 w-4 mr-2" />
                Reservar cita
                <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="bg-white/5 border-white/10 mb-6">
              <TabsTrigger
                value="about"
                className="data-[state=active]:bg-white/10"
              >
                <Info className="h-4 w-4 mr-2" />
                Acerca de
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="data-[state=active]:bg-white/10"
              >
                <Clock className="h-4 w-4 mr-2" />
                Servicios
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="data-[state=active]:bg-white/10"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Galería
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle>Acerca del centro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 whitespace-pre-line">
                    {wellnessCenter.description}
                  </p>
                </CardContent>
              </Card>

              {wellnessCenter.features &&
                wellnessCenter.features.length > 0 && (
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                      <CardTitle>Características e instalaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {wellnessCenter.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-white/5 rounded-md"
                          >
                            <div className="h-2 w-2 rounded-full bg-[#83C7FD]" />
                            <span className="text-white/80">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {openingHours && openingHours.length > 0 && (
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader>
                    <CardTitle>Horarios de apertura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {openingHours.map((hour) => (
                        <div
                          key={hour.id}
                          className="flex justify-between p-2 bg-white/5 rounded-md"
                        >
                          <span className="font-medium">{hour.day}</span>
                          <span className="text-white/80">
                            {hour.is_closed
                              ? "Cerrado"
                              : `${hour.open_time} - ${hour.close_time}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle>Servicios ofrecidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-white/70 mb-4">
                      Próximamente podrás ver los servicios ofrecidos por este
                      centro.
                    </p>
                    <Button
                      variant="outline"
                      className="border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      Contactar para más información
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle>Galería de imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  {images && images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className="h-48 rounded-lg overflow-hidden"
                        >
                          <Image
                            src={image.image_url || "/placeholder.svg"}
                            alt={wellnessCenter.name}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            width={400}
                            height={200}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/70">
                        Este centro aún no ha subido imágenes a su galería.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
