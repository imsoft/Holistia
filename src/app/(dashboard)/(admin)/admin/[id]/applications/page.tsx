"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  User,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";

interface ProfessionalApplication {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  experience: string;
  certifications: string[];
  services: any;
  address: string;
  city: string;
  state: string;
  country: string;
  biography?: string;
  profile_photo?: string;
  gallery?: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ProfessionalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ProfessionalApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const params = useParams();
  const supabase = createClient();

  const getStatusBadge = (status: string) => {
    let statusText, color;
    switch (status) {
      case 'approved':
        statusText = 'Aprobado';
        color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        break;
      case 'pending':
        statusText = 'Pendiente';
        color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        break;
      case 'under_review':
        statusText = 'En Revisión';
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
        break;
      case 'rejected':
        statusText = 'Rechazado';
        color = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        break;
      default:
        statusText = 'Desconocido';
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }

    return (
      <Badge className={color}>
        {statusText}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener el ID del usuario autenticado
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, [supabase]);

  // Obtener solicitudes de profesionales
  useEffect(() => {
    if (!userId) return; // Esperar a que se obtenga el userId
    
    const getApplications = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('professional_applications')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (error) {
          console.error('Error fetching applications:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          alert(`Error al cargar las solicitudes: ${error.message}`);
          return;
        }

        console.log('Applications fetched successfully:', data);
        setApplications(data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    getApplications();
  }, [supabase, userId]);

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setUpdating(true);
      
      // Verificar que el usuario actual sea admin
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Error de autenticación.');
        return;
      }

      const { error } = await supabase
        .from('professional_applications')
        .update({
          status: newStatus === 'approved' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: reviewNotes || null
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application:', error);
        alert('Error al actualizar la solicitud.');
        return;
      }

      // Actualizar el estado local
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              status: newStatus === 'approved' ? 'approved' : 'rejected',
              reviewed_at: new Date().toISOString(),
              reviewed_by: user.id,
              review_notes: reviewNotes || undefined
            }
          : app
      ));

      setReviewNotes("");
      alert(`Solicitud ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} exitosamente.`);
      
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error al actualizar la solicitud.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Solicitudes de Profesionales</h1>
          <p className="text-muted-foreground">
            Revisa y gestiona las solicitudes de profesionales de salud mental
            {applications.length > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({applications.length} solicitud{applications.length !== 1 ? 'es' : ''} encontrada{applications.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
      </div>

        <div className="grid gap-6">
          {applications.length === 0 ? (
          <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hay solicitudes</h3>
                <p className="text-muted-foreground text-center">
                  No se han encontrado solicitudes de profesionales en este momento.
                </p>
            </CardContent>
          </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow p-6">
                <CardHeader className="pb-6 px-0 pt-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {application.profile_photo && application.profile_photo.trim() !== '' ? (
                        <img 
                          src={application.profile_photo} 
                          alt={`${application.first_name} ${application.last_name}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-border"
                          onError={(e) => {
                            // Si la imagen falla al cargar, ocultar y mostrar el placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const placeholder = parent.querySelector('.profile-placeholder') as HTMLElement;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center ${application.profile_photo && application.profile_photo.trim() !== '' ? 'profile-placeholder hidden' : 'profile-placeholder'}`}
                      >
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {`${application.first_name} ${application.last_name}`}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {application.email}
                          </span>
                          {application.phone && (
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {application.phone}
                            </span>
                          )}
                        </CardDescription>
              </div>
              </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(application.status)}
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(application.submitted_at)}
                      </span>
              </div>
        </div>
          </CardHeader>
                <CardContent className="pt-6 px-0 pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Profesión</Label>
                      <p className="text-sm text-foreground mt-1">{application.profession}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Especializaciones</Label>
                      <p className="text-sm text-foreground mt-1">
                        {application.specializations?.join(', ') || 'No especificadas'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Ubicación</Label>
                      <p className="text-sm text-foreground flex items-center mt-1">
                        <MapPin className="h-5 w-5 mr-2" />
                        {application.city && application.state 
                          ? `${application.city}, ${application.state}` 
                          : application.address || 'No especificada'}
                      </p>
                    </div>
                  </div>
                      
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader className="pb-6">
                            <DialogTitle className="text-2xl font-bold">Detalles de la Solicitud</DialogTitle>
                            <div className="flex items-center space-x-3 pt-2">
                              <span className="text-sm text-muted-foreground">Solicitud de:</span>
                              <span className="font-semibold">{`${application.first_name} ${application.last_name}`}</span>
                              {getStatusBadge(application.status)}
                            </div>
                          </DialogHeader>
                          <div className="space-y-8">
                            {/* Información Personal */}
                            <div className="bg-muted/30 rounded-lg p-6">
                              <h3 className="text-2xl font-bold mb-6 flex items-center">
                                <User className="h-6 w-6 mr-3" />
                                Información Personal
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Nombre completo</Label>
                                  <p className="text-base font-medium">{`${application.first_name} ${application.last_name}`}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                  <p className="text-base">{application.email}</p>
                                </div>
                                {application.phone && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                                    <p className="text-base">{application.phone}</p>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Ubicación</Label>
                                  <p className="text-base flex items-center">
                                    <MapPin className="h-5 w-5 mr-2" />
                                    {application.address && `${application.address}, `}
                                    {application.city && `${application.city}, `}
                                    {application.state && `${application.state}`}
                                    {!application.address && !application.city && !application.state && 'No especificada'}
                                  </p>
                                </div>
                              </div>
                            </div>
                        
                            {/* Información Profesional */}
                            <div className="bg-muted/30 rounded-lg p-6">
                              <h3 className="text-2xl font-bold mb-6 flex items-center">
                                <FileText className="h-6 w-6 mr-3" />
                                Información Profesional
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Profesión</Label>
                                  <p className="text-base font-medium">{application.profession}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                                  <div className="flex items-center">
                                    {getStatusBadge(application.status)}
                                  </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Especializaciones</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {application.specializations?.length ? (
                                      application.specializations.map((spec, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {spec}
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-base text-muted-foreground">No especificadas</p>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Experiencia</Label>
                                  <p className="text-base leading-relaxed">{application.experience}</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Certificaciones</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {application.certifications?.length ? (
                                      application.certifications.map((cert, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {cert}
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-base text-muted-foreground">No especificadas</p>
                                    )}
                                  </div>
                                </div>
                                {application.biography && (
                                  <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Biografía</Label>
                                    <p className="text-base leading-relaxed bg-background/50 rounded-md p-4 border">
                                      {application.biography}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>


                            {/* Notas de Revisión */}
                            <div className="bg-muted/30 rounded-lg p-6">
                              <h3 className="text-2xl font-bold mb-6 flex items-center">
                                <FileText className="h-6 w-6 mr-3" />
                                Notas de Revisión
                              </h3>
                              <div className="space-y-3">
                                <Label htmlFor="reviewNotes" className="text-sm font-medium text-muted-foreground">
                                  Comentarios sobre la decisión
                                </Label>
                                <Textarea
                                  id="reviewNotes"
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Agrega notas sobre tu decisión de aprobación o rechazo..."
                                  rows={4}
                                  className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Estas notas serán guardadas junto con la decisión y podrán ser consultadas posteriormente.
                                </p>
                              </div>
                            </div>
                      </div>
                        </DialogContent>
                      </Dialog>
                  </div>
                  
                    {(application.status === 'pending' || application.status === 'under_review') && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(application.id, 'approved')}
                          disabled={updating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          disabled={updating}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}