-- Script completo para aplicar todas las migraciones necesarias para Holistia
-- Ejecuta este script completo en el SQL Editor de Supabase

-- ========================================
-- 1. FUNCIÓN AUXILIAR (si no existe)
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 2. TABLA: professional_applications
-- ========================================
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

-- Índices
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

-- Trigger
DROP TRIGGER IF EXISTS update_professional_applications_updated_at ON public.professional_applications;
CREATE TRIGGER update_professional_applications_updated_at 
    BEFORE UPDATE ON public.professional_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.professional_applications ENABLE ROW LEVEL SECURITY;

-- Políticas (eliminar primero si existen)
DROP POLICY IF EXISTS "Users can view own professional application" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can insert own professional application" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can update own professional application" ON public.professional_applications;
DROP POLICY IF EXISTS "Users can delete own professional application" ON public.professional_applications;
DROP POLICY IF EXISTS "Patients can view approved professionals" ON public.professional_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.professional_applications;

CREATE POLICY "Users can view own professional application" ON public.professional_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own professional application" ON public.professional_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own professional application" ON public.professional_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own professional application" ON public.professional_applications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Patients can view approved professionals" ON public.professional_applications
    FOR SELECT USING (status = 'approved');

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

-- ========================================
-- 3. TABLA: appointments
-- ========================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  appointment_type VARCHAR(20) NOT NULL CHECK (appointment_type IN ('presencial', 'online')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  cost NUMERIC(10, 2) NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON public.appointments(created_at);

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. TABLA: user_favorites
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT user_favorites_user_id_professional_id_key UNIQUE (user_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_professional_id ON public.user_favorites(professional_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at);

-- ========================================
-- 5. TABLA: blog_posts
-- ========================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at);

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON public.blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. TABLA: payments
-- ========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  service_amount NUMERIC(10, 2) NOT NULL CHECK (service_amount > 0),
  commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  currency TEXT NOT NULL DEFAULT 'mxn',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled')),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  description TEXT,
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON public.payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_professional_id ON public.payments(professional_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id ON public.payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- ========================================
-- 7. TABLA: professional_services
-- ========================================
CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('session', 'program')),
  modality TEXT NOT NULL CHECK (modality IN ('presencial', 'online', 'both')),
  duration INTEGER NOT NULL,
  cost NUMERIC(10, 2) NOT NULL,
  isactive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT professional_services_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_professional_services_professional_id ON public.professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_user_id ON public.professional_services(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_isactive ON public.professional_services(isactive);
CREATE INDEX IF NOT EXISTS idx_professional_services_type ON public.professional_services(type);

DROP TRIGGER IF EXISTS update_professional_services_updated_at ON public.professional_services;
CREATE TRIGGER update_professional_services_updated_at 
    BEFORE UPDATE ON public.professional_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. TABLA: availability_blocks
-- ========================================
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  block_type TEXT NOT NULL CHECK (block_type IN ('full_day', 'time_range')),
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT availability_blocks_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_professional_id ON public.availability_blocks(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_user_id ON public.availability_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_dates ON public.availability_blocks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_type ON public.availability_blocks(block_type);

-- ========================================
-- MENSAJE FINAL
-- ========================================
SELECT 'Todas las tablas han sido creadas exitosamente' as resultado;

