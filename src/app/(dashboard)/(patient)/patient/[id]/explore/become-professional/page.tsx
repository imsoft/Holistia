"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  MapPin,
  GraduationCap,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Check,
  ChevronsUpDown,
  Instagram,
  Info,
  CreditCard,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";
import Image from "next/image";
import { normalizeName, normalizeProfession, normalizeAddress, normalizeLocation, normalizeLanguage } from "@/lib/text-utils";
import { cn } from "@/lib/utils";
import { getRegistrationFeeStatus, formatExpirationDate } from "@/utils/registration-utils";
import { countries } from "@/lib/countries";

interface Service {
  name: string;
  description: string;
  price: string;
  duration: string;
}

export default function BecomeProfessionalPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isEditingRejected, setIsEditingRejected] = useState(false);
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
    registration_fee_paid: boolean;
    registration_fee_amount: number;
    registration_fee_currency: string;
    registration_fee_expires_at: string | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    profession: "",
    specializations: [] as string[],
    languages: ["Español"] as string[], // Idioma por defecto
    experience: "",
    services: [{ name: "", description: "", price: "", duration: "" }] as Service[],
    address: "",
    city: "",
    state: "",
    country: "",
    biography: "",
    wellness_areas: [] as string[],
    instagram: "",
    terms_accepted: false,
    privacy_accepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [specializationInput, setSpecializationInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [lastEnterTime, setLastEnterTime] = useState<number | null>(null);
  const [lastLanguageEnterTime, setLastLanguageEnterTime] = useState<number | null>(null);
  const [userProfilePhoto, setUserProfilePhoto] = useState<string | null>(null);
  const [openCountryCombo, setOpenCountryCombo] = useState(false);
  const params = useParams();
  const userId = params.id as string;

  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
      try {
        if (!profile) {
          console.log("⏳ Esperando a que el profile se cargue...");
          return;
        }

        console.log("🔵 Cargando datos para usuario:", profile.id);

        // Obtener foto de perfil del usuario
        setUserProfilePhoto(profile.avatar_url || null);

        // Pre-llenar el formulario con los datos del usuario
        setFormData((prev) => ({
          ...prev,
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
        }));

        // Verificar si ya existe una aplicación
        console.log("🔍 Buscando aplicación existente para:", profile.id);
        const { data: existingApp, error: appError } = await supabase
          .from("professional_applications")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (appError) {
          console.error("❌ Error checking existing application:", appError);
        } else if (existingApp) {
          console.log("✅ Aplicación existente encontrada:", existingApp.id);
          setExistingApplication(existingApp);
          setFormData({
            first_name: existingApp.first_name || "",
            last_name: existingApp.last_name || "",
            email: existingApp.email || "",
            phone: existingApp.phone || "",
            profession: existingApp.profession || "",
            specializations: existingApp.specializations || [],
            languages: existingApp.languages || ["Español"],
            experience: existingApp.experience || "",
            services: existingApp.services || [
              { name: "", description: "", price: "", duration: "" },
            ],
            address: existingApp.address || "",
            city: existingApp.city || "",
            state: existingApp.state || "",
            country: existingApp.country || "",
            biography: existingApp.biography || "",
            wellness_areas: existingApp.wellness_areas || [],
            instagram: existingApp.instagram || "",
            terms_accepted: existingApp.terms_accepted || false,
            privacy_accepted: existingApp.privacy_accepted || false,
          });
        } else {
          console.log("ℹ️ No se encontró aplicación existente");
        }
      } catch (err) {
        console.error("❌ Error en getUserData:", err);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, [profile, supabase]);

  const handleInputChange = (field: string, value: string | boolean) => {
    // Para campos de texto, guardar el valor sin normalizar
    // La normalización se aplicará en onBlur
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleInputBlur = (field: string, value: string) => {
    let normalizedValue = value;
    
    // Aplicar normalización según el tipo de campo al salir del input
    switch (field) {
      case 'first_name':
      case 'last_name':
        normalizedValue = normalizeName(value);
        break;
      case 'email':
        normalizedValue = value.toLowerCase().trim();
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
        normalizedValue = value.trim(); // Solo eliminar espacios al inicio/final
        break;
      default:
        normalizedValue = value.trim();
    }
    
    setFormData((prev) => ({ ...prev, [field]: normalizedValue }));
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
        if (!formData.instagram.trim())
          newErrors.instagram = "El Instagram es requerido";
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
    if (!validateStep(4) || !profile) return;

    setSubmitting(true);
    try {
      // Verificar nuevamente si existe una aplicación antes de enviar
      const { data: checkExisting } = await supabase
        .from("professional_applications")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      // Obtener la foto de perfil del usuario actual
      const userProfilePhoto = profile.avatar_url;

      const applicationData = {
        user_id: profile.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        profession: formData.profession,
        specializations: formData.specializations,
        languages: formData.languages,
        experience: formData.experience,
        services: formData.services,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        biography: formData.biography,
        wellness_areas: formData.wellness_areas,
        instagram: formData.instagram,
        profile_photo: userProfilePhoto, // Copiar foto de perfil del usuario
        terms_accepted: formData.terms_accepted,
        privacy_accepted: formData.privacy_accepted,
        status: "pending",
      };

      // Usar checkExisting en lugar de existingApplication para estar seguros
      if (checkExisting || existingApplication) {
        const appId = checkExisting?.id || existingApplication?.id;
        console.log('🔵 Actualizando aplicación existente:', appId);

        const { error } = await supabase
          .from("professional_applications")
          .update(applicationData)
          .eq("id", appId);

        if (error) {
          console.error('❌ Error al actualizar:', error);
          throw error;
        }
        toast.success("¡Solicitud actualizada exitosamente!");
      } else {
        console.log('🔵 Creando nueva aplicación');

        const { error } = await supabase
          .from("professional_applications")
          .insert([applicationData]);

        if (error) {
          console.error('❌ Error al insertar:', error);
          // Si falla por duplicado, intentar actualizar
          if (error.code === '23505') {
            console.log('⚠️ Detectado duplicado, intentando actualizar...');
            const { data: existingByEmail } = await supabase
              .from("professional_applications")
              .select("*")
              .eq("email", formData.email)
              .maybeSingle();

            if (existingByEmail) {
              const { error: updateError } = await supabase
                .from("professional_applications")
                .update(applicationData)
                .eq("id", existingByEmail.id);

              if (updateError) throw updateError;
              setExistingApplication(existingByEmail);
              toast.success("¡Solicitud actualizada exitosamente!");
              return;
            }
          }
          throw error;
        }
        toast.success("¡Solicitud enviada exitosamente!");
      }

      // Recargar los datos en lugar de recargar toda la página
      const { data: updatedApp } = await supabase
        .from("professional_applications")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (updatedApp) {
        setExistingApplication(updatedApp);
      }
    } catch (error) {
      console.error("❌ Error submitting application:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al enviar la solicitud: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegistrationPayment = async () => {
    if (!existingApplication) {
      toast.error('No se encontró la aplicación profesional');
      return;
    }

    setProcessingPayment(true);
    try {
      console.log('🔵 Iniciando pago de inscripción para:', existingApplication.id);

      const response = await fetch('/api/stripe/registration-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professional_application_id: existingApplication.id,
        }),
      });

      console.log('🔵 Respuesta del servidor:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al crear la sesión de pago');
      }

      const data = await response.json();
      console.log('✅ Sesión creada:', data);

      if (!data.url) {
        throw new Error('No se recibió la URL de pago');
      }

      // Redirigir a Stripe Checkout
      console.log('🔵 Redirigiendo a:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al procesar el pago: ${errorMessage}`);
      setProcessingPayment(false);
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
                    className="w-15 h-15 aspect-square rounded-full object-cover border-2 border-blue-300"
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
                onBlur={(e) =>
                  handleInputBlur("first_name", e.target.value)
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
                onBlur={(e) => handleInputBlur("last_name", e.target.value)}
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
                onBlur={(e) => handleInputBlur("email", e.target.value)}
                placeholder="tu@email.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone">Teléfono *</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                placeholder="55 1234 5678"
                error={!!errors.phone}
                defaultCountryCode="+52"
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
                onBlur={(e) =>
                  handleInputBlur("profession", e.target.value)
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
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Psicología Clínica, Terapia Cognitivo-Conductual, Ansiedad..."
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      if (specializationInput.trim()) {
                        // En móviles y tabletas, requerir doble Enter
                        if (window.innerWidth <= 1024 && e.key === 'Enter') {
                          // Verificar si es el segundo Enter consecutivo
                          const now = Date.now();
                          if (!lastEnterTime || now - lastEnterTime > 1000) {
                            setLastEnterTime(now);
                            return; // Primer Enter, no hacer nada
                          }
                          // Segundo Enter dentro de 1 segundo, proceder
                          setLastEnterTime(null);
                        }

                        setFormData((prev) => ({
                          ...prev,
                          specializations: [...prev.specializations, specializationInput.trim()]
                        }));
                        setSpecializationInput('');
                        // Limpiar error de especialización al agregar una
                        if (errors.specializations) {
                          setErrors((prev) => ({ ...prev, specializations: "" }));
                        }
                      }
                    }
                  }}
                  className={errors.specializations ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    if (specializationInput.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        specializations: [...prev.specializations, specializationInput.trim()]
                      }));
                      setSpecializationInput('');
                      // Limpiar error de especialización al agregar una
                      if (errors.specializations) {
                        setErrors((prev) => ({ ...prev, specializations: "" }));
                      }
                    }
                  }}
                  disabled={!specializationInput.trim()}
                  className="shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {window.innerWidth <= 1024
                  ? "Presiona Enter dos veces, escribe una coma o haz clic en el botón + para agregar. Ejemplos: Psicología Clínica, Terapia de Pareja, Depresión"
                  : "Presiona Enter, escribe una coma o haz clic en el botón + para agregar. Ejemplos: Psicología Clínica, Terapia de Pareja, Depresión"
                }
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
              <Label>Idiomas que hablas *</Label>
              <Input
                placeholder="Ej: Inglés, Francés, Portugués..."
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    if (languageInput.trim()) {
                      // En móviles y tabletas, requerir doble Enter
                      if (window.innerWidth <= 1024 && e.key === 'Enter') {
                        // Verificar si es el segundo Enter consecutivo
                        const now = Date.now();
                        if (!lastLanguageEnterTime || now - lastLanguageEnterTime > 1000) {
                          setLastLanguageEnterTime(now);
                          return; // Primer Enter, no hacer nada
                        }
                        // Segundo Enter dentro de 1 segundo, proceder
                        setLastLanguageEnterTime(null);
                      }

                      // Normalizar el idioma antes de agregarlo
                      const normalizedLanguage = normalizeLanguage(languageInput.trim());

                      // Evitar duplicados
                      if (!formData.languages.includes(normalizedLanguage)) {
                        setFormData((prev) => ({
                          ...prev,
                          languages: [...prev.languages, normalizedLanguage]
                        }));
                        // Limpiar error de idiomas al agregar uno
                        if (errors.languages) {
                          setErrors((prev) => ({ ...prev, languages: "" }));
                        }
                      }
                      setLanguageInput('');
                    }
                  }
                }}
                className={errors.languages ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {window.innerWidth <= 1024
                  ? "Presiona Enter dos veces o escribe una coma para agregar. El español ya está incluido por defecto."
                  : "Presiona Enter o escribe una coma para agregar. El español ya está incluido por defecto."
                }
              </p>
              {formData.languages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.languages.map((lang, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`cursor-pointer hover:bg-red-100 ${lang === "Español" ? "border-2 border-primary" : ""}`}
                      onClick={() => {
                        // No permitir eliminar el español si es el único idioma
                        if (lang === "Español" && formData.languages.length === 1) {
                          return;
                        }
                        setFormData((prev) => ({
                          ...prev,
                          languages: prev.languages.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      {lang} {lang === "Español" && formData.languages.length === 1 ? "" : "×"}
                    </Badge>
                  ))}
                </div>
              )}
              {errors.languages && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.languages}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Áreas de Bienestar
                    </h4>
                    <p className="text-sm text-blue-700">
                      Las áreas de bienestar (Salud mental, Espiritualidad, Actividad física, Social, Alimentación) serán asignadas por el equipo de administración después de revisar tu solicitud. Esto asegura la correcta categorización de los profesionales en la plataforma.
                    </p>
                  </div>
                </div>
              </div>
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
                  <div className="shrink-0">
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
                    <a 
                      href={`mailto:hola@holistia.io?subject=Certificaciones - ${formData.first_name} ${formData.last_name}&body=Hola equipo de Holistia,%0D%0A%0D%0AAdjunto mis certificaciones y títulos profesionales para verificación.%0D%0A%0D%0ANombre: ${formData.first_name} ${formData.last_name}%0D%0AProfesión: ${formData.profession || '[Por especificar]'}%0D%0AEmail: ${formData.email}%0D%0A%0D%0ASaludos cordiales`}
                      className="bg-white border border-blue-200 rounded px-3 py-2 inline-block hover:bg-blue-50 transition-colors duration-200"
                    >
                      <span className="text-sm font-mono text-blue-800 hover:text-blue-900">hola@holistia.io</span>
                    </a>
                    <p className="text-xs text-blue-600 mt-2">
                      Haz clic en el email para abrir tu cliente de correo con el asunto y mensaje pre-llenados
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
            {/* Alerta informativa sobre la dirección */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                    📍 ¿Cómo ingresar tu dirección correctamente?
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Para que el mapa muestre tu ubicación de forma precisa, ingresa tu dirección completa con el mayor detalle posible.
                  </p>
                  <div className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
                    <p><strong>✅ Ejemplo correcto:</strong></p>
                    <p className="pl-4 font-mono bg-white dark:bg-blue-900/30 p-2 rounded">
                      Av. Paseo de la Reforma 222, Col. Juárez
                    </p>
                    <p className="pl-4 font-mono bg-white dark:bg-blue-900/30 p-2 rounded">
                      Calle Morelos 45, Centro Histórico
                    </p>
                    <p className="mt-2"><strong>❌ Evita:</strong></p>
                    <p className="pl-4">• Direcciones incompletas: &quot;Av. Reforma&quot;</p>
                    <p className="pl-4">• Sin número: &quot;Calle Principal&quot;</p>
                    <p className="pl-4">• Muy genéricas: &quot;Centro&quot;</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="address">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Dirección completa *</span>
                </div>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                onBlur={(e) => handleInputBlur("address", e.target.value)}
                placeholder="Ej: Av. Insurgentes Sur 1234, Col. Del Valle"
                className={errors.address ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Incluye: Calle/Avenida, número exterior, número interior (si aplica) y colonia</span>
              </p>
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
                onBlur={(e) => handleInputBlur("city", e.target.value)}
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
                onBlur={(e) => handleInputBlur("state", e.target.value)}
                placeholder="Estado"
                className={errors.state ? "border-red-500" : ""}
              />
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="country">País *</Label>
              <Popover open={openCountryCombo} onOpenChange={setOpenCountryCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCountryCombo}
                    className={cn(
                      "w-full justify-between",
                      errors.country && "border-red-500"
                    )}
                  >
                    {formData.country
                      ? countries.find((country) => country.value === formData.country)?.label
                      : "Selecciona un país"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar país..." />
                    <CommandList>
                      <CommandEmpty>No se encontró el país.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country.value}
                            value={country.value}
                            onSelect={(currentValue) => {
                              handleInputChange("country", currentValue === formData.country ? "" : currentValue);
                              setOpenCountryCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.country === country.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {country.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <div className="relative">
                <Textarea
                  id="biography"
                  value={formData.biography}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 500);
                    handleInputChange("biography", value);
                  }}
                  onBlur={(e) => handleInputBlur("biography", e.target.value)}
                  placeholder="Cuéntanos sobre ti, tu experiencia y cómo puedes ayudar a tus pacientes..."
                  maxLength={500}
                  className={`min-h-[200px] ${
                    errors.biography ? "border-red-500" : ""
                  }`}
                />
                <div className={`mt-1 text-xs font-medium text-right ${
                  formData.biography.length > 500
                    ? "text-destructive"
                    : formData.biography.length > 450
                    ? "text-orange-500"
                    : "text-muted-foreground"
                }`}>
                  {formData.biography.length} / 500 caracteres
                </div>
              </div>
              {errors.biography && (
                <p className="text-red-500 text-sm mt-1">{errors.biography}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="instagram">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  <span>Instagram *</span>
                </div>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => {
                    // Eliminar @ o https:// si el usuario lo ingresa
                    const value = e.target.value.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '');
                    handleInputChange("instagram", value);
                  }}
                  placeholder="tu usuario de Instagram"
                  className={`pl-8 ${errors.instagram ? "border-red-500" : ""}`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Solo tu nombre de usuario, sin @ ni enlaces
              </p>
              {errors.instagram && (
                <p className="text-red-500 text-sm mt-1">{errors.instagram}</p>
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
                  Acepto los{" "}
                  <Link 
                    href="/terms" 
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    términos y condiciones
                  </Link>
                  {" "}de Holistia
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
                  Acepto la{" "}
                  <Link 
                    href="/privacy" 
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    política de privacidad
                  </Link>
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

  // Mostrar estado de aplicación existente (excepto si está editando una rechazada)
  if (existingApplication && !isEditingRejected) {
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
      // Crear la fecha desde el timestamp de Supabase
      const date = new Date(dateString);

      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        console.error('❌ [Fecha inválida]:', dateString);
        return 'Fecha no disponible';
      }

      return date.toLocaleDateString('es-ES', {
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Solicitud de Profesional</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Estado de tu solicitud para convertirte en experto en salud mental.
            </p>
          </div>

          <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground">Estado de la Solicitud</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Información sobre el progreso de tu solicitud para ser profesional.
              </p>

              <div className="mt-4 sm:mt-6">
                <Card className={`border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                  <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-8 pt-4 sm:pt-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`p-3 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                        {(() => {
                          const IconComponent = statusInfo.icon;
                          return <IconComponent className={`h-6 w-6 ${statusInfo.color}`} />;
                        })()}
                      </div>
                      <div>
                        <CardTitle className={`text-lg sm:text-xl ${statusInfo.color} mb-2`}>
                          {statusInfo.label}
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          {statusInfo.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 sm:px-8 pb-4 sm:pb-8">
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                        <div className="space-y-2 sm:space-y-3">
                          <p className="text-sm font-semibold text-foreground">Especializaciones</p>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {existingApplication.specializations.map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}


                      {existingApplication.wellness_areas && existingApplication.wellness_areas.length > 0 && (
                        <div className="space-y-2 sm:space-y-3">
                          <p className="text-sm font-semibold text-foreground">Áreas de bienestar</p>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {existingApplication.wellness_areas.map((area, index) => (
                              <Badge key={index} variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                                {area}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Las áreas de bienestar son gestionadas por el equipo de administración
                          </p>
                        </div>
                      )}

                      {/* Información de pago de inscripción */}
                      <div className="pt-4 border-t border-border space-y-4">
                        {(() => {
                          const feeStatus = getRegistrationFeeStatus(
                            existingApplication.registration_fee_paid,
                            existingApplication.registration_fee_expires_at
                          );

                          return (
                            <>
                              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <DollarSign className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">Cuota de Inscripción Anual</p>
                                    <p className="text-xs text-muted-foreground">
                                      Renovación requerida cada año
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-foreground">
                                    ${existingApplication.registration_fee_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {existingApplication.registration_fee_currency?.toUpperCase()}
                                  </p>
                                  <Badge 
                                    variant={feeStatus.isActive ? "default" : "destructive"}
                                    className={
                                      feeStatus.color === 'green' ? 'bg-green-600' :
                                      feeStatus.color === 'yellow' ? 'bg-yellow-600' :
                                      feeStatus.color === 'red' ? 'bg-red-600' : ''
                                    }
                                  >
                                    {feeStatus.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                    {feeStatus.message}
                                  </Badge>
                                </div>
                              </div>

                              {existingApplication.registration_fee_paid && existingApplication.registration_fee_expires_at && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <span className="text-blue-900">
                                      <strong>Fecha de expiración:</strong> {formatExpirationDate(existingApplication.registration_fee_expires_at)}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {feeStatus.isNearExpiration && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                                        ⚠️ Renovación Próxima
                                      </p>
                                      <p className="text-xs text-yellow-800 mb-3">
                                        Tu inscripción expira en {feeStatus.daysRemaining} día{feeStatus.daysRemaining !== 1 ? 's' : ''}. 
                                        Renueva tu pago para seguir apareciendo en la plataforma.
                                      </p>
                                      <Button
                                        onClick={handleRegistrationPayment}
                                        disabled={processingPayment}
                                        className="w-full"
                                        size="sm"
                                      >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {processingPayment ? 'Procesando...' : 'Renovar Inscripción'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {feeStatus.isExpired && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-red-900 mb-1">
                                        ❌ Inscripción Expirada
                                      </p>
                                      <p className="text-xs text-red-800 mb-3">
                                        Tu inscripción ha expirado. Debes renovar tu pago de ${existingApplication.registration_fee_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN 
                                        para volver a aparecer en la plataforma.
                                      </p>
                                      <Button
                                        onClick={handleRegistrationPayment}
                                        disabled={processingPayment}
                                        className="w-full bg-red-600 hover:bg-red-700"
                                        size="sm"
                                      >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {processingPayment ? 'Procesando...' : 'Renovar Inscripción Ahora'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {!existingApplication.registration_fee_paid && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                                        Pago de Inscripción Requerido
                                      </p>
                                      <p className="text-xs text-yellow-800 mb-3">
                                        Para que tu perfil sea visible en Holistia después de ser aprobado, 
                                        debes pagar la cuota de inscripción anual de ${existingApplication.registration_fee_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN. 
                                        Puedes realizar el pago ahora o más tarde, pero sin él no podrás aparecer en la plataforma.
                                      </p>
                                      <Button
                                        onClick={handleRegistrationPayment}
                                        disabled={processingPayment}
                                        className="w-full"
                                        size="sm"
                                      >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {processingPayment ? 'Procesando...' : 'Pagar Inscripción'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {(() => {
                        const feeStatus = getRegistrationFeeStatus(
                          existingApplication.registration_fee_paid,
                          existingApplication.registration_fee_expires_at
                        );

                        if (existingApplication.status === "approved" && feeStatus.isActive) {
                          return (
                            <div className="pt-4 border-t border-border space-y-2">
                              <Button asChild className="w-full">
                                <Link href={`/professional/${userId}/dashboard`}>
                                  Ir al Dashboard Profesional
                                </Link>
                              </Button>
                              <Button
                                onClick={async () => {
                                  if (!confirm('¿Estás seguro de que quieres dar de baja tu perfil profesional? Esto eliminará tu solicitud y dejarás de aparecer en la plataforma. Podrás volver a aplicar cuando quieras.')) {
                                    return;
                                  }

                                  try {
                                    const { error } = await supabase
                                      .from('professional_applications')
                                      .delete()
                                      .eq('id', existingApplication.id);

                                    if (error) {
                                      // Si el error es por el constraint de pagos, dar un mensaje más claro
                                      if (error.code === '23514') {
                                        toast.error('No se puede eliminar la solicitud. Contacta a soporte para ayuda.');
                                        return;
                                      }
                                      throw error;
                                    }

                                    toast.success('Perfil profesional dado de baja exitosamente.');
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Error deleting application:', error);
                                    toast.error('Error al dar de baja el perfil.');
                                  }
                                }}
                                variant="ghost"
                                className="w-full text-muted-foreground hover:text-destructive"
                                size="sm"
                              >
                                Dar de Baja mi Perfil Profesional
                              </Button>
                            </div>
                          );
                        }

                        if (existingApplication.status === "approved" && !feeStatus.isActive) {
                          return (
                            <div className="pt-4 border-t border-border">
                              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                                <p className="text-sm text-orange-800">
                                  <strong>¡Tu solicitud ha sido aprobada!</strong> Para acceder a tu dashboard profesional 
                                  y comenzar a aparecer en Holistia, debes {existingApplication.registration_fee_paid ? 'renovar' : 'completar'} el pago de inscripción.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })()}

                      {existingApplication.status === "rejected" && (
                        <div className="pt-3 sm:pt-4 border-t border-border">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                            <p className="text-sm text-blue-900 mb-2">
                              <strong>¿Quieres volver a intentarlo?</strong>
                            </p>
                            <p className="text-xs text-blue-800">
                              Puedes editar tu solicitud y enviarla nuevamente para una nueva revisión, o crear una solicitud completamente nueva.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <Button 
                              onClick={() => {
                                // Activar modo edición para solicitud rechazada
                                setIsEditingRejected(true);
                                setCurrentStep(1);
                              }}
                              className="flex-1"
                            >
                              Editar y Reenviar Solicitud
                            </Button>
                            <Button
                              onClick={async () => {
                                if (!confirm('¿Estás seguro de que quieres eliminar tu solicitud actual? Esta acción no se puede deshacer. Podrás crear una nueva solicitud desde cero.')) {
                                  return;
                                }

                                try {
                                  const { error } = await supabase
                                    .from('professional_applications')
                                    .delete()
                                    .eq('id', existingApplication.id);

                                  if (error) throw error;

                                  toast.success('Solicitud eliminada. Ahora puedes crear una nueva.');
                                  window.location.reload();
                                } catch (error) {
                                  console.error('Error deleting application:', error);
                                  toast.error('Error al eliminar la solicitud.');
                                }
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              Crear Nueva Solicitud
                            </Button>
                          </div>
                        </div>
                      )}

                      {(existingApplication.status === "pending" || existingApplication.status === "under_review") && (
                        <div className="pt-3 sm:pt-4 border-t border-border">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
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
                          <Button
                            onClick={async () => {
                              if (!confirm('¿Estás seguro de que quieres cancelar tu solicitud? Podrás crear una nueva solicitud cuando quieras.')) {
                                return;
                              }

                              try {
                                const { error } = await supabase
                                  .from('professional_applications')
                                  .delete()
                                  .eq('id', existingApplication.id);

                                if (error) throw error;

                                toast.success('Solicitud cancelada exitosamente.');
                                window.location.reload();
                              } catch (error) {
                                console.error('Error deleting application:', error);
                                toast.error('Error al cancelar la solicitud.');
                              }
                            }}
                            variant="ghost"
                            className="w-full mt-2 text-muted-foreground hover:text-destructive"
                            size="sm"
                          >
                            Cancelar mi Solicitud
                          </Button>
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
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {isEditingRejected ? 'Editar y Reenviar Solicitud' : 'Únete como Profesional'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isEditingRejected 
                ? 'Revisa y actualiza tu información antes de reenviar tu solicitud'
                : 'Completa tu perfil para comenzar a ayudar a pacientes en Holistia'
              }
            </p>
            {isEditingRejected && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <p className="text-sm text-blue-900">
                  <strong>💡 Consejo:</strong> Revisa cuidadosamente toda la información antes de reenviar. 
                  Tu solicitud será evaluada nuevamente por nuestro equipo.
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                Paso {currentStep} de 4
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
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
          <Card className="p-3 sm:p-4">
            <CardHeader className="px-0">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {currentStep === 1 && <User className="h-4 w-4 sm:h-5 sm:w-5" />}
                {currentStep === 2 && <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />}
                {currentStep === 3 && <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />}
                {currentStep === 4 && <FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
                <span className="text-base sm:text-lg">
                  {currentStep === 1 && "Información Personal"}
                  {currentStep === 2 && "Información Profesional"}
                  {currentStep === 3 && "Ubicación"}
                  {currentStep === 4 && "Biografía y Términos"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">{renderStep()}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="w-full sm:w-auto"
            >
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} className="w-full sm:w-auto">Siguiente</Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !formData.terms_accepted ||
                  !formData.privacy_accepted
                }
                className="w-full sm:w-auto"
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
