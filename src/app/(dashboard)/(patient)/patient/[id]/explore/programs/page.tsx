"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShoppingBag, Clock, FileText, Sparkles, BookOpen, Headphones, Video, FileCheck, Tag, Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DigitalProductCard } from "@/components/ui/digital-product-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DigitalProduct {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  file_url?: string;
  duration_minutes?: number;
  pages_count?: number;
  is_active: boolean;
  sales_count: number;
  created_at: string;
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    is_verified?: boolean;
  };
}

const CATEGORY_OPTIONS = [
  { value: "all", label: "Todas las categorías" },
  { value: "meditation", label: "Meditación" },
  { value: "ebook", label: "eBook" },
  { value: "manual", label: "Manual" },
  { value: "guide", label: "Guía" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "other", label: "Otro" },
];

const PRICE_OPTIONS = [
  { value: "all", label: "Todos los precios" },
  { value: "free", label: "Gratis" },
  { value: "paid", label: "De pago" },
];

export default function ProgramsPage() {
  const params = useParams();
  const userId = params.id as string;
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);

        const { data: productsData, error: productsError } = await supabase
          .from("digital_products")
          .select(`
            *,
            professional_applications!digital_products_professional_id_fkey(
              first_name,
              last_name,
              profile_photo,
              is_verified
            )
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (productsError) {
          console.error("Error fetching products:", productsError);
        } else {
          const transformedProducts = (productsData || []).map((product: any) => ({
            ...product,
            professional_applications: Array.isArray(product.professional_applications) && product.professional_applications.length > 0
              ? product.professional_applications[0]
              : undefined,
            professional_first_name: product.professional_applications?.[0]?.first_name,
            professional_last_name: product.professional_applications?.[0]?.last_name,
            professional_photo: product.professional_applications?.[0]?.profile_photo,
            professional_is_verified: product.professional_applications?.[0]?.is_verified,
          }));
          setProducts(transformedProducts);
          setFilteredProducts(transformedProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, [supabase]);

  useEffect(() => {
    let filtered = [...products];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.professional_applications?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.professional_applications?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    // Filtrar por precio
    if (priceFilter === "free") {
      filtered = filtered.filter((product) => product.price === 0);
    } else if (priceFilter === "paid") {
      filtered = filtered.filter((product) => product.price > 0);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, priceFilter, products]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Programas Digitales
          </h1>
          <p className="text-muted-foreground">
            Descubre meditaciones, ebooks, guías y más recursos para tu bienestar
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8">
          {/* Sidebar with filters */}
          <aside className="lg:col-span-1 mb-6 lg:mb-0">
            {/* Filtros */}
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Buscar por título, descripción o profesional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Precio" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Lista de productos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cargando programas...
              </p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay programas disponibles
            </h3>
            <p className="text-muted-foreground">
              {products.length === 0
                ? "Próximamente habrá programas digitales disponibles."
                : "No se encontraron programas que coincidan con los filtros aplicados."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <DigitalProductCard
                key={product.id}
                product={{
                  id: product.id,
                  title: product.title,
                  description: product.description,
                  category: product.category,
                  price: product.price,
                  currency: product.currency,
                  cover_image_url: product.cover_image_url,
                  duration_minutes: product.duration_minutes,
                  pages_count: product.pages_count,
                  sales_count: product.sales_count,
                  professional_first_name: product.professional_applications?.first_name,
                  professional_last_name: product.professional_applications?.last_name,
                  professional_photo: product.professional_applications?.profile_photo,
                  professional_is_verified: product.professional_applications?.is_verified,
                }}
                showProfessional={true}
              />
            ))}
          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
