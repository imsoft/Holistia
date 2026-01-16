"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, CreditCard } from "lucide-react";
import Image from "next/image";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function ChallengeCheckoutPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const userId = useUserId();
  const slugParam = params.slug as string;
  const supabase = createClient();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [slugParam]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      
      // Primero intentar buscar por slug
      let { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          professional_applications(
            id,
            slug,
            first_name,
            last_name,
            stripe_account_id,
            stripe_charges_enabled,
            stripe_payouts_enabled
          )
        `)
        .eq('slug', slugParam)
        .single();

      // Si no encuentra por slug, intentar por ID (compatibilidad hacia atrás)
      if (error || !data) {
        const { data: dataById, error: errorById } = await supabase
          .from('challenges')
          .select(`
            *,
            professional_applications(
              id,
              slug,
              first_name,
              last_name,
              stripe_account_id,
              stripe_charges_enabled,
              stripe_payouts_enabled
            )
          `)
          .eq('id', slugParam)
          .single();
        
        if (!errorById && dataById) {
          data = dataById;
          error = null;
        }
      }

      if (error) throw error;

      if (!data.price || data.price <= 0) {
        toast.error("Este reto es gratuito");
        router.push(`/explore/challenge/${data.slug || slugParam}`);
        return;
      }

      setChallenge(data);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      toast.error("Error al cargar el reto");
      router.push(`/explore`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Verificar si ya está participando
      const { data: existingParticipation } = await supabase
        .from('challenge_purchases')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('participant_id', user.id)
        .maybeSingle();

      if (existingParticipation) {
        toast.info("Ya estás participando en este reto");
        router.push(`/my-challenges`);
        return;
      }

      // Crear sesión de checkout con Stripe
      const response = await fetch('/api/stripe/challenge-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challenge.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear sesión de pago");
      }

      // Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió URL de checkout");
      }
    } catch (error) {
      console.error("Error processing checkout:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al procesar el pago"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  const professional = challenge.professional_applications;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/explore/challenge/${challenge?.slug || slugParam}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del reto */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Reto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {challenge.cover_image_url && (
                  <div className="relative h-48 w-full rounded-lg overflow-hidden">
                    <Image
                      src={challenge.cover_image_url}
                      alt={challenge.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{challenge.title}</h2>
                  {challenge.description && (
                    <p className="text-muted-foreground line-clamp-3">
                      {challenge.description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}
                </div>
                {professional && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Creado por</p>
                      <p className="font-semibold">
                        {professional.first_name} {professional.last_name}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen de pago */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reto</span>
                    <span className="font-semibold">{challenge.title}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>
                      ${challenge.price} {challenge.currency || 'MXN'}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={processing || !professional?.stripe_account_id}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceder al Pago
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground font-semibold text-center">
                  ⚠️ No hay reembolsos
                </p>

                {!professional?.stripe_account_id && (
                  <p className="text-xs text-muted-foreground text-center">
                    El profesional no tiene configurado el método de pago
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
