"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhone } from "@/utils/phone-utils";
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
  Heart,
  Instagram
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
  instagram?: string;
  profession: string;
  specializations: string[];
  languages?: string[];
  experience: string;
  certifications: string[];
  wellness_areas: string[];
  biography?: string;
  address: string;
  city: string;
  state: string;
  country: string;
}


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
  const [isContentValid, setIsContentValid] = useState(true);
  const supabase = createClient();

  // Estados para campos editables
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    instagram: "",
    profession: "",
    specializations: [] as string[],
    languages: ["Español"] as string[],
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
  const [customLanguage, setCustomLanguage] = useState("");

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
            instagram: data.instagram || "",
            profession: data.profession || "",
            specializations: data.specializations || [],
            languages: data.languages || ["Español"],
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

    // Validar que el contenido no exceda el límite
    if (!isContentValid) {
      setError('La biografía excede el límite de caracteres. Por favor, reduce el texto.');
      return;
    }

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
          instagram: formData.instagram,
          profession: formData.profession,
          specializations: formData.specializations,
          languages: formData.languages,
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
        instagram: formData.instagram,
        profession: formData.profession,
        specializations: formData.specializations,
        languages: formData.languages,
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


  const handleAddCustomSpecialization = () => {
    if (customSpecialization.trim() && !formData.specializations.includes(customSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, customSpecialization.trim()]
      }));
      setCustomSpecialization("");
    }
  };

  const handleLanguageToggle = (language: string) => {
    // No permitir eliminar el español si es el único idioma
    if (language === "Español" && formData.languages.length === 1) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleAddCustomLanguage = () => {
    if (customLanguage.trim() && !formData.languages.includes(customLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, customLanguage.trim()]
      }));
      setCustomLanguage("");
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
        instagram: professionalData.instagram || "",
        profession: professionalData.profession || "",
        specializations: professionalData.specializations || [],
        languages: professionalData.languages || ["Español"],
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
            <span className="ml-2 inline-block h-4 w-28 bg-muted rounded animate-pulse" />
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
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
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
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
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
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-2"
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
                <PhoneInput
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  placeholder="55 1234 5678"
                  defaultCountryCode="+52"
                />
              ) : (
                <div 
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-2"
                  onClick={() => startEditing('contact')}
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {professionalData.phone ? formatPhone(professionalData.phone) : 'No especificado'}
                </div>
              )}
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram">Usuario de Instagram</Label>
              {editingField === 'contact' ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="instagram"
                    value={formData.instagram || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="tu_usuario"
                    className="pl-8"
                  />
                </div>
              ) : (
                <div 
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-2"
                  onClick={() => startEditing('contact')}
                >
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  {professionalData.instagram ? `@${professionalData.instagram}` : 'No especificado'}
                </div>
              )}
            </div>
          </div>

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
                className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
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
                className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
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
                className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
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

          {/* Idiomas */}
          <div className="space-y-2">
            <Label>Idiomas que hablas *</Label>
            {editingField === 'languages' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.languages.map((lang) => (
                    <Badge
                      key={lang}
                      variant="secondary"
                      className={`flex items-center gap-1 ${lang === "Español" ? "border-2 border-primary" : ""}`}
                    >
                      {lang}
                      {!(lang === "Español" && formData.languages.length === 1) && (
                        <button
                          onClick={() => handleLanguageToggle(lang)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>

                {/* Input para idioma personalizado */}
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Ej: Inglés, Francés, Portugués..."
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomLanguage()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomLanguage}
                    disabled={!customLanguage.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  El español está incluido por defecto. Agrega otros idiomas que hables.
                </p>
              </div>
            ) : (
              <div
                className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => startEditing('languages')}
              >
                <div className="flex flex-wrap gap-1">
                  {(professionalData.languages && professionalData.languages.length > 0) ? (
                    professionalData.languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className={lang === "Español" ? "border-2 border-primary" : ""}>{lang}</Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">Español</Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Certificaciones */}
          <div className="space-y-3">
            <Label>Certificaciones</Label>

            {/* Mostrar certificaciones actuales si las hay */}
            {professionalData.certifications && professionalData.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {professionalData.certifications.map((cert) => (
                  <Badge key={cert} variant="secondary">{cert}</Badge>
                ))}
              </div>
            )}

            {/* Información sobre certificaciones por email - SIEMPRE visible */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">
                    Envíanos tus certificaciones por email
                  </p>
                  <p className="text-blue-700 mb-3">
                    Para agregar certificaciones adicionales, haz clic en el enlace:
                  </p>
                  <a
                    href={`mailto:hola@holistia.io?subject=Certificaciones - ${professionalData.first_name} ${professionalData.last_name}&body=Adjunta tus certificaciones y documentos de respaldo`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Mail className="h-4 w-4" />
                    Enviar Certificaciones
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Áreas de bienestar - Solo lectura */}
          <div className="space-y-2">
            <Label>Áreas de bienestar</Label>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex flex-wrap gap-2 mb-2">
                {professionalData.wellness_areas && professionalData.wellness_areas.length > 0 ? (
                  professionalData.wellness_areas.map((area) => (
                    <Badge key={area} variant="secondary">{area}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay áreas de bienestar asignadas</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Las áreas de bienestar son gestionadas por el equipo de administración
              </p>
            </div>
          </div>

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
              <RichTextEditor
                content={formData.biography || ""}
                onChange={(content) => setFormData(prev => ({ ...prev, biography: content }))}
                placeholder="Cuéntanos sobre tu experiencia, enfoque terapéutico y cómo puedes ayudar a tus pacientes..."
                maxLength={500}
                onValidationChange={setIsContentValid}
              />
            ) : (
              <div 
                className="p-3 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors min-h-[100px] prose prose-sm max-w-none"
                onClick={() => startEditing('biography')}
                dangerouslySetInnerHTML={{ 
                  __html: professionalData.biography || '<p class="text-muted-foreground">Haz clic para agregar una biografía...</p>' 
                }}
              />
            )}
          </div>

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
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
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
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
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
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
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
                  className="p-2 border border-border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => startEditing('location')}
                >
                  {professionalData.country}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Botones de edición - Aparecen al final cuando se está editando cualquier sección */}
        {editingField && (
          <div className="flex gap-2 justify-end pt-6 border-t">
            <Button variant="outline" onClick={cancelEditing} size="sm" disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !isContentValid} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            {!isContentValid && (
              <p className="text-xs text-destructive mt-1">
                La biografía excede el límite de caracteres.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
