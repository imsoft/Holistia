-- Ampliar el campo phone en professional_applications para soportar códigos de país
-- Esto es necesario para el nuevo componente PhoneInput que incluye códigos de país como "+52 55 1234 5678"

-- Cambiar phone de VARCHAR(20) a TEXT para máxima flexibilidad
ALTER TABLE public.professional_applications 
ALTER COLUMN phone TYPE TEXT;

-- Actualizar el comentario de la columna
COMMENT ON COLUMN professional_applications.phone IS 'Teléfono del profesional con código de país (ej: +52 55 1234 5678)';

-- Verificar que no hay datos que necesiten actualización
-- (Los números existentes seguirán funcionando, simplemente ahora soportan el formato con código de país)

