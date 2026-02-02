"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Briefcase,
  Users,
  Heart,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Info,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HolisticService {
  id: string;
  name: string;
  description: string;
  benefits?: string[];
  icon?: string;
  is_active: boolean;
  images?: Array<{
    id: string;
    image_url: string;
    image_order: number;
  }>;
}

const COMPANY_SIZES = [
  "1-10 empleados",
  "11-50 empleados",
  "51-200 empleados",
  "201-500 empleados",
  "501-1000 empleados",
  "1000+ empleados",
];

const INDUSTRIES = [
  "Tecnología",
  "Finanzas",
  "Salud",
  "Educación",
  "Manufactura",
  "Retail",
  "Servicios",
  "Construcción",
  "Alimentos y Bebidas",
  "Turismo",
  "Otro",
];

const CATEGORIES = [
  { name: "Mindfulness", href: "#servicios", imageSrc: "/hero/5.jpg" },
  { name: "Yoga", href: "#servicios", imageSrc: "/hero/12.jpg" },
  { name: "Terapia", href: "#servicios", imageSrc: "/hero/18.jpg" },
  { name: "Talleres", href: "#servicios", imageSrc: "/hero/22.jpg" },
  { name: "Bienestar emocional", href: "#servicios", imageSrc: "/hero/28.jpg" },
];

const COLLECTIONS = [
  {
    name: "Programas a medida",
    href: "#contacto",
    imageSrc: "/hero/8.jpg",
    imageAlt: "Equipo en sesión de bienestar.",
    description:
      "Diseñamos programas de bienestar corporativo adaptados al tamaño, industria y objetivos de tu empresa.",
  },
  {
    name: "Sesiones en tu empresa",
    href: "#contacto",
    imageSrc: "/hero/15.jpg",
    imageAlt: "Sesión grupal de mindfulness.",
    description:
      "Llevamos yoga, mindfulness, terapia y talleres a tus instalaciones para facilitar la participación de tu equipo.",
  },
  {
    name: "Profesionales certificados",
    href: "#servicios",
    imageSrc: "/hero/33.jpg",
    imageAlt: "Experto en bienestar holístico.",
    description:
      "Todos nuestros expertos están verificados por Holistia y especializados en bienestar corporativo.",
  },
];

export default function CompaniesLandingPage() {
  const [holisticServices, setHolisticServices] = useState<HolisticService[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "",
    company_size: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    city: "",
    service_date: "",
    service_time: "",
    service_address: "",
    additional_info: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchHolisticServices();
  }, []);

  const fetchHolisticServices = async () => {
    try {
      const { data, error } = await supabase
        .from("holistic_services")
        .select(
          `
          *,
          holistic_service_images (
            id,
            image_url,
            image_order
          )
        `
        )
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const servicesWithImages = (data || []).map((service) => ({
        ...service,
        images: (service.holistic_service_images || []).sort(
          (a: { image_order: number }, b: { image_order: number }) =>
            a.image_order - b.image_order
        ),
      }));

      setHolisticServices(servicesWithImages);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.company_name ||
      !formData.contact_email ||
      selectedServices.length === 0
    ) {
      toast.error(
        "Por favor completa todos los campos obligatorios y selecciona al menos un servicio"
      );
      return;
    }

    try {
      setLoading(true);

      const { data: newLead, error } = await supabase
        .from("company_leads")
        .insert({
          company_name: formData.company_name,
          industry: formData.industry || null,
          company_size: formData.company_size || null,
          contact_name: formData.contact_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone || null,
          city: formData.city || null,
          service_date: formData.service_date || null,
          service_time: formData.service_time || null,
          service_address: formData.service_address || null,
          additional_info: formData.additional_info || null,
          requested_services: selectedServices,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      try {
        await fetch("/api/companies/notify-new-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: newLead.id,
            company_name: formData.company_name,
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            service_date: formData.service_date,
            service_time: formData.service_time,
            service_address: formData.service_address,
            requested_services: selectedServices,
          }),
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
      }

      toast.success(
        "¡Solicitud enviada exitosamente! Nos pondremos en contacto contigo pronto."
      );

      setFormData({
        company_name: "",
        industry: "",
        company_size: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        city: "",
        service_date: "",
        service_time: "",
        service_address: "",
        additional_info: "",
      });
      setSelectedServices([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error al enviar la solicitud. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero: imagen full-width + overlay (estilo ejemplo) */}
      <section className="relative bg-gray-900">
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <Image
            alt=""
            src="/hero/1.jpg"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div aria-hidden className="absolute inset-0 bg-gray-900/60" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center sm:py-48 lg:px-0">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Bienestar holístico para tu empresa
          </h1>
          <p className="mt-4 text-xl text-white/95">
            Impulsa la productividad y la felicidad de tu equipo con servicios
            holísticos personalizados. Profesionales certificados al servicio
            del bienestar corporativo.
          </p>
          <Button
            size="lg"
            asChild
            className="mt-8 gap-2 rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 [&>a]:text-gray-900"
          >
            <a href="#contacto">
              Solicitar información
              <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      <main>
        {/* Categorías: estilo "Shop by Category" */}
        <section
          aria-labelledby="category-heading"
          className="pt-24 sm:pt-32 xl:mx-auto xl:max-w-7xl xl:px-8"
        >
          <div className="px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-0">
            <h2
              id="category-heading"
              className="text-2xl font-bold tracking-tight text-gray-900"
            >
              Explora por categoría
            </h2>
            <a
              href="#servicios"
              className="hidden text-sm font-semibold text-primary hover:text-primary/90 sm:inline-flex items-center gap-1"
            >
              Ver todos los servicios
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-4 flow-root">
            <div className="-my-2">
              <div className="relative box-content h-80 overflow-x-auto py-2 xl:overflow-visible">
                <div className="absolute flex space-x-8 px-4 sm:px-6 lg:px-8 xl:relative xl:grid xl:grid-cols-5 xl:gap-x-8 xl:space-x-0 xl:px-0">
                  {CATEGORIES.map((category) => (
                    <Link
                      key={category.name}
                      href={category.href}
                      className="relative flex h-80 w-56 flex-col overflow-hidden rounded-lg p-6 hover:opacity-90 transition-opacity xl:w-auto"
                    >
                      <span aria-hidden className="absolute inset-0">
                        <Image
                          alt=""
                          src={category.imageSrc}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1280px) 224px, 1fr"
                        />
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0 bottom-0 h-2/3",
                          "bg-gradient-to-t from-gray-900/80 to-transparent"
                        )}
                      />
                      <span className="relative mt-auto text-center text-xl font-bold text-white">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 px-4 sm:hidden">
            <a
              href="#servicios"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/90"
            >
              Ver todos los servicios
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Featured: imagen + overlay + CTA */}
        <section
          aria-labelledby="featured-heading"
          className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8"
        >
          <div className="relative overflow-hidden rounded-lg">
            <div className="absolute inset-0">
              <Image
                alt=""
                src="/hero/10.jpg"
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
            <div className="relative bg-gray-900/75 px-6 py-32 sm:px-12 sm:py-40 lg:px-16">
              <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                <h2
                  id="featured-heading"
                  className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                >
                  <span className="block sm:inline">Eleva el bienestar</span>{" "}
                  <span className="block sm:inline">de tu equipo</span>
                </h2>
                <p className="mt-3 text-xl text-white">
                  Sesiones de yoga, mindfulness, terapia y talleres diseñados
                  para reducir el estrés y mejorar el clima laboral. Invierte en
                  tu gente y transforma tu organización.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-8 w-full rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
                >
                  <a href="#contacto">Solicitar cotización</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios: 4 cards (contenido Holistia) */}
        <section
          id="beneficios"
          aria-labelledby="benefits-heading"
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
        >
          <div className="text-center mb-12">
            <h2
              id="benefits-heading"
              className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
            >
              ¿Por qué elegir Holistia para tu empresa?
            </h2>
            <p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto">
              Invierte en el bienestar de tu equipo y transforma tu organización
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Mayor productividad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Equipos más felices y saludables son hasta 31% más productivos
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Menor rotación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Reduce la rotación de personal hasta en un 50% con programas
                  de bienestar
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Mejor clima laboral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Crea un ambiente de trabajo positivo y colaborativo
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Profesionales certificados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Acceso a terapeutas y coaches holísticos verificados
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Colección: 3 cards (estilo ejemplo) */}
        <section
          aria-labelledby="collection-heading"
          className="mx-auto max-w-xl px-4 pt-24 sm:px-6 sm:pt-32 lg:max-w-7xl lg:px-8"
        >
          <h2
            id="collection-heading"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            Cómo trabajamos con tu empresa
          </h2>
          <p className="mt-4 text-base text-gray-500">
            Programas flexibles y profesionales verificados para el bienestar
            integral de tu equipo.
          </p>

          <div className="mt-10 space-y-12 lg:grid lg:grid-cols-3 lg:space-y-0 lg:gap-x-8">
            {COLLECTIONS.map((collection) => (
              <Link
                key={collection.name}
                href={collection.href}
                className="group block"
              >
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg lg:aspect-[5/6]">
                  <Image
                    alt={collection.imageAlt}
                    src={collection.imageSrc}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-90"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {collection.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {collection.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Segundo featured */}
        <section
          aria-labelledby="comfort-heading"
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
        >
          <div className="relative overflow-hidden rounded-lg">
            <div className="absolute inset-0">
              <Image
                alt=""
                src="/hero/25.jpg"
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
            <div className="relative bg-gray-900/75 px-6 py-32 sm:px-12 sm:py-40 lg:px-16">
              <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                <h2
                  id="comfort-heading"
                  className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                >
                  Productividad y equilibrio
                </h2>
                <p className="mt-3 text-xl text-white">
                  Menos estrés y más enfoque. Nuestros programas de bienestar
                  corporativo ayudan a tu equipo a rendir mejor sin sacrificar
                  su salud. Un solo paso para empezar: solicita tu cotización.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-8 w-full rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
                >
                  <a href="#contacto">Solicitar cotización</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Servicios holísticos (desde DB) */}
        <section
          id="servicios"
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Nuestros servicios holísticos
            </h2>
            <p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto">
              Selecciona los servicios que mejor se adapten a las necesidades
              de tu equipo
            </p>
          </div>

          {holisticServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {holisticServices.map((service) => {
                const firstImage =
                  service.images && service.images.length > 0
                    ? service.images[0].image_url
                    : null;

                return (
                  <Card
                    key={service.id}
                    className="overflow-hidden transition-shadow hover:shadow-lg"
                  >
                    {firstImage && (
                      <div className="relative w-full h-48">
                        <Image
                          src={firstImage}
                          alt={service.name}
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                        {service.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {service.description}
                      </p>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Info className="h-4 w-4" />
                            Ver más detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">
                              {service.name}
                            </DialogTitle>
                            <DialogDescription className="text-base">
                              Información completa del servicio
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            {service.images && service.images.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Galería</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {service.images.map((img) => (
                                    <div
                                      key={img.id}
                                      className="relative aspect-square rounded-lg overflow-hidden"
                                    >
                                      <Image
                                        src={img.image_url}
                                        alt={`${service.name} - Imagen ${img.image_order}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">Descripción</h3>
                              <p className="text-muted-foreground leading-relaxed">
                                {service.description}
                              </p>
                            </div>

                            {service.benefits && service.benefits.length > 0 && (
                              <div className="space-y-2">
                                <h3 className="font-semibold text-lg">
                                  Beneficios para tu equipo
                                </h3>
                                <ul className="space-y-2">
                                  {service.benefits.map((benefit, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2"
                                    >
                                      <CheckCircle className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                                      <span className="text-muted-foreground">
                                        {benefit}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-pulse space-y-4 w-full max-w-md mx-auto">
                <div className="h-8 bg-muted rounded w-40 mx-auto" />
                <div className="h-64 bg-muted rounded-lg" />
              </div>
            </div>
          )}
        </section>

        {/* Formulario de contacto */}
        <section
          id="contacto"
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Solicita una cotización personalizada
              </h2>
              <p className="mt-4 text-base text-gray-500">
                Completa el formulario y nuestro equipo te contactará para
                crear un plan a la medida de tu empresa
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Información de tu empresa</CardTitle>
                <CardDescription>
                  Cuéntanos sobre tu organización y las necesidades de tu
                  equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nombre de la empresa *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({ ...formData, company_name: e.target.value })
                      }
                      placeholder="Mi Empresa S.A."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industria</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) =>
                          setFormData({ ...formData, industry: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una industria" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_size">Tamaño de la empresa</Label>
                      <Select
                        value={formData.company_size}
                        onValueChange={(value) =>
                          setFormData({ ...formData, company_size: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Número de empleados" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Información de contacto
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact_name">
                          Nombre del contacto *
                        </Label>
                        <Input
                          id="contact_name"
                          value={formData.contact_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contact_name: e.target.value,
                            })
                          }
                          placeholder="Juan Pérez"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contact_email">Email *</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contact_email: e.target.value,
                              })
                            }
                            placeholder="contacto@empresa.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_phone">Teléfono</Label>
                          <Input
                            id="contact_phone"
                            value={formData.contact_phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contact_phone: e.target.value,
                              })
                            }
                            placeholder="+52 333 123 4567"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          placeholder="Guadalajara, Jalisco"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Servicios de interés *
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecciona los servicios que te interesan para tu equipo
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {holisticServices.map((service) => {
                        const firstImage =
                          service.images && service.images.length > 0
                            ? service.images[0].image_url
                            : null;

                        return (
                          <div
                            key={service.id}
                            className={cn(
                              "border-2 rounded-lg transition-all overflow-hidden cursor-pointer",
                              selectedServices.includes(service.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => toggleService(service.id)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && toggleService(service.id)
                            }
                            role="button"
                            tabIndex={0}
                          >
                            {firstImage && (
                              <div className="relative w-full h-40">
                                <Image
                                  src={firstImage}
                                  alt={service.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                {selectedServices.includes(service.id) && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                                      <CheckCircle className="h-8 w-8 text-primary-foreground" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="p-4 flex items-start gap-3">
                              <div className="mt-1 shrink-0">
                                {selectedServices.includes(service.id) ? (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium">{service.name}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {service.description}
                                </p>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent
                                  className="max-w-3xl max-h-[80vh] overflow-y-auto"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl">
                                      {service.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-base">
                                      Información completa del servicio
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    {service.images &&
                                      service.images.length > 0 && (
                                        <div className="space-y-3">
                                          <h3 className="font-semibold text-lg">
                                            Galería
                                          </h3>
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {service.images.map((img) => (
                                              <div
                                                key={img.id}
                                                className="relative aspect-square rounded-lg overflow-hidden"
                                              >
                                                <Image
                                                  src={img.image_url}
                                                  alt={`${service.name} - Imagen ${img.image_order}`}
                                                  fill
                                                  className="object-cover"
                                                  unoptimized
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    <div className="space-y-2">
                                      <h3 className="font-semibold text-lg">
                                        Descripción
                                      </h3>
                                      <p className="text-muted-foreground leading-relaxed">
                                        {service.description}
                                      </p>
                                    </div>
                                    {service.benefits &&
                                      service.benefits.length > 0 && (
                                        <div className="space-y-2">
                                          <h3 className="font-semibold text-lg">
                                            Beneficios para tu equipo
                                          </h3>
                                          <ul className="space-y-2">
                                            {service.benefits.map(
                                              (benefit, index) => (
                                                <li
                                                  key={index}
                                                  className="flex items-start gap-2"
                                                >
                                                  <CheckCircle className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                                                  <span className="text-muted-foreground">
                                                    {benefit}
                                                  </span>
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Detalles del servicio
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="service_date">Fecha requerida</Label>
                          <Input
                            id="service_date"
                            type="date"
                            value={formData.service_date}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                service_date: e.target.value,
                              })
                            }
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="service_time">Hora requerida</Label>
                          <Input
                            id="service_time"
                            type="time"
                            value={formData.service_time}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                service_time: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service_address">
                          Dirección o ubicación del servicio
                        </Label>
                        <Textarea
                          id="service_address"
                          value={formData.service_address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              service_address: e.target.value,
                            })
                          }
                          placeholder="Dirección completa o datos para coordinar la ubicación"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Información adicional
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="additional_info">
                        Comentarios adicionales (opcional)
                      </Label>
                      <Textarea
                        id="additional_info"
                        value={formData.additional_info}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            additional_info: e.target.value,
                          })
                        }
                        placeholder="Cuéntanos más sobre las necesidades de tu equipo..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Enviando…" : "Solicitar cotización"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
