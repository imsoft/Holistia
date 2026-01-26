import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationsPage } from "@/components/notifications/notifications-page";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default async function NotificationsRoutePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <NotificationsPage />;
}

