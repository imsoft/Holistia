import type { Metadata } from "next";

import { NotificationsPage } from "@/components/notifications/notifications-page";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default async function NotificationsRoutePage() {
  return <NotificationsPage />;
}

