-- Migration: Create cron sync logs table
-- Description: Tabla para registrar el historial de ejecuciones del cron de sincronización de Google Calendar
-- Created: 2026-02-10

-- ============================================================================
-- 1. Crear tabla cron_sync_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cron_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'error')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  total_profiles INTEGER NOT NULL DEFAULT 0,
  successful_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  results JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cron_sync_logs_started_at
ON public.cron_sync_logs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_cron_sync_logs_status
ON public.cron_sync_logs(status);

-- ============================================================================
-- 3. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.cron_sync_logs ENABLE ROW LEVEL SECURITY;

-- Política: Admins pueden ver todos los logs
CREATE POLICY "Admins can view all cron sync logs"
ON public.cron_sync_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
  )
);

-- Política: Sistema puede insertar logs (service role)
CREATE POLICY "System can insert cron sync logs"
ON public.cron_sync_logs
FOR INSERT
WITH CHECK (true);

-- Política: Sistema puede actualizar logs (service role)
CREATE POLICY "System can update cron sync logs"
ON public.cron_sync_logs
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 4. Comentarios
-- ============================================================================

COMMENT ON TABLE public.cron_sync_logs IS
'Historial de ejecuciones del cron de sincronización Google Calendar (cada 30 min)';

COMMENT ON COLUMN public.cron_sync_logs.status IS
'Estado de la ejecución: running (en proceso), completed (exitoso), error (falló)';

COMMENT ON COLUMN public.cron_sync_logs.results IS
'Array JSONB con resultados por profesional: [{userId, email, success, error?, created?, deleted?, diagnostics?}]';

COMMENT ON COLUMN public.cron_sync_logs.duration_ms IS
'Duración de la ejecución en milisegundos (finished_at - started_at)';
