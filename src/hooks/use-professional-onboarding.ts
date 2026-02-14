"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useProfessionalData } from "./use-professional-data";

export type ProfessionalOnboardingStepId =
  | "profile"
  | "services"
  | "availability"
  | "stripe";

export interface ProfessionalOnboardingStep {
  id: ProfessionalOnboardingStepId;
  label: string;
  href: string;
  done: boolean;
}

const STEPS: Omit<ProfessionalOnboardingStep, "done">[] = [
  { id: "profile", label: "Completa tu perfil", href: "/profile" },
  { id: "services", label: "Añade al menos un servicio", href: "/services" },
  { id: "availability", label: "Configura tu disponibilidad", href: "/availability" },
  { id: "stripe", label: "Conecta Stripe para recibir pagos", href: "/finances" },
];

export function useProfessionalOnboarding() {
  const { professional, loading: professionalLoading } = useProfessionalData();
  const [servicesCount, setServicesCount] = useState<number>(0);
  const [availabilityOk, setAvailabilityOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!professional) {
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const supabase = createClient();

        const { count } = await supabase
          .from("professional_services")
          .select("id", { count: "exact", head: true })
          .eq("professional_id", professional.id);

        setServicesCount(count ?? 0);

        const hasWorkingHours =
          !!professional.working_start_time &&
          !!professional.working_end_time;
        const { data: workingDaysRow } = await supabase
          .from("professional_applications")
          .select("working_days")
          .eq("id", professional.id)
          .single();
        const days = (workingDaysRow?.working_days as number[] | null) ?? [];
        setAvailabilityOk(hasWorkingHours && days.length > 0);
      } catch {
        setServicesCount(0);
        setAvailabilityOk(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [professional?.id, professional?.working_start_time, professional?.working_end_time]);

  const profileDone = !!(
    professional?.first_name?.trim() &&
    professional?.last_name?.trim() &&
    professional?.profile_photo
  );

  const [biographyComplete, setBiographyComplete] = useState(false);
  const [biographyLoading, setBiographyLoading] = useState(true);
  useEffect(() => {
    if (!professional?.id) {
      setBiographyLoading(false);
      return;
    }
    let cancelled = false;
    setBiographyLoading(true);
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("professional_applications")
        .select("biography")
        .eq("id", professional.id)
        .single();
      if (!cancelled) {
        setBiographyComplete(!!(data?.biography && String(data.biography).trim().length > 0));
      }
    })().finally(() => {
      if (!cancelled) setBiographyLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [professional?.id]);

  const stripeDone = !!(
    professional?.stripe_account_id &&
    professional?.stripe_charges_enabled &&
    professional?.stripe_payouts_enabled
  );

  const steps: ProfessionalOnboardingStep[] = [
    {
      ...STEPS[0],
      done: profileDone && biographyComplete,
    },
    {
      ...STEPS[1],
      done: servicesCount >= 1,
    },
    {
      ...STEPS[2],
      done: availabilityOk,
    },
    {
      ...STEPS[3],
      done: stripeDone,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allComplete = completedCount === STEPS.length;

  return {
    steps,
    completedCount,
    totalSteps: STEPS.length,
    allComplete,
    loading: professionalLoading || loading || biographyLoading,
  };
}
