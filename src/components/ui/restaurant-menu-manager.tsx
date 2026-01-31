"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { PDFUploader } from "@/components/ui/pdf-uploader";
import { Plus, Edit, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RestaurantMenu {
  id: string;
  restaurant_id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  images: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RestaurantMenuManagerProps {
  restaurantId: string;
  restaurantName: string;
  menuPdfUrl?: string | null;
  onPdfUpdated?: (pdfUrl: string | null) => void;
}

export function RestaurantMenuManager({
  restaurantId,
  restaurantName,
  menuPdfUrl,
  onPdfUpdated
}: RestaurantMenuManagerProps) {
  const router = useRouter();
  const params = useParams();
  const adminId = params.id as string;

  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingMenu, setDeletingMenu] = useState<RestaurantMenu | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (restaurantId) {
      fetchMenus();
    }
  }, [restaurantId]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("restaurant_menus")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Parsear imágenes desde JSONB
      const menusWithImages = (data || []).map((menu) => ({
        ...menu,
        images: Array.isArray(menu.images) ? menu.images : [],
      }));

      setMenus(menusWithImages);
    } catch (error) {
      console.error("Error fetching menus:", error);
      toast.error("Error al cargar los menús");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMenu) return;

    try {
      // Eliminar imágenes del storage primero
      if (deletingMenu.images && deletingMenu.images.length > 0) {
        const filePaths = deletingMenu.images
          .map((url) => {
            const urlParts = url.split('/restaurants/');
            return urlParts.length >= 2 ? urlParts[1] : null;
          })
          .filter((path): path is string => path !== null);

        if (filePaths.length > 0) {
          await supabase.storage
            .from('restaurants')
            .remove(filePaths);
        }
      }

      // Eliminar el menú (esto también eliminará las imágenes por CASCADE si está configurado)
      const { error } = await supabase
        .from("restaurant_menus")
        .delete()
        .eq("id", deletingMenu.id);

      if (error) throw error;
      toast.success("Menú eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingMenu(null);
      fetchMenus();
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast.error("Error al eliminar el menú");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-8 bg-muted rounded w-40 mx-auto" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardTitle className="flex items-center gap-2 mb-4">
        <UtensilsCrossed className="h-5 w-5" />
        Menú del Restaurante
      </CardTitle>

      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pdf">Menú en PDF</TabsTrigger>
          <TabsTrigger value="individual">Platillos Individuales</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <PDFUploader
                entityType="restaurant"
                entityId={restaurantId}
                entityName={restaurantName}
                currentPdfUrl={menuPdfUrl}
                onPdfUpdated={(url) => onPdfUpdated?.(url)}
                label="Menú Completo en PDF"
                description="Sube tu menú completo en formato PDF (máximo 10MB). Esta es la forma más rápida de mostrar tu menú."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Agrega platillos individuales con imágenes y descripciones
            </p>
            <Button
              type="button"
              onClick={() => router.push(`/admin/${adminId}/restaurants/${restaurantId}/menus/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Platillo
            </Button>
          </div>

      {/* Lista de menús */}
      {menus.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              No hay menús registrados. Agrega el primero.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {menus.map((menu) => (
            <Card key={menu.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Imágenes */}
                  {menu.images && menu.images.length > 0 && (
                    <div className="flex-shrink-0">
                      <div className="grid grid-cols-2 gap-2 w-32">
                        {menu.images.slice(0, 4).map((imageUrl, index) => (
                          <div key={index} className="relative aspect-square rounded overflow-hidden border">
                            <Image
                              src={imageUrl}
                              alt={`Imagen ${index + 1} de ${menu.title}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{menu.title}</h3>
                        {menu.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {menu.description}
                          </p>
                        )}
                        {menu.price && (
                          <p className="text-lg font-bold text-primary mt-2">
                            ${menu.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/${adminId}/restaurants/${restaurantId}/menus/${menu.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingMenu(menu);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Menú"
        description={`¿Estás seguro de que quieres eliminar "${deletingMenu?.title}"? Esta acción no se puede deshacer y también eliminará las imágenes asociadas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
