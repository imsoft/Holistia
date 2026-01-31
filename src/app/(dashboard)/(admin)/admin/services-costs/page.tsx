"use client";

import { useState, useEffect } from "react";
import {
  Wrench,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  ExternalLink,
  Server,
  Database,
  CreditCard,
  Mail,
  Map,
  BarChart3,
  Cloud,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface PlatformTool {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string | null;
  purpose: string;
  currency: "mxn" | "usd";
  monthly_cost: number;
  annual_cost: number;
  monthly_cost_usd: number | null;
  annual_cost_usd: number | null;
  billing_period: "monthly" | "annual" | "usage" | "free";
  status: "active" | "inactive" | "trial" | "cancelled";
  url: string | null;
  account_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  provider: string;
  category: string;
  purpose: string;
  currency: "mxn" | "usd";
  monthly_cost: string;
  annual_cost: string;
  monthly_cost_usd: string;
  annual_cost_usd: string;
  billing_period: "monthly" | "annual" | "usage" | "free";
  status: "active" | "inactive" | "trial" | "cancelled";
  url: string;
  account_email: string;
  notes: string;
}

const CATEGORIES = [
  { value: "hosting", label: "Hosting", icon: Server },
  { value: "database", label: "Base de Datos", icon: Database },
  { value: "payment", label: "Pagos", icon: CreditCard },
  { value: "email", label: "Email", icon: Mail },
  { value: "storage", label: "Almacenamiento", icon: Cloud },
  { value: "maps", label: "Mapas", icon: Map },
  { value: "analytics", label: "Analíticas", icon: BarChart3 },
  { value: "other", label: "Otro", icon: Wrench },
];

const PROVIDERS = [
  "Vercel",
  "Supabase",
  "Stripe",
  "Resend",
  "Mapbox",
  "Google",
  "AWS",
  "Cloudflare",
  "SendGrid",
  "Mailgun",
  "Twilio",
  "Otro",
];

const BILLING_PERIODS = [
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
  { value: "usage", label: "Por Uso" },
  { value: "free", label: "Gratuito" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Activo", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactivo", icon: XCircle, color: "bg-gray-100 text-gray-800" },
  { value: "trial", label: "Prueba", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "cancelled", label: "Cancelado", icon: AlertCircle, color: "bg-red-100 text-red-800" },
];

export default function AdminPlatformTools() {
  const [tools, setTools] = useState<PlatformTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<PlatformTool | null>(null);
  const [viewingTool, setViewingTool] = useState<PlatformTool | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    provider: "",
    category: "",
    purpose: "",
    currency: "mxn",
    monthly_cost: "0",
    annual_cost: "0",
    monthly_cost_usd: "0",
    annual_cost_usd: "0",
    billing_period: "monthly",
    status: "active",
    url: "",
    account_email: "",
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("platform_tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast.error("Error al cargar las herramientas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (tool?: PlatformTool) => {
    if (tool) {
      setEditingTool(tool);
      setFormData({
        name: tool.name,
        provider: tool.provider,
        category: tool.category,
        purpose: tool.purpose,
        currency: tool.currency || "mxn",
        monthly_cost: tool.monthly_cost.toString(),
        annual_cost: tool.annual_cost.toString(),
        monthly_cost_usd: (tool.monthly_cost_usd || 0).toString(),
        annual_cost_usd: (tool.annual_cost_usd || 0).toString(),
        billing_period: tool.billing_period,
        status: tool.status,
        url: tool.url || "",
        account_email: tool.account_email || "",
        notes: tool.notes || "",
      });
    } else {
      setEditingTool(null);
      setFormData({
        name: "",
        provider: "",
        category: "",
        purpose: "",
        currency: "mxn",
        monthly_cost: "0",
        annual_cost: "0",
        monthly_cost_usd: "0",
        annual_cost_usd: "0",
        billing_period: "monthly",
        status: "active",
        url: "",
        account_email: "",
        notes: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.provider || !formData.category || !formData.purpose) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setSaving(true);

      const toolData = {
        name: formData.name.trim(),
        provider: formData.provider.trim(),
        category: formData.category,
        purpose: formData.purpose.trim(),
        currency: formData.currency,
        monthly_cost: parseFloat(formData.monthly_cost) || 0,
        annual_cost: parseFloat(formData.annual_cost) || 0,
        monthly_cost_usd: parseFloat(formData.monthly_cost_usd) || 0,
        annual_cost_usd: parseFloat(formData.annual_cost_usd) || 0,
        billing_period: formData.billing_period,
        status: formData.status,
        url: formData.url.trim() || null,
        account_email: formData.account_email.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingTool) {
        const { error } = await supabase
          .from("platform_tools")
          .update(toolData)
          .eq("id", editingTool.id);

        if (error) throw error;
        toast.success("Herramienta actualizada exitosamente");
      } else {
        const { error } = await supabase
          .from("platform_tools")
          .insert([toolData]);

        if (error) throw error;
        toast.success("Herramienta creada exitosamente");
      }

      setIsFormOpen(false);
      fetchTools();
    } catch (error: any) {
      console.error("Error saving tool:", error);
      toast.error(error.message || "Error al guardar la herramienta");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("platform_tools")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Herramienta eliminada exitosamente");
      setIsDeleteOpen(false);
      setDeletingId(null);
      fetchTools();
    } catch (error: any) {
      console.error("Error deleting tool:", error);
      toast.error(error.message || "Error al eliminar la herramienta");
    }
  };

  const handleView = (tool: PlatformTool) => {
    setViewingTool(tool);
    setIsViewOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat ? cat.icon : Wrench;
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    if (!statusOption) return null;
    const Icon = statusOption.icon;
    return (
      <Badge className={statusOption.color}>
        <Icon className="h-3 w-3 mr-1" />
        {statusOption.label}
      </Badge>
    );
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || tool.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || tool.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calcular totales (convertir USD a MXN para el cálculo, usando tipo de cambio aproximado de 17)
  const USD_TO_MXN_RATE = 17;
  const totalMonthly = filteredTools
    .filter((t) => t.status === "active")
    .reduce((sum, t) => {
      if (t.billing_period !== "monthly") return sum;
      if (t.currency === "usd") {
        const costMxn = (t.monthly_cost_usd || 0) * USD_TO_MXN_RATE;
        return sum + costMxn;
      }
      return sum + t.monthly_cost;
    }, 0);

  const totalAnnual = filteredTools
    .filter((t) => t.status === "active")
    .reduce((sum, t) => {
      if (t.billing_period === "annual") {
        if (t.currency === "usd") {
          return sum + (t.annual_cost_usd || 0) * USD_TO_MXN_RATE;
        }
        return sum + t.annual_cost;
      }
      if (t.billing_period === "monthly") {
        if (t.currency === "usd") {
          return sum + (t.monthly_cost_usd || 0) * 12 * USD_TO_MXN_RATE;
        }
        return sum + t.monthly_cost * 12;
      }
      return sum;
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-4 w-full max-w-4xl mx-auto">
            <div className="h-8 bg-muted rounded w-40" />
            <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Servicios y Costos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona los servicios contratados y sus costos (servidores, bases de datos, mapas, etc.)
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenForm()} size="sm" className="sm:size-default w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span>Agregar Herramienta</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Resumen de Costos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mensual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalMonthly.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Solo servicios activos</p>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalAnnual.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Proyección anual</p>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Herramientas</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tools.length}</div>
              <p className="text-xs text-muted-foreground">
                {tools.filter((t) => t.status === "active").length} activas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar herramienta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Herramientas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const CategoryIcon = getCategoryIcon(tool.category);
            const currency = tool.currency || "mxn";
            const effectiveCost =
              tool.billing_period === "annual"
                ? currency === "usd" ? (tool.annual_cost_usd || 0) / 12 : tool.annual_cost / 12
                : tool.billing_period === "free"
                  ? 0
                  : currency === "usd" ? (tool.monthly_cost_usd || 0) : tool.monthly_cost;
            const currencySymbol = currency === "usd" ? "USD" : "MXN";

            return (
              <Card key={tool.id} className="hover:shadow-md transition-shadow py-4 flex flex-col h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-1">{tool.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{tool.provider}</p>
                      </div>
                    </div>
                    {getStatusBadge(tool.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Para qué sirve:</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{tool.purpose}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-auto">
                    <div>
                      <p className="text-xs text-muted-foreground">Costo mensual</p>
                      <p className="text-sm font-bold">
                        {tool.billing_period === "free" ? (
                          "Gratis"
                        ) : tool.billing_period === "usage" ? (
                          "Por uso"
                        ) : (
                          `$${effectiveCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${currencySymbol}`
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(tool)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenForm(tool)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingId(tool.id);
                          setIsDeleteOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <Card className="py-4">
            <CardContent className="px-8 py-12 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron herramientas
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "No hay herramientas que coincidan con los filtros seleccionados."
                  : "Comienza agregando una herramienta de la plataforma."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para crear/editar */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTool ? "Editar Herramienta" : "Nueva Herramienta"}
            </DialogTitle>
            <DialogDescription>
              {editingTool
                ? "Modifica la información de la herramienta"
                : "Agrega una nueva herramienta o servicio de la plataforma"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 w-full">
                <Label htmlFor="name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Vercel Hosting"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 w-full">
                <Label htmlFor="provider">
                  Proveedor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger id="provider" className="w-full">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 w-full">
                <Label htmlFor="category">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">
                Para qué sirve <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Describe para qué se usa esta herramienta en Holistia..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 w-full">
                <Label htmlFor="billing_period" className="whitespace-nowrap">Período de Facturación</Label>
                <Select
                  value={formData.billing_period}
                  onValueChange={(value: any) => setFormData({ ...formData, billing_period: value })}
                >
                  <SelectTrigger id="billing_period" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value} className="whitespace-nowrap">
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value: any) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mxn">MXN (Pesos Mexicanos)</SelectItem>
                    <SelectItem value="usd">USD (Dólares)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.currency === "mxn" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label htmlFor="monthly_cost">Costo Mensual (MXN)</Label>
                  <Input
                    id="monthly_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_cost}
                    onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2 w-full">
                  <Label htmlFor="annual_cost">Costo Anual (MXN)</Label>
                  <Input
                    id="annual_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.annual_cost}
                    onChange={(e) => setFormData({ ...formData, annual_cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label htmlFor="monthly_cost_usd">Costo Mensual (USD)</Label>
                  <Input
                    id="monthly_cost_usd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_cost_usd}
                    onChange={(e) => setFormData({ ...formData, monthly_cost_usd: e.target.value })}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2 w-full">
                  <Label htmlFor="annual_cost_usd">Costo Anual (USD)</Label>
                  <Input
                    id="annual_cost_usd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.annual_cost_usd}
                    onChange={(e) => setFormData({ ...formData, annual_cost_usd: e.target.value })}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 w-full">
                <Label htmlFor="url">URL del Servicio</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full"
                />
              </div>
              <div className="space-y-2 w-full">
                <Label htmlFor="account_email">Email de la Cuenta</Label>
                <Input
                  id="account_email"
                  type="email"
                  value={formData.account_email}
                  onChange={(e) => setFormData({ ...formData, account_email: e.target.value })}
                  placeholder="cuenta@ejemplo.com"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre el servicio, límites, consideraciones, etc..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingTool ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Herramienta</DialogTitle>
            <DialogDescription>Información completa de la herramienta</DialogDescription>
          </DialogHeader>
          {viewingTool && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información General</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{viewingTool.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Proveedor</p>
                    <p className="font-medium">{viewingTool.provider}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const CategoryIcon = getCategoryIcon(viewingTool.category);
                        const category = CATEGORIES.find((c) => c.value === viewingTool.category);
                        return (
                          <>
                            <CategoryIcon className="h-4 w-4 text-primary" />
                            <p className="font-medium">{category?.label || viewingTool.category}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <div className="mt-1">{getStatusBadge(viewingTool.status)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Propósito</h3>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Para qué sirve</p>
                  <p className="text-sm">{viewingTool.purpose}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información de Costos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Período de Facturación</p>
                    <p className="font-medium whitespace-nowrap">
                      {BILLING_PERIODS.find((p) => p.value === viewingTool.billing_period)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moneda</p>
                    <p className="font-medium">
                      {(viewingTool.currency || "mxn").toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Costo Mensual</p>
                    <p className="font-medium">
                      {viewingTool.billing_period === "free" ? (
                        "Gratis"
                      ) : viewingTool.billing_period === "usage" ? (
                        "Por uso"
                      ) : viewingTool.currency === "usd" ? (
                        `$${(viewingTool.monthly_cost_usd || 0).toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })} USD`
                      ) : (
                        `$${viewingTool.monthly_cost.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })} MXN`
                      )}
                    </p>
                  </div>
                  {viewingTool.billing_period === "annual" && (
                    <div>
                      <p className="text-sm text-muted-foreground">Costo Anual</p>
                      <p className="font-medium">
                        {viewingTool.currency === "usd" ? (
                          `$${(viewingTool.annual_cost_usd || 0).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })} USD`
                        ) : (
                          `$${viewingTool.annual_cost.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })} MXN`
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {(viewingTool.url || viewingTool.account_email || viewingTool.notes) && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Información Adicional</h3>
                  <div className="space-y-3">
                    {viewingTool.url && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">URL</p>
                        <a
                          href={viewingTool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {viewingTool.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {viewingTool.account_email && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Email de la Cuenta</p>
                        <p className="text-sm">{viewingTool.account_email}</p>
                      </div>
                    )}
                    {viewingTool.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Notas</p>
                        <p className="text-sm whitespace-pre-wrap">{viewingTool.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                    <p className="text-sm">
                      {new Date(viewingTool.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Actualización</p>
                    <p className="text-sm">
                      {new Date(viewingTool.updated_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setIsViewOpen(false);
                handleOpenForm(viewingTool || undefined);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Eliminar Herramienta"
        description={`¿Estás seguro de que quieres eliminar "${tools.find((t) => t.id === deletingId)?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}

