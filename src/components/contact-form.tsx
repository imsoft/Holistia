"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PhoneInput } from '@/components/ui/phone-input';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useContactForm } from '@/hooks/use-contact-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const {
    formData,
    loading,
    success,
    error,
    updateField,
    submitForm,
    resetForm,
  } = useContactForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  // Mostrar mensaje de éxito
  if (success) {
    toast.success('¡Mensaje enviado exitosamente! Te contactaremos pronto.');
  }

  // Mostrar mensaje de error
  if (error) {
    toast.error(error);
  }

  return (
    <Card className={cn("flex flex-col min-h-0", className)}>
      <CardContent className="flex flex-1 flex-col min-h-0 p-4 sm:p-6 lg:p-8">
        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              ¡Mensaje Enviado!
            </h3>
            <p className="text-muted-foreground mb-4">
              Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.
            </p>
            <Button
              onClick={resetForm}
              variant="outline"
              className="mt-4"
            >
              Enviar Otro Mensaje
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 gap-4 sm:gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 shrink-0">
              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="mt-2"
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="mt-2"
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="shrink-0">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="shrink-0">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <PhoneInput
                id="phone"
                name="phone"
                className="mt-2"
                placeholder="33 1234 5678"
                defaultCountryCode="+52"
                value={formData.phone}
                onChange={(value) => updateField('phone', value)}
                disabled={loading}
              />
            </div>
            
            <div className="shrink-0">
              <Label htmlFor="subject">Asunto *</Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                required
                className="mt-2"
                placeholder="¿En qué podemos ayudarte?"
                value={formData.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="flex flex-1 flex-col min-h-[140px]">
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                name="message"
                required
                className="mt-2 flex-1 min-h-[140px] resize-y"
                placeholder="Cuéntanos más detalles sobre tu consulta..."
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="flex shrink-0 items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full shrink-0" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensaje
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
