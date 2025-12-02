-- Migración 125: Crear tabla para gestionar herramientas y servicios de la plataforma
-- Esta tabla permite a los administradores gestionar los servicios que usa Holistia
-- como Vercel, Supabase, Stripe, Resend, etc.

-- Crear tabla platform_tools
CREATE TABLE IF NOT EXISTS public.platform_tools (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- Vercel, Supabase, Stripe, Resend, etc.
    category VARCHAR(50) NOT NULL, -- hosting, database, payment, email, storage, analytics, etc.
    description TEXT,
    purpose TEXT NOT NULL, -- Para qué sirve esta herramienta
    monthly_cost NUMERIC(10, 2) DEFAULT 0,
    annual_cost NUMERIC(10, 2) DEFAULT 0,
    billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual', 'usage', 'free')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial', 'cancelled')),
    url TEXT, -- URL del servicio o dashboard
    account_email TEXT, -- Email asociado a la cuenta
    notes TEXT, -- Notas adicionales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT platform_tools_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_platform_tools_provider ON public.platform_tools(provider);
CREATE INDEX IF NOT EXISTS idx_platform_tools_category ON public.platform_tools(category);
CREATE INDEX IF NOT EXISTS idx_platform_tools_status ON public.platform_tools(status);
CREATE INDEX IF NOT EXISTS idx_platform_tools_created_at ON public.platform_tools(created_at);

-- Comentarios en la tabla y columnas
COMMENT ON TABLE public.platform_tools IS 'Herramientas y servicios utilizados por la plataforma Holistia';
COMMENT ON COLUMN public.platform_tools.name IS 'Nombre de la herramienta o servicio';
COMMENT ON COLUMN public.platform_tools.provider IS 'Proveedor del servicio (ej: Vercel, Supabase, Stripe)';
COMMENT ON COLUMN public.platform_tools.category IS 'Categoría del servicio (hosting, database, payment, email, etc.)';
COMMENT ON COLUMN public.platform_tools.description IS 'Descripción general del servicio';
COMMENT ON COLUMN public.platform_tools.purpose IS 'Para qué sirve esta herramienta en Holistia';
COMMENT ON COLUMN public.platform_tools.monthly_cost IS 'Costo mensual en MXN';
COMMENT ON COLUMN public.platform_tools.annual_cost IS 'Costo anual en MXN (si aplica)';
COMMENT ON COLUMN public.platform_tools.billing_period IS 'Período de facturación: monthly, annual, usage, free';
COMMENT ON COLUMN public.platform_tools.status IS 'Estado del servicio: active, inactive, trial, cancelled';
COMMENT ON COLUMN public.platform_tools.url IS 'URL del servicio o dashboard';
COMMENT ON COLUMN public.platform_tools.account_email IS 'Email asociado a la cuenta del servicio';
COMMENT ON COLUMN public.platform_tools.notes IS 'Notas adicionales sobre el servicio';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.platform_tools ENABLE ROW LEVEL SECURITY;

-- Política RLS: Solo administradores pueden ver y modificar
CREATE POLICY "Solo administradores pueden ver herramientas de plataforma"
    ON public.platform_tools
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.type = 'admin'
        )
    );

CREATE POLICY "Solo administradores pueden insertar herramientas de plataforma"
    ON public.platform_tools
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.type = 'admin'
        )
    );

CREATE POLICY "Solo administradores pueden actualizar herramientas de plataforma"
    ON public.platform_tools
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.type = 'admin'
        )
    );

CREATE POLICY "Solo administradores pueden eliminar herramientas de plataforma"
    ON public.platform_tools
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.type = 'admin'
        )
    );

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_platform_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_tools_updated_at_trigger
    BEFORE UPDATE ON public.platform_tools
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_tools_updated_at();

-- Insertar datos iniciales de ejemplo (opcional)
-- Estos son ejemplos de las herramientas que usa Holistia
INSERT INTO public.platform_tools (name, provider, category, description, purpose, monthly_cost, annual_cost, billing_period, status, url, account_email, notes) VALUES
('Vercel Hosting', 'Vercel', 'hosting', 'Plataforma de hosting y deployment para Next.js', 'Hosting y deployment automático de la aplicación web de Holistia', 0, 0, 'free', 'active', 'https://vercel.com', NULL, 'Plan gratuito con límites. Considerar upgrade si se superan los límites.'),
('Supabase Database', 'Supabase', 'database', 'Base de datos PostgreSQL como servicio con autenticación y storage', 'Base de datos principal, autenticación de usuarios, y almacenamiento de archivos', 0, 0, 'free', 'active', 'https://supabase.com', NULL, 'Plan gratuito. Monitorear uso de storage y requests.'),
('Stripe Payments', 'Stripe', 'payment', 'Procesamiento de pagos y Stripe Connect para profesionales', 'Procesamiento de pagos de citas, eventos y cuotas de inscripción. Stripe Connect para transferencias a profesionales', 0, 0, 'usage', 'active', 'https://stripe.com', NULL, 'Costo por transacción: 3.6% + $3 MXN + IVA. Sin costo mensual base.'),
('Resend Email', 'Resend', 'email', 'Servicio de envío de emails transaccionales', 'Envío de emails de confirmación, notificaciones y comunicaciones a usuarios', 0, 0, 'usage', 'active', 'https://resend.com', NULL, 'Plan gratuito con límite de 3,000 emails/mes. Considerar upgrade si se supera.'),
('Mapbox Maps', 'Mapbox', 'maps', 'Servicio de mapas y geolocalización', 'Visualización de mapas y ubicaciones de profesionales, restaurantes y comercios', 0, 0, 'usage', 'active', 'https://mapbox.com', NULL, 'Plan gratuito con límite de requests. Monitorear uso.')
ON CONFLICT DO NOTHING;

