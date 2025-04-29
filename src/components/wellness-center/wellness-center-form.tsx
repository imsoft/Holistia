"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WellnessCenter } from "@/types/database.types";
import { wellnessCenterService } from "@/services/wellness-center-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Upload, Save, X } from "lucide-react";
import Image from "next/image";

interface WellnessCenterFormProps {
  wellnessCenter?: WellnessCenter;
  isEdit?: boolean;
}

export function WellnessCenterForm({
  wellnessCenter,
  isEdit = false,
}: WellnessCenterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<WellnessCenter>>(
    wellnessCenter || {
      name: "",
      type: "",
      short_description: "",
      description: "",
      established: "",
      location: "",
      address: "",
      features: [],
    }
  );
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [newFeature, setNewFeature] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoImage(e.target.files[0]);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let centerId = wellnessCenter?.id;

      if (isEdit && centerId) {
        // Actualizar centro existente
        const updatedCenter = await wellnessCenterService.updateWellnessCenter(
          centerId,
          formData
        );
        if (!updatedCenter)
          throw new Error("Error al actualizar el centro wellness");
      } else {
        // Crear nuevo centro
        const newCenter = await wellnessCenterService.createWellnessCenter({
          ...formData,
          user_id: null, // Esto se actualizará cuando se implemente la autenticación
          verified: false,
        });
        if (!newCenter) throw new Error("Error al crear el centro wellness");
        centerId = newCenter.id;
      }

      // Subir imágenes si se han seleccionado
      if (centerId) {
        if (logoImage) {
          const logoUrl = await wellnessCenterService.uploadWellnessCenterLogo(
            centerId,
            logoImage
          );
          if (logoUrl) {
            await wellnessCenterService.updateWellnessCenter(centerId, {
              logo_url: logoUrl,
            });
          }
        }

        if (coverImage) {
          const coverUrl =
            await wellnessCenterService.uploadWellnessCenterCoverImage(
              centerId,
              coverImage
            );
          if (coverUrl) {
            await wellnessCenterService.updateWellnessCenter(centerId, {
              cover_image_url: coverUrl,
            });
          }
        }
      }

      toast.success(
        isEdit ? "Centro wellness actualizado" : "Centro wellness creado",
        {
          description: isEdit
            ? "Los datos del centro wellness han sido actualizados correctamente."
            : "El centro wellness ha sido creado correctamente.",
        }
      );

      // Redirigir a la página de detalles del centro wellness
      router.push(
        isEdit ? `/wellness-centers/${centerId}` : "/wellness-centers"
      );
      router.refresh();
    } catch (error) {
      console.error("Error al guardar el centro wellness:", error);
      toast.error("Error", {
        description: `Ha ocurrido un error al ${
          isEdit ? "actualizar" : "crear"
        } el centro wellness.`,
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
            {isEdit ? "Editar Centro Wellness" : "Crear Nuevo Centro Wellness"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del centro</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Nombre del centro wellness"
                required
                className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de centro</Label>
              <Input
                id="type"
                name="type"
                value={formData.type || ""}
                onChange={handleChange}
                placeholder="Ej: Centro Holístico, Spa, Estudio de Yoga"
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
              placeholder="Describe los servicios, instalaciones y filosofía del centro..."
              rows={5}
              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="established">Año de establecimiento</Label>
              <Input
                id="established"
                name="established"
                value={formData.established || ""}
                onChange={handleChange}
                placeholder="Ej: 2015"
                className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección completa</Label>
            <Input
              id="address"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              placeholder="Dirección completa del centro"
              className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
            />
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="space-y-4">
            <Label>Características e instalaciones</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Añadir característica o instalación"
                className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white"
              />
              <Button
                type="button"
                onClick={handleAddFeature}
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10"
              >
                Añadir
              </Button>
            </div>
            <div className="space-y-2">
              {formData.features?.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 p-2 rounded-md"
                >
                  <span className="text-white/80">{feature}</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
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
              <Label htmlFor="logoImage">Logo del centro</Label>
              <div className="flex items-center gap-4">
                {formData.logo_url && (
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-white/10 relative">
                    <Image
                      src={formData.logo_url || "/placeholder.svg"}
                      alt="Logo actual"
                      className="h-full w-full object-cover"
                      width={64}
                      height={64}
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>
                    {formData.logo_url ? "Cambiar logo" : "Subir logo"}
                  </span>
                  <input
                    id="logoImage"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                {logoImage && (
                  <span className="text-sm text-white/70">
                    {logoImage.name}
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
              {isEdit ? "Actualizar" : "Crear"} Centro Wellness
            </>
          )}
          <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
        </Button>
      </div>
    </form>
  );
}
