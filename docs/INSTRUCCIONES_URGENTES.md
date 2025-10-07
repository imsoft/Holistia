# 🚨 INSTRUCCIONES URGENTES - Configurar Dashboard de Admin

## Problema
El dashboard de administradores muestra todo en cero porque la tabla `professional_applications` **NO EXISTE** en tu base de datos.

## Solución Inmediata

### Paso 1: Aplicar la Migración Principal

1. Abre tu **Dashboard de Supabase**: https://supabase.com/dashboard
2. Selecciona tu proyecto **Holistia**
3. Ve a **SQL Editor** (en el menú izquierdo)
4. Copia y pega el siguiente SQL completo:

```sql
-- Migración completa para crear la tabla professional_applications
CREATE TABLE IF NOT EXISTS public.professional_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profession VARCHAR(100) NOT NULL,
    specializations TEXT[] NOT NULL DEFAULT '{}',
    experience VARCHAR(50) NOT NULL,
    certifications TEXT[] NOT NULL DEFAULT '{}',
    services JSONB NOT NULL DEFAULT '[]',
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'México',
    biography TEXT,
    profile_photo TEXT,
    gallery TEXT[] NOT NULL DEFAULT '{}',
    wellness_areas TEXT[] NOT NULL DEFAULT '{}',
    working_start_time TIME DEFAULT '09:00',
    working_end_time TIME DEFAULT '18:00',
    working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    privacy_accepted BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT professional_applications_pkey PRIMARY KEY (id),
    CONSTRAINT professional_applications_email_unique UNIQUE (email)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_professional_applications_user_id ON public.professional_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_applications_status ON public.professional_applications(status);
CREATE INDEX IF NOT EXISTS idx_professional_applications_profession ON public.professional_applications(profession);
CREATE INDEX IF NOT EXISTS idx_professional_applications_city ON public.professional_applications(city);
CREATE INDEX IF NOT EXISTS idx_professional_applications_wellness_areas ON public.professional_applications USING GIN (wellness_areas);
CREATE INDEX IF NOT EXISTS idx_professional_applications_working_hours ON public.professional_applications (working_start_time, working_end_time);
CREATE INDEX IF NOT EXISTS idx_professional_applications_working_days ON public.professional_applications USING GIN (working_days);
CREATE INDEX IF NOT EXISTS idx_professional_applications_submitted_at ON public.professional_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_professional_applications_reviewed_at ON public.professional_applications(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_professional_applications_reviewed_by ON public.professional_applications(reviewed_by);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger
DROP TRIGGER IF EXISTS update_professional_applications_updated_at ON public.professional_applications;
CREATE TRIGGER update_professional_applications_updated_at 
    BEFORE UPDATE ON public.professional_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.professional_applications ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Users can view own professional application" ON public.professional_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own professional application" ON public.professional_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own professional application" ON public.professional_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own professional application" ON public.professional_applications
    FOR DELETE USING (auth.uid() = user_id);

-- Política para ver profesionales aprobados
CREATE POLICY "Patients can view approved professionals" ON public.professional_applications
    FOR SELECT USING (status = 'approved');

-- Políticas para administradores
CREATE POLICY "Admins can view all applications" ON public.professional_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

CREATE POLICY "Admins can update all applications" ON public.professional_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );
```

5. Haz clic en **RUN** (o presiona Ctrl+Enter / Cmd+Enter)
6. Deberías ver el mensaje "Success. No rows returned"

### Paso 2: Configurar tu Usuario como Administrador

Ejecuta este SQL en el mismo SQL Editor (reemplaza con tu email):

```sql
-- Verificar tu usuario actual
SELECT id, email, raw_user_meta_data->>'type' as user_type
FROM auth.users
WHERE email = 'TU_EMAIL_AQUI@EJEMPLO.COM';
```

Si `user_type` es `NULL` o no es `'admin'`, ejecuta:

```sql
-- Reemplaza con tu email de administrador
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"type": "admin"}'::jsonb
WHERE email = 'TU_EMAIL_AQUI@EJEMPLO.COM';
```

### Paso 3: Insertar Datos de Prueba (Opcional)

Para que el dashboard muestre algo, puedes insertar una solicitud de prueba:

```sql
-- Primero obtén tu user_id
SELECT id, email FROM auth.users WHERE email = 'TU_EMAIL_AQUI@EJEMPLO.COM';

-- Luego inserta una solicitud de prueba (reemplaza USER_ID_AQUI con el id que obtuviste arriba)
INSERT INTO public.professional_applications (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    profession,
    specializations,
    experience,
    certifications,
    address,
    city,
    state,
    biography,
    wellness_areas,
    status,
    terms_accepted,
    privacy_accepted
) VALUES (
    'USER_ID_AQUI'::uuid,
    'Juan',
    'Pérez',
    'juan.perez@ejemplo.com',
    '+52 555 123 4567',
    'Psicólogo',
    ARRAY['Terapia Cognitivo-Conductual', 'Terapia de Pareja'],
    '5 años',
    ARRAY['Cédula Profesional 12345678', 'Maestría en Psicología Clínica'],
    'Av. Reforma 123',
    'Ciudad de México',
    'CDMX',
    'Psicólogo clínico con 5 años de experiencia en terapia individual y de pareja.',
    ARRAY['Salud Mental', 'Bienestar Emocional'],
    'pending',
    true,
    true
);

-- Insertar más solicitudes con diferentes estados
INSERT INTO public.professional_applications (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    profession,
    specializations,
    experience,
    certifications,
    address,
    city,
    state,
    status,
    terms_accepted,
    privacy_accepted
) VALUES 
(
    'USER_ID_AQUI'::uuid,
    'María',
    'González',
    'maria.gonzalez@ejemplo.com',
    '+52 555 234 5678',
    'Nutrióloga',
    ARRAY['Nutrición Deportiva', 'Nutrición Clínica'],
    '8 años',
    ARRAY['Cédula Profesional 87654321'],
    'Calle Principal 456',
    'Guadalajara',
    'Jalisco',
    'approved',
    true,
    true
),
(
    'USER_ID_AQUI'::uuid,
    'Carlos',
    'Rodríguez',
    'carlos.rodriguez@ejemplo.com',
    '+52 555 345 6789',
    'Terapeuta Físico',
    ARRAY['Rehabilitación', 'Lesiones Deportivas'],
    '3 años',
    ARRAY['Cédula Profesional 11223344'],
    'Boulevard Central 789',
    'Monterrey',
    'Nuevo León',
    'under_review',
    true,
    true
);
```

### Paso 4: Verificar que Todo Funciona

1. Cierra sesión en tu aplicación
2. Vuelve a iniciar sesión con tu cuenta de administrador
3. Ve al dashboard de administradores: `/admin/[tu-id]/dashboard`
4. Deberías ver:
   - Total de usuarios
   - Solicitudes pendientes
   - Profesionales activos
   - Las solicitudes recientes que insertaste

### Paso 5: Verificar en SQL (Para Debug)

Si aún no ves datos, ejecuta estos queries para verificar:

```sql
-- Ver todas las solicitudes
SELECT id, first_name, last_name, email, profession, status, created_at
FROM public.professional_applications
ORDER BY created_at DESC;

-- Contar solicitudes por estado
SELECT status, COUNT(*) as total
FROM public.professional_applications
GROUP BY status;

-- Verificar tu tipo de usuario
SELECT 
    id,
    email,
    raw_user_meta_data->>'type' as user_type,
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (auth.users.raw_user_meta_data->>'type' = 'admin')
    ) as has_admin_access
FROM auth.users
WHERE id = auth.uid();
```

## Archivos Relacionados

También puedes ejecutar directamente el archivo completo:
- `database/migrations/24_setup_complete_professional_applications.sql`

## ¿Necesitas Ayuda?

Si después de seguir estos pasos el dashboard sigue sin mostrar datos:

1. Verifica la consola del navegador (F12) en busca de errores
2. Revisa los logs de Supabase: Dashboard → Logs → Postgres Logs
3. Asegúrate de haber cerrado sesión y vuelto a iniciar sesión después de cambiar tu tipo de usuario

## Resumen Rápido

1. ✅ Ejecutar SQL de creación de tabla
2. ✅ Configurar tu usuario como admin
3. ✅ Insertar datos de prueba
4. ✅ Cerrar sesión y volver a iniciar sesión
5. ✅ Verificar dashboard

¡Después de esto, tu dashboard de administrador debería funcionar correctamente!

