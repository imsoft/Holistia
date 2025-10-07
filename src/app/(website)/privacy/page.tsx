export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introducción</h2>
            <p className="text-muted-foreground mb-4">
              En Holistia, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política de Privacidad 
              describe cómo recopilamos, usamos, almacenamos y protegemos su información personal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Información que Recopilamos</h2>
            <p className="text-muted-foreground mb-4">
              Recopilamos diferentes tipos de información:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Información de registro:</strong> Nombre, correo electrónico, teléfono</li>
              <li><strong>Información profesional:</strong> Para profesionales, certificaciones, especialidades, experiencia</li>
              <li><strong>Información de uso:</strong> Cómo interactúa con nuestra plataforma</li>
              <li><strong>Información de pago:</strong> Datos necesarios para procesar transacciones</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cómo Usamos su Información</h2>
            <p className="text-muted-foreground mb-4">
              Utilizamos su información para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Proporcionar y mejorar nuestros servicios</li>
              <li>Facilitar la conexión entre profesionales y pacientes</li>
              <li>Procesar pagos y transacciones</li>
              <li>Enviar notificaciones importantes sobre su cuenta</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Protección de Datos de Salud</h2>
            <p className="text-muted-foreground mb-4">
              Entendemos la sensibilidad de la información de salud mental. Implementamos medidas de seguridad 
              rigurosas para proteger toda la información relacionada con sesiones terapéuticas y registros médicos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Compartir Información</h2>
            <p className="text-muted-foreground mb-4">
              No vendemos su información personal. Compartimos información solo cuando:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Es necesario para proporcionar el servicio (ej: conectar con un profesional)</li>
              <li>Tenemos su consentimiento explícito</li>
              <li>Es requerido por ley</li>
              <li>Es necesario para proteger nuestros derechos o la seguridad de otros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Seguridad de la Información</h2>
            <p className="text-muted-foreground mb-4">
              Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Encriptación de datos en tránsito y en reposo</li>
              <li>Controles de acceso estrictos</li>
              <li>Monitoreo regular de seguridad</li>
              <li>Cumplimiento con estándares de la industria</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Sus Derechos</h2>
            <p className="text-muted-foreground mb-4">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Acceder a su información personal</li>
              <li>Corregir información inexacta</li>
              <li>Solicitar la eliminación de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
              <li>Exportar sus datos en un formato estructurado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies y Tecnologías Similares</h2>
            <p className="text-muted-foreground mb-4">
              Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de la plataforma 
              y personalizar el contenido. Puede configurar su navegador para rechazar cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Retención de Datos</h2>
            <p className="text-muted-foreground mb-4">
              Conservamos su información personal solo durante el tiempo necesario para cumplir con los propósitos 
              descritos en esta política, a menos que la ley requiera un período de retención más largo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Cambios a esta Política</h2>
            <p className="text-muted-foreground mb-4">
              Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios 
              significativos publicando la nueva política en esta página y actualizando la fecha de &quot;última actualización&quot;.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Menores de Edad</h2>
            <p className="text-muted-foreground mb-4">
              Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente 
              información de menores sin el consentimiento de los padres o tutores.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contacto</h2>
            <p className="text-muted-foreground mb-4">
              Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, contáctenos en:
            </p>
            <p className="text-muted-foreground">
              <a href="mailto:hola@holistia.io" className="text-primary hover:underline">
                hola@holistia.io
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

