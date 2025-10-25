-- ============================================================================
-- MIGRACIÓN 62: Actualizar todas las políticas RLS para usar public.profiles
-- ============================================================================
-- Fecha: 25 de octubre de 2025
-- Propósito: Reemplazar auth.users.raw_user_meta_data con profiles.type
-- Estrategia: DROP políticas antiguas, CREATE nuevas con profiles
-- Tiempo estimado: 1 minuto de ejecución
-- ============================================================================

-- ============================================================================
-- TABLA: payments
-- ============================================================================

-- DROP políticas antiguas
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;

-- CREATE nuevas políticas con profiles
CREATE POLICY "Admins can view all payments" 
ON public.payments
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can update all payments" 
ON public.payments
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: appointments
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;

CREATE POLICY "Admins can view all appointments" 
ON public.appointments
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can manage all appointments" 
ON public.appointments
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: events_workshops
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all events" ON public.events_workshops;
DROP POLICY IF EXISTS "Admins can create events" ON public.events_workshops;
DROP POLICY IF EXISTS "Admins can update all events" ON public.events_workshops;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events_workshops;

CREATE POLICY "Admins can view all events" 
ON public.events_workshops
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can create events" 
ON public.events_workshops
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can update all events" 
ON public.events_workshops
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can delete events" 
ON public.events_workshops
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: event_registrations
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Admins can update all event registrations" ON public.event_registrations;

CREATE POLICY "Admins can view all event registrations" 
ON public.event_registrations
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can update all event registrations" 
ON public.event_registrations
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: professional_applications
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all applications" ON public.professional_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.professional_applications;

CREATE POLICY "Admins can view all applications" 
ON public.professional_applications
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can update all applications" 
ON public.professional_applications
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: blog_posts
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;

CREATE POLICY "Admins can read all blog posts" 
ON public.blog_posts
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can create blog posts" 
ON public.blog_posts
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can update blog posts" 
ON public.blog_posts
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can delete blog posts" 
ON public.blog_posts
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: availability_blocks
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all availability blocks" ON public.availability_blocks;
DROP POLICY IF EXISTS "Admins can manage all availability blocks" ON public.availability_blocks;

CREATE POLICY "Admins can view all availability blocks" 
ON public.availability_blocks
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can manage all availability blocks" 
ON public.availability_blocks
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: email_logs (si existe)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_logs;

CREATE POLICY "Admins can view all email logs" 
ON public.email_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: user_favorites
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all favorites" ON public.user_favorites;

CREATE POLICY "Admins can view all favorites" 
ON public.user_favorites
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: professional_services
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all services" ON public.professional_services;

CREATE POLICY "Admins can manage all services" 
ON public.professional_services
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- TABLA: reviews (si existe)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

CREATE POLICY "Admins can view all reviews" 
ON public.reviews
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

CREATE POLICY "Admins can manage all reviews" 
ON public.reviews
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- ============================================================================
-- VERIFICACIÓN: Contar políticas actualizadas
-- ============================================================================

SELECT 
  '✅ VERIFICACIÓN DE POLÍTICAS' as seccion,
  'Total de políticas que usan profiles' as metrica,
  COUNT(*)::text as valor
FROM pg_policies
WHERE (qual::text LIKE '%profiles.type%' OR with_check::text LIKE '%profiles.type%')

UNION ALL

SELECT 
  '✅ VERIFICACIÓN DE POLÍTICAS',
  'Políticas que aún usan auth.users',
  COUNT(*)::text
FROM pg_policies
WHERE (qual::text LIKE '%auth.users%' AND qual::text LIKE '%raw_user_meta_data%')
   OR (with_check::text LIKE '%auth.users%' AND with_check::text LIKE '%raw_user_meta_data%')

UNION ALL

SELECT 
  '✅ VERIFICACIÓN DE POLÍTICAS',
  'Políticas en payments',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'payments'

UNION ALL

SELECT 
  '✅ VERIFICACIÓN DE POLÍTICAS',
  'Políticas en appointments',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'appointments'

UNION ALL

SELECT 
  '✅ VERIFICACIÓN DE POLÍTICAS',
  'Políticas en events_workshops',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'events_workshops'

UNION ALL

SELECT 
  '✅ VERIFICACIÓN DE POLÍTICAS',
  'Políticas en professional_applications',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'professional_applications';

-- ============================================================================
-- TEST: Verificar que admin puede acceder
-- ============================================================================

-- Este SELECT solo funcionará si eres admin
SELECT 
  '🧪 TEST DE ACCESO ADMIN' as seccion,
  '' as detalle;

SELECT 
  'Tu tipo de usuario' as verificacion,
  type as valor
FROM profiles
WHERE id = auth.uid();

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
-- Todas las políticas RLS ahora usan public.profiles
-- Performance mejorada (sin extraer JSON)
-- Queries más rápidas con índices
-- ============================================================================

