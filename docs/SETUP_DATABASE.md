# Configuración de Base de Datos - Holistia

## Pasos para Configurar Supabase

Para que la aplicación funcione correctamente, necesitas ejecutar las siguientes migraciones en el **SQL Editor de Supabase**.

### 1️⃣ Crear la tabla de Aplicaciones Profesionales

Ve al **SQL Editor** en tu dashboard de Supabase y ejecuta este código:

```sql
-- 1. Otorgar permisos a la tabla auth.users
GRANT SELECT ON auth.users TO authenticated;

-- 2. Crear la tabla professional_applications
CREATE TABLE IF NOT EXISTS professional_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Información profesional
  profession TEXT NOT NULL,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  experience TEXT NOT NULL,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  
  -- Información de servicios
  services JSONB NOT NULL DEFAULT '[]',
  
  -- Información de ubicación
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'México',
  
  -- Información adicional
  biography TEXT,
  profile_photo TEXT,
  gallery TEXT[] NOT NULL DEFAULT '{}',
  
  -- Estado de la solicitud
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  
  -- Metadatos
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  -- Términos aceptados
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_professional_applications_user_id ON professional_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_applications_status ON professional_applications(status);
CREATE INDEX IF NOT EXISTS idx_professional_applications_submitted_at ON professional_applications(submitted_at);

-- 4. Habilitar RLS
ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS
CREATE POLICY "Users can view their own applications" ON professional_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" ON professional_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update pending applications" ON professional_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all applications" ON professional_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

CREATE POLICY "Admins can update all applications" ON professional_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- 6. Política para que todos puedan ver aplicaciones aprobadas
CREATE POLICY "Anyone can view approved applications" ON professional_applications
  FOR SELECT USING (status = 'approved');

-- 7. Función y trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_professional_applications_updated_at 
  BEFORE UPDATE ON professional_applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2️⃣ Crear la tabla de Favoritos

```sql
-- Crear la tabla user_favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, professional_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_professional_id ON user_favorites(professional_id);

-- Habilitar RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);
```

### 3️⃣ Crear la tabla de Citas (Appointments)

```sql
-- Crear la tabla appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_applications(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  appointment_type VARCHAR(20) NOT NULL CHECK (appointment_type IN ('presencial', 'online')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  cost DECIMAL(10,2) NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Trigger para updated_at
CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Patients can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Professionals can view their appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_applications 
      WHERE professional_applications.id = appointments.professional_id 
      AND professional_applications.user_id = auth.uid()
      AND professional_applications.status = 'approved'
    )
  );

CREATE POLICY "Professionals can update their appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM professional_applications 
      WHERE professional_applications.id = appointments.professional_id 
      AND professional_applications.user_id = auth.uid()
      AND professional_applications.status = 'approved'
    )
  );

CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );
```

### 4️⃣ Agregar políticas para perfiles de admin

```sql
-- Permitir que los administradores vean todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );

-- Permitir que los administradores actualicen todos los perfiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'type' = 'admin' OR auth.users.raw_user_meta_data->>'type' = 'Admin')
    )
  );
```

## 🎯 Orden de Ejecución

Ejecuta los scripts en este orden:

1. **Aplicaciones Profesionales** (Primero)
2. **Favoritos** (Segundo - depende de professional_applications)
3. **Citas** (Tercero - depende de professional_applications)
4. **Permisos de Admin** (Cuarto - opcional)

## 📝 Notas Importantes

- Ejecuta cada script **completo** en el SQL Editor
- Espera a que cada script termine antes de ejecutar el siguiente
- Si hay errores, léelos cuidadosamente y corrígelos antes de continuar
- Las políticas RLS garantizan la seguridad de los datos

## ✅ Verificación

Después de ejecutar las migraciones, verifica que las tablas existan:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('professional_applications', 'user_favorites', 'appointments');
```

Deberías ver las 3 tablas en el resultado.
