"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FullScreenDialog,
  FullScreenDialogContent,
  FullScreenDialogHeader,
  FullScreenDialogBody,
  FullScreenDialogTitle,
  FullScreenDialogDescription,
  FullScreenDialogClose,
} from "@/components/ui/full-screen-dialog";
import {
  Ticket,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  Calendar,
  Plus,
  Upload,
  X,
  FileImage,
  FileVideo,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "waiting_response" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  reporter_id: string;
  reporter_email: string;
  reporter_name: string;
  assigned_to: string | null;
  environment: string | null;
  url: string | null;
  steps_to_reproduce: string | null;
  expected_behavior: string | null;
  actual_behavior: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  comment_count?: number;
  attachment_count?: number;
}

interface TicketStats {
  open_tickets: number;
  in_progress_tickets: number;
  waiting_response_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  urgent_tickets: number;
  high_priority_tickets: number;
  avg_resolution_time_hours: number;
}

interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  is_admin: boolean;
  comment: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketComments, setTicketComments] = useState<TicketComment[]>([]);
  const [ticketAttachments, setTicketAttachments] = useState<TicketAttachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    url: "",
    environment: "",
    steps_to_reproduce: "",
    expected_behavior: "",
    actual_behavior: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<TicketAttachment | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadTickets();
    loadStats();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          *,
          comment_count:support_ticket_comments(count),
          attachment_count:support_ticket_attachments(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Procesar datos para obtener los conteos
      const processedData = data.map((ticket: any) => ({
        ...ticket,
        comment_count: ticket.comment_count?.[0]?.count || 0,
        attachment_count: ticket.attachment_count?.[0]?.count || 0,
      }));

      setTickets(processedData);
      setFilteredTickets(processedData);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Error al cargar los tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from("support_ticket_stats")
        .select("*")
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.reporter_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    // Filtrar por prioridad
    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  };

  const loadTicketComments = async (ticketId: string) => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from("support_ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTicketComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Error al cargar los comentarios");
    } finally {
      setLoadingComments(false);
    }
  };

  const loadTicketAttachments = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_ticket_attachments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTicketAttachments(data || []);
    } catch (error) {
      console.error("Error loading attachments:", error);
      toast.error("Error al cargar los archivos adjuntos");
    }
  };

  const handleTicketClick = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    await loadTicketComments(ticket.id);
    await loadTicketAttachments(ticket.id);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "closed" || newStatus === "resolved") {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Estado actualizado correctamente");
      await loadTickets();
      await loadStats();

      // Actualizar ticket seleccionado
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ priority: newPriority })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Prioridad actualizada correctamente");
      await loadTickets();
      await loadStats();

      // Actualizar ticket seleccionado
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, priority: newPriority as any });
      }
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Error al actualizar la prioridad");
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();

      const authorName = profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : user.email?.split("@")[0] || "Admin";

      const { error } = await supabase
        .from("support_ticket_comments")
        .insert({
          ticket_id: selectedTicket.id,
          author_id: user.id,
          author_name: authorName,
          author_email: user.email || "",
          is_admin: true,
          comment: newComment,
          is_internal: isInternalComment,
        });

      if (error) throw error;

      toast.success("Comentario agregado correctamente");
      setNewComment("");
      setIsInternalComment(false);
      await loadTicketComments(selectedTicket.id);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Error al agregar el comentario");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const maxSize = 50 * 1024 * 1024; // 50MB

      if (!isImage && !isVideo) {
        toast.error(`${file.name} no es un archivo válido. Solo se permiten imágenes y videos.`);
        return false;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name} es demasiado grande. El tamaño máximo es 50MB.`);
        return false;
      }

      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (ticketId: string, userId: string) => {
    if (attachments.length === 0) return;

    setUploadingAttachments(true);
    const uploadedFiles: Array<{
      file_name: string;
      file_url: string;
      file_type: string;
      file_size: number;
    }> = [];

    try {
      for (const file of attachments) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${ticketId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `ticket-attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("support-tickets")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          toast.error(`Error al subir ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("support-tickets")
          .getPublicUrl(filePath);

        uploadedFiles.push({
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        });
      }

      if (uploadedFiles.length > 0) {
        const { error: insertError } = await supabase
          .from("support_ticket_attachments")
          .insert(
            uploadedFiles.map((file) => ({
              ticket_id: ticketId,
              uploaded_by: userId,
              ...file,
            }))
          );

        if (insertError) {
          console.error("Error saving attachments:", insertError);
          toast.error("Error al guardar los archivos adjuntos");
        }
      }
    } catch (error) {
      console.error("Error in uploadAttachments:", error);
      toast.error("Error al procesar los archivos");
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      // 1. Obtener todos los archivos adjuntos del ticket
      const { data: attachments, error: fetchError } = await supabase
        .from("support_ticket_attachments")
        .select("file_url")
        .eq("ticket_id", ticketId);

      if (fetchError) throw fetchError;

      // 2. Eliminar archivos del storage
      if (attachments && attachments.length > 0) {
        const filePaths = attachments.map((attachment) => {
          // Extraer la ruta del archivo desde la URL pública
          const url = new URL(attachment.file_url);
          const pathParts = url.pathname.split("/");
          const bucketIndex = pathParts.findIndex((part) => part === "support-tickets");
          if (bucketIndex !== -1) {
            return pathParts.slice(bucketIndex + 1).join("/");
          }
          return null;
        }).filter((path): path is string => path !== null);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("support-tickets")
            .remove(filePaths);

          if (storageError) {
            console.error("Error deleting files from storage:", storageError);
          }
        }
      }

      // 3. Eliminar el ticket (esto eliminará automáticamente comentarios y attachments por CASCADE)
      const { error: deleteError } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", ticketId);

      if (deleteError) throw deleteError;

      toast.success("Ticket eliminado correctamente");
      setSelectedTicket(null);
      await loadTickets();
      await loadStats();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Error al eliminar el ticket");
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description || !newTicket.category) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();

      const reporterName = profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : user.email?.split("@")[0] || "Admin";

      const { data: ticketData, error } = await supabase
        .from("support_tickets")
        .insert({
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          reporter_id: user.id,
          reporter_email: user.email || "",
          reporter_name: reporterName,
          url: newTicket.url || null,
          environment: newTicket.environment || null,
          steps_to_reproduce: newTicket.steps_to_reproduce || null,
          expected_behavior: newTicket.expected_behavior || null,
          actual_behavior: newTicket.actual_behavior || null,
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;

      // Subir archivos adjuntos si hay
      if (attachments.length > 0 && ticketData) {
        await uploadAttachments(ticketData.id, user.id);
      }

      toast.success("Ticket creado correctamente");
      setShowNewTicketDialog(false);
      setNewTicket({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        url: "",
        environment: "",
        steps_to_reproduce: "",
        expected_behavior: "",
        actual_behavior: "",
      });
      setAttachments([]);
      await loadTickets();
      await loadStats();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Error al crear el ticket");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "waiting_response":
        return "bg-purple-100 text-purple-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Abierto";
      case "in_progress":
        return "En Progreso";
      case "waiting_response":
        return "Esperando Respuesta";
      case "resolved":
        return "Resuelto";
      case "closed":
        return "Cerrado";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "low":
        return "Baja";
      case "medium":
        return "Media";
      case "high":
        return "Alta";
      case "urgent":
        return "Urgente";
      default:
        return priority;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "resolved":
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando tickets...</p>
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
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tickets de Soporte</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona los reportes de bugs y problemas técnicos
              </p>
            </div>
          </div>
          <Button onClick={() => setShowNewTicketDialog(true)} size="sm" className="sm:size-default">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="py-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.open_tickets}</div>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.in_progress_tickets}</div>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.resolved_tickets}</div>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.urgent_tickets}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="waiting_response">Esperando Respuesta</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="py-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
                <CardDescription>Lista de todos los tickets reportados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Comentarios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay tickets que mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleTicketClick(ticket)}
                      >
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{ticket.reporter_name}</p>
                            <p className="text-xs text-muted-foreground">{ticket.reporter_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusText(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {getPriorityText(ticket.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">{ticket.comment_count || 0}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(selectedTicket.status)}
                      <span>{selectedTicket.title}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Abierto</SelectItem>
                          <SelectItem value="in_progress">En Progreso</SelectItem>
                          <SelectItem value="waiting_response">Esperando Respuesta</SelectItem>
                          <SelectItem value="resolved">Resuelto</SelectItem>
                          <SelectItem value="closed">Cerrado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedTicket.priority}
                        onValueChange={(value) => handlePriorityChange(selectedTicket.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTitle>
                <DialogDescription>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Reportado por: {selectedTicket.reporter_name} ({selectedTicket.reporter_email})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(selectedTicket.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      <span>Categoría: {selectedTicket.category}</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Descripción */}
                <div>
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Información adicional */}
                {(selectedTicket.url || selectedTicket.environment) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Información Adicional</h4>
                    {selectedTicket.url && (
                      <div>
                        <p className="text-sm font-medium">URL:</p>
                        <p className="text-sm text-muted-foreground">{selectedTicket.url}</p>
                      </div>
                    )}
                    {selectedTicket.environment && (
                      <div>
                        <p className="text-sm font-medium">Entorno:</p>
                        <p className="text-sm text-muted-foreground">{selectedTicket.environment}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pasos para reproducir */}
                {selectedTicket.steps_to_reproduce && (
                  <div>
                    <h4 className="font-semibold mb-2">Pasos para Reproducir</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedTicket.steps_to_reproduce}
                    </p>
                  </div>
                )}

                {/* Comportamiento esperado vs actual */}
                {(selectedTicket.expected_behavior || selectedTicket.actual_behavior) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTicket.expected_behavior && (
                      <div>
                        <h4 className="font-semibold mb-2">Comportamiento Esperado</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedTicket.expected_behavior}
                        </p>
                      </div>
                    )}
                    {selectedTicket.actual_behavior && (
                      <div>
                        <h4 className="font-semibold mb-2">Comportamiento Actual</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedTicket.actual_behavior}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Archivos adjuntos */}
                {ticketAttachments.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Archivos Adjuntos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ticketAttachments.map((attachment) => (
                        <button
                          key={attachment.id}
                          onClick={() => {
                            setSelectedAttachment(attachment);
                            setShowAttachmentModal(true);
                          }}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left w-full"
                        >
                          {attachment.file_type.startsWith("image/") ? (
                            <FileImage className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          ) : (
                            <FileVideo className="h-5 w-5 text-purple-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comentarios */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Comentarios</h4>
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {ticketComments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-3 rounded-lg ${
                            comment.is_admin ? "bg-blue-50" : "bg-muted"
                          } ${comment.is_internal ? "border-2 border-yellow-400" : ""}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">
                                {comment.author_name}
                                {comment.is_admin && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Admin
                                  </Badge>
                                )}
                                {comment.is_internal && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-yellow-100">
                                    Interno
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar comentario */}
                  <div className="space-y-2">
                    <textarea
                      className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isInternalComment}
                          onChange={(e) => setIsInternalComment(e.target.checked)}
                          className="rounded"
                        />
                        <span>Comentario interno (solo admins)</span>
                      </label>
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        Agregar Comentario
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ticket</DialogTitle>
            <DialogDescription>
              Reporta un bug o problema técnico en la plataforma
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Título <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ej: Error al cargar la página de perfil"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newTicket.category}
                  onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UI/UX">UI/UX</SelectItem>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="Base de datos">Base de datos</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Autenticación">Autenticación</SelectItem>
                    <SelectItem value="Rendimiento">Rendimiento</SelectItem>
                    <SelectItem value="Seguridad">Seguridad</SelectItem>
                    <SelectItem value="Pagos">Pagos</SelectItem>
                    <SelectItem value="Email/Notificaciones">Email/Notificaciones</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridad</label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe el problema en detalle..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL (opcional)</label>
                <Input
                  placeholder="https://ejemplo.com/pagina"
                  value={newTicket.url}
                  onChange={(e) => setNewTicket({ ...newTicket, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Entorno (opcional)</label>
                <Input
                  placeholder="Ej: Chrome 120, Windows 11"
                  value={newTicket.environment}
                  onChange={(e) => setNewTicket({ ...newTicket, environment: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pasos para reproducir (opcional)</label>
                <textarea
                  className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="1. Ir a la página X&#10;2. Hacer clic en el botón Y&#10;3. Observar el error"
                  value={newTicket.steps_to_reproduce}
                  onChange={(e) => setNewTicket({ ...newTicket, steps_to_reproduce: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Comportamiento esperado (opcional)</label>
                <textarea
                  className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Qué debería pasar..."
                  value={newTicket.expected_behavior}
                  onChange={(e) => setNewTicket({ ...newTicket, expected_behavior: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Comportamiento actual (opcional)</label>
                <textarea
                  className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Qué está pasando..."
                  value={newTicket.actual_behavior}
                  onChange={(e) => setNewTicket({ ...newTicket, actual_behavior: e.target.value })}
                />
              </div>

              {/* Archivos adjuntos */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Archivos adjuntos (opcional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Haz clic para subir imágenes o videos
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Máximo 50MB por archivo
                    </span>
                  </label>

                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            {file.type.startsWith("image/") ? (
                              <FileImage className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileVideo className="h-4 w-4 text-purple-500" />
                            )}
                            <span className="text-sm truncate max-w-xs">{file.name}</span>
                            <span className="text-xs text-gray-400">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewTicketDialog(false);
                  setNewTicket({
                    title: "",
                    description: "",
                    category: "",
                    priority: "medium",
                    url: "",
                    environment: "",
                    steps_to_reproduce: "",
                    expected_behavior: "",
                    actual_behavior: "",
                  });
                  setAttachments([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!newTicket.title || !newTicket.description || !newTicket.category || uploadingAttachments}
              >
                {uploadingAttachments ? "Subiendo archivos..." : "Crear Ticket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attachment Viewer Modal */}
      <FullScreenDialog open={showAttachmentModal} onOpenChange={setShowAttachmentModal}>
        <FullScreenDialogContent>
          <FullScreenDialogHeader>
            <div className="flex-1 min-w-0">
              <FullScreenDialogTitle>
                {selectedAttachment?.file_name}
              </FullScreenDialogTitle>
              <FullScreenDialogDescription>
                {selectedAttachment && (
                  <span>
                    {(selectedAttachment.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </FullScreenDialogDescription>
            </div>
            <FullScreenDialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </FullScreenDialogClose>
          </FullScreenDialogHeader>
          <FullScreenDialogBody className="flex items-center justify-center p-4">
            {selectedAttachment && (
              <>
                {selectedAttachment.file_type.startsWith("image/") ? (
                  <img
                    src={selectedAttachment.file_url}
                    alt={selectedAttachment.file_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedAttachment.file_url}
                    controls
                    className="w-full h-full object-contain"
                  >
                    Tu navegador no soporta el elemento de video.
                  </video>
                )}
              </>
            )}
          </FullScreenDialogBody>
        </FullScreenDialogContent>
      </FullScreenDialog>
    </div>
  );
}
