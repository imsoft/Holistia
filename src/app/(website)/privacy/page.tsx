import { Metadata } from 'next';
import { generateStaticMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/structured-data';
import { generateStructuredData } from '@/lib/seo';

export const metadata: Metadata = generateStaticMetadata({
  title: 'Política de Privacidad - Holistia',
  description: 'Conoce cómo Holistia protege tu privacidad y maneja tu información personal. Política de privacidad transparente para usuarios de nuestra plataforma de salud integral.',
  keywords: [
    'política de privacidad',
    'privacidad de datos',
    'protección de datos',
    'información personal',
    'confidencialidad',
    'Holistia privacidad',
    'seguridad de datos',
    'RGPD',
  ],
  path: '/privacy',
});

export default function PrivacyPage() {
  const structuredData = generateStructuredData('website', {
    name: 'Política de Privacidad - Holistia',
    description: 'Política de privacidad y protección de datos de Holistia',
  });

  return (
    <div className="min-h-screen bg-background">
      <StructuredData data={structuredData} />
      
      {/* Hero Section */}
      <div className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Política de Privacidad
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
              <h2 className="text-2xl font-bold mb-4">1. Información que Recopilamos</h2>
              <p className="mb-4">
                Recopilamos información que usted nos proporciona directamente, como:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Información de registro (nombre, email, teléfono)</li>
                <li>Información de perfil y preferencias</li>
                <li>Información de citas y consultas</li>
                <li>Comunicaciones con nuestro equipo de soporte</li>
                <li>Información de pago (procesada de forma segura por Stripe)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Cómo Usamos su Información</h2>
              <p className="mb-4">
                Utilizamos su información personal para:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Conectarlo con expertos apropiados</li>
                <li>Procesar pagos y transacciones</li>
                <li>Enviar notificaciones sobre citas y servicios</li>
                <li>Comunicarnos con usted sobre actualizaciones</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Compartir Información</h2>
              <p className="mb-4">
                No vendemos su información personal. Podemos compartir información limitada con:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Profesionales de la salud para facilitar las citas</li>
                <li>Proveedores de servicios que nos ayudan a operar la plataforma</li>
                <li>Autoridades cuando sea requerido por ley</li>
                <li>Con su consentimiento explícito</li>
              </ul>
          </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Seguridad de los Datos</h2>
              <p className="mb-4">
                Implementamos medidas de seguridad técnicas y organizacionales para proteger su información:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo regular de seguridad</li>
                <li>Capacitación del personal en privacidad</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Sus Derechos</h2>
              <p className="mb-4">
                Usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Acceder a su información personal</li>
                <li>Corregir información inexacta</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Limitar el procesamiento de su información</li>
                <li>Portabilidad de datos</li>
                <li>Retirar su consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Cookies y Tecnologías Similares</h2>
              <p className="mb-4">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Recordar sus preferencias</li>
                <li>Mejorar la funcionalidad del sitio</li>
                <li>Analizar el uso de la plataforma</li>
                <li>Personalizar su experiencia</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Retención de Datos</h2>
              <p className="mb-4">
                Conservamos su información personal solo durante el tiempo necesario para los fines descritos 
                en esta política, o según lo requiera la ley aplicable.
              </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Menores de Edad</h2>
              <p className="mb-4">
                Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente 
                información personal de menores sin el consentimiento de sus padres o tutores.
            </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Transferencias Internacionales</h2>
              <p className="mb-4">
                Sus datos pueden ser transferidos y procesados en países fuera de México. 
                Nos aseguramos de que dichas transferencias cumplan con las leyes aplicables 
                de protección de datos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Cambios a esta Política</h2>
              <p className="mb-4">
                Podemos actualizar esta política de privacidad ocasionalmente. 
                Le notificaremos sobre cambios significativos a través de la plataforma o por email.
              </p>
          </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Contacto</h2>
              <p className="mb-4">
                Para preguntas sobre esta política de privacidad o para ejercer sus derechos, contáctenos:
              </p>
              <p className="mb-2">
                <strong>Email:</strong> privacidad@holistia.io
              </p>
              <p className="mb-2">
                <strong>Teléfono:</strong> +52-55-1234-5678
              </p>
              <p>
                <strong>Dirección:</strong> Ciudad de México, México
              </p>
          </section>

          </div>
        </div>
      </div>
    </div>
  );
}