"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StripeConnectSetupProps {
  userId: string;
  userType: "admin" | "professional" | "patient";
  onConnected?: () => void;
}

export function StripeConnectSetup({ userId, userType, onConnected }: StripeConnectSetupProps) {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);

      // Crear cuenta de Stripe Connect
      const response = await fetch("/api/stripe/connect/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userType,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear la cuenta de Stripe");
      }

      const data = await response.json();

      // Redirigir al usuario a Stripe para completar el onboarding
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de onboarding");
      }
    } catch (error) {
      console.error("Error connecting to Stripe:", error);
      toast.error("Error al conectar con Stripe");
    } finally {
      setConnecting(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/connect/account-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userType,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al verificar el estado de la cuenta");
      }

      const data = await response.json();

      if (data.onboardingCompleted && data.chargesEnabled) {
        toast.success("Tu cuenta de Stripe está completamente configurada");
        onConnected?.();
      } else if (data.onboardingCompleted && !data.chargesEnabled) {
        toast.warning("Tu cuenta está configurada pero aún no puede recibir pagos");
      } else {
        toast.info("Aún no has completado el proceso de configuración");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error("Error al verificar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Stripe Connect te permite recibir pagos directamente en tu cuenta bancaria.
          El proceso toma solo unos minutos.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleConnect}
          disabled={connecting || loading}
          className="flex-1"
        >
          {connecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Conectar con Stripe
            </>
          )}
        </Button>

        <Button
          onClick={handleCheckStatus}
          disabled={connecting || loading}
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verificar estado
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Al conectar con Stripe, aceptas sus{" "}
        <a
          href="https://stripe.com/es-mx/legal/connect-account"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          términos de servicio
        </a>
        .
      </p>
    </div>
  );
}
