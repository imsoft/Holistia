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
  DollarSign,
  Download,
  Send,
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

interface CompanyLead {
  id: string;
  company_name: string;
  industry?: string;
  company_size?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  city?: string;
  additional_info?: string;
  requested_services: string[];
  status: 'pending' | 'contacted' | 'quoted' | 'converted';
  created_at: string;
  updated_at: string;
}

interface HolisticService {
  id: string;
  name: string;
  description: string;
}

interface QuoteService {
  service_id: string;
  service_name: string;
  assigned_professionals: string[]; // Array of professional IDs
  unit_price: number;
  quantity: number;
  notes?: string;
}

interface QuoteData {
  lead_id: string;
  services: QuoteService[];
  discount_percentage: number;
  additional_notes?: string;
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

  // Estados para gestión de leads
  const [leads, setLeads] = useState<CompanyLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [viewingLead, setViewingLead] = useState<CompanyLead | null>(null);
  const [isViewLeadOpen, setIsViewLeadOpen] = useState(false);
  const [holisticServices, setHolisticServices] = useState<HolisticService[]>([]);

  // Estados para gestión de cotizaciones
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quotingLead, setQuotingLead] = useState<CompanyLead | null>(null);
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>([]);
  const [quoteDiscount, setQuoteDiscount] = useState(0);
  const [quoteNotes, setQuoteNotes] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchCompanies();
    fetchLeads();
    fetchHolisticServices();
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

  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const { data, error } = await supabase
        .from("company_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }
      
      console.log("🔍 Leads cargados:", data?.length || 0, data);
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Error al cargar las solicitudes");
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchHolisticServices = async () => {
    try {
      const { data, error } = await supabase
        .from("holistic_services")
        .select("id, name, description")
        .eq("is_active", true);

      if (error) throw error;
      setHolisticServices(data || []);
    } catch (error) {
      console.error("Error fetching holistic services:", error);
    }
  };

  const convertLeadToCompany = async (lead: CompanyLead) => {
    try {
      setSaving(true);

      // Crear empresa desde el lead
      const { data: newCompany, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: lead.company_name,
          industry: lead.industry,
          company_size: lead.company_size,
          contact_name: lead.contact_name,
          contact_email: lead.contact_email,
          contact_phone: lead.contact_phone,
          city: lead.city,
          status: "active",
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Actualizar estado del lead a 'converted'
      const { error: leadError } = await supabase
        .from("company_leads")
        .update({ status: "converted" })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      toast.success("Lead convertido a empresa exitosamente");
      fetchLeads();
      fetchCompanies();
    } catch (error) {
      console.error("Error converting lead:", error);
      toast.error("Error al convertir el lead");
    } finally {
      setSaving(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: CompanyLead['status']) => {
    try {
      const { error } = await supabase
        .from("company_leads")
        .update({ status })
        .eq("id", leadId);

      if (error) throw error;
      toast.success("Estado actualizado exitosamente");
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  // Funciones para gestión de cotizaciones
  const handleOpenQuote = async (lead: CompanyLead) => {
    setQuotingLead(lead);

    // Cargar profesionales si no están cargados
    if (availableProfessionals.length === 0) {
      try {
        const { data: allProfessionals, error: profError } = await supabase
          .from("professional_applications")
          .select("id, first_name, last_name, email, profession, specializations, profile_photo, phone")
          .eq("status", "approved")
          .eq("is_active", true)
          .order("first_name");

        if (profError) throw profError;
        setAvailableProfessionals(allProfessionals || []);
      } catch (error) {
        console.error("Error loading professionals:", error);
        toast.error("Error al cargar los profesionales");
      }
    }

    // Inicializar servicios de cotización basados en los servicios solicitados
    const initialServices: QuoteService[] = lead.requested_services.map((serviceId) => {
      const service = holisticServices.find(s => s.id === serviceId);
      return {
        service_id: serviceId,
        service_name: service?.name || 'Servicio',
        assigned_professionals: [],
        unit_price: 0,
        quantity: 1,
        notes: '',
      };
    });

    setQuoteServices(initialServices);
    setQuoteDiscount(0);
    setQuoteNotes("");
    setIsQuoteOpen(true);
  };

  const updateQuoteService = (index: number, field: keyof QuoteService, value: any) => {
    const updated = [...quoteServices];
    updated[index] = { ...updated[index], [field]: value };
    setQuoteServices(updated);
  };

  const calculateSubtotal = () => {
    return quoteServices.reduce((sum, service) => {
      return sum + (service.unit_price * service.quantity);
    }, 0);
  };

  const calculateDiscount = () => {
    return calculateSubtotal() * (quoteDiscount / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const sendQuoteEmail = async () => {
    if (!quotingLead) return;

    try {
      setSaving(true);

      // Preparar datos de los servicios
      const servicesData = quoteServices.map(service => ({
        service_name: service.service_name,
        assigned_professionals: service.assigned_professionals,
        professionals_names: service.assigned_professionals.map(profId => {
          const prof = availableProfessionals.find(p => p.id === profId);
          return prof ? `${prof.first_name} ${prof.last_name}` : '';
        }).filter(Boolean),
        quantity: service.quantity,
        unit_price: service.unit_price,
        subtotal: service.quantity * service.unit_price,
        notes: service.notes || ''
      }));

      const emailData = {
        lead_id: quotingLead.id,
        company_name: quotingLead.company_name,
        contact_name: quotingLead.contact_name,
        contact_email: quotingLead.contact_email,
        services: servicesData,
        subtotal: calculateSubtotal(),
        discount_percentage: quoteDiscount,
        discount_amount: calculateDiscount(),
        total: calculateTotal(),
        additional_notes: quoteNotes
      };

      const response = await fetch('/api/admin/send-quote-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al enviar el email');
      }

      toast.success('Cotización enviada por email exitosamente');

      // Actualizar estado del lead a 'quoted' si está en 'contacted' o 'pending'
      if (quotingLead.status === 'contacted' || quotingLead.status === 'pending') {
        await updateLeadStatus(quotingLead.id, 'quoted');
      }

      setIsQuoteOpen(false);
    } catch (error) {
      console.error('Error sending quote email:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar el email');
    } finally {
      setSaving(false);
    }
  };

  const generateQuotePDF = async () => {
    if (!quotingLead) return;

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF() as any;

      // Header - Logo y título
      doc.setFillColor(79, 70, 229); // primary color
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('HOLISTIA', 20, 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Cotización de Servicios Corporativos', 20, 30);

      // Información de la cotización
      let yPos = 50;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPos);

      // Información del cliente
      yPos += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL CLIENTE', 20, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Empresa: ${quotingLead.company_name}`, 20, yPos);

      yPos += 6;
      doc.text(`Contacto: ${quotingLead.contact_name}`, 20, yPos);

      yPos += 6;
      doc.text(`Email: ${quotingLead.contact_email}`, 20, yPos);

      if (quotingLead.contact_phone) {
        yPos += 6;
        doc.text(`Teléfono: ${quotingLead.contact_phone}`, 20, yPos);
      }

      if (quotingLead.company_size) {
        yPos += 6;
        doc.text(`Tamaño: ${quotingLead.company_size}`, 20, yPos);
      }

      // Tabla de servicios
      yPos += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SERVICIOS COTIZADOS', 20, yPos);

      yPos += 5;

      const tableData = quoteServices.map((service) => {
        const professionals = service.assigned_professionals
          .map(profId => {
            const prof = availableProfessionals.find(p => p.id === profId);
            return prof ? `${prof.first_name} ${prof.last_name}` : '';
          })
          .filter(Boolean)
          .join(', ');

        return [
          service.service_name,
          professionals || 'Por asignar',
          service.quantity.toString(),
          `$${service.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          `$${(service.quantity * service.unit_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        ];
      });

      doc.autoTable({
        startY: yPos,
        head: [['Servicio', 'Profesional(es)', 'Sesiones', 'Precio/Sesión', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 50 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
        },
      });

      // Resumen de precios
      yPos = (doc as any).lastAutoTable.finalY + 10;

      const subtotal = calculateSubtotal();
      const discount = calculateDiscount();
      const total = calculateTotal();

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const xRight = 160;
      doc.text('Subtotal:', xRight, yPos);
      doc.text(`$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 190, yPos, { align: 'right' });

      if (quoteDiscount > 0) {
        yPos += 6;
        doc.text(`Descuento (${quoteDiscount}%):`, xRight, yPos);
        doc.text(`-$${discount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 190, yPos, { align: 'right' });
      }

      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', xRight, yPos);
      doc.text(`$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 190, yPos, { align: 'right' });

      // Notas adicionales
      if (quoteNotes) {
        yPos += 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTAS Y CONDICIONES', 20, yPos);

        yPos += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        // Convertir HTML a texto plano (básico)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = quoteNotes;
        const notesText = tempDiv.textContent || tempDiv.innerText || '';

        const splitNotes = doc.splitTextToSize(notesText, 170);
        doc.text(splitNotes, 20, yPos);
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Guardar PDF
      const fileName = `Cotizacion_${quotingLead.company_name.replace(/\s/g, '_')}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      toast.success('PDF generado exitosamente');

      // Actualizar estado del lead a 'quoted' si está en 'contacted' o 'pending'
      if (quotingLead.status === 'contacted' || quotingLead.status === 'pending') {
        await updateLeadStatus(quotingLead.id, 'quoted');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
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

  const getLeadStatusColor = (status: CompanyLead['status']) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "quoted":
        return "bg-purple-100 text-purple-800";
      case "converted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLeadStatusText = (status: CompanyLead['status']) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "contacted":
        return "Contactado";
      case "quoted":
        return "Cotizado";
      case "converted":
        return "Convertido";
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
        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="companies">
              Empresas Activas ({companies.length})
            </TabsTrigger>
            <TabsTrigger value="leads">
              Solicitudes ({leads.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Empresas Activas */}
          <TabsContent value="companies" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 py-4">
              <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">{companies.length}</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 py-4">
              <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">
                {companies.filter((c) => c.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 py-4">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-4">
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
              <Card key={i} className="animate-pulse py-4">
                <CardContent className="p-6 py-4">
                  <div className="h-20 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card className="py-4">
            <CardContent className="flex flex-col items-center justify-center py-4">
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
              <Card key={company.id} className="hover:shadow-lg transition-shadow py-4">
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
          </TabsContent>

          {/* Tab: Solicitudes (Leads) */}
          <TabsContent value="leads" className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              Solicitudes de empresas interesadas desde la landing page
            </div>

            {loadingLeads ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Cargando solicitudes...</p>
              </div>
            ) : leads.length === 0 ? (
              <Card className="py-4">
                <CardContent className="flex flex-col items-center justify-center py-4">
                  <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay solicitudes pendientes</h3>
                  <p className="text-muted-foreground text-center">
                    Las solicitudes desde la landing page aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {leads.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-lg transition-shadow py-4">
                    <CardHeader className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{lead.company_name}</CardTitle>
                          <Badge className={getLeadStatusColor(lead.status)}>
                            {getLeadStatusText(lead.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 py-4">
                      {lead.industry && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{lead.industry}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{lead.contact_email}</span>
                      </div>
                      {lead.contact_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{lead.contact_phone}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Servicios solicitados: {lead.requested_services.length}
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setViewingLead(lead);
                            setIsViewLeadOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        {lead.status === 'pending' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => convertLeadToCompany(lead)}
                            disabled={saving}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Convertir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto py-4">
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
        <DialogContent className="max-w-2xl py-4">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto py-4">
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
                      <Card key={assignment.id} className="py-4">
                        <CardContent className="flex items-center justify-between p-4 py-4">
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
                    <Card className="mt-4 py-4">
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm">Vista previa</CardTitle>
                      </CardHeader>
                      <CardContent className="py-4">
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

      {/* View Lead Dialog */}
      <Dialog open={isViewLeadOpen} onOpenChange={setIsViewLeadOpen}>
        <DialogContent className="max-w-2xl py-4">
          <DialogHeader>
            <DialogTitle>{viewingLead?.company_name}</DialogTitle>
            <DialogDescription>Detalles de la solicitud</DialogDescription>
          </DialogHeader>
          {viewingLead && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <div className="mt-1 flex gap-2">
                  <Badge className={getLeadStatusColor(viewingLead.status)}>
                    {getLeadStatusText(viewingLead.status)}
                  </Badge>
                  {viewingLead.status !== 'converted' && (
                    <Select
                      value={viewingLead.status}
                      onValueChange={(value) => updateLeadStatus(viewingLead.id, value as CompanyLead['status'])}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="quoted">Cotizado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {viewingLead.industry && (
                <div>
                  <Label className="text-muted-foreground">Industria</Label>
                  <p className="mt-1 text-sm">{viewingLead.industry}</p>
                </div>
              )}

              {viewingLead.company_size && (
                <div>
                  <Label className="text-muted-foreground">Tamaño de la Empresa</Label>
                  <p className="mt-1 text-sm">{viewingLead.company_size}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Información de Contacto</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-muted-foreground">Nombre</Label>
                    <p className="mt-1 text-sm">{viewingLead.contact_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="mt-1 text-sm">{viewingLead.contact_email}</p>
                  </div>
                  {viewingLead.contact_phone && (
                    <div>
                      <Label className="text-muted-foreground">Teléfono</Label>
                      <p className="mt-1 text-sm">{viewingLead.contact_phone}</p>
                    </div>
                  )}
                  {viewingLead.city && (
                    <div>
                      <Label className="text-muted-foreground">Ciudad</Label>
                      <p className="mt-1 text-sm">{viewingLead.city}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Servicios Solicitados</h3>
                <div className="flex flex-wrap gap-2">
                  {viewingLead.requested_services.map((serviceId) => {
                    const service = holisticServices.find(s => s.id === serviceId);
                    return service ? (
                      <Badge key={serviceId} variant="secondary">
                        {service.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {viewingLead.additional_info && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Información Adicional</Label>
                  <p className="mt-1 text-sm whitespace-pre-line">{viewingLead.additional_info}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Fecha de Solicitud</Label>
                <p className="mt-1 text-sm">
                  {new Date(viewingLead.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {viewingLead.status !== 'converted' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleOpenQuote(viewingLead);
                      setIsViewLeadOpen(false);
                    }}
                    className="flex-1"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Crear Cotización
                  </Button>
                  <Button
                    onClick={() => convertLeadToCompany(viewingLead)}
                    disabled={saving}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Convertir a Empresa
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quote Dialog */}
      <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto py-4">
          <DialogHeader>
            <DialogTitle>Crear Cotización - {quotingLead?.company_name}</DialogTitle>
            <DialogDescription>
              Asigna profesionales, define precios y genera una cotización para enviar al cliente
            </DialogDescription>
          </DialogHeader>

          {quotingLead && (
            <div className="space-y-6">
              {/* Company Info Summary */}
              <Card className="py-4">
                <CardContent className="pt-6 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Contacto</Label>
                      <p className="font-medium">{quotingLead.contact_name}</p>
                      <p className="text-muted-foreground">{quotingLead.contact_email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Empresa</Label>
                      <p className="font-medium">{quotingLead.company_name}</p>
                      {quotingLead.company_size && (
                        <p className="text-muted-foreground">{quotingLead.company_size}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <div className="space-y-4">
                <h3 className="font-semibold">Servicios Solicitados</h3>

                {quoteServices.map((service, index) => (
                  <Card key={index} className="py-4">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">{service.service_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 py-4">
                      {/* Professional Assignment */}
                      <div className="space-y-2">
                        <Label>Profesionales Asignados</Label>
                        <Select
                          value=""
                          onValueChange={(profId) => {
                            if (!service.assigned_professionals.includes(profId)) {
                              updateQuoteService(index, 'assigned_professionals', [
                                ...service.assigned_professionals,
                                profId
                              ]);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Asignar profesional" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProfessionals.map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                {prof.first_name} {prof.last_name} - {prof.profession}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Assigned Professionals List */}
                        {service.assigned_professionals.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {service.assigned_professionals.map((profId) => {
                              const prof = availableProfessionals.find(p => p.id === profId);
                              return prof ? (
                                <Badge key={profId} variant="secondary" className="flex items-center gap-1">
                                  {prof.first_name} {prof.last_name}
                                  <X
                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                    onClick={() => {
                                      updateQuoteService(
                                        index,
                                        'assigned_professionals',
                                        service.assigned_professionals.filter(id => id !== profId)
                                      );
                                    }}
                                  />
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Cantidad de Sesiones</Label>
                          <Input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) => updateQuoteService(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio por Sesión (MXN)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.unit_price}
                            onChange={(e) => updateQuoteService(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subtotal</Label>
                          <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                            ${(service.quantity * service.unit_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label>Notas (opcional)</Label>
                        <Input
                          placeholder="Información adicional sobre este servicio"
                          value={service.notes}
                          onChange={(e) => updateQuoteService(index, 'notes', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pricing Summary */}
              <Card className="py-4">
                <CardContent className="pt-6 space-y-4 py-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      ${calculateSubtotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label>Descuento (%):</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={quoteDiscount}
                        onChange={(e) => setQuoteDiscount(parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        - ${calculateDiscount().toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      ${calculateTotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label>Notas Adicionales de la Cotización</Label>
                <RichTextEditor
                  content={quoteNotes}
                  onChange={setQuoteNotes}
                  placeholder="Términos y condiciones, plazos de pago, vigencia de la cotización, etc."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsQuoteOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={quoteServices.length === 0}
                  onClick={generateQuotePDF}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generar PDF
                </Button>
                <Button
                  className="flex-1"
                  disabled={quoteServices.length === 0 || saving}
                  onClick={sendQuoteEmail}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {saving ? 'Enviando...' : 'Enviar por Email'}
                </Button>
              </div>
            </div>
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
