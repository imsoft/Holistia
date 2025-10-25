"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, UserX } from "lucide-react";

interface AccountDeactivationProps {
  userId: string;
  userEmail: string;
  accountType: "patient" | "professional";
}

export function AccountDeactivation({ userId, userEmail, accountType }: AccountDeactivationProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDeactivateClick = () => {
    if (confirmEmail !== userEmail) {
      toast.error("El correo electrónico no coincide");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmDeactivation = async () => {
    try {
      setIsDeactivating(true);

      // Obtener datos actuales del usuario
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !user) {
        throw new Error('Error al obtener datos del usuario');
      }

      // Llamar a la función de base de datos que desactiva la cuenta completamente
      const { data, error } = await supabase.rpc('deactivate_user_account', {
        user_id_param: userId
      });

      if (error) {
        console.error('Error calling deactivate_user_account:', error);
        throw new Error('Error al desactivar la cuenta');
      }

      // Verificar el resultado de la función
      if (data && !data.success) {
        throw new Error(data.message || 'Error al desactivar la cuenta');
      }

      toast.success("Cuenta desactivada exitosamente");

      // Cerrar sesión
      await supabase.auth.signOut();

      // Redirigir al login
      router.push('/login?deactivated=true');

    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error(error instanceof Error ? error.message : 'Error al desactivar la cuenta');
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50 bg-destructive/5 py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription>
            Desactivar tu cuenta es una acción seria. Una vez desactivada, perderás acceso a todos los servicios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Para desactivar tu cuenta, confirma tu correo electrónico:
            </Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={userEmail}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              ¿Qué sucederá al desactivar tu cuenta?
            </h4>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Perderás acceso inmediato a la plataforma</li>
              <li>Tu perfil dejará de ser visible para otros usuarios</li>
              {accountType === "professional" && (
                <>
                  <li>Tus servicios y citas serán cancelados</li>
                  <li>No podrás recibir nuevas reservas</li>
                </>
              )}
              {accountType === "patient" && (
                <>
                  <li>Tus citas programadas serán canceladas</li>
                  <li>Perderás acceso a tus favoritos y historial</li>
                </>
              )}
              <li>Se cerrará tu sesión automáticamente</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>¿Cambiaste de opinión?</strong> Si solo necesitas un descanso, 
              considera contactarnos en{" "}
              <a href="mailto:hola@holistia.io" className="underline font-medium">
                hola@holistia.io
              </a>
              {" "}y podemos ayudarte.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={handleDeactivateClick}
            disabled={isDeactivating || confirmEmail !== userEmail}
            className="w-full"
          >
            <UserX className="h-4 w-4 mr-2" />
            {isDeactivating ? "Desactivando..." : "Desactivar Mi Cuenta"}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="¿Estás absolutamente seguro?"
        description="Esta acción desactivará tu cuenta y cerrarás sesión inmediatamente. Podrás contactarnos para reactivarla en el futuro."
        confirmText="Sí, desactivar mi cuenta"
        cancelText="No, mantener mi cuenta"
        onConfirm={confirmDeactivation}
        variant="destructive"
      />
    </>
  );
}

