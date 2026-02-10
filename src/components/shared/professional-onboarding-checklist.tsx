"use client";

import Link from "next/link";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfessionalOnboarding } from "@/hooks/use-professional-onboarding";
import { cn } from "@/lib/utils";

export function ProfessionalOnboardingChecklist() {
  const { steps, completedCount, totalSteps, allComplete, loading } =
    useProfessionalOnboarding();

  if (loading || allComplete) return null;

  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 py-4">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">
              Configura tu cuenta para recibir pacientes
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-0.5">
              {completedCount} de {totalSteps} pasos completados
            </p>
          </div>
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
