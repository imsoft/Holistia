import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Appointment } from "@/types";
import { DashboardClient } from "./dashboard-client";

const PROFESSIONAL_SHARE = 0.85; // 85% para el profesional (15% para Holistia)

export default async function ProfessionalDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  // Fetch professional data
  const { data: professionalData } = await supabase
    .from("professional_applications")
    .select(
      "id, user_id, first_name, last_name, profile_photo, working_start_time, working_end_time, registration_fee_paid, registration_fee_amount, registration_fee_currency, registration_fee_paid_at, registration_fee_expires_at, is_verified, stripe_account_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled"
    )
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!professionalData) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
  const startOfMonthISO = startOfMonth.toISOString();
  const endOfMonthISO = endOfMonth.toISOString();

  // All parallel queries at once
  const [
    profileResult,
    appointmentsResult,
    allAppointmentsResult,
    profileViewsResult,
    bookingsResult,
    incomePaymentsResult,
    servicesResult,
    challengesResult,
    digitalResult,
    eventsResult,
  ] = await Promise.all([
    // Google Calendar status
    supabase
      .from("profiles")
      .select("google_calendar_connected")
      .eq("id", user.id)
      .single(),
    // Upcoming appointments (limit 10)
    supabase
      .from("appointments")
      .select(
        "id, appointment_date, appointment_time, duration_minutes, appointment_type, status, location, notes, patient_id"
      )
      .eq("professional_id", professionalData.id)
      .gte("appointment_date", today)
      .in("status", ["pending", "confirmed", "completed"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .limit(10),
    // All appointments for stats
    supabase
      .from("appointments")
      .select("id, appointment_date, cost, patient_id, status")
      .eq("professional_id", professionalData.id)
      .in("status", ["pending", "confirmed", "completed"]),
    // Monthly: profile views
    supabase
      .from("professional_profile_views")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalData.id)
      .gte("viewed_at", startOfMonthISO)
      .lte("viewed_at", endOfMonthISO),
    // Monthly: bookings
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalData.id)
      .gte("created_at", startOfMonthISO)
      .lte("created_at", endOfMonthISO),
    // Monthly: income payments
    supabase
      .from("payments")
      .select("transfer_amount, amount")
      .eq("professional_id", professionalData.id)
      .eq("status", "succeeded")
      .gte("created_at", startOfMonthISO)
      .lte("created_at", endOfMonthISO),
    // Service count
    supabase
      .from("professional_services")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalData.id),
    // Challenges count
    supabase
      .from("challenges")
      .select("id", { count: "exact", head: true })
      .eq("created_by_user_id", user.id)
      .eq("created_by_type", "professional"),
    // Digital products count
    supabase
      .from("digital_products")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalData.id),
    // Events count
    supabase
      .from("events_workshops")
      .select("id", { count: "exact", head: true })
      .or(
        `professional_id.eq.${professionalData.id},and(owner_id.eq.${user.id},owner_type.eq.professional)`
      ),
  ]);

  const googleCalendarConnected =
    profileResult.data?.google_calendar_connected || false;

  // --- Format appointments with patient info ---
  const appointmentsData = appointmentsResult.data || [];
  let formattedAppointments: Appointment[] = [];

  if (appointmentsData.length > 0) {
    const patientIds = [...new Set(appointmentsData.map((apt) => apt.patient_id))];

    const { data: patientsInfo } = await supabase
      .from("professional_patient_info")
      .select("patient_id, full_name, phone, email")
      .eq("professional_id", professionalData.id)
      .in("patient_id", patientIds);

    const patientsData = patientsInfo || [];

    formattedAppointments = appointmentsData.map((apt) => {
      const patient = patientsData.find((p) => p.patient_id === apt.patient_id);
      return {
        id: apt.id,
        patient: {
          name: patient?.full_name || "Paciente",
          email: patient?.email || "No disponible",
          phone: patient?.phone || "No disponible",
        },
        date: apt.appointment_date,
        time: apt.appointment_time.substring(0, 5),
        duration: apt.duration_minutes,
        type:
          apt.appointment_type === "presencial" ? "Presencial" : "Online",
        status: apt.status as
          | "confirmed"
          | "pending"
          | "cancelled"
          | "completed",
        location:
          apt.location || (apt.appointment_type === "online" ? "Online" : ""),
        notes: apt.notes || undefined,
      };
    });
  }

  // --- Calculate stats ---
  const allAppointments = allAppointmentsResult.data || [];

  // Batch fetch payments
  let allPaymentsData: { appointment_id: string; status: string; amount: number }[] = [];
  if (allAppointments.length > 0) {
    const allAppointmentIds = allAppointments.map((apt) => apt.id);
    const { data: allPayments } = await supabase
      .from("payments")
      .select("appointment_id, status, amount")
      .in("appointment_id", allAppointmentIds);
    allPaymentsData = allPayments || [];
  }

  const paidAppointments = allAppointments;

  // Upcoming count
  const upcomingCount = paidAppointments.filter(
    (apt) => apt.appointment_date >= today
  ).length;

  const lastWeekUpcomingCount = paidAppointments.filter(
    (apt) =>
      apt.appointment_date >= weekAgoStr && apt.appointment_date < today
  ).length;
  const upcomingChange = upcomingCount - lastWeekUpcomingCount;

  // Active patients
  const uniquePatients = new Set(
    paidAppointments
      .filter((apt) => apt.appointment_date >= today)
      .map((apt) => apt.patient_id)
  );
  const activePatients = uniquePatients.size;

  const lastWeekPatients = new Set(
    paidAppointments
      .filter(
        (apt) =>
          apt.appointment_date >= weekAgoStr && apt.appointment_date < today
      )
      .map((apt) => apt.patient_id)
  );
  const weeklyChange = activePatients - lastWeekPatients.size;

  // Revenue
  const allSucceededPayments = allPaymentsData.filter(
    (p) => p.status === "succeeded"
  );

  const totalRevenue = allSucceededPayments.reduce((sum, payment) => {
    const amount = Number(payment.amount || 0);
    return sum + amount * PROFESSIONAL_SHARE;
  }, 0);

  // --- Monthly metrics ---
  const profileViewsCount = profileViewsResult.count ?? 0;
  const bookingsCount = bookingsResult.count ?? 0;

  const incomePayments = incomePaymentsResult.data || [];
  const incomeThisMonth = incomePayments.reduce(
    (
      sum: number,
      p: { transfer_amount?: number | null; amount?: number | null }
    ) => {
      const transfer = Number(p.transfer_amount);
      if (transfer > 0) return sum + transfer;
      return sum + Number(p.amount || 0) * PROFESSIONAL_SHARE;
    },
    0
  );

  return (
    <DashboardClient
      professionalData={{
        id: professionalData.id,
        user_id: professionalData.user_id,
        first_name: professionalData.first_name,
        last_name: professionalData.last_name,
        is_verified: professionalData.is_verified || false,
        registration_fee_paid: professionalData.registration_fee_paid || false,
        registration_fee_amount: professionalData.registration_fee_amount || 888,
        registration_fee_currency:
          professionalData.registration_fee_currency || "mxn",
        registration_fee_paid_at: professionalData.registration_fee_paid_at,
        registration_fee_expires_at:
          professionalData.registration_fee_expires_at,
        stripe_account_id: professionalData.stripe_account_id,
        stripe_charges_enabled:
          professionalData.stripe_charges_enabled || false,
        stripe_payouts_enabled:
          professionalData.stripe_payouts_enabled || false,
      }}
      googleCalendarConnected={googleCalendarConnected}
      appointments={formattedAppointments}
      statsData={{
        upcomingCount,
        upcomingChange,
        activePatients,
        weeklyChange,
        totalRevenue,
        servicesCount: servicesResult.count ?? 0,
        challengesCount: challengesResult.count ?? 0,
        digitalProductsCount: digitalResult.count ?? 0,
        eventsCount: eventsResult.count ?? 0,
      }}
      monthlyMetrics={{
        profileViews: profileViewsCount,
        bookings: bookingsCount,
        income: incomeThisMonth,
      }}
    />
  );
}
