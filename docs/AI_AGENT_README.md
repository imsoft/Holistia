# Agente IA - Sistema de Recomendaciones

## Descripción

Este módulo implementa un agente de IA basado en ChatGPT que recomienda profesionales de la plataforma Holistia según las necesidades del usuario.

## Características

- ✅ Conversación natural con el agente IA
- ✅ Recomendaciones personalizadas de profesionales
- ✅ Historial de conversación
- ✅ Puntuación de compatibilidad (0-100%)
- ✅ Razones detalladas de cada recomendación
- ✅ Solo accesible para administradores

## Configuración

### 1. Obtener API Key de OpenAI

1. Ve a [platform.openai.com](https://platform.openai.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** en el menú
4. Haz clic en **Create new secret key**
5. Copia la API key (empieza con `sk-...`)

### 2. Configurar Variable de Entorno

Agrega la siguiente variable a tu archivo `.env.local`:

```bash
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**IMPORTANTE:**
- NO compartas tu API key en GitHub
- El archivo `.env.local` ya está en `.gitignore`
- Asegúrate de que la API key tenga créditos disponibles

### 3. Reiniciar el Servidor

Después de agregar la variable de entorno:

```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
pnpm dev
```

## Uso

### Acceso

1. Inicia sesión como **administrador**
2. Ve a **Agente IA (Pruebas)** en el sidebar
3. Comienza a conversar con el agente

### Ejemplos de Consultas

- "Necesito un psicólogo que trabaje con ansiedad"
- "Busco un nutriólogo especializado en nutrición deportiva"
- "¿Quién puede ayudarme con terapias alternativas?"
- "Recomiéndame un terapeuta holístico para manejo del estrés"

### Respuestas del Agente

El agente proporcionará:
- **Mensaje explicativo** de las recomendaciones
- **Lista de profesionales** más adecuados (máximo 3-5)
- **Razón** de por qué cada uno es recomendado
- **Puntuación de compatibilidad** (0-100%)
- **Datos de contacto** (email, teléfono)

## Arquitectura

### Frontend
- **Ubicación:** `/admin/[id]/ai-agent`
- **Componentes:**
  - Chat interface con mensajes
  - Tarjetas de profesionales recomendados
  - Auto-scroll
  - Loading states

### Backend
- **Endpoint:** `/api/ai-agent/recommend`
- **Método:** POST
- **Autenticación:** Solo administradores
- **Modelo:** gpt-4o-mini (más económico)

### Flujo de Datos

1. Usuario envía consulta
2. Frontend carga lista de profesionales aprobados
3. Se envía a la API con:
   - Consulta del usuario
   - Lista de profesionales
   - Historial de conversación
4. API llama a OpenAI con:
   - System prompt con contexto
   - Historial de conversación
   - Consulta actual
5. OpenAI responde con JSON:
   ```json
   {
     "message": "Respuesta amigable",
     "recommendations": [
       {
         "id": "uuid",
         "first_name": "Nombre",
         "last_name": "Apellido",
         "profession": "Profesión",
         "email": "email@example.com",
         "phone": "+52 333 123 4567",
         "reason": "Razón de la recomendación",
         "score": 0.95
       }
     ]
   }
   ```
6. Frontend muestra respuesta y profesionales

## Costos

### Modelo: gpt-4o-mini

- **Input:** $0.150 / 1M tokens
- **Output:** $0.600 / 1M tokens

### Estimación por Conversación

- Consulta típica: ~500 tokens input, ~300 tokens output
- Costo aproximado: $0.00025 USD por consulta
- ~4,000 consultas por $1 USD

### Optimizaciones

- Usa `gpt-4o-mini` en lugar de `gpt-4` (10x más barato)
- Limita historial de conversación a últimos 10 mensajes
- Max tokens: 1500 (suficiente para respuestas detalladas)
- Temperature: 0.7 (balance entre creatividad y precisión)

## Seguridad

### Autenticación
- ✅ Verifica usuario autenticado
- ✅ Verifica que sea administrador
- ✅ Usa Supabase Auth

### Datos
- ✅ Solo profesionales aprobados
- ✅ No expone datos sensibles
- ✅ Respuestas en formato JSON estructurado

### API Key
- ✅ Variable de entorno (no en código)
- ✅ No se expone al cliente
- ✅ Solo usada en servidor

## Mejoras Futuras

### Funcionalidades
- [ ] Exportar conversación
- [ ] Guardar conversaciones en base de datos
- [ ] Compartir recomendaciones con usuarios
- [ ] Sistema de feedback (👍👎)
- [ ] Métricas de uso

### Optimizaciones
- [ ] Cache de respuestas similares
- [ ] Embeddings para búsqueda semántica
- [ ] Fine-tuning con datos de la plataforma
- [ ] Multi-idioma (inglés, español)

### Integraciones
- [ ] Enviar recomendaciones por email
- [ ] Crear citas automáticamente
- [ ] Integración con calendario
- [ ] Notificaciones push

## Troubleshooting

### Error: "API key de OpenAI no configurada"
**Solución:** Verifica que `OPENAI_API_KEY` esté en `.env.local` y reinicia el servidor

### Error: "No autorizado"
**Solución:** Solo administradores pueden usar esta función. Verifica tu rol en la base de datos.

### Error: "Error al comunicarse con OpenAI"
**Soluciones:**
- Verifica que tu API key sea válida
- Verifica que tengas créditos disponibles en OpenAI
- Revisa tu límite de rate limit

### No aparecen profesionales
**Soluciones:**
- Verifica que haya profesionales con status "approved" en la base de datos
- Revisa la consola del navegador para errores
- Verifica la conexión a Supabase

## Soporte

Para preguntas o problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor
3. Verifica la configuración de variables de entorno
4. Contacta al equipo de desarrollo

## Recursos

- [Documentación OpenAI](https://platform.openai.com/docs)
- [Pricing OpenAI](https://openai.com/pricing)
- [Best Practices OpenAI](https://platform.openai.com/docs/guides/production-best-practices)
