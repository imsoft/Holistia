"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Mail,
  Search,
  Send,
  CheckCircle,
  AlertCircle,
  User,
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profession: string;
  status: string;
  created_at: string;
}

interface EmailData {
  professional_email: string;
  professional_name: string;
  profession: string;
  message: string;
  admin_name: string;
}

export default function CertificationsPage() {
  const params = useParams();
  const adminId = params.id as string;
  const { profile } = useProfile();
  const supabase = createClient();
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Cargar profesionales aprobados
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, email, profession, status, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching professionals:', error);
          toast.error('Error al cargar profesionales');
          return;
        }

        setProfessionals(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [supabase]);

  // Filtrar profesionales por término de búsqueda
  const filteredProfessionals = professionals.filter(prof => 
    prof.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${prof.first_name} ${prof.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mensaje por defecto
  const defaultMessage = `Estimado/a ${selectedProfessional?.first_name || '[Nombre]'},

Nos complace informarle que hemos recibido exitosamente sus documentos de certificaciones profesionales.

Sus credenciales han sido verificadas y están en orden. Esto significa que su perfil profesional en Holistia está completamente actualizado y listo para recibir pacientes.

Si tiene alguna pregunta o necesita asistencia adicional, no dude en contactarnos.

¡Gracias por ser parte de la comunidad Holistia!

Atentamente,
El equipo de Holistia`;

  // Enviar email de certificaciones
  const handleSendEmail = async () => {
    if (!selectedProfessional) {
      toast.error('Por favor selecciona un profesional');
      return;
    }

    try {
      setSending(true);

      const emailData: EmailData = {
        professional_email: selectedProfessional.email,
        professional_name: `${selectedProfessional.first_name} ${selectedProfessional.last_name}`,
        profession: selectedProfessional.profession,
        message: customMessage || defaultMessage,
        admin_name: profile?.first_name ? `${profile.first_name} ${profile.last_name}` : 'Administrador',
      };

      const response = await fetch('/api/admin/send-certification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Email enviado exitosamente');
        setEmailSent(true);
        setCustomMessage("");
        setSelectedProfessional(null);
      } else {
        toast.error(result.error || 'Error al enviar el email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error al enviar el email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Certificaciones</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enviar confirmación de certificaciones recibidas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Selección de Profesional */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seleccionar Profesional
            </CardTitle>
            <CardDescription>
              Busca y selecciona el profesional al que deseas enviar la confirmación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, email o profesión..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de Profesionales */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Cargando profesionales...
                </div>
              ) : filteredProfessionals.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {searchTerm ? 'No se encontraron profesionales' : 'No hay profesionales aprobados'}
                </div>
              ) : (
                filteredProfessionals.map((professional) => (
                  <div
                    key={professional.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProfessional?.id === professional.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedProfessional(professional)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {professional.first_name} {professional.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {professional.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {professional.profession}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {new Date(professional.created_at).toLocaleDateString('es-ES')}
                          </Badge>
                        </div>
                      </div>
                      {selectedProfessional?.id === professional.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Email */}
        {selectedProfessional && (
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Confirmación de Certificaciones
              </CardTitle>
              <CardDescription>
                Enviar confirmación a {selectedProfessional.first_name} {selectedProfessional.last_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información del Profesional */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Profesional Seleccionado:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="ml-2 font-medium">
                      {selectedProfessional.first_name} {selectedProfessional.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2 font-medium">{selectedProfessional.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profesión:</span>
                    <span className="ml-2 font-medium">{selectedProfessional.profession}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant="outline" className="ml-2">
                      {selectedProfessional.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mensaje Personalizado */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje (opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Personaliza el mensaje o deja vacío para usar el mensaje por defecto"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Si no personalizas el mensaje, se enviará el mensaje estándar de confirmación.
                </p>
              </div>

              {/* Vista Previa del Mensaje */}
              <div className="space-y-2">
                <Label>Vista Previa del Mensaje:</Label>
                <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {customMessage || defaultMessage}
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Confirmación
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProfessional(null);
                    setCustomMessage("");
                    setEmailSent(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>

              {emailSent && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Email enviado exitosamente a {selectedProfessional.email}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
