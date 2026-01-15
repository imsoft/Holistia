-- ============================================================================
-- MIGRACIÓN 147: Agregar campos de cotización a company_leads
-- ============================================================================
-- Fecha: 2025-01-XX
-- Descripción: Agrega campos necesarios para el flujo completo de cotizaciones
--               - Fecha requerida del servicio
--               - Hora requerida del servicio
--               - Dirección/ubicación donde se realizará el servicio
-- ============================================================================

-- Agregar campos de fecha, hora y dirección
ALTER TABLE public.company_leads
  ADD COLUMN IF NOT EXISTS service_date DATE,
  ADD COLUMN IF NOT EXISTS service_time TIME,
  ADD COLUMN IF NOT EXISTS service_address TEXT,
  ADD COLUMN IF NOT EXISTS service_location TEXT; -- Para almacenar dirección completa o datos de contacto

-- Comentarios
COMMENT ON COLUMN public.company_leads.service_date IS 'Fecha en la que se requieren los servicios';
COMMENT ON COLUMN public.company_leads.service_time IS 'Hora en la que se deben presentar los profesionales';
COMMENT ON COLUMN public.company_leads.service_address IS 'Dirección donde se realizará el servicio';
COMMENT ON COLUMN public.company_leads.service_location IS 'Datos de contacto adicionales para la ubicación del servicio';

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_company_leads_service_date ON public.company_leads(service_date);
