-- Migration: Create email logs table
-- Description: Tabla para registrar emails enviados y evitar duplicados
-- Created: 2025-10-22

-- Crear tabla de logs de emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_email_logs_recipient_email ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_recipient_id ON public.email_logs(recipient_id);
CREATE INDEX idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);

-- Crear índice compuesto para la query principal del cron
CREATE INDEX idx_email_logs_recent_reminders 
ON public.email_logs(recipient_email, email_type, sent_at);

-- Habilitar RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Política: Solo los administradores pueden ver los logs
CREATE POLICY "Admins can view all email logs"
ON public.email_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política: El sistema puede insertar logs (para el cron job)
CREATE POLICY "System can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE public.email_logs IS 'Registro de todos los emails enviados por el sistema';
COMMENT ON COLUMN public.email_logs.recipient_email IS 'Email del destinatario';
COMMENT ON COLUMN public.email_logs.recipient_id IS 'ID del usuario destinatario';
COMMENT ON COLUMN public.email_logs.email_type IS 'Tipo de email: registration_renewal_30_days, registration_renewal_7_days, etc.';
COMMENT ON COLUMN public.email_logs.subject IS 'Asunto del email';
COMMENT ON COLUMN public.email_logs.sent_at IS 'Fecha y hora de envío';
COMMENT ON COLUMN public.email_logs.status IS 'Estado del envío: sent, failed, bounced';
COMMENT ON COLUMN public.email_logs.metadata IS 'Datos adicionales en formato JSON';

