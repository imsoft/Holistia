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
  profile_photo?: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  bio?: string;
  years_of_experience?: number;
  certifications?: string[];
  instagram?: string;
}

interface BasicInfoTabProps {
  professional: Professional;
  onUpdate: (professional: Partial<Professional>) => void;
}

export function BasicInfoTab({ professional, onUpdate }: BasicInfoTabProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState(professional);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newCertification, setNewCertification] = useState("");
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
          phone: formData.phone,
          profession: formData.profession,
          specializations: formData.specializations,
          wellness_areas: formData.wellness_areas,
          city: formData.city,
          state: formData.state,
          profile_photo: formData.profile_photo,
          bio: formData.bio,
          years_of_experience: formData.years_of_experience,
          certifications: formData.certifications,
          instagram: formData.instagram,
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
      <Card>
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
            <div>
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
            </div>
            <div>
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
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
          </div>

          {/* Profession */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profession">Profesión</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => handleChange('profession', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="years">Años de Experiencia</Label>
              <Input
                id="years"
                type="number"
                value={formData.years_of_experience || ''}
                onChange={(e) => handleChange('years_of_experience', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Instagram */}
          <div>
            <Label htmlFor="instagram">Instagram (opcional)</Label>
            <Input
              id="instagram"
              value={formData.instagram || ''}
              onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder="@usuario"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={4}
              placeholder="Descripción profesional..."
            />
          </div>

          {/* Wellness Areas */}
          <div>
            <WellnessAreasSelector
              selectedAreas={formData.wellness_areas || []}
              onAreasChange={(areas) => handleChange('wellness_areas', areas)}
              label="Áreas de Bienestar"
              description="Selecciona las áreas en las que este profesional se especializa"
            />
          </div>

          {/* Specializations */}
          <div>
            <Label>Especializaciones</Label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Agregar especialización..."
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()}
              />
              <Button onClick={handleAddSpecialization}>Agregar</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
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
          <div>
            <Label>Certificaciones</Label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Agregar certificación..."
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
              />
              <Button onClick={handleAddCertification}>Agregar</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
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
