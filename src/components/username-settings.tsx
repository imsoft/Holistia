"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { User, Check, X, Loader2 } from "lucide-react";

interface UsernameSettingsProps {
  userId: string;
  currentUsername?: string | null;
}

export function UsernameSettings({ userId, currentUsername }: UsernameSettingsProps) {
  const [username, setUsername] = useState(currentUsername || "");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  useEffect(() => {
    return () => {
      if (checkTimeout) clearTimeout(checkTimeout);
    };
  }, [checkTimeout]);

  const validateUsername = (value: string): string | null => {
    if (!value) return "El nombre de usuario es requerido";
    if (value.length < 3) return "Debe tener al menos 3 caracteres";
    if (value.length > 30) return "No puede exceder 30 caracteres";
    if (!/^[a-z0-9_-]+$/.test(value)) {
      return "Solo puede contener letras minúsculas, números, guiones y guiones bajos";
    }
    return null;
  };

  const checkUsernameAvailability = async (value: string) => {
    // Si es el mismo username que ya tiene el usuario, no verificar
    if (value === currentUsername) {
      setIsAvailable(true);
      return;
    }

    const validationError = validateUsername(value);
    if (validationError) {
      setIsAvailable(false);
      return;
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", value)
        .maybeSingle();

      if (error) throw error;

      setIsAvailable(!data);
    } catch (error) {
      console.error("Error checking username:", error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Convertir a lowercase automáticamente
    const lowercaseValue = value.toLowerCase();
    setUsername(lowercaseValue);
    setIsAvailable(null);

    // Limpiar timeout anterior
    if (checkTimeout) clearTimeout(checkTimeout);

    // Validar formato antes de verificar disponibilidad
    const validationError = validateUsername(lowercaseValue);
    if (validationError) {
      setIsAvailable(false);
      return;
    }

    // Debounce para verificar disponibilidad
    const timeout = setTimeout(() => {
      checkUsernameAvailability(lowercaseValue);
    }, 500);

    setCheckTimeout(timeout);
  };

  const handleSave = async () => {
    if (!username || isAvailable === false) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Nombre de usuario actualizado exitosamente");
    } catch (error: any) {
      console.error("Error saving username:", error);

      if (error.code === "23505") {
        toast.error("Este nombre de usuario ya está en uso");
      } else if (error.code === "23514") {
        toast.error("El nombre de usuario no cumple con el formato requerido");
      } else {
        toast.error("Error al guardar el nombre de usuario");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const validationError = validateUsername(username);
  const hasChanges = username !== currentUsername;
  const canSave = !validationError && isAvailable === true && hasChanges && !isSaving;

  return (
    <Card className="py-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Nombre de Usuario</CardTitle>
        </div>
        <CardDescription>
          Tu nombre de usuario es único y te identifica en la plataforma.
          Puede contener letras minúsculas, números, guiones (-) y guiones bajos (_).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nombre de Usuario</Label>
          <div className="relative">
            <Input
              id="username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="ejemplo_usuario123"
              className={`pr-10 ${
                validationError
                  ? "border-destructive"
                  : isAvailable === true
                  ? "border-green-500"
                  : isAvailable === false
                  ? "border-destructive"
                  : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isAvailable === true && !validationError ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : isAvailable === false || validationError ? (
                <X className="h-4 w-4 text-destructive" />
              ) : null}
            </div>
          </div>

          {/* Mensaje de estado */}
          {username && (
            <div className="text-sm">
              {validationError ? (
                <p className="text-destructive">{validationError}</p>
              ) : isChecking ? (
                <p className="text-muted-foreground">Verificando disponibilidad...</p>
              ) : isAvailable === true ? (
                <p className="text-green-600">¡Nombre de usuario disponible!</p>
              ) : isAvailable === false ? (
                <p className="text-destructive">Este nombre de usuario ya está en uso</p>
              ) : null}
            </div>
          )}

          {/* Preview de URL */}
          {username && !validationError && (
            <div className="text-sm text-muted-foreground">
              Tu perfil estará disponible en: <span className="font-mono">holistia.io/@{username}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>

          {hasChanges && (
            <Button
              variant="outline"
              onClick={() => setUsername(currentUsername || "")}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          )}
        </div>

        {/* Información adicional */}
        <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
          <p className="font-semibold">Requisitos del nombre de usuario:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Entre 3 y 30 caracteres</li>
            <li>Solo letras minúsculas (a-z)</li>
            <li>Números (0-9)</li>
            <li>Guiones (-) y guiones bajos (_)</li>
            <li>Único en toda la plataforma</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
