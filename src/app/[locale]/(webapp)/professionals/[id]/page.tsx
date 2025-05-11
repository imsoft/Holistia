import Link from "next/link";
import { notFound } from "next/navigation";
import { professionalService } from "@/services/professional-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Calendar,
  Star,
  Edit,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";

export default async function ProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const professional = await professionalService.getProfessional(id);
  const contact = await professionalService.getProfessionalContact(id);
  const services = await professionalService.getProfessionalServices(id);

  if (!professional) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Gradient blobs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Link href="/professionals">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a profesionales
            </Button>
          </Link>
        </div>

        {/* Portada y perfil */}
        <div className="relative mb-8">
          <div className="h-48 md:h-64 w-full rounded-xl overflow-hidden bg-gradient-to-r from-[#AC89FF]/20 to-[#83C7FD]/20">
            {professional.cover_image_url ? (
              <Image
                src={professional.cover_image_url || "/placeholder.svg"}
                alt={`Portada de ${professional.name}`}
                className="w-full h-full object-cover"
                width={500}
                height={200}
              />
            ) : null}
          </div>

          <div className="absolute -bottom-16 left-8 flex items-end">
            <Avatar className="h-32 w-32 border-4 border-[#0D0D0D]">
              {professional.image_url ? (
                <AvatarImage
                  src={professional.image_url || "/placeholder.svg"}
                  alt={professional.name}
                />
              ) : null}
              <AvatarFallback className="text-3xl bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] text-white">
                {professional.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="absolute bottom-4 right-4">
            <Link href={`/professionals/${id}/edit`}>
              <Button className="bg-white/10 hover:bg-white/20 text-white">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Columna izquierda - Información principal */}
            <div className="w-full md:w-2/3 space-y-8">
              <div>
                <h1 className="text-3xl font-bold">{professional.name}</h1>
                <div className="flex items-center mt-2">
                  <Badge className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] text-white border-none">
                    {professional.specialty}
                  </Badge>
                  {professional.verified && (
                    <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                      Verificado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center mt-4 text-white/70">
                  {professional.location && (
                    <div className="flex items-center mr-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{professional.location}</span>
                    </div>
                  )}
                  {professional.experience && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{professional.experience} de experiencia</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-white/10" />

              {professional.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Acerca de</h2>
                  <p className="text-white/80 whitespace-pre-line">
                    {professional.description}
                  </p>
                </div>
              )}

              {professional.education && professional.education.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Educación y certificaciones
                  </h2>
                  <ul className="space-y-2">
                    {professional.education.map((edu, index) => (
                      <li
                        key={index}
                        className="bg-white/5 p-3 rounded-md text-white/80"
                      >
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {services && services.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Servicios</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <Card
                        key={service.id}
                        className="bg-white/5 border-white/10"
                      >
                        <CardContent className="p-4">
                          <h3 className="font-medium">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-white/70 mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            {service.duration && (
                              <span className="text-sm text-white/60">
                                {service.duration}
                              </span>
                            )}
                            {service.price_display && (
                              <span className="font-medium text-[#AC89FF]">
                                {service.price_display}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha - Información de contacto y detalles */}
            <div className="w-full md:w-1/3 space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Información de contacto
                  </h2>
                  <div className="space-y-4">
                    {contact?.email && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-[#AC89FF]" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-white/80 hover:text-white"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact?.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 text-[#AC89FF]" />
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-white/80 hover:text-white"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact?.website && (
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 mr-3 text-[#AC89FF]" />
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 hover:text-white"
                        >
                          {contact.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </div>

                  {(contact?.instagram ||
                    contact?.facebook ||
                    contact?.linkedin) && (
                    <>
                      <Separator className="my-4 bg-white/10" />
                      <h3 className="font-medium mb-3">Redes sociales</h3>
                      <div className="flex gap-3">
                        {contact?.instagram && (
                          <a
                            href={contact.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/10 rounded-full hover:bg-[#AC89FF]/20 transition-colors"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {contact?.facebook && (
                          <a
                            href={contact.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/10 rounded-full hover:bg-[#AC89FF]/20 transition-colors"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {contact?.linkedin && (
                          <a
                            href={contact.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/10 rounded-full hover:bg-[#AC89FF]/20 transition-colors"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {professional.languages && professional.languages.length > 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Idiomas</h2>
                    <div className="flex flex-wrap gap-2">
                      {professional.languages.map((lang, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-white/20 text-white/80"
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Valoraciones</h2>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(professional.rating || 0)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-white/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 font-medium">
                      {professional.rating?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">
                    Basado en {professional.review_count || 0}{" "}
                    {professional.review_count === 1 ? "reseña" : "reseñas"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
