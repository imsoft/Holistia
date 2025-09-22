"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";
import ProfessionalInfo from "./ProfessionalInfo";
import ProfessionalCredentials from "./ProfessionalCredentials";
import ProfessionalServices from "./ProfessionalServices";
import ProfessionalAvailability from "./ProfessionalAvailability";
import ProfessionalDocuments from "./ProfessionalDocuments";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface ProfessionalSignupFormProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  steps: Step[];
  formData: any;
  setFormData: (data: any) => void;
}

interface FormData {
  // Información personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Credenciales
  licenseNumber: string;
  licenseExpiry: string;
  degree: string;
  university: string;
  graduationYear: string;
  certifications: Array<{
    name: string;
    institution: string;
    expiryDate: string;
  }>;
  
  // Servicios
  specialty: string;
  subSpecialties: string[];
  services: Array<{
    name: string;
    description: string;
    price: string;
    duration: string;
  }>;
  languages: string[];
  
  // Disponibilidad
  consultationTypes: string[];
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  timeSlots: string[];
  
  // Documentos
  profilePhoto: File | null;
  licenseDocument: File | null;
  degreeDocument: File | null;
  idDocument: File | null;
  cvDocument: File | null;
}

const ProfessionalSignupForm = ({ currentStep, setCurrentStep, steps, formData, setFormData }: ProfessionalSignupFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0: // Información personal
        if (!formData.firstName) newErrors.firstName = "El nombre es requerido";
        if (!formData.lastName) newErrors.lastName = "Los apellidos son requeridos";
        if (!formData.email) newErrors.email = "El email es requerido";
        if (!formData.phone) newErrors.phone = "El teléfono es requerido";
        break;
      case 1: // Credenciales
        if (!formData.licenseNumber) newErrors.licenseNumber = "El número de licencia es requerido";
        if (!formData.degree) newErrors.degree = "El título profesional es requerido";
        break;
      case 2: // Servicios
        if (!formData.specialty) newErrors.specialty = "La especialidad es requerida";
        break;
      case 3: // Disponibilidad
        const hasAvailableDay = Object.values(formData.availability).some(day => day.available);
        if (!hasAvailableDay) newErrors.availability = "Debe tener al menos un día disponible";
        break;
      case 4: // Documentos
        if (!formData.profilePhoto) newErrors.profilePhoto = "La foto de perfil es requerida";
        if (!formData.licenseDocument) newErrors.licenseDocument = "El documento de licencia es requerido";
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      setIsSubmitting(true);
      try {
        // Aquí iría la lógica para enviar los datos al servidor
        console.log("Enviando formulario:", formData);
        
        // Simular envío de datos
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Redirigir a la página de éxito
        router.push("/registro-exitoso");
      } catch (error) {
        console.error("Error al enviar el formulario:", error);
        alert("Hubo un error al enviar tu solicitud. Por favor, intenta nuevamente.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ProfessionalInfo
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        );
      case 1:
        return (
          <ProfessionalCredentials
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <ProfessionalServices
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <ProfessionalAvailability
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <ProfessionalDocuments
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
          {steps[currentStep].title}
        </CardTitle>
        <p className="text-muted-foreground">
          {steps[currentStep].description}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progreso */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} de {steps.length}
          </span>
        </div>

        {/* Contenido del paso actual */}
        {renderStep()}

        {/* Navegación */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitud"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalSignupForm;
