"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { FeaturesSection } from "@/components/shared/fearures-section";
import { Footer } from "@/components/shared/footer";
import { HeroSection } from "@/components/shared/hero-section";
import { LogoClouds } from "@/components/shared/logo-clouds";
import { TestimonialsSection } from "@/components/shared/testimonials-section";
import { ExploreSection } from "@/components/shared/explore-section";
import { SpecialtiesBadgesSection } from "@/components/shared/specialties-badges-section";
import { Snowflakes } from "@/components/ui/snowflakes";

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirectUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Obtener tipo de usuario desde profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', user.id)
          .single();

        console.log("🔄 Usuario autenticado detectado, redirigiendo al dashboard:", {
          userId: user.id,
          email: user.email,
          userType: profile?.type
        });

        // Redirigir según el tipo de usuario
        if (profile?.type === 'admin') {
          router.push(`/admin/${user.id}/dashboard`);
        } else if (profile?.type === 'professional') {
          // Verificar si el profesional tiene una aplicación aprobada
          const { data: professionalApp } = await supabase
            .from('professional_applications')
            .select('id, status')
            .eq('user_id', user.id)
            .maybeSingle();

          if (professionalApp) {
            router.push(`/professional/${professionalApp.id}/dashboard`);
          } else {
            // Si no tiene aplicación, redirigir como paciente
            router.push(`/patient/${user.id}/explore`);
          }
        } else {
          // Por defecto redirigir como paciente
          router.push(`/patient/${user.id}/explore`);
        }
      }
    };

    checkAndRedirectUser();
  }, [router]);

  return (
    <>
      <Snowflakes />
      <HeroSection />
      <SpecialtiesBadgesSection />
      <ExploreSection />
      <FeaturesSection />
      <TestimonialsSection />
      <LogoClouds />
      <Footer />
    </>
  );
};

export default Home;
