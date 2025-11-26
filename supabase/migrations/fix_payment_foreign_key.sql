-- Fix para cambiar el comportamiento de eliminación de la foreign key
--
-- Problema: La FK payments_professional_application_id_fkey tiene "ON DELETE SET NULL"
-- lo que viola el constraint payments_reference_check cuando se elimina una application
--
-- Solución: Cambiar a "ON DELETE CASCADE" para que los pagos se eliminen
-- automáticamente cuando se elimina la professional_application

-- 1. Eliminar la foreign key existente
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_professional_application_id_fkey;

-- 2. Crear la foreign key con CASCADE
ALTER TABLE payments
ADD CONSTRAINT payments_professional_application_id_fkey
  FOREIGN KEY (professional_application_id)
  REFERENCES professional_applications (id)
  ON DELETE CASCADE;

-- Comentario explicativo
COMMENT ON CONSTRAINT payments_professional_application_id_fkey ON payments IS
'When a professional application is deleted, all associated payments are also deleted';
