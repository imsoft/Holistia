# 🗄️ Configuración de Base de Datos - Holistia

Guía completa para configurar y gestionar la base de datos de Holistia en Supabase.

## 🎯 Inicio Rápido

### 1. Acceder a Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto **Holistia**
4. Click en **SQL Editor** en el menú lateral

### 2. Ejecutar Migraciones
Consulta [`../database/migrations/README.md`](../database/migrations/README.md) para el orden completo de migraciones.

## 👤 Configurar Usuario Administrador

### Verificar tu Usuario
```sql
SELECT id, email, raw_user_meta_data->>'type' as user_type
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';
```

### Convertir en Administrador
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'tu-email@ejemplo.com';
```

### Verificar Permisos
```sql
SELECT 
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
  (SELECT raw_user_meta_data->>'type' FROM auth.users WHERE id = auth.uid()) as user_type,
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'type' = 'admin'
  ) as is_admin;
```

**Importante**: Cierra sesión y vuelve a iniciar para que los cambios surtan efecto.

## 🔐 Políticas RLS (Row Level Security)

Todas las tablas tienen RLS habilitado con las siguientes reglas:

### Usuarios Normales
- ✅ Ver sus propios datos
- ✅ Crear sus propios registros
- ✅ Actualizar sus propios datos pendientes
- ✅ Ver profesionales aprobados
- ✅ Ver eventos activos

### Profesionales
- ✅ Todo lo de usuarios normales +
- ✅ Gestionar sus servicios
- ✅ Ver sus citas
- ✅ Gestionar su disponibilidad
- ✅ Crear eventos/talleres

### Administradores
- ✅ Ver todos los datos
- ✅ Aprobar/rechazar solicitudes
- ✅ Gestionar eventos
- ✅ Moderar contenido del blog
- ✅ Ver registros de pagos

## 📊 Tablas Principales

### `professional_applications`
Solicitudes de profesionales para unirse a la plataforma.

**Campos clave:**
- `status`: pending, under_review, approved, rejected
- `reviewed_by`: ID del admin que revisó
- `review_notes`: Notas de la revisión
- `instagram`: Usuario de Instagram (solo visible para admins)

### `professional_services`
Servicios ofrecidos por cada profesional.

**Campos clave:**
- `type`: session, program
- `modality`: presencial, online, both
- `cost`: Precio del servicio
- `program_duration_value` y `program_duration_unit`: Para programas

### `appointments`
Citas entre pacientes y profesionales.

**Campos clave:**
- `status`: pending, confirmed, cancelled, completed
- `appointment_date` y `appointment_time`: Fecha y hora
- `service_id`: Servicio reservado

### `events_workshops`
Eventos y talleres organizados.

**Campos clave:**
- `session_type`: unique, recurring
- `participant_level`: todos, principiante, medio, avanzado
- `gallery_images`: Array de URLs de imágenes
- `image_position`: Posición de recorte en cards

### `event_registrations`
Registros de usuarios a eventos.

**Campos clave:**
- `confirmation_code`: Código de 6 dígitos
- `payment_status`: pending, confirmed, failed

### `blog_posts`
Posts del blog.

**Campos clave:**
- `status`: draft, published
- `featured_image`: Imagen principal
- `author_id`: Profesional o admin autor

## 🪣 Storage Buckets

### `professional-gallery`
- **Uso**: Fotos de perfil y galería de profesionales
- **Permisos**: Lectura pública, escritura autenticada
- **Carpetas**: `{user_id}/`

### `event-gallery`
- **Uso**: Imágenes de eventos y talleres
- **Permisos**: Lectura pública, escritura autenticada
- **Carpetas**: `{event_id}/` o `temp-{id}/`

### `blog-images`
- **Uso**: Imágenes del blog
- **Permisos**: Lectura pública, escritura autenticada
- **Carpetas**: `{post_id}/`

## 🔧 Solución de Problemas Comunes

### Error: "permission denied for table users"
**Causa**: El rol authenticated no tiene permisos en auth.users
**Solución**:
```sql
GRANT SELECT ON auth.users TO authenticated;
```

### Error: "new row violates row-level security policy"
**Causa**: Políticas RLS bloqueando la inserción
**Solución**: Verificar que el usuario tenga el tipo correcto en metadata

### Error: "relation does not exist"
**Causa**: Tabla no creada
**Solución**: Ejecutar la migración correspondiente

### Dashboard de Admin vacío
**Causa**: Usuario no configurado como admin
**Solución**: Ejecutar UPDATE para agregar type='admin' en metadata

### Storage 403 Forbidden
**Causa**: Bucket no existe o políticas incorrectas
**Solución**: Ejecutar migraciones de storage (07, 10, 29, 30)

## 🛠️ Comandos Útiles

### Ver Todas las Tablas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Ver Estructura de una Tabla
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'professional_applications'
ORDER BY ordinal_position;
```

### Ver Políticas RLS
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'professional_applications';
```

### Ver Buckets de Storage
```sql
SELECT id, name, public, created_at
FROM storage.buckets
ORDER BY created_at DESC;
```

### Contar Registros por Tabla
```sql
SELECT 
  'professional_applications' as tabla,
  COUNT(*) as total
FROM professional_applications
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'events_workshops', COUNT(*) FROM events_workshops
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts;
```

## 🔄 Datos de Prueba

### Insertar Profesional de Prueba
```sql
-- Primero obtén tu user_id
SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';

-- Insertar profesional de prueba
INSERT INTO professional_applications (
  user_id, first_name, last_name, email, phone,
  profession, specializations, experience, certifications,
  address, city, state, status,
  terms_accepted, privacy_accepted
) VALUES (
  'TU_USER_ID_AQUI'::uuid,
  'María', 'González', 'maria@ejemplo.com', '+52 555 1234567',
  'Psicóloga Clínica', 
  ARRAY['Terapia Cognitivo-Conductual', 'Ansiedad'],
  '5 años',
  ARRAY['Cédula Profesional 12345678'],
  'Av. Reforma 123', 'CDMX', 'Ciudad de México', 'approved',
  true, true
);
```

## 📚 Referencias

- **Migraciones Completas**: [`../database/migrations/README.md`](../database/migrations/README.md)
- **Estructura General**: [`../database/README.md`](../database/README.md)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)

## ⚠️ Importante

1. **Siempre haz backup** antes de ejecutar migraciones en producción
2. **Ejecuta migraciones en orden** según la numeración
3. **Verifica el resultado** después de cada migración
4. **No modifiques auth.users directamente** - usa las funciones de Supabase Auth
5. **Cierra y vuelve a iniciar sesión** después de cambiar metadata de usuario

---

**Última actualización**: Octubre 2025
