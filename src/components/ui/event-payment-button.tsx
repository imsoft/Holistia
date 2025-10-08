"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EventPaymentButtonProps {
  eventId: string;
  serviceAmount: number;
  eventName: string;
  eventDate: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function EventPaymentButton({
  eventId,
  serviceAmount,
  eventName,
  eventDate,
  onSuccess,
  onError,
  className,
  disabled = false,
}: EventPaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create checkout session
      const response = await fetch("/api/stripe/event-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          service_amount: serviceAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear sesión de pago");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
        onSuccess?.();
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al procesar el pago";
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate commission (25% for events)
  const commissionAmount = Math.round(serviceAmount * 0.25 * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">
          ${commissionAmount.toFixed(2)} MXN
        </p>
        <p className="text-sm text-muted-foreground">
          Comisión del 25% del costo total
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Costo total del evento: ${serviceAmount.toFixed(2)} MXN
        </p>
      </div>

      <Button 
        className={`w-full ${className || ''}`}
        size="lg"
        onClick={handlePayment}
        disabled={loading || disabled}
      >
        {loading ? "Procesando..." : "Registrarse al evento"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Al registrarte, serás redirigido a Stripe para completar el pago de forma segura.
        Recibirás un email de confirmación una vez completado el pago.
      </p>
    </div>
  );
}
