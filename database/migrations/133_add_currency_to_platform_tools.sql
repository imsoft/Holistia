-- Migración 133: Agregar soporte para múltiples monedas en platform_tools
-- Permite registrar costos en MXN (pesos mexicanos) o USD (dólares)

-- Agregar columna de moneda
ALTER TABLE public.platform_tools
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'mxn' CHECK (currency IN ('mxn', 'usd'));

-- Agregar campos para costos en dólares
ALTER TABLE public.platform_tools
ADD COLUMN IF NOT EXISTS monthly_cost_usd NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE public.platform_tools
ADD COLUMN IF NOT EXISTS annual_cost_usd NUMERIC(10, 2) DEFAULT 0;

-- Actualizar comentarios
COMMENT ON COLUMN public.platform_tools.currency IS 'Moneda de los costos: mxn (pesos mexicanos) o usd (dólares)';
COMMENT ON COLUMN public.platform_tools.monthly_cost IS 'Costo mensual en MXN';
COMMENT ON COLUMN public.platform_tools.annual_cost IS 'Costo anual en MXN (si aplica)';
COMMENT ON COLUMN public.platform_tools.monthly_cost_usd IS 'Costo mensual en USD';
COMMENT ON COLUMN public.platform_tools.annual_cost_usd IS 'Costo anual en USD (si aplica)';

-- Crear índice para búsquedas por moneda
CREATE INDEX IF NOT EXISTS idx_platform_tools_currency ON public.platform_tools(currency);
