-- Migration: Add foreign key constraint for professional_id in availability_blocks
-- Descripción: Agrega constraint de foreign key entre availability_blocks.professional_id y professional_applications.id

-- Primero, verificar y limpiar cualquier registro huérfano (sin professional_id válido)
-- Esto es importante antes de agregar la constraint
DELETE FROM availability_blocks
WHERE professional_id NOT IN (SELECT id FROM professional_applications);

-- Agregar la foreign key constraint
ALTER TABLE availability_blocks
ADD CONSTRAINT availability_blocks_professional_id_fkey
FOREIGN KEY (professional_id)
REFERENCES professional_applications (id)
ON DELETE CASCADE;

-- Comentario sobre el constraint
COMMENT ON CONSTRAINT availability_blocks_professional_id_fkey ON availability_blocks IS
'Foreign key constraint to ensure professional_id references a valid professional_application';
