"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FeaturesSection } from "@/components/shared/fearures-section";
import { Footer } from "@/components/shared/footer";
import { HeroSection } from "@/components/shared/hero-section";
import { LogoClouds } from "@/components/shared/logo-clouds";
import { TestimonialsSection } from "@/components/shared/testimonials-section";
import { ExploreSection } from "@/components/shared/explore-section";

const Home = () => {
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Obtener tipo de usuario desde profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', user.id)
          .single();

        console.log("🚨 ALERTA: Usuario autenticado llegó a la página principal:", {
          userId: user.id,
          email: user.email,
          userType: profile?.type
        });
      }
    };
    
    checkUser();
  }, []);

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ExploreSection />
      <TestimonialsSection />
      <LogoClouds />
      <Footer />
    </>
  );
};

export default Home;
