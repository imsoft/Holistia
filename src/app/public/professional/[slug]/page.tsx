"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  MessageCircle,
  Monitor,
  Users,
  Calendar,
  Share2,
  Award,
  Languages,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MapboxMap from "@/components/ui/mapbox-map";
import ProfessionalGallery from "@/components/ui/professional-gallery";
import { createClient } from "@/utils/supabase/client";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { StarRating } from "@/components/reviews/star-rating";
import type { ReviewStats } from "@/types/review";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { DigitalProductCard } from "@/components/ui/digital-product-card";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { use } from "react";

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  languages?: string[];
  experience: string;
  certifications: string[];
  services: Array<{
    id?: string;
    name: string;
    description: string;
    presencialCost: string;
    onlineCost: string;
    pricing_type?: "fixed" | "quote";
    image_url?: string;
  }>;
  address: string;
  city: string;
  state: string;
  country: string;
  biography?: string;
  profile_photo?: string;
  gallery: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  is_verified?: boolean;
  working_start_time?: string;
  working_end_time?: string;
  working_days?: number[];
}

export default function PublicProfessionalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Extraer ID del profesional del slug
  const uuidMatch = slug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const professionalId = uuidMatch ? uuidMatch[0] : slug;

  // Verificar si hay usuario autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    checkAuth();
  }, [supabase]);

  // Obtener datos del profesional
  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);

        // Obtener profesional por ID
        const { data: professionalData, error } = await supabase
          .from('professional_applications')
          .select('*')
          .eq('id', professionalId)
          .eq('status', 'approved')
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        if (!professionalData) {
          setLoading(false);
          return;
        }

        // Obtener servicios usando la función RPC
        const { data: servicesData, error: servicesError } = await supabase
          .rpc('get_professional_services', { p_professional_id: professionalId });

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        }

        const processedServices: Professional['services'] = [];
        const servicesMap = new Map<string, Professional['services'][0]>();

        // Procesar servicios nuevos
        if (servicesData && Array.isArray(servicesData)) {
          servicesData.forEach((service: any) => {
            const serviceObj: Professional['services'][0] = {
              id: service.id,
              name: service.name,
              description: service.description || '',
              presencialCost: '',
              onlineCost: '',
              pricing_type: service.pricing_type || 'fixed',
              image_url: service.image_url || undefined
            };

            if (service.pricing_type === 'fixed' && service.cost) {
              const costStr = service.cost.toString();
              if (service.modality === 'presencial' || service.modality === 'both') {
                serviceObj.presencialCost = costStr;
              }
              if (service.modality === 'online' || service.modality === 'both') {
                serviceObj.onlineCost = costStr;
              }
            }

            servicesMap.set(service.name, serviceObj);
          });
        }

        processedServices.push(...Array.from(servicesMap.values()));

        // Obtener estadísticas de reseñas
        const { data: statsData } = await supabase
          .from('professional_review_stats')
          .select('*')
          .eq('professional_id', professionalId)
          .maybeSingle();

        setReviewStats(statsData || null);

        // Obtener programas digitales
        const { data: productsData } = await supabase
          .from('digital_products')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        setDigitalProducts(productsData || []);

        // Obtener retos
        const { data: challengesData } = await supabase
          .from('challenges')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        setChallenges(challengesData || []);

        const professionalObj: Professional = {
          ...professionalData,
          services: processedServices,
          specializations: professionalData.specializations || [],
          certifications: professionalData.certifications || [],
          languages: professionalData.languages || [],
          gallery: professionalData.gallery || [],
        };

        setProfessional(professionalObj);
      } catch (error) {
        console.error('Error fetching professional:', error);
        toast.error('Error al cargar el perfil del profesional');
      } finally {
        setLoading(false);
      }
    };

    if (professionalId) {
      getData();
    }
  }, [professionalId, supabase]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/public/professional/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace copiado al portapapeles');
    } catch (error) {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleAction = (action: 'book' | 'message' | 'quote', serviceId?: string) => {
    if (!currentUserId) {
      const redirectUrl = `/login?redirect=/public/professional/${slug}`;
      router.push(redirectUrl);
      return;
    }

    if (action === 'book') {
      router.push(`/patient/${currentUserId}/explore/professional/${professionalId}`);
    } else if (action === 'message') {
      router.push(`/patient/${currentUserId}/explore/professional/${professionalId}`);
    } else if (action === 'quote') {
      router.push(`/patient/${currentUserId}/explore/professional/${professionalId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profesional no encontrado</h1>
          <p className="text-muted-foreground mb-4">El profesional que buscas no existe o no está disponible.</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="shrink-0">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
                {professional.profile_photo ? (
                  <Image
                    src={professional.profile_photo}
                    alt={`${professional.first_name} ${professional.last_name}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Users className="w-16 h-16 text-primary/50" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                    {professional.first_name} {professional.last_name}
                    {professional.is_verified && <VerifiedBadge size={24} />}
                  </h1>
                  <p className="text-xl text-muted-foreground mb-4">{professional.profession}</p>
                  {reviewStats && (
                    <div className="flex items-center gap-2 mb-4">
                      <StarRating rating={reviewStats.average_rating} size="md" />
                      <span className="text-sm text-muted-foreground">
                        ({reviewStats.total_reviews} {reviewStats.total_reviews === 1 ? 'reseña' : 'reseñas'})
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {professional.specializations && professional.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {professional.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {professional.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{professional.city}, {professional.state}</span>
                  </div>
                )}
                {professional.languages && professional.languages.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Languages className="w-4 h-4" />
                    <span>{professional.languages.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Biography */}
        {professional.biography && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Sobre mí</h2>
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: professional.biography }}
            />
          </div>
        )}

        {/* Services */}
        {professional.services && professional.services.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Servicios</h2>
            <div className="space-y-4">
              {professional.services.map((service, index) => {
                const isQuote = service.pricing_type === 'quote';
                const hasPresencial = !isQuote && service.presencialCost && service.presencialCost !== '' && service.presencialCost !== '0' && Number(service.presencialCost) > 0;
                const hasOnline = !isQuote && service.onlineCost && service.onlineCost !== '' && service.onlineCost !== '0' && Number(service.onlineCost) > 0;

                return (
                  <div key={index} className="rounded-xl bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-[25%_1fr] gap-0">
                      {service.image_url && (
                        <div className="relative w-full h-48 sm:h-full min-h-[200px] bg-muted">
                          <Image
                            src={service.image_url}
                            alt={service.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 sm:p-6">
                        <h3 className="text-foreground font-semibold text-lg sm:text-xl mb-2">
                          {service.name}
                        </h3>
                        {service.description && (
                          <div
                            className="text-sm text-muted-foreground mb-4 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: service.description }}
                          />
                        )}
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {isQuote ? (
                            <Button
                              onClick={() => handleAction('quote', service.id)}
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              Solicitar Cotización
                            </Button>
                          ) : (
                            <>
                              {hasPresencial && (
                                <Button
                                  onClick={() => handleAction('book')}
                                  className="flex items-center gap-2"
                                >
                                  <Users className="h-4 w-4" />
                                  Presencial: {formatPrice(parseInt(service.presencialCost))}
                                  <Calendar className="h-4 w-4 ml-1" />
                                </Button>
                              )}
                              {hasOnline && (
                                <Button
                                  onClick={() => handleAction('book')}
                                  className="flex items-center gap-2"
                                >
                                  <Monitor className="h-4 w-4" />
                                  En línea: {formatPrice(parseInt(service.onlineCost))}
                                  <Calendar className="h-4 w-4 ml-1" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gallery */}
        {professional.gallery && professional.gallery.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Galería</h2>
            <ProfessionalGallery 
              images={professional.gallery} 
              professionalName={`${professional.first_name} ${professional.last_name}`}
            />
          </div>
        )}

        {/* Reviews */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Reseñas</h2>
          <ReviewsList professionalId={professionalId} />
        </div>

        {/* Digital Products */}
        {digitalProducts.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Programas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {digitalProducts.map((product) => (
                <DigitalProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        )}

        {/* Challenges */}
        {challenges.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Retos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  userId={currentUserId || undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleAction('book')}
              size="lg"
              className="flex-1"
            >
              <Calendar className="w-5 h-5 mr-2" />
              {currentUserId ? 'Agendar Cita' : 'Inicia sesión para agendar'}
            </Button>
            <Button
              onClick={() => handleAction('message')}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {currentUserId ? 'Enviar Mensaje' : 'Inicia sesión para mensajear'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
