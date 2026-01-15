"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Video,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Users,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react";
import {
  ChallengeMeeting,
  MeetingFormData,
  MEETING_PLATFORM_OPTIONS,
  RECURRENCE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/types/challenge";
import { Badge } from "@/components/ui/badge";

interface ChallengeMeetingsManagerProps {
  challengeId: string;
  isReadOnly?: boolean;
}

const emptyFormData: MeetingFormData = {
  title: "",
  description: "",
  platform: "meet",
  meeting_url: "",
  meeting_id: "",
  passcode: "",
  scheduled_date: "",
  scheduled_time: "",
  duration_minutes: "60",
  timezone: "America/Mexico_City",
  is_recurring: false,
  recurrence_pattern: "",
  recurrence_end_date: "",
  max_participants: "",
};

export function ChallengeMeetingsManager({
  challengeId,
  isReadOnly = false,
}: ChallengeMeetingsManagerProps) {
  const [meetings, setMeetings] = useState<ChallengeMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MeetingFormData>(emptyFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchMeetings();
  }, [challengeId]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("challenge_meetings")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("is_active", true)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;

      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Error al cargar las reuniones");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setFormData({ ...emptyFormData, scheduled_date: today, scheduled_time: "10:00" });
  };

  const handleEdit = (meeting: ChallengeMeeting) => {
    setEditingId(meeting.id);
    setIsAdding(false);
    setFormData({
      title: meeting.title,
      description: meeting.description || "",
      platform: meeting.platform,
      meeting_url: meeting.meeting_url,
      meeting_id: meeting.meeting_id || "",
      passcode: meeting.passcode || "",
      scheduled_date: meeting.scheduled_date,
      scheduled_time: meeting.scheduled_time.substring(0, 5), // HH:MM
      duration_minutes: meeting.duration_minutes.toString(),
      timezone: meeting.timezone,
      is_recurring: meeting.is_recurring,
      recurrence_pattern: meeting.recurrence_pattern || "",
      recurrence_end_date: meeting.recurrence_end_date || "",
      max_participants: meeting.max_participants?.toString() || "",
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.meeting_url.trim() || !formData.scheduled_date || !formData.scheduled_time) {
      toast.error("Título, URL, fecha y hora son obligatorios");
      return;
    }

    // Validate URL format
    try {
      new URL(formData.meeting_url);
    } catch {
      toast.error("La URL de la reunión no es válida");
      return;
    }

    try {
      setSubmitting(true);

      const meetingData = {
        challenge_id: challengeId,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        platform: formData.platform,
        meeting_url: formData.meeting_url.trim(),
        meeting_id: formData.meeting_id?.trim() || null,
        passcode: formData.passcode?.trim() || null,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        timezone: formData.timezone,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        status: "scheduled",
        is_active: true,
      };

      if (editingId) {
        const { error } = await supabase
          .from("challenge_meetings")
          .update(meetingData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Reunión actualizada correctamente");
      } else {
        const { error } = await supabase
          .from("challenge_meetings")
          .insert([meetingData]);

        if (error) throw error;
        toast.success("Reunión agregada correctamente");
      }

      handleCancel();
      await fetchMeetings();
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast.error("Error al guardar la reunión");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("challenge_meetings")
        .update({ is_active: false, status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", deletingId);

      if (error) throw error;

      toast.success("Reunión cancelada correctamente");
      setDeleteDialogOpen(false);
      setDeletingId(null);
      await fetchMeetings();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Error al cancelar la reunión");
    }
  };

  const handleCopyUrl = async (url: string, meetingId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(meetingId);
      toast.success("URL copiada al portapapeles");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error("Error al copiar URL");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5); // HH:MM
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'meet': return 'bg-blue-100 text-blue-800';
      case 'zoom': return 'bg-purple-100 text-purple-800';
      case 'teams': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reuniones Programadas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Agenda videollamadas por Meet, Zoom u otras plataformas
            </p>
          </div>
          {!isReadOnly && !isAdding && !editingId && (
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agendar Reunión
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meeting Form */}
        {(isAdding || editingId) && (
          <Card className="border-2 border-primary/20 bg-muted/30 py-4">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Sesión grupal de meditación"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({ ...formData, platform: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_PLATFORM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-url">
                  URL de la Reunión <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-url"
                  type="url"
                  value={formData.meeting_url}
                  onChange={(e) =>
                    setFormData({ ...formData, meeting_url: e.target.value })
                  }
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meeting-id">ID de Reunión (Opcional)</Label>
                  <Input
                    id="meeting-id"
                    value={formData.meeting_id}
                    onChange={(e) =>
                      setFormData({ ...formData, meeting_id: e.target.value })
                    }
                    placeholder="123-456-789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passcode">Contraseña (Opcional)</Label>
                  <Input
                    id="passcode"
                    value={formData.passcode}
                    onChange={(e) =>
                      setFormData({ ...formData, passcode: e.target.value })
                    }
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">
                    Fecha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduled_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled-time">
                    Hora <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduled_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="480"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timezone: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Tema: Técnicas de respiración consciente"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="recurring">Reunión Recurrente</Label>
                    <p className="text-xs text-muted-foreground">
                      Programa esta reunión de forma repetitiva
                    </p>
                  </div>
                  <Switch
                    id="recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_recurring: checked })
                    }
                  />
                </div>

                {formData.is_recurring && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="recurrence-pattern">Frecuencia</Label>
                      <Select
                        value={formData.recurrence_pattern}
                        onValueChange={(value) =>
                          setFormData({ ...formData, recurrence_pattern: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECURRENCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurrence-end">Fecha Final</Label>
                      <Input
                        id="recurrence-end"
                        type="date"
                        value={formData.recurrence_end_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrence_end_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-participants">
                  Límite de Participantes (Opcional)
                </Label>
                <Input
                  id="max-participants"
                  type="number"
                  min="1"
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_participants: e.target.value,
                    })
                  }
                  placeholder="Sin límite"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : editingId ? (
                    "Actualizar"
                  ) : (
                    "Agendar"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay reuniones programadas</p>
            {!isReadOnly && (
              <p className="text-sm mt-2">
                Haz clic en &quot;Agendar Reunión&quot; para comenzar
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const platformOption = MEETING_PLATFORM_OPTIONS.find(
                (opt) => opt.value === meeting.platform
              );

              return (
                <Card key={meeting.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Video className="h-5 w-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-medium">{meeting.title}</h4>
                            {meeting.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {meeting.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getPlatformBadgeColor(meeting.platform)}>
                              {platformOption?.label}
                            </Badge>
                            <Badge className={getStatusBadgeColor(meeting.status)}>
                              {meeting.status === 'scheduled' && 'Programada'}
                              {meeting.status === 'in_progress' && 'En curso'}
                              {meeting.status === 'completed' && 'Completada'}
                              {meeting.status === 'cancelled' && 'Cancelada'}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="capitalize">{formatDate(meeting.scheduled_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(meeting.scheduled_time)} ({meeting.duration_minutes} min)
                            </span>
                          </div>
                          {meeting.max_participants && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>Máx. {meeting.max_participants} participantes</span>
                            </div>
                          )}
                          {meeting.is_recurring && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span className="capitalize">
                                {meeting.recurrence_pattern === 'weekly' && 'Semanal'}
                                {meeting.recurrence_pattern === 'biweekly' && 'Quincenal'}
                                {meeting.recurrence_pattern === 'monthly' && 'Mensual'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={meeting.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Unirse
                            </a>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyUrl(meeting.meeting_url, meeting.id)}
                          >
                            {copiedUrl === meeting.id ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-2" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-2" />
                                Copiar URL
                              </>
                            )}
                          </Button>

                          {!isReadOnly && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(meeting)}
                              >
                                <Edit className="h-3 w-3 mr-2" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(meeting.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>

                        {(meeting.meeting_id || meeting.passcode) && (
                          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                            {meeting.meeting_id && (
                              <div>ID: {meeting.meeting_id}</div>
                            )}
                            {meeting.passcode && (
                              <div>Contraseña: {meeting.passcode}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar reunión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la reunión. Los participantes ya no podrán
              acceder a ella.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Cancelar Reunión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
