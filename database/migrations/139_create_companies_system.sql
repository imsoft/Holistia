-- Migración 139: Crear sistema completo de empresas corporativas
-- Este sistema incluye:
-- 1. Tabla de empresas (companies)
-- 2. Relación empresa-profesional (company_professionals)
-- 3. Tabla de solicitudes/leads (company_leads) - ya existe pero la recreamos por si acaso

-- ============================================================================
-- 1. TABLA DE EMPRESAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    company_size TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    city TEXT,
    website TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Políticas para companies
DROP POLICY IF EXISTS "Admins can do everything on companies" ON public.companies;
DROP POLICY IF EXISTS "Companies can view their own data" ON public.companies;

-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on companies"
ON public.companies
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Las empresas pueden ver su propia información (para futuras integraciones)
CREATE POLICY "Companies can view their own data"
ON public.companies
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'company'
        AND profiles.email = companies.contact_email
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_contact_email ON public.companies(contact_email);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;

CREATE TRIGGER set_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comentarios
COMMENT ON TABLE public.companies IS 'Empresas registradas en el programa corporativo';
COMMENT ON COLUMN public.companies.name IS 'Nombre de la empresa';
COMMENT ON COLUMN public.companies.description IS 'Descripción de la empresa';
COMMENT ON COLUMN public.companies.industry IS 'Industria o sector';
COMMENT ON COLUMN public.companies.company_size IS 'Tamaño de la empresa (número de empleados)';
COMMENT ON COLUMN public.companies.contact_name IS 'Nombre del contacto principal';
COMMENT ON COLUMN public.companies.contact_email IS 'Email del contacto principal';
COMMENT ON COLUMN public.companies.contact_phone IS 'Teléfono del contacto';
COMMENT ON COLUMN public.companies.status IS 'Estado: pending (pendiente), active (activa), inactive (inactiva)';

-- ============================================================================
-- 2. TABLA DE RELACIÓN EMPRESA-PROFESIONAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professional_applications(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(company_id, professional_id)
);

-- Habilitar RLS
ALTER TABLE public.company_professionals ENABLE ROW LEVEL SECURITY;

-- Políticas para company_professionals
DROP POLICY IF EXISTS "Admins can do everything on company_professionals" ON public.company_professionals;
DROP POLICY IF EXISTS "Companies can view their professionals" ON public.company_professionals;
DROP POLICY IF EXISTS "Professionals can view their companies" ON public.company_professionals;

-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on company_professionals"
ON public.company_professionals
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Las empresas pueden ver sus profesionales asignados
CREATE POLICY "Companies can view their professionals"
ON public.company_professionals
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        INNER JOIN public.profiles p ON p.email = c.contact_email
        WHERE c.id = company_professionals.company_id
        AND p.id = auth.uid()
        AND p.type = 'company'
    )
);

-- Los profesionales pueden ver las empresas a las que están asignados
CREATE POLICY "Professionals can view their companies"
ON public.company_professionals
FOR SELECT
TO authenticated
USING (
    professional_id IN (
        SELECT id FROM public.professional_applications
        WHERE user_id = auth.uid()
    )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_company_professionals_company_id ON public.company_professionals(company_id);
CREATE INDEX IF NOT EXISTS idx_company_professionals_professional_id ON public.company_professionals(professional_id);
CREATE INDEX IF NOT EXISTS idx_company_professionals_assigned_at ON public.company_professionals(assigned_at DESC);

-- Comentarios
COMMENT ON TABLE public.company_professionals IS 'Relación entre empresas y profesionales asignados';
COMMENT ON COLUMN public.company_professionals.company_id IS 'ID de la empresa';
COMMENT ON COLUMN public.company_professionals.professional_id IS 'ID del profesional asignado';
COMMENT ON COLUMN public.company_professionals.assigned_at IS 'Fecha de asignación';
COMMENT ON COLUMN public.company_professionals.assigned_by IS 'Usuario que realizó la asignación';

-- ============================================================================
-- 3. TABLA DE SOLICITUDES/LEADS DE EMPRESAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    industry TEXT,
    company_size TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    city TEXT,
    additional_info TEXT,
    requested_services JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'converted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT requested_services_is_array CHECK (jsonb_typeof(requested_services) = 'array')
);

-- Habilitar RLS
ALTER TABLE public.company_leads ENABLE ROW LEVEL SECURITY;

-- Políticas para company_leads
DROP POLICY IF EXISTS "Admins can do everything on company_leads" ON public.company_leads;
DROP POLICY IF EXISTS "Anyone can create company leads" ON public.company_leads;
DROP POLICY IF EXISTS "Public can create company leads" ON public.company_leads;

-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on company_leads"
ON public.company_leads
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.type = 'admin'
    )
);

-- Cualquiera puede crear un lead (para el formulario público)
CREATE POLICY "Public can create company leads"
ON public.company_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_company_leads_status ON public.company_leads(status);
CREATE INDEX IF NOT EXISTS idx_company_leads_created_at ON public.company_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_leads_contact_email ON public.company_leads(contact_email);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_company_leads_updated_at ON public.company_leads;

CREATE TRIGGER set_company_leads_updated_at
    BEFORE UPDATE ON public.company_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comentarios
COMMENT ON TABLE public.company_leads IS 'Solicitudes de empresas desde la landing page';
COMMENT ON COLUMN public.company_leads.company_name IS 'Nombre de la empresa solicitante';
COMMENT ON COLUMN public.company_leads.requested_services IS 'Array de IDs de servicios holísticos solicitados';
COMMENT ON COLUMN public.company_leads.status IS 'Estado: pending (pendiente), contacted (contactado), quoted (cotizado), converted (convertido a cliente)';
