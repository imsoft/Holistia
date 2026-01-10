"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Bot,
  Send,
  User,
  Loader2,
  Trash2,
  Sparkles,
  DollarSign,
  Zap,
  MessageSquare,
  Target,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  professionals?: RecommendedProfessional[];
  challenges?: RecommendedChallenge[];
  events?: RecommendedEvent[];
  recommendations?: Recommendation[];
}

interface RecommendedProfessional {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  email: string;
  phone?: string;
  profile_photo?: string;
  score?: number;
  reason?: string;
}

interface RecommendedChallenge {
  id: string;
  title: string;
  score?: number;
  reason?: string;
}

interface RecommendedEvent {
  id: string;
  name: string;
  score?: number;
  reason?: string;
}

interface Recommendation {
  type: 'professional' | 'challenge' | 'event';
  id: string;
  first_name?: string;
  last_name?: string;
  profession?: string;
  title?: string;
  name?: string;
  email?: string;
  phone?: string;
  profile_photo?: string;
  score?: number;
  reason?: string;
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [professionals, setProfessionals] = useState<RecommendedProfessional[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Cargar profesionales, challenges y eventos al inicio
  useEffect(() => {
    fetchProfessionals();
    fetchChallenges();
    fetchEvents();
  }, []);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProfessionals = async () => {
    try {
      // Obtener profesionales aprobados, activos y con inscripción pagada
      const { data: professionalsData, error } = await supabase
        .from("professional_applications")
        .select("id, first_name, last_name, profession, email, phone, user_id, profile_photo, specializations, wellness_areas, biography, services")
        .eq("status", "approved")
        .eq("is_active", true)
        .eq("registration_fee_paid", true)
        .gt("registration_fee_expires_at", new Date().toISOString());

      if (error) throw error;

      console.log("📊 Profesionales obtenidos:", professionalsData?.length);

      // Obtener avatares de profiles
      const userIds = professionalsData?.map(p => p.user_id).filter(Boolean) || [];
      console.log("👥 User IDs para buscar avatares:", userIds);

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", userIds);

      console.log("🖼️ Profiles con avatares encontrados:", profilesData);

      // Combinar datos: mapear avatar_url a profile_photo
      const mappedData = professionalsData?.map((prof) => {
        const profile = profilesData?.find(p => p.id === prof.user_id);
        const photoUrl = profile?.avatar_url || prof.profile_photo;

        console.log(`👤 ${prof.first_name} ${prof.last_name}:`, {
          user_id: prof.user_id,
          avatar_url: profile?.avatar_url,
          profile_photo: prof.profile_photo,
          final_photo: photoUrl,
          specializations: prof.specializations,
          wellness_areas: prof.wellness_areas
        });

        return {
          id: prof.id,
          first_name: prof.first_name,
          last_name: prof.last_name,
          profession: prof.profession,
          email: prof.email,
          phone: prof.phone,
          profile_photo: photoUrl,
          specializations: prof.specializations || [],
          wellness_areas: prof.wellness_areas || [],
          biography: prof.biography || '',
          services: prof.services || []
        };
      }) || [];

      console.log("✅ Datos finales mapeados:", mappedData);
      setProfessionals(mappedData);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Error al cargar profesionales");
    }
  };

  const fetchChallenges = async () => {
    try {
      const { data: challengesData, error } = await supabase
        .from("challenges")
        .select("id, title, description, short_description, category, difficulty_level, duration_days, wellness_areas, created_by_type")
        .eq("is_active", true);

      if (error) throw error;

      console.log("📋 Challenges obtenidos:", challengesData?.length);
      setChallenges(challengesData || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Error al cargar retos");
    }
  };

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from("events_workshops")
        .select("id, name, description, category, location, event_date, event_time, price, is_free, participant_level, professional_id")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().split('T')[0]); // Solo eventos futuros

      if (error) throw error;

      console.log("📅 Eventos obtenidos:", eventsData?.length);
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Error al cargar eventos");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-agent/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: inputValue,
          professionals: professionals,
          challenges: challenges,
          events: events,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      // Separar recomendaciones por tipo
      const recommendations = data.recommendations || [];
      const professionalRecs = recommendations.filter((r: Recommendation) => r.type === 'professional') as RecommendedProfessional[];
      const challengeRecs = recommendations.filter((r: Recommendation) => r.type === 'challenge') as RecommendedChallenge[];
      const eventRecs = recommendations.filter((r: Recommendation) => r.type === 'event') as RecommendedEvent[];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        professionals: professionalRecs,
        challenges: challengeRecs,
        events: eventRecs,
        recommendations: recommendations,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Actualizar estadísticas si están disponibles
      if (data.usage) {
        setTotalTokens((prev) => prev + data.usage.total_tokens);
        // Costo aproximado para gpt-4o-mini: $0.15 / 1M input tokens, $0.60 / 1M output tokens
        const inputCost = (data.usage.prompt_tokens / 1000000) * 0.15;
        const outputCost = (data.usage.completion_tokens / 1000000) * 0.60;
        setTotalCost((prev) => prev + inputCost + outputCost);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Error al enviar mensaje");

      // Mensaje de error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setTotalTokens(0);
    setTotalCost(0);
    toast.success("Conversación limpiada");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Agente IA - Recomendador</h1>
                <p className="text-sm text-muted-foreground">
                  Prueba el sistema de recomendaciones con ChatGPT
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Bot className="w-3 h-3" />
              {professionals.length} profesionales, {challenges.length} retos, {events.length} eventos
            </Badge>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearChat}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar chat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chat Panel */}
          <Card className="h-[calc(100vh-12rem)] py-4 flex flex-col flex-1 lg:flex-[2]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5" />
              Conversación con el Agente IA
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">¡Hola! Soy tu asistente de recomendaciones</h3>
                  <p className="text-muted-foreground max-w-md">
                    Cuéntame qué <strong>dolor o síntoma</strong> tienes, o qué <strong>objetivo de mejora</strong> quieres lograr, 
                    y te ayudaré a encontrar los mejores profesionales, programas y eventos de nuestra plataforma.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue("Tengo ansiedad y necesito ayuda")}
                  >
                    Ansiedad
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue("Quiero perder peso y mejorar mi alimentación")}
                  >
                    Perder peso
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue("Tengo dolor de espalda crónico")}
                  >
                    Dolor de espalda
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue("Quiero aprender a meditar y mejorar mi bienestar espiritual")}
                  >
                    Meditación
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue("Necesito mejorar mis relaciones interpersonales")}
                  >
                    Relaciones
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 mt-1 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      {/* Mostrar recomendaciones */}
                      {((message.professionals?.length || 0) + (message.challenges?.length || 0) + (message.events?.length || 0)) > 0 && (
                        <div className="mt-4 space-y-4">
                          {/* Profesionales recomendados */}
                          {message.professionals && message.professionals.length > 0 && (
                            <div className="space-y-4">
                              <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                                <User className="w-3 h-3" />
                                Profesionales recomendados:
                              </p>
                              {message.professionals.map((prof) => {
                                // Buscar el profesional completo en la lista para obtener todos los datos correctos
                                const fullProf = professionals.find(p => p.id === prof.id);
                                // Usar datos del profesional completo si está disponible, sino usar los de la recomendación
                                const displayProf = fullProf || prof;
                                const profilePhoto = displayProf.profile_photo;
                                // Obtener especialidades del profesional completo
                                const specializations = (fullProf as any)?.specializations || [];
                                
                                return (
                                <Link
                                  key={prof.id}
                                  href={user?.id ? `/patient/${user.id}/explore/professional/${prof.id}` : `/login?redirect=/explore/professional/${prof.id}`}
                                  target="_blank"
                                >
                                  <Card className="p-3 bg-background hover:bg-muted/50 transition-colors cursor-pointer mb-4">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0">
                                        <Image
                                          src={profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${displayProf.first_name} ${displayProf.last_name}`)}&background=random&size=96`}
                                          alt={`${displayProf.first_name} ${displayProf.last_name}`}
                                          width={48}
                                          height={48}
                                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                                          unoptimized
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">
                                              {displayProf.first_name} {displayProf.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{displayProf.profession}</p>
                                          </div>
                                          {prof.score !== undefined && (
                                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                                              {Math.round(prof.score * 100)}%
                                            </Badge>
                                          )}
                                        </div>
                                        {/* Mostrar especialidades */}
                                        {specializations && specializations.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {specializations.slice(0, 3).map((spec: string, idx: number) => (
                                              <span
                                                key={idx}
                                                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                              >
                                                {spec}
                                              </span>
                                            ))}
                                            {specializations.length > 3 && (
                                              <span className="text-xs text-muted-foreground">
                                                +{specializations.length - 3} más
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                </Link>
                                );
                              })}
                            </div>
                          )}

                          {/* Retos/Challenges recomendados */}
                          {message.challenges && message.challenges.length > 0 && (
                            <div className="space-y-4">
                              <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                Retos recomendados:
                              </p>
                              {message.challenges.map((challenge) => (
                                <Link
                                  key={challenge.id}
                                  href={user?.id ? `/patient/${user.id}/explore/challenge/${challenge.id}` : `/explore/challenge/${challenge.id}`}
                                  target="_blank"
                                >
                                  <Card className="p-3 bg-background hover:bg-muted/50 transition-colors cursor-pointer mb-4">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">
                                          {challenge.title}
                                        </p>
                                        {challenge.reason && (
                                          <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                                            &quot;{challenge.reason}&quot;
                                          </p>
                                        )}
                                      </div>
                                      {challenge.score !== undefined && (
                                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                                          {Math.round(challenge.score * 100)}%
                                        </Badge>
                                      )}
                                    </div>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          )}

                          {/* Eventos recomendados */}
                          {message.events && message.events.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                Eventos recomendados:
                              </p>
                              {message.events.map((event) => (
                                <Link
                                  key={event.id}
                                  href={user?.id ? `/patient/${user.id}/explore/event/${event.id}` : `/explore/event/${event.id}`}
                                  target="_blank"
                                >
                                  <Card className="p-3 bg-background hover:bg-muted/50 transition-colors cursor-pointer mb-4">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">
                                          {event.name}
                                        </p>
                                        {event.reason && (
                                          <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                                            &quot;{event.reason}&quot;
                                          </p>
                                        )}
                                      </div>
                                      {event.score !== undefined && (
                                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                                          {Math.round(event.score * 100)}%
                                        </Badge>
                                      )}
                                    </div>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 mt-1 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 mt-1 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Analizando...</p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe tu consulta aquí..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Presiona Enter para enviar • Shift + Enter para nueva línea
            </p>
          </div>
        </Card>

        {/* Panel de Estadísticas */}
        <div className="space-y-4 lg:h-[calc(100vh-12rem)] overflow-y-auto flex-1 lg:max-w-[320px]">
          {/* Estadísticas de Tokens */}
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Modelo */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Modelo</p>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">GPT-4o Mini</p>
                </div>
              </div>

              {/* Tokens */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tokens usados</p>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {messages.length} mensajes
                </p>
              </div>

              {/* Costo */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Costo aproximado</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <p className="text-2xl font-bold">
                    ${totalCost.toFixed(4)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>

              {/* Promedio por mensaje */}
              {messages.length > 0 && (
                <div className="pt-3 border-t space-y-1">
                  <p className="text-xs text-muted-foreground">Promedio por mensaje</p>
                  <p className="text-sm font-medium">
                    {Math.round(totalTokens / messages.length)} tokens
                  </p>
                  <p className="text-sm font-medium">
                    ${(totalCost / messages.length).toFixed(4)} USD
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del modelo */}
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Información del modelo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="font-medium mb-1">GPT-4o Mini</p>
                <p className="text-muted-foreground">
                  Modelo optimizado para tareas rápidas y económicas
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Costos:</p>
                <ul className="text-muted-foreground space-y-0.5 ml-2">
                  <li>• Input: $0.15 / 1M tokens</li>
                  <li>• Output: $0.60 / 1M tokens</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Límite de contexto:</p>
                <p className="text-muted-foreground">128K tokens</p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
