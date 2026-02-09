import { createClient } from "@/utils/supabase/server";
import { ProfessionalProfileClient } from "./professional-profile-client";

interface ProfessionalService {
  id: string;
  professional_id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: string;
  modality: string;
  duration: number;
  isactive: boolean;
  created_at: string;
  updated_at: string;
  cost: number | null;
  pricing_type?: "fixed" | "quote";
  program_duration: Record<string, unknown> | null;
  image_url?: string | null;
}

export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Auth check (optional - page works for unauthenticated users)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch professional by slug first, then by ID (backward compatibility)
  let professionalData: any = null;

  const { data: bySlug } = await supabase
    .from("professional_applications")
    .select(
      "*, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled"
    )
    .eq("slug", slug)
    .eq("status", "approved")
    .eq("is_active", true)
    .eq("registration_fee_paid", true)
    .gt("registration_fee_expires_at", new Date().toISOString())
    .maybeSingle();

  if (bySlug) {
    professionalData = bySlug;
  } else {
    const { data: byId, error } = await supabase
      .from("professional_applications")
      .select(
        "*, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled"
      )
      .eq("id", slug)
      .eq("status", "approved")
      .eq("is_active", true)
      .eq("registration_fee_paid", true)
      .gt("registration_fee_expires_at", new Date().toISOString())
      .maybeSingle();

    if (error && error.code !== "PGRST116" && error.code !== "22P02") {
      console.error("Error fetching professional:", error);
    }

    if (byId) professionalData = byId;
  }

  // Professional not found
  if (!professionalData) {
    return (
      <ProfessionalProfileClient
        professional={null}
        currentUser={null}
        initialIsFavorite={false}
        digitalProducts={[]}
        challenges={[]}
        reviewStats={null}
        userReview={null}
        isAuthenticated={!!user}
        slug={slug}
      />
    );
  }

  // All parallel queries
  const [
    servicesResult,
    userProfileResult,
    favoriteResult,
    digitalProductsResult,
    challengesResult,
    reviewStatsResult,
    userReviewResult,
  ] = await Promise.all([
    // Services via RPC
    supabase.rpc("get_professional_services", {
      p_professional_id: professionalData.id,
    }),
    // User profile (if authenticated)
    user
      ? supabase
          .from("profiles")
          .select("first_name, last_name, email, phone")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    // Favorite check (if authenticated)
    user
      ? supabase
          .from("user_favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("professional_id", professionalData.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    // Digital products (if verified)
    professionalData.is_verified
      ? supabase
          .from("digital_products_with_professional")
          .select("*")
          .eq("professional_id", professionalData.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    // Challenges
    supabase
      .from("challenges")
      .select("*")
      .eq("professional_id", professionalData.id)
      .eq("is_active", true)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
    // Review stats
    supabase
      .from("professional_review_stats")
      .select("*")
      .eq("professional_id", professionalData.user_id),
    // User review (if authenticated)
    user
      ? supabase
          .from("reviews")
          .select("*")
          .eq("professional_id", professionalData.user_id)
          .eq("patient_id", user.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // --- Process services ---
  const servicesData = (servicesResult.data || []) as ProfessionalService[];
  const legacyServices = professionalData.services || [];

  const servicesMap = new Map<
    string,
    {
      id: string;
      name: string;
      description: string;
      presencialCost: string;
      onlineCost: string;
      pricing_type?: "fixed" | "quote";
      image_url?: string;
    }
  >();

  // Process services from professional_services table
  servicesData.forEach((service) => {
    const existing = servicesMap.get(service.name);

    if (existing) {
      if (service.pricing_type === "fixed" && service.cost) {
        const costStr = service.cost.toString();
        if (service.modality === "presencial") {
          existing.presencialCost = costStr;
        } else if (service.modality === "online") {
          existing.onlineCost = costStr;
        } else if (service.modality === "both") {
          existing.presencialCost = costStr;
          existing.onlineCost = costStr;
        }
      }
      if (service.pricing_type === "quote") {
        existing.pricing_type = "quote";
        existing.presencialCost = "";
        existing.onlineCost = "";
      }
      if (service.image_url) {
        existing.image_url = service.image_url;
      }
    } else {
      const serviceObj: {
        id: string;
        name: string;
        description: string;
        presencialCost: string;
        onlineCost: string;
        pricing_type?: "fixed" | "quote";
        image_url?: string;
      } = {
        id: service.id,
        name: service.name,
        description: service.description || "",
        presencialCost: "",
        onlineCost: "",
        pricing_type: service.pricing_type || "fixed",
        image_url: service.image_url || undefined,
      };

      if (service.pricing_type === "fixed" && service.cost) {
        const costStr = service.cost.toString();
        if (service.modality === "presencial" || service.modality === "both") {
          serviceObj.presencialCost = costStr;
        }
        if (service.modality === "online" || service.modality === "both") {
          serviceObj.onlineCost = costStr;
        }
      }

      servicesMap.set(service.name, serviceObj);
    }
  });

  // Process legacy services from JSONB field
  (legacyServices || []).forEach(
    (service: {
      name: string;
      description?: string;
      presencialCost?: number;
      onlineCost?: number;
    }) => {
      if (
        service.name &&
        service.name.trim() !== "" &&
        (service.presencialCost || service.onlineCost)
      ) {
        const existing = servicesMap.get(service.name);

        if (existing) {
          if (service.presencialCost) {
            existing.presencialCost = service.presencialCost.toString();
          }
          if (service.onlineCost) {
            existing.onlineCost = service.onlineCost.toString();
          }
        } else {
          servicesMap.set(service.name, {
            id: `legacy-${service.name}`,
            name: service.name,
            description: service.description || "",
            presencialCost: service.presencialCost
              ? service.presencialCost.toString()
              : "",
            onlineCost: service.onlineCost
              ? service.onlineCost.toString()
              : "",
            pricing_type: "fixed",
            image_url: undefined,
          });
        }
      }
    }
  );

  const convertedServices = Array.from(servicesMap.values());

  const validServices = convertedServices.filter(
    (service) =>
      service.pricing_type === "quote" ||
      (service.presencialCost &&
        service.presencialCost !== "" &&
        service.presencialCost !== "0" &&
        Number(service.presencialCost) > 0) ||
      (service.onlineCost &&
        service.onlineCost !== "" &&
        service.onlineCost !== "0" &&
        Number(service.onlineCost) > 0)
  );

  const hasStripeConfigured = !!(
    professionalData.stripe_account_id &&
    professionalData.stripe_charges_enabled &&
    professionalData.stripe_payouts_enabled
  );

  // Build processed professional object
  const professional = {
    id: professionalData.id,
    slug: professionalData.slug,
    user_id: professionalData.user_id,
    first_name: professionalData.first_name,
    last_name: professionalData.last_name,
    email: professionalData.email,
    phone: professionalData.phone,
    profession: professionalData.profession,
    specializations: professionalData.specializations || [],
    languages: professionalData.languages || [],
    experience: professionalData.experience || "",
    certifications: professionalData.certifications || [],
    services: validServices,
    address: professionalData.address || "",
    city: professionalData.city || "",
    state: professionalData.state || "",
    country: professionalData.country || "",
    biography: professionalData.biography,
    profile_photo: professionalData.profile_photo,
    gallery: professionalData.gallery || [],
    status: professionalData.status,
    created_at: professionalData.created_at,
    updated_at: professionalData.updated_at,
    is_verified: professionalData.is_verified,
    working_start_time: professionalData.working_start_time,
    working_end_time: professionalData.working_end_time,
    working_days: professionalData.working_days,
    stripe_account_id: professionalData.stripe_account_id,
    stripe_charges_enabled: professionalData.stripe_charges_enabled,
    stripe_payouts_enabled: professionalData.stripe_payouts_enabled,
    hasStripeConfigured,
  };

  // Build current user
  let currentUser = null;
  if (user) {
    const profile = userProfileResult.data;
    const fullName =
      profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : profile?.email?.split("@")[0] ||
          user.email?.split("@")[0] ||
          "Usuario";
    currentUser = {
      id: user.id,
      name: fullName,
      email: profile?.email || user.email || "",
      phone: profile?.phone || "",
    };
  }

  // Process review stats
  const reviewStatsData = reviewStatsResult.data;
  const reviewStats =
    reviewStatsData && reviewStatsData.length > 0 ? reviewStatsData[0] : null;

  // User review
  const userReviewData = userReviewResult.data;
  const userReview =
    userReviewData && userReviewData.length > 0 ? userReviewData[0] : null;

  return (
    <ProfessionalProfileClient
      professional={professional}
      currentUser={currentUser}
      initialIsFavorite={!!favoriteResult.data}
      digitalProducts={digitalProductsResult.data || []}
      challenges={challengesResult.data || []}
      reviewStats={reviewStats}
      userReview={userReview}
      isAuthenticated={!!user}
      slug={slug}
    />
  );
}
