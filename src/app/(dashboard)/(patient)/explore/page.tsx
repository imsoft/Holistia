import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  transformServicesFromDB,
  determineProfessionalModality,
} from "@/utils/professional-utils";
import { sortProfessionalsByRanking } from "@/utils/professional-ranking";
import { ExploreClient } from "./explore-client";

export default async function ExplorePage() {
  const supabase = await createClient();

  // Verificar autenticación server-side
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // ─── Fetch de datos en paralelo (server-side, ~5ms vs ~200ms desde el navegador) ───

  const todayStr = new Date().toISOString().split("T")[0];

  const [
    professionalsResult,
    eventsResult,
    challengesResult,
    restaurantsResult,
    shopsResult,
    productsResult,
    holisticCentersResult,
  ] = await Promise.allSettled([
    supabase
      .from("professional_applications")
      .select("*")
      .eq("status", "approved")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("events_workshops")
      .select(
        `
        *,
        professional_applications(
          first_name,
          last_name,
          profession
        )
      `
      )
      .eq("is_active", true)
      .gte("event_date", todayStr)
      .order("event_date", { ascending: true }),
    supabase
      .from("challenges")
      .select("*")
      .eq("is_active", true)
      .eq("is_public", true)
      .in("created_by_type", ["professional", "admin"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("restaurants")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("shops")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("digital_products")
      .select(
        `
        *,
        professional_applications!digital_products_professional_id_fkey(
          first_name,
          last_name,
          profile_photo,
          is_verified,
          wellness_areas,
          status,
          is_active
        )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("holistic_centers")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  // ─── Procesar profesionales (batch queries para evitar N+1) ───

  let professionals: any[] = [];

  if (professionalsResult.status === "fulfilled") {
    const professionalsData = professionalsResult.value.data;

    if (professionalsData && professionalsData.length > 0) {
      const professionalIds = professionalsData.map((p) => p.id);
      const userIds = professionalsData
        .map((p) => p.user_id)
        .filter((id): id is string => !!id);

      const [
        allServicesResult,
        allReviewStatsResult,
        allAdminRatingResult,
        allAppointmentsResult,
      ] = await Promise.allSettled([
        supabase
          .from("professional_services")
          .select("*")
          .in("professional_id", professionalIds)
          .eq("isactive", true),
        supabase
          .from("professional_review_stats")
          .select("professional_id, average_rating, total_reviews")
          .in("professional_id", userIds),
        supabase
          .from("professional_admin_rating_stats")
          .select("professional_id, average_admin_rating")
          .in("professional_id", professionalIds),
        supabase
          .from("appointments")
          .select("professional_id", { count: "exact", head: false })
          .in("professional_id", professionalIds)
          .eq("status", "completed"),
      ]);

      const allServices =
        allServicesResult.status === "fulfilled"
          ? allServicesResult.value.data || []
          : [];
      const allReviewStats =
        allReviewStatsResult.status === "fulfilled"
          ? allReviewStatsResult.value.data || []
          : [];
      const allAdminRatings =
        allAdminRatingResult.status === "fulfilled"
          ? allAdminRatingResult.value.data || []
          : [];
      const allAppointments =
        allAppointmentsResult.status === "fulfilled"
          ? allAppointmentsResult.value.data || []
          : [];

      // Maps para O(1) lookup
      const servicesMap = new Map<string, any[]>();
      const reviewStatsMap = new Map<string, any>();
      const adminRatingMap = new Map<string, any>();
      const appointmentsMap = new Map<string, number>();

      allServices.forEach((service: any) => {
        const profId = service.professional_id;
        if (!servicesMap.has(profId)) {
          servicesMap.set(profId, []);
        }
        servicesMap.get(profId)!.push(service);
      });

      allReviewStats.forEach((stat: any) => {
        reviewStatsMap.set(stat.professional_id, stat);
      });

      allAdminRatings.forEach((rating: any) => {
        adminRatingMap.set(rating.professional_id, rating);
      });

      allAppointments.forEach((apt: any) => {
        const profId = apt.professional_id;
        appointmentsMap.set(profId, (appointmentsMap.get(profId) || 0) + 1);
      });

      const professionalsWithServices = professionalsData.map((prof) => {
        const services = servicesMap.get(prof.id) || [];
        const reviewStats = reviewStatsMap.get(prof.user_id) || null;
        const adminRatingData = adminRatingMap.get(prof.id) || null;
        const completedAppointmentsCount = appointmentsMap.get(prof.id) || 0;

        const transformedServices = transformServicesFromDB(services);
        const professionalModality =
          determineProfessionalModality(transformedServices);

        return {
          ...prof,
          services:
            transformedServices.length > 0
              ? transformedServices
              : prof.services || [],
          modality: professionalModality,
          imagePosition: prof.image_position || "center center",
          average_rating: reviewStats?.average_rating || undefined,
          total_reviews: reviewStats?.total_reviews || undefined,
          admin_rating:
            adminRatingData?.average_admin_rating || undefined,
          completed_appointments: completedAppointmentsCount,
          is_active: prof.is_active !== false,
          is_verified: prof.is_verified || false,
          verified: prof.is_verified || false,
        };
      });

      professionals = sortProfessionalsByRanking(professionalsWithServices);
    }
  }

  // ─── Procesar eventos ───

  const events =
    eventsResult.status === "fulfilled"
      ? eventsResult.value.data || []
      : [];

  // ─── Procesar retos (con lookup de profesionales separado por RLS) ───

  let challenges: any[] = [];

  if (challengesResult.status === "fulfilled") {
    const challengesData = challengesResult.value.data as any[] | null;
    const challengeError = challengesResult.value.error;

    if (!challengeError && challengesData && challengesData.length > 0) {
      const challengeProfIds = challengesData
        .map((c: any) => c.professional_id)
        .filter((id: any): id is string => !!id);

      const professionalsMap = new Map();
      if (challengeProfIds.length > 0) {
        const { data: professionalsData } = await supabase
          .from("professional_applications")
          .select(
            "id, first_name, last_name, profile_photo, profession, is_verified, status, is_active"
          )
          .in("id", challengeProfIds)
          .eq("status", "approved")
          .eq("is_active", true);

        if (professionalsData) {
          professionalsData.forEach((prof) => {
            professionalsMap.set(prof.id, prof);
          });
        }
      }

      const validChallenges = challengesData.filter((challenge: any) => {
        if (!challenge.professional_id) return true;
        return professionalsMap.has(challenge.professional_id);
      });

      challenges = validChallenges.map((challenge: any) => {
        const professional = challenge.professional_id
          ? professionalsMap.get(challenge.professional_id)
          : null;

        return {
          ...challenge,
          professional_first_name: professional?.first_name,
          professional_last_name: professional?.last_name,
          professional_photo: professional?.profile_photo,
          professional_profession: professional?.profession,
          professional_is_verified: professional?.is_verified,
        };
      });
    }
  }

  // ─── Procesar restaurantes, shops, centros holísticos ───

  const restaurants =
    restaurantsResult.status === "fulfilled"
      ? restaurantsResult.value.data || []
      : [];

  const shops =
    shopsResult.status === "fulfilled"
      ? shopsResult.value.data || []
      : [];

  const holisticCenters =
    holisticCentersResult.status === "fulfilled"
      ? holisticCentersResult.value.data || []
      : [];

  // ─── Procesar productos digitales ───

  let digitalProducts: any[] = [];

  if (productsResult.status === "fulfilled") {
    const productsData = productsResult.value.data;
    const productError = productsResult.value.error;

    if (!productError && productsData && productsData.length > 0) {
      const validProducts = productsData.filter((product: any) => {
        const professional = product.professional_applications;
        if (Array.isArray(professional)) {
          const prof = professional[0];
          return (
            prof && prof.status === "approved" && prof.is_active !== false
          );
        } else if (professional) {
          return (
            professional.status === "approved" &&
            professional.is_active !== false
          );
        }
        return false;
      });

      digitalProducts = validProducts.map((product: any) => ({
        ...product,
        professional_applications:
          Array.isArray(product.professional_applications) &&
          product.professional_applications.length > 0
            ? product.professional_applications[0]
            : product.professional_applications || undefined,
      }));
    }
  }

  // ─── Renderizar ───

  return (
    <ExploreClient
      userId={user.id}
      professionals={professionals}
      events={events}
      challenges={challenges}
      restaurants={restaurants}
      shops={shops}
      digitalProducts={digitalProducts}
      holisticCenters={holisticCenters}
    />
  );
}
