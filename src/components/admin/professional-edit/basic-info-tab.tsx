"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { WellnessAreasSelector } from "@/components/ui/wellness-areas-selector";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import Image from "next/image";

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  wellness_areas?: string[];
  city: string;
  state: string;
  country?: string;
  address?: string;
  profile_photo?: string;
  image_position?: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  biography?: string;
  bio?: string;
  experience?: string; // VARCHAR(50) en BD - texto libre sobre experiencia
  certifications?: string[];
  languages?: string[];
  instagram?: string;
  tolerance_minutes?: number;
}

interface BasicInfoTabProps {
  professional: Professional;
  onUpdate: (professional: Partial<Professional>) => void;
}

export function BasicInfoTab({ professional, onUpdate }: BasicInfoTabProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    ...professional,
    biography: professional.biography || professional.bio || '',
    bio: professional.biography || professional.bio || '',
    country: professional.country || 'México',
    address: professional.address || '',
    experience: professional.experience || '', // Campo VARCHAR(50) de la BD
    languages: professional.languages || ['Español'],
    image_position: professional.image_position || 'center center',
    tolerance_minutes: professional.tolerance_minutes || 15,
    // Remover years_of_experience ya que no existe en BD
  });
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSpecialization = () => {
    if (!newSpecialization.trim()) return;
    const updated = {
      ...formData,
      specializations: [...(formData.specializations || []), newSpecialization.trim()]
    };
    setFormData(updated);
    setNewSpecialization("");
  };

  const handleRemoveSpecialization = (index: number) => {
    const updated = {
      ...formData,
      specializations: formData.specializations.filter((_, i) => i !== index)
    };
    setFormData(updated);
  };

  const handleAddCertification = () => {
    if (!newCertification.trim()) return;
    const updated = {
      ...formData,
      certifications: [...(formData.certifications || []), newCertification.trim()]
    };
    setFormData(updated);
    setNewCertification("");
  };

  const handleRemoveCertification = (index: number) => {
    const updated = {
      ...formData,
      certifications: formData.certifications?.filter((_, i) => i !== index) || []
    };
    setFormData(updated);
  };

  const handleAddLanguage = () => {
    if (!newLanguage.trim()) return;
    const lang = newLanguage.trim();
    if (formData.languages?.includes(lang)) {
      toast.error('Este idioma ya está agregado');
      return;
    }
    const updated = {
      ...formData,
      languages: [...(formData.languages || []), lang]
    };
    setFormData(updated);
    setNewLanguage("");
  };

  const handleRemoveLanguage = (index: number) => {
    const updated = {
      ...formData,
      languages: formData.languages?.filter((_, i) => i !== index) || []
    };
    // No permitir eliminar si solo queda uno
    if (updated.languages.length === 0) {
      toast.error('Debe haber al menos un idioma');
      return;
    }
    setFormData(updated);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${professional.id}-${Date.now()}.${fileExt}`;
      const filePath = `${professional.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      handleChange('profile_photo', publicUrl);
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('professional_applications')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email, // El administrador puede editar el email
          phone: formData.phone,
          profession: formData.profession,
          specializations: formData.specializations,
          wellness_areas: formData.wellness_areas,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          address: formData.address,
          profile_photo: formData.profile_photo,
          image_position: formData.image_position,
          biography: formData.biography || formData.bio,
          experience: formData.experience,
          certifications: formData.certifications,
          languages: formData.languages,
          instagram: formData.instagram,
          tolerance_minutes: formData.tolerance_minutes,
        })
        .eq('id', professional.id);

      if (error) throw error;

      onUpdate(formData);
      toast.success('Información actualizada exitosamente');
    } catch (error) {
      console.error('Error updating professional:', error);
      toast.error('Error al actualizar la información');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Datos básicos del profesional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo */}
          <div>
            <Label>Foto de Perfil</Label>
            <div className="mt-2 flex items-center gap-4">
              {formData.profile_photo ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-full">
                  <Image
                    src={formData.profile_photo}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Subiendo...' : 'Cambiar Foto'}
                </Button>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@ejemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                El administrador puede editar el email del profesional
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country || 'México'}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Dirección completa..."
            />
          </div>

          {/* Profession */}
          <div className="space-y-2">
            <Label htmlFor="profession">Profesión</Label>
            <Input
              id="profession"
              value={formData.profession}
              onChange={(e) => handleChange('profession', e.target.value)}
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram (opcional)</Label>
            <Input
              id="instagram"
              value={formData.instagram || ''}
              onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder="@usuario"
            />
          </div>

          {/* Image Position */}
          <div className="space-y-2">
            <Label htmlFor="image_position">Posición de Imagen en Card</Label>
            <Input
              id="image_position"
              value={formData.image_position || 'center center'}
              onChange={(e) => handleChange('image_position', e.target.value)}
              placeholder="center center, top left, etc."
            />
            <p className="text-xs text-muted-foreground">
              Controla cómo se muestra la foto de perfil en las cards (ej: "center center", "top left")
            </p>
          </div>

          {/* Tolerance Minutes */}
          <div className="space-y-2">
            <Label htmlFor="tolerance_minutes">Tiempo de Tolerancia (minutos)</Label>
            <Input
              id="tolerance_minutes"
              type="number"
              min="0"
              value={formData.tolerance_minutes || 15}
              onChange={(e) => handleChange('tolerance_minutes', parseInt(e.target.value) || 15)}
            />
            <p className="text-xs text-muted-foreground">
              Tiempo que el profesional espera a sus pacientes antes de considerar la cita como no asistida
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <RichTextEditor
              content={formData.biography || formData.bio || ''}
              onChange={(content) => {
                handleChange('biography', content);
                handleChange('bio', content);
              }}
              placeholder="Escribe aquí la biografía del profesional..."
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              Usa la barra de herramientas para formatear el texto (negrita, cursiva, listas, etc.)
            </p>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Experiencia (texto libre)</Label>
            <Textarea
              id="experience"
              value={formData.experience || ''}
              onChange={(e) => handleChange('experience', e.target.value)}
              rows={3}
              placeholder="Describe tu experiencia profesional..."
            />
          </div>

          {/* Wellness Areas */}
          <div className="space-y-2">
            <WellnessAreasSelector
              selectedAreas={formData.wellness_areas || []}
              onAreasChange={(areas) => handleChange('wellness_areas', areas)}
              label="Áreas de Bienestar"
              description="Selecciona las áreas en las que este profesional se especializa"
            />
          </div>

          {/* Specializations */}
          <div className="space-y-2">
            <Label>Especializaciones</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Agregar especialización..."
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()}
              />
              <Button onClick={handleAddSpecialization}>Agregar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specializations?.map((spec, index) => (
                <Badge key={index} variant="secondary">
                  {spec}
                  <button
                    onClick={() => handleRemoveSpecialization(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <Label>Certificaciones</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Agregar certificación..."
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
              />
              <Button onClick={handleAddCertification}>Agregar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.certifications?.map((cert, index) => (
                <Badge key={index} variant="secondary">
                  {cert}
                  <button
                    onClick={() => handleRemoveCertification(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label>Idiomas</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Agregar idioma (ej: Inglés, Francés)..."
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
              />
              <Button onClick={handleAddLanguage}>Agregar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.languages?.map((lang, index) => (
                <Badge key={index} variant="secondary">
                  {lang}
                  {formData.languages && formData.languages.length > 1 && (
                    <button
                      onClick={() => handleRemoveLanguage(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Idiomas que habla el profesional
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
