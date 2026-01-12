"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MenuForm } from "@/components/restaurants/menu-form";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface RestaurantMenu {
  id: string;
  restaurant_id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  images: string[];
  display_order: number;
  is_active: boolean;
}

export default function EditRestaurantMenuPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;
  const restaurantId = params.restaurantId as string;
  const menuId = params.menuId as string;

  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("restaurant_menus")
          .select("*")
          .eq("id", menuId)
          .single();

        if (error) throw error;

        // Parsear imágenes desde JSONB
        const menuWithImages = {
          ...data,
          images: Array.isArray(data.images) ? data.images : [],
        };

        setMenu(menuWithImages);
      } catch (error) {
        console.error("Error fetching menu:", error);
        toast.error("Error al cargar el menú");
        router.push(`/admin/${adminId}/restaurants`);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [menuId, adminId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!menu) {
    return null;
  }

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
          <h1 className="text-2xl font-bold">Editar Platillo</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <MenuForm
            restaurantId={restaurantId}
            menu={menu}
            redirectPath={`/admin/${adminId}/restaurants`}
          />
        </div>
      </div>
    </div>
  );
}
