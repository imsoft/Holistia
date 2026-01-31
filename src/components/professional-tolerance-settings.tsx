"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

interface ProfessionalToleranceSettingsProps {
  professionalId: string;
}

export function ProfessionalToleranceSettings({ professionalId }: ProfessionalToleranceSettingsProps) {
  const [toleranceMinutes, setToleranceMinutes] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchToleranceSettings();
  }, [professionalId]);

  const fetchToleranceSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("professional_applications")
        .select("tolerance_minutes")
        .eq("id", professionalId)
        .single();

      if (error) {
        console.error("Error fetching tolerance settings:", error);
        toast.error("Error al cargar la configuración");
        return;
      }

      if (data?.tolerance_minutes !== null && data?.tolerance_minutes !== undefined) {
        setToleranceMinutes(data.tolerance_minutes);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (toleranceMinutes < 0) {
      toast.error("El tiempo de tolerancia no puede ser negativo");
      return;
    }

    if (toleranceMinutes > 60) {
      toast.error("El tiempo de tolerancia no puede ser mayor a 60 minutos");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("professional_applications")
        .update({ tolerance_minutes: toleranceMinutes })
        .eq("id", professionalId);

      if (error) {
        console.error("Error saving tolerance settings:", error);
        toast.error("Error al guardar la configuración");
        return;
      }

      toast.success("Tiempo de tolerancia guardado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tiempo de Tolerancia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-pulse space-y-4 w-full max-w-md">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tiempo de Tolerancia
        </CardTitle>
        <CardDescription>
          Configura cuántos minutos esperas a tus pacientes antes de considerar la cita como no asistida.
          Este tiempo se mostrará a los pacientes después de agendar una cita contigo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tolerance-minutes">Minutos de tolerancia</Label>
          <Input
            id="tolerance-minutes"
            type="number"
            min="0"
            max="60"
            value={toleranceMinutes}
            onChange={(e) => setToleranceMinutes(parseInt(e.target.value) || 0)}
            placeholder="15"
          />
          <p className="text-sm text-muted-foreground">
            Tiempo en minutos (0-60). Valor recomendado: 15 minutos.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
