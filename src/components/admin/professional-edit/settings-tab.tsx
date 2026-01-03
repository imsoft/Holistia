"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldCheck, Eye, EyeOff, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Professional {
  id: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
}

interface SettingsTabProps {
  professional: Professional;
  onUpdate: (professional: Partial<Professional>) => void;
}

export function SettingsTab({ professional, onUpdate }: SettingsTabProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState(professional);

  const handleToggle = async (field: 'is_active' | 'is_verified', value: boolean) => {
    try {
      const updates = { [field]: value };

      const { error } = await supabase
        .from('professional_applications')
        .update(updates)
        .eq('id', professional.id);

      if (error) throw error;

      const updated = { ...formData, [field]: value };
      setFormData(updated);
      onUpdate(updated);

      const messages = {
        is_active: value ? 'Profesional visible en listados' : 'Profesional oculto de listados',
        is_verified: value ? 'Profesional verificado' : 'Verificación removida'
      };
      toast.success(messages[field]);
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Error al actualizar la configuración');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('professional_applications')
        .update({ status: newStatus })
        .eq('id', professional.id);

      if (error) throw error;

      const updated = { ...formData, status: newStatus };
      setFormData(updated);
      onUpdate(updated);
      toast.success('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de la Cuenta</CardTitle>
          <CardDescription>Controla el estado general del profesional en la plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="status">Estado de Aplicación</Label>
            <Select
              value={formData.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formData.status === 'pending' && 'La aplicación está pendiente de revisión'}
              {formData.status === 'approved' && 'El profesional puede acceder a la plataforma'}
              {formData.status === 'rejected' && 'La aplicación fue rechazada'}
              {formData.status === 'suspended' && 'La cuenta está temporalmente suspendida'}
            </p>
          </div>

          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Visibilidad Pública
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Controla si el profesional aparece en los listados públicos y búsquedas
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleToggle('is_active', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <Label htmlFor="is_verified" className="cursor-pointer">
                  Profesional Verificado
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Muestra la insignia de verificación en el perfil del profesional
              </p>
            </div>
            <Switch
              id="is_verified"
              checked={formData.is_verified}
              onCheckedChange={(checked) => handleToggle('is_verified', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Estado Actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado de Aplicación:</span>
            <Badge
              variant={
                formData.status === 'approved'
                  ? 'default'
                  : formData.status === 'pending'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {formData.status === 'approved' && 'Aprobado'}
              {formData.status === 'pending' && 'Pendiente'}
              {formData.status === 'rejected' && 'Rechazado'}
              {formData.status === 'suspended' && 'Suspendido'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Visibilidad:</span>
            <Badge variant={formData.is_active ? 'default' : 'secondary'}>
              {formData.is_active ? 'Visible' : 'Oculto'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Verificación:</span>
            <Badge variant={formData.is_verified ? 'default' : 'secondary'}>
              {formData.is_verified ? 'Verificado' : 'No Verificado'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>Acciones irreversibles o de alto impacto</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full" disabled>
            <Ban className="mr-2 h-4 w-4" />
            Eliminar Cuenta Permanentemente
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Esta funcionalidad requiere confirmación adicional
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
