# 🏛️ Centros Holísticos - Configuración Completa

## 📋 Resumen de Implementación

Este documento detalla todos los campos y funcionalidades implementadas para los centros holísticos en Holistia.

## ✅ Campos Implementados

### Campos Básicos (Ya existían)
- ✅ **Nombre** (`name`) - Campo obligatorio
- ✅ **Descripción** (`description`)
- ✅ **Horario** (`opening_hours`) - Formato JSON estructurado
- ✅ **Ubicación/Dirección** (`address`)
- ✅ **Email** (`email`)
- ✅ **Website** (`website`)
- ✅ **Instagram** (`instagram`)

### Campos Nuevos Agregados
- ✅ **Ciudad** (`city`) - Campo separado de la dirección
- ✅ **Teléfono** (`phone`) - Solo visible para admins
- ✅ **Licencias** - Tabla separada con soporte para PDFs e imágenes
- ✅ **Servicios del centro** - Tabla completa con características
- ✅ **Profesionales del centro** - Relación muchos a muchos

## 🗄️ Estructura de Base de Datos

### 1. Campo Ciudad
**Migración:** `108_add_city_to_holistic_centers.sql`

```sql
ALTER TABLE public.holistic_centers
ADD COLUMN IF NOT EXISTS city TEXT;
```

### 2. Licencias del Centro
**Migración:** `109_create_holistic_center_licenses.sql`

**Tabla:** `holistic_center_licenses`
- `id` - UUID
- `center_id` - UUID (FK a holistic_centers)
- `file_url` - TEXT (URL en storage)
- `file_name` - TEXT
- `file_type` - TEXT (pdf, image/jpeg, etc.)
- `file_size` - INTEGER
- `uploaded_by` - UUID (admin que subió)

**Permisos:** Solo admins pueden ver/gestionar licencias

**Storage:** `holistic-centers/<center-id>/licenses/<license-id>.<ext>`

### 3. Servicios del Centro
**Migración:** `110_create_holistic_center_services.sql`

**Tabla:** `holistic_center_services`
- `id` - UUID
- `center_id` - UUID (FK)
- `name` - TEXT
- `description` - TEXT
- `price` - DECIMAL(10,2)
- `service_type` - TEXT ('individual' | 'group')
- `max_capacity` - INTEGER (solo para grupales)
- `is_active` - BOOLEAN

**Tabla:** `holistic_center_service_images`
- `id` - UUID
- `service_id` - UUID (FK)
- `image_url` - TEXT
- `image_order` - INTEGER (0-3, máximo 4 imágenes)

**Storage:** `holistic-centers/<center-id>/services/<service-name>/image-<0-3>.jpg`

### 4. Profesionales del Centro
**Migración:** `111_create_center_professionals_relation.sql`

**Tabla:** `holistic_center_professionals`
- `id` - UUID
- `center_id` - UUID (FK a holistic_centers)
- `professional_id` - UUID (FK a professional_applications)
- `is_active` - BOOLEAN

**Vista útil:** `center_professionals_view` - Combina información de centros y profesionales

### 5. Actualización del Bucket
**Migración:** `112_update_holistic_centers_bucket_for_licenses.sql`

- Tipos MIME permitidos: JPEG, PNG, WebP, **PDF**
- Límite de tamaño: 10MB (aumentado de 5MB)

### 6. Privacidad del Teléfono
**Migración:** `113_add_phone_privacy_to_holistic_centers.sql`

**Función:** `get_holistic_centers()`
- Si es admin: devuelve todos los datos incluyendo teléfono
- Si no es admin: devuelve datos sin teléfono (phone = NULL)

**Uso en código:**
```typescript
// En lugar de:
supabase.from('holistic_centers').select('*')

// Usar:
supabase.rpc('get_holistic_centers')
```

## 📁 Estructura de Storage

```
holistic-centers/
└── <center-id>/
    ├── imagen.jpg                          # Imagen principal
    ├── licenses/
    │   ├── <license-id-1>.pdf             # Licencia 1
    │   └── <license-id-2>.jpg             # Licencia 2
    └── services/
        ├── yoga-terapeutico/
        │   ├── image-0.jpg                # Imagen 1 del servicio
        │   ├── image-1.jpg                # Imagen 2 del servicio
        │   ├── image-2.jpg                # Imagen 3 del servicio
        │   └── image-3.jpg                # Imagen 4 del servicio
        └── meditacion-guiada/
            └── image-0.jpg
```

## 🎨 Cambios en la UI

### Página de Administración
**Archivo:** `src/app/(dashboard)/(admin)/admin/[id]/holistic-centers/page.tsx`

#### Cambios realizados:
1. ✅ Agregado campo `city` al interface `HolisticCenter`
2. ✅ Agregado campo `city` al interface `FormData`
3. ✅ Agregado campo ciudad en el formulario de creación/edición
4. ✅ Agregado campo ciudad en las tarjetas de centros
5. ✅ Agregado campo ciudad en la vista de detalles
6. ✅ Agregado campo ciudad en el filtro de búsqueda
7. ✅ Actualizado orden de campos: Ciudad se muestra antes de dirección

## 📝 Pasos para Aplicar

### 1. Ejecutar Migraciones en Supabase

Ir al SQL Editor de Supabase y ejecutar en orden:

1. `database/migrations/108_add_city_to_holistic_centers.sql`
2. `database/migrations/109_create_holistic_center_licenses.sql`
3. `database/migrations/110_create_holistic_center_services.sql`
4. `database/migrations/111_create_center_professionals_relation.sql`
5. `database/migrations/112_update_holistic_centers_bucket_for_licenses.sql`
6. `database/migrations/113_add_phone_privacy_to_holistic_centers.sql`

### 2. Verificar Migraciones

```sql
-- Verificar que el campo ciudad existe
SELECT city FROM public.holistic_centers LIMIT 1;

-- Verificar tablas nuevas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'holistic_center_licenses',
  'holistic_center_services',
  'holistic_center_service_images',
  'holistic_center_professionals'
);

-- Verificar función de privacidad
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_holistic_centers';
```

### 3. UI ya está actualizada

Los cambios en la UI ya están aplicados en:
- `src/app/(dashboard)/(admin)/admin/[id]/holistic-centers/page.tsx`

## 🚀 Próximos Pasos

### Funcionalidades Pendientes de Implementar

#### 1. UI para Gestión de Licencias
- Componente para subir PDFs/imágenes
- Lista de licencias del centro
- Botón para eliminar licencias

#### 2. UI para Gestión de Servicios
- Formulario para crear/editar servicios
- Selector de tipo (individual/grupal)
- Uploader para hasta 4 imágenes por servicio
- Lista de servicios del centro

#### 3. UI para Asignar Profesionales
- Selector de profesionales registrados
- Lista de profesionales del centro
- Botón para agregar/quitar profesionales

## 🔍 Consultas Útiles

### Ver centros con sus servicios
```sql
SELECT
  hc.name as centro,
  hcs.name as servicio,
  hcs.service_type,
  hcs.price
FROM holistic_centers hc
LEFT JOIN holistic_center_services hcs ON hcs.center_id = hc.id
WHERE hc.is_active = true
ORDER BY hc.name, hcs.name;
```

### Ver centros con sus profesionales
```sql
SELECT * FROM center_professionals_view;

-- La vista devuelve:
-- - center_name: Nombre del centro
-- - center_city: Ciudad del centro
-- - professional_name: Nombre completo del profesional (first_name + last_name)
-- - professional_profession: Profesión del profesional
-- - professional_wellness_areas: Áreas de bienestar del profesional
```

### Ver licencias de un centro
```sql
SELECT
  hc.name as centro,
  hcl.file_name,
  hcl.file_type,
  hcl.created_at
FROM holistic_centers hc
LEFT JOIN holistic_center_licenses hcl ON hcl.center_id = hc.id
WHERE hc.id = 'center-id-here';
```

## 📊 Diagrama de Relaciones

```
holistic_centers
    │
    ├──< holistic_center_licenses (1:N)
    │
    ├──< holistic_center_services (1:N)
    │       │
    │       └──< holistic_center_service_images (1:N, max 4)
    │
    └──< holistic_center_professionals (N:M)
            │
            └──> professional_applications
```

## ⚠️ Notas Importantes

1. **Teléfono privado**: Recuerda usar `supabase.rpc('get_holistic_centers')` en lugar de `.from('holistic_centers')` para respetar la privacidad del teléfono.

2. **Límites de imágenes**: Los servicios solo pueden tener máximo 4 imágenes (image_order: 0-3).

3. **Tipos de servicio**: Solo se permiten 'individual' o 'group'. Los servicios grupales DEBEN tener max_capacity > 0.

4. **Bucket actualizado**: El bucket ahora soporta PDFs hasta 10MB.

5. **RLS**: Todas las tablas tienen Row Level Security habilitado. Solo admins pueden gestionar centros holísticos completamente.

## 🎯 Estado del Proyecto

### ✅ Completado
- [x] Análisis de campos faltantes
- [x] Migraciones de base de datos
- [x] Actualización del bucket de storage
- [x] Privacidad del teléfono
- [x] UI básica con campo ciudad

### 🚧 Pendiente
- [ ] UI para gestión de licencias
- [ ] UI para gestión de servicios
- [ ] UI para asignar profesionales
- [ ] Página pública para mostrar centros
- [ ] Filtros por ciudad en búsqueda
- [ ] Galería de servicios del centro
