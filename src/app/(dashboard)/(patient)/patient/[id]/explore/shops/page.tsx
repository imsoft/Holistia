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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3 mb-2">
            <Store className="h-10 w-10 text-primary" />
            Comercios
          </h1>
          <p className="text-muted-foreground">
            Explora una variedad de productos y servicios locales
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
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

            {/* Filtro por categoría */}
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

          {/* Resultados */}
          <div className="text-sm text-muted-foreground">
            {filteredShops.length} {filteredShops.length === 1 ? "comercio encontrado" : "comercios encontrados"}
          </div>
        </div>

        {/* Lista de comercios */}
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
                  <CardContent className="flex-1">
                    {shop.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {shop.description}
                      </p>
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
      </main>
    </div>
  );
}
