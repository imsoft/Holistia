"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUserId, useProfessionalData } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import {
  FileText,
  MessageSquare,
  Calendar,
  User,
  Search,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
import { createClient } from "@/utils/supabase/client";

interface QuotePayment {
  id: string;
  description: string;
  amount: number;
  paid_at: string | null;
  created_at: string;
  metadata: {
    service_id?: string;
    service_name?: string;
    conversation_id?: string;
  } | null;
  patient_id: string;
  patient?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export default function ProfessionalCotizacionesPage() {
  useUserStoreInit();
  const userId = useUserId();
  const professionalData = useProfessionalData();
  const supabase = useMemo(() => createClient(), []);

  const [payments, setPayments] = useState<QuotePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionalAppId, setProfessionalAppId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"all" | "month" | "quarter">("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "amount_high" | "amount_low">("recent");

  useEffect(() => {
    if (!userId) return;

    const fetchQuotePayments = async () => {
      try {
        setLoading(true);
        let professionalId = professionalData?.professional_id;

        if (!professionalId) {
          const { data: app } = await supabase
            .from("professional_applications")
            .select("id")
            .eq("user_id", userId)
            .eq("status", "approved")
            .maybeSingle();
          professionalId = app?.id ?? null;
        }

        if (!professionalId) {
          setPayments([]);
          return;
        }

        setProfessionalAppId(professionalId);

        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("id, description, amount, paid_at, created_at, metadata, patient_id")
          .eq("professional_id", professionalId)
          .eq("payment_type", "quote_service")
          .eq("status", "succeeded")
          .order("paid_at", { ascending: false });

        if (paymentsError) {
          console.error("Error fetching quote payments:", paymentsError);
          setPayments([]);
          return;
        }

        const list = paymentsData ?? [];
        if (list.length === 0) {
          setPayments([]);
          return;
        }

        const patientIds = [...new Set(list.map((p) => p.patient_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", patientIds);

        const paymentsWithPatient: QuotePayment[] = list.map((p) => {
          const profile = profiles?.find((pr) => pr.id === p.patient_id);
          return {
            ...p,
            metadata: (p.metadata as QuotePayment["metadata"]) ?? null,
            patient: profile
              ? {
                  first_name: profile.first_name ?? "",
                  last_name: profile.last_name ?? "",
                  avatar_url: profile.avatar_url ?? null,
                }
              : undefined,
          };
        });

        setPayments(paymentsWithPatient);
      } catch (err) {
        console.error("Error loading cotizaciones:", err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotePayments();
  }, [userId, professionalData?.professional_id, supabase]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  const stats = useMemo(() => {
    const total = payments.length;
    const thisMonth = payments.filter((p) => {
      const d = p.paid_at || p.created_at;
      return d ? new Date(d) >= startOfMonth : false;
    }).length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const uniquePatients = new Set(payments.map((p) => p.patient_id)).size;
    const thisMonthAmount = payments
      .filter((p) => {
        const d = p.paid_at || p.created_at;
        return d ? new Date(d) >= startOfMonth : false;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      total,
      thisMonth,
      totalAmount,
      uniquePatients,
      thisMonthAmount,
    };
  }, [payments, startOfMonth]);

  const filteredPayments = useMemo(() => {
    let list = [...payments];
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((p) => {
        const patientName = p.patient
          ? `${p.patient.first_name} ${p.patient.last_name}`.toLowerCase()
          : "";
        const desc = (p.description || p.metadata?.service_name || "").toLowerCase();
        return patientName.includes(term) || desc.includes(term);
      });
    }
    if (periodFilter === "month") {
      list = list.filter((p) => {
        const d = p.paid_at || p.created_at;
        return d ? new Date(d) >= startOfMonth : false;
      });
    } else if (periodFilter === "quarter") {
      list = list.filter((p) => {
        const d = p.paid_at || p.created_at;
        return d ? new Date(d) >= startOfQuarter : false;
      });
    }
    if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.paid_at || b.created_at).getTime() - new Date(a.paid_at || a.created_at).getTime());
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.paid_at || a.created_at).getTime() - new Date(b.paid_at || b.created_at).getTime());
    } else if (sortBy === "amount_high") {
      list.sort((a, b) => Number(b.amount) - Number(a.amount));
    } else {
      list.sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    return list;
  }, [payments, searchTerm, periodFilter, sortBy, startOfMonth, startOfQuarter]);

  return (
    <div className="professional-page-shell">
      <div className="professional-page-header w-full">
        <div className="professional-page-header-inner professional-page-header-inner-row w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                Cotizaciones pagadas
              </h1>
              <p className="text-sm text-muted-foreground">
                Servicios cotizados que ya te pagaron desde el chat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="professional-page-content w-full">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-10 w-full max-w-2xl" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <AdminStatCard
                title="Total cotizaciones"
                value={String(stats.total)}
                trend={stats.total > 0 ? { value: `${stats.total} pagos`, positive: true } : undefined}
                secondaryText={stats.total > 0 ? "Pagos recibidos" : "Sin pagos aún"}
                tertiaryText="Cotizaciones pagadas"
              />
              <AdminStatCard
                title="Este mes"
                value={String(stats.thisMonth)}
                trend={
                  stats.total > 0 && stats.thisMonth > 0
                    ? { value: `${stats.thisMonth} este mes`, positive: true }
                    : undefined
                }
                secondaryText={stats.thisMonth > 0 ? `$${stats.thisMonthAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN` : "Sin pagos este mes"}
                tertiaryText="Pagos del mes actual"
              />
              <AdminStatCard
                title="Monto total"
                value={`$${stats.totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                secondaryText="Ingresos por cotizaciones"
                tertiaryText="Suma de todos los pagos"
              />
              <AdminStatCard
                title="Pacientes"
                value={String(stats.uniquePatients)}
                trend={
                  stats.uniquePatients > 0
                    ? { value: `${stats.uniquePatients} únicos`, positive: true }
                    : undefined
                }
                secondaryText={stats.uniquePatients > 0 ? "Pacientes que pagaron" : "Ninguno aún"}
                tertiaryText="Distintos pagadores"
              />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as "all" | "month" | "quarter")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los períodos</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "oldest" | "amount_high" | "amount_low")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más recientes</SelectItem>
                  <SelectItem value="oldest">Más antiguos</SelectItem>
                  <SelectItem value="amount_high">Mayor monto</SelectItem>
                  <SelectItem value="amount_low">Menor monto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sin cotizaciones pagadas aún
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    Cuando un paciente pague una cotización que enviaste desde Consultas o Mensajes,
                    aparecerá aquí.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/consultations">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ir a Consultas
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Servicios cotizados pagados</CardTitle>
                  <CardDescription>
                    {filteredPayments.length} de {payments.length} {payments.length === 1 ? "pago" : "pagos"}
                    {searchTerm || periodFilter !== "all" ? " (filtrados)" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">
                          {p.patient
                            ? `${p.patient.first_name} ${p.patient.last_name}`.trim() || "Paciente"
                            : "Paciente"}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Cotización
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {p.description || (p.metadata?.service_name ? `Cotización: ${p.metadata.service_name}` : "Servicio cotizado")}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(p.paid_at || p.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-lg font-semibold text-green-600">
                        ${Number(p.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                      {p.metadata?.conversation_id && (
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/messages?conversation=${p.metadata.conversation_id}`}
                            className="flex items-center gap-1"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
