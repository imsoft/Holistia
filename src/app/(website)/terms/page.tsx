import { Metadata } from 'next';
import { generateStaticMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/structured-data';
import { generateStructuredData } from '@/lib/seo';

export const metadata: Metadata = generateStaticMetadata({
  title: 'Términos y Condiciones - Holistia',
  description: 'Lee nuestros términos y condiciones de uso de la plataforma Holistia. Conoce tus derechos y responsabilidades como usuario de nuestros servicios de salud integral.',
  keywords: [
    'términos y condiciones',
    'términos de uso',
    'política de privacidad',
    'condiciones de servicio',
    'Holistia términos',
    'uso de plataforma',
    'responsabilidades usuario',
  ],
  path: '/terms',
});

export default function TermsPage() {
  const structuredData = generateStructuredData('website', {
    name: 'Términos y Condiciones - Holistia',
    description: 'Términos y condiciones de uso de la plataforma Holistia',
  });

  return (
    <div className="min-h-screen bg-background">
      <StructuredData data={structuredData} />
      
      {/* Hero Section */}
      <div className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Términos y Condiciones
            </h1>
            <p className="text-lg text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 pb-16">
        <div className="max-w-4xl mx-auto prose prose-lg">
          <div className="space-y-8 text-foreground">
            
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Aceptación de los Términos</h2>
              <p className="mb-4">
                Al acceder y utilizar la plataforma Holistia, usted acepta estar sujeto a estos términos y condiciones de uso. 
                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Descripción del Servicio</h2>
              <p className="mb-4">
                Holistia es una plataforma digital que conecta usuarios con profesionales de la salud certificados, 
                incluyendo psicólogos, terapeutas, coaches y otros especialistas en bienestar. Nuestros servicios incluyen:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Conectarte con profesionales de la salud certificados</li>
                <li>Facilitar la programación de citas presenciales y en línea</li>
                <li>Proporcionar información sobre eventos y talleres de bienestar</li>
                <li>Ofrecer contenido educativo sobre salud mental y bienestar</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Cuenta de Usuario</h2>
              <p className="mb-4">
                Para utilizar nuestros servicios, debe crear una cuenta proporcionando información precisa y actualizada. 
                Es responsable de mantener la confidencialidad de su cuenta y contraseña.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Uso Aceptable</h2>
              <p className="mb-4">
                Usted se compromete a utilizar la plataforma de manera responsable y conforme a la ley. 
                Está prohibido:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Usar la plataforma para actividades ilegales o no autorizadas</li>
                <li>Interferir con el funcionamiento de la plataforma</li>
                <li>Intentar acceder a cuentas de otros usuarios</li>
                <li>Compartir información falsa o engañosa</li>
                <li>Realizar actividades que puedan dañar la reputación de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Pagos y Comisiones</h2>
              <p className="mb-4">
                Holistia cobra comisiones por los servicios facilitados:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Para citas con profesionales: 15% de comisión</li>
                <li>Para eventos y talleres: 20% de comisión</li>
                <li>Los pagos se procesan de forma segura a través de Stripe</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Política de Cancelación</h2>
              <p className="mb-4">
                Las cancelaciones deben realizarse con al menos 24 horas de anticipación. 
                Las cancelaciones tardías pueden estar sujetas a cargos según la política del profesional.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Limitación de Responsabilidad</h2>
              <p className="mb-4">
                Holistia actúa como intermediario entre usuarios y profesionales. No somos responsables por:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>La calidad de los servicios prestados por los profesionales</li>
                <li>Resultados médicos o terapéuticos</li>
                <li>Disputas entre usuarios y profesionales</li>
                <li>Interrupciones temporales del servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Privacidad</h2>
              <p className="mb-4">
                Su privacidad es importante para nosotros. Consulte nuestra 
                <a href="/privacy" className="text-primary hover:underline ml-1">
                  Política de Privacidad
                </a> para entender cómo recopilamos, usamos y protegemos su información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Modificaciones</h2>
              <p className="mb-4">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Las modificaciones entrarán en vigor inmediatamente después de su publicación en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Contacto</h2>
              <p className="mb-4">
                Si tiene preguntas sobre estos términos y condiciones, puede contactarnos en:
              </p>
              <p className="mb-2">
                <strong>Email:</strong> hola@holistia.io
              </p>
              <p>
                <strong>Teléfono:</strong> +52-55-1234-5678
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}