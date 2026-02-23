"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Página de redirección para la app móvil después del checkout de Stripe.
 * Redirige a holistia://checkout-{result} con query params (type, appointment_id, purchase_id).
 */
function CheckoutCompleteContent() {
  const searchParams = useSearchParams();
  const result = searchParams.get("result") ?? "success";
  const type = searchParams.get("type");
  const appointmentId = searchParams.get("appointment_id");
  const purchaseId = searchParams.get("purchase_id");

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (appointmentId) params.set("appointment_id", appointmentId);
    if (purchaseId) params.set("purchase_id", purchaseId);
    const qs = params.toString();
    const base = `holistia://checkout-${result}`;
    window.location.href = qs ? `${base}?${qs}` : base;
  }, [result, type, appointmentId, purchaseId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <h1 className="text-xl font-semibold mb-2">
        {result === "success" ? "¡Pago completado!" : "Pago cancelado"}
      </h1>
      <p className="text-muted-foreground text-center">
        {result === "success"
          ? "Volviendo a la app..."
          : "Serás redirigido a la app."}
      </p>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <CheckoutCompleteContent />
    </Suspense>
  );
}
