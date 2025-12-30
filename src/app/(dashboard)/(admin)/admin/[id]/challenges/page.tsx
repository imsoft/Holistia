"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye,
  Loader2,
  Target,
  Users,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Challenge {
  id: string;
  professional_id: string;
  professional_name?: string;
  professional_email?: string;
  title: string;
  description: string;
  short_description?: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  is_active: boolean;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'Todas las dificultades' },
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'expert', label: 'Experto' },
] as const;

export default function AdminChallengesPage() {
  const params = useParams();
  const adminId = params.id as string;
  const supabase = createClient();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, difficultyFilter, challenges]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Obtener todos los retos con información del profesional
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select(`
          *,
          professional_applications!inner(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedChallenges = (challengesData || []).map((challenge: any) => ({
        ...challenge,
        professional_name: challenge.professional_applications
          ? `${challenge.professional_applications.first_name} ${challenge.professional_applications.last_name}`
          : 'Desconocido',
        professional_email: challenge.professional_applications?.email,
      }));

      setChallenges(formattedChallenges);

      // Calcular estadísticas
      const totalSales = formattedChallenges.reduce((sum, c) => sum + c.sales_count, 0);
      const totalRevenue = formattedChallenges.reduce((sum, c) => sum + (c.price * c.sales_count), 0);

      setStats({
        totalChallenges: formattedChallenges.length,
        activeChallenges: formattedChallenges.filter((c) => c.is_active).length,
        totalSales,
        totalRevenue,
      });

    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Error al cargar retos");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...challenges];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.professional_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.professional_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) =>
        statusFilter === "active" ? c.is_active : !c.is_active
      );
    }

    // Filtrar por dificultad
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((c) => c.difficulty_level === difficultyFilter);
    }

    setFilteredChallenges(filtered);
  };

  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return 'Sin especificar';
    const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
    return option?.label || difficulty;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Todos los Retos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona y visualiza todos los retos de la plataforma
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Retos
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">{stats.totalChallenges}</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Retos Activos
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-green-600">{stats.activeChallenges}</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Ventas
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${stats.totalRevenue.toFixed(2)} MXN
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, profesional, email o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de retos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredChallenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {challenges.length === 0
                  ? "No hay retos en la plataforma"
                  : "No se encontraron retos con los filtros aplicados"}
              </p>
              {(searchTerm || statusFilter !== "all" || difficultyFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDifficultyFilter("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  {challenge.cover_image_url ? (
                    <Image
                      src={challenge.cover_image_url}
                      alt={challenge.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Target className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {!challenge.is_active && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                    {challenge.difficulty_level && (
                      <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                        {getDifficultyLabel(challenge.difficulty_level)}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      Por: <span className="font-medium text-foreground">{challenge.professional_name}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {challenge.category && (
                    <Badge variant="outline">{challenge.category}</Badge>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ${challenge.price.toFixed(2)} {challenge.currency}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {challenge.duration_days && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {challenge.duration_days} días
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      {challenge.sales_count} ventas
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/admin/${adminId}/challenges/${challenge.id}`}
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
