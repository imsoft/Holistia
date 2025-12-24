"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Eye,
  Users,
  MessageSquare,
  Bell,
  Search,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface PrivacySettings {
  profile_visibility: "public" | "followers" | "private";
  show_challenges: boolean;
  show_stats: boolean;
  show_achievements: boolean;
  show_followers: boolean;
  show_activity: boolean;
  who_can_follow: "everyone" | "no_one";
  who_can_message: "everyone" | "followers" | "no_one";
  who_can_see_posts: "everyone" | "followers" | "private";
  who_can_comment: "everyone" | "followers" | "no_one";
  email_notifications: boolean;
  push_notifications: boolean;
  notify_on_follow: boolean;
  notify_on_like: boolean;
  notify_on_comment: boolean;
  notify_on_team_invite: boolean;
  notify_on_challenge_update: boolean;
  allow_search_by_email: boolean;
  allow_search_by_name: boolean;
  show_online_status: boolean;
}

export function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/privacy");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al cargar configuración");

      setSettings(data.data);
    } catch (error) {
      console.error("Error loading privacy settings:", error);
      toast.error("Error al cargar configuración de privacidad");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al guardar");

      toast.success("Configuración guardada exitosamente");
    } catch (error: any) {
      console.error("Error saving privacy settings:", error);
      toast.error(error.message || "Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PrivacySettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error al cargar configuración</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Privacidad y Seguridad</h2>
        <p className="text-muted-foreground">
          Controla quién puede ver tu información y cómo interactúan contigo
        </p>
      </div>

      {/* Visibilidad del perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visibilidad del Perfil
          </CardTitle>
          <CardDescription>
            Controla quién puede ver tu perfil y su contenido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Visibilidad general del perfil</Label>
            <Select
              value={settings.profile_visibility}
              onValueChange={(value: any) => updateSetting("profile_visibility", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público - Todos pueden ver</SelectItem>
                <SelectItem value="followers">Solo seguidores</SelectItem>
                <SelectItem value="private">Privado - Nadie puede ver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium">Qué mostrar en tu perfil</p>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_challenges" className="cursor-pointer">
                Mostrar retos
              </Label>
              <Switch
                id="show_challenges"
                checked={settings.show_challenges}
                onCheckedChange={(checked) => updateSetting("show_challenges", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_stats" className="cursor-pointer">
                Mostrar estadísticas
              </Label>
              <Switch
                id="show_stats"
                checked={settings.show_stats}
                onCheckedChange={(checked) => updateSetting("show_stats", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_achievements" className="cursor-pointer">
                Mostrar logros
              </Label>
              <Switch
                id="show_achievements"
                checked={settings.show_achievements}
                onCheckedChange={(checked) => updateSetting("show_achievements", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_followers" className="cursor-pointer">
                Mostrar seguidores
              </Label>
              <Switch
                id="show_followers"
                checked={settings.show_followers}
                onCheckedChange={(checked) => updateSetting("show_followers", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_activity" className="cursor-pointer">
                Mostrar actividad reciente
              </Label>
              <Switch
                id="show_activity"
                checked={settings.show_activity}
                onCheckedChange={(checked) => updateSetting("show_activity", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interacciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interacciones
          </CardTitle>
          <CardDescription>
            Controla quién puede interactuar contigo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Quién puede seguirte</Label>
            <Select
              value={settings.who_can_follow}
              onValueChange={(value: any) => updateSetting("who_can_follow", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Cualquier persona</SelectItem>
                <SelectItem value="no_one">Nadie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quién puede enviarte mensajes</Label>
            <Select
              value={settings.who_can_message}
              onValueChange={(value: any) => updateSetting("who_can_message", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Cualquier persona</SelectItem>
                <SelectItem value="followers">Solo a quienes sigues</SelectItem>
                <SelectItem value="no_one">Nadie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quién puede ver tus publicaciones</Label>
            <Select
              value={settings.who_can_see_posts}
              onValueChange={(value: any) => updateSetting("who_can_see_posts", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Cualquier persona</SelectItem>
                <SelectItem value="followers">Solo seguidores</SelectItem>
                <SelectItem value="private">Solo tú</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quién puede comentar en tus publicaciones</Label>
            <Select
              value={settings.who_can_comment}
              onValueChange={(value: any) => updateSetting("who_can_comment", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Cualquier persona</SelectItem>
                <SelectItem value="followers">Solo seguidores</SelectItem>
                <SelectItem value="no_one">Nadie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Controla qué notificaciones recibes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email_notifications" className="cursor-pointer">
              Notificaciones por email
            </Label>
            <Switch
              id="email_notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push_notifications" className="cursor-pointer">
              Notificaciones push
            </Label>
            <Switch
              id="push_notifications"
              checked={settings.push_notifications}
              onCheckedChange={(checked) => updateSetting("push_notifications", checked)}
            />
          </div>

          <Separator />

          <p className="text-sm font-medium">Notificarme cuando</p>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify_on_follow" className="cursor-pointer">
              Alguien me sigue
            </Label>
            <Switch
              id="notify_on_follow"
              checked={settings.notify_on_follow}
              onCheckedChange={(checked) => updateSetting("notify_on_follow", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify_on_like" className="cursor-pointer">
              Alguien da like a mi publicación
            </Label>
            <Switch
              id="notify_on_like"
              checked={settings.notify_on_like}
              onCheckedChange={(checked) => updateSetting("notify_on_like", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify_on_comment" className="cursor-pointer">
              Alguien comenta en mi publicación
            </Label>
            <Switch
              id="notify_on_comment"
              checked={settings.notify_on_comment}
              onCheckedChange={(checked) => updateSetting("notify_on_comment", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify_on_team_invite" className="cursor-pointer">
              Me invitan a un equipo
            </Label>
            <Switch
              id="notify_on_team_invite"
              checked={settings.notify_on_team_invite}
              onCheckedChange={(checked) => updateSetting("notify_on_team_invite", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify_on_challenge_update" className="cursor-pointer">
              Hay actualizaciones en mis retos
            </Label>
            <Switch
              id="notify_on_challenge_update"
              checked={settings.notify_on_challenge_update}
              onCheckedChange={(checked) =>
                updateSetting("notify_on_challenge_update", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Búsqueda y descubrimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda y Descubrimiento
          </CardTitle>
          <CardDescription>
            Controla cómo otros pueden encontrarte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="allow_search_by_email" className="cursor-pointer">
              Permitir búsqueda por email
            </Label>
            <Switch
              id="allow_search_by_email"
              checked={settings.allow_search_by_email}
              onCheckedChange={(checked) => updateSetting("allow_search_by_email", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allow_search_by_name" className="cursor-pointer">
              Permitir búsqueda por nombre
            </Label>
            <Switch
              id="allow_search_by_name"
              checked={settings.allow_search_by_name}
              onCheckedChange={(checked) => updateSetting("allow_search_by_name", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show_online_status" className="cursor-pointer">
              Mostrar estado en línea
            </Label>
            <Switch
              id="show_online_status"
              checked={settings.show_online_status}
              onCheckedChange={(checked) => updateSetting("show_online_status", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
