# Guía Completa de SEO - Holistia

## 📋 Tabla de Contenidos
1. [Mejoras Implementadas](#mejoras-implementadas)
2. [Configuración Actual](#configuración-actual)
3. [Próximos Pasos Recomendados](#próximos-pasos-recomendados)
4. [Mejores Prácticas](#mejores-prácticas)
5. [Herramientas de Monitoreo](#herramientas-de-monitoreo)

---

## ✅ Mejoras Implementadas

### 1. **Metadatos Mejorados**
- ✅ Metadata base actualizado con palabras clave específicas de México
- ✅ Template de títulos dinámicos (`%s | Holistia`)
- ✅ Descripciones optimizadas para buscadores
- ✅ Open Graph mejorado para redes sociales
- ✅ Twitter Cards configurados
- ✅ Canonical URLs en todas las páginas

### 2. **Progressive Web App (PWA)**
- ✅ Archivo `manifest.json` creado
- ✅ Configuración de íconos para móviles
- ✅ Metadata de aplicación web

### 3. **Structured Data (Schema.org)**
- ✅ Organization Schema mejorado
- ✅ Person Schema para profesionales
- ✅ Event Schema para eventos/talleres
- ✅ BlogPosting Schema para artículos
- ✅ FAQ Schema (función disponible)
- ✅ LocalBusiness Schema (función disponible)
- ✅ Breadcrumb Schema (función disponible)

### 4. **Sitemap Optimizado**
- ✅ Sitemap XML dinámico
- ✅ URLs limpias (sin parámetros [id])
- ✅ Prioridades configuradas correctamente
- ✅ Frecuencias de actualización definidas

### 5. **Robots.txt**
- ✅ Configurado para bloquear rutas privadas
- ✅ Permite indexación de contenido público
- ✅ Referencia al sitemap

---

## 🎯 Configuración Actual

### URLs Amigables para SEO

#### ❌ URLs Antiguas (con [id])
```
/patient/[id]/explore/professional/juan-perez
/patient/[id]/explore/event/taller-mindfulness
```

#### ✅ URLs en Sitemap (limpias)
```
/profesionales/juan-perez
/eventos/taller-mindfulness
/blog/articulo-bienestar
```

**Nota:** Actualmente las rutas reales aún incluyen `[id]`, pero el sitemap ya usa URLs limpias. Se recomienda crear redirects o rutas públicas alternativas.

### Palabras Clave Principales

**Mercado Objetivo:** México

**Palabras Clave Primarias:**
- "salud mental México"
- "psicólogos certificados México"
- "terapeutas México"
- "consultas online salud mental"
- "bienestar integral"

**Palabras Clave Secundarias:**
- "coaching México"
- "nutrición México"
- "terapia psicológica"
- "mindfulness"
- "meditación"
- "eventos de bienestar"

### Metadatos por Tipo de Página

#### Página Principal
```
Title: Holistia - Plataforma de Salud Integral y Bienestar en México
Description: Conecta con expertos certificados en México. Consultas presenciales...
Keywords: salud mental México, bienestar integral, psicólogos certificados...
```

#### Perfil de Profesional
```
Title: [Nombre] - [Profesión] | Holistia
Description: Consulta con [Nombre], [Profesión] certificado en Holistia...
Schema: Person + EducationalOccupationalCredential
```

#### Artículo de Blog
```
Title: [Título del Post] | Blog Holistia
Description: [Excerpt o primeros 160 chars]
Schema: BlogPosting + Person (autor)
```

#### Evento
```
Title: [Nombre del Evento] - Evento de Bienestar | Holistia
Description: Únete a nuestro evento... Fecha: [fecha]
Schema: Event + Place + Organization
```

---

## 🚀 Próximos Pasos Recomendados

### 1. **Implementar Rutas Públicas** (Alta Prioridad)
Crear rutas alternativas sin autenticación para SEO:

```typescript
// src/app/(public)/profesionales/[slug]/page.tsx
// src/app/(public)/eventos/[slug]/page.tsx
```

Esto permitirá que Google indexe correctamente los perfiles y eventos.

### 2. **Crear Imagen Open Graph Optimizada** (Alta Prioridad)
- Crear imagen personalizada 1200x630px
- Ubicación: `/public/logos/holistia-og.png`
- Incluir logo, tagline y call-to-action visual
- Optimizar para redes sociales (Facebook, Twitter, LinkedIn)

### 3. **Implementar FAQs** (Media Prioridad)
Agregar sección de preguntas frecuentes en homepage:

```typescript
import { generateFAQSchema } from '@/lib/seo';

const faqs = [
  {
    question: "¿Qué tipo de profesionales encuentro en Holistia?",
    answer: "En Holistia encuentras psicólogos, terapeutas, coaches, nutriólogos..."
  },
  // más FAQs...
];

// En el componente
<StructuredData data={generateFAQSchema(faqs)} />
```

### 4. **Agregar Breadcrumbs** (Media Prioridad)
Implementar breadcrumbs en todas las páginas:

```typescript
import { generateBreadcrumbSchema } from '@/lib/seo';

const breadcrumbs = [
  { name: 'Inicio', url: 'https://holistia.io' },
  { name: 'Profesionales', url: 'https://holistia.io/profesionales' },
  { name: 'Juan Pérez', url: 'https://holistia.io/profesionales/juan-perez' }
];
```

### 5. **Optimizar Velocidad de Carga** (Alta Prioridad)
- Implementar lazy loading de imágenes
- Optimizar imágenes (WebP, sizes adecuados)
- Usar Next.js Image component en todas las imágenes
- Minimizar JavaScript no crítico

### 6. **Crear Contenido de Calidad** (Continuo)
- Blog con artículos de 1000+ palabras
- Actualizar blog semanalmente
- Crear guías completas sobre temas de salud mental
- Optimizar cada artículo para una palabra clave específica

### 7. **Link Building Interno** (Media Prioridad)
- Enlaces entre artículos de blog relacionados
- Enlaces de blog a perfiles de profesionales
- Enlaces de eventos a profesionales relacionados

### 8. **Configurar Google Search Console** (Alta Prioridad)
```bash
# Agregar al .env.local
NEXT_PUBLIC_GOOGLE_VERIFICATION=tu-codigo-de-verificacion
```

Luego verificar dominio en Google Search Console.

### 9. **Implementar Google Analytics 4** (Alta Prioridad)
Ya tienes el componente, solo falta el ID:

```bash
# Agregar al .env.local
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 10. **Crear Páginas de Aterrizaje Específicas** (Media Prioridad)
- `/psicologos-en-mexico`
- `/terapeutas-online`
- `/coaching-bienestar`
- `/nutriologos-certificados`

Cada una optimizada para su palabra clave específica.

---

## 📝 Mejores Prácticas

### Títulos (H1, H2, H3)
```typescript
// ✅ Bueno
<h1>Psicólogos Certificados en México - Holistia</h1>
<h2>¿Por qué elegir un psicólogo certificado?</h2>
<h3>Especialidades disponibles</h3>

// ❌ Malo
<h1>Bienvenido</h1>
<h2>Info</h2>
```

### Alt Text en Imágenes
```typescript
// ✅ Bueno
<Image
  src="/foto-psicologo.jpg"
  alt="Dra. María García - Psicóloga clínica especializada en ansiedad"
/>

// ❌ Malo
<Image src="/foto.jpg" alt="foto" />
```

### URLs Amigables
```typescript
// ✅ Bueno
/blog/como-manejar-la-ansiedad-en-el-trabajo
/profesionales/dra-maria-garcia-psicologa

// ❌ Malo
/blog/post-123
/prof/abc
```

### Meta Descripciones
- Longitud: 150-160 caracteres
- Incluir call-to-action
- Incluir palabra clave principal
- Único para cada página

```typescript
// ✅ Bueno (158 caracteres)
"Descubre técnicas efectivas para manejar la ansiedad en el trabajo. Consejos de expertos certificados en Holistia. ¡Lee más y agenda tu consulta!"

// ❌ Malo
"Lee este artículo"
```

---

## 🔧 Herramientas de Monitoreo

### Esenciales
1. **Google Search Console**
   - Monitorear indexación
   - Ver palabras clave que generan tráfico
   - Identificar errores de rastreo

2. **Google Analytics 4**
   - Tráfico orgánico
   - Comportamiento de usuarios
   - Conversiones

3. **Google PageSpeed Insights**
   - Core Web Vitals
   - Velocidad de carga
   - Recomendaciones de optimización

### Recomendadas
4. **Ahrefs** o **SEMrush**
   - Análisis de backlinks
   - Investigación de palabras clave
   - Análisis de competencia

5. **Schema Markup Validator**
   - https://validator.schema.org/
   - Validar structured data

6. **Mobile-Friendly Test**
   - https://search.google.com/test/mobile-friendly
   - Verificar responsividad

---

## 📊 KPIs a Monitorear

### Métricas de SEO
- **Posicionamiento orgánico**: Top 10 para palabras clave principales
- **Tráfico orgánico**: Crecimiento mensual >10%
- **Tasa de clics (CTR)**: >3% en resultados de búsqueda
- **Páginas indexadas**: 100% de páginas públicas

### Métricas Técnicas
- **Core Web Vitals**: Todos en verde
- **Tiempo de carga**: <3 segundos
- **Errores 404**: 0 en rutas importantes
- **HTTPS**: 100% de páginas seguras

### Métricas de Contenido
- **Bounce rate**: <50%
- **Tiempo en página**: >2 minutos en blog
- **Páginas por sesión**: >2
- **Backlinks**: Crecimiento mensual

---

## 🎨 Checklist de SEO por Página Nueva

Antes de publicar cualquier página nueva:

- [ ] Título único y descriptivo
- [ ] Meta description optimizada (150-160 chars)
- [ ] URL amigable y limpia
- [ ] Al menos 1 H1 (uno solo)
- [ ] Estructura de headings lógica (H2, H3)
- [ ] Imágenes con alt text descriptivo
- [ ] Enlaces internos relevantes
- [ ] Structured data apropiado
- [ ] Mobile responsive
- [ ] Velocidad de carga <3s
- [ ] Canonical URL configurada

---

## 📚 Recursos Adicionales

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Next.js SEO Best Practices](https://nextjs.org/learn/seo/introduction-to-seo)
- [Web.dev - SEO](https://web.dev/learn/seo/)

---

## 🎯 Objetivos de SEO para 2025

### Corto Plazo (1-3 meses)
- [ ] 1000+ páginas indexadas
- [ ] Top 10 en Google para "psicólogos online México"
- [ ] 50+ backlinks de calidad
- [ ] 500+ visitas orgánicas mensuales

### Medio Plazo (3-6 meses)
- [ ] Top 3 en 5 palabras clave principales
- [ ] 2000+ visitas orgánicas mensuales
- [ ] Domain Authority >30
- [ ] 100+ artículos de blog publicados

### Largo Plazo (6-12 meses)
- [ ] #1 en "plataforma salud mental México"
- [ ] 10,000+ visitas orgánicas mensuales
- [ ] 200+ backlinks de sitios relevantes
- [ ] Presencia en featured snippets

---

**Última actualización:** Octubre 2024
**Próxima revisión:** Enero 2025
