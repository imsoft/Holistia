export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">POLÍTICA DE PRIVACIDAD</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          
          {/* Sección 1: Identidad y Domicilio del Responsable */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">1. IDENTIDAD Y DOMICILIO DEL RESPONSABLE</h2>
            <p className="text-muted-foreground mb-4">
              Según lo establecido por la Ley Federal de Protección de Datos Personales en Posesión de Particulares, 
              la responsable de recabar sus datos (señalada en la tabla inmediata siguiente) le informa sobre la política 
              de privacidad y manejo de datos personales, la cual, en todo momento velará que el tratamiento de los 
              mismos sea legítimo, controlado e informado, a efecto de garantizar la privacidad de los mismos.
            </p>
            
            <div className="bg-muted/30 p-6 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-foreground">Razón o denominación Social:</p>
                  <p className="text-muted-foreground">Miriam Alejandra Salazar Acevedo</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Nombre comercial:</p>
                  <p className="text-muted-foreground">Holistia</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Domicilio:</p>
                  <p className="text-muted-foreground">Calle Asís 760, Colonia Italia Providencia, C.P. 44658, Guadalajara, Jalisco</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                <div>
                  <p className="font-semibold text-foreground">Página web:</p>
                  <p className="text-muted-foreground">
                    <a href="https://holistia.io/" className="text-primary hover:underline">https://holistia.io/</a>
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Giro principal:</p>
                  <p className="text-muted-foreground">Plataforma para profesionales del bienestar.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sección 2: Finalidad del Tratamiento */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">2. FINALIDAD DEL TRATAMIENTO DE LOS DATOS RECABADOS</h2>
            <p className="text-muted-foreground mb-4">
              Los datos personales que proporcione tendrán el tratamiento que se describe a continuación:
            </p>
            
            <div className="bg-muted/30 p-6 rounded-lg mb-4">
              <p className="text-muted-foreground mb-3">
                Para identificarle, ubicarle, comunicarle, contactarle, dar seguimiento a las obligaciones contraídas, 
                enviarle información y/o dar seguimiento a las relaciones que motiven la transmisión de los relativos 
                datos personales.
              </p>
              <p className="text-muted-foreground mb-3">
                La temporalidad de la autorización del manejo y uso de los datos personales será indefinida a partir de 
                la fecha en que usted los proporcionó a la responsable a través de cualquier medio impreso y/o electrónico. 
                En todo momento la responsable informará al titular sobre cualquier cambio en el presente aviso de privacidad.
              </p>
              <p className="text-muted-foreground">
                La responsable puede recopilar información personal para completar distintas transacciones:
              </p>
            </div>

            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Realizar estudios, encuestas o aplicar cuestionarios de perfilamiento.</li>
              <li>Realizar las actividades necesarias a fin cumplir con las obligaciones pactadas hacia con nuestros clientes y en su defecto brindar el servicio acordado.</li>
              <li>Permitir al cliente utilizar los distintos servicios de sus correspondientes sitios web incluyendo la visualización de contenido.</li>
              <li>Utilizar los datos que el Responsable obtenga mediante el consentimiento del Titular, para fines comerciales para efectos de informar sobre eventos, informar sobre el servicio, evaluar el servicio, mejorar el servicio, así como para el envío de información a nuestros patrocinadores, socios, asociados y demás aliados comerciales mediante cualquier medio de información.</li>
              <li>Proveer los servicios y productos solicitados en caso de aplicar.</li>
              <li>Comunicarle sobre cambios en los servicios prestados.</li>
              <li>Generar estadísticas para los clientes, personas y entidades con las que se tenga convenios.</li>
              <li>Conservar la información proporcionada por el titular, en tanto este último no solicite su baja con el fin de contactar al mismo para la renovación y ofrecimiento de servicios futuros.</li>
            </ul>

            <p className="text-muted-foreground mb-3">Adicionalmente, la responsable podrá utilizar su información para:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Brindarle información actualizada sobre nuevos servicios, productos y beneficios de los servicios prestados.</li>
              <li>Comunicarse con usted por vía telefónica, postal y correo electrónico acerca de productos y servicios que de acuerdo a su perfil de cliente puedan interesarle; y control interno de clientes.</li>
            </ul>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg mb-4">
              <h3 className="font-semibold text-foreground mb-3">Finalidades Especiales:</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Mercadotécnicos</li>
                <li>Publicitarios</li>
                <li>Prospección comercial</li>
                <li>Estadísticos</li>
              </ul>
            </div>
          </section>

          {/* Sección 2.1: Datos de Ubicación */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">2.1. DATOS DE UBICACIÓN DE REFERENCIA Y EL USO Y MANEJO DE DATOS DE UBICACIÓN DEL TITULAR</h2>
            <p className="text-muted-foreground mb-4">
              Al registrarse en la app de Holistia, aparecerá una solicitud de permiso en tu dispositivo con el fin de 
              autorizar compartir la información de tu ubicación, que incluye datos de ubicación recopilados a través 
              de Bluetooth y las señales wifi cercanas.
            </p>
            <p className="text-muted-foreground mb-4">
              De forma predeterminada, para obtener el mejor servicio posible, la app solicita que active los servicios 
              de ubicación &quot;Permitir solo mientras usas la app&quot;. Utilizamos datos de ubicación para cumplir con las 
              siguientes finalidades:
            </p>
            <div className="bg-muted/30 p-6 rounded-lg mb-4">
              <p className="font-semibold text-foreground mb-2">Finalidades Principales:</p>
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li>Ubicar los servicios a prestar de acuerdo a tu zona geográfica</li>
                <li>Situarte con comunidades de acuerdo a tu zona geográfica</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg">
              <p className="font-semibold text-foreground mb-3">Configuración para dispositivos Android:</p>
              <p className="text-muted-foreground mb-3">Si usas un dispositivo Android, puedes elegir entre las siguientes 3 configuraciones de ubicación:</p>
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li><strong>Permitir todo el tiempo:</strong> Permite recopilar los datos de tu ubicación en cualquier momento, incluso cuando no uses activamente la app Simply Drive.</li>
                <li><strong>Permitir solo mientras usas la app:</strong> Permite recopilar los datos de tu ubicación únicamente mientras usas de manera activa la app de Simply Drive.</li>
                <li><strong>Denegar:</strong> No permite compartir ningún dato relacionado con tu ubicación aún mientras usas de manera activa la app Simply Drive</li>
              </ol>
              <p className="text-muted-foreground mt-3">Esta configuración puede ser modificada por tu parte en cualquier momento a través de las preferencias de ubicación del dispositivo.</p>
            </div>
          </section>

          {/* Sección 3: Alcance */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">3. ALCANCE DE ESTE AVISO DE PRIVACIDAD</h2>
            <p className="text-muted-foreground mb-4">
              La responsable es una persona moral, con todas las capacidades o facultades legales para brindar 
              servicios o vincularlos a todas sus plataformas, incluidas las suscritas en este instrumento. Este aviso de 
              privacidad se aplica a todas las plataformas web, incluyendo los sitios web, dominios, servicios, 
              plataformas web, aplicaciones, aplicaciones web o móviles y productos pertenecientes a la responsable 
              y a sus subsidiarias de propiedad absoluta (&quot;sitios o servicios de la responsable&quot;), excepto que una política 
              o declaración de privacidad específica para un producto o servicio de la responsable en particular 
              pueda dejar sin efecto o complementar esta declaración o aviso de privacidad.
            </p>
            <p className="text-muted-foreground">
              El alcance de este Aviso de Privacidad, el acceso y sobre todo la obtención de los datos personales y sin 
              limitarse podrá llevarse a cabo por los siguientes medios: e-commerce, Aplicación móvil, página web, 
              cuentas en redes sociales, teléfono y/o cámaras de teléfonos móviles.
            </p>
          </section>

          {/* Sección 4: Datos Personales Tratados */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">4. DATOS PERSONALES TRATADOS</h2>
            <p className="text-muted-foreground mb-4">
              Para las finalidades antes mencionadas, requerimos obtener los siguientes datos personales:
            </p>
            
            <div className="bg-muted/30 p-4 rounded-lg mb-3">
              <h3 className="font-semibold text-foreground mb-2">Datos Personales:</h3>
              <p className="text-muted-foreground">
                Nombre completo, lugar de nacimiento, fecha de nacimiento, país de origen, edad, RFC, estado civil, 
                número de teléfono celular, número de teléfono de oficina, ocupación, nacionalidad y correo electrónico.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Datos Sensibles:</h3>
              <p className="text-muted-foreground">
                Tipo de ingresos, nombre de la organización donde trabaja, lugar de trabajo, domicilio actual, 
                y número de dependientes económicos.
              </p>
            </div>
          </section>

          {/* Sección 5: Recopilación Automática */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">5. RECOPILACIÓN DE INFORMACIÓN Y/O DATOS A TRAVÉS DE MEDIOS AUTOMÁTICOS</h2>
            <p className="text-muted-foreground mb-4">
              Además de la información que nos proporcione, la responsable también podrá recabar información durante su 
              visita a nuestro sitio web a través de registros en diversas redes sociales como Instagram, TikTok, 
              Facebook o Google, procesadores o prestadores de servicio de pago, pago fácil o a sistemas de pago electrónico, 
              y de sus herramientas de recopilación de datos automática, entre las que se incluyen formularios, 
              baliza web, etiquetas, botones, herramientas, Google Analytics, Google Ads, catálogos web y enlaces, 
              aplicaciones web integradas.
            </p>

            <p className="text-muted-foreground mb-4">
              Dichas herramientas recopilan cierta información de comportamiento o tráfico que su navegador envía a un 
              sitio web, como puede ser el tipo de idioma del navegador, las horas de acceso y la dirección del sitio web 
              del que procede. También pueden recabar información acerca de su dirección de Protocolo de Internet (IP), 
              de su identificador Único de dispositivo, de dónde hace clic (es decir, la página web que visita), los 
              clics en los que hace clic y otras acciones que lleve a cabo en relación con los sitios web de la 
              responsable o administrados por ésta.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg mb-4">
              <h3 className="font-semibold text-foreground mb-3">¿Cómo controlo qué cookies se colocan en mi dispositivo?</h3>
              <p className="text-muted-foreground mb-3">
                Usted puede decidir si acepta o no cookies. Una manera de hacerlo es a través de la configuración de 
                su navegador de Internet. La mayoría de los navegadores de Internet permiten cierto control de la mayor 
                parte de las cookies por medio de la configuración del navegador (tenga presente que, si utiliza la 
                configuración de su navegador para bloquear todas las cookies, es posible que no pueda acceder a partes 
                o funciones de nuestro cierto web.)
              </p>
              <p className="text-muted-foreground mb-3">Los siguientes sitios web brindan información sobre cómo ajustar la configuración de cookies en algunos navegadores populares:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-3">
                <li>Apple Safari</li>
                <li>Google Chrome</li>
                <li>Microsoft Internet Explorer</li>
                <li>Mozilla Firefox</li>
              </ul>
              <p className="text-muted-foreground mb-3">
                Para obtener más información acerca de las cookies en general, lo que incluye qué cookies se han 
                establecido y cómo administrarlos y eliminarlos, puede visitar a su discreción y completa responsabilidad: 
                www.allaboutcookies.org
              </p>
            </div>

            <p className="text-muted-foreground">
              Los datos obtenidos mediante los archivos de registro descritos previamente no podrán ser transferidos a 
              persona alguna distinta de esta empresa o de su personal laboral o directivo, para tal caso, estos mismos 
              deberán ajustarse en el manejo de su información, al trato establecido en el presente aviso de privacidad.
            </p>
          </section>

          {/* Sección 6: Transferencias */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">6. TRANSFERENCIAS DE DATOS PERSONALES</h2>
            <p className="text-muted-foreground">
              La responsable queda facultada con base en este aviso de privacidad, para transferir entre los diversos 
              miembros de la plataforma digital que integra los servicios prestados, los datos personales requeridos 
              para la vinculación de organizaciones, empresas y perfiles emprendedores en toda la región, nación y 
              el mundo, así como todo tipo de comunicaciones entre los usuarios de la misma, en el entendido de que 
              el emprendimiento y la buena fe son los elementos que constituyen las relaciones entre los integrantes 
              de la plataforma y prestatarios de los servicios proporcionados por la responsable.
            </p>
          </section>

          {/* Sección 7: Ejercicio Derechos ARCO */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">7. EJERCICIO DERECHOS ARCO Y REVOCAMIENTO DE TRATAMIENTO DE DATOS PERSONALES</h2>
            <p className="text-muted-foreground mb-4">
              Usted tiene derecho a conocer qué datos personales tenemos registrados, para qué los utilizamos y las 
              condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su 
              información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); 
              que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo 
              utilizada conforme a los principios, deberes y obligaciones previstas en la normativa (Cancelación); así 
              como oponerse al uso de sus datos personales para fines específicos (Oposición). Estos derechos se 
              conocen como derechos ARCO.
            </p>

            <p className="text-muted-foreground mb-4">
              Usted puede revocar el consentimiento que, en su caso, nos haya otorgado para el tratamiento de sus 
              datos personales. Sin embargo, es importante que tenga en cuenta que no en todos los casos podremos 
              atender su solicitud o concluir el uso de forma inmediata, ya que es posible que por alguna obligación 
              legal requiramos seguir tratando sus datos personales. Asimismo, usted deberá considerar que para 
              ciertos fines, la revocación de su consentimiento implicará que no le podamos seguir prestando el servicio 
              que nos solicitó, o la conclusión de su relación con nosotros.
            </p>

            <div className="bg-muted/30 p-6 rounded-lg mb-4">
              <p className="text-muted-foreground mb-3">
                En caso que desee ejercer sus derechos de acceso, rectificación, cancelación u oposición (ARCO) 
                respecto de cualquier dato o información personal que nos hubiese proporcionado, estos podrán 
                ejercerse en todo momento dirigiendo su solicitud a alguna de las siguientes direcciones o medios de 
                contacto:
              </p>
              
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-foreground">Correo electrónico:</p>
                    <p className="text-muted-foreground">
                      <a href="mailto:hola@holistia.io" className="text-primary hover:underline">hola@holistia.io</a>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Por correo al siguiente domicilio:</p>
                    <p className="text-muted-foreground">Calle Asís 760, Colonia Italia Providencia, C.P. 44658, Guadalajara, Jalisco</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                  <div>
                    <p className="font-semibold text-foreground">Días y horario de atención:</p>
                    <p className="text-muted-foreground">9:00 AM a 5:00 PM</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Teléfono(s) de atención:</p>
                    <p className="text-muted-foreground">33 3955 0061</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Plazo máximo de respuesta:</p>
                    <p className="text-muted-foreground">15 días hábiles</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">
              Para lo anterior, deberá hacernos saber fehacientemente los datos personales que usted desea sean 
              rectificados, cancelados o revisados, así como el propósito para el cual los aportó y en su caso el nombre 
              del Responsable a quien los entregó y/o en general cumplir los requisitos mencionados en el artículo 29 
              de la Ley Federal de Protección de Datos Personales en Posesión de Particulares.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg">
              <p className="text-muted-foreground mb-3">Para el ejercicio de sus derechos de acceso, rectificación, cancelación u oposición, deberá integrar su petición con los siguientes requisitos:</p>
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li>Petición firmada de su puño y letra, clara y concisa sobre los datos que desea modificar, ya sea en su versión impresa o en su caso digitalizada.</li>
                <li>Copia de una identificación oficial, en versión impresa o digitalizada.</li>
              </ol>
            </div>
          </section>

          {/* Sección 8: Modificaciones */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">8. MODIFICACIONES AL PRESENTE AVISO DE PRIVACIDAD</h2>
            <p className="text-muted-foreground mb-4">
              La responsable se reserva el derecho de efectuar en cualquier momento modificaciones o actualizaciones 
              al presente Aviso de Privacidad, en atención a novedades legislativas o políticas internas.
            </p>
            <p className="text-muted-foreground">
              Sin embargo persiste el compromiso de mantenerlo informado sobre los cambios que pueda sufrir el 
              presente aviso de privacidad, en caso de que esto suceda, será publicado en la propia página web del 
              responsable.
            </p>
          </section>

          {/* Sección 9: Control y Seguridad */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">9. CONTROL Y SEGURIDAD</h2>
            <p className="text-muted-foreground mb-4">
              La responsable se compromete a tomar las medidas necesarias para proteger la información recopilada, 
              utilizando tecnología de seguridad y protocolos de seguridad contra el acceso, uso o divulgación de su 
              información personal sin autorización, por ejemplo, almacenando la información personal proporcionada 
              en servidores ubicados en Centros de Datos que cuentan con controles de acceso limitado.
            </p>
            <p className="text-muted-foreground">
              De igual modo, la responsable, sus empleados, representantes, subcontratistas, consultores y/o los 
              terceros que intervengan en cualquier fase del tratamiento de los Datos Personales y/o Datos Personales 
              Patrimoniales del Titular deberán guardar confidencialidad respecto de éstos, obligación que subsistirá 
              aún después de finalizar la relación entre la organización con el Titular.
            </p>
          </section>

          {/* Sección 10: Aceptación */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">10. ACEPTACIÓN E INFORMACIÓN ADICIONAL</h2>
            <p className="text-muted-foreground mb-4">
              Mediante la aceptación del presente Aviso de Privacidad usted, el titular, otorga su consentimiento para 
              que sus datos personales, financieros y/o patrimoniales sean tratados conforme a lo señalado en el 
              presente documento.
            </p>
            <p className="text-muted-foreground mb-4">
              Si usted considera que su derecho a la protección de sus datos personales ha sido lesionado por alguna 
              conducta u omisión de nuestra parte, o presume alguna violación a las disposiciones previstas en la Ley 
              Federal de Protección de Datos Personales en Posesión de los Particulares, su Reglamento y demás 
              ordenamientos aplicables, podrá interponer su inconformidad o denuncia ante el Instituto Nacional de 
              Transparencia, Acceso a la Información y Protección de Datos Personales (INAI).
            </p>
            <p className="text-muted-foreground">
              Le informamos que la responsable no realiza ordinariamente transferencia de datos con algún tercero 
              salvo para los casos en lo que sea estrictamente necesario para la realización de algún servicio o 
              producto solicitado a la responsable. Dicho tercero estará obligado independientemente y, en su caso, 
              solidariamente a dar el tratamiento correspondiente a los datos personales que a los cuales tengo 
              acceso.
            </p>
          </section>

          {/* Información adicional */}
          <section className="border-t-2 border-border pt-6">
            <h2 className="text-2xl font-bold mb-4">¿Cómo puede limitar el uso o divulgación de su información personal?</h2>
            <p className="text-muted-foreground mb-4">
              Con objeto de que usted pueda limitar el uso y divulgación de su información personal, le ofrecemos los 
              siguientes medios:
            </p>
            <p className="text-muted-foreground mb-4">
              Su inscripción en el Registro Público para Evitar Publicidad, que está a cargo de la Procuraduría Federal 
              del Consumidor, con la finalidad de que sus datos personales no sean utilizados para recibir publicidad 
              o promociones de empresas de bienes o servicios. Para mayor información sobre este registro, usted puede 
              consultar el portal de Internet de la PROFECO, o bien ponerse en contacto directo con ésta.
            </p>
            <div className="bg-muted/30 p-6 rounded-lg">
              <h3 className="font-semibold text-foreground mb-3">Mecanismos para limitar el uso de datos personales:</h3>
              <p className="text-muted-foreground">
                Su inscripción en el Registro Público para evitar publicidad que está a cargo de la Procuraduría Federal 
                del Consumidor, con la finalidad de que sus datos personales no sean utilizados para recibir publicidad 
                o promociones.
              </p>
            </div>
          </section>

          {/* Fecha de actualización */}
          <div className="text-center text-sm text-muted-foreground mt-12 pt-6 border-t border-border">
            <p>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

