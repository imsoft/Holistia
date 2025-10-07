export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Términos y Condiciones</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground mb-4">
              Al acceder y utilizar la plataforma Holistia, usted acepta estar sujeto a estos Términos y Condiciones. 
              Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descripción del Servicio</h2>
            <p className="text-muted-foreground mb-4">
              Holistia es una plataforma que conecta a profesionales de la salud mental con pacientes que buscan 
              servicios de bienestar y terapia. Facilitamos la búsqueda, programación y gestión de citas terapéuticas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Registro y Cuenta de Usuario</h2>
            <p className="text-muted-foreground mb-4">
              Para utilizar ciertos servicios, debe crear una cuenta proporcionando información precisa y completa. 
              Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Responsabilidades del Usuario</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Proporcionar información veraz y actualizada</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Respetar los derechos de otros usuarios y profesionales</li>
              <li>Cumplir con todas las leyes y regulaciones aplicables</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Profesionales de la Salud</h2>
            <p className="text-muted-foreground mb-4">
              Los profesionales que se registran en Holistia deben:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Poseer las licencias y certificaciones requeridas para ejercer</li>
              <li>Proporcionar servicios profesionales de acuerdo con los estándares éticos</li>
              <li>Mantener la confidencialidad de la información del paciente</li>
              <li>Cumplir con todas las regulaciones profesionales aplicables</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Política de Pagos y Reembolsos</h2>
            <p className="text-muted-foreground mb-4">
              Los pagos se procesan de forma segura a través de nuestra plataforma. Las políticas de cancelación 
              y reembolso están sujetas a los términos específicos de cada profesional.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground mb-4">
              Holistia actúa como intermediario entre profesionales y pacientes. No somos responsables de:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>La calidad de los servicios profesionales proporcionados</li>
              <li>Las acciones u omisiones de los profesionales o pacientes</li>
              <li>Los resultados de las sesiones terapéuticas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Propiedad Intelectual</h2>
            <p className="text-muted-foreground mb-4">
              Todo el contenido de la plataforma, incluyendo textos, gráficos, logos e imágenes, es propiedad 
              de Holistia y está protegido por las leyes de propiedad intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Modificaciones</h2>
            <p className="text-muted-foreground mb-4">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Los cambios entrarán en vigor inmediatamente después de su publicación en la plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contacto</h2>
            <p className="text-muted-foreground mb-4">
              Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:
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

