"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Question {
  id: string;
  question: string;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  answer?: {
    id: string;
    answer: string;
    is_admin_answer: boolean;
    is_professional_answer: boolean;
    created_at: string;
    answered_by: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
}

interface EventQuestionsSectionProps {
  eventId: string;
  currentUserId?: string;
  isAdmin?: boolean;
  isProfessional?: boolean;
}

export function EventQuestionsSection({
  eventId,
  currentUserId,
  isAdmin = false,
  isProfessional = false,
}: EventQuestionsSectionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    fetchQuestions();
  }, [eventId]);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/questions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar preguntas");
      }

      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Error al cargar las preguntas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para hacer una pregunta");
      return;
    }

    if (!newQuestion.trim()) {
      toast.error("Por favor escribe una pregunta");
      return;
    }

    try {
      setSubmittingQuestion(true);

      const response = await fetch(`/api/events/${eventId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: newQuestion.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la pregunta");
      }

      toast.success("Pregunta publicada exitosamente");
      setNewQuestion("");
      fetchQuestions();
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear la pregunta"
      );
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const answerText = answerTexts[questionId]?.trim();

    if (!answerText) {
      toast.error("Por favor escribe una respuesta");
      return;
    }

    try {
      setSubmittingAnswer(questionId);

      const response = await fetch(
        `/api/events/${eventId}/questions/${questionId}/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answer: answerText }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al responder la pregunta");
      }

      toast.success("Respuesta publicada exitosamente");
      setAnswerTexts((prev) => ({ ...prev, [questionId]: "" }));
      fetchQuestions();
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al responder la pregunta"
      );
    } finally {
      setSubmittingAnswer(null);
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const canAnswer = isAdmin || isProfessional;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Preguntas y Respuestas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulario para hacer pregunta */}
        {isAuthenticated && (
          <form onSubmit={handleSubmitQuestion} className="space-y-3">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Haz una pregunta sobre este evento..."
              className="min-h-[100px]"
              maxLength={500}
              disabled={submittingQuestion}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {newQuestion.length}/500 caracteres
              </p>
              <Button
                type="submit"
                disabled={submittingQuestion || !newQuestion.trim()}
                size="sm"
              >
                {submittingQuestion ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publicar Pregunta
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {!isAuthenticated && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <a href="/login" className="text-primary hover:underline">
                Inicia sesión
              </a>{" "}
              para hacer preguntas sobre este evento.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Lista de preguntas */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay preguntas aún. ¡Sé el primero en preguntar!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-4">
                {/* Pregunta */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={question.user.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {getUserInitials(
                          question.user.first_name,
                          question.user.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">
                          {question.user.first_name} {question.user.last_name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(question.created_at),
                            {
                              addSuffix: true,
                              locale: es,
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {question.question}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Respuesta existente */}
                {question.answer && (
                  <div className="ml-13 space-y-2 pl-4 border-l-2 border-primary/20">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={question.answer.answered_by.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {getUserInitials(
                            question.answer.answered_by.first_name,
                            question.answer.answered_by.last_name
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">
                            {question.answer.answered_by.first_name}{" "}
                            {question.answer.answered_by.last_name}
                          </p>
                          {(question.answer.is_admin_answer ||
                            question.answer.is_professional_answer) && (
                            <Badge
                              variant={
                                question.answer.is_admin_answer
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {question.answer.is_admin_answer
                                ? "Administrador"
                                : "Profesional"}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(question.answer.created_at),
                              {
                                addSuffix: true,
                                locale: es,
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">
                          {question.answer.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulario para responder (solo admin/profesional) */}
                {!question.answer && canAnswer && (
                  <div className="ml-13 space-y-2 pl-4 border-l-2 border-muted">
                    <Textarea
                      value={answerTexts[question.id] || ""}
                      onChange={(e) =>
                        setAnswerTexts((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                      placeholder="Escribe tu respuesta..."
                      className="min-h-[80px] text-sm"
                      maxLength={1000}
                      disabled={submittingAnswer === question.id}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {(answerTexts[question.id] || "").length}/1000 caracteres
                      </p>
                      <Button
                        onClick={() => handleSubmitAnswer(question.id)}
                        disabled={
                          submittingAnswer === question.id ||
                          !answerTexts[question.id]?.trim()
                        }
                        size="sm"
                      >
                        {submittingAnswer === question.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Respondiendo...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Responder
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
