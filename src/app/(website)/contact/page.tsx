import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageCircle,
  Send
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contáctanos - Holistia",
  description: "Ponte en contacto con el equipo de Holistia. Estamos aquí para ayudarte con cualquier pregunta sobre nuestros servicios de salud integral.",
};

const contactMethods = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Respuesta inmediata",
    contact: "+52 33 3173 3702",
    href: "https://wa.me/523331733702?text=¡Hola!%20Me%20gustaría%20conocer%20más%20sobre%20Holistia%20y%20sus%20servicios%20de%20salud%20integral.%20¿Podrían%20ayudarme%20con%20más%20información?",
    action: "Enviar mensaje"
  },
  {
    icon: Mail,
    title: "Email",
    description: "Respuesta en 24 horas",
    contact: "hola@holistia.io",
    href: "mailto:hola@holistia.io",
    action: "Enviar email"
  },
  {
    icon: Phone,
    title: "Teléfono",
    description: "Lunes a Viernes 9:00 - 18:00",
    contact: "+52 33 3173 3702",
    href: "tel:+523331733702",
    action: "Llamar"
  }
];

const faqs = [
  {
    question: "¿Cómo puedo agendar una cita?",
    answer: "Puedes agendar una cita fácilmente desde nuestra plataforma. Simplemente regístrate, busca el profesional que necesites y selecciona el horario que mejor te convenga."
  },
  {
    question: "¿Los profesionales están certificados?",
    answer: "Sí, todos nuestros profesionales pasan por un proceso de verificación riguroso donde validamos sus certificaciones, licencias y experiencia."
  },
  {
    question: "¿Ofrecen consultas virtuales?",
    answer: "Sí, muchos de nuestros profesionales ofrecen consultas tanto presenciales como virtuales. Puedes elegir la modalidad que prefieras."
  },
  {
    question: "¿Cómo funciona el sistema de pagos?",
    answer: "Utilizamos Stripe para procesar los pagos de manera segura. Puedes pagar con tarjeta de crédito o débito. Holistia cobra una comisión del 15% como reserva."
  }
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
              Contáctanos
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
              ¿Tienes preguntas sobre nuestros servicios? ¿Necesitas ayuda para encontrar 
              el profesional adecuado? Estamos aquí para ayudarte en tu journey de bienestar.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Formas de Contacto
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
              Elige la forma más conveniente para ti de ponerte en contacto con nuestro equipo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="px-4 sm:px-6">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <method.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{method.title}</CardTitle>
                  <p className="text-sm sm:text-base text-muted-foreground">{method.description}</p>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">{method.contact}</p>
                  <Button asChild className="w-full">
                    <a href={method.href} target="_blank" rel="noopener noreferrer">
                      {method.action}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="py-12 sm:py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Envíanos un Mensaje
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
                Completa el formulario y nos pondremos en contacto contigo lo antes posible.
              </p>
            </div>
            
            <Card>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <form className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className="mt-2"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        className="mt-2"
                        placeholder="Tu apellido"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="mt-2"
                      placeholder="tu@email.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Teléfono (opcional)</Label>
                    <PhoneInput
                      id="phone"
                      name="phone"
                      className="mt-2"
                      placeholder="33 1234 5678"
                      defaultCountryCode="+52"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Asunto</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      className="mt-2"
                      placeholder="¿En qué podemos ayudarte?"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="mt-2"
                      placeholder="Cuéntanos más detalles sobre tu consulta..."
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Preguntas Frecuentes
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
              Encuentra respuestas a las preguntas más comunes sobre nuestros servicios.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-lg text-left">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="text-sm sm:text-base text-muted-foreground text-left">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Office Info */}
      <div className="py-12 sm:py-16 lg:py-24 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Información de Oficina
            </h2>
            <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm sm:text-base font-semibold text-foreground">Ubicación</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Guadalajara, Jalisco, México</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm sm:text-base font-semibold text-foreground">Horario de Atención</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Lunes a Viernes 9:00 - 18:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
