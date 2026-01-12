"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MenuForm } from "@/components/restaurants/menu-form";

export default function NewRestaurantMenuPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;
  const restaurantId = params.restaurantId as string;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/${adminId}/restaurants`)}
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
            redirectPath={`/admin/${adminId}/restaurants`}
          />
        </div>
      </div>
    </div>
  );
}
