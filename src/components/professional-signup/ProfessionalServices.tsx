import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  Plus, 
  X, 
  DollarSign, 
  Clock,
  Brain,
  Heart,
  Dumbbell,
  Stethoscope,
  Users
} from "lucide-react";

interface Service {
  name: string;
  description: string;
  price: string;
  duration: string;
}

interface FormData {
  specialty: string;
  subSpecialties: string[];
  services: Service[];
  languages: string[];
  [key: string]: unknown;
}

interface ProfessionalServicesProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
}

const specialtyOptions = [
  { value: "psicologia", label: "Psicología", icon: Brain },
  { value: "nutricion", label: "Nutrición", icon: Heart },
  { value: "fitness", label: "Fitness/Entrenamiento", icon: Dumbbell },
  { value: "medicina", label: "Medicina General", icon: Stethoscope },
  { value: "terapia", label: "Terapia", icon: Users },
];

const languageOptions = [
  "Español",
  "Inglés",
  "Francés",
  "Alemán",
  "Italiano",
  "Portugués",
  "Chino",
  "Japonés",
  "Árabe",
  "Ruso"
];

const ProfessionalServices = ({ formData, setFormData, errors }: ProfessionalServicesProps) => {
  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: "", description: "", price: "", duration: "" }]
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateService = (index: number, field: keyof Service, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const toggleSubSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      subSpecialties: prev.subSpecialties.includes(specialty)
        ? prev.subSpecialties.filter(s => s !== specialty)
        : [...prev.subSpecialties, specialty]
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Especialidad Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecciona tu especialidad principal *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {specialtyOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.specialty === option.value;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange("specialty", option.value)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.specialty && (
              <p className="text-sm text-red-500">{errors.specialty}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Sub-especialidades (opcional)</Label>
            <div className="flex flex-wrap gap-2">
              {["Terapia Individual", "Terapia de Pareja", "Terapia Familiar", "Terapia Grupal", "Terapia Online", "Evaluación Psicológica", "Orientación Vocacional", "Terapia Infantil"].map((specialty) => (
                <Badge
                  key={specialty}
                  variant={formData.subSpecialties.includes(specialty) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleSubSpecialty(specialty)}
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Servicios que Ofreces</CardTitle>
            <Button variant="outline" size="sm" onClick={addService}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Servicio
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.services.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay servicios agregados. Haz clic en &quot;Agregar Servicio&quot; para incluir uno.
            </p>
          ) : (
            formData.services.map((service, index) => (
              <Card key={index} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary">
                      Servicio {index + 1}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre del Servicio</Label>
                      <Input
                        value={service.name}
                        onChange={(e) => updateService(index, "name", e.target.value)}
                        placeholder="Ej: Consulta de Psicología"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={service.description}
                        onChange={(e) => updateService(index, "description", e.target.value)}
                        placeholder="Describe qué incluye este servicio..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Precio (MXN)
                        </Label>
                        <Input
                          type="number"
                          value={service.price}
                          onChange={(e) => updateService(index, "price", e.target.value)}
                          placeholder="1200"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Duración
                        </Label>
                        <Input
                          value={service.duration}
                          onChange={(e) => updateService(index, "duration", e.target.value)}
                          placeholder="50 minutos"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Idiomas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((language) => (
              <Badge
                key={language}
                variant={formData.languages.includes(language) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleLanguage(language)}
              >
                {language}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalServices;
