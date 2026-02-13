"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MenuForm } from "@/components/restaurants/menu-form";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function NewRestaurantMenuPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const adminId = useUserId();
  const restaurantId = params.restaurantId as string;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/restaurants`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Platillo</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <MenuForm
            restaurantId={restaurantId}
            menu={null}
            redirectPath={`/admin/restaurants`}
          />
        </div>
      </div>
    </div>
  );
}
