-- Migración 231: visitas al perfil público del profesional (métricas para dashboard)
-- Una fila por vista; se usa para "Visitas a tu perfil este mes".

CREATE TABLE IF NOT EXISTS public.professional_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professional_profile_views_professional_id ON public.professional_profile_views(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_profile_views_viewed_at ON public.professional_profile_views(viewed_at DESC);

ALTER TABLE public.professional_profile_views ENABLE ROW LEVEL SECURITY;

-- Solo el profesional puede leer las vistas de su perfil (para métricas en dashboard)
CREATE POLICY "Professionals can view own profile view counts"
ON public.professional_profile_views
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.professional_applications pa
    WHERE pa.id = professional_profile_views.professional_id AND pa.user_id = auth.uid()
  )
);

-- Inserts se hacen desde API con service role (visitantes anónimos no están autenticados)
-- No se crea política de INSERT para authenticated; el backend usa service role.

COMMENT ON TABLE public.professional_profile_views IS 'Registro de visitas al perfil público del profesional para métricas del dashboard';
