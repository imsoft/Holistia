"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, User } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  service_type: "individual" | "group";
  max_capacity: number | null;
  is_active: boolean;
}

interface ServiceFormProps {
  centerId: string;
  service: Service | null;
  redirectPath: string;
}

export function ServiceForm({ centerId, service, redirectPath }: ServiceFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price?.toString() || "",
    service_type: service?.service_type || "individual",
    max_capacity: service?.max_capacity?.toString() || "",
    is_active: service?.is_active ?? true,
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (formData.service_type === "group" && (!formData.max_capacity || parseInt(formData.max_capacity) <= 0)) {
      toast.error("Los servicios grupales requieren una capacidad máxima mayor a 0");
      return;
    }

    try {
      setSaving(true);

      const serviceData = {
        center_id: centerId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        service_type: formData.service_type,
        max_capacity: formData.service_type === "group" && formData.max_capacity
          ? parseInt(formData.max_capacity)
          : null,
        is_active: formData.is_active,
      };

      if (service) {
        const { error } = await supabase
          .from("holistic_center_services")
          .update(serviceData)
          .eq("id", service.id);

        if (error) throw error;
        toast.success("Servicio actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from("holistic_center_services")
          .insert(serviceData);

        if (error) throw error;
        toast.success("Servicio creado exitosamente");
      }

      router.push(redirectPath);
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Error al guardar el servicio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Servicio *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Consulta de Nutrición"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe el servicio..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Precio</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-3">
        <Label>Tipo de Servicio *</Label>
        <RadioGroup
          value={formData.service_type}
          onValueChange={(value: "individual" | "group") => setFormData({ ...formData, service_type: value })}
        >
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer flex-1">
              <User className="w-4 h-4" />
              <div>
                <p className="font-medium">Individual</p>
                <p className="text-sm text-muted-foreground">Servicio uno a uno</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="group" id="group" />
            <Label htmlFor="group" className="flex items-center gap-2 cursor-pointer flex-1">
              <Users className="w-4 h-4" />
              <div>
                <p className="font-medium">Grupal</p>
                <p className="text-sm text-muted-foreground">Servicio para múltiples personas</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {formData.service_type === "group" && (
        <div className="space-y-2">
          <Label htmlFor="max_capacity">Capacidad Máxima *</Label>
          <Input
            id="max_capacity"
            type="number"
            value={formData.max_capacity}
            onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
            placeholder="Ej: 10"
            required
          />
          <p className="text-sm text-muted-foreground">
            Número máximo de personas que pueden asistir al servicio grupal
          </p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active" className="font-normal cursor-pointer">
          Servicio activo
        </Label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(redirectPath)}
          disabled={saving}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving
            ? "Guardando..."
            : service
            ? "Actualizar Servicio"
            : "Crear Servicio"}
        </Button>
      </div>
    </form>
  );
}
