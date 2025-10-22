# 🌟 Sistema de Reseñas y Calificaciones - Instrucciones de Configuración

## ✅ Implementación Completada

Se ha implementado un sistema completo de reseñas y calificaciones para los profesionales de Holistia.

---

## 📋 Características Implementadas

### 1. **Base de Datos**
- ✅ Tabla `reviews` con campos:
  - `id` (UUID)
  - `professional_id` (referencia a `auth.users`)
  - `patient_id` (referencia a `auth.users`)
  - `rating` (INTEGER 1-5)
  - `comment` (TEXT opcional)
  - `created_at`, `updated_at`
  - **Restricción única**: Un paciente solo puede dejar una reseña por profesional

- ✅ Vista `professional_review_stats` para estadísticas:
  - `total_reviews`: Total de reseñas
  - `average_rating`: Promedio de calificación
  - `five_star_count`, `four_star_count`, etc.

- ✅ RLS (Row Level Security) configurado:
  - Todos pueden ver reseñas
  - Solo usuarios autenticados pueden crear
  - Solo el autor puede editar/eliminar su propia reseña

### 2. **Componentes UI**
- ✅ `StarRating`: Visualización de estrellas (1-5)
- ✅ `ReviewForm`: Formulario para crear/editar reseñas
- ✅ `ReviewsList`: Lista de reseñas con opciones de edición/eliminación

### 3. **Integraciones**
- ✅ Perfil de profesional muestra:
  - Promedio de estrellas en el header
  - Formulario para dejar reseña (si no eres el profesional)
  - Lista de todas las reseñas
  - Edición/eliminación de reseñas propias

- ✅ Cards de profesionales (página explore):
  - Muestra promedio de estrellas
  - Muestra cantidad total de reseñas

---

## 🚀 ACCIÓN REQUERIDA

### **Ejecutar Migración en Supabase**

**⚠️ IMPORTANTE:** Debes ejecutar la migración de base de datos para crear la tabla de reseñas.

#### **Pasos:**

1. Ve a tu Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto de Holistia
3. Ve a la sección **SQL Editor**
4. Abre el archivo de migración:
   ```
   database/migrations/56_create_reviews_table.sql
   ```
5. Copia TODO el contenido del archivo
6. Pégalo en el SQL Editor de Supabase
7. Click en **Run** para ejecutar la migración

#### **Verificación:**

Después de ejecutar la migración, verifica que se creó correctamente:

```sql
-- En el SQL Editor de Supabase, ejecuta:
SELECT * FROM reviews LIMIT 1;
SELECT * FROM professional_review_stats;
```

Si no da error, ¡la migración fue exitosa! 🎉

---

## 🧪 Cómo Probar el Sistema

### **Como Paciente:**

1. Ve al perfil de cualquier profesional
2. Verás un formulario "Deja tu reseña"
3. Selecciona estrellas (1-5)
4. Escribe un comentario opcional
5. Click en "Publicar reseña"
6. ✅ Tu reseña aparecerá en la lista

### **Editar/Eliminar tu Reseña:**

1. En tu reseña verás:
   - Insignia "Tu reseña"
   - Botones de editar ✏️ y eliminar 🗑️
2. Click en editar para modificar
3. Click en eliminar (con confirmación) para borrar

### **Ver Estadísticas:**

1. En las cards de profesionales (página explore):
   - Verás ⭐ 4.5 (12 reseñas)
2. En el perfil del profesional:
   - Header muestra promedio de estrellas
   - Scroll abajo para ver todas las reseñas

---

## 🔒 Seguridad

- ✅ Solo usuarios autenticados pueden dejar reseñas
- ✅ Un usuario solo puede dejar 1 reseña por profesional
- ✅ Solo puedes editar/eliminar tus propias reseñas
- ✅ Los profesionales NO pueden reseñarse a sí mismos
- ✅ Todas las reseñas son públicas (visibles para todos)

---

## 📊 Información Técnica

### **Flujo de Datos:**

```
Usuario → ReviewForm → Supabase (reviews table)
                     ↓
            professional_review_stats (view)
                     ↓
         Professional Cards / Profile Header
```

### **Archivos Creados:**

```
database/migrations/
  └── 56_create_reviews_table.sql

src/types/
  └── review.ts

src/components/reviews/
  ├── star-rating.tsx
  ├── review-form.tsx
  └── reviews-list.tsx

Modificados:
  - src/app/(dashboard)/(patient)/patient/[id]/explore/page.tsx
  - src/app/(dashboard)/(patient)/patient/[id]/explore/professional/[slug]/page.tsx
  - src/components/ui/professional-card.tsx
  - src/types/professional.ts
```

### **Dependencias Agregadas:**

```json
{
  "dependencies": {
    "date-fns": "^4.1.0"
  }
}
```

---

## 🎨 Personalización Futura

Si quieres personalizar el sistema:

### **Cambiar Límite de Caracteres del Comentario:**

```tsx
// src/components/reviews/review-form.tsx
<Textarea
  maxLength={1000}  // ← Cambiar aquí
/>
```

### **Cambiar Escala de Estrellas:**

```tsx
// src/components/reviews/star-rating.tsx
<StarRating 
  maxRating={5}  // ← Cambiar a 10 para escala de 10
/>
```

### **Deshabilitar Comentarios (solo estrellas):**

```tsx
// Ocultar el campo de comentario en review-form.tsx
// Líneas 76-86
```

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo cambiar mi reseña?**  
R: Sí, puedes editar tu reseña en cualquier momento.

**P: ¿Los profesionales pueden eliminar reseñas negativas?**  
R: No, solo el autor puede eliminar su propia reseña.

**P: ¿Qué pasa si dejo una reseña sin comentario?**  
R: Está bien, el comentario es opcional. Solo las estrellas son obligatorias.

**P: ¿Puedo dejar múltiples reseñas al mismo profesional?**  
R: No, solo puedes tener 1 reseña activa por profesional. Pero puedes editarla.

**P: ¿Las reseñas afectan el orden de los profesionales?**  
R: Actualmente no, pero puedes implementar ordenamiento por rating en el futuro.

---

## 🚀 Próximos Pasos Sugeridos

### **Futuras Mejoras:**

1. **Ordenar profesionales por rating:**
   ```tsx
   professionalsWithServices.sort((a, b) => 
     (b.average_rating || 0) - (a.average_rating || 0)
   );
   ```

2. **Filtro por rating mínimo:**
   ```tsx
   const minRating = 4;
   professionals.filter(p => (p.average_rating || 0) >= minRating)
   ```

3. **Respuestas de profesionales a reseñas:**
   - Agregar tabla `review_responses`
   - Mostrar respuesta del profesional bajo cada reseña

4. **Notificaciones:**
   - Email al profesional cuando recibe una nueva reseña
   - Usar el sistema de emails existente

5. **Moderación:**
   - Panel admin para revisar/eliminar reseñas inapropiadas
   - Flag de "report abuse"

---

## ✅ Checklist de Implementación

- [x] Crear tabla `reviews` en base de datos
- [x] Crear vista `professional_review_stats`
- [x] Configurar RLS y políticas de seguridad
- [x] Crear componente `StarRating`
- [x] Crear componente `ReviewForm`
- [x] Crear componente `ReviewsList`
- [x] Integrar en perfil de profesional
- [x] Mostrar rating en cards de profesionales
- [x] Actualizar tipos TypeScript
- [x] Instalar dependencia `date-fns`
- [x] Build exitoso
- [x] Push a GitHub
- [ ] **EJECUTAR MIGRACIÓN EN SUPABASE** ← ⚠️ PENDIENTE

---

¡El sistema está listo para usar una vez que ejecutes la migración! 🎉

