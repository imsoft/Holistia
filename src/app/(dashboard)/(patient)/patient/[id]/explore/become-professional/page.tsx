"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  User,
  MapPin,
  GraduationCap,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { normalizeName, normalizeProfession, normalizeAddress, normalizeLocation } from "@/lib/text-utils";

interface Service {
  name: string;
  description: string;
  price: string;
  duration: string;
}

export default function BecomeProfessionalPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [existingApplication, setExistingApplication] = useState<{
    id: string;
    status: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    profession: string;
    specializations: string[];
    experience: string;
    services: Service[];
    address: string;
    city: string;
    state: string;
    country: string;
    biography: string;
    wellness_areas: string[];
    gallery: string[];
    created_at: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    profession: "",
    specializations: [] as string[],
    experience: "",
    services: [{ name: "", description: "", price: "", duration: "" }] as Service[],
    address: "",
    city: "",
    state: "",
    country: "",
    biography: "",
    terms_accepted: false,
    privacy_accepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [specializationInput, setSpecializationInput] = useState("");
  const [userProfilePhoto, setUserProfilePhoto] = useState<string | null>(null);
  const params = useParams();
  const userId = params.id as string;

  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Error getting user:", userError);
          return;
        }

        setCurrentUser({ id: user.id, email: user.email || "" });
        
        // Obtener foto de perfil del usuario
        const profilePhoto = user.user_metadata?.avatar_url;
        setUserProfilePhoto(profilePhoto || null);
        
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
        }));

        // Verificar si ya existe una aplicación
        const { data: existingApp, error: appError } = await supabase
          .from("professional_applications")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (appError) {
          console.error("Error checking existing application:", appError);
        } else if (existingApp) {
          setExistingApplication(existingApp);
          setFormData({
            first_name: existingApp.first_name || "",
            last_name: existingApp.last_name || "",
            email: existingApp.email || "",
            phone: existingApp.phone || "",
            profession: existingApp.profession || "",
            specializations: existingApp.specializations || [],
            experience: existingApp.experience || "",
            services: existingApp.services || [
              { name: "", description: "", price: "", duration: "" },
            ],
            address: existingApp.address || "",
            city: existingApp.city || "",
            state: existingApp.state || "",
            country: existingApp.country || "",
            biography: existingApp.biography || "",
            terms_accepted: existingApp.terms_accepted || false,
            privacy_accepted: existingApp.privacy_accepted || false,
          });
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, [userId, supabase]);

  const handleInputChange = (field: string, value: string | boolean) => {
    let normalizedValue = value;
    
    // Aplicar normalización según el tipo de campo
    if (typeof value === 'string') {
      switch (field) {
        case 'first_name':
        case 'last_name':
          normalizedValue = normalizeName(value);
          break;
        case 'email':
          normalizedValue = value.toLowerCase();
          break;
        case 'profession':
          normalizedValue = normalizeProfession(value);
          break;
        case 'address':
          normalizedValue = normalizeAddress(value);
          break;
        case 'city':
        case 'state':
        case 'country':
          normalizedValue = normalizeLocation(value);
          break;
        case 'biography':
          normalizedValue = value; // Mantener como está para biografías
          break;
        default:
          normalizedValue = value;
      }
    }
    
    setFormData((prev) => ({ ...prev, [field]: normalizedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };


  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.first_name.trim())
          newErrors.first_name = "El nombre es requerido";
        if (!formData.last_name.trim())
          newErrors.last_name = "El apellido es requerido";
        if (!formData.email.trim()) newErrors.email = "El email es requerido";
        if (!formData.phone.trim())
          newErrors.phone = "El teléfono es requerido";
        break;
      case 2:
        if (!formData.profession.trim())
          newErrors.profession = "La profesión es requerida";
        if (formData.specializations.length === 0)
          newErrors.specializations =
            "Al menos una especialización es requerida";
        if (!formData.experience.trim())
          newErrors.experience = "Los años de experiencia son requeridos";
        break;
      case 3:
        if (!formData.address.trim())
          newErrors.address = "La dirección es requerida";
        if (!formData.city.trim()) newErrors.city = "La ciudad es requerida";
        if (!formData.state.trim()) newErrors.state = "El estado es requerido";
        if (!formData.country.trim())
          newErrors.country = "El país es requerido";
        break;
      case 4:
        if (!formData.biography.trim())
          newErrors.biography = "La biografía es requerida";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4) || !currentUser) return;

    setSubmitting(true);
    try {
      // Obtener la foto de perfil del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      const userProfilePhoto = user?.user_metadata?.avatar_url;

      const applicationData = {
        user_id: currentUser.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        profession: formData.profession,
        specializations: formData.specializations,
        experience: formData.experience,
        services: formData.services,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        biography: formData.biography,
        profile_photo: userProfilePhoto, // Copiar foto de perfil del usuario
        terms_accepted: formData.terms_accepted,
        privacy_accepted: formData.privacy_accepted,
        status: "pending",
      };

      if (existingApplication) {
        const { error } = await supabase
          .from("professional_applications")
          .update(applicationData)
          .eq("id", existingApplication.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("professional_applications")
          .insert([applicationData]);

        if (error) throw error;
      }

      alert("¡Solicitud enviada exitosamente!");
      window.location.reload();
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error al enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Foto de perfil actual */}
            {userProfilePhoto && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="relative">
                  <Image
                    src={userProfilePhoto}
                    alt="Foto de perfil actual"
                    width={60}
                    height={60}
                    className="w-15 h-15 rounded-full object-cover border-2 border-blue-300"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Foto de perfil actual
                  </h4>
                  <p className="text-xs text-blue-700">
                    Esta será tu foto de perfil como profesional
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Tu nombre"
                className={errors.first_name ? "border-red-500" : ""}
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Tu apellido"
                className={errors.last_name ? "border-red-500" : ""}
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="tu@email.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="profession">Profesión *</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) =>
                  handleInputChange("profession", e.target.value)
                }
                placeholder="Ej: Psicólogo, Terapeuta, Coach..."
                className={errors.profession ? "border-red-500" : ""}
              />
              {errors.profession && (
                <p className="text-red-500 text-sm mt-1">{errors.profession}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Especializaciones *</Label>
              <Input
                placeholder="Ej: Psicología Clínica, Terapia Cognitivo-Conductual, Ansiedad..."
                value={specializationInput}
                onChange={(e) => setSpecializationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    if (specializationInput.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        specializations: [...prev.specializations, specializationInput.trim()]
                      }));
                      setSpecializationInput('');
                    }
                  }
                }}
                className={errors.specializations ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Presiona Enter o escribe una coma para agregar. Ejemplos: Psicología Clínica, Terapia de Pareja, Depresión
              </p>
              {formData.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specializations.map((spec, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          specializations: prev.specializations.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      {spec} ×
                    </Badge>
                  ))}
                </div>
              )}
              {errors.specializations && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.specializations}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="experience">Años de experiencia *</Label>
              <Input
                id="experience"
                type="number"
                value={formData.experience}
                onChange={(e) =>
                  handleInputChange("experience", e.target.value)
                }
                placeholder="Ej: 5"
                className={errors.experience ? "border-red-500" : ""}
              />
              {errors.experience && (
                <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Certificaciones y Educación
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Para verificar tu formación profesional, por favor envía tus certificaciones y títulos a:
                    </p>
                    <div className="bg-white border border-blue-200 rounded px-3 py-2 inline-block">
                      <span className="text-sm font-mono text-blue-800">hola@holistia.io</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Incluye en el asunto: &quot;Certificaciones - [Tu nombre]&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Calle, número, colonia"
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Ciudad"
                className={errors.city ? "border-red-500" : ""}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="Estado"
                className={errors.state ? "border-red-500" : ""}
              />
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="País"
                className={errors.country ? "border-red-500" : ""}
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="biography">Biografía *</Label>
              <Textarea
                id="biography"
                value={formData.biography}
                onChange={(e) => handleInputChange("biography", e.target.value)}
                placeholder="Cuéntanos sobre ti, tu experiencia y cómo puedes ayudar a tus pacientes..."
                className={`min-h-[200px] ${
                  errors.biography ? "border-red-500" : ""
                }`}
              />
              {errors.biography && (
                <p className="text-red-500 text-sm mt-1">{errors.biography}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms_accepted"
                  checked={formData.terms_accepted}
                  onChange={(e) =>
                    handleInputChange("terms_accepted", e.target.checked)
                  }
                  className="mt-1"
                />
                <label
                  htmlFor="terms_accepted"
                  className="text-sm text-muted-foreground"
                >
                  Acepto los términos y condiciones de Holistia
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="privacy_accepted"
                  checked={formData.privacy_accepted}
                  onChange={(e) =>
                    handleInputChange("privacy_accepted", e.target.checked)
                  }
                  className="mt-1"
                />
                <label
                  htmlFor="privacy_accepted"
                  className="text-sm text-muted-foreground"
                >
                  Acepto la política de privacidad
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar estado de aplicación existente
  if (existingApplication) {
    const getStatusInfo = (status: string) => {
      switch (status) {
        case "approved":
          return {
            icon: CheckCircle,
            label: "Aprobada",
            description: "¡Felicitaciones! Tu solicitud ha sido aprobada",
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200"
          };
        case "pending":
          return {
            icon: Clock,
            label: "Pendiente",
            description: "Tu solicitud está siendo revisada",
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200"
          };
        case "under_review":
          return {
            icon: AlertCircle,
            label: "En Revisión",
            description: "Nuestro equipo está evaluando tu solicitud",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200"
          };
        case "rejected":
          return {
            icon: XCircle,
            label: "Rechazada",
            description: "Tu solicitud no pudo ser aprobada en esta ocasión",
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200"
          };
        default:
          return {
            icon: Clock,
            label: "Desconocido",
            description: "Estado no reconocido",
            color: "text-gray-600",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200"
          };
      }
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const statusInfo = getStatusInfo(existingApplication.status);

    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Solicitud de Profesional</h1>
            <p className="text-muted-foreground">
              Estado de tu solicitud para convertirte en profesional de salud mental.
            </p>
          </div>

          <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
            <div>
              <h2 className="text-base/7 font-semibold text-foreground">Estado de la Solicitud</h2>
              <p className="mt-1 text-sm/6 text-muted-foreground">
                Información sobre el progreso de tu solicitud para ser profesional.
              </p>

              <div className="mt-6">
                <Card className={`border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                  <CardHeader className="pb-6 px-8 pt-8">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                        {(() => {
                          const IconComponent = statusInfo.icon;
                          return <IconComponent className={`h-6 w-6 ${statusInfo.color}`} />;
                        })()}
                      </div>
                      <div>
                        <CardTitle className={`text-xl ${statusInfo.color} mb-2`}>
                          {statusInfo.label}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {statusInfo.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-8 pb-8">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Profesión solicitada</p>
                          <p className="text-base text-muted-foreground">{existingApplication.profession}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Fecha de envío</p>
                          <p className="text-base text-muted-foreground">{formatDate(existingApplication.created_at)}</p>
                        </div>
                      </div>
                      
                      {existingApplication.specializations.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-foreground">Especializaciones</p>
                          <div className="flex flex-wrap gap-3">
                            {existingApplication.specializations.map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}


                      {existingApplication.wellness_areas && existingApplication.wellness_areas.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-foreground">Áreas de bienestar</p>
                          <div className="flex flex-wrap gap-3">
                            {existingApplication.wellness_areas.map((area, index) => (
                              <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {existingApplication.status === "approved" && (
                        <div className="pt-4 border-t border-border">
                          <Button asChild className="w-full">
                            <Link href={`/professional/${userId}/dashboard`}>
                              Ir al Dashboard Profesional
                            </Link>
                          </Button>
                        </div>
                      )}

                      {existingApplication.status !== "approved" && (
                        <div className="pt-4 border-t border-border">
                          <div className="flex gap-4">
                            <Button asChild variant="outline" className="flex-1">
                              <Link href={`/patient/${userId}/explore/profile`}>
                                Ver Mi Perfil
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => window.location.reload()}
                              className="flex-1"
                            >
                              Actualizar Estado
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Únete como Profesional
            </h1>
            <p className="text-muted-foreground">
              Completa tu perfil para comenzar a ayudar a pacientes en Holistia
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Paso {currentStep} de 4
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((currentStep / 4) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Card */}
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 1 && <User className="h-5 w-5" />}
                {currentStep === 2 && <GraduationCap className="h-5 w-5" />}
                {currentStep === 3 && <MapPin className="h-5 w-5" />}
                {currentStep === 4 && <FileText className="h-5 w-5" />}
                {currentStep === 1 && "Información Personal"}
                {currentStep === 2 && "Información Profesional"}
                {currentStep === 3 && "Ubicación"}
                {currentStep === 4 && "Biografía y Términos"}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderStep()}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext}>Siguiente</Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !formData.terms_accepted ||
                  !formData.privacy_accepted
                }
              >
                {submitting ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
