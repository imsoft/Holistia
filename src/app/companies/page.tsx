"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";

interface HolisticService {
  id: string;
  name: string;
  description: string;
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
        .select(`
          *,
          holistic_service_images (
            id,
            image_url,
            image_order
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      
      // Mapear los datos para incluir imágenes ordenadas
      const servicesWithImages = (data || []).map(service => ({
        ...service,
        images: (service.holistic_service_images || []).sort((a: any, b: any) => a.image_order - b.image_order)
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

    if (!formData.company_name || !formData.contact_email || selectedServices.length === 0) {
      toast.error("Por favor completa todos los campos obligatorios y selecciona al menos un servicio");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("company_leads").insert({
        company_name: formData.company_name,
        industry: formData.industry || null,
        company_size: formData.company_size || null,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone || null,
        city: formData.city || null,
        additional_info: formData.additional_info || null,
        requested_services: selectedServices,
        status: "pending",
      });

      if (error) throw error;

      toast.success("¡Solicitud enviada exitosamente! Nos pondremos en contacto contigo pronto.");

      // Reset form
      setFormData({
        company_name: "",
        industry: "",
        company_size: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        city: "",
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
    <div className="min-h-screen bg-background">
      {/* Header/Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Bienestar Holístico para tu Empresa
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Impulsa la productividad y felicidad de tu equipo con nuestros servicios holísticos personalizados.
              Profesionales certificados al servicio del bienestar corporativo.
            </p>
            <Button size="lg" asChild className="gap-2">
              <a href="#contacto">
                Solicitar Información
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              ¿Por qué elegir Holistia para tu empresa?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Invierte en el bienestar de tu equipo y transforma tu organización
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary transition-all py-4">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Mayor Productividad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Equipos más felices y saludables son hasta 31% más productivos
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all py-4">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Menor Rotación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Reduce la rotación de personal hasta en un 50% con programas de bienestar
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all py-4">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Mejor Clima Laboral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Crea un ambiente de trabajo positivo y colaborativo
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all py-4">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Profesionales Certificados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acceso a terapeutas y coaches holísticos verificados
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Nuestros Servicios Holísticos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Selecciona los servicios que mejor se adapten a las necesidades de tu equipo
            </p>
          </div>

          {holisticServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {holisticServices.map((service) => {
                const firstImage = service.images && service.images.length > 0 
                  ? service.images[0].image_url 
                  : null;

                return (
                  <Card key={service.id} className="hover:shadow-lg transition-all overflow-hidden">
                    {firstImage && (
                      <div className="relative w-full h-48">
                        <Image
                          src={firstImage}
                          alt={service.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        {service.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{service.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando servicios...</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contacto" className="py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Solicita una Cotización Personalizada
              </h2>
              <p className="text-lg text-muted-foreground">
                Completa el formulario y nuestro equipo te contactará para crear un plan a la medida de tu empresa
              </p>
            </div>

            <Card className="py-4">
              <CardHeader>
                <CardTitle>Información de tu Empresa</CardTitle>
                <CardDescription>
                  Cuéntanos sobre tu organización y las necesidades de tu equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Info */}
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Mi Empresa S.A."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industria</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => setFormData({ ...formData, industry: value })}
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
                      <Label htmlFor="company_size">Tamaño de la Empresa</Label>
                      <Select
                        value={formData.company_size}
                        onValueChange={(value) => setFormData({ ...formData, company_size: value })}
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

                  {/* Contact Info */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact_name">Nombre del Contacto *</Label>
                        <Input
                          id="contact_name"
                          value={formData.contact_name}
                          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                          placeholder="Juan Pérez"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact_email">Email *</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            placeholder="contacto@empresa.com"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contact_phone">Teléfono</Label>
                          <Input
                            id="contact_phone"
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                            placeholder="+52 333 123 4567"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Guadalajara, Jalisco"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Services Selection */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Servicios de Interés *</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecciona los servicios que te interesan para tu equipo
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {holisticServices.map((service) => (
                        <div
                          key={service.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedServices.includes(service.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => toggleService(service.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {selectedServices.includes(service.id) ? (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-2">
                    <Label htmlFor="additional_info">Información Adicional</Label>
                    <Textarea
                      id="additional_info"
                      value={formData.additional_info}
                      onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                      placeholder="Cuéntanos más sobre las necesidades específicas de tu equipo..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Solicitar Cotización"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
