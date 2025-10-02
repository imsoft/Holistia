"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  X, 
  Plus,
  Edit3, 
  CheckCircle, 
  AlertCircle,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Heart
} from "lucide-react";

interface ProfessionalProfileEditorProps {
  professionalId: string;
  onProfileUpdate?: () => void;
}

interface ProfessionalData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  experience: string;
  certifications: string[];
  wellness_areas: string[];
  biography?: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

const therapyTypes = [
  "Terapia Cognitivo-Conductual",
  "Terapia Psicoanalítica",
  "Terapia Humanista",
  "Terapia Gestalt",
  "Terapia Familiar",
  "Terapia de Pareja",
  "Terapia de Grupo",
  "Terapia Infantil",
  "Terapia de Ansiedad",
  "Terapia de Depresión",
  "Terapia de Trauma",
  "Terapia de Adicciones",
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

export default function ProfessionalProfileEditor({ 
  professionalId, 
  onProfileUpdate 
}: ProfessionalProfileEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const supabase = createClient();

  // Estados para campos editables
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    profession: "",
    specializations: [] as string[],
    experience: "",
    certifications: [] as string[],
    wellness_areas: [] as string[],
    biography: "",
    address: "",
    city: "",
    state: "",
    country: "México",
  });

  // Estados para campos personalizados
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [customCertification, setCustomCertification] = useState("");

  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('professional_applications')
          .select('*')
          .eq('user_id', professionalId)
          .eq('status', 'approved')
          .single();

        if (error) {
          console.error('Error fetching professional data:', error);
          setError('Error al cargar los datos del profesional');
          return;
        }

        if (data) {
          setProfessionalData(data);
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            profession: data.profession || "",
            specializations: data.specializations || [],
            experience: data.experience || "",
            certifications: data.certifications || [],
            wellness_areas: data.wellness_areas || [],
            biography: data.biography || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "México",
          });
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Error inesperado al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [professionalId, supabase]);

  const handleSave = async () => {
    if (!professionalData) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error: updateError } = await supabase
        .from('professional_applications')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          profession: formData.profession,
          specializations: formData.specializations,
          experience: formData.experience,
          certifications: formData.certifications,
          wellness_areas: formData.wellness_areas,
          biography: formData.biography,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          updated_at: new Date().toISOString(),
        })
        .eq('id', professionalData.id);

      if (updateError) {
        console.error('Error updating professional:', updateError);
        setError('Error al actualizar el perfil');
        return;
      }

      setSuccess('Perfil actualizado correctamente');
      setEditingField(null);
      
      // Actualizar el estado local con los nuevos datos
      setProfessionalData(prev => prev ? {
        ...prev,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        profession: formData.profession,
        specializations: formData.specializations,
        experience: formData.experience,
        certifications: formData.certifications,
        wellness_areas: formData.wellness_areas,
        biography: formData.biography,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      } : null);
      
      // Notificar al componente padre
      if (onProfileUpdate) {
        onProfileUpdate();
      }

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Error:', error);
      setError('Error inesperado al actualizar el perfil');
    } finally {
      setSaving(false);
    }
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
      wellness_areas: prev.wellness_areas.includes(area)
        ? prev.wellness_areas.filter(a => a !== area)
        : [...prev.wellness_areas, area]
    }));
  };

  const handleAddCustomSpecialization = () => {
    if (customSpecialization.trim() && !formData.specializations.includes(customSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, customSpecialization.trim()]
      }));
      setCustomSpecialization("");
    }
  };

  const handleAddCustomCertification = () => {
    if (customCertification.trim() && !formData.certifications.includes(customCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, customCertification.trim()]
      }));
      setCustomCertification("");
    }
  };

  const startEditing = (field: string) => {
    setEditingField(field);
    setError(null);
    setSuccess(null);
  };

  const cancelEditing = () => {
    setEditingField(null);
    // Restaurar datos originales
    if (professionalData) {
      setFormData({
        first_name: professionalData.first_name || "",
        last_name: professionalData.last_name || "",
        email: professionalData.email || "",
        phone: professionalData.phone || "",
        profession: professionalData.profession || "",
        specializations: professionalData.specializations || [],
        experience: professionalData.experience || "",
        certifications: professionalData.certifications || [],
        wellness_areas: professionalData.wellness_areas || [],
        biography: professionalData.biography || "",
        address: professionalData.address || "",
        city: professionalData.city || "",
        state: professionalData.state || "",
        country: professionalData.country || "México",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Cargando perfil...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!professionalData) {
    return (
      <Card className="p-4">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No se pudo cargar la información del profesional
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Editar Perfil Profesional
        </CardTitle>
        <CardDescription>
          Actualiza tu información profesional y personal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mensajes de estado */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Información Personal */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Información Personal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              {editingField === 'personal' ? (
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Tu nombre"
                />
              ) : (
                <div 
                  className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                  onClick={() => startEditing('personal')}
                >
                  {professionalData.first_name}
                </div>
              )}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              {editingField === 'personal' ? (
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Tu apellido"
                />
              ) : (
                <div 
                  className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                  onClick={() => startEditing('personal')}
                >
                  {professionalData.last_name}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              {editingField === 'contact' ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                />
              ) : (
                <div 
                  className="p-2 border border-transparent hover:border-border rounded cursor-pointer flex items-center gap-2"
                  onClick={() => startEditing('contact')}
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {professionalData.email}
                </div>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              {editingField === 'contact' ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+52 55 1234 5678"
                />
              ) : (
                <div 
                  className="p-2 border border-transparent hover:border-border rounded cursor-pointer flex items-center gap-2"
                  onClick={() => startEditing('contact')}
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {professionalData.phone || 'No especificado'}
                </div>
              )}
            </div>
          </div>

          {/* Botones de edición para información personal */}
          {editingField === 'personal' && (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={cancelEditing} size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}

          {editingField === 'contact' && (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={cancelEditing} size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Información Profesional */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Información Profesional
          </h3>

          {/* Profesión */}
          <div className="space-y-2">
            <Label htmlFor="profession">Profesión *</Label>
            {editingField === 'profession' ? (
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                placeholder="Ej: Psicóloga Clínica, Psiquiatra"
              />
            ) : (
              <div 
                className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                onClick={() => startEditing('profession')}
              >
                {professionalData.profession}
              </div>
            )}
          </div>

          {/* Años de experiencia */}
          <div className="space-y-2">
            <Label htmlFor="experience">Años de experiencia *</Label>
            {editingField === 'profession' ? (
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Ej: 5 años"
              />
            ) : (
              <div 
                className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                onClick={() => startEditing('profession')}
              >
                {professionalData.experience}
              </div>
            )}
          </div>

          {/* Especializaciones */}
          <div className="space-y-2">
            <Label>Especializaciones</Label>
            {editingField === 'specializations' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      <button
                        onClick={() => handleSpecializationToggle(spec)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {therapyTypes.map((therapy) => (
                    <button
                      key={therapy}
                      onClick={() => handleSpecializationToggle(therapy)}
                      className={`p-2 text-left text-xs rounded border transition-colors ${
                        formData.specializations.includes(therapy)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {therapy}
                    </button>
                  ))}
                </div>
                
                {/* Input para especialización personalizada */}
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Otra especialización..."
                    value={customSpecialization}
                    onChange={(e) => setCustomSpecialization(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSpecialization()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomSpecialization}
                    disabled={!customSpecialization.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                onClick={() => startEditing('specializations')}
              >
                <div className="flex flex-wrap gap-1">
                  {professionalData.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary">{spec}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Certificaciones */}
          <div className="space-y-2">
            <Label>Certificaciones</Label>
            {editingField === 'certifications' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                      {cert}
                      <button
                        onClick={() => handleCertificationToggle(cert)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {certifications.map((cert) => (
                    <button
                      key={cert}
                      onClick={() => handleCertificationToggle(cert)}
                      className={`p-2 text-left text-xs rounded border transition-colors ${
                        formData.certifications.includes(cert)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {cert}
                    </button>
                  ))}
                </div>
                
                {/* Input para certificación personalizada */}
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Otra certificación o educación..."
                    value={customCertification}
                    onChange={(e) => setCustomCertification(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCertification()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomCertification}
                    disabled={!customCertification.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                onClick={() => startEditing('certifications')}
              >
                <div className="flex flex-wrap gap-1">
                  {professionalData.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary">{cert}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Áreas de bienestar */}
          <div className="space-y-2">
            <Label>Áreas de bienestar</Label>
            {editingField === 'wellness' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.wellness_areas.map((area) => (
                    <Badge key={area} variant="secondary" className="flex items-center gap-1">
                      {area}
                      <button
                        onClick={() => handleWellnessAreaToggle(area)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {wellnessAreas.map((area) => (
                    <button
                      key={area}
                      onClick={() => handleWellnessAreaToggle(area)}
                      className={`p-2 text-left text-xs rounded border transition-colors ${
                        formData.wellness_areas.includes(area)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div 
                className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                onClick={() => startEditing('wellness')}
              >
                <div className="flex flex-wrap gap-1">
                  {professionalData.wellness_areas.map((area) => (
                    <Badge key={area} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones de edición para información profesional */}
          {(editingField === 'profession' || editingField === 'specializations' || editingField === 'certifications' || editingField === 'wellness') && (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={cancelEditing} size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Biografía */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Biografía
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="biography">Descripción profesional</Label>
            {editingField === 'biography' ? (
              <Textarea
                id="biography"
                value={formData.biography}
                onChange={(e) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
                placeholder="Cuéntanos sobre tu experiencia, enfoque terapéutico y cómo puedes ayudar a tus pacientes..."
                rows={4}
              />
            ) : (
              <div 
                className="p-3 border border-transparent hover:border-border rounded cursor-pointer min-h-[100px]"
                onClick={() => startEditing('biography')}
              >
                {professionalData.biography || 'Haz clic para agregar una biografía...'}
              </div>
            )}
          </div>

          {editingField === 'biography' && (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={cancelEditing} size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Ubicación */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Ubicación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              {editingField === 'location' ? (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Tu dirección de consulta"
                />
              ) : (
                <div 
                  className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                  onClick={() => startEditing('location')}
                >
                  {professionalData.address}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              {editingField === 'location' ? (
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ciudad"
                />
              ) : (
                <div 
                  className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                  onClick={() => startEditing('location')}
                >
                  {professionalData.city}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              {editingField === 'location' ? (
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Estado"
                />
              ) : (
                <div 
                  className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                  onClick={() => startEditing('location')}
                >
                  {professionalData.state}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              {editingField === 'location' ? (
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="País"
                />
              ) : (
                <div 
                  className="p-2 border border-transparent hover:border-border rounded cursor-pointer"
                  onClick={() => startEditing('location')}
                >
                  {professionalData.country}
                </div>
              )}
            </div>
          </div>

          {editingField === 'location' && (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={cancelEditing} size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
