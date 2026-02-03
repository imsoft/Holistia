import { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateStaticMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/seo/structured-data";
import { generateStructuredData } from "@/lib/seo";
import { Mail, Phone, MessageCircle } from "lucide-react";

export const metadata: Metadata = generateStaticMetadata({
  title: 'Contáctanos - Holistia | Soporte y Atención al Cliente',
  description: 'Ponte en contacto con el equipo de Holistia. Estamos aquí para ayudarte con cualquier pregunta sobre nuestros servicios de salud integral, expertos certificados y eventos de bienestar.',
  keywords: [
    'contacto Holistia',
    'soporte al cliente',
    'atención al cliente',
    'consultas Holistia',
    'ayuda técnica',
    'información servicios',
    'contacto profesionales',
    'soporte plataforma',
  ],
  path: '/contact',
});

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
    answer: "Utilizamos Stripe para procesar los pagos de manera segura. Puedes pagar con tarjeta de crédito o débito. Todos los pagos están protegidos con encriptación de nivel bancario."
  }
];

export default function ContactPage() {
  const structuredData = generateStructuredData('website', {
    name: 'Contacto - Holistia',
    description: 'Información de contacto y soporte al cliente de Holistia',
    contactInfo: {
      email: 'hola@holistia.io',
      phone: '+52-55-1234-5678',
    }
  });

  return (
    <div className="min-h-screen bg-white">
      <StructuredData data={structuredData} />
      {/* Hero Section */}
      <div className="relative bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 lg:py-12 lg:px-8">
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

      {/* Contact Methods + Contact Form: 2 columnas, misma altura */}
      <div className="py-8 sm:py-10 lg:py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-stretch lg:[&>*]:min-h-0">
            {/* Columna izquierda: una Card que ocupa toda la altura */}
            <Card className="flex flex-col overflow-hidden lg:h-full">
              <CardHeader className="shrink-0 px-4 sm:px-6 pt-6 pb-2">
                <CardTitle className="text-2xl sm:text-3xl">Formas de Contacto</CardTitle>
                <p className="mt-2 text-base text-muted-foreground font-normal">
                  Elige la forma más conveniente de ponerte en contacto con nuestro equipo.
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6 px-4 sm:px-6 pb-6 pt-0">
                {contactMethods.map((method, index) => (
                  <div key={index} className="rounded-lg border bg-card p-4 sm:p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <method.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground">{method.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                        <p className="text-sm sm:text-base font-semibold text-foreground mt-3">{method.contact}</p>
                        <Button asChild className="mt-3 w-full">
                          <a href={method.href} target="_blank" rel="noopener noreferrer">
                            {method.action}
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Columna derecha: título + formulario en Card de misma altura */}
            <div className="flex min-h-0 flex-col lg:h-full">
              <div className="mb-6 shrink-0 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Envíanos un Mensaje
                </h2>
                <p className="mt-2 sm:mt-3 text-base text-muted-foreground">
                  Completa el formulario y nos pondremos en contacto contigo lo antes posible.
                </p>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <ContactForm className="h-full min-h-0" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-8 sm:py-10 lg:py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Preguntas Frecuentes
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
              Encuentra respuestas a las preguntas más comunes sobre nuestros servicios.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {faqs.map((faq, index) => (
              <Card key={index} className="py-4">
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
    </div>
  );
}
