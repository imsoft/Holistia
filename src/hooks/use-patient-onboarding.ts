"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUserId } from "@/stores/user-store";

const EXPLORED_KEY = "holistia_patient_onboarding_explored";

export type PatientOnboardingStepId = "explore" | "favorites" | "first_appointment";

export interface PatientOnboardingStep {
  id: PatientOnboardingStepId;
  label: string;
  href: string;
  done: boolean;
}

const STEPS: Omit<PatientOnboardingStep, "done">[] = [
  { id: "explore", label: "Explora especialidades y profesionales", href: "/explore" },
  { id: "favorites", label: "Guarda favoritos", href: "/explore/favorites" },
  { id: "first_appointment", label: "Agenda tu primera cita", href: "/explore/professionals" },
];

export function usePatientOnboarding() {
  const userId = useUserId();
  const pathname = usePathname();
  const [explored, setExplored] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setExplored(localStorage.getItem(EXPLORED_KEY) === "true");
    } catch {
      setExplored(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;
    if (pathname.startsWith("/explore")) {
      try {
        localStorage.setItem(EXPLORED_KEY, "true");
        setExplored(true);
      } catch {
        // ignore
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const supabase = createClient();

        const { count: favCount } = await supabase
          .from("user_favorites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);

        const { count: aptCount } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("patient_id", userId)
          .in("status", ["pending", "confirmed", "completed"]);

        setFavoritesCount(favCount ?? 0);
        setAppointmentsCount(aptCount ?? 0);
      } catch {
        setFavoritesCount(0);
        setAppointmentsCount(0);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [userId]);

  const steps: PatientOnboardingStep[] = [
    { ...STEPS[0], done: explored },
    { ...STEPS[1], done: favoritesCount > 0 },
    { ...STEPS[2], done: appointmentsCount > 0 },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalSteps = STEPS.length;
  const allComplete = completedCount === totalSteps;

  return {
    steps,
    completedCount,
    totalSteps,
    allComplete,
    loading,
  };
}

/** Llamar desde el layout o página de explore para marcar "explorado" */
export function markPatientExplored() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXPLORED_KEY, "true");
  } catch {
    // ignore
  }
}
