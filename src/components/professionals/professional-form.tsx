"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Professional } from "@/types/database.types";
import { professionalService } from "@/services/professional-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Upload, Save, X } from "lucide-react";
import Image from "next/image";

interface ProfessionalFormProps {
  professional?: Professional;
  isEdit?: boolean;
}

export function ProfessionalForm({
  professional,
  isEdit = false,
}: ProfessionalFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Professional>>(
    professional || {
      name: "",
      specialty: "",
      short_description: "",
      description: "",
      experience: "",
      education: [],
      languages: [],
      location: "",
    }
  );
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [newEducation, setNewEducation] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleAddEducation = () => {
    if (newEducation.trim()) {
      setFormData((prev) => ({
        ...prev,
        education: [...(prev.education || []), newEducation.trim()],
      }));
      setNewEducation("");
    }
  };

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index),
    }));
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      setFormData((prev) => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage.trim()],
      }));
      setNewLanguage("");
    }
  };

  const handleRemoveLanguage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let professionalId = professional?.id;

      if (isEdit && professionalId) {
        // Actualizar profesional existente
        const updatedProfessional =
          await professionalService.updateProfessional(
            professionalId,
            formData
          );
        if (!updatedProfessional)
          throw new Error("Error al actualizar el profesional");
      } else {
        // Crear nuevo profesional
        const newProfessional = await professionalService.createProfessional({
          ...formData,
          user_id: null, // Esto se actualizará cuando se implemente la autenticación
          verified: false,
        });
        if (!newProfessional) throw new Error("Error al crear el profesional");
        professionalId = newProfessional.id;
      }

      // Subir imágenes si se han seleccionado
      if (professionalId) {
        if (profileImage) {
          const imageUrl = await professionalService.uploadProfessionalImage(
            professionalId,
            profileImage
          );
          if (imageUrl) {
            await professionalService.updateProfessional(professionalId, {
              image_url: imageUrl,
            });
          }
        }

        if (coverImage) {
          const coverUrl =
            await professionalService.uploadProfessionalCoverImage(
              professionalId,
              coverImage
            );
          if (coverUrl) {
            await professionalService.updateProfessional(professionalId, {
              cover_image_url: coverUrl,
            });
          }
        }
      }

      toast.success(isEdit ? "Profesional actualizado" : "Profesional creado", {
        description: isEdit
          ? "Los datos del profesional han sido actualizados correctamente."
          : "El profesional ha sido creado correctamente.",
      });

      // Redirigir a la página de detalles del profesional
      router.push(
        isEdit ? `/professionals/${professionalId}` : "/professionals"
      );
      router.refresh();
    } catch (error) {
      console.error("Error al guardar el profesional:", error);
      toast.error("Error", {
        description: `Ha ocurrido un error al ${
          isEdit ? "actualizar" : "crear"
        } el profesional.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle>
            {isEdit ? "Editar Profesional" : "Crear Nuevo Profesional"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Nombre del profesional"
                required
                className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                name="specialty"
                value={formData.specialty || ""}
                onChange={handleChange}
                placeholder="Ej: Nutricionista Holística"
                required
                className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Descripción corta</Label>
            <Input
              id="short_description"
              name="short_description"
              value={formData.short_description || ""}
              onChange={handleChange}
              placeholder="Breve descripción (máx. 150 caracteres)"
              maxLength={150}
              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción completa</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Describe tu experiencia, enfoque y especialidades..."
              rows={5}
              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              placeholder="Ej: Ciudad de México"
              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Años de experiencia</Label>
            <Input
              id="experience"
              name="experience"
              value={formData.experience || ""}
              onChange={handleChange}
              placeholder="Ej: 8 años"
              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
            />
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="space-y-4">
            <Label>Educación y certificaciones</Label>
            <div className="flex gap-2">
              <Input
                value={newEducation}
                onChange={(e) => setNewEducation(e.target.value)}
                placeholder="Añadir educación o certificación"
                className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
              />
              <Button
                type="button"
                onClick={handleAddEducation}
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10"
              >
                Añadir
              </Button>
            </div>
            <div className="space-y-2">
              {formData.education?.map((edu, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 p-2 rounded-md"
                >
                  <span className="text-white/80">{edu}</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveEducation(index)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Idiomas</Label>
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Añadir idioma"
                className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
              />
              <Button
                type="button"
                onClick={handleAddLanguage}
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10"
              >
                Añadir
              </Button>
            </div>
            <div className="space-y-2">
              {formData.languages?.map((lang, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 p-2 rounded-md"
                >
                  <span className="text-white/80">{lang}</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveLanguage(index)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="profileImage">Imagen de perfil</Label>
              <div className="flex items-center gap-4">
                {formData.image_url && (
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-white/10 relative">
                    <Image
                      src={formData.image_url || "/placeholder.svg"}
                      alt="Imagen de perfil actual"
                      className="h-full w-full object-cover"
                      width={64}
                      height={64}
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>
                    {formData.image_url ? "Cambiar imagen" : "Subir imagen"}
                  </span>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>
                {profileImage && (
                  <span className="text-sm text-white/70">
                    {profileImage.name}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Imagen de portada</Label>
              <div className="flex items-center gap-4">
                {formData.cover_image_url && (
                  <div className="h-12 w-24 rounded overflow-hidden bg-white/10 relative">
                    <Image
                      src={formData.cover_image_url || "/placeholder.svg"}
                      alt="Imagen de portada actual"
                      className="h-full w-full object-cover"
                      width={96}
                      height={48}
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>
                    {formData.cover_image_url
                      ? "Cambiar portada"
                      : "Subir portada"}
                  </span>
                  <input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                </label>
                {coverImage && (
                  <span className="text-sm text-white/70">
                    {coverImage.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-white/20 bg-white/5 hover:bg-white/10"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 relative overflow-hidden group"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Actualizar" : "Crear"} Profesional
            </>
          )}
          <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
        </Button>
      </div>
    </form>
  );
}
