"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, UserX, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const TERMS_URL = "/terms";

export type AppointmentPoliciesVariant = "patient" | "professional";
export type AppointmentPoliciesLayout = "inline" | "compact" | "card";

interface AppointmentPoliciesProps {
  variant: AppointmentPoliciesVariant;
  layout?: AppointmentPoliciesLayout;
  className?: string;
}

/** Contenido de políticas para pacientes (flujo de reserva/pago) */
function PatientPolicyContent({ compact = false }: { compact?: boolean }) {
  const items = [
    {
      icon: Clock,
      title: "Cancelación",
      text: "Debes cancelar con al menos 24 horas de anticipación. Las cancelaciones tardías pueden tener cargos según la política del profesional.",
    },
    {
      icon: UserX,
      title: "No asistencia",
      text: "Si no te presentas a la cita, no aplica reembolso y el profesional puede marcar la cita como no asistencia.",
    },
    {
      icon: Receipt,
      title: "Reembolsos",
      text: "No hay reembolsos una vez confirmado el pago. En caso de cancelación con más de 24 h, el profesional puede evaluar excepciones.",
    },
  ];

  if (compact) {
    return (
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="flex gap-3">
              <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
              <span>
                <strong className="text-foreground font-medium">{item.title}:</strong>{" "}
                {item.text}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-3 text-sm">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.title} className="flex gap-3">
            <Icon className="h-4 w-4 shrink-0 mt-0.5 text-primary/80" aria-hidden />
            <div>
              <span className="font-medium text-foreground">{item.title}: </span>
              <span className="text-muted-foreground">{item.text}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Contenido de políticas para profesionales (dashboard) */
function ProfessionalPolicyContent() {
  return (
    <ul className="space-y-3 text-sm">
      <li className="flex gap-3">
        <Clock className="h-4 w-4 shrink-0 mt-0.5 text-primary/80" aria-hidden />
        <div>
          <span className="font-medium text-foreground">Cancelación: </span>
          <span className="text-muted-foreground">
            Las cancelaciones deben hacerse con al menos 24 horas de anticipación. Las cancelaciones tardías del paciente pueden estar sujetas a cargos según tu criterio.
          </span>
        </div>
      </li>
      <li className="flex gap-3">
        <UserX className="h-4 w-4 shrink-0 mt-0.5 text-primary/80" aria-hidden />
        <div>
          <span className="font-medium text-foreground">Si el paciente no asiste: </span>
          <span className="text-muted-foreground">
            Puedes marcar la cita como &quot;Paciente no asistió&quot; desde el detalle de la cita. No aplica reembolso para el paciente en estos casos.
          </span>
        </div>
      </li>
      <li className="flex gap-3">
        <Receipt className="h-4 w-4 shrink-0 mt-0.5 text-primary/80" aria-hidden />
        <div>
          <span className="font-medium text-foreground">Reembolsos: </span>
          <span className="text-muted-foreground">
            No hay reembolsos por defecto. Para cancelaciones con más de 24 h, puedes acordar excepciones directamente con el paciente según tu política.
          </span>
        </div>
      </li>
    </ul>
  );
}

/** Enlace a términos completo (accesible, abre en nueva pestaña) */
function TermsLink({ className }: { className?: string }) {
  return (
    <Link
      href={TERMS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded",
        className
      )}
    >
      <FileText className="h-4 w-4 shrink-0" aria-hidden />
      Ver términos y condiciones completos
    </Link>
  );
}

export function AppointmentPolicies({
  variant,
  layout = "inline",
  className,
}: AppointmentPoliciesProps) {
  if (variant === "patient") {
    if (layout === "card") {
      return (
        <Card className={cn("border-primary/20 bg-muted/30", className)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
              Políticas de reserva y pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <PatientPolicyContent />
            <TermsLink />
          </CardContent>
        </Card>
      );
    }

    if (layout === "compact") {
      return (
        <div
          className={cn(
            "rounded-lg border border-border bg-muted/30 p-4 space-y-3",
            className
          )}
          role="region"
          aria-labelledby="appointment-policies-heading"
        >
          <h3 id="appointment-policies-heading" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden />
            Políticas de cancelación y reembolsos
          </h3>
          <PatientPolicyContent compact />
          <TermsLink className="mt-2" />
        </div>
      );
    }

    // inline: para dentro del diálogo de reserva, breve y escaneable
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-muted/20 p-4 sm:p-5 space-y-3",
          className
        )}
        role="region"
        aria-labelledby="appointment-policies-inline-heading"
      >
        <h3 id="appointment-policies-inline-heading" className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" aria-hidden />
          Políticas de citas
        </h3>
        <PatientPolicyContent />
        <p className="text-xs text-muted-foreground pt-1">
          Al confirmar la reserva aceptas nuestras{" "}
          <Link href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            condiciones de uso
          </Link>
          .
        </p>
      </div>
    );
  }

  // professional + card (dashboard)
  return (
    <Card className={cn("border-primary/20 bg-muted/30 py-4", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" aria-hidden />
          Políticas de citas (cancelación, no-show, reembolsos)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <ProfessionalPolicyContent />
        <div className="pt-3 border-t border-border">
          <TermsLink />
        </div>
      </CardContent>
    </Card>
  );
}
