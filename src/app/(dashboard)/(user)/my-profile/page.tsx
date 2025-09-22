"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Camera, Save, User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import Image from "next/image";

const MyProfilePage = () => {
  const [formData, setFormData] = useState({
    nombre: "Usuario Holistia",
    apellidos: "Ejemplo",
    email: "usuario@holistia.com",
    telefono: "+34 123 456 789",
    fechaNacimiento: "1990-01-01",
    direccion: "Calle Ejemplo 123, Madrid, España",
    bio: "Soy un usuario de Holistia interesado en mejorar mi bienestar integral a través de profesionales de la salud.",
    especialidades: ["Salud Mental", "Nutrición", "Fitness"]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar los datos
    console.log("Datos guardados:", formData);
    alert("Perfil actualizado correctamente");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Foto de perfil */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Foto de perfil
              </CardTitle>
              <CardDescription>
                Actualiza tu foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Foto de perfil"
                    className="h-32 w-32 rounded-full object-cover border-4 border-border"
                    width={128}
                    height={128}
                  />
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full p-2"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm">
                  Cambiar foto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información personal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
              <CardDescription>
                Actualiza tu información personal básica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Correo electrónico *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de nacimiento
                    </Label>
                    <Input
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Cuéntanos sobre ti y tus objetivos de bienestar..."
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Áreas de interés</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.especialidades.map((especialidad, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {especialidad}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Las áreas de interés se configuran automáticamente según tus citas y preferencias.
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;