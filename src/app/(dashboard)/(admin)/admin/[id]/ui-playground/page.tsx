"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Sparkles,
  Heart,
  Star,
  Zap,
  Calendar,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import Image from "next/image";

export default function UIPlayground() {
  const [switchChecked, setSwitchChecked] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                UI Playground
              </h1>
              <p className="text-sm text-muted-foreground">
                Prueba y experimenta con componentes de diseño
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Tabs Navigation */}
        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
            <TabsTrigger value="buttons">Botones</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="forms">Formularios</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Buttons Tab */}
          <TabsContent value="buttons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Variantes de Botones</CardTitle>
                <CardDescription>
                  Diferentes estilos y tamaños de botones disponibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Button Variants */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Variantes</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                <Separator />

                {/* Button Sizes */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Tamaños</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Buttons with Icons */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Con Iconos</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Email
                    </Button>
                    <Button variant="secondary">
                      <Phone className="mr-2 h-4 w-4" />
                      Llamar
                    </Button>
                    <Button variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Agendar
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Disabled State */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Estado Deshabilitado</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Deshabilitado</Button>
                    <Button variant="secondary" disabled>Secondary</Button>
                    <Button variant="outline" disabled>Outline</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Card Básica</CardTitle>
                  <CardDescription>
                    Una card simple con título y descripción
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Este es el contenido de la card. Puedes agregar cualquier elemento aquí.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Acción</Button>
                </CardFooter>
              </Card>

              {/* Card with User Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">John Doe</CardTitle>
                      <CardDescription>Profesional de Salud</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>john@example.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Ciudad de México</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card with Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>Badges y Estados</CardTitle>
                  <CardDescription>Diferentes estilos de badges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aprobado
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Star className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Stat Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Usuarios
                  </CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,543</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3 text-green-600" />
                    +12% desde el mes pasado
                  </p>
                </CardContent>
              </Card>

              {/* Interactive Card */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Card Destacada
                  </CardTitle>
                  <CardDescription>
                    Card con borde personalizado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Usa border-2 y colores para destacar cards importantes.
                  </p>
                </CardContent>
              </Card>

              {/* Image Card */}
              <Card>
                <CardHeader className="p-0">
                  <div className="relative h-40 w-full">
                    <Image
                      src="/logos/holistia-logo-square-black.png"
                      alt="Card image"
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardTitle className="text-base mb-2">Card con Imagen</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cards pueden incluir imágenes en el header.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Ver más</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Componentes de Formulario</CardTitle>
                <CardDescription>
                  Inputs, selects, switches y más
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Text Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" placeholder="Ingresa tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" />
                  </div>
                </div>

                <Separator />

                {/* Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Escribe una descripción..."
                    rows={4}
                  />
                </div>

                <Separator />

                {/* Select */}
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psicologia">Psicología</SelectItem>
                      <SelectItem value="nutricion">Nutrición</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="meditacion">Meditación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Switch */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notificaciones</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones por email
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={switchChecked}
                    onCheckedChange={setSwitchChecked}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancelar</Button>
                <Button>Guardar Cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="space-y-4">
              {/* Success Alert */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>¡Éxito!</AlertTitle>
                <AlertDescription>
                  Tu solicitud ha sido procesada correctamente.
                </AlertDescription>
              </Alert>

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  Recuerda completar tu perfil para obtener mejores resultados.
                </AlertDescription>
              </Alert>

              {/* Warning Alert */}
              <Alert className="border-yellow-500/50 text-yellow-800 dark:text-yellow-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Advertencia</AlertTitle>
                <AlertDescription>
                  Esta acción no se puede deshacer. Por favor procede con precaución.
                </AlertDescription>
              </Alert>

              {/* Error Alert */}
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Ocurrió un error al procesar tu solicitud. Intenta nuevamente.
                </AlertDescription>
              </Alert>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Iconos de Usuario</CardTitle>
                <CardDescription>Diferentes tamaños de iconos de usuario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Paleta de Colores del Sistema</CardTitle>
            <CardDescription>
              Colores principales utilizados en la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-primary" />
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-secondary" />
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-muted" />
                <p className="text-sm font-medium">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-accent" />
                <p className="text-sm font-medium">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-destructive" />
                <p className="text-sm font-medium">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border-2 bg-card" />
                <p className="text-sm font-medium">Card</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
