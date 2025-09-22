"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Shield, 
  Star, 
  Heart, 
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Calendar,
  LucideIcon
} from "lucide-react";
import ProfessionalSignupForm from "@/components/professional-signup/ProfessionalSignupForm";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    id: "info",
    title: "Información Personal",
    description: "Datos básicos y contacto",
    icon: Users
  },
  {
    id: "credentials",
    title: "Credenciales",
    description: "Licencias y certificaciones",
    icon: Shield
  },
  {
    id: "services",
    title: "Servicios",
    description: "Especialidades y tratamientos",
    icon: Star
  },
  {
    id: "availability",
    title: "Disponibilidad",
    description: "Horarios y ubicación",
    icon: Calendar
  },
  {
    id: "documents",
    title: "Documentos",
    description: "Subir archivos requeridos",
    icon: FileText
  }
];

const UneteAHolistiaPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Inicializar formData con valores por defecto para evitar el error de controlled/uncontrolled
  const [formData, setFormData] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    licenseNumber: "",
    licenseExpiry: "",
    degree: "",
    university: "",
    graduationYear: "",
    certifications: [],
    specialty: "",
    subSpecialties: [],
    services: [],
    languages: [],
    consultationTypes: [],
    availability: {
      monday: { start: "09:00", end: "17:00", available: true },
      tuesday: { start: "09:00", end: "17:00", available: true },
      wednesday: { start: "09:00", end: "17:00", available: true },
      thursday: { start: "09:00", end: "17:00", available: true },
      friday: { start: "09:00", end: "17:00", available: true },
      saturday: { start: "09:00", end: "13:00", available: false },
      sunday: { start: "09:00", end: "13:00", available: false },
    },
    timeSlots: [],
    profilePhoto: null,
    licenseDocument: null,
    degreeDocument: null,
    idDocument: null,
    cvDocument: null,
  });

  // Función para validar si un paso está completo
  const isStepCompleted = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Información Personal
        return !!(
          formData.firstName && 
          formData.lastName && 
          formData.email && 
          formData.phone
        );
      case 1: // Credenciales
        return !!(
          formData.licenseNumber && 
          formData.degree
        );
      case 2: // Servicios
        return !!(
          formData.specialty &&
          formData.services && 
          formData.services.length > 0
        );
      case 3: // Disponibilidad
        return !!(
          formData.consultationTypes && 
          formData.consultationTypes.length > 0 &&
          formData.availability &&
          Object.values(formData.availability).some((day: any) => day.available)
        );
      case 4: // Documentos
        return !!(
          formData.profilePhoto && 
          formData.licenseDocument
        );
      default:
        return false;
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Permitir navegación libre entre todos los pasos
    setCurrentStep(stepIndex);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Únete a Holistia como Profesional
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Conecta con pacientes que buscan tu expertise y haz crecer tu práctica profesional
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceso de verificación
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Heart className="h-4 w-4 mr-2" />
                Comunidad de profesionales
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Star className="h-4 w-4 mr-2" />
                Plataforma confiable
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar con pasos */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Proceso de Registro
                </CardTitle>
                <CardDescription>
                  Completa todos los pasos para unirte a nuestra plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = isStepCompleted(index);
                  
                  return (
                    <div
                      key={step.id}
                      onClick={() => handleStepClick(index)}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-primary/10 border border-primary/20' 
                          : isCompleted 
                            ? 'bg-green-50 border border-green-200 hover:bg-green-100' 
                            : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          isActive ? 'text-primary' : isCompleted ? 'text-green-800' : 'text-foreground'
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                        {isCompleted && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Completado
                          </p>
                        )}
                        {isActive && (
                          <p className="text-xs text-primary mt-1">
                            ← Paso actual
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card className="sticky top-[600px]">
              <CardHeader>
                <CardTitle className="text-lg">¿Por qué elegir Holistia?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Amplia base de pacientes</h4>
                    <p className="text-sm text-muted-foreground">
                      Conecta con miles de pacientes buscando profesionales de salud
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Plataforma segura</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistema de pagos y comunicaciones completamente seguro
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Flexibilidad total</h4>
                    <p className="text-sm text-muted-foreground">
                      Consultas presenciales u online, tú decides
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario principal */}
          <div className="lg:col-span-2">
            <ProfessionalSignupForm 
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              steps={steps}
              formData={formData}
              setFormData={setFormData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UneteAHolistiaPage;
