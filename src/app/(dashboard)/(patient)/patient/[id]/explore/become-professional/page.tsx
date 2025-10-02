"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  User,
  MapPin,
  GraduationCap,
  FileText,
  CheckCircle,
  Briefcase,
  Star,
  Users,
  Clock,
  Plus,
  X,
  AlertCircle,
  Edit,
  Eye,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import ImageGalleryManager from "@/components/ui/image-gallery-manager";
import Link from "next/link";

const therapyTypes = [
  "Terapia Cognitivo-Conductual",
  "Terapia de Ansiedad",
  "Terapia de Depresión",
  "Terapia Familiar",
  "Terapia de Pareja",
  "Terapia Infantil",
  "Terapia de Adicciones",
  "Terapia de Trauma",
  "Terapia de Duelo",
  "Terapia de Autoestima",
  "Terapia de Estrés",
  "Terapia de Fobias",
  "Terapia de Pánico",
  "Terapia de TOC",
  "Terapia de TDAH",
  "Terapia de Asperger",
  "Terapia de Autismo",
  "Terapia de Dislexia",
  "Terapia de Aprendizaje",
  "Terapia de Comportamiento",
];

const certifications = [
  "Licenciatura en Psicología",
  "Maestría en Psicología Clínica",
  "Doctorado en Psicología",
  "Especialización en Terapia Cognitivo-Conductual",
  "Certificación en Terapia de Ansiedad",
  "Certificación en Terapia de Depresión",
  "Certificación en Terapia Familiar",
  "Certificación en Terapia de Pareja",
  "Certificación en Terapia Infantil",
  "Certificación en Terapia de Adicciones",
  "Certificación en Terapia de Trauma",
  "Certificación en Terapia de Duelo",
  "Certificación en Terapia de Autoestima",
  "Certificación en Terapia de Estrés",
  "Certificación en Terapia de Fobias",
  "Certificación en Terapia de Pánico",
  "Certificación en Terapia de TOC",
  "Certificación en Terapia de TDAH",
  "Certificación en Terapia de Asperger",
  "Certificación en Terapia de Autismo",
];

const wellnessAreas = [
  "Salud mental",
  "Espiritualidad", 
  "Actividad física",
  "Social",
  "Alimentación",
];

export default function BecomeProfessionalPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [existingApplication, setExistingApplication] = useState<{
    id: string;
    status: string;
    first_name: string;
    last_name: string;
    email: string;
    profession: string;
    specializations: string[];
    experience: string;
    certifications: string[];
    services: Record<string, unknown>;
    address: string;
    city: string;
    state: string;
    country: string;
    biography?: string;
    profile_photo?: string;
    gallery?: string[];
    created_at: string;
    review_notes?: string;
    reviewed_at?: string;
    reviewed_by?: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const params = useParams();
  const supabase = createClient();
  
  // Obtener ID del usuario de los parámetros
  const userId = params.id as string;

  // Obtener datos del usuario actual y aplicación existente
  useEffect(() => {
    const getUserData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos del usuario desde Supabase
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error getting user:", userError);
          return;
        }

        if (userData.user) {
          const userMetadata = userData.user.user_metadata || {};
          
          const userInfo = {
            id: userData.user.id,
            email: userData.user.email || ''
          };

          setCurrentUser(userInfo);
          
          // Actualizar el formulario con los datos del usuario
          // Solo pre-llenar campos que tengan información
          setFormData(prev => ({
            ...prev,
            firstName: userMetadata.first_name || prev.firstName,
            lastName: userMetadata.last_name || prev.lastName,
            email: userInfo.email || prev.email,
            phone: userMetadata.phone || prev.phone,
          }));

          // Verificar si ya existe una aplicación
          const { data: applicationData, error: appError } = await supabase
            .from('professional_applications')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!appError && applicationData && applicationData.length > 0) {
            const app = applicationData[0];
            setExistingApplication(app);
            
            // Si la aplicación fue rechazada, cargar los datos existentes
            if (app.status === 'rejected') {
              setFormData(prev => ({
                ...prev,
                firstName: app.first_name || prev.firstName,
                lastName: app.last_name || prev.lastName,
                email: app.email || prev.email,
                phone: app.phone || prev.phone,
                profession: app.profession || '',
                specializations: app.specializations || [],
                experience: app.experience || '',
                certifications: app.certifications || [],
                wellnessAreas: app.wellness_areas || [],
                services: app.services || [],
                street: app.address ? app.address.split(' ')[0] || '' : '',
                number: app.address ? app.address.split(' ')[1] || '' : '',
                neighborhood: '',
                city: app.city || '',
                state: app.state || '',
                country: app.country || 'México',
                postalCode: '',
                biography: app.biography || '',
                profile_photo: app.profile_photo || '',
                gallery: app.gallery || [],
                acceptTerms: app.terms_accepted || false,
                acceptPrivacy: app.privacy_accepted || false,
                otherSpecializations: '',
                otherCertifications: '',
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, [userId, supabase]);
  
  const [formData, setFormData] = useState({
    // Información personal - se llenará con datos del usuario
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    
    // Información profesional
    profession: "",
    specializations: [] as string[],
    experience: "",
    certifications: [] as string[],
    
    // Áreas de bienestar
    wellnessAreas: [] as string[],
    
    // Campos para opciones personalizadas
    otherSpecializations: "",
    otherCertifications: "",
    
    // Información de servicios
    services: [] as Array<{
      name: string;
      description: string;
      presencialCost: string;
      onlineCost: string;
    }>,
    
    // Información de ubicación
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "México",
    postalCode: "",
    
    // Información adicional
    biography: "",
    profilePhoto: "",
    gallery: [] as string[],
    
    // Términos y condiciones
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 6;

  // Función para obtener información del estado de la aplicación
  const getApplicationStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pendiente',
          description: 'Tu solicitud está siendo revisada por nuestro equipo',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'under_review':
        return {
          icon: Eye,
          label: 'En Revisión',
          description: 'Tu solicitud está siendo evaluada detalladamente',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          label: 'Aprobada',
          description: '¡Felicidades! Tu solicitud ha sido aprobada',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          label: 'Rechazada',
          description: 'Tu solicitud fue rechazada. Puedes editarla y volver a enviarla',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Clock,
          label: 'Desconocido',
          description: 'Estado no reconocido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleGalleryUpdate = (images: string[]) => {
    setFormData(prev => ({ ...prev, gallery: images }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleCertificationToggle = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter(c => c !== certification)
        : [...prev.certifications, certification]
    }));
  };

  const handleWellnessAreaToggle = (area: string) => {
    setFormData(prev => ({
      ...prev,
      wellnessAreas: prev.wellnessAreas.includes(area)
        ? prev.wellnessAreas.filter(a => a !== area)
        : [...prev.wellnessAreas, area]
    }));
  };

  const handleAddCustomSpecialization = () => {
    if (formData.otherSpecializations.trim()) {
      const customSpecialization = formData.otherSpecializations.trim();
      if (!formData.specializations.includes(customSpecialization)) {
        setFormData(prev => ({
          ...prev,
          specializations: [...prev.specializations, customSpecialization],
          otherSpecializations: ""
        }));
      }
    }
  };

  const handleAddCustomCertification = () => {
    if (formData.otherCertifications.trim()) {
      const customCertification = formData.otherCertifications.trim();
      if (!formData.certifications.includes(customCertification)) {
        setFormData(prev => ({
          ...prev,
          certifications: [...prev.certifications, customCertification],
          otherCertifications: ""
        }));
      }
    }
  };

  const handleRemoveSpecialization = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== specialization)
    }));
  };

  const handleRemoveCertification = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }));
  };

  const handleAddService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, {
        name: "",
        description: "",
        presencialCost: "",
        onlineCost: ""
      }]
    }));
  };

  const handleRemoveService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        // Solo validar email como requerido, los demás campos son opcionales si no están en el perfil
        if (!formData.email) newErrors.email = "El correo electrónico es requerido";
        // Si no tiene nombre/apellido en el perfil, permitir que lo complete manualmente
        if (!formData.firstName) newErrors.firstName = "El nombre es requerido";
        if (!formData.lastName) newErrors.lastName = "El apellido es requerido";
        break;
      case 2:
        if (!formData.profession) newErrors.profession = "La profesión es requerida";
        if (formData.specializations.length === 0) newErrors.specializations = "Selecciona al menos una especialización";
        if (!formData.experience) newErrors.experience = "Los años de experiencia son requeridos";
        break;
      case 3:
        if (formData.services.length === 0) newErrors.services = "Debes agregar al menos un servicio";
        formData.services.forEach((service, index) => {
          if (!service.name) newErrors[`service_${index}_name`] = "El nombre del servicio es requerido";
          if (!service.description) newErrors[`service_${index}_description`] = "La descripción del servicio es requerida";
          // Los costos son opcionales, no se validan
        });
        break;
      case 4:
        if (!formData.street) newErrors.street = "La calle es requerida";
        if (!formData.number) newErrors.number = "El número es requerido";
        if (!formData.city) newErrors.city = "La ciudad es requerida";
        if (!formData.state) newErrors.state = "El estado es requerido";
        break;
      case 5:
        if (!formData.biography) newErrors.biography = "La biografía es requerida";
        if (!formData.acceptTerms) newErrors.acceptTerms = "Debes aceptar los términos y condiciones";
        if (!formData.acceptPrivacy) newErrors.acceptPrivacy = "Debes aceptar la política de privacidad";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Verificar que el usuario esté autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      // Preparar datos para la base de datos
      const applicationData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        profession: formData.profession,
        specializations: formData.specializations,
        experience: formData.experience,
        certifications: formData.certifications,
        wellness_areas: formData.wellnessAreas,
        services: formData.services,
        address: `${formData.street} ${formData.number}${formData.neighborhood ? `, ${formData.neighborhood}` : ''}${formData.postalCode ? `, CP ${formData.postalCode}` : ''}`,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        biography: formData.biography,
        profile_photo: formData.profilePhoto,
        gallery: formData.gallery,
        terms_accepted: formData.acceptTerms,
        privacy_accepted: formData.acceptPrivacy,
        status: 'pending',
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (existingApplication && existingApplication.status === 'rejected') {
        // Actualizar aplicación existente
        const { data, error } = await supabase
          .from('professional_applications')
          .update(applicationData)
          .eq('id', existingApplication.id)
          .select();
        
        result = { data, error };
      } else {
        // Crear nueva aplicación
        const { data, error } = await supabase
          .from('professional_applications')
          .insert([{
            user_id: user.id,
            ...applicationData
          }])
          .select();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('Error submitting application:', result.error);
        console.error('Error details:', JSON.stringify(result.error, null, 2));
        
        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al enviar la solicitud. ';
        
        if (result.error.code === '42501') {
          errorMessage += 'Error de permisos. Asegúrate de que la tabla professional_applications existe y tienes los permisos correctos.';
        } else if (result.error.code === '42P01') {
          errorMessage += 'La tabla professional_applications no existe. Contacta al administrador.';
        } else if (result.error.message) {
          errorMessage += `Detalles: ${result.error.message}`;
        }
        
        alert(errorMessage);
        return;
      }

      console.log('Application submitted successfully:', result.data);
      
      if (existingApplication && existingApplication.status === 'rejected') {
        alert('¡Solicitud actualizada exitosamente! Te contactaremos pronto para revisar tu perfil actualizado.');
      } else {
        alert('¡Solicitud enviada exitosamente! Te contactaremos pronto para revisar tu perfil.');
      }
      
      // Redirigir al perfil del usuario
      window.location.href = `/patient/${userId}/explore/profile`;
      
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mostrar loading mientras se cargan los datos del usuario
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Información Personal</h2>
              <p className="text-muted-foreground">Completa tu información básica</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Los campos se han pre-llenado con la información de tu perfil. Puedes editarlos si es necesario.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Ingresa tu nombre"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Ingresa tu apellido"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Ingresa tu correo electrónico"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Ingresa tu teléfono (opcional)"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Información Profesional</h2>
              <p className="text-muted-foreground">Detalla tu formación y experiencia</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="profession">Profesión *</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => handleInputChange("profession", e.target.value)}
                  placeholder="Ej: Psicóloga Clínica, Psiquiatra, Terapeuta Familiar"
                  className={errors.profession ? "border-red-500" : ""}
                />
                {errors.profession && <p className="text-red-500 text-sm mt-1">{errors.profession}</p>}
              </div>

              <div className="space-y-3">
                <Label>Especializaciones *</Label>
                
                {/* Mostrar especializaciones seleccionadas */}
                {formData.specializations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Especializaciones seleccionadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.specializations.map((spec) => (
                        <div
                          key={spec}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-full text-sm"
                        >
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialization(spec)}
                            className="hover:bg-primary/20 rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Opciones predefinidas */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {therapyTypes.map((therapy) => (
                    <Button
                      key={therapy}
                      type="button"
                      onClick={() => handleSpecializationToggle(therapy)}
                      className={`p-3 text-left rounded-lg border-2 transition-all ${
                        formData.specializations.includes(therapy)
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-primary/50"
                      }`}
                    >
                      <span className="text-sm font-medium">{therapy}</span>
                    </Button>
                  ))}
                </div>
                
                {/* Input para especialización personalizada */}
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Otra especialización..."
                    value={formData.otherSpecializations}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherSpecializations: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSpecialization()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomSpecialization}
                    disabled={!formData.otherSpecializations.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {errors.specializations && <p className="text-red-500 text-sm mt-1">{errors.specializations}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="experience">Años de experiencia *</Label>
                <Input
                  id="experience"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => handleInputChange("experience", e.target.value)}
                  placeholder="Ej: 5"
                  className={errors.experience ? "border-red-500" : ""}
                />
                {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
              </div>

              <div className="space-y-3">
                <Label>Certificaciones y Educación</Label>
                
                {/* Mostrar certificaciones seleccionadas */}
                {formData.certifications.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Certificaciones seleccionadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert) => (
                        <div
                          key={cert}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-full text-sm"
                        >
                          <span>{cert}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(cert)}
                            className="hover:bg-primary/20 rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Opciones predefinidas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certifications.map((cert) => (
                    <Button
                      key={cert}
                      type="button"
                      onClick={() => handleCertificationToggle(cert)}
                      className={`p-3 text-left rounded-lg border-2 transition-all ${
                        formData.certifications.includes(cert)
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-primary/50"
                      }`}
                    >
                      <span className="text-sm font-medium">{cert}</span>
                    </Button>
                  ))}
                </div>
                
                {/* Input para certificación personalizada */}
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Otra certificación o educación..."
                    value={formData.otherCertifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherCertifications: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCertification()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomCertification}
                    disabled={!formData.otherCertifications.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Áreas de Bienestar */}
              <div className="space-y-3">
                <Label>Áreas de Bienestar</Label>
                
                {/* Mostrar áreas seleccionadas */}
                {formData.wellnessAreas.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Áreas seleccionadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.wellnessAreas.map((area) => (
                        <div
                          key={area}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-full text-sm"
                        >
                          <span>{area}</span>
                          <button
                            type="button"
                            onClick={() => handleWellnessAreaToggle(area)}
                            className="hover:bg-primary/20 rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Opciones predefinidas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {wellnessAreas.map((area) => (
                    <Button
                      key={area}
                      type="button"
                      onClick={() => handleWellnessAreaToggle(area)}
                      className={`p-3 text-left rounded-lg border-2 transition-all ${
                        formData.wellnessAreas.includes(area)
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-primary/50"
                      }`}
                    >
                      <span className="text-sm font-medium">{area}</span>
                    </Button>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Selecciona las áreas de bienestar en las que puedes ayudar a tus pacientes.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Información de Servicios</h2>
              <p className="text-muted-foreground">Define tus servicios y precios</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Label>Servicios *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddService}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Servicio
                </Button>
              </div>

              {errors.services && <p className="text-red-500 text-sm">{errors.services}</p>}

              {formData.services.map((service, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Servicio {index + 1}</h3>
                    {formData.services.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveService(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor={`service_${index}_name`}>Nombre del servicio *</Label>
                      <Input
                        id={`service_${index}_name`}
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                        placeholder="Ej: Terapia Individual, Terapia de Pareja, Consulta Psicológica"
                        className={errors[`service_${index}_name`] ? "border-red-500" : ""}
                      />
                      {errors[`service_${index}_name`] && <p className="text-red-500 text-sm mt-1">{errors[`service_${index}_name`]}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor={`service_${index}_description`}>Descripción del servicio *</Label>
                      <Textarea
                        id={`service_${index}_description`}
                        value={service.description}
                        onChange={(e) => handleServiceChange(index, "description", e.target.value)}
                        placeholder="Describe brevemente este servicio específico..."
                        rows={3}
                        className={errors[`service_${index}_description`] ? "border-red-500" : ""}
                      />
                      {errors[`service_${index}_description`] && <p className="text-red-500 text-sm mt-1">{errors[`service_${index}_description`]}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor={`service_${index}_presencialCost`}>Costo presencial (MXN)</Label>
                        <Input
                          id={`service_${index}_presencialCost`}
                          type="number"
                          value={service.presencialCost}
                          onChange={(e) => handleServiceChange(index, "presencialCost", e.target.value)}
                          placeholder="Ej: 1600 (opcional)"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor={`service_${index}_onlineCost`}>Costo en línea (MXN)</Label>
                        <Input
                          id={`service_${index}_onlineCost`}
                          type="number"
                          value={service.onlineCost}
                          onChange={(e) => handleServiceChange(index, "onlineCost", e.target.value)}
                          placeholder="Ej: 1400 (opcional)"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {formData.services.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay servicios agregados</p>
                  <p className="text-sm">Haz clic en &quot;Agregar Servicio&quot; para comenzar</p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Información de Ubicación</h2>
              <p className="text-muted-foreground">Proporciona tu ubicación de consulta</p>
            </div>

            <div className="space-y-6">
              {/* Instrucciones para la dirección */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">i</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Instrucciones para la dirección:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• <strong>Calle:</strong> Nombre de la calle (ej: Cipriano Campos Alatorre)</li>
                      <li>• <strong>Número:</strong> Número exterior (ej: 752)</li>
                      <li>• <strong>Colonia:</strong> Nombre de la colonia (ej: Roma Norte)</li>
                      <li>• <strong>Código Postal:</strong> CP para mayor precisión (opcional pero recomendado)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Campos de dirección */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="street">Calle *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange("street", e.target.value)}
                    placeholder="Ej: Cipriano Campos Alatorre"
                    className={errors.street ? "border-red-500" : ""}
                  />
                  {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange("number", e.target.value)}
                    placeholder="Ej: 752"
                    className={errors.number ? "border-red-500" : ""}
                  />
                  {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="neighborhood">Colonia</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                    placeholder="Ej: Roma Norte (opcional)"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    placeholder="Ej: 06700 (opcional pero recomendado)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Ej: Ciudad de México"
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Ej: CDMX"
                    className={errors.state ? "border-red-500" : ""}
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    disabled
                  />
                </div>
              </div>

              {/* Vista previa de la dirección completa */}
              {formData.street && formData.number && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">Dirección completa:</p>
                      <p className="text-green-700">
                        {formData.street} {formData.number}
                        {formData.neighborhood && `, ${formData.neighborhood}`}
                        {formData.postalCode && `, CP ${formData.postalCode}`}
                        {`, ${formData.city}, ${formData.state}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Galería de Imágenes</h2>
              <p className="text-muted-foreground">Muestra tu espacio de trabajo (opcional)</p>
            </div>

            <div className="space-y-6">
              <ImageGalleryManager
                professionalId={currentUser?.id || ''}
                currentImages={formData.gallery}
                onImagesUpdate={handleGalleryUpdate}
                maxImages={5}
                maxSizeMB={2}
              />
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">i</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">¿Por qué agregar imágenes?</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Muestra tu espacio de consulta profesional</li>
                      <li>• Genera confianza en tus pacientes</li>
                      <li>• Destaca tu ambiente de trabajo</li>
                      <li>• Máximo 5 imágenes de 2MB cada una</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Información Adicional</h2>
              <p className="text-muted-foreground">Completa tu perfil y acepta los términos</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="biography">Biografía profesional *</Label>
                <Textarea
                  id="biography"
                  value={formData.biography}
                  onChange={(e) => handleInputChange("biography", e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia, formación y enfoque terapéutico..."
                  rows={6}
                  className={errors.biography ? "border-red-500" : ""}
                />
                {errors.biography && <p className="text-red-500 text-sm mt-1">{errors.biography}</p>}
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange("acceptTerms", e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="acceptTerms" className="text-sm">
                      Acepto los{" "}
                      <Link href="#" className="text-primary hover:underline">
                        términos y condiciones
                      </Link>{" "}
                      de Holistia *
                    </Label>
                    {errors.acceptTerms && <p className="text-red-500 text-sm mt-1">{errors.acceptTerms}</p>}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="acceptPrivacy"
                    checked={formData.acceptPrivacy}
                    onChange={(e) => handleInputChange("acceptPrivacy", e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="acceptPrivacy" className="text-sm">
                      Acepto la{" "}
                      <Link href="#" className="text-primary hover:underline">
                        política de privacidad
                      </Link>{" "}
                      y el manejo de mis datos *
                    </Label>
                    {errors.acceptPrivacy && <p className="text-red-500 text-sm mt-1">{errors.acceptPrivacy}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Conviértete en Profesional
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Únete a nuestra plataforma y ayuda a más personas a mejorar su bienestar mental
          </p>
        </div>

        {/* Estado de la aplicación existente */}
        {existingApplication && (
          <Card className="mb-8">
            <CardHeader className="px-8 pt-8">
              <div className="flex items-center gap-4">
                {(() => {
                  const statusInfo = getApplicationStatusInfo(existingApplication.status);
                  const IconComponent = statusInfo.icon;
                  return (
                    <div className={`p-3 rounded-full ${statusInfo.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${statusInfo.color}`} />
                    </div>
                  );
                })()}
                <div>
                  <CardTitle className="text-xl mb-2">
                    Estado de tu Solicitud
                  </CardTitle>
                  <CardDescription className="text-base">
                    {getApplicationStatusInfo(existingApplication.status).description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
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
                
                {existingApplication.specializations && existingApplication.specializations.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Especializaciones</p>
                    <div className="flex flex-wrap gap-2">
                      {existingApplication.specializations.map((spec: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {existingApplication.review_notes && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Notas de revisión</p>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-base text-muted-foreground">{existingApplication.review_notes}</p>
                    </div>
                  </div>
                )}

                {existingApplication.reviewed_at && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Fecha de revisión</p>
                    <p className="text-base text-muted-foreground">{formatDate(existingApplication.reviewed_at)}</p>
                  </div>
                )}

                {/* Botones de acción según el estado */}
                {existingApplication.status === 'rejected' && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex gap-4">
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar Solicitud
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = `/patient/${userId}/explore/profile`}
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  </div>
                )}

                {existingApplication.status === 'approved' && (
                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={() => window.location.href = `/professional/${userId}/dashboard`}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Ir al Dashboard Profesional
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mostrar formulario solo si no hay aplicación o si está rechazada y en modo edición */}
        {(!existingApplication || (existingApplication.status === 'rejected' && isEditing)) && (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Paso {currentStep} de {totalSteps}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((currentStep / totalSteps) * 100)}% completado
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Form Card */}
            <Card className="mb-8">
              <CardContent className="p-12">
                {renderStep()}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Siguiente
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {submitting ? "Enviando..." : (existingApplication ? "Actualizar Solicitud" : "Enviar Solicitud")}
                </Button>
              )}
            </div>
          </>
        )}


        {/* Benefits Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Beneficios de ser Profesional en Holistia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="px-8 pt-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Más Pacientes</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <CardDescription className="text-base leading-relaxed">
                  Conecta con pacientes que buscan tu especialidad y aumenta tu cartera de clientes
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-8 pt-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Gestión Simplificada</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <CardDescription className="text-base leading-relaxed">
                  Herramientas para gestionar citas, pagos y comunicación con tus pacientes
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-8 pt-8">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Credibilidad</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <CardDescription className="text-base leading-relaxed">
                  Perfil profesional verificado que genera confianza en tus pacientes
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
