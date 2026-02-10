"use client";

import { useState } from "react";
import Link from "next/link";
import { fireFireworks } from "@/lib/fireworks";
import { Check, ChevronRight, Compass, PartyPopper, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePatientOnboarding } from "@/hooks/use-patient-onboarding";
import { cn } from "@/lib/utils";

function fireOnboardingConfetti() {
  fireFireworks();
}

/**
 * Card de felicitaciones cuando el usuario completa todos los pasos.
 */
function OnboardingCelebrationCard({ onClose }: { onClose?: () => void }) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 py-4">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
            <PartyPopper className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg">
              ¡Felicidades!
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-0.5">
              Completaste todos los pasos. Ya conoces Holistia.
            </p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 -mt-0.5 -mr-1"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          onClick={fireOnboardingConfetti}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PartyPopper className="h-4 w-4" />
          ¡Ver confeti!
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Card interna con el checklist de onboarding.
 * Se usa tanto en el popover del botón como inline si se necesita.
 */
function OnboardingCardContent({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { steps, completedCount, totalSteps, allComplete, loading } =
    usePatientOnboarding();

  if (loading) return null;
  if (allComplete) return <OnboardingCelebrationCard onClose={onClose} />;

  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 py-4">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
            <Compass className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg">
              Empieza tu camino en Holistia
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-0.5">
              {completedCount} de {totalSteps} pasos completados
            </p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 -mt-0.5 -mr-1"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          )}
        </div>
        <Progress value={progressPercent} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <ul className="space-y-1.5" role="list">
          {steps.map((step) => (
            <li key={step.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between h-auto py-3 px-3 sm:px-4 rounded-lg font-normal",
                  step.done
                    ? "text-muted-foreground hover:text-muted-foreground"
                    : "text-foreground hover:bg-primary/10"
                )}
                asChild
                onClick={onClose}
              >
                <Link href={step.href}>
                  <span className="flex items-center gap-3 text-left">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium",
                        step.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/50 bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {step.done ? (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        steps.indexOf(step) + 1
                      )}
                    </span>
                    <span className="text-sm sm:text-base">{step.label}</span>
                  </span>
                  {!step.done && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * Botón de onboarding para la barra de navegación.
 * Muestra un icono de brújula con badge de progreso.
 * Al hacer clic abre un popover con la card de onboarding.
 */
export function PatientOnboardingButton() {
  const [open, setOpen] = useState(false);
  const { completedCount, totalSteps, allComplete, loading } =
    usePatientOnboarding();

  if (loading) return null;

  const remaining = totalSteps - completedCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label={
            allComplete
              ? "Onboarding completado. ¡Abre para celebrar!"
              : `Onboarding: ${completedCount} de ${totalSteps} pasos completados`
          }
        >
          <Compass className="h-5 w-5 text-primary" />
          {!allComplete && remaining > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {remaining}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] sm:w-[440px] p-0 border-0 shadow-lg"
      >
        <OnboardingCardContent onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Card inline de onboarding (para la página de explorar).
 * Se mantiene por compatibilidad, ahora es el botón el principal.
 */
export function PatientOnboardingChecklist() {
  const { allComplete, loading } = usePatientOnboarding();
  if (loading) return null;
  return <OnboardingCardContent />;
}
