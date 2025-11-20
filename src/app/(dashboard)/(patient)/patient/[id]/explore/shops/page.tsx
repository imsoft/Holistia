"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Store, MapPin, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StableImage } from "@/components/ui/stable-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

const SHOP_CATEGORIES = [
  "Ropa",
  "Joyería",
  "Decoración",
  "Artesanías",
  "Libros",
  "Cosmética Natural",
  "Bienestar",
  "Productos Orgánicos",
  "Accesorios",
  "Arte",
  "Otros",
];

export default function ShopsPage() {
  const params = useParams();
  const userId = params.id as string;
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    const getShops = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching shops:", error);
        } else {
          setShops(data || []);
          setFilteredShops(data || []);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
      } finally {
        setLoading(false);
      }
    };

    getShops();
  }, [supabase]);

  useEffect(() => {
    let filtered = shops;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shop.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (shop) => shop.category === selectedCategory
      );
    }

    setFilteredShops(filtered);
  }, [searchTerm, selectedCategory, shops]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Comercios
          </h1>
          <p className="text-muted-foreground">
            Explora una variedad de productos y servicios locales
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8">
          {/* Sidebar con filtros */}
          <aside className="lg:col-span-1 mb-6 lg:mb-0">
            <div className="hidden lg:block">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground">Filtros</h2>
              </div>
              <form className="divide-y divide-border">
                {/* Búsqueda */}
                <div className="py-8 first:pt-0 last:pb-0">
                  <fieldset>
                    <legend className="block text-sm font-medium text-foreground mb-6">
                      Búsqueda
                    </legend>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Buscar comercios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </fieldset>
                </div>

                {/* Categoría */}
                <div className="py-8 first:pt-0 last:pb-0">
                  <fieldset>
                    <legend className="block text-sm font-medium text-foreground mb-6">
                      Categoría
                    </legend>
                    <div className="space-y-4">
                      {[
                        { value: "all", label: "Todas las categorías" },
                        ...SHOP_CATEGORIES.map((category) => ({ value: category, label: category }))
                      ].map((option, optionIdx) => (
                        <div key={option.value} className="flex gap-3">
                          <div className="flex h-5 shrink-0 items-center">
                            <div className="group grid size-4 grid-cols-1">
                              <input
                                checked={selectedCategory === option.value}
                                onChange={() => setSelectedCategory(option.value)}
                                id={`category-${optionIdx}`}
                                name="category"
                                type="radio"
                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-border bg-background checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:border-border disabled:bg-muted disabled:checked:bg-muted"
                              />
                              <svg
                                fill="none"
                                viewBox="0 0 14 14"
                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-primary-foreground group-has-disabled:stroke-muted-foreground"
                              >
                                <circle
                                  cx="7"
                                  cy="7"
                                  r="3"
                                  className="opacity-0 group-has-checked:opacity-100"
                                />
                              </svg>
                            </div>
                          </div>
                          <label htmlFor={`category-${optionIdx}`} className="text-sm text-muted-foreground cursor-pointer">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </form>
            </div>

            {/* Mobile filters */}
            <div className="lg:hidden mb-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar comercios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {SHOP_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {filteredShops.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No se encontraron comercios
            </h3>
            <p className="text-muted-foreground">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
              <Link
                key={shop.id}
                href={`/patient/${userId}/explore/shop/${shop.id}`}
              >
                <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                  <div className="relative w-full h-48">
                    {shop.image_url ? (
                      <StableImage
                        src={shop.image_url}
                        alt={shop.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Store className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{shop.name}</CardTitle>
                    {shop.category && (
                      <Badge variant="secondary" className="w-fit mt-2">
                        {shop.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 pb-6">
                    {shop.description && (
                      <div 
                        className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: shop.description }}
                      />
                    )}
                    {(shop.address || shop.city) && (
                      <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {shop.address && shop.city ? `${shop.address}, ${shop.city}` : shop.address || shop.city}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
