import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Clock, 
  MapPin,
  Video,
  Users,
  Home
} from "lucide-react";

interface Availability {
  start: string;
  end: string;
  available: boolean;
}

interface FormData {
  consultationTypes: string[];
  availability: {
    monday: Availability;
    tuesday: Availability;
    wednesday: Availability;
    thursday: Availability;
    friday: Availability;
    saturday: Availability;
    sunday: Availability;
  };
  timeSlots: string[];
  [key: string]: unknown;
}

interface ProfessionalAvailabilityProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
}

const daysOfWeek = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const consultationTypes = [
  { value: "presencial", label: "Consulta Presencial", icon: Users },
  { value: "online", label: "Consulta Online", icon: Video },
  { value: "domicilio", label: "Consulta a Domicilio", icon: Home },
];

const timeSlotOptions = [
  "30 minutos",
  "45 minutos", 
  "50 minutos",
  "60 minutos",
  "90 minutos",
  "120 minutos"
];

const ProfessionalAvailability = ({ formData, setFormData, errors }: ProfessionalAvailabilityProps) => {
  // const handleInputChange = (field: string, value: string | string[]) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // };

  const updateAvailability = (day: string, field: keyof Availability, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value
        }
      }
    }));
  };

  const toggleConsultationType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      consultationTypes: prev.consultationTypes.includes(type)
        ? prev.consultationTypes.filter(t => t !== type)
        : [...prev.consultationTypes, type]
    }));
  };

  const toggleTimeSlot = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot)
        ? prev.timeSlots.filter(t => t !== slot)
        : [...prev.timeSlots, slot]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tipos de Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {consultationTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.consultationTypes.includes(type.value);
              
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleConsultationType(type.value)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Disponibilidad Semanal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => {
            const dayData = formData.availability[day.key as keyof typeof formData.availability];
            
            return (
              <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Checkbox
                    checked={dayData.available}
                    onCheckedChange={(checked) => updateAvailability(day.key, "available", !!checked)}
                  />
                  <Label className="font-medium">{day.label}</Label>
                </div>
                
                {dayData.available && (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Desde:</Label>
                      <Input
                        type="time"
                        value={dayData.start}
                        onChange={(e) => updateAvailability(day.key, "start", e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Hasta:</Label>
                      <Input
                        type="time"
                        value={dayData.end}
                        onChange={(e) => updateAvailability(day.key, "end", e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {errors.availability && (
            <p className="text-sm text-red-500">{errors.availability}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duraciones de Cita Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {timeSlotOptions.map((slot) => (
              <Badge
                key={slot}
                variant={formData.timeSlots.includes(slot) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTimeSlot(slot)}
              >
                {slot}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Información de Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Consulta Presencial</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Si ofreces consultas presenciales, asegúrate de tener una ubicación adecuada y segura para recibir pacientes.
            </p>
            <div className="space-y-2">
              <Label>Dirección del Consultorio (opcional)</Label>
              <Input placeholder="Calle, número, colonia, ciudad" />
            </div>
          </div>

          <div className="bg-muted/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Consulta Online</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Para consultas online, necesitarás una plataforma de videollamadas confiable y una conexión a internet estable.
            </p>
            <div className="space-y-2">
              <Label>Plataforma Preferida (opcional)</Label>
              <Input placeholder="Ej: Zoom, Google Meet, Teams" />
            </div>
          </div>

          <div className="bg-muted/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Consulta a Domicilio</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Si ofreces consultas a domicilio, especifica el área geográfica donde puedes desplazarte.
            </p>
            <div className="space-y-2">
              <Label>Área de Cobertura (opcional)</Label>
              <Input placeholder="Ej: Ciudad de México, Área Metropolitana" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalAvailability;
