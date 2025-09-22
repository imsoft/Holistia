import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, GraduationCap, Award, Plus, X, Calendar } from "lucide-react";

interface Certification {
  name: string;
  institution: string;
  expiryDate: string;
}

interface FormData {
  licenseNumber: string;
  licenseExpiry: string;
  degree: string;
  university: string;
  graduationYear: string;
  certifications: Certification[];
  [key: string]: any;
}

interface ProfessionalCredentialsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
}

const ProfessionalCredentials = ({ formData, setFormData, errors }: ProfessionalCredentialsProps) => {
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", institution: "", expiryDate: "" }]
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Licencia Profesional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Número de Licencia *</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                placeholder="Ej: 12345678"
                className={errors.licenseNumber ? "border-red-500" : ""}
              />
              {errors.licenseNumber && (
                <p className="text-sm text-red-500">{errors.licenseNumber}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="licenseExpiry">Fecha de Vencimiento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => handleInputChange("licenseExpiry", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Formación Académica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">Título Profesional *</Label>
              <Input
                id="degree"
                value={formData.degree}
                onChange={(e) => handleInputChange("degree", e.target.value)}
                placeholder="Ej: Licenciado en Psicología"
                className={errors.degree ? "border-red-500" : ""}
              />
              {errors.degree && (
                <p className="text-sm text-red-500">{errors.degree}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="university">Universidad</Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => handleInputChange("university", e.target.value)}
                placeholder="Ej: Universidad Nacional Autónoma de México"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduationYear">Año de Graduación</Label>
            <Input
              id="graduationYear"
              type="number"
              value={formData.graduationYear}
              onChange={(e) => handleInputChange("graduationYear", e.target.value)}
              placeholder="2020"
              min="1950"
              max="2030"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificaciones Adicionales
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addCertification}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.certifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay certificaciones agregadas. Haz clic en "Agregar" para incluir una.
            </p>
          ) : (
            formData.certifications.map((cert, index) => (
              <Card key={index} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary">
                      Certificación {index + 1}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre de la Certificación</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) => updateCertification(index, "name", e.target.value)}
                        placeholder="Ej: Terapia Cognitivo-Conductual"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Institución</Label>
                        <Input
                          value={cert.institution}
                          onChange={(e) => updateCertification(index, "institution", e.target.value)}
                          placeholder="Ej: Instituto Mexicano de Psicoterapia"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Fecha de Vencimiento</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="date"
                            value={cert.expiryDate}
                            onChange={(e) => updateCertification(index, "expiryDate", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalCredentials;
