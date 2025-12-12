"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Briefcase,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Globe,
  Users,
  Building,
  FileText,
  UserCheck,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  company_size?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  website?: string;
  logo_url?: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profession: string;
  specializations?: string[];
  profile_photo?: string;
  phone?: string;
}

interface CompanyProfessional {
  id: string;
  company_id: string;
  professional_id: string;
  assigned_at: string;
  assigned_by?: string;
  professional?: Professional;
}

interface FormData {
  name: string;
  description: string;
  industry: string;
  company_size: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  website: string;
  logo_url: string;
  status: 'pending' | 'active' | 'inactive';
}

const INDUSTRIES = [
  "Tecnología",
  "Finanzas",
  "Salud",
  "Educación",
  "Manufactura",
  "Retail",
  "Servicios",
  "Construcción",
  "Alimentos y Bebidas",
  "Turismo",
  "Otro",
];

const COMPANY_SIZES = [
  "1-10 empleados",
  "11-50 empleados",
  "51-200 empleados",
  "201-500 empleados",
  "501-1000 empleados",
  "1000+ empleados",
];

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isManageProfessionalsOpen, setIsManageProfessionalsOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [managingCompany, setManagingCompany] = useState<Company | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    industry: "",
    company_size: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    website: "",
    logo_url: "",
    status: "pending",
  });

  // Estados para gestión de profesionales
  const [availableProfessionals, setAvailableProfessionals] = useState<Professional[]>([]);
  const [assignedProfessionals, setAssignedProfessionals] = useState<CompanyProfessional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Error al cargar las empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        description: company.description || "",
        industry: company.industry || "",
        company_size: company.company_size || "",
        contact_name: company.contact_name || "",
        contact_email: company.contact_email || "",
        contact_phone: company.contact_phone || "",
        address: company.address || "",
        city: company.city || "",
        website: company.website || "",
        logo_url: company.logo_url || "",
        status: company.status,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: "",
        description: "",
        industry: "",
        company_size: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        city: "",
        website: "",
        logo_url: "",
        status: "pending",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre de la empresa es requerido");
      return;
    }

    try {
      setSaving(true);

      if (editingCompany) {
        const { error } = await supabase
          .from("companies")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            industry: formData.industry || null,
            company_size: formData.company_size || null,
            contact_name: formData.contact_name.trim() || null,
            contact_email: formData.contact_email.trim() || null,
            contact_phone: formData.contact_phone.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            website: formData.website.trim() || null,
            logo_url: formData.logo_url.trim() || null,
            status: formData.status,
          })
          .eq("id", editingCompany.id);

        if (error) throw error;
        toast.success("Empresa actualizada exitosamente");
        setIsFormOpen(false);
        fetchCompanies();
      } else {
        const { error } = await supabase
          .from("companies")
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            industry: formData.industry || null,
            company_size: formData.company_size || null,
            contact_name: formData.contact_name.trim() || null,
            contact_email: formData.contact_email.trim() || null,
            contact_phone: formData.contact_phone.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            website: formData.website.trim() || null,
            logo_url: formData.logo_url.trim() || null,
            status: formData.status,
          });

        if (error) throw error;
        toast.success("Empresa creada exitosamente");
        setIsFormOpen(false);
        fetchCompanies();
      }
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Error al guardar la empresa");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Empresa eliminada exitosamente");
      setIsDeleteOpen(false);
      setDeletingId(null);
      fetchCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Error al eliminar la empresa");
    }
  };

  // Funciones para gestionar profesionales
  const handleOpenManageProfessionals = async (company: Company) => {
    setManagingCompany(company);
    setIsManageProfessionalsOpen(true);
    await fetchProfessionals(company.id);
  };

  const fetchProfessionals = async (companyId: string) => {
    try {
      setLoadingProfessionals(true);

      // Obtener profesionales aprobados
      const { data: allProfessionals, error: profError } = await supabase
        .from("professional_applications")
        .select("id, first_name, last_name, email, profession, specializations, profile_photo, phone")
        .eq("status", "approved")
        .eq("is_active", true)
        .order("first_name");

      if (profError) throw profError;

      // Obtener profesionales ya asignados a esta empresa
      const { data: assigned, error: assignedError } = await supabase
        .from("company_professionals")
        .select(`
          id,
          company_id,
          professional_id,
          assigned_at,
          assigned_by
        `)
        .eq("company_id", companyId);

      if (assignedError) throw assignedError;

      // Enriquecer los datos con la información del profesional
      const enrichedAssignments = await Promise.all(
        (assigned || []).map(async (assignment) => {
          const professional = allProfessionals?.find(p => p.id === assignment.professional_id);
          return {
            ...assignment,
            professional: professional || undefined,
          };
        })
      );

      setAvailableProfessionals(allProfessionals || []);
      setAssignedProfessionals(enrichedAssignments as CompanyProfessional[]);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Error al cargar los profesionales");
    } finally {
      setLoadingProfessionals(false);
    }
  };

  const handleAssignProfessional = async () => {
    if (!selectedProfessionalId || !managingCompany) return;

    try {
      const { error } = await supabase
        .from("company_professionals")
        .insert({
          company_id: managingCompany.id,
          professional_id: selectedProfessionalId,
        });

      if (error) throw error;

      toast.success("Profesional asignado exitosamente");
      setSelectedProfessionalId("");
      await fetchProfessionals(managingCompany.id);
    } catch (error) {
      console.error("Error assigning professional:", error);
      toast.error("Error al asignar el profesional");
    }
  };

  const handleRemoveProfessional = async (assignmentId: string) => {
    if (!managingCompany) return;

    try {
      const { error } = await supabase
        .from("company_professionals")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Profesional removido exitosamente");
      await fetchProfessionals(managingCompany.id);
    } catch (error) {
      console.error("Error removing professional:", error);
      toast.error("Error al remover el profesional");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activa";
      case "pending":
        return "Pendiente";
      case "inactive":
        return "Inactiva";
      default:
        return status;
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || company.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Holistia para Empresas</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona las empresas suscritas a servicios corporativos
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Empresa
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="inactive">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.filter((c) => c.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.filter((c) => c.status === "pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay empresas</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron resultados"
                  : "Comienza agregando una empresa"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Empresa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{company.name}</CardTitle>
                      <Badge className={getStatusColor(company.status)}>
                        {getStatusText(company.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 py-4">
                  {company.industry && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{company.industry}</span>
                    </div>
                  )}
                  {company.company_size && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{company.company_size}</span>
                    </div>
                  )}
                  {company.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{company.contact_email}</span>
                    </div>
                  )}
                  {company.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{company.contact_phone}</span>
                    </div>
                  )}
                  {company.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{company.city}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setViewingCompany(company);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenManageProfessionals(company)}
                      title="Gestionar profesionales"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(company)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingId(company.id);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Editar Empresa" : "Nueva Empresa"}
            </DialogTitle>
            <DialogDescription>
              {editingCompany
                ? "Modifica la información de la empresa"
                : "Agrega una nueva empresa al programa corporativo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la empresa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <RichTextEditor
                content={formData.description || ""}
                onChange={(content) => setFormData({ ...formData, description: content })}
                placeholder="Descripción de la empresa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industria</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una industria" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_size">Tamaño de la Empresa</Label>
                <Select
                  value={formData.company_size}
                  onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Número de empleados" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Nombre de Contacto</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Nombre del representante"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de Contacto</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+52 333 123 4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Calle, número, colonia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Guadalajara, Jalisco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'pending' | 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingCompany ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingCompany?.name}</DialogTitle>
            <DialogDescription>Detalles de la empresa</DialogDescription>
          </DialogHeader>
          {viewingCompany && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(viewingCompany.status)}>
                    {getStatusText(viewingCompany.status)}
                  </Badge>
                </div>
              </div>

              {viewingCompany.description && (
                <div>
                  <Label className="text-muted-foreground">Descripción</Label>
                  <div
                    className="mt-1 text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewingCompany.description }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingCompany.industry && (
                  <div>
                    <Label className="text-muted-foreground">Industria</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {viewingCompany.industry}
                    </p>
                  </div>
                )}

                {viewingCompany.company_size && (
                  <div>
                    <Label className="text-muted-foreground">Tamaño</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {viewingCompany.company_size}
                    </p>
                  </div>
                )}
              </div>

              {viewingCompany.contact_name && (
                <div>
                  <Label className="text-muted-foreground">Persona de Contacto</Label>
                  <p className="mt-1 text-sm">{viewingCompany.contact_name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingCompany.contact_email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {viewingCompany.contact_email}
                    </p>
                  </div>
                )}

                {viewingCompany.contact_phone && (
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {viewingCompany.contact_phone}
                    </p>
                  </div>
                )}
              </div>

              {viewingCompany.city && (
                <div>
                  <Label className="text-muted-foreground">Ciudad</Label>
                  <p className="mt-1 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {viewingCompany.city}
                  </p>
                </div>
              )}

              {viewingCompany.address && (
                <div>
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="mt-1 text-sm">{viewingCompany.address}</p>
                </div>
              )}

              {viewingCompany.website && (
                <div>
                  <Label className="text-muted-foreground">Sitio Web</Label>
                  <p className="mt-1 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={viewingCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {viewingCompany.website}
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Professionals Dialog */}
      <Dialog open={isManageProfessionalsOpen} onOpenChange={setIsManageProfessionalsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Profesionales - {managingCompany?.name}</DialogTitle>
            <DialogDescription>
              Asigna o remueve profesionales que atenderán a los empleados de esta empresa
            </DialogDescription>
          </DialogHeader>

          {managingCompany && (
            <Tabs defaultValue="assigned" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assigned">
                  Profesionales Asignados ({assignedProfessionals.length})
                </TabsTrigger>
                <TabsTrigger value="available">
                  Asignar Nuevo Profesional
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assigned" className="space-y-4 mt-4">
                {loadingProfessionals ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Cargando profesionales...</p>
                  </div>
                ) : assignedProfessionals.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay profesionales asignados</h3>
                    <p className="text-muted-foreground mb-4">
                      Asigna profesionales para que atiendan a los empleados de esta empresa
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignedProfessionals.map((assignment) => (
                      <Card key={assignment.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <Image
                              src={
                                assignment.professional?.profile_photo ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  `${assignment.professional?.first_name} ${assignment.professional?.last_name}`
                                )}&background=random`
                              }
                              alt=""
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h4 className="font-medium">
                                {assignment.professional?.first_name} {assignment.professional?.last_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {assignment.professional?.profession}
                              </p>
                              {assignment.professional?.email && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Mail className="w-3 h-3" />
                                  {assignment.professional.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProfessional(assignment.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="available" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Seleccionar Profesional</Label>
                    <Select
                      value={selectedProfessionalId}
                      onValueChange={setSelectedProfessionalId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProfessionals
                          .filter(
                            (prof) =>
                              !assignedProfessionals.some(
                                (assigned) => assigned.professional_id === prof.id
                              )
                          )
                          .map((professional) => (
                            <SelectItem key={professional.id} value={professional.id}>
                              {professional.first_name} {professional.last_name} - {professional.profession}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleAssignProfessional}
                    disabled={!selectedProfessionalId}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Asignar Profesional
                  </Button>

                  {selectedProfessionalId && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm">Vista previa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const selectedProf = availableProfessionals.find(
                            (p) => p.id === selectedProfessionalId
                          );
                          return selectedProf ? (
                            <div className="flex items-center gap-4">
                              <Image
                                src={
                                  selectedProf.profile_photo ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    `${selectedProf.first_name} ${selectedProf.last_name}`
                                  )}&background=random`
                                }
                                alt=""
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="font-medium">
                                  {selectedProf.first_name} {selectedProf.last_name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {selectedProf.profession}
                                </p>
                                {selectedProf.specializations && selectedProf.specializations.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {selectedProf.specializations.slice(0, 3).map((spec, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {spec}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Empresa"
        description="¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
